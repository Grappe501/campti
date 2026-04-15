/**
 * P3-A — Assemble {@link ReaderCockpitPayload} for a reader ↔ character cockpit (read model only).
 */

import type { Prisma } from "@prisma/client";

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import type { NarrativeSource } from "@/lib/domain/narrative-source";
import {
  READER_COCKPIT_PAYLOAD_CONTRACT_VERSION,
  type ReaderCockpitConversationalIdentitySummary,
  type ReaderCockpitCostEstimateSummary,
  type ReaderCockpitPayload,
  type ReaderCockpitReaderContextPreferenceSummary,
  type ReaderCockpitPresentationPlaybackPreference,
  type ReaderCockpitSceneInteractionContext,
  type ReaderCockpitVoicePresentationReadiness,
} from "@/lib/domain/reader-cockpit-payload";
import { NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION } from "@/lib/domain/narration-modes";
import { inferApproximateStoryYearFromScene } from "@/lib/inner-voice/framing/age-band";
import { buildWorldStateLanguageEnvironment } from "@/lib/thought-language/world-state-language-environment";
import { getActiveConversationSession } from "@/lib/services/character-conversation-session-service";
import { listSessionTurnsOrdered } from "@/lib/services/character-conversation-turn-service";
import { refreshConversationalIdentitySnapshot } from "@/lib/services/conversational-identity-refresh-service";
import {
  mapConversationIdentitySummary,
  mapConversationSessionMetadata,
  mapConversationTurnObservability,
} from "@/lib/services/conversation-read-model-mapper";
import { getSourcesForWorldState } from "@/lib/services/narrative-source-service";
import { resolveDegradedInteractionPolicy, type RuntimeEnvironment } from "@/lib/services/degraded-interaction-policy-service";
import {
  getOrCreateReaderBalance,
  getReaderInteractionBalanceUnavailableReason,
  isReaderInteractionBalanceUnavailableError,
} from "@/lib/services/reader-interaction-balance-service";
import {
  getDefaultFeatureFlagsForPlan,
  refreshMonthlyAllowanceIfNeeded,
} from "@/lib/services/reader-entitlement-service";
import { getOrCreateReaderContext } from "@/lib/services/reader-context-service";
import { summarizeLedgerForSession } from "@/lib/services/reader-interaction-ledger-service";
import { deriveConversationEmotionalContinuity } from "@/lib/services/conversation-emotional-continuity-service";
import { summarizeDegradedInteractionState } from "@/lib/services/degraded-interaction-observability-service";
import { readSessionMemorySummaryFromMetadata } from "@/lib/services/session-memory-compression-service";
import { buildCharacterPresentationMode } from "@/lib/services/translation-presentation-service";
import { resolveEffectiveWorldStateForScene } from "@/lib/services/world-state-resolution";
import { getProviderResilienceSnapshot } from "@/lib/services/provider-resilience-service";
import { prisma } from "@/lib/prisma";

const DEFAULT_MAX_TURNS = 12;
const SCENE_DESCRIPTION_EXCERPT_MAX = 220;
const COCKPIT_CACHE_TTL_MS = 1_500;

type CockpitCacheEntry = {
  expiresAtMs: number;
  payload: ReaderCockpitPayload;
};

const cockpitPayloadCache = new Map<string, CockpitCacheEntry>();

function cacheKey(params: BuildReaderCockpitPayloadParams): string {
  return [
    params.readerId.trim(),
    params.characterId.trim(),
    params.sessionId?.trim() ?? "",
    params.maxTranscriptTurns ?? DEFAULT_MAX_TURNS,
  ].join("::");
}

export function primeReaderCockpitPayloadCacheForTests(
  key: string,
  payload: ReaderCockpitPayload,
  ttlMs = COCKPIT_CACHE_TTL_MS
): void {
  cockpitPayloadCache.set(key, {
    payload,
    expiresAtMs: Date.now() + Math.max(1, ttlMs),
  });
}

export function getReaderCockpitPayloadCacheSizeForTests(): number {
  return cockpitPayloadCache.size;
}

