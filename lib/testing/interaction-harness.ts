/**
 * P3-B — Deterministic end-to-end interaction harness (no LLM / no ElevenLabs).
 * Exercises contracts, scene entry, identity snapshot, assembly, guardrails, voice prep,
 * transcript persistence, reader memory writeback, and ledger rows against a real DB.
 */

import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import { CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION } from "@/lib/domain/conversational-turn-input";
import type { ConversationalTurnInput } from "@/lib/domain/conversational-turn-input";
import { assembleCharacterResponse } from "@/lib/services/character-response-assembly-service";
import { assessCharacterResponsePolicyViolations } from "@/lib/services/character-response-guardrail-service";
import {
  appendCharacterTurn,
  appendReaderTurn,
  listSessionTurnsOrdered,
} from "@/lib/services/character-conversation-turn-service";
import {
  estimateConversationTurnCostUnits,
  estimateVoiceRenderCostUnits,
} from "@/lib/services/interaction-cost-estimation-service";
import { createLedgerEntry } from "@/lib/services/reader-interaction-ledger-service";
import {
  assertRuntimeDependencies,
  classifyRuntimeDependencyFailure,
  type RuntimeDependencyFailureKind,
} from "@/lib/services/runtime-dependency-guard";
import { extractDirectReaderDisclosures, updateReaderMemoryFromTurn } from "@/lib/services/reader-memory-writeback-service";
import { openSceneCharacterInteraction } from "@/lib/services/scene-interaction-entry-service";
import { buildCharacterPresentationMode } from "@/lib/services/translation-presentation-service";
import { toVoiceReadyText } from "@/lib/voice/voice-presentation";
import { prisma } from "@/lib/prisma";

export const DETERMINISTIC_HARNESS_DEFAULT_READER_ID = "p3b-deterministic-harness-reader";

const PLACEHOLDER_SPOKEN =
  "The market square is busy this afternoon. I remember the bells at noon when the stalls opened.";
const PLACEHOLDER_INTERNAL = "I wonder whether we should linger before the west road.";

/** Reader line includes an explicit disclosure so {@link extractDirectReaderDisclosures} is non-empty. */
const PLACEHOLDER_READER_TEXT =
  "Good day. My name is Harness Reader Alpha for deterministic testing. What news from the square?";

export type DeterministicInteractionHarnessStep = {
  name: string;
  ok: boolean;
  details?: Record<string, unknown>;
};

export type DeterministicInteractionHarnessSummary = {
  success: boolean;
  error?: string;
  failureKind?: RuntimeDependencyFailureKind;
  readerId: string;
  sceneId: string;
  characterId: string;
  sessionId: string;
  steps: DeterministicInteractionHarnessStep[];
  conversationalIdentitySnapshot?: {
    contractVersion: string;
    builtAtIso: string;
    characterId: string;
    sceneId: string | null;
    sessionContextSessionId: string | null;
  };
  turnInputContract?: Record<string, unknown>;
  assembledResponse?: {
    spokenResponse: string;
    internalThought: string;
    knowledgeSource: string;
    emotionalTone: string;
  };
  guardrail?: { pass: boolean; violationCount: number; suggestedDowngradeAction: string };
  voicePresentation?: {
    presentationMode: Record<string, unknown>;
    voiceReady: { cleanedSpeech: string; emotionalCues: string[] };
  };
  transcript?: { turnCount: number; orderIndices: number[] };
  readerMemory?: { interactionCount: number; knownFactsKeys: string[] };
  ledger?: {
    textTurn: { id: string; unitCount: number; estimatedCostUnits: number };
    voiceRender: { id: string; unitCount: number; estimatedCostUnits: number };
  };
  costEstimate?: { textTurnCostUnits: number; voiceRenderCostUnits: number; totalCostUnits: number };
};

export type RunDeterministicInteractionHarnessOptions = {
  /** Override auto-resolved scene (must exist; character should be in cast when cast is non-empty). */
  sceneId?: string;
  characterId?: string;
  readerId?: string;
  /** When true (default), delete prior harness rows for this reader so runs are repeatable. */
  cleanup?: boolean;
};

async function cleanupHarnessData(readerId: string): Promise<void> {
  await prisma.readerInteractionLedgerEntry.deleteMany({ where: { readerId } });
  await prisma.characterConversationSession.deleteMany({ where: { readerId } });
  await prisma.characterReaderMemory.deleteMany({ where: { readerId } });
}

/**
 * Resolve a scene with at least one linked Person, wiring a person to the first scene if needed (same strategy as scene-interaction tests).
 */
