/**
 * P3-D — Thin orchestration for reader cockpit flows: start / turn / fetch / pause / resume / end.
 * Delegates to existing session, transcript, identity, reply generation, and payload services.
 */

import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import { CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION } from "@/lib/domain/conversational-turn-input";
import type { ConversationalTurnInput } from "@/lib/domain/conversational-turn-input";
import type { Prisma } from "@prisma/client";

import type { NarrativeSource } from "@/lib/domain/narrative-source";
import type {
  DegradedInteractionPolicy,
  DegradedInteractionUnavailableReason,
} from "@/lib/domain/degraded-interaction-policy";
import type {
  ReaderCockpitPayload,
  ReaderCockpitPresentationPlaybackPreference,
} from "@/lib/domain/reader-cockpit-payload";
import type { VoicePresentationPayload } from "@/lib/domain/voice-presentation";
import { prisma } from "@/lib/prisma";
import { bumpSessionInteractionCount } from "@/lib/services/character-conversation-session-service";
import { appendCharacterTurn, appendReaderTurn, listSessionTurnsOrdered } from "@/lib/services/character-conversation-turn-service";
import {
  buildConservativeBoundedCharacterResponse,
  generateCharacterReplyFromTurn,
} from "@/lib/services/character-reply-generation-service";
import {
  resolveDegradedInteractionPolicy,
  type RuntimeEnvironment,
} from "@/lib/services/degraded-interaction-policy-service";
import {
  estimateConversationTurnCostUnits,
  estimateTextTurnCostUnits,
} from "@/lib/services/interaction-cost-estimation-service";
import {
  debitReaderInteractionUnits,
  getReaderInteractionBalanceUnavailableReason,
  getOrCreateReaderBalance,
  isReaderInteractionBalanceUnavailableError,
} from "@/lib/services/reader-interaction-balance-service";
import {
  getOrCreateReaderEntitlement,
  toDegradedInteractionTier,
} from "@/lib/services/reader-entitlement-service";
import {
  buildReaderCockpitPayload,
  invalidateReaderCockpitPayloadCache,
  loadNarrativeSourcesForScene,
} from "@/lib/services/reader-cockpit-payload-service";
import { refreshConversationalIdentitySnapshot } from "@/lib/services/conversational-identity-refresh-service";
import {
  endInteractivePauseSession,
  pauseNarrativeForConversation,
  resumeNarrativeAfterConversation,
  startInteractivePauseSession,
  type InteractiveOrchestrationState,
} from "@/lib/services/interaction-session-orchestration-service";
import { buildAndPersistSessionMemorySummary } from "@/lib/services/session-memory-compression-service";
import { getCharacterVoiceProfile } from "@/lib/services/character-voice-profile-service";
import { buildVoicePresentationPayload } from "@/lib/voice/voice-presentation-service";
import { evaluateProviderCostGovernance } from "@/lib/services/provider-cost-governance-service";
import { executeWithProviderResilience } from "@/lib/services/provider-resilience-service";
import {
  canUsePremiumFeatures,
  resolveReaderRole,
} from "@/lib/services/permission-service";
import { assertSessionMetadataPatchWriteBoundary } from "@/lib/services/interaction-truth-firewall-service";
import {
  recordSessionEnded,
  recordSessionStarted,
  recordTurnSubmitted,
  recordVoiceUsage,
} from "@/lib/services/engagement-analytics-service";
import {
  evaluateReaderModeration,
  type ModerationEvaluation,
} from "@/lib/services/moderation-service";

const TURN_REPLY_RESERVE_UNITS = 3000;
const FALLBACK_ONLY_MAX_FREE_TURNS = 1;
const LIMITED_FREE_TURNS_DEFAULT = 2;
export type DegradedFallbackCause =
  | "balance_unavailable"
  | "provider_resilience"
  | "moderation"
  | "cost_governance";

export type CockpitErrorCode =
  | "validation_error"
  | "not_found"
  | "session_invalid"
  | "guardrail_failure"
  | "insufficient_balance"
  | "balance_unavailable"
  | "internal_error";

export type CockpitApiError = {
  code: CockpitErrorCode;
  message: string;
  details?: unknown;
};

export type CockpitApiResult<T> = { ok: true; data: T } | { ok: false; error: CockpitApiError };

export function cockpitSuccess<T>(data: T): CockpitApiResult<T> {
  return { ok: true, data };
}

