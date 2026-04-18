/**
 * Zod contracts for Character Simulation Workbench metadata and preview requests.
 * Run: npx tsx --test lib/domain/character-simulation-workbench-validation.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CharacterSimulationPreviewRequestSchema,
  CharacterSimulationWorkbenchMetaSchema,
} from "@/lib/domain/character-simulation-workbench-validation";

describe("CharacterSimulationWorkbenchMetaSchema", () => {
  it("rejects unknown keys (strict)", () => {
    const r = CharacterSimulationWorkbenchMetaSchema.safeParse({ authorNotes: [], extra: true });
    assert.equal(r.success, false);
  });
});

describe("CharacterSimulationPreviewRequestSchema", () => {
  it("accepts all preview modes", () => {
    for (const mode of ["inner_monologue", "spoken_response", "stress_response", "decision_bias", "interpersonal_reaction"] as const) {
      const r = CharacterSimulationPreviewRequestSchema.safeParse({
        mode,
        stimulus: "A trusted ally questions their loyalty.",
      });
      assert.equal(r.success, true);
    }
  });
});
