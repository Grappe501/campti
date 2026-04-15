/**
 * P2-T Character TTS voice assignment (integration, optional DB).
 * Run: npx tsx --test lib/services/character-voice-profile-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import {
  getCharacterVoiceProfile,
  listCharactersWithVoiceProfiles,
  upsertCharacterVoiceProfile,
} from "@/lib/services/character-voice-profile-service";

const TEST_MARKER = "p2t-voice-test-marker";

describe("character-voice-profile-service (integration)", () => {
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
      try {
        await prisma.characterTtsVoiceProfile.deleteMany({
          where: { characterId },
        });
      } catch {
        /* table may not exist until migration is applied */
      }
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled || !characterId) return;
    try {
      await prisma.characterTtsVoiceProfile.deleteMany({
        where: { characterId },
      });
    } catch {
      /* best-effort */
    }
  });

  it("upsert + get + listCharactersWithVoiceProfiles", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }

    const created = await upsertCharacterVoiceProfile({
      characterId,
      provider: "elevenlabs",
      externalVoiceId: "voice_xyz_1",
      displayLabel: "Test narrator",
      emotionalRangeJson: { low: 0, high: 1 },
      metadataJson: { source: TEST_MARKER },
    });
    assert.equal(created.characterId, characterId);
    assert.equal(created.provider, "elevenlabs");
    assert.equal(created.externalVoiceId, "voice_xyz_1");
    assert.equal(created.displayLabel, "Test narrator");

    const got = await getCharacterVoiceProfile(characterId);
    assert.ok(got);
    assert.equal(got!.id, created.id);

    const listed = await listCharactersWithVoiceProfiles();
    const mine = listed.find((x) => x.characterId === characterId);
    assert.ok(mine);
    assert.equal(mine!.voiceProfile.externalVoiceId, "voice_xyz_1");
    assert.ok(typeof mine!.characterName === "string" && mine!.characterName.length > 0);

    const updated = await upsertCharacterVoiceProfile({
      characterId,
      provider: "other",
      externalVoiceId: "voice_alt",
      displayLabel: "Updated label",
    });
    assert.equal(updated.provider, "other");
    assert.equal(updated.externalVoiceId, "voice_alt");

    const got2 = await getCharacterVoiceProfile(characterId);
    assert.equal(got2!.provider, "other");
  });

  it("getCharacterVoiceProfile returns null for unknown id", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and Person");
      return;
    }
    const got = await getCharacterVoiceProfile("nonexistent-character-id-xyz");
    assert.equal(got, null);
  });
});