export function cockpitFailure(code: CockpitErrorCode, message: string, details?: unknown): CockpitApiResult<never> {
  return { ok: false, error: { code, message, details } };
}

function mapThrownError(e: unknown): CockpitApiResult<never> {
  const msg = e instanceof Error ? e.message : String(e);
  if (/not found|Scene not found|Person\/character not found/i.test(msg)) {
    return cockpitFailure("not_found", msg);
  }
  if (
    /requires ACTIVE|does not match|not bound to this character|Session not found or not bound|no interactiveOrchestration/i.test(
      msg
    )
  ) {
    return cockpitFailure("session_invalid", msg);
  }
  if (/Insufficient units/i.test(msg)) {
    return cockpitFailure("insufficient_balance", msg);
  }
  if (
    isReaderInteractionBalanceUnavailableError(e) ||
    /reader-interaction-balance:unavailable/i.test(msg)
  ) {
    return cockpitFailure(
      "balance_unavailable",
      "Interaction balance is unavailable; token gating is enforced and this action is blocked.",
      { reason: getReaderInteractionBalanceUnavailableReason(e) ?? "unknown_runtime_unavailable" }
    );
  }
  return cockpitFailure("internal_error", msg);
}

function runtimeEnvironment(): RuntimeEnvironment {
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}

function maxFreeTurnsForPolicy(policy: DegradedInteractionPolicy): number {
  if (policy === "allow_system_fallback_only") return FALLBACK_ONLY_MAX_FREE_TURNS;
  if (policy === "allow_limited_free_turns") {
    const raw = process.env.DEGRADED_INTERACTION_FREE_TURNS?.trim();
    const parsed = raw ? parseInt(raw, 10) : LIMITED_FREE_TURNS_DEFAULT;
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : LIMITED_FREE_TURNS_DEFAULT;
  }
  return 0;
}

export function shouldDebitInteractionUnitsForDegradedPolicy(
  policy: DegradedInteractionPolicy | null
): boolean {
  return policy == null;
}

export function mapFallbackCauseToUnavailableReason(
  cause: DegradedFallbackCause
): DegradedInteractionUnavailableReason {
  if (cause === "provider_resilience") {
    return "provider_failure";
  }
  if (cause === "balance_unavailable") {
    return "unknown_runtime_unavailable";
  }
  return "unknown_runtime_unavailable";
}

export function isDegradedFreeTurnLimitReached(input: {
  policy: DegradedInteractionPolicy;
  usedFreeTurns: number;
}): boolean {
  const allowedFreeTurns = maxFreeTurnsForPolicy(input.policy);
  return input.usedFreeTurns >= allowedFreeTurns;
}

export function shouldTerminateSessionFromModeration(
  moderation: ModerationEvaluation
): boolean {
  return moderation.shouldEndSession || moderation.action === "end_session";
}

function readDegradedFreeTurnCount(metadataJson: Prisma.JsonValue | null): number {
  const root = parseSessionRootMetadata(metadataJson);
  const degraded = root.degradedInteraction;
  if (!degraded || typeof degraded !== "object" || Array.isArray(degraded)) return 0;
  const count = (degraded as Record<string, unknown>).freeTurnCount;
  return typeof count === "number" && Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
}

async function incrementDegradedFreeTurnCount(params: {
  sessionId: string;
  currentPolicy: DegradedInteractionPolicy;
  unavailableReason: DegradedInteractionUnavailableReason;
  fallbackCause: DegradedFallbackCause;
}): Promise<number> {
  const row = await prisma.characterConversationSession.findUniqueOrThrow({
    where: { id: params.sessionId },
    select: { metadataJson: true },
  });
  const root = parseSessionRootMetadata(row.metadataJson);
  const prior = readDegradedFreeTurnCount(row.metadataJson);
  const degradedPatch = {
    ...(root.degradedInteraction &&
    typeof root.degradedInteraction === "object" &&
    !Array.isArray(root.degradedInteraction)
      ? (root.degradedInteraction as Record<string, unknown>)
      : {}),
    currentPolicy: params.currentPolicy,
    unavailableReason: params.unavailableReason,
    lastFallbackCause: params.fallbackCause,
    freeTurnCount: prior + 1,
    lastFreeTurnAtIso: new Date().toISOString(),
    lastTurnUsedDegradedFallback: true,
  };
  assertSessionMetadataPatchWriteBoundary({
    source: "reader_interaction_memory",
    patch: { degradedInteraction: degradedPatch },
  });
  root.degradedInteraction = degradedPatch;
  await prisma.characterConversationSession.update({
    where: { id: params.sessionId },
    data: { metadataJson: root as Prisma.InputJsonValue, lastInteractionAt: new Date() },
  });
  return prior + 1;
}

