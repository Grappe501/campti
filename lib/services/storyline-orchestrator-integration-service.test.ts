import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assembleStorylineGuidanceBundle,
  buildStorylineOrchestrationInputsFromSeamContext,
} from "@/lib/services/storyline-orchestrator-integration-service";

describe("storyline-orchestrator-integration-service", () => {
  it("builds deterministic compact storyline guidance from subsystem outputs", () => {
    const orchestration = buildStorylineOrchestrationInputsFromSeamContext({
      mode: "interaction_mode",
      channel: "reader_bond_dyad",
      seamId: "reply-adapter",
      relationshipSignalCodes: ["signal_1", "signal_2", "signal_3", "signal_4"],
    });
    const input = {
      mode: "interaction_mode" as const,
      channel: "reader_bond_dyad" as const,
      orchestration,
    };
    const a = assembleStorylineGuidanceBundle(input);
    const b = assembleStorylineGuidanceBundle(input);

    assert.deepEqual(a, b);
    assert.ok(a.activeArcPriorities.length <= 5);
    assert.ok(a.currentNarrativeQuestions.length <= 8);
    assert.ok(a.sceneTendencyGuidance.allowedSceneTendencies.length <= 8);
    assert.ok(a.sceneTendencyGuidance.discouragedSceneTendencies.length <= 8);
    assert.ok(a.tensionEmphasisWeights.length <= 6);
  });

  it("enforces mode/channel restriction for scene mode", () => {
    const orchestration = buildStorylineOrchestrationInputsFromSeamContext({
      mode: "interaction_mode",
      channel: "reader_bond_dyad",
      seamId: "restriction-test",
      relationshipSignalCodes: ["signal_1"],
    });
    assert.throws(() =>
      assembleStorylineGuidanceBundle({
        mode: "scene_mode",
        channel: "reader_bond_dyad",
        orchestration,
      })
    );
  });
});
