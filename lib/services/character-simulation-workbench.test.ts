/**
 * Character Simulation Workbench — node:test coverage for validation, conflicts, preview, readiness.
 * Run: npx tsx --test lib/services/character-simulation-workbench.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CharacterMindProfileSchema } from "@/lib/domain/character-mind";
import { CharacterVoiceProfileSchema } from "@/lib/domain/character-voice";
import {
  CharacterSimulationPreviewRequestSchema,
  CharacterSimulationWorkbenchMetaSchema,
  mergeValidationResults,
  validateAuthorMindPartialShape,
  validateAuthorVoicePartialShape,
} from "@/lib/domain/character-simulation-workbench-validation";
import { detectCharacterSimulationConflicts } from "@/lib/services/character-simulation-workbench-conflict-service";
import { buildCharacterSimulationPreview } from "@/lib/services/character-simulation-workbench-preview-service";
import {
  buildCharacterSimulationDriftSummary,
  deriveCharacterSimulationReadinessImpact,
  readinessImpactToFlags,
} from "@/lib/services/character-simulation-workbench-readiness-impact-service";
import { CharacterMindSeedService } from "@/lib/services/character-mind-seed-service";
import { saveCharacterSimulationWorkbenchAuthorProfile } from "@/lib/services/character-simulation-workbench-save-service";

const seed = new CharacterMindSeedService();

describe("character-simulation-workbench validation", () => {
  it("rejects invalid changeResistance range on mind partial", () => {
    const r = validateAuthorMindPartialShape({ characterId: "p1", changeResistance: 2 });
    assert.equal(r.ok, false);
  });

  it("accepts minimal valid mind partial", () => {
    const r = validateAuthorMindPartialShape({ characterId: "p1", coreDesire: "wants safety" });
    assert.equal(r.ok, true);
  });

  it("rejects invalid vocabularyRange on voice partial", () => {
    const r = validateAuthorVoicePartialShape({ characterId: "p1", vocabularyRange: "huge" });
    assert.equal(r.ok, false);
  });

  it("Workbench meta schema accepts author notes", () => {
    const r = CharacterSimulationWorkbenchMetaSchema.safeParse({ authorNotes: ["note a"], acceptedConflictIds: ["x"] });
    assert.equal(r.success, true);
  });

  it("Preview request schema enforces stimulus length", () => {
    const bad = CharacterSimulationPreviewRequestSchema.safeParse({ mode: "inner_monologue", stimulus: "no" });
    assert.equal(bad.success, false);
  });
});

describe("character-simulation-workbench conflicts", () => {
  it("detects worldview mismatch between author and seed", () => {
    const id = "person-worldview-clash";
    const seedMind = seed.buildMindProfile({ characterId: id, displayLabel: "Test" });
    const seedVoice = seed.buildVoiceProfile({ characterId: id, displayLabel: "Test" });
    const conflicts = detectCharacterSimulationConflicts({
      seedMind,
      seedVoice,
      authorMindPartial: { worldviewFrame: "Technology solves every human wound without cost." },
      authorVoicePartial: {},
      meta: {},
      personBirthYear: 1800,
      personDeathYear: 1880,
    });
    assert.ok(conflicts.some((c) => c.category === "worldview_conflict"));
  });

  it("blocks on impossible person years", () => {
    const id = "person-years";
    const seedMind = seed.buildMindProfile({ characterId: id, displayLabel: "Test" });
    const seedVoice = seed.buildVoiceProfile({ characterId: id, displayLabel: "Test" });
    const conflicts = detectCharacterSimulationConflicts({
      seedMind,
      seedVoice,
      authorMindPartial: {},
      authorVoicePartial: {},
      meta: {},
      personBirthYear: 1900,
      personDeathYear: 1850,
    });
    const b = conflicts.find((c) => c.category === "timeline_truth_conflict");
    assert.ok(b?.blocksGenerationReadiness);
  });

  it("blocks on empty core beliefs patch", () => {
    const id = "person-belief";
    const seedMind = seed.buildMindProfile({ characterId: id, displayLabel: "Test" });
    const seedVoice = seed.buildVoiceProfile({ characterId: id, displayLabel: "Test" });
    const conflicts = detectCharacterSimulationConflicts({
      seedMind,
      seedVoice,
      authorMindPartial: { beliefSystem: { coreBeliefs: [], brittleAssumptions: seedMind.beliefSystem.brittleAssumptions } },
      authorVoicePartial: {},
      meta: {},
      personBirthYear: null,
      personDeathYear: null,
    });
    assert.ok(conflicts.some((c) => c.category === "merged_profile_instability" && c.blocksGenerationReadiness));
  });
});

describe("character-simulation-workbench preview", () => {
  it("is deterministic for identical inputs", () => {
    const id = "prev-det";
    const mind = seed.buildMindProfile({ characterId: id, displayLabel: "Prev" });
    const voice = seed.buildVoiceProfile({ characterId: id, displayLabel: "Prev" });
    const a = buildCharacterSimulationPreview({
      request: { mode: "inner_monologue", stimulus: "They are accused publicly of betrayal." },
      mergedMind: mind,
      mergedVoice: voice,
      driftWarnings: [],
      usesAuthorOverlay: false,
    });
    const b = buildCharacterSimulationPreview({
      request: { mode: "inner_monologue", stimulus: "They are accused publicly of betrayal." },
      mergedMind: mind,
      mergedVoice: voice,
      driftWarnings: [],
      usesAuthorOverlay: false,
    });
    assert.equal(a.deterministicPreviewId, b.deterministicPreviewId);
    assert.equal(a.text, b.text);
  });

  it("lowers confidence when drift warnings present", () => {
    const id = "prev-low";
    const mind = seed.buildMindProfile({ characterId: id, displayLabel: "Low" });
    const voice = seed.buildVoiceProfile({ characterId: id, displayLabel: "Low" });
    const r = buildCharacterSimulationPreview({
      request: { mode: "stress_response", stimulus: "A child asks them why they lied." },
      mergedMind: mind,
      mergedVoice: voice,
      driftWarnings: ["warning:worldview_conflict"],
      usesAuthorOverlay: true,
    });
    assert.equal(r.confidenceLabel, "medium");
  });
});

describe("character-simulation-workbench readiness", () => {
  it("marks blocked when timeline conflict open", () => {
    const seedMind = seed.buildMindProfile({ characterId: "x", displayLabel: "X" });
    const seedVoice = seed.buildVoiceProfile({ characterId: "x", displayLabel: "X" });
    const conflicts = detectCharacterSimulationConflicts({
      seedMind,
      seedVoice,
      authorMindPartial: {},
      authorVoicePartial: {},
      meta: {},
      personBirthYear: 1920,
      personDeathYear: 1910,
    });
    const impact = deriveCharacterSimulationReadinessImpact({
      conflicts,
      validationOk: true,
      migrationRequired: false,
    });
    assert.equal(impact.level, "blocked");
    assert.ok(readinessImpactToFlags(impact).some((f) => f.includes("blocked")));
  });

  it("summarizes drift counts", () => {
    const drift = buildCharacterSimulationDriftSummary({
      conflicts: [
        {
          id: "1",
          category: "motivation_conflict",
          severity: "advisory",
          affectedFields: [],
          description: "d",
          recommendedRemediation: "r",
          sourceComparison: { authorExcerpt: null, derivedExcerpt: null },
          blocksGenerationReadiness: false,
          acceptedByOperator: false,
        },
      ],
      migrationRequired: true,
      authorBundleRowExists: false,
      hasAuthorPayload: false,
    });
    assert.equal(drift.migrationRequired, true);
    assert.ok(drift.notes.length > 0);
  });
});

describe("character-simulation-workbench save (unit, no DB)", () => {
  it("returns not_found for random uuid without prisma person", async () => {
    const r = await saveCharacterSimulationWorkbenchAuthorProfile({
      personId: "00000000-0000-0000-0000-000000000000",
      mindPartial: { coreDesire: "x" },
      voicePartial: {},
      authorNotes: [],
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, "not_found");
  });
});

describe("zod round-trip on merged author partials (no DB)", () => {
  it("parses merged mind partial after hypothetical author edit", () => {
    const id = "rt-mind";
    const base = seed.buildMindProfile({ characterId: id, displayLabel: "RT" });
    const patch = { coreDesire: "Author override desire text for testing." };
    const merged = seed.mergeMindProfile(base, patch);
    const again = CharacterMindProfileSchema.parse(merged);
    assert.equal(again.coreDesire, patch.coreDesire);
  });

  it("parses merged voice partial", () => {
    const id = "rt-voice";
    const base = seed.buildVoiceProfile({ characterId: id, displayLabel: "RT" });
    const patch = { vocabularyRange: "wide" as const };
    const merged = seed.mergeVoiceProfile(base, patch);
    const again = CharacterVoiceProfileSchema.parse(merged);
    assert.equal(again.vocabularyRange, "wide");
  });
});

describe("mergeValidationResults", () => {
  it("fails when any sub-result has error severity", () => {
    const r = mergeValidationResults(
      { ok: true, issues: [] },
      { ok: false, issues: [{ path: "x", code: "c", message: "m", severity: "error" }] }
    );
    assert.equal(r.ok, false);
  });
});