async function persistDegradedInteractionState(params: {
  sessionId: string;
  currentPolicy: DegradedInteractionPolicy;
  unavailableReason: DegradedInteractionUnavailableReason;
  lastTurnUsedDegradedFallback: boolean;
  fallbackCause: DegradedFallbackCause;
}): Promise<void> {
  const row = await prisma.characterConversationSession.findUniqueOrThrow({
    where: { id: params.sessionId },
    select: { metadataJson: true },
  });
  const root = parseSessionRootMetadata(row.metadataJson);
  const prior = readDegradedFreeTurnCount(row.metadataJson);
  const degradedPatch = {
    ...(root.degradedInteraction &&
    typeof root.degradedInteraction === "object" &&
    !Array.isArray(root.degradedInteraction)
      ? (root.degradedInteraction as Record<string, unknown>)
      : {}),
    currentPolicy: params.currentPolicy,
    unavailableReason: params.unavailableReason,
    lastFallbackCause: params.fallbackCause,
    freeTurnCount: prior,
    lastTurnUsedDegradedFallback: params.lastTurnUsedDegradedFallback,
  };
  assertSessionMetadataPatchWriteBoundary({
    source: "reader_interaction_memory",
    patch: { degradedInteraction: degradedPatch },
  });
  root.degradedInteraction = degradedPatch;
  await prisma.characterConversationSession.update({
    where: { id: params.sessionId },
    data: { metadataJson: root as Prisma.InputJsonValue, lastInteractionAt: new Date() },
  });
}

export type CockpitStartFromSceneData = {
  sessionId: string;
  cockpit: ReaderCockpitPayload;
  narrativeResumeToken: string;
};

/**
 * Validates scene + character rows, then opens an interactive pause session (orchestration metadata included).
 */
export async function cockpitStartConversationFromScene(params: {
  readerId: string;
  characterId: string;
  sceneId: string;
}): Promise<CockpitApiResult<CockpitStartFromSceneData>> {
  const readerId = params.readerId.trim();
  const characterId = params.characterId.trim();
  const sceneId = params.sceneId.trim();
  if (!readerId || !characterId || !sceneId) {
    return cockpitFailure("validation_error", "readerId, characterId, and sceneId are required.");
  }

  try {
    const [scene, person] = await Promise.all([
      prisma.scene.findUnique({ where: { id: sceneId }, select: { id: true } }),
      prisma.person.findUnique({ where: { id: characterId }, select: { id: true } }),
    ]);
    if (!scene) {
      return cockpitFailure("not_found", "Scene not found.", { resource: "scene", sceneId });
    }
    if (!person) {
      return cockpitFailure("not_found", "Character not found.", { resource: "character", characterId });
    }

    const ctx = await startInteractivePauseSession({
      characterId,
      readerId,
      sceneId,
      narrativeAnchor: { sceneId, label: "cockpit_start" },
    });
    const token = ctx.orchestration.narrativeResumeToken;
    invalidateReaderCockpitPayloadCache({
      readerId,
      characterId,
      sessionId: ctx.session.id,
    });
    const cockpit = await buildReaderCockpitPayload({
      readerId,
      characterId,
      sessionId: ctx.session.id,
    });
    recordSessionStarted({
      sessionId: ctx.session.id,
      readerId,
      characterId,
    });
    return cockpitSuccess({
      sessionId: ctx.session.id,
      cockpit,
      narrativeResumeToken: token,
    });
  } catch (e) {
    return mapThrownError(e);
  }
}

function summarizeNarrativeSourcesForGenerationContext(sources: NarrativeSource[]): string {
  if (sources.length === 0) return "";
  const lines: string[] = [];
  for (const s of sources.slice(0, 5)) {
    const excerpt = s.content.replace(/\s+/g, " ").trim().slice(0, 280);
    lines.push(`- [${s.truthMode}] ${s.title}: ${excerpt}`);
  }
  return lines.join("\n");
}

