import type { ReaderLastMode } from "@prisma/client";

import type { ReaderMode, ReaderModePresentationProfile } from "@/lib/domain/reader-mode";

export function toCanonicalReaderMode(mode: ReaderLastMode | ReaderMode | null | undefined): ReaderMode {
  if (mode === "reading" || mode === "read") return "read";
  if (mode === "immersive" || mode === "feel") return "feel";
  if (mode === "guided") return "guided";
  if (mode === "listen") return "listen";
  return "read";
}

export function toLegacyReaderLastMode(mode: ReaderMode): ReaderLastMode {
  if (mode === "read") return "reading";
  if (mode === "feel") return "immersive";
  if (mode === "guided") return "guided";
  return "listen";
}

export function resolveReaderModePresentationProfile(mode: ReaderMode): ReaderModePresentationProfile {
  if (mode === "feel") {
    return {
      mode,
      displayLabel: "Feel",
      isImmersive: true,
      isAudioLed: false,
      presentationOnly: true,
    };
  }
  if (mode === "guided") {
    return {
      mode,
      displayLabel: "Guided",
      isImmersive: true,
      isAudioLed: false,
      presentationOnly: true,
    };
  }
  if (mode === "listen") {
    return {
      mode,
      displayLabel: "Listen",
      isImmersive: false,
      isAudioLed: true,
      presentationOnly: true,
    };
  }
  return {
    mode: "read",
    displayLabel: "Read",
    isImmersive: false,
    isAudioLed: false,
    presentationOnly: true,
  };
}

export function resolveReaderModeForSession(input: {
  persistedMode: ReaderLastMode | ReaderMode | null | undefined;
  requestedMode: ReaderMode | null | undefined;
}): ReaderMode {
  if (input.requestedMode) return input.requestedMode;
  return toCanonicalReaderMode(input.persistedMode);
}
