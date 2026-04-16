import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CamptiNarratorPresencePackSchema } from "@/lib/domain/narrator-presence";
import { ProseGenerationConstraintsSchema } from "@/lib/domain/prose-generation-constraints";
import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";
import { NarratorConvergenceEngineService } from "@/lib/services/narrator-convergence-engine-service";
import { NarratorEraBridgeService } from "@/lib/services/narrator-era-bridge-service";
import { NarratorPresenceDerivationService } from "@/lib/services/narrator-presence-derivation-service";
import { NarratorPresenceToHookContinuityService } from "@/lib/services/narrator-presence-to-hook-continuity-service";
import { NarratorPresenceToProseService } from "@/lib/services/narrator-presence-to-prose-service";
import { NarratorPresenceValidationService } from "@/lib/services/narrator-presence-validation-service";
import { RUNTIME_ID_SCENE_CHAPTER_PRODUCTION } from "@/lib/services/runtime-authority-registry-service";

describe("narrator-presence-system", () => {
  const derivation = new NarratorPresenceDerivationService();
  const pack = derivation.deriveCamptiPack({
    chapterId: "book1-chapter-01",
    chapterSequence: 1,
    eraId: "era-1650",
    sceneIds: ["book1-ch01-sc01", "book1-ch01-sc02", "book1-ch01-sc03"],
  });

  it("validates narrator identity schema and derivation", () => {
    assert.equal(pack.narratorIdentityProfile.narratorName, "Steve Grappe");
    assert.equal(pack.narratorIdentityProfile.narratorConvergenceTriggers.length >= 3, true);
  });

  it("derives narrator presence by era distance", () => {
    const distant = derivation.deriveCamptiPack({
      chapterId: "book1-chapter-02",
      chapterSequence: 2,
      eraId: "era-1650",
      sceneIds: ["scene-a"],
    });
    const near = derivation.deriveCamptiPack({
      chapterId: "book1-chapter-16",
      chapterSequence: 16,
      eraId: "era-2026",
      sceneIds: ["scene-z"],
    });
    assert.equal(distant.chapterPresencePlan.modeProfile.currentPresenceLevel === "subtle", true);
    assert.equal(["intimate", "first_person"].includes(near.chapterPresencePlan.modeProfile.currentPresenceLevel), true);
  });

  it("progresses convergence stage across chapter sequence", () => {
    const service = new NarratorConvergenceEngineService();
    const early = service.derive({ chapterId: "book1-ch01", chapterSequence: 1, eraId: "era-1650" });
    const late = service.derive({ chapterId: "book1-ch18", chapterSequence: 18, eraId: "era-2026" });
    assert.equal(early.currentStage, "distant_observer");
    assert.equal(late.currentStage, "first_person_presence");
  });

  it("builds healthy era bridge continuity", () => {
    const bridges = new NarratorEraBridgeService().buildCamptiBridges({
      modeProfile: pack.chapterPresencePlan.modeProfile,
    });
    const status = new NarratorEraBridgeService().deriveBridgeStatus(bridges);
    assert.equal(bridges.length >= 1, true);
    assert.equal(status.includes("healthy"), true);
  });

  it("maps narrator mode into prose constraints", () => {
    const base = ProseGenerationConstraintsSchema.parse({
      artifact: "prose_generation_constraints",
      proseConstraintId: "test-constraints",
      chapterId: "book1-chapter-01",
      parentBeatChainId: "beat-chain-id",
      parentChapterStateId: "book1-chapter-01",
      parentNarrativePsychologyId: "book1",
      povCharacterId: "pov-a",
      proseMode: "rooted_continuity",
      narrativeDistance: "close_externalized_embodied",
      cognitionMode: ["native_relational"],
      sentencePressureProfile: { level: "medium", compressionBias: 0.4 },
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
      cadenceProfile: ["base-cadence"],
      dictionGuardrails: ["base-diction"],
      syntaxGuardrails: ["base-syntax"],
      forbiddenPatterns: ["base-forbidden"],
      requiredPatterns: ["base-required"],
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
    });
    const adapted = new NarratorPresenceToProseService().applyToChapterConstraints({
      constraints: base,
      modeProfile: pack.chapterPresencePlan.modeProfile,
    });
    assert.equal(adapted.validationFlags.includes("narrator_presence_to_prose_applied"), true);
    assert.equal(adapted.requiredPatterns.some((row) => row.includes("narrator")), true);
  });

  it("maps narrator state into hook continuity adapter", () => {
    const hookAdapter = new NarratorPresenceToHookContinuityService().deriveAdapter({
      chapterId: "book1-chapter-01",
      modeProfile: pack.chapterPresencePlan.modeProfile,
      convergence: pack.convergenceProfile,
    });
    assert.equal(hookAdapter.narratorHookContinuityContribution > 0.4, true);
    assert.equal(hookAdapter.anchorContinuityReinforced, true);
  });

  it("detects abrupt mode shifts in validation", () => {
    const broken = structuredClone(pack);
    broken.modeTransitions[0] = {
      ...broken.modeTransitions[0]!,
      fromPresenceLevel: "subtle",
      toPresenceLevel: "first_person",
      requiredTriggerIds: ["single-trigger"],
    };
    const result = new NarratorPresenceValidationService().validatePack(broken);
    assert.equal(result.valid, false);
    assert.equal(result.hardFailures.some((row) => row.category === "abrupt_mode_shift"), true);
  });

  it("hard-fails narrator boundary override without explicit allowance and convergence justification", () => {
    const broken = structuredClone(pack);
    broken.chapterPresencePlan.modeProfile.currentPresenceLevel = "reflective";
    broken.chapterPresencePlan.modeProfile.authorityMode = "interpretive";
    broken.chapterPresencePlan.modeProfile.permittedInterventions = ["orientation only"];
    broken.modeTransitions = broken.modeTransitions.map((row) => ({
      ...row,
      requiredTriggerIds: [],
      transitionRationale: "",
    }));
    const result = new NarratorPresenceValidationService().validatePack(broken);
    assert.equal(result.valid, false);
    assert.equal(
      result.hardFailures.some((row) => row.category === "narrator_boundary_override_without_allowance"),
      true,
    );
  });

  it("hard-fails first-person convergence when nearness/stake/anchor/hook gates are unmet", () => {
    const broken = structuredClone(pack);
    broken.chapterPresencePlan.modeProfile.currentPresenceLevel = "first_person";
    broken.chapterPresencePlan.modeProfile.emotionalStakeLevel = 0.55;
    broken.convergenceProfile.currentIdentityNearnessBand = "lineage_adjacent";
    broken.hookContinuityAdapter.anchorContinuityReinforced = false;
    broken.hookContinuityAdapter.emotionalAttachmentPreserved = false;
    broken.hookContinuityAdapter.structuralCuriosityPreserved = false;
    broken.hookContinuityAdapter.unresolvedContinuityPressurePreserved = false;
    const result = new NarratorPresenceValidationService().validatePack(broken);
    assert.equal(result.valid, false);
    assert.equal(result.hardFailures.some((row) => row.category === "first_person_convergence_gate_failed"), true);
  });

  it("surfaces narrator cockpit summary through authoritative cockpit", () => {
    const cockpit = buildAuthorCommandCockpitBundle({
      runtimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      context: resolveCockpitScopeContext({ scope: "chapter", chapterId: "book1-chapter-01" }),
      metrics: {
        chapterProgressionState: 0.64,
        contradictionRisk: 0.4,
        chapterReadiness: 0.68,
      },
      narratorPresence: {
        chapterId: pack.cockpitSummary.chapterId,
        currentNarratorPresenceLevel: pack.cockpitSummary.currentNarratorPresenceLevel,
        narratorAuthorityMode: pack.cockpitSummary.narratorAuthorityMode,
        narratorKnowledgeMode: pack.cockpitSummary.narratorKnowledgeMode,
        convergenceStage: pack.cockpitSummary.convergenceStage,
        upcomingConvergenceTriggers: pack.cockpitSummary.upcomingConvergenceTriggers,
        narratorHookContinuityContribution: pack.cockpitSummary.narratorHookContinuityContribution,
        narratorCharacterBoundaryWarnings: pack.cockpitSummary.narratorCharacterBoundaryWarnings,
        temporalBridgeStatus: pack.cockpitSummary.temporalBridgeStatus,
        firstPersonReadinessStatus: pack.cockpitSummary.firstPersonReadinessStatus,
        voiceShiftRisks: pack.cockpitSummary.voiceShiftRisks,
      },
    });
    assert.equal(cockpit.narratorPresence?.chapterId, "book1-chapter-01");
    assert.equal(cockpit.narratorPresence?.currentNarratorPresenceLevel, pack.cockpitSummary.currentNarratorPresenceLevel);
  });

  it("keeps sample narrator pack machine-valid and health-checked", () => {
    const parsed = CamptiNarratorPresencePackSchema.parse(pack);
    const validation = new NarratorPresenceValidationService().validatePack(parsed);
    assert.equal(parsed.artifact, "campti_narrator_presence_pack");
    assert.equal(validation.narratorConvergenceScore > 0.1, true);
  });
});
