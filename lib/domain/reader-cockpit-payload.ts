/**
 * P3-A — Reader cockpit **read model** — single aggregate payload for a future UI shell.
 *
 * No routing or rendering here; consumers treat this as a bounded snapshot at `builtAtIso`.
 */

import type { CharacterPresentationMode } from "@/lib/domain/translation-presentation";
import type {
  ConversationIdentitySummary,
  ConversationSessionMetadata,
  ConversationTurnObservability,
} from "@/lib/domain/conversation-observability";
import type { ConversationEmotionalContinuity } from "@/lib/domain/conversation-emotional-continuity";
import type { ConversationalIdentityPolicy } from "@/lib/domain/conversational-identity-snapshot";
import type {
  DegradedInteractionPolicy,
  DegradedInteractionStateSummary,
} from "@/lib/domain/degraded-interaction-policy";
import type { ReaderInteractionLedgerSessionSummary } from "@/lib/domain/reader-interaction-ledger";
import type { NarrationMode } from "@/lib/domain/narration-modes";
import type { ReaderRelationshipProgression } from "@/lib/domain/reader-relationship-progression";
import type { SessionMemorySummary } from "@/lib/domain/session-memory-summary";
import type { ReaderEntitlementPlanType } from "@/lib/domain/reader-entitlement";

export const READER_COCKPIT_PAYLOAD_CONTRACT_VERSION = "1" as const;

/** Scene slice for “where in the book” context when a session is scoped to a scene. */
export type ReaderCockpitSceneInteractionContext = {
  sceneId: string;
  /** Short excerpt of `Scene.description` (bounded length at assembly time). */
  descriptionExcerpt: string;
  orderInChapter: number | null;
  chapterTitle: string | null;
  bookTitle: string | null;
};

/**
 * Slim identity view aligned with {@link ConversationIdentitySummary} plus knowledge/memory headlines.
 */
export type ReaderCockpitConversationalIdentitySummary = ConversationIdentitySummary & {
  snapshotBuiltAtIso: string;
  knowledgeBoundary: {
    knownFactsLineCount: number;
    believedFactsLineCount: number;
    unknownDomainsLineCount: number;
  };
  /** From session snapshot context when present; dyadic P2-G interaction count. */
  readerMemoryInteractionCount: number | null;
};

/** P2-S + P2-T readiness hints — no audio bytes. */
export type ReaderCockpitVoicePresentationReadiness = {
  characterPresentationMode: CharacterPresentationMode;
  hasTtsVoiceAssignment: boolean;
  /** Product-level gate: assigned voice + active (or addressable) session for synthesis routing. */
  readyForVoicePlayback: boolean;
  preferredAudioEnabled: boolean;
  preferredVoicePlaybackSpeed: number;
};

/** Ledger aggregates (P2-V) + explicit narration mode label (P2-Z). */
export type ReaderCockpitCostEstimateSummary = {
  narrationMode: NarrationMode;
  ledgerSessionSummary: ReaderInteractionLedgerSessionSummary | null;
};

/** P3-G — Presentation-only playback preference (does not alter cognition). */
export type ReaderCockpitPresentationPlaybackPreference = "translated_default" | "native_when_available";

/** P3-L — Product/session preference context only (never canon or character cognition). */
export type ReaderCockpitReaderContextPreferenceSummary = {
  preferredPresentationLanguageCode: string;
  preferredAudioEnabled: boolean;
  preferredNativeTongueToggleDefault: boolean;
  preferredVoicePlaybackSpeed: number;
};

export type ReaderCockpitPayload = {
  contractVersion: typeof READER_COCKPIT_PAYLOAD_CONTRACT_VERSION;
  builtAtIso: string;
  readerId: string;
  characterId: string;

  /** Current or requested session; null when none resolved. */
  activeSession: ConversationSessionMetadata | null;

  sceneInteractionContext: ReaderCockpitSceneInteractionContext | null;

  conversationalIdentitySummary: ReaderCockpitConversationalIdentitySummary | null;

  readerRelationshipProgression?: ReaderRelationshipProgression | null;
  emotionalContinuity?: ConversationEmotionalContinuity | null;

  /** Newest-first capped list is assembled in the service (default 12). */
  latestTranscriptTurns: ConversationTurnObservability[];

  voicePresentationReadiness: ReaderCockpitVoicePresentationReadiness;

  costEstimateSummary: ReaderCockpitCostEstimateSummary;

  /** From the conversational identity snapshot when present. */
  policySummary: ConversationalIdentityPolicy | null;

  /** Session metadata preference when a session exists; default translated. */
  presentationPlaybackPreference?: ReaderCockpitPresentationPlaybackPreference;

  readerContextPreferences?: ReaderCockpitReaderContextPreferenceSummary;

  /** P3-M deterministic session continuity compression when available on metadata. */
  sessionMemorySummary?: SessionMemorySummary | null;

  /** P3-H — Generic interaction units remaining for this reader (not currency). */
  interactionBalance?: {
    availableUnits: number;
  };
  entitlement?: {
    planType: ReaderEntitlementPlanType;
    monthlyUnitAllowance: number;
    remainingUnitBalance: number;
    featureFlags: Record<string, boolean>;
    entitlementStartAtIso: string;
    entitlementEndAtIso: string | null;
  };
  interactionBalanceStatus?: {
    state: "available" | "unavailable";
    unavailableReason?: "schema_missing" | "provider_failure" | "unknown_runtime_unavailable";
  };
  interactionDegradedPolicy?: DegradedInteractionPolicy | null;
  degradedInteraction?: DegradedInteractionStateSummary;
  providerResilience?: {
    llm: "healthy" | "degraded" | "failed";
    voice: "healthy" | "degraded" | "failed";
    payment: "healthy" | "degraded" | "failed";
    lastUpdatedAtIso: string;
    lastReason: string | null;
  };
};