export async function resolveHarnessSceneAndCharacter(
  sceneId?: string,
  characterId?: string
): Promise<{ sceneId: string; characterId: string } | null> {
  if (sceneId?.trim() && characterId?.trim()) {
    return { sceneId: sceneId.trim(), characterId: characterId.trim() };
  }

  let scene = await prisma.scene.findFirst({
    where: { persons: { some: {} } },
    select: {
      id: true,
      persons: { select: { id: true } },
    },
  });

  if (!scene) {
    const anyScene = await prisma.scene.findFirst({ select: { id: true } });
    const anyPerson = await prisma.person.findFirst({ select: { id: true } });
    if (!anyScene || !anyPerson) return null;
    await prisma.scene.update({
      where: { id: anyScene.id },
      data: { persons: { connect: { id: anyPerson.id } } },
    });
    scene = await prisma.scene.findUniqueOrThrow({
      where: { id: anyScene.id },
      select: { id: true, persons: { select: { id: true } } },
    });
  }

  if (!scene.persons.length) return null;

  return {
    sceneId: scene.id,
    characterId: scene.persons[0]!.id,
  };
}

function step(
  steps: DeterministicInteractionHarnessStep[],
  name: string,
  ok: boolean,
  details?: Record<string, unknown>
): void {
  steps.push({ name, ok, details });
}

/**
 * Runs the full deterministic stack once. Requires `DATABASE_URL` and at least one Scene + Person.
 */
