/**
 * P3-K narrative OS bridge. Run: npx tsx --test lib/services/narrative-interaction-observability-bridge.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import { buildInteractionObservabilitySummary } from "@/lib/services/narrative-interaction-observability-bridge";

describe("buildInteractionObservabilitySummary", () => {
  it("marks summaries as non-canonical", () => {
    const s: CharacterConversationSession = {
      id: "sess",
      characterId: "c",
      readerId: "r",
      sceneId: "sc",
      status: "ACTIVE",
      interactionCount: 2,
      startedAt: new Date(),
      lastInteractionAt: new Date(),
      endedAt: null,
      metadataJson: null,
    };
    const o = buildInteractionObservabilitySummary(s);
    assert.equal(o.nonCanonical, true);
    assert.equal(o.sessionId, "sess");
  });
});
