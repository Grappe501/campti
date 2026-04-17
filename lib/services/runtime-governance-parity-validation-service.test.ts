import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ProseGenerationConstraintsSchema } from "@/lib/domain/prose-generation-constraints";
import { RuntimeGovernanceParityValidationService } from "@/lib/services/runtime-governance-parity-validation-service";

function minimalProse(overrides: Partial<ReturnType<typeof ProseGenerationConstraintsSchema.parse>> = {}) {
  return ProseGenerationConstraintsSchema.parse({
    artifact: "prose_generation_constraints",
    proseConstraintId: "p1",
    chapterId: "c1",
    parentBeatChainId: "b1",
    parentChapterStateId: "c1",
    parentNarrativePsychologyId: "bk",
    povCharacterId: "pov",
    proseMode: "rooted_continuity",
    narrativeDistance: "close_externalized_embodied",
    cognitionMode: ["native_relational"],
    sentencePressureProfile: { level: "medium", compressionBias: 0.5 },
    sensoryDensityProfile: { requiredDensity: "high", requiredChannels: ["touch"] },
    environmentalGroundingFloor: 0.8,
    relationalSignalDensity: 0.6,
    memoryInvocationAllowance: 0.4,
    expositionAllowance: 0.1,
    interpretationAllowance: 0.2,
    ambiguityAllowance: 0.4,
    revelationAllowance: 0.2,
    emotionalLabelAllowance: 0.1,
    meaningReflectionAllowance: 0.2,
    lineTensionProfile: { target: "steady", unresolvedCarryForward: 0.6 },
    paragraphBreathProfile: { averageSentences: 4, allowedLongParagraphRatio: 0.2 },
    cadenceProfile: ["c"],
    dictionGuardrails: ["d"],
    syntaxGuardrails: ["s"],
    forbiddenPatterns: ["f"],
    requiredPatterns: ["r"],
    endingMomentumProfile: { vector: "carry", carryForwardPressureType: "warning" },
    literaryDeviceConstraints: {
      activeDeviceIds: [],
      suppressedDeviceIds: [],
      soundPatternAllowance: "minimal",
      symbolismAllowance: "minimal",
      metaphorSimileAllowance: "minimal",
      explicitnessCeiling: "low",
      closurePressureStyle: "state_pressure_seeded",
      callbackPhraseAllowance: false,
      placeMemoryInsertionOpportunities: [],
      repetitionAllowance: "rare_only",
    },
    continuityEmphasis: 0.7,
    placeImmersionTarget: 0.8,
    attachmentTarget: 0.75,
    driftFlags: [],
    validationFlags: [],
    ...overrides,
  });
}

describe("runtime-governance-parity-validation-service", () => {
  const svc = new RuntimeGovernanceParityValidationService();

  it("flags missing cluster3 merge flags when governance expected", () => {
    const bad = svc.validateMergedProseConstraints({
      proseConstraints: minimalProse(),
      expectCluster3GovernanceMerge: true,
    });
    assert.equal(bad.ok, false);
    assert.equal(bad.violations.includes("missing_cluster3_encs_eegs_narrator_governance_merge"), true);
  });

  it("passes when cluster3 merge flags present", () => {
    const good = svc.validateMergedProseConstraints({
      proseConstraints: minimalProse({
        validationFlags: [
          "cluster3_encs_eegs_narrator_governance_merge",
          "cluster3_narrator_presence_to_prose_runtime_pack",
        ],
      }),
      expectCluster3GovernanceMerge: true,
    });
    assert.equal(good.ok, true);
  });
});