export async function runDeterministicInteractionHarness(
  options: RunDeterministicInteractionHarnessOptions = {}
): Promise<DeterministicInteractionHarnessSummary> {
  const readerId = (options.readerId ?? DETERMINISTIC_HARNESS_DEFAULT_READER_ID).trim();
  const cleanup = options.cleanup !== false;
  const steps: DeterministicInteractionHarnessStep[] = [];

  const summaryBase = (): DeterministicInteractionHarnessSummary => ({
    success: false,
    readerId,
    sceneId: "",
    characterId: "",
    sessionId: "",
    steps,
  });

  try {
    await assertRuntimeDependencies("deterministic-interaction-harness", {
      tables: [
        "Scene",
        "Person",
        "CharacterStateSnapshot",
        "CharacterReaderMemory",
        "CharacterConversationSession",
        "CharacterConversationTurn",
        "ReaderInteractionLedgerEntry",
      ],
      columns: [{ table: "CharacterStateSnapshot", column: "characterId" }],
    });
    step(steps, "dependency_preflight", true, {
      requiredTables: [
        "Scene",
        "Person",
        "CharacterStateSnapshot",
        "CharacterReaderMemory",
        "CharacterConversationSession",
        "CharacterConversationTurn",
        "ReaderInteractionLedgerEntry",
      ],
      requiredColumns: ["CharacterStateSnapshot.characterId"],
    });

    const resolved = await resolveHarnessSceneAndCharacter(options.sceneId, options.characterId);
    if (!resolved) {
      step(steps, "resolve_scene_and_character", false, {
        reason: "need at least one Scene and one Person in DB",
      });
      return {
        ...summaryBase(),
        error: "Could not resolve scene/character anchors (empty DB or missing Person/Scene).",
      };
    }

    const { sceneId, characterId } = resolved;

    if (cleanup) {
      await cleanupHarnessData(readerId);
      step(steps, "cleanup_prior_harness_data", true, { readerId });
    }

    const turnInput: ConversationalTurnInput = {
      contractVersion: CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
      characterId,
      readerId,
      sceneId,
      sessionId: null,
      inputMode: "text",
      readerText: PLACEHOLDER_READER_TEXT,
    };

    const validatedTurn = validateRegisteredContractPayload("conversationalTurnInput", turnInput, "write");
    step(steps, "turn_input_contract", true, {
      contractVersion: validatedTurn.contractVersion,
      keys: Object.keys(validatedTurn),
    });

    const entry = await openSceneCharacterInteraction({
      sceneId,
      characterId,
      readerId,
    });

    const sessionId = entry.characterConversationSession.id;
    step(steps, "scene_interaction_entry", true, {
      sessionId,
      sceneCastValidation: entry.sceneCastValidation,
      sourceIdsUsedCount: entry.sourceIdsUsed.length,
    });

    const snap = entry.conversationalIdentitySnapshot;
    step(steps, "conversational_identity_snapshot", true, {
      builtAtIso: snap.builtAtIso,
      characterId: snap.characterId,
      sceneId: snap.sceneId,
      sessionContext: snap.sessionContext?.sessionId ?? null,
    });

    const turnWithSession: ConversationalTurnInput = {
      ...validatedTurn,
      sessionId,
    };
    validateRegisteredContractPayload("conversationalTurnInput", turnWithSession, "write");

    await appendReaderTurn(sessionId, turnWithSession);
    step(steps, "transcript_reader_turn", true, { sessionId });

    const spokenRaw = PLACEHOLDER_SPOKEN;
    const internalRaw = PLACEHOLDER_INTERNAL;
    const assembled = assembleCharacterResponse({
      conversationalIdentitySnapshot: snap,
      spokenResponseText: spokenRaw,
      internalThoughtText: internalRaw,
      responseIntent: "statement",
    });

    step(steps, "response_assembly", true, {
      knowledgeSource: assembled.knowledgeSource,
      emotionalTone: assembled.emotionalTone,
    });

    const assessment = assessCharacterResponsePolicyViolations({
      snapshot: snap,
      response: assembled,
      originalCombinedText: `${spokenRaw}\n${internalRaw}`,
    });
    step(steps, "guardrail_enforcement", assessment.pass, {
      pass: assessment.pass,
      violationCount: assessment.violations.length,
      suggestedDowngradeAction: assessment.suggestedDowngradeAction,
    });

    const presentationMode = buildCharacterPresentationMode({
      readerPresentationLanguageCode: "en",
      characterPrimaryMindLanguage: null,
    });
    const voiceReady = toVoiceReadyText(assembled);
    step(steps, "voice_presentation_payload", true, {
      translationApplied: presentationMode.translationApplied,
      cleanedSpeechLength: voiceReady.cleanedSpeech.length,
      cueCount: voiceReady.emotionalCues.length,
    });

    await appendCharacterTurn(sessionId, assembled);
    step(steps, "transcript_character_turn", true, { sessionId });

    const turns = await listSessionTurnsOrdered(sessionId);
    step(steps, "transcript_persistence", turns.length === 2, {
      turnCount: turns.length,
      orderIndices: turns.map((t) => t.orderIndex),
    });

    const memory = await updateReaderMemoryFromTurn({
      characterId,
      readerId,
      readerTurnText: PLACEHOLDER_READER_TEXT,
      characterResponse: assembled,
    });

    const known = memory.knownFacts as Record<string, unknown>;
    const knownFactsKeys = known && typeof known === "object" ? Object.keys(known) : [];
    const disclosures = extractDirectReaderDisclosures(PLACEHOLDER_READER_TEXT);
    step(steps, "reader_memory_writeback", knownFactsKeys.includes("disclosed_name"), {
      interactionCount: memory.interactionCount,
      knownFactsKeys,
      extractedDisclosures: Object.keys(disclosures),
    });

    const cost = estimateConversationTurnCostUnits({
      readerText: PLACEHOLDER_READER_TEXT,
      characterSpokenResponse: assembled.spokenResponse,
      characterInternalThought: assembled.internalThought,
      includeVoiceRender: true,
      voicePresentationPayload: presentationMode,
    });

    const textLedger = await createLedgerEntry({
      readerId,
      sessionId,
      entryType: "text_turn",
      unitCount: cost.textTurnCostUnits,
      estimatedCostUnits: cost.textTurnCostUnits,
      metadataJson: { kind: "p3b_harness", slice: "text" },
    });

    const voiceUnits = estimateVoiceRenderCostUnits(presentationMode);
    const voiceLedger = await createLedgerEntry({
      readerId,
      sessionId,
      entryType: "voice_render",
      unitCount: 1,
      estimatedCostUnits: voiceUnits,
      metadataJson: { kind: "p3b_harness", slice: "voice" },
    });

    step(steps, "ledger_entries", true, {
      textTurnId: textLedger.id,
      voiceRenderId: voiceLedger.id,
    });

    const allOk =
      steps.every((s) => s.ok) &&
      turns.length === 2 &&
      assessment.pass &&
      knownFactsKeys.includes("disclosed_name");

    return {
      success: allOk,
      readerId,
      sceneId,
      characterId,
      sessionId,
      steps,
      conversationalIdentitySnapshot: {
        contractVersion: snap.contractVersion,
        builtAtIso: snap.builtAtIso,
        characterId: snap.characterId,
        sceneId: snap.sceneId,
        sessionContextSessionId: snap.sessionContext?.sessionId ?? null,
      },
      turnInputContract: validatedTurn as unknown as Record<string, unknown>,
      assembledResponse: {
        spokenResponse: assembled.spokenResponse,
        internalThought: assembled.internalThought,
        knowledgeSource: assembled.knowledgeSource,
        emotionalTone: assembled.emotionalTone,
      },
      guardrail: {
        pass: assessment.pass,
        violationCount: assessment.violations.length,
        suggestedDowngradeAction: assessment.suggestedDowngradeAction,
      },
      voicePresentation: {
        presentationMode: { ...presentationMode },
        voiceReady: {
          cleanedSpeech: voiceReady.cleanedSpeech,
          emotionalCues: voiceReady.emotionalCues,
        },
      },
      transcript: {
        turnCount: turns.length,
        orderIndices: turns.map((t) => t.orderIndex),
      },
      readerMemory: {
        interactionCount: memory.interactionCount,
        knownFactsKeys,
      },
      ledger: {
        textTurn: {
          id: textLedger.id,
          unitCount: textLedger.unitCount,
          estimatedCostUnits: textLedger.estimatedCostUnits,
        },
        voiceRender: {
          id: voiceLedger.id,
          unitCount: voiceLedger.unitCount,
          estimatedCostUnits: voiceLedger.estimatedCostUnits,
        },
      },
      costEstimate: {
        textTurnCostUnits: cost.textTurnCostUnits,
        voiceRenderCostUnits: cost.voiceRenderCostUnits,
        totalCostUnits: cost.totalCostUnits,
      },
    };
  } catch (e) {
    const classified = classifyRuntimeDependencyFailure(e);
    step(steps, "harness_error", false, { message: classified.message, failureKind: classified.kind });
    return {
      ...summaryBase(),
      error: classified.message,
      failureKind: classified.kind,
    };
  }
}
