import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildReaderContinuityFromAuthority,
  computeContinuityDivergence,
  reconcileContinuityAuthority,
} from "@/lib/services/reader-continuity-service";

describe("reader-continuity-service", () => {
  it("builds DB-authoritative continuity envelope", () => {
    const continuity = buildReaderContinuityFromAuthority({
      readerState: {
        sessionId: "reader-session-1",
        lastSceneId: "scene-1",
        lastMetaSceneId: "chapter-2",
        lastScrollKey: "scene-1:read",
        scrollAnchorY: 140,
        lastCharacterId: "character-1",
        lastInteractionAt: new Date("2026-04-15T10:00:00.000Z"),
      },
      interactionSession: {
        id: "interaction-session-1",
        status: "PAUSED",
        metadataJson: {
          interactiveOrchestration: {
            narrativeResumeToken: "resume:interaction-session-1:scene-1",
          },
        },
      },
    });
    assert.equal(continuity.sourceOfTruth, "reader_state_db");
    assert.equal(continuity.position.sceneId, "scene-1");
    assert.equal(continuity.sessionLinkage.interactionSessionStatus, "PAUSED");
    assert.equal(
      continuity.interactionAnchor.narrativeResumeToken,
      "resume:interaction-session-1:scene-1"
    );
  });

  it("marks cache mismatch and requires write-through", () => {
    const continuity = buildReaderContinuityFromAuthority({
      readerState: {
        sessionId: "reader-session-1",
        lastSceneId: "scene-10",
        lastMetaSceneId: "chapter-3",
        lastScrollKey: null,
        scrollAnchorY: null,
        lastCharacterId: null,
        lastInteractionAt: new Date("2026-04-15T12:00:00.000Z"),
      },
      interactionSession: null,
    });
    const divergence = computeContinuityDivergence({
      continuity,
      cache: {
        chapterId: "chapter-2",
        sceneId: "scene-9",
        chapterTitle: "Chapter Two",
        sceneLabel: "Old scene",
        savedAtEpochMs: Date.parse("2026-04-15T11:00:00.000Z"),
        scrollAnchorY: 44,
        scrollBySceneId: { "scene-9": 44 },
        lastMode: "read",
        continuationHeadline: null,
        mood: null,
        returnHookLine: null,
      },
    });
    assert.equal(divergence.sceneMismatch, true);
    assert.equal(divergence.chapterMismatch, true);

    const reconciled = reconcileContinuityAuthority({
      continuity,
      cache: {
        chapterId: "chapter-2",
        sceneId: "scene-9",
        chapterTitle: "Chapter Two",
        sceneLabel: "Old scene",
        savedAtEpochMs: Date.parse("2026-04-15T11:00:00.000Z"),
        scrollAnchorY: 44,
        scrollBySceneId: { "scene-9": 44 },
        lastMode: "read",
        continuationHeadline: null,
        mood: null,
        returnHookLine: null,
      },
      bootstrappedFromCache: false,
    });
    assert.equal(reconciled.cacheDirective.writeThrough, true);
    assert.equal(reconciled.cacheDirective.reason, "db_authority_overrode_cache");
  });
});
