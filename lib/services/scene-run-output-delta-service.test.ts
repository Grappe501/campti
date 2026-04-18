/**
 * Bounded run output delta (node:test).
 * Run: npx tsx --test lib/services/scene-run-output-delta-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeBoundedSceneRunOutputDiff,
  entityMentionDeltas,
  summarizeOutputStructure,
} from "@/lib/services/scene-run-output-delta-service";

describe("summarizeOutputStructure", () => {
  it("counts blank-line paragraphs", () => {
    const s = summarizeOutputStructure("A\n\nB\n\nC");
    assert.equal(s.paragraphCount, 3);
    assert.equal(s.characterCount, 7);
  });

  it("detects beat-like markers heuristically", () => {
    assert.equal(summarizeOutputStructure("plain").hasBeatLikeMarkers, false);
    assert.equal(summarizeOutputStructure("## Beat: x").hasBeatLikeMarkers, true);
  });
});

describe("entityMentionDeltas", () => {
  it("uses lexicon labels only (case-insensitive counts)", () => {
    const d = entityMentionDeltas("cheesa went out", "Cheesa met Cheesa", [
      { id: "1", kind: "person", name: "Cheesa" },
      { id: "2", kind: "place", name: "Nowhere" },
    ]);
    assert.equal(d.length, 1);
    assert.equal(d[0]?.label, "Cheesa");
    assert.equal(d[0]?.countA, 1);
    assert.equal(d[0]?.countB, 2);
    assert.equal(d[0]?.delta, 1);
  });

  it("omits entities absent from both texts", () => {
    const d = entityMentionDeltas("x", "y", [{ id: "1", kind: "person", name: "Absent" }]);
    assert.equal(d.length, 0);
  });
});

describe("computeBoundedSceneRunOutputDiff", () => {
  const lex = [{ id: "p", kind: "person" as const, name: "Ada" }];

  it("reports length and paragraph deltas", () => {
    const a = "word ".repeat(200);
    const b = a + "x".repeat(500);
    const sa = summarizeOutputStructure(a);
    const sb = summarizeOutputStructure(b);
    const d = computeBoundedSceneRunOutputDiff(a, b, "fo", "fo", "fe", "fe", sa, sb, lex);
    assert.ok(d.length.charDelta && d.length.charDelta > 400);
    assert.ok(d.signals.some((s) => s.code === "length_shift"));
  });

  it("flags opening and ending fingerprint changes without inventing prose judgments", () => {
    const t = "Same body ".repeat(30);
    const d = computeBoundedSceneRunOutputDiff(t, t, "openA", "openB", "endA", "endA", summarizeOutputStructure(t), summarizeOutputStructure(t), lex);
    assert.equal(d.opening.changed, true);
    assert.equal(d.ending.changed, false);
    assert.ok(!d.opening.summary.toLowerCase().includes("better"));
  });

  it("handles one empty output as bounded existence signal", () => {
    const tb = "Hello world.";
    const d = computeBoundedSceneRunOutputDiff("", tb, "", "o", "", "e", summarizeOutputStructure(""), summarizeOutputStructure(tb), lex);
    assert.equal(d.existence.aPresent, false);
    assert.equal(d.existence.bPresent, true);
    assert.ok(d.existence.summary.includes("empty"));
  });
});
