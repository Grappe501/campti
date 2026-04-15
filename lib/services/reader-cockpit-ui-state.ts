/**
 * P3-Q — Deterministic cockpit UI state helpers.
 *
 * Keeps frontend state transitions consistent with backend payload contracts.
 */
import type { ReaderCockpitPayload } from "@/lib/domain/reader-cockpit-payload";

export type CockpitFlowState = "idle" | "starting" | "active" | "paused" | "resuming" | "failed" | "ended";

export type CockpitUiAction =
  | "start_requested"
  | "start_succeeded"
  | "turn_sent"
  | "pause_requested"
  | "pause_succeeded"
  | "resume_requested"
  | "resume_succeeded"
  | "end_succeeded"
  | "request_failed";

export function reduceCockpitFlowState(current: CockpitFlowState, action: CockpitUiAction): CockpitFlowState {
  switch (action) {
    case "start_requested":
      return "starting";
    case "start_succeeded":
      return "active";
    case "turn_sent":
      return current === "paused" ? "paused" : "active";
    case "pause_requested":
      return "paused";
    case "pause_succeeded":
      return "paused";
    case "resume_requested":
      return "resuming";
    case "resume_succeeded":
      return "active";
    case "end_succeeded":
      return "ended";
    case "request_failed":
      return "failed";
    default:
      return current;
  }
}

export function deriveCockpitUiIndicators(payload: ReaderCockpitPayload | null): {
  sessionReusable: boolean;
  translationIndicator: "translated" | "native_when_available" | "native_unavailable" | "unknown";
  voiceAvailability: "ready" | "assigned_unavailable" | "missing_assignment";
  relationshipIndicator: string;
} {
  if (!payload) {
    return {
      sessionReusable: false,
      translationIndicator: "unknown",
      voiceAvailability: "missing_assignment",
      relationshipIndicator: "stranger",
    };
  }

  const sessionReusable = payload.activeSession?.status === "ACTIVE" || payload.activeSession?.status === "PAUSED";
  const pref = payload.presentationPlaybackPreference ?? "translated_default";
  const nativeAvailable = payload.voicePresentationReadiness.characterPresentationMode.nativeTongueAvailable;

  let translationIndicator: "translated" | "native_when_available" | "native_unavailable" | "unknown" = "unknown";
  if (pref === "translated_default") {
    translationIndicator = "translated";
  } else if (pref === "native_when_available") {
    translationIndicator = nativeAvailable ? "native_when_available" : "native_unavailable";
  }

  const voiceAvailability = payload.voicePresentationReadiness.hasTtsVoiceAssignment
    ? payload.voicePresentationReadiness.readyForVoicePlayback
      ? "ready"
      : "assigned_unavailable"
    : "missing_assignment";

  return {
    sessionReusable,
    translationIndicator,
    voiceAvailability,
    relationshipIndicator: payload.readerRelationshipProgression?.relationshipState ?? "stranger",
  };
}