/**
 * Extract latest registry-valid character response from ordered transcript rows (tests may import).
 */
export function extractLatestCharacterResponseFromTurns(turns: CharacterConversationTurn[]): CharacterResponse | null {
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i];
    if (t.speakerType !== "character") continue;
    try {
      return validateRegisteredContractPayload(
        "characterResponse",
        t.payloadJson as CharacterResponse,
        "read"
      );
    } catch {
      continue;
    }
  }
  return null;
}

export type CockpitSubmitTurnData = {
  cockpit: ReaderCockpitPayload;
  latestCharacterResponse: CharacterResponse | null;
  voicePresentationPayload: VoicePresentationPayload | null;
  generation: {
    usedLlm: boolean;
    usedPolicyFallback: boolean;
    finalPolicyPass: boolean;
    modelOutputViolatedPolicy: boolean;
  };
};

/**
 * Append reader turn, generate bounded reply, append character turn, bump session interaction count.
 */
export async function cockpitSubmitReaderTurn(params: {
  readerId: string;
  characterId: string;
  sessionId: string;
  readerText: string;
  /** Injected for tests (same shape as {@link generateCharacterReplyFromTurn} deps). */
  replyDeps?: Parameters<typeof generateCharacterReplyFromTurn>[1];
}): Promise<CockpitApiResult<CockpitSubmitTurnData>> {
  const readerId = params.readerId.trim();
  const characterId = params.characterId.trim();
  const sessionId = params.sessionId.trim();
  const readerText = params.readerText.trim();

  if (!readerId || !characterId || !sessionId) {
    return cockpitFailure("validation_error", "readerId, characterId, and sessionId are required.");
  }
  if (!readerText) {
    return cockpitFailure("validation_error", "readerText must not be empty.");
  }

  const session = await prisma.characterConversationSession.findFirst({
    where: { id: sessionId, characterId, readerId },
  });
  if (!session) {
    return cockpitFailure("not_found", "Session not found for this reader/character pair.");
  }
  if (session.status !== "ACTIVE") {
    return cockpitFailure("session_invalid", `Session is not active (status=${session.status}).`);
  }

  const turnInput: ConversationalTurnInput = {
    contractVersion: CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
    characterId,
    readerId,
    sceneId: session.sceneId,
    sessionId,
    inputMode: "text",
    readerText,
  };

  let validatedTurn: ConversationalTurnInput;
  try {
    validatedTurn = validateRegisteredContractPayload("conversationalTurnInput", turnInput, "write");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Turn validation failed.";
    return cockpitFailure("validation_error", msg);
  }
  const moderation = evaluateReaderModeration(validatedTurn.readerText);
  if (shouldTerminateSessionFromModeration(moderation)) {
    await endInteractivePauseSession({
      sessionId,
      characterId,
      readerId,
    });
    recordSessionEnded({ sessionId, dropOffPoint: "mid_conversation" });
    return cockpitFailure("session_invalid", "Session ended due to safety policy.", {
      moderation: moderation.reason,
      moderationAction: moderation.action,
    });
  }
  if (moderation.action === "block") {
    return cockpitFailure(
      "validation_error",
      "The character refuses this line of inquiry and remains in-world.",
      { moderation: moderation.reason }
    );
  }

  let balanceProbe: { availableUnits: number };
  let degradedPolicy: DegradedInteractionPolicy | null = null;
  let degradedUnavailableReason: DegradedInteractionUnavailableReason | null = null;
  const entitlement = await getOrCreateReaderEntitlement(readerId);
  const degradedTier = toDegradedInteractionTier(entitlement.planType);
  try {
    balanceProbe = await getOrCreateReaderBalance(readerId);
  } catch (error) {
    if (isReaderInteractionBalanceUnavailableError(error)) {
      const unavailableReason =
        getReaderInteractionBalanceUnavailableReason(error) ?? "unknown_runtime_unavailable";
      degradedUnavailableReason = unavailableReason;
      degradedPolicy = resolveDegradedInteractionPolicy({
        unavailableReason,
        readerEntitlement: degradedTier,
        environment: runtimeEnvironment(),
      });
      if (degradedPolicy === "blocked_all" || degradedPolicy === "allow_read_only") {
        await persistDegradedInteractionState({
          sessionId,
          currentPolicy: degradedPolicy,
          unavailableReason,
          lastTurnUsedDegradedFallback: false,
          fallbackCause: "balance_unavailable",
        });
        return cockpitFailure(
          "balance_unavailable",
          "Interaction balance is unavailable; this session is currently read-only.",
          {
            reason: unavailableReason,
            interactionDegradedPolicy: degradedPolicy,
          }
        );
      }
      balanceProbe = { availableUnits: 0 };
    } else {
      throw error;
    }
  }
  const reserveUnits = estimateTextTurnCostUnits(validatedTurn.readerText) + TURN_REPLY_RESERVE_UNITS;
  if (degradedPolicy == null && balanceProbe.availableUnits < reserveUnits) {
    return cockpitFailure("insufficient_balance", "Not enough interaction units for this turn.", {
      availableUnits: balanceProbe.availableUnits,
      reserveUnits,
    });
  }
  const providerCostDecision = evaluateProviderCostGovernance({
    readerId,
    sessionId,
    projectedTextCostUnits: reserveUnits,
    projectedVoiceCostUnits: 0,
  });
  const forceProviderFallback =
    degradedPolicy == null && !providerCostDecision.allowed && providerCostDecision.degradeToFallback;
  const forceModerationFallback = moderation.action === "degrade" || moderation.action === "warn";

  try {
    await appendReaderTurn(sessionId, validatedTurn);
    recordTurnSubmitted({ sessionId });

    const narrativeSourcesForScene = await loadNarrativeSourcesForScene(session.sceneId);
    const snapshot = await refreshConversationalIdentitySnapshot({
      characterId,
      readerId,
      sceneId: session.sceneId,
      narrativeSourcesForScene,
      sessionId,
    });

    let gen: Awaited<ReturnType<typeof generateCharacterReplyFromTurn>>;
    if (degradedPolicy == null && !forceProviderFallback && !forceModerationFallback) {
      const sceneLinked = summarizeNarrativeSourcesForGenerationContext(narrativeSourcesForScene);
      const resilientGeneration = await executeWithProviderResilience({
        kind: "llm",
        operation: () =>
          generateCharacterReplyFromTurn(
            {
              snapshot,
              turnInput: validatedTurn,
              sceneLinkedSourceContext: sceneLinked || null,
              responseIntent: "unspecified",
            },
            params.replyDeps
          ),
        fallback: async () => ({
          response: buildConservativeBoundedCharacterResponse(snapshot),
          usedLlm: false,
          usedPolicyFallback: true,
          finalPolicyPass: true,
          modelOutputViolatedPolicy: false,
        }),
      });
      gen = resilientGeneration.value;
      if (resilientGeneration.usedFallback) {
        degradedPolicy = "allow_system_fallback_only";
        degradedUnavailableReason = "provider_failure";
      }
    } else {
      if (forceProviderFallback && degradedPolicy == null) {
        degradedPolicy = "allow_system_fallback_only";
        degradedUnavailableReason = mapFallbackCauseToUnavailableReason("cost_governance");
      }
      if (forceModerationFallback && degradedPolicy == null) {
        degradedPolicy = "allow_system_fallback_only";
        degradedUnavailableReason = mapFallbackCauseToUnavailableReason("moderation");
      }
      gen = {
        response: buildConservativeBoundedCharacterResponse(snapshot),
        usedLlm: false,
        usedPolicyFallback: true,
        finalPolicyPass: true,
        modelOutputViolatedPolicy: false,
      };
    }

    if (degradedPolicy != null) {
      const usedFreeTurns = readDegradedFreeTurnCount(session.metadataJson);
      if (isDegradedFreeTurnLimitReached({ policy: degradedPolicy, usedFreeTurns })) {
        return cockpitFailure(
          "balance_unavailable",
          "Degraded interaction limit reached; this session is now read-only until balance is restored.",
          {
            interactionDegradedPolicy: degradedPolicy,
            usedFreeTurns,
            allowedFreeTurns: maxFreeTurnsForPolicy(degradedPolicy),
            degradedUnavailableReason,
          }
        );
      }
    }

    if (!gen.finalPolicyPass) {
      return cockpitFailure(
        "guardrail_failure",
        "Character reply could not be brought into bounded policy compliance (even after fallback).",
        { generation: gen }
      );
    }

    await appendCharacterTurn(sessionId, gen.response);

    const costUnits = estimateConversationTurnCostUnits({
      readerText: validatedTurn.readerText,
      characterSpokenResponse: gen.response.spokenResponse,
      characterInternalThought: gen.response.internalThought,
      includeVoiceRender: false,
    }).totalCostUnits;

    if (shouldDebitInteractionUnitsForDegradedPolicy(degradedPolicy)) {
      await debitReaderInteractionUnits({
        readerId,
        sessionId,
        entryType: "text_turn",
        estimatedCostUnits: costUnits,
        unitCount: costUnits,
        metadataJson: { kind: "cockpit_reader_character_turn", sessionId },
      });
    } else {
      if (degradedPolicy != null && degradedUnavailableReason != null) {
        const fallbackCause: DegradedFallbackCause =
          forceModerationFallback
            ? "moderation"
            : forceProviderFallback
              ? "cost_governance"
              : degradedUnavailableReason === "provider_failure"
                ? "provider_resilience"
                : "balance_unavailable";
        await incrementDegradedFreeTurnCount({
          sessionId,
          currentPolicy: degradedPolicy,
          unavailableReason: degradedUnavailableReason,
          fallbackCause,
        });
      }
    }

    await bumpSessionInteractionCount(sessionId, 1);
    await buildAndPersistSessionMemorySummary(sessionId);
    invalidateReaderCockpitPayloadCache({ readerId, characterId, sessionId });

    const cockpit = await buildReaderCockpitPayload({
      readerId,
      characterId,
      sessionId,
    });
    const turns = await listSessionTurnsOrdered(sessionId);
    const latestCharacterResponse = extractLatestCharacterResponseFromTurns(turns);
    const voiceProfile = await getCharacterVoiceProfile(characterId);
    const voicePresentationPayload = latestCharacterResponse
      ? degradedPolicy == null
        ? buildVoicePresentationPayload(latestCharacterResponse, {
            emotionalContinuity: cockpit.emotionalContinuity ?? null,
            presentationMode: cockpit.voicePresentationReadiness.characterPresentationMode,
            voiceProfile,
          })
        : null
      : null;
    if (voicePresentationPayload) {
      recordVoiceUsage({ sessionId });
    }

    return cockpitSuccess({
      cockpit,
      latestCharacterResponse,
      voicePresentationPayload,
      generation: {
        usedLlm: gen.usedLlm,
        usedPolicyFallback: gen.usedPolicyFallback,
        finalPolicyPass: gen.finalPolicyPass,
        modelOutputViolatedPolicy: gen.modelOutputViolatedPolicy ?? false,
      },
    });
  } catch (e) {
    return mapThrownError(e);
  }
}

