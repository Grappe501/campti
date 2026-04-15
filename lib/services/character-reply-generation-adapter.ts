/**
 * P2-L — Bounded adapter boundary for future character reply generation.
 *
 * Produces a deterministic, structured prompt bundle from {@link ConversationalIdentitySnapshot} +
 * {@link ConversationalTurnInput}. **Does not call an LLM.**
 *
 * **Excluded by design:** author voice, God-mode QA, omniscient narration, manuscript-wide knowledge,
 * and any pipeline that bypasses snapshot policy — those are separate adapters and must not be merged here.
 */

import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import type { ConversationalTurnInput } from "@/lib/domain/conversational-turn-input";
import type { NarrativeEmergenceBundle } from "@/lib/domain/narrative-emergence-bundle";
import { deriveConversationEmotionalContinuity } from "@/lib/services/conversation-emotional-continuity-service";
import { buildNarrativeEmergenceBundle } from "@/lib/services/narrative-emergence-orchestrator-service";
import { buildStorylineOrchestrationInputsFromSeamContext } from "@/lib/services/storyline-orchestrator-integration-service";

export type PrepareCharacterReplyGenerationInputParams = {
  snapshot: ConversationalIdentitySnapshot;
  turnInput: ConversationalTurnInput;
};

/**
 * Structured, deterministic inputs for a future bounded reply generator.
 * Keys are fixed; values are prose summaries only (no hidden tool payloads).
 */
export type CharacterReplyGenerationPreparedInput = {
  policySummary: string;
  identitySummary: string;
  readerRelationshipMemorySummary: string;
  knowledgeBoundarySummary: string;
  emotionalContextSummary: string;
  narrativeEmergenceBundle: NarrativeEmergenceBundle;
  readerPromptText: string;
};
function buildInteractionEmergenceBundle(snapshot: ConversationalIdentitySnapshot): NarrativeEmergenceBundle {
  const emotionalContinuity = deriveConversationEmotionalContinuity({
    snapshot,
    mode: "interaction_mode",
    channel: "reader_bond_dyad",
  });
  const relationshipSignalCodes = [
    `reader_relationship_state:${snapshot.readerRelationshipProgression.relationshipState}`,
    `reader_disclosure_band:${snapshot.readerRelationshipProgression.disclosureComfortBand}`,
  ];
  return buildNarrativeEmergenceBundle({
    mode: "interaction_mode",
    channel: "reader_bond_dyad",
    surfaces: {
      emotionalContinuity,
      relationshipTensionSignals: relationshipSignalCodes,
      storylineOrchestration: buildStorylineOrchestrationInputsFromSeamContext({
        mode: "interaction_mode",
        channel: "reader_bond_dyad",
        seamId: `interaction:${snapshot.characterId}:${snapshot.readerId}`,
        relationshipSignalCodes,
        emotionalContinuity,
      }),
    },
  });
}


const MAX_SECTION_CHARS = 8000;

function cap(s: string): string {
  if (s.length <= MAX_SECTION_CHARS) return s;
  return `${s.slice(0, MAX_SECTION_CHARS)}…`;
}

function summarizePolicy(snapshot: ConversationalIdentitySnapshot): string {
  const p = snapshot.policy;
  const lines = [
    "Mode: bounded character conversation (in-world only).",
    `inWorldOnly: ${p.inWorldOnly}`,
    `noFutureKnowledge: ${p.noFutureKnowledge}`,
    `noOutOfWorldTeaching: ${p.noOutOfWorldTeaching}`,
    `translationIsPresentationOnly: ${p.translationIsPresentationOnly}`,
    `authorOmniscienceExcluded: ${p.authorOmniscienceExcluded}`,
    "Author/God/omniscient tooling: not in scope for this adapter.",
  ];
  return lines.join("\n");
}

function summarizeIdentity(snapshot: ConversationalIdentitySnapshot): string {
  const { person, literaryProfile, coreHighlights } = snapshot.identity;
  const parts: string[] = [];
  parts.push(`Person: ${person.name} (id=${person.id})`);
  if (person.birthYear != null || person.deathYear != null) {
    parts.push(`Life years: birth=${person.birthYear ?? "?"}, death=${person.deathYear ?? "?"}`);
  }
  if (literaryProfile) {
    const lp = [
      literaryProfile.socialPosition,
      literaryProfile.roleArchetype,
      literaryProfile.narrativeFunction,
      literaryProfile.worldview,
    ]
      .filter((x): x is string => Boolean(x?.trim()))
      .join(" | ");
    if (lp) parts.push(`Literary: ${lp}`);
  }
  if (coreHighlights) {
    const ch = [
      coreHighlights.worldviewSummary,
      coreHighlights.coreFear && `coreFear: ${coreHighlights.coreFear}`,
      coreHighlights.coreDesire && `coreDesire: ${coreHighlights.coreDesire}`,
    ]
      .filter(Boolean)
      .join(" | ");
    if (ch) parts.push(`Core: ${ch}`);
  }
  parts.push(`Snapshot sceneId: ${snapshot.sceneId ?? "null (global slice)"}`);
  return cap(parts.join("\n"));
}