export function invalidateReaderCockpitPayloadCache(params?: {
  readerId?: string;
  characterId?: string;
  sessionId?: string;
}): void {
  if (!params) {
    cockpitPayloadCache.clear();
    return;
  }
  const readerId = params.readerId?.trim();
  const characterId = params.characterId?.trim();
  const sessionId = params.sessionId?.trim();
  for (const key of cockpitPayloadCache.keys()) {
    const [kReader, kCharacter, kSession] = key.split("::");
    if (readerId && kReader !== readerId) continue;
    if (characterId && kCharacter !== characterId) continue;
    if (sessionId && kSession !== sessionId) continue;
    cockpitPayloadCache.delete(key);
  }
}

function isoNow(): string {
  return new Date().toISOString();
}

function runtimeEnvironment(): RuntimeEnvironment {
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}

function parsePresentationPlaybackPreference(
  meta: Prisma.JsonValue | null
): ReaderCockpitPresentationPlaybackPreference | undefined {
  if (meta == null || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const v = (meta as Record<string, unknown>).presentationPlaybackPreference;
  if (v === "translated_default" || v === "native_when_available") return v;
  return undefined;
}

function excerptText(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Scene-scoped narrative sources for identity / reply generation (same temporal discipline as scene generation). */
export async function loadNarrativeSourcesForScene(sceneId: string | null): Promise<NarrativeSource[]> {
  const sid = sceneId?.trim();
  if (!sid) return [];
  const { worldStateId } = await resolveEffectiveWorldStateForScene(sid);
  if (!worldStateId) return [];
  const scene = await prisma.scene.findUnique({
    where: { id: sid },
    select: { structuredDataJson: true, historicalAnchor: true },
  });
  const year = scene
    ? inferApproximateStoryYearFromScene(scene.structuredDataJson, scene.historicalAnchor)
    : null;
  return getSourcesForWorldState(worldStateId, year ?? undefined);
}

async function loadSceneInteractionContext(sceneId: string): Promise<ReaderCockpitSceneInteractionContext | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: {
      id: true,
      description: true,
      orderInChapter: true,
      chapter: { select: { title: true, book: { select: { title: true } } } },
    },
  });
  if (!scene) return null;
  return {
    sceneId: scene.id,
    descriptionExcerpt: excerptText(scene.description, SCENE_DESCRIPTION_EXCERPT_MAX),
    orderInChapter: scene.orderInChapter ?? null,
    chapterTitle: scene.chapter.title ?? null,
    bookTitle: scene.chapter.book.title ?? null,
  };
}

async function resolveSession(params: {
  readerId: string;
  characterId: string;
  sessionId?: string | null;
}): Promise<CharacterConversationSession | null> {
  const rid = params.readerId.trim();
  const cid = params.characterId.trim();
  if (!rid || !cid) return null;

  const sid = params.sessionId?.trim();
  if (sid) {
    const row = await prisma.characterConversationSession.findFirst({
      where: { id: sid, readerId: rid, characterId: cid },
    });
    if (!row) return null;
    return {
      id: row.id,
      characterId: row.characterId,
      readerId: row.readerId,
      sceneId: row.sceneId,
      status: row.status as CharacterConversationSession["status"],
      interactionCount: row.interactionCount,
      startedAt: row.startedAt,
      lastInteractionAt: row.lastInteractionAt,
      endedAt: row.endedAt,
      metadataJson: row.metadataJson,
    };
  }

  return getActiveConversationSession(cid, rid);
}

