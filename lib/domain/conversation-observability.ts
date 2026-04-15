/**
 * P2-R — Conversation observability — structured inspection of live reader↔character session state.
 * Debug / logging only; not a UI contract.
 */

import type { CharacterConversationSessionStatus } from "@/lib/domain/character-conversation-session";
import type { CharacterConversationTurnSpeaker } from "@/lib/domain/character-conversation-turn";
import type { ConversationEmotionalContinuity } from "@/lib/domain/conversation-emotional-continuity";
import type { ConversationalIdentityPolicy } from "@/lib/domain/conversational-identity-snapshot";
import type { DegradedInteractionStateSummary } from "@/lib/domain/degraded-interaction-policy";
import type { StorylineExplainabilitySummary } from "@/lib/domain/storyline-explainability";

export const CONVERSATION_OBSERVABILITY_CONTRACT_VERSION = "1" as const;

/** Session row slice (no Prisma types in consumers). */
export type ConversationSessionMetadata = {
  sessionId: string;
  characterId: string;
  readerId: string;
  sceneId: string | null;
  status: CharacterConversationSessionStatus;
  /** Session row counter (P2-M); distinct from dyadic reader-memory interaction count when both exist. */
  interactionCount: number;
  startedAtIso: string;
  lastInteractionAtIso: string;
  endedAtIso: string | null;
};

/** Bounded character + person line items for logs. */
export type ConversationIdentitySummary = {
  characterId: string;
  readerId: string;
  sceneId: string | null;
  personName: string;
  personBirthYear: number | null;
  personDeathYear: number | null;
  roleArchetype: string | null;
  narrativeFunction: string | null;
};

/** P2-G row summary (no raw JSON blobs). */
export type ConversationReaderMemorySummary = {
  characterReaderMemoryId: string;
  familiarityLevel: number;
  interactionCount: number;
  knownFactsKeyCount: number;
  lastInteractionAtIso: string;
};

export type ConversationPolicySummary = ConversationalIdentityPolicy;

/** P2-Q assessment mirror for embedding in observability payloads. */
export type ConversationGuardrailAssessmentSnapshot = {
  pass: boolean;
  violations: ReadonlyArray<{ code: string; message: string }>;
  suggestedDowngradeAction: "none" | "force_knowledge_uncertain";
};

export type ConversationTurnObservability = {
  turnId: string;
  orderIndex: number;
  speakerType: CharacterConversationTurnSpeaker;
  createdAtIso: string;
  /** Deterministic one-liner (same family as sessionContext recent lines). */
  summaryLine: string;
  /** Present when speaker is character and payload exposes the field. */
  characterKnowledgeSource?: "known" | "belief" | "uncertain";
};

/** Drift signal summary from session `conversationAnchor` vs current identity snapshot. */
export type ConversationAnchorDriftSummary = {
  anchorPresent: boolean;
  driftDetected: boolean;
  driftSignals: string[];
};

export type ConversationObservabilitySnapshot = {
  contractVersion: typeof CONVERSATION_OBSERVABILITY_CONTRACT_VERSION;
  /** When this observability snapshot was materialized. */
  builtAtIso: string;
  /** {@link ConversationalIdentitySnapshot#builtAtIso} used for summaries and guardrail. */
  conversationalIdentityBuiltAtIso: string;
  session: ConversationSessionMetadata;
  identitySummary: ConversationIdentitySummary;
  readerMemorySummary: ConversationReaderMemorySummary | null;
  policySummary: ConversationPolicySummary;
  recentTurns: ConversationTurnObservability[];
  /** Guardrail on the latest persisted character turn, if any and parseable. */
  latestGuardrailAssessment: ConversationGuardrailAssessmentSnapshot | null;
  /** Detection-only drift diagnostics (no correction behavior). */
  conversationAnchorDrift: ConversationAnchorDriftSummary;
  /** P3-M compressed continuity hash from session metadata when available. */
  sessionMemorySummaryHash: string | null;
  emotionalContinuity: ConversationEmotionalContinuity;
  degradedInteraction: DegradedInteractionStateSummary;
  storylineExplainability: StorylineExplainabilitySummary | null;
};