export async function cockpitFetchLatestState(params: {
  readerId: string;
  characterId: string;
  sessionId?: string | null;
}): Promise<
  CockpitApiResult<{
    cockpit: ReaderCockpitPayload;
    latestCharacterResponse: CharacterResponse | null;
    voicePresentationPayload: VoicePresentationPayload | null;
  }>
> {
  const readerId = params.readerId.trim();
  const characterId = params.characterId.trim();
  if (!readerId || !characterId) {
    return cockpitFailure("validation_error", "readerId and characterId are required.");
  }
  try {
    const cockpit = await buildReaderCockpitPayload({
      readerId,
      characterId,
      sessionId: params.sessionId ?? undefined,
    });
    const sid = cockpit.activeSession?.sessionId;
    let latestCharacterResponse: CharacterResponse | null = null;
    if (sid) {
      const turns = await listSessionTurnsOrdered(sid);
      latestCharacterResponse = extractLatestCharacterResponseFromTurns(turns);
    }
    const voiceProfile = await getCharacterVoiceProfile(characterId);
    const voicePresentationPayload = latestCharacterResponse
      ? buildVoicePresentationPayload(latestCharacterResponse, {
          emotionalContinuity: cockpit.emotionalContinuity ?? null,
          presentationMode: cockpit.voicePresentationReadiness.characterPresentationMode,
          voiceProfile,
        })
      : null;
    return cockpitSuccess({ cockpit, latestCharacterResponse, voicePresentationPayload });
  } catch (e) {
    return mapThrownError(e);
  }
}

