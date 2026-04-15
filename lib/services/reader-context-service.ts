/**
 * P3-L — Reader context preference service.
 *
 * Primary narrative integrity boundary: this service must only manage product/session preferences.
 * It must never write canonical truth, character-bounded knowledge, or reader interaction memory.
 */
import { Prisma, type ReaderContextPreference } from "@prisma/client";

import type { ReaderContext, UpdateReaderContextPreferencesInput } from "@/lib/domain/reader-context";
import {
  DEFAULT_READER_CONTEXT_AUDIO_ENABLED,
  DEFAULT_READER_CONTEXT_NATIVE_TONGUE_TOGGLE,
  DEFAULT_READER_CONTEXT_PREFERRED_LANGUAGE_CODE,
  DEFAULT_READER_CONTEXT_VOICE_PLAYBACK_SPEED,
} from "@/lib/domain/reader-context";
import { prisma } from "@/lib/prisma";

function toDomain(row: ReaderContextPreference): ReaderContext {
  return {
    readerId: row.readerId,
    preferredPresentationLanguageCode: row.preferredPresentationLanguageCode,
    preferredAudioEnabled: row.preferredAudioEnabled,
    preferredNativeTongueToggleDefault: row.preferredNativeTongueToggleDefault,
    preferredVoicePlaybackSpeed: row.preferredVoicePlaybackSpeed,
    metadataJson: row.metadataJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function requireReaderId(readerId: string): string {
  const id = readerId.trim();
  if (!id) {
    throw new Error("[reader-context] readerId is required.");
  }
  return id;
}

function normalizeLanguageCode(input: string | undefined): string | undefined {
  if (input === undefined) return undefined;
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    throw new Error("[reader-context] preferredPresentationLanguageCode cannot be empty.");
  }
  return normalized;
}

function normalizePlaybackSpeed(input: number | undefined): number | undefined {
  if (input === undefined) return undefined;
  if (!Number.isFinite(input) || input < 0.5 || input > 2.0) {
    throw new Error("[reader-context] preferredVoicePlaybackSpeed must be a finite number between 0.5 and 2.0.");
  }
  return Number(input.toFixed(2));
}

export async function getReaderContext(readerId: string): Promise<ReaderContext | null> {
  const id = requireReaderId(readerId);
  const row = await prisma.readerContextPreference.findUnique({
    where: { readerId: id },
  });
  return row ? toDomain(row) : null;
}

export async function getOrCreateReaderContext(readerId: string): Promise<ReaderContext> {
  const id = requireReaderId(readerId);
  const row = await prisma.readerContextPreference.upsert({
    where: { readerId: id },
    create: {
      readerId: id,
      preferredPresentationLanguageCode: DEFAULT_READER_CONTEXT_PREFERRED_LANGUAGE_CODE,
      preferredAudioEnabled: DEFAULT_READER_CONTEXT_AUDIO_ENABLED,
      preferredNativeTongueToggleDefault: DEFAULT_READER_CONTEXT_NATIVE_TONGUE_TOGGLE,
      preferredVoicePlaybackSpeed: DEFAULT_READER_CONTEXT_VOICE_PLAYBACK_SPEED,
    },
    update: {},
  });
  return toDomain(row);
}

export async function updateReaderContextPreferences(
  readerId: string,
  updates: UpdateReaderContextPreferencesInput
): Promise<ReaderContext> {
  const id = requireReaderId(readerId);
  const nextLanguageCode = normalizeLanguageCode(updates.preferredPresentationLanguageCode);
  const nextPlaybackSpeed = normalizePlaybackSpeed(updates.preferredVoicePlaybackSpeed);

  const row = await prisma.readerContextPreference.upsert({
    where: { readerId: id },
    create: {
      readerId: id,
      preferredPresentationLanguageCode:
        nextLanguageCode ?? DEFAULT_READER_CONTEXT_PREFERRED_LANGUAGE_CODE,
      preferredAudioEnabled:
        updates.preferredAudioEnabled ?? DEFAULT_READER_CONTEXT_AUDIO_ENABLED,
      preferredNativeTongueToggleDefault:
        updates.preferredNativeTongueToggleDefault ?? DEFAULT_READER_CONTEXT_NATIVE_TONGUE_TOGGLE,
      preferredVoicePlaybackSpeed:
        nextPlaybackSpeed ?? DEFAULT_READER_CONTEXT_VOICE_PLAYBACK_SPEED,
      ...(updates.metadataJson !== undefined
        ? {
            metadataJson:
              updates.metadataJson === null
                ? Prisma.JsonNull
                : updates.metadataJson,
          }
        : {}),
    },
    update: {
      ...(nextLanguageCode !== undefined
        ? { preferredPresentationLanguageCode: nextLanguageCode }
        : {}),
      ...(updates.preferredAudioEnabled !== undefined
        ? { preferredAudioEnabled: updates.preferredAudioEnabled }
        : {}),
      ...(updates.preferredNativeTongueToggleDefault !== undefined
        ? { preferredNativeTongueToggleDefault: updates.preferredNativeTongueToggleDefault }
        : {}),
      ...(nextPlaybackSpeed !== undefined
        ? { preferredVoicePlaybackSpeed: nextPlaybackSpeed }
        : {}),
      ...(updates.metadataJson !== undefined
        ? {
            metadataJson:
              updates.metadataJson === null
                ? Prisma.JsonNull
                : updates.metadataJson,
          }
        : {}),
    },
  });

  return toDomain(row);
}
