import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CamptiEpicEmotionalGravityPackSchema } from "@/lib/domain/epic-emotional-gravity";
import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import { CharacterAttachmentEngineService } from "@/lib/services/character-attachment-engine-service";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";
import { EmotionalCarryForwardService } from "@/lib/services/emotional-carry-forward-service";
import { EpicEmotionalGravityDerivationService } from "@/lib/services/epic-emotional-gravity-derivation-service";
import { EpicEmotionalGravityValidationService } from "@/lib/services/epic-emotional-gravity-validation-service";
import { FateAgencyEngineService } from "@/lib/services/fate-agency-engine-service";
import { GenerationalBurdenService } from "@/lib/services/generational-burden-service";
import { IrreversibilityConsequenceService } from "@/lib/services/irreversibility-consequence-service";
import { RelationalStakesService } from "@/lib/services/relational-stakes-service";
import { RUNTIME_ID_SCENE_CHAPTER_PRODUCTION } from "@/lib/services/runtime-authority-registry-service";
import { TemporalEmotionalContinuityService } from "@/lib/services/temporal-emotional-continuity-service";

describe("epic-emotional-gravity-system", () => {
  const derivation = new EpicEmotionalGravityDerivationService();
  const pack = derivation.deriveCamptiPack({
    chapterId: "book1-chapter-01",
    chapterSequence: 1,
    chapterMode: "continuity_chapter",
    chapterPsychologyMode: "rooted_continuity",
    activeThreadIds: ["book1-warning-under-routine", "book1-red-river-route-setting"],
    recallWindows: ["chapter-03", "chapter-06"],
    sceneIds: ["book1-chapter-01-scene-01", "book1-chapter-01-scene-02", "book1-chapter-01-scene-03"],
  });

  it("validates attachment profile schema and derivation", () => {
    const profiles = new CharacterAttachmentEngineService().buildCamptiProfiles();
    assert.equal(profiles.length > 0, true);
    assert.equal(profiles[0]?.desireLines.length > 0, true);
    assert.equal(profiles[0]?.fearLines.length > 0, true);
    assert.equal(profiles[0]?.vulnerabilityExposures.length > 0, true);
  });

  it("classifies irreversibility and consequence tracking", () => {
    const profile = new IrreversibilityConsequenceService().buildCamptiProfile();
    const classification = new IrreversibilityConsequenceService().classifyMarker(profile.irreversibilityMarkers[0]!);
    assert.equal(profile.irreversibilityMarkers.length > 0, true);
    assert.equal(["emotionally_irreversible", "structurally_irreversible", "historically_irreversible"].includes(classification), true);
  });

  it("derives fate vs agency profile", () => {
    const profile = new FateAgencyEngineService().buildCamptiProfile();
    assert.equal(profile.repeatingPatterns.length > 0, true);
    assert.equal(profile.attemptedBreakEvents.length > 0, true);
    assert.equal(profile.transformationWindows.length > 0, true);
  });

  it("generates relational stakes profile", () => {
    const profile = new RelationalStakesService().buildCamptiProfile();
    assert.equal(profile.relationshipBonds.length > 0, true);
    assert.equal(profile.threatenedBonds.length > 0, true);
    assert.equal(profile.breakRisks.length > 0, true);
  });

  it("derives generational burden profile", () => {
    const profile = new GenerationalBurdenService().buildCamptiProfile();
    assert.equal(profile.inheritedBurdens.length > 0, true);
    assert.equal(profile.burdenSilences.length > 0, true);
    assert.equal(profile.reclaimedInheritance.length > 0, true);
  });

  it("generates emotional carry-forward model", () => {
    const profile = new EmotionalCarryForwardService().buildCamptiProfile();
    assert.equal(profile.chapterToChapterCarry.length > 0, true);
    assert.equal(profile.bookToBookCarry.length > 0, true);
    assert.equal(profile.eraTransitionCarry.length > 0, true);
  });

  it("validates temporal emotional continuity rule", () => {
    const profiles = new TemporalEmotionalContinuityService().buildCamptiProfiles();
    const validation = new TemporalEmotionalContinuityService().validateProfiles({ profiles });
    assert.equal(profiles.length > 0, true);
    assert.equal(validation.warnings.length === 0, true);
  });

  it("derives EEGS downstream integration biases", () => {
    assert.equal(pack.downstreamBias.narrativePsychologyBias.length > 0, true);
    assert.equal(pack.downstreamBias.chapterStateBias.length > 0, true);
    assert.equal(pack.downstreamBias.narrativeThreadPriorityBias.length > 0, true);
    assert.equal(pack.downstreamBias.sequenceArchitectureBias.length > 0, true);
    assert.equal(pack.downstreamBias.sceneGenerationPriorityBias.length > 0, true);
    assert.equal(pack.downstreamBias.proseConstraintBias.length > 0, true);
    assert.equal(pack.downstreamBias.literaryDeviceAllowanceBias.length > 0, true);
    assert.equal(pack.downstreamBias.hookCarryForwardBias.length > 0, true);
    assert.equal(pack.downstreamBias.povWeightingBias.length > 0, true);
  });

  it("renders cockpit emotional gravity summary", () => {
    const cockpit = buildAuthorCommandCockpitBundle({
      runtimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      context: resolveCockpitScopeContext({ scope: "chapter", chapterId: "book1-chapter-01" }),
      metrics: {
        chapterProgressionState: 0.66,
        contradictionRisk: 0.42,
        chapterReadiness: 0.71,
      },
      emotionalGravity: {
        epicId: pack.epicEmotionalGravityProfile.epicId,
        chapterId: pack.cockpitSummary.chapterId,
        attachmentStatusByCharacter: pack.cockpitSummary.attachmentStatusByCharacter,
        activeFearDesireVulnerabilityLines: pack.cockpitSummary.activeFearDesireVulnerabilityLines,
        consequenceIrreversibilityMarkers: pack.cockpitSummary.consequenceIrreversibilityMarkers,
        fateAgencyPressureMap: pack.cockpitSummary.fateAgencyPressureMap,
        relationalStakesMap: pack.cockpitSummary.relationalStakesMap,
        generationalBurdenStatus: pack.cockpitSummary.generationalBurdenStatus,
        emotionalCarryForwardSummary: pack.cockpitSummary.emotionalCarryForwardSummary,
        temporalEmotionalContinuityHealth: pack.cockpitSummary.temporalEmotionalContinuityHealth,
        emotionallyThinWarnings: pack.cockpitSummary.emotionallyThinWarnings,
        resetHeavyWarnings: pack.cockpitSummary.resetHeavyWarnings,
        epicEmotionalGravityScore: pack.cockpitSummary.epicEmotionalGravityScore,
        diagnostics: pack.cockpitSummary.diagnostics,
      },
    });
    assert.equal(cockpit.emotionalGravity?.epicId, "campti-epic");
    assert.equal((cockpit.emotionalGravity?.attachmentStatusByCharacter.length ?? 0) > 0, true);
  });

  it("keeps sample emotional gravity pack machine-valid", () => {
    const parsed = CamptiEpicEmotionalGravityPackSchema.parse(pack);
    const validation = new EpicEmotionalGravityValidationService().validatePack(parsed);
    assert.equal(parsed.artifact, "campti_epic_emotional_gravity_pack");
    assert.equal(validation.score > 0.5, true);
  });
});