async function buildVoiceReadiness(params: {
  characterId: string;
  session: CharacterConversationSession | null;
  sceneId: string | null;
  readerContext: ReaderCockpitReaderContextPreferenceSummary;
}): Promise<ReaderCockpitVoicePresentationReadiness> {
  const [core, tts] = await Promise.all([
    prisma.characterCoreProfile.findUnique({
      where: { characterId: params.characterId },
      select: { mindLanguagePrimary: true },
    }),
    prisma.characterTtsVoiceProfile.findUnique({
      where: { characterId: params.characterId },
      select: { id: true },
    }),
  ]);

  let worldEnv = null as ReturnType<typeof buildWorldStateLanguageEnvironment> | null;
  const sid = params.sceneId?.trim();
  if (sid) {
    try {
      const { worldStateId } = await resolveEffectiveWorldStateForScene(sid);
      if (worldStateId) {
        const ws = await prisma.worldStateReference.findUnique({
          where: { id: worldStateId },
          select: {
            id: true,
            eraId: true,
            label: true,
            languageEnvironmentJson: true,
          },
        });
        if (ws) {
          worldEnv = buildWorldStateLanguageEnvironment({
            worldStateId: ws.id,
            eraId: ws.eraId ?? null,
            label: ws.label ?? null,
            languageEnvironmentJson: ws.languageEnvironmentJson,
          });
        }
      }
    } catch {
      worldEnv = null;
    }
  }

  const characterPresentationMode = buildCharacterPresentationMode({
    worldLanguageEnvironment: worldEnv,
    characterPrimaryMindLanguage: core?.mindLanguagePrimary ?? null,
    readerPresentationLanguageCode: params.readerContext.preferredPresentationLanguageCode,
  });

  const hasTtsVoiceAssignment = tts != null;
  const readyForVoicePlayback =
    params.readerContext.preferredAudioEnabled &&
    hasTtsVoiceAssignment &&
    params.session != null &&
    params.session.status === "ACTIVE";

  return {
    characterPresentationMode,
    hasTtsVoiceAssignment,
    readyForVoicePlayback,
    preferredAudioEnabled: params.readerContext.preferredAudioEnabled,
    preferredVoicePlaybackSpeed: params.readerContext.preferredVoicePlaybackSpeed,
  };
}

export type BuildReaderCockpitPayloadParams = {
  readerId: string;
  characterId: string;
  /** When set, load this session if it belongs to the pair (any status). Otherwise prefer ACTIVE. */
  sessionId?: string | null;
  maxTranscriptTurns?: number;
};

/**
 * Deterministic aggregate for cockpit consumers. No LLM calls.
 */