export type CockpitPauseResumeData = {
  cockpit: ReaderCockpitPayload;
  orchestration: InteractiveOrchestrationState;
};

export async function cockpitPauseConversation(params: {
  sessionId: string;
  characterId: string;
  readerId: string;
}): Promise<CockpitApiResult<CockpitPauseResumeData>> {
  try {
    const ctx = await pauseNarrativeForConversation(params);
    invalidateReaderCockpitPayloadCache({
      readerId: params.readerId.trim(),
      characterId: params.characterId.trim(),
      sessionId: ctx.session.id,
    });
    const cockpit = await buildReaderCockpitPayload({
      readerId: params.readerId.trim(),
      characterId: params.characterId.trim(),
      sessionId: ctx.session.id,
    });
    return cockpitSuccess({ cockpit, orchestration: ctx.orchestration });
  } catch (e) {
    return mapThrownError(e);
  }
}

export async function cockpitResumeConversation(params: {
  sessionId: string;
  characterId: string;
  readerId: string;
}): Promise<CockpitApiResult<CockpitPauseResumeData>> {
  try {
    const ctx = await resumeNarrativeAfterConversation(params);
    invalidateReaderCockpitPayloadCache({
      readerId: params.readerId.trim(),
      characterId: params.characterId.trim(),
      sessionId: ctx.session.id,
    });
    const cockpit = await buildReaderCockpitPayload({
      readerId: params.readerId.trim(),
      characterId: params.characterId.trim(),
      sessionId: ctx.session.id,
    });
    return cockpitSuccess({ cockpit, orchestration: ctx.orchestration });
  } catch (e) {
    return mapThrownError(e);
  }
}

