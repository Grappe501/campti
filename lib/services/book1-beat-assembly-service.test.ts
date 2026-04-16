import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1BeatAssemblyService, listBeatTypesUsed } from "@/lib/services/book1-beat-assembly-service";

describe("book1-beat-assembly-service", () => {
  it("builds validated chapter 1 machine beat chain", () => {
    const service = new Book1BeatAssemblyService();
    const { chain, cockpitSummary } = service.buildChapter1BeatAssembly();

    assert.equal(chain.artifact, "book1_chapter01_beat_assembly_chain");
    assert.equal(chain.chapter, 1);
    assert.equal(chain.beats.length, 10);
    assert.equal(chain.chainValidation.passed, true);

    const beatIds = chain.beats.map((beat) => beat.beatId);
    assert.equal(new Set(beatIds).size, chain.beats.length);
    assert.equal(chain.beats[0]?.beatType, "salience_lock_beat");
    assert.equal(chain.beats.at(-1)?.beatType, "consequence_seed_beat");

    const pressureLoads = chain.beats.map((beat) => beat.pressureLoad);
    for (let index = 1; index < pressureLoads.length; index += 1) {
      const delta = pressureLoads[index] - pressureLoads[index - 1];
      assert.equal(delta <= 0.35, true);
    }

    assert.equal(cockpitSummary.validationPassed, true);
    assert.equal(cockpitSummary.beatCount, chain.beats.length);
    assert.equal(cockpitSummary.socialFeedbackBeats >= 2, true);
  });

  it("uses required ontology classes in the chapter chain", () => {
    const service = new Book1BeatAssemblyService();
    const { chain } = service.buildChapter1BeatAssembly();
    const types = listBeatTypesUsed(chain);

    assert.equal(types.includes("salience_lock_beat"), true);
    assert.equal(types.includes("memory_comparison_beat"), true);
    assert.equal(types.includes("social_signal_beat"), true);
    assert.equal(types.includes("micro_decision_beat"), true);
    assert.equal(types.includes("pressure_escalation_beat"), true);
    assert.equal(types.includes("meaning_trace_beat"), true);
    assert.equal(types.includes("consequence_seed_beat"), true);
  });
});
