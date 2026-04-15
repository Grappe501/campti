/**
 * P3-L reader context preferences. Run: npx tsx --test lib/services/reader-context-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import {
  DEFAULT_READER_CONTEXT_AUDIO_ENABLED,
  DEFAULT_READER_CONTEXT_NATIVE_TONGUE_TOGGLE,
  DEFAULT_READER_CONTEXT_PREFERRED_LANGUAGE_CODE,
  DEFAULT_READER_CONTEXT_VOICE_PLAYBACK_SPEED,
} from "@/lib/domain/reader-context";
import { prisma } from "@/lib/prisma";
import { getCharacterReaderMemory } from "@/lib/services/character-reader-memory-service";
import {
  getOrCreateReaderContext,
  getReaderContext,
  updateReaderContextPreferences,
} from "@/lib/services/reader-context-service";

const READER = "p3l-reader-context-test-reader";

describe("reader-context-service", () => {
  let enabled = false;
  let characterId = "";

  before(async () => {
    enabled = false;
    try {
      await prisma.$connect();
      const p = await prisma.person.findFirst({
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (!p) return;
      characterId = p.id;
      await prisma.readerContextPreference.deleteMany({
        where: { readerId: READER },
      });
      await prisma.characterReaderMemory.deleteMany({
        where: { readerId: READER },
      });
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled) return;
    try {
      await prisma.readerContextPreference.deleteMany({
        where: { readerId: READER },
      });
      await prisma.characterReaderMemory.deleteMany({
        where: { readerId: READER },
      });
    } catch {
      /* best-effort */
    }
  });

  it("getReaderContext returns null before creation", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Person row, and migrated schema");
      return;
    }
    const row = await getReaderContext(READER);
    assert.equal(row, null);
  });

  it("getOrCreateReaderContext creates deterministic defaults", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Person row, and migrated schema");
      return;
    }
    const row = await getOrCreateReaderContext(READER);
    assert.equal(row.readerId, READER);
    assert.equal(
      row.preferredPresentationLanguageCode,
      DEFAULT_READER_CONTEXT_PREFERRED_LANGUAGE_CODE
    );
    assert.equal(row.preferredAudioEnabled, DEFAULT_READER_CONTEXT_AUDIO_ENABLED);
    assert.equal(
      row.preferredNativeTongueToggleDefault,
      DEFAULT_READER_CONTEXT_NATIVE_TONGUE_TOGGLE
    );
    assert.equal(
      row.preferredVoicePlaybackSpeed,
      DEFAULT_READER_CONTEXT_VOICE_PLAYBACK_SPEED
    );
  });

  it("updateReaderContextPreferences persists updates and normalizes language code", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Person row, and migrated schema");
      return;
    }
    const updated = await updateReaderContextPreferences(READER, {
      preferredPresentationLanguageCode: " FR ",
      preferredAudioEnabled: false,
      preferredNativeTongueToggleDefault: true,
      preferredVoicePlaybackSpeed: 1.25,
      metadataJson: { source: "test" },
    });
    assert.equal(updated.preferredPresentationLanguageCode, "fr");
    assert.equal(updated.preferredAudioEnabled, false);
    assert.equal(updated.preferredNativeTongueToggleDefault, true);
    assert.equal(updated.preferredVoicePlaybackSpeed, 1.25);
    assert.deepEqual(updated.metadataJson, { source: "test" });

    const loaded = await getReaderContext(READER);
    assert.ok(loaded);
    assert.equal(loaded!.preferredPresentationLanguageCode, "fr");
    assert.equal(loaded!.preferredAudioEnabled, false);
  });

  it("remains separate from character memory rows", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL, Person row, and migrated schema");
      return;
    }
    await updateReaderContextPreferences(READER, {
      preferredPresentationLanguageCode: "es",
    });
    const memory = await getCharacterReaderMemory(characterId, READER);
    assert.equal(memory, null);
  });
});
