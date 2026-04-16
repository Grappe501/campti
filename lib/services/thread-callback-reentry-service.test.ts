import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NarrativeThreadDerivationService } from "@/lib/services/narrative-thread-derivation-service";
import { ThreadCallbackReentryService } from "@/lib/services/thread-callback-reentry-service";

describe("thread-callback-reentry-service", () => {
  it("derives callback events and delayed convergence links", () => {
    const pack = new NarrativeThreadDerivationService().buildBook1SampleThreadPack();
    const threads = pack.threads.map((thread, threadIndex) => ({
      ...thread,
      nodes: thread.nodes.map((node, nodeIndex) =>
        threadIndex <= 1 && nodeIndex === 0
          ? {
              ...node,
              hiddenConvergenceKey: "shared-convergence-key",
            }
          : node,
      ),
    }));
    const service = new ThreadCallbackReentryService();
    const callbacks = service.deriveCallbackEvents(threads);
    const convergence = service.deriveDelayedConvergenceEvents(threads, "book1-chapter-04", "book1-ch04-sc01");
    assert.equal(callbacks.length > 0, true);
    assert.equal(convergence.length > 0, true);
  });

  it("builds multi-pov reinterpretation payload", () => {
    const thread = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads[2];
    const reinterpretation = new ThreadCallbackReentryService().deriveMultiPovReinterpretation({
      thread,
      sourcePov: "younger-kin-observer",
      targetPov: "elder-memory-holder",
      eventAnchorId: thread.nodes[0].threadNodeId,
      reinterpretationDelta: "Later understood as coded warning about route disruption.",
      explicitness: "medium",
    });
    assert.equal(reinterpretation.threadId, thread.threadId);
    assert.equal(reinterpretation.sourcePov !== reinterpretation.targetPov, true);
  });
});
