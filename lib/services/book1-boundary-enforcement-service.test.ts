import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateBoundary } from "@/lib/services/book1-boundary-enforcement-service";

describe("book1 boundary enforcement", () => {
  it("separates scene prose from interpretive prose", () => {
    const scene = evaluateBoundary(
      "She stood by the misted river at dawn and felt the cold water as she moved along the bank.",
    );
    const interpretive = evaluateBoundary(
      "This pattern suggests the governance system behaves as a stabilizing mechanism compared with prior eras.",
    );

    assert.equal(scene.inferredCategory, "scene_fragment");
    assert.equal(interpretive.inferredCategory, "interpretive_passage");
  });

  it("rejects weak lineage candidates without structure", () => {
    const weak = evaluateBoundary("Ancestors and people shaped the tribe over centuries.");
    const strong = evaluateBoundary("Marta daughter of Joana married Paulo, and their son Elias was born in 1714.");

    assert.equal(weak.rejectedLineageCandidate, true);
    assert.notEqual(strong.inferredCategory, "atomic_claim");
  });
});
