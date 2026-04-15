export const READER_MODES = ["read", "feel", "guided", "listen"] as const;

export type ReaderMode = (typeof READER_MODES)[number];

export type ReaderModePresentationProfile = {
  mode: ReaderMode;
  displayLabel: "Read" | "Feel" | "Guided" | "Listen";
  isImmersive: boolean;
  isAudioLed: boolean;
  presentationOnly: true;
};
