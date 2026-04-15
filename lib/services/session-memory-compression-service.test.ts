/**
 * P3-M session memory compression. Run: npx tsx --test lib/services/session-memory-compression-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import type { CharacterReaderMemory } from "@/lib/domain/character-reader-memory";
import {
  buildSessionMemorySummary,
  readSessionMemorySummaryFromMetadata,
} from "@/lib/services/session-memory-compression-service";

function sampleSession(): CharacterConversationSession {
  return {
    id: "session-1",
    characterId: "char-1",
    readerId: "reader-1",
    sceneId: "scene-1",
    status: "ACTIVE",
    interactionCount: 4,
    startedAt: new Date("2026-04-14T11:00:00.000Z"),
    lastInteractionAt: new Date("2026-04-14T11:08:00.000Z"),
    endedAt: null,
    metadataJson: null,
  };
}

function sampleReaderMemory(): CharacterReaderMemory {
  return {
    id: "crm-1",
    characterId: "char-1",
    readerId: "reader-1",
    familiarityLevel: 53,
    interactionCount: 4,
    knownFacts: { disclosed_name: "Ari" },
    relationshipNotes: null,
    firstInteractionAt: new Date("2026-04-14T10:00:00.000Z"),
    lastInteractionAt: new Date("2026-04-14T11:08:00.000Z"),
    metadataJson: null,
  };
}

function turns(): CharacterConversationTurn[] {
  const at = (s: string) => new Date(s);
  return [
    {
      id: "t1",
      sessionId: "session-1",
      orderIndex: 0,
      speakerType: "reader",
      payloadJson: { readerText: "My name is Ari. Can we trust your captain?" },
      createdAt: at("2026-04-14T11:01:00.000Z"),
    },
    {
      id: "t2",
      sessionId: "session-1",
      orderIndex: 1,
      speakerType: "character",
      payloadJson: {
        spokenResponse: "I carry my oath and I cannot betray the docks.",
        emotionalTone: "guarded",
      },
      createdAt: at("2026-04-14T11:02:00.000Z"),
    },
    {
      id: "t3",
      sessionId: "session-1",
      orderIndex: 2,
      speakerType: "reader",
      payloadJson: { readerText: "Will the gate open before dawn?" },
      createdAt: at("2026-04-14T11:03:00.000Z"),
    },
  ];
}

describe("buildSessionMemorySummary", () => {
  it("is stable for same transcript/session input", () => {
    const input = {
      session: sampleSession(),
      readerMemory: sampleReaderMemory(),
      turns: turns(),
      builtAtIso: "2026-04-14T12:00:00.000Z",
    };
    const a = buildSessionMemorySummary(input);
    const b = buildSessionMemorySummary(input);
    assert.deepEqual(a, b);
  });

  it("keeps output bounded", () => {
    const manyTurns: CharacterConversationTurn[] = [];
    for (let i = 0; i < 20; i++) {
      manyTurns.push({
        id: `rt-${i}`,
        sessionId: "session-1",
        orderIndex: i * 2,
        speakerType: "reader",
        payloadJson: { readerText: `My name is Reader${i}. What about gate ${i}?` },
        createdAt: new Date("2026-04-14T11:00:00.000Z"),
      });
      manyTurns.push({
        id: `ct-${i}`,
        sessionId: "session-1",
        orderIndex: i * 2 + 1,
        speakerType: "character",
        payloadJson: {
          spokenResponse: `I keep my promise for watch ${i}.`,
          emotionalTone: i % 2 ? "wary" : "steady",
        },
        createdAt: new Date("2026-04-14T11:00:01.000Z"),
      });
    }
    const out = buildSessionMemorySummary({
      session: sampleSession(),
      readerMemory: sampleReaderMemory(),
      turns: manyTurns,
      builtAtIso: "2026-04-14T12:00:00.000Z",
    });
    assert.ok(out.keyReaderDisclosures.length <= 6);
    assert.ok(out.keyCharacterDisclosures.length <= 6);
    assert.ok(out.unresolvedTopics.length <= 6);
    assert.ok(out.trustMovementSummary.length <= 120);
    assert.ok(out.emotionalBeatSummary.length <= 120);
  });

  it("preserves direct disclosures and unresolved topics", () => {
    const out = buildSessionMemorySummary({
      session: sampleSession(),
      readerMemory: sampleReaderMemory(),
      turns: turns(),
      builtAtIso: "2026-04-14T12:00:00.000Z",
    });
    assert.ok(out.keyReaderDisclosures.some((line) => line.includes("disclosed_name:Ari")));
    assert.ok(out.unresolvedTopics.some((line) => /trust your captain|gate open before dawn/i.test(line)));
  });

  it("reads persisted metadata payload shape", () => {
    const summary = buildSessionMemorySummary({
      session: sampleSession(),
      readerMemory: sampleReaderMemory(),
      turns: turns(),
      builtAtIso: "2026-04-14T12:00:00.000Z",
    });
    const parsed = readSessionMemorySummaryFromMetadata({
      sessionMemorySummary: summary,
    });
    assert.ok(parsed);
    assert.equal(parsed!.latestSessionSummaryHash, summary.latestSessionSummaryHash);
  });
});