export async function buildReaderCockpitPayload(
  params: BuildReaderCockpitPayloadParams
): Promise<ReaderCockpitPayload> {
  const readerId = params.readerId.trim();
  const characterId = params.characterId.trim();
  const cacheToken = cacheKey({
    ...params,
    readerId,
    characterId,
  });
  const cached = cockpitPayloadCache.get(cacheToken);
  if (cached && cached.expiresAtMs > Date.now()) {
    return validateRegisteredContractPayload("readerCockpitPayload", {
      ...cached.payload,
      builtAtIso: isoNow(),
    }, "write");
  }
  const builtAtIso = isoNow();
  const maxTurns = Math.min(24, Math.max(1, params.maxTranscriptTurns ?? DEFAULT_MAX_TURNS));

  if (!readerId || !characterId) {
    throw new Error("[reader-cockpit-payload] readerId and characterId are required.");
  }

  const session = await resolveSession({
    readerId,
    characterId,
    sessionId: params.sessionId,
  });

  const readerContext = await getOrCreateReaderContext(readerId);
  const readerContextSummary: ReaderCockpitReaderContextPreferenceSummary = {
    preferredPresentationLanguageCode: readerContext.preferredPresentationLanguageCode,
    preferredAudioEnabled: readerContext.preferredAudioEnabled,
    preferredNativeTongueToggleDefault: readerContext.preferredNativeTongueToggleDefault,
    preferredVoicePlaybackSpeed: readerContext.preferredVoicePlaybackSpeed,
  };

  const voicePresentationReadiness = await buildVoiceReadiness({
    characterId,
    session,
    sceneId: session?.sceneId ?? null,
    readerContext: readerContextSummary,
  });

  const costEstimateSummary: ReaderCockpitCostEstimateSummary = {
    narrationMode: NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION,
    ledgerSessionSummary: session ? await summarizeLedgerForSession(session.id) : null,
  };
  const entitlementState = await refreshMonthlyAllowanceIfNeeded(readerId);
  const entitlementFeatureFlags = {
    ...getDefaultFeatureFlagsForPlan(entitlementState.entitlement.planType),
    ...(entitlementState.entitlement.featureFlagsJson &&
    typeof entitlementState.entitlement.featureFlagsJson === "object" &&
    !Array.isArray(entitlementState.entitlement.featureFlagsJson)
      ? (entitlementState.entitlement.featureFlagsJson as Record<string, boolean>)
      : {}),
  };

  let balance: { availableUnits: number } | null = null;
  let balanceUnavailableReason:
    | "schema_missing"
    | "provider_failure"
    | "unknown_runtime_unavailable"
    | null = null;
  try {
    balance = await getOrCreateReaderBalance(readerId);
  } catch (error) {
    if (isReaderInteractionBalanceUnavailableError(error)) {
      balanceUnavailableReason =
        getReaderInteractionBalanceUnavailableReason(error) ?? "unknown_runtime_unavailable";
    } else {
      throw error;
    }
  }

  const resolvedPolicyFromBalanceUnavailable =
    balanceUnavailableReason != null
      ? resolveDegradedInteractionPolicy({
          unavailableReason: balanceUnavailableReason,
          readerEntitlement: entitlementState.entitlement.planType === "internal"
            ? "admin"
            : entitlementState.entitlement.planType,
          environment: runtimeEnvironment(),
        })
      : null;
  const defaultDegradedInteraction = summarizeDegradedInteractionState(null);
  const providerResilience = getProviderResilienceSnapshot();

  if (!session) {
    const payload: ReaderCockpitPayload = {
      contractVersion: READER_COCKPIT_PAYLOAD_CONTRACT_VERSION,
      builtAtIso,
      readerId,
      characterId,
      activeSession: null,
      sceneInteractionContext: null,
      conversationalIdentitySummary: null,
      readerRelationshipProgression: null,
      emotionalContinuity: null,
      latestTranscriptTurns: [],
      voicePresentationReadiness,
      costEstimateSummary,
      policySummary: null,
      presentationPlaybackPreference: undefined,
      readerContextPreferences: readerContextSummary,
      sessionMemorySummary: null,
      interactionBalance: balance ? { availableUnits: balance.availableUnits } : undefined,
      entitlement: {
        planType: entitlementState.entitlement.planType,
        monthlyUnitAllowance: entitlementState.entitlement.monthlyUnitAllowance,
        remainingUnitBalance: entitlementState.entitlement.remainingUnitBalance,
        featureFlags: entitlementFeatureFlags,
        entitlementStartAtIso: entitlementState.entitlement.entitlementStartAt.toISOString(),
        entitlementEndAtIso: entitlementState.entitlement.entitlementEndAt
          ? entitlementState.entitlement.entitlementEndAt.toISOString()
          : null,
      },
      interactionBalanceStatus: {
        state: balance ? "available" : "unavailable",
        ...(balanceUnavailableReason ? { unavailableReason: balanceUnavailableReason } : {}),
      },
      interactionDegradedPolicy:
        resolvedPolicyFromBalanceUnavailable,
      degradedInteraction: {
        ...defaultDegradedInteraction,
        currentPolicy: resolvedPolicyFromBalanceUnavailable,
        unavailableReason: balanceUnavailableReason,
      },
      providerResilience,
    };
    const validatedPayload = validateRegisteredContractPayload("readerCockpitPayload", payload, "write");
    cockpitPayloadCache.set(cacheToken, {
      payload: validatedPayload,
      expiresAtMs: Date.now() + COCKPIT_CACHE_TTL_MS,
    });
    return validatedPayload;
  }

  const narrativeSourcesForScene = await loadNarrativeSourcesForScene(session.sceneId);

  const snapshot = await refreshConversationalIdentitySnapshot({
    characterId,
    readerId,
    sceneId: session.sceneId,
    narrativeSourcesForScene,
    sessionId: session.id,
  });

  const identity: ReaderCockpitConversationalIdentitySummary = {
    ...mapConversationIdentitySummary(snapshot),
    snapshotBuiltAtIso: snapshot.builtAtIso,
    knowledgeBoundary: {
      knownFactsLineCount: snapshot.knowledgeBoundary.knownFacts.length,
      believedFactsLineCount: snapshot.knowledgeBoundary.believedFacts.length,
      unknownDomainsLineCount: snapshot.knowledgeBoundary.unknownDomains.length,
    },
    readerMemoryInteractionCount: snapshot.sessionContext?.readerMemoryInteractionCount ?? null,
  };

  const turnsOrdered = await listSessionTurnsOrdered(session.id);
  const slice = turnsOrdered.slice(-maxTurns);
  const latestTranscriptTurns = mapConversationTurnObservability(slice).reverse();
  const sessionMemorySummary = readSessionMemorySummaryFromMetadata(session.metadataJson);
  const recentCharacterTones = slice
    .filter((t) => t.speakerType === "character")
    .map((t) => {
      if (t.payloadJson == null || typeof t.payloadJson !== "object" || Array.isArray(t.payloadJson)) return "";
      const tone = (t.payloadJson as Record<string, unknown>).emotionalTone;
      return typeof tone === "string" ? tone : "";
    })
    .filter(Boolean);

  let sceneInteractionContext: ReaderCockpitSceneInteractionContext | null = null;
  if (session.sceneId) {
    sceneInteractionContext = await loadSceneInteractionContext(session.sceneId);
  }
  const sessionDegradedInteraction = summarizeDegradedInteractionState(session.metadataJson);

  const payload: ReaderCockpitPayload = {
    contractVersion: READER_COCKPIT_PAYLOAD_CONTRACT_VERSION,
    builtAtIso,
    readerId,
    characterId,
    activeSession: mapConversationSessionMetadata(session),
    sceneInteractionContext,
    conversationalIdentitySummary: identity,
    readerRelationshipProgression: snapshot.readerRelationshipProgression,
    emotionalContinuity: deriveConversationEmotionalContinuity({
      snapshot,
      sessionMemorySummary,
      recentCharacterTones,
    }),
    latestTranscriptTurns,
    voicePresentationReadiness,
    costEstimateSummary,
    policySummary: snapshot.policy,
    presentationPlaybackPreference:
      parsePresentationPlaybackPreference(session.metadataJson) ?? "translated_default",
    readerContextPreferences: readerContextSummary,
    sessionMemorySummary,
    interactionBalance: balance ? { availableUnits: balance.availableUnits } : undefined,
    entitlement: {
      planType: entitlementState.entitlement.planType,
      monthlyUnitAllowance: entitlementState.entitlement.monthlyUnitAllowance,
      remainingUnitBalance: entitlementState.entitlement.remainingUnitBalance,
      featureFlags: entitlementFeatureFlags,
      entitlementStartAtIso: entitlementState.entitlement.entitlementStartAt.toISOString(),
      entitlementEndAtIso: entitlementState.entitlement.entitlementEndAt
        ? entitlementState.entitlement.entitlementEndAt.toISOString()
        : null,
    },
    interactionBalanceStatus: {
      state: balance ? "available" : "unavailable",
      ...(balanceUnavailableReason ? { unavailableReason: balanceUnavailableReason } : {}),
    },
    interactionDegradedPolicy:
      resolvedPolicyFromBalanceUnavailable,
    degradedInteraction: {
      ...sessionDegradedInteraction,
      currentPolicy:
        sessionDegradedInteraction.currentPolicy ??
        resolvedPolicyFromBalanceUnavailable,
      unavailableReason:
        sessionDegradedInteraction.unavailableReason ??
        balanceUnavailableReason,
    },
    providerResilience,
  };
  const validatedPayload = validateRegisteredContractPayload("readerCockpitPayload", payload, "write");
  cockpitPayloadCache.set(cacheToken, {
    payload: validatedPayload,
    expiresAtMs: Date.now() + COCKPIT_CACHE_TTL_MS,
  });
  return validatedPayload;
}
