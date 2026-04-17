import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ProseGenerationConstraintsSchema } from "@/lib/domain/prose-generation-constraints";
import { SequenceValidationReportSchema } from "@/lib/domain/narrative-sequence";
import {
  buildCluster3RuntimeActivationTruth,
  CanonicalRuntimeCluster3GovernanceService,
} from "@/lib/services/canonical-runtime-cluster3-governance-service";
import { EpicContinuityDerivationService } from "@/lib/services/epic-continuity-derivation-service";
import { EpicContinuityValidationService } from "@/lib/services/epic-continuity-validation-service";
import { EpicEmotionalGravityDerivationService } from "@/lib/services/epic-emotional-gravity-derivation-service";
import { EpicEmotionalGravityValidationService } from "@/lib/services/epic-emotional-gravity-validation-service";
import { NarratorPresenceDerivationService } from "@/lib/services/narrator-presence-derivation-service";
import { NarratorPresenceValidationService } from "@/lib/services/narrator-presence-validation-service";

function minimalProse(): import("@/lib/domain/prose-generation-constraints").ProseGenerationConstraints {
  return ProseGenerationConstraintsSchema.parse({
    artifact: "prose_generation_constraints",
    proseConstraintId: "test",
    chapterId: "book1-ch01",
    parentBeatChainId: "chain",
    parentChapterStateId: "book1-ch01",
    parentNarrativePsychologyId: "book1",
    povCharacterId: "p1",
    proseMode: "kinship_pressure",
    narrativeDistance: "close_externalized_embodied",
    cognitionMode: ["native_relational", "place_linked"],
    sentencePressureProfile: { level: "medium", compressionBias: 0.5 },
    sensoryDensityProfile: { requiredDensity: "medium", requiredChannels: ["touch"] },
    environmentalGroundingFloor: 0.6,
    relationalSignalDensity: 0.5,
    memoryInvocationAllowance: 0.4,
    expositionAllowance: 0.1,
    interpretationAllowance: 0.3,
    ambiguityAllowance: 0.4,
    revelationAllowance: 0.2,
    emotionalLabelAllowance: 0.1,
    meaningReflectionAllowance: 0.2,
    lineTensionProfile: { target: "steady", unresolvedCarryForward: 0.5 },
    paragraphBreathProfile: { averageSentences: 4, allowedLongParagraphRatio: 0.2 },
    cadenceProfile: ["c1"],
    dictionGuardrails: ["d1"],
    syntaxGuardrails: ["s1"],
    forbiddenPatterns: ["f1"],
    requiredPatterns: ["r1", "r2", "r3", "r4"],
    endingMomentumProfile: { vector: "pressure", carryForwardPressureType: "hook" },
    literaryDeviceConstraints: {
      activeDeviceIds: [],
      suppressedDeviceIds: [],
      soundPatternAllowance: "minimal",
      symbolismAllowance: "minimal",
      metaphorSimileAllowance: "guarded",
      explicitnessCeiling: "moderate",
      closurePressureStyle: "state_pressure_seeded",
      callbackPhraseAllowance: false,
      placeMemoryInsertionOpportunities: [],
      repetitionAllowance: "rare_only",
    },
    continuityEmphasis: 0.5,
    placeImmersionTarget: 0.5,
    attachmentTarget: 0.5,
    driftFlags: [],
    validationFlags: ["observer_bounded"],
  });
}

describe("canonical-runtime-cluster3-governance-service", () => {
  it("applies ENCS, EEGS, and narrator so merged prose differs from base and carries cluster3 flags", () => {
    const base = minimalProse();
    const epicContinuityPack = new EpicContinuityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "continuity_chapter",
      chapterPsychologyMode: "rooted_continuity",
      activeThreadIds: ["t1", "t2"],
      recallWindows: ["chapter-03"],
    });
    const epicContinuityValidation = new EpicContinuityValidationService().validatePack(epicContinuityPack);
    const epicEmotionalGravityPack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "continuity_chapter",
      chapterPsychologyMode: "rooted_continuity",
      activeThreadIds: ["t1", "t2"],
      recallWindows: ["chapter-03"],
      sceneIds: ["book1-ch01-sc01"],
    });
    const epicEmotionalGravityValidation = new EpicEmotionalGravityValidationService().validatePack(epicEmotionalGravityPack);
    const narratorPresencePack = new NarratorPresenceDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      sceneIds: ["book1-ch01-sc01"],
    });
    const narratorPresenceValidation = new NarratorPresenceValidationService().validatePack(narratorPresencePack);

    const merged = new CanonicalRuntimeCluster3GovernanceService().applyToProseConstraints({
      constraints: base,
      epicContinuityPack,
      epicEmotionalGravityPack,
      narratorPresencePack,
      validations: {
        epicContinuity: epicContinuityValidation,
        epicEmotionalGravity: epicEmotionalGravityValidation,
        narratorPresence: narratorPresenceValidation,
      },
    });

    assert.equal(merged.continuityEmphasis !== base.continuityEmphasis || merged.attachmentTarget !== base.attachmentTarget, true);
    assert.equal(merged.validationFlags.some((f) => f.startsWith("cluster3_")), true);
    assert.equal(merged.validationFlags.includes("cluster3_narrator_presence_to_prose_runtime_pack"), true);
  });

  it("buildCluster3RuntimeActivationTruth surfaces governance merge and hook pressure from sequence report", () => {
    const seq = SequenceValidationReportSchema.parse({
      artifact: "sequence_validation_report",
      schemaVersion: "1.0.0",
      sequenceScore: 0.8,
      sequenceWarnings: [],
      structuralWeaknessFlags: ["cluster3_hook_continuity_pressure"],
    });
    const epicContinuityPack = new EpicContinuityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "continuity_chapter",
      chapterPsychologyMode: "rooted_continuity",
      activeThreadIds: ["t1"],
      recallWindows: [],
    });
    const epicEmotionalGravityPack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      chapterMode: "continuity_chapter",
      chapterPsychologyMode: "rooted_continuity",
      activeThreadIds: ["t1"],
      recallWindows: [],
      sceneIds: ["s1"],
    });
    const narratorPresencePack = new NarratorPresenceDerivationService().deriveCamptiPack({
      chapterId: "book1-chapter-01",
      chapterSequence: 1,
      sceneIds: ["s1"],
    });
    const prose = minimalProse();
    const truth = buildCluster3RuntimeActivationTruth({
      proseConstraints: { ...prose, validationFlags: [...prose.validationFlags, "cluster3_hcel_hook_transition_hard_signal"] },
      sequenceValidation: seq,
      epicContinuityPack,
      epicEmotionalGravityPack,
      narratorPresencePack,
      epicContinuityValidation: new EpicContinuityValidationService().validatePack(epicContinuityPack),
      epicEmotionalGravityValidation: new EpicEmotionalGravityValidationService().validatePack(epicEmotionalGravityPack),
      narratorPresenceValidation: new NarratorPresenceValidationService().validatePack(narratorPresencePack),
    });
    assert.equal(truth.governanceMergeApplied, true);
    assert.equal(truth.sequenceStructuralHookPressureActive, true);
    assert.equal(truth.hcelHookHardSignalsActive, true);
  });
});