export async function cockpitEndConversation(params: {
  sessionId: string;
  characterId: string;
  readerId: string;
}): Promise<CockpitApiResult<{ cockpit: ReaderCockpitPayload }>> {
  try {
    await endInteractivePauseSession(params);
    recordSessionEnded({
      sessionId: params.sessionId.trim(),
      dropOffPoint: "completed_session",
    });
    invalidateReaderCockpitPayloadCache({
      readerId: params.readerId.trim(),
      characterId: params.characterId.trim(),
      sessionId: params.sessionId.trim(),
    });
    const cockpit = await buildReaderCockpitPayload({
      readerId: params.readerId.trim(),
      characterId: params.characterId.trim(),
      sessionId: params.sessionId.trim(),
    });
    return cockpitSuccess({ cockpit });
  } catch (e) {
    return mapThrownError(e);
  }
}

function parseSessionRootMetadata(json: Prisma.JsonValue | null): Record<string, unknown> {
  if (json != null && typeof json === "object" && !Array.isArray(json)) {
    return { ...(json as Record<string, unknown>) };
  }
  return {};
}

/** P3-G — Presentation-only preference stored on session metadata (does not alter cognition). */
export async function cockpitSetPresentationPlaybackPreference(params: {
  readerId: string;
  characterId: string;
  sessionId: string;
  preference: ReaderCockpitPresentationPlaybackPreference;
}): Promise<CockpitApiResult<{ cockpit: ReaderCockpitPayload }>> {
  const readerId = params.readerId.trim();
  const characterId = params.characterId.trim();
  const sessionId = params.sessionId.trim();
  if (!readerId || !characterId || !sessionId) {
    return cockpitFailure("validation_error", "readerId, characterId, and sessionId are required.");
  }
  if (params.preference === "native_when_available") {
    const role = await resolveReaderRole(readerId);
    if (!canUsePremiumFeatures(role)) {
      return cockpitFailure(
        "validation_error",
        "Native playback preference requires a premium-enabled role."
      );
    }
  }
  try {
    const row = await prisma.characterConversationSession.findFirst({
      where: { id: sessionId, characterId, readerId },
    });
    if (!row) {
      return cockpitFailure("not_found", "Session not found for this reader/character pair.");
    }
    const root = parseSessionRootMetadata(row.metadataJson);
    assertSessionMetadataPatchWriteBoundary({
      source: "reader_interaction_memory",
      patch: { presentationPlaybackPreference: params.preference },
    });
    root.presentationPlaybackPreference = params.preference;
    await prisma.characterConversationSession.update({
      where: { id: row.id },
      data: { metadataJson: root as Prisma.InputJsonValue, lastInteractionAt: new Date() },
    });
    invalidateReaderCockpitPayloadCache({ readerId, characterId, sessionId });
    const cockpit = await buildReaderCockpitPayload({ readerId, characterId, sessionId });
    return cockpitSuccess({ cockpit });
  } catch (e) {
    return mapThrownError(e);
  }
}
