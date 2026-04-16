import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildBook1ChapterStateSamplePack } from "@/lib/chapter-state/book1-state-pack-generator";

describe("book1-state-pack-generator", () => {
  it("builds a distinct chapter state sample pack for chapters 1-8", () => {
    const pack = buildBook1ChapterStateSamplePack();
    assert.equal(pack.artifact, "book1_chapter_state_sample_pack");
    assert.equal(pack.states.length, 8);
    assert.equal(pack.beatProfiles.length, 8);
    assert.equal(pack.states[0].sequenceNumber, 1);
    assert.equal(pack.states[7].sequenceNumber, 8);
    assert.equal(pack.states[0].stateAxes.movement_pressure.score < pack.states[7].stateAxes.movement_pressure.score, true);
    assert.equal(pack.states[0].stateAxes.meaning_load.score < pack.states[7].stateAxes.meaning_load.score, true);
  });

  it("derives beat profile differences from state evolution", () => {
    const pack = buildBook1ChapterStateSamplePack();
    const chapter1Consequence = pack.beatProfiles[0].topWeightedBeatTypes.find(
      (entry) => entry.beatType === "consequence_seed_beat",
    );
    const chapter8Consequence = pack.beatProfiles[7].topWeightedBeatTypes.find(
      (entry) => entry.beatType === "consequence_seed_beat",
    );
    assert.equal(Boolean(chapter8Consequence), true);
    assert.equal((chapter8Consequence?.weight ?? 0) > (chapter1Consequence?.weight ?? 0), true);
  });
});
