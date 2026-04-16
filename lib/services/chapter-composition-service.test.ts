import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ChapterCompositionService } from "@/lib/services/chapter-composition-service";

describe("chapter-composition-service", () => {
  it("builds multi-scene chapter composition with delayed convergence bindings", () => {
    const service = new ChapterCompositionService();
    const composition = service.compose({
      chapterId: "book1-chapter-01",
      chapterStateId: "book1-chapter-01",
      scenes: [
        {
          sceneId: "scene-01",
          sceneLabel: "household calibration",
          locationId: "natchitoches",
          activeThreadIds: ["continuity"],
          latentThreadIds: ["philosophy"],
          callbackThreadIds: [],
          distortedThreadIds: [],
          seededThreadIds: ["continuity"],
          echoNodeIds: [],
          hiddenConvergenceKeys: ["route-key-a"],
          delayedConvergenceBindings: ["route-key-a"],
          transitionToNextScene: "shift to social relay",
        },
        {
          sceneId: "scene-02",
          sceneLabel: "rumor arrival",
          locationId: "lower-river-market",
          activeThreadIds: ["route"],
          latentThreadIds: ["continuity"],
          callbackThreadIds: ["continuity"],
          distortedThreadIds: ["route"],
          seededThreadIds: [],
          echoNodeIds: [],
          hiddenConvergenceKeys: ["route-key-a"],
          delayedConvergenceBindings: ["route-key-a"],
          transitionToNextScene: "later convergence reveal",
        },
      ],
      chapterClosureProfile: "unresolved pressure carry-forward",
      chapterCarryForwardProfile: "callback in chapter-03",
    });
    assert.equal(composition.sceneSequence.length, 2);
    assert.equal(composition.convergingThreads.length > 0, true);
    assert.equal(service.hasSeemingDisconnectionSupport(composition), true);
  });
});
