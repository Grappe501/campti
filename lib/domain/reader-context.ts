/**
 * P3-L — Reader product/session preference context.
 *
 * This layer is strictly for product defaults and presentation preferences.
 * It is not canonical story truth, not character cognition, and not interaction memory.
 */
import type { Prisma } from "@prisma/client";

export const DEFAULT_READER_CONTEXT_PREFERRED_LANGUAGE_CODE = "en" as const;
export const DEFAULT_READER_CONTEXT_AUDIO_ENABLED = true as const;
export const DEFAULT_READER_CONTEXT_NATIVE_TONGUE_TOGGLE = false as const;
export const DEFAULT_READER_CONTEXT_VOICE_PLAYBACK_SPEED = 1 as const;

export type ReaderContext = {
  readerId: string;
  preferredPresentationLanguageCode: string;
  preferredAudioEnabled: boolean;
  preferredNativeTongueToggleDefault: boolean;
  preferredVoicePlaybackSpeed: number;
  metadataJson: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateReaderContextPreferencesInput = {
  preferredPresentationLanguageCode?: string;
  preferredAudioEnabled?: boolean;
  preferredNativeTongueToggleDefault?: boolean;
  preferredVoicePlaybackSpeed?: number;
  metadataJson?: Prisma.InputJsonValue | null;
};
