/**
 * Phase 7 Expansion / Workstream 1 — deep telemetry model.
 * Explicitly observational and user-safe.
 */
export const TELEMETRY_DEPTH_CONTRACT_VERSION = "1" as const;

export const TELEMETRY_TAXONOMY = {
  entry: ["entry_started", "entry_completed", "reentry_started", "reentry_completed"] as const,
  mode: ["mode_switch_requested", "mode_switch_completed"] as const,
  progression: ["chapter_progression", "reading_checkpoint"] as const,
  interaction: ["interaction_entered", "interaction_abandoned", "interaction_completed"] as const,
  degraded: ["fallback_transition", "provider_degraded", "provider_recovered"] as const,
  moderation: ["moderation_evaluated", "moderation_blocked", "moderation_escalated"] as const,
  continuity: ["continuity_reconciliation_started", "continuity_reconciliation_completed"] as const,
  session: ["session_started", "session_resumed", "session_handoff", "session_ended"] as const,
  orchestration: ["experience_state_changed"] as const,
};

export type TelemetrySourceTag = "reader_client" | "orchestrator" | "moderation" | "degraded_policy" | "operator";
export type TelemetrySurfaceTag = "reader_surface" | "author_surface" | "operator_surface" | "internal_surface";

export type DeepTelemetryEvent = {
  contractVersion: typeof TELEMETRY_DEPTH_CONTRACT_VERSION;
  eventId: string;
  taxonomyGroup: keyof typeof TELEMETRY_TAXONOMY;
  taxonomyEvent: string;
  sourceTag: TelemetrySourceTag;
  surfaceTag: TelemetrySurfaceTag;
  atIso: string;
  correlation: {
    sessionId: string;
    storyId: string | null;
    bookId: string | null;
    requestId: string | null;
  };
  userSafeContext: Record<string, string | number | boolean | null>;
  observedStateOnly: true;
};