function summarizeReaderMemory(snapshot: ConversationalIdentitySnapshot): string {
  const m = snapshot.readerMemory;
  if (!m) {
    return "No persisted reader–character memory row for this dyad (first contact or unloaded).";
  }
  const lines = [
    `Familiarity (0–100): ${m.familiarityLevel}`,
    `Interaction count: ${m.interactionCount}`,
    `Known facts (bounded JSON): ${JSON.stringify(m.knownFacts)}`,
  ];
  if (m.relationshipNotes != null) {
    lines.push(`Relationship notes: ${JSON.stringify(m.relationshipNotes)}`);
  }
  return cap(lines.join("\n"));
}

function summarizeKnowledgeBoundary(snapshot: ConversationalIdentitySnapshot): string {
  const kb = snapshot.knowledgeBoundary;
  const lines: string[] = [
    "Known (excerpt):",
    ...kb.knownFacts.slice(0, 24).map((l) => `- ${l}`),
    "Believed (excerpt):",
    ...kb.believedFacts.slice(0, 24).map((l) => `- ${l}`),
    "Unknown / non-omniscience (excerpt):",
    ...kb.unknownDomains.slice(0, 24).map((l) => `- ${l}`),
  ];
  return cap(lines.join("\n"));
}

function summarizeEmotional(snapshot: ConversationalIdentitySnapshot): string {
  const { latestCognitionSnapshot: cog, latestLegacyCharacterState: leg } = snapshot.emotionalState;
  const parts: string[] = [];
  if (cog) {
    parts.push("Cognition snapshot (excerpt):");
    const slice = [
      cog.label,
      cog.currentFear && `fear: ${cog.currentFear}`,
      cog.currentDesire && `desire: ${cog.currentDesire}`,
      cog.currentObligation && `obligation: ${cog.currentObligation}`,
      cog.currentHope && `hope: ${cog.currentHope}`,
      cog.currentArousal != null && `arousal: ${cog.currentArousal}`,
      cog.currentLoneliness != null && `loneliness: ${cog.currentLoneliness}`,
    ]
      .filter(Boolean)
      .join(" | ");
    if (slice) parts.push(slice);
  } else {
    parts.push("Cognition snapshot: none.");
  }
  if (leg) {
    parts.push("Legacy character state (excerpt):");
    parts.push(
      [
        leg.label,
        leg.emotionalState && `mood: ${leg.emotionalState}`,
        leg.motivation && `motivation: ${leg.motivation}`,
        `fearLevel=${leg.fearLevel}, trustLevel=${leg.trustLevel}, cognitiveLoad=${leg.cognitiveLoad}`,
      ]
        .filter(Boolean)
        .join(" | ")
    );
  } else {
    parts.push("Legacy character state: none.");
  }
  return cap(parts.join("\n"));
}

function buildReaderPromptText(snapshot: ConversationalIdentitySnapshot, turn: ConversationalTurnInput): string {
  const lines: string[] = [
    "=== Reader turn (bounded in-world dialogue) ===",
    `Input mode: ${turn.inputMode}`,
    `Reader id: ${turn.readerId}`,
    `Character id: ${turn.characterId}`,
    `Snapshot sceneId (context): ${snapshot.sceneId ?? "null"}`,
  ];
  if (turn.sceneId != null) lines.push(`Turn sceneId: ${turn.sceneId}`);
  if (turn.sessionId != null) lines.push(`Session id (opaque): ${turn.sessionId}`);
  if (turn.translatedToCharacterLanguage != null) {
    lines.push(`Translated to character language (presentation hint): ${turn.translatedToCharacterLanguage}`);
  }
  lines.push("", "Reader message:", turn.readerText.trim(), "", "End reader message.");
  return cap(lines.join("\n"));
}

/**
 * Build deterministic structured summaries for a future reply generator.
 * Validates that `turnInput` matches `snapshot` character/reader ids.
 */
export function prepareCharacterReplyGenerationInput(
  params: PrepareCharacterReplyGenerationInputParams
): CharacterReplyGenerationPreparedInput {
  const { snapshot, turnInput } = params;

  if (turnInput.characterId !== snapshot.characterId || turnInput.readerId !== snapshot.readerId) {
    throw new Error(
      `[character-reply-generation-adapter] turnInput characterId/readerId must match snapshot (got turn ${turnInput.characterId}/${turnInput.readerId}, snapshot ${snapshot.characterId}/${snapshot.readerId}).`
    );
  }

  return {
    policySummary: summarizePolicy(snapshot),
    identitySummary: summarizeIdentity(snapshot),
    readerRelationshipMemorySummary: summarizeReaderMemory(snapshot),
    knowledgeBoundarySummary: summarizeKnowledgeBoundary(snapshot),
    emotionalContextSummary: summarizeEmotional(snapshot),
    narrativeEmergenceBundle: buildInteractionEmergenceBundle(snapshot),
    readerPromptText: buildReaderPromptText(snapshot, turnInput),
  };
}

/** Fixed public keys on {@link CharacterReplyGenerationPreparedInput} (for tests / drift guards). */
export const CHARACTER_REPLY_GENERATION_PREPARED_KEYS = [
  "policySummary",
  "identitySummary",
  "readerRelationshipMemorySummary",
  "knowledgeBoundarySummary",
  "emotionalContextSummary",
  "narrativeEmergenceBundle",
  "readerPromptText",
] as const;
