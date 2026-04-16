import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CamptiEpicContinuityPackSchema } from "@/lib/domain/epic-narrative-continuity";
import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";
import { EpicContinuityDerivationService } from "@/lib/services/epic-continuity-derivation-service";
import { EpicContinuityValidationService } from "@/lib/services/epic-continuity-validation-service";
import { EpicQuestionEngineService } from "@/lib/services/epic-question-engine-service";
import { HookOrchestrationService } from "@/lib/services/hook-orchestration-service";
import { IdentityPersistenceService } from "@/lib/services/identity-persistence-service";
import { MeaningEscalationService } from "@/lib/services/meaning-escalation-service";
import { NarrativeAnchorRegistryService } from "@/lib/services/narrative-anchor-registry-service";
import { ReaderMemoryStrategyService } from "@/lib/services/reader-memory-strategy-service";
import { RUNTIME_ID_SCENE_CHAPTER_PRODUCTION } from "@/lib/services/runtime-authority-registry-service";
import { TemporalTransitionContinuityService } from "@/lib/services/temporal-transition-continuity-service";

describe("epic-continuity-system", () => {
  const derivation = new EpicContinuityDerivationService();

  const pack = derivation.deriveCamptiPack({
    chapterId: "book1-chapter-01",
    chapterSequence: 1,
    chapterMode: "continuity_chapter",
    chapterPsychologyMode: "rooted_continuity",
    activeThreadIds: ["book1-warning-under-routine", "book1-red-river-route-setting"],
    recallWindows: ["chapter-03", "chapter-06"],
  });

  it("validates epic question schema and derivation", () => {
    const profile = new EpicQuestionEngineService().buildCamptiQuestionProfile();
    assert.equal(profile.artifact, "epic_question_profile");
    assert.equal(profile.expressionVariants.length >= 3, true);
    assert.equal(profile.centralHumanQuestion.length > 20, true);
  });

  it("validates anchor registry recurrence logic", () => {
    const registry = new NarrativeAnchorRegistryService().buildCamptiRegistry();
    const recurrence = new NarrativeAnchorRegistryService().validateRecurrenceHealth({
      registry,
      requiredEraIds: ["era-1650", "era-1960"],
    });
    assert.equal(registry.anchors.length >= 3, true);
    assert.equal(recurrence.recurrenceHealth >= 0.75, true);
  });

  it("models identity persistence with fracture and recovery", () => {
    const profile = new IdentityPersistenceService().buildCamptiProfile();
    assert.equal(profile.fractureEvents.length > 0, true);
    assert.equal(profile.recoveredLines.length > 0, true);
  });

  it("derives meaning escalation stages", () => {
    const profile = new MeaningEscalationService().buildCamptiProfile();
    assert.equal(profile.escalatingElements.length >= 2, true);
    assert.equal(profile.escalatingElements[0]?.escalationStages.length >= 2, true);
  });

  it("generates reader memory strategy", () => {
    const strategy = new ReaderMemoryStrategyService().buildCamptiStrategy();
    assert.equal(strategy.memoryTargets.length >= 2, true);
    assert.equal(strategy.recallWindows.length >= 1, true);
  });

  it("generates hook orchestration layers", () => {
    const hooks = new HookOrchestrationService().buildCamptiProfile();
    assert.equal(hooks.hookLayers.length >= 4, true);
    assert.equal(hooks.hookCadencePlan.length >= 1, true);
  });

  it("validates temporal transition continuity", () => {
    const transitions = new TemporalTransitionContinuityService().buildCamptiTransitions();
    const validation = new TemporalTransitionContinuityService().validateTransitionProfiles({
      profiles: transitions,
    });
    assert.equal(transitions.length >= 1, true);
    assert.equal(validation.continuityHealth.includes("healthy"), true);
  });

  it("produces ENCS downstream bias integration map", () => {
    assert.equal(pack.downstreamBias.narrativePsychologyBias.length > 0, true);
    assert.equal(pack.downstreamBias.chapterStateBias.length > 0, true);
    assert.equal(pack.downstreamBias.sequenceArchitectureBias.length > 0, true);
  });

  it("enforces hook continuity declaration on books and era transitions", () => {
    for (const plan of pack.bookContinuityPlans) {
      assert.equal(plan.hookContinuityDeclaration.hookContinuityScore > 0, true);
      assert.equal(plan.hookContinuityDeclaration.emotionalAttachmentDrivers.length > 0, true);
      assert.equal(plan.hookContinuityDeclaration.attachmentContinuitySignals.length > 0, true);
      assert.equal(plan.hookContinuityDeclaration.structuralCuriosityDrivers.length > 0, true);
      assert.equal(plan.hookContinuityDeclaration.philosophicalEngagementDrivers.length > 0, true);
      assert.equal(plan.hookContinuityDeclaration.unresolvedContinuityPressureCarryForward.length > 0, true);
    }
    for (const transition of pack.temporalTransitionProfiles) {
      assert.equal(transition.hookContinuityDeclaration.hookContinuityScore > 0, true);
      assert.equal(transition.hookContinuityDeclaration.emotionalAttachmentDrivers.length > 0, true);
      assert.equal(transition.hookContinuityDeclaration.attachmentContinuitySignals.length > 0, true);
      assert.equal(transition.hookContinuityDeclaration.readerCarryDeclaration.emotionalCarry.length > 0, true);
      assert.equal(transition.hookContinuityDeclaration.readerCarryDeclaration.understandingQuestion.length > 0, true);
      assert.equal(transition.hookContinuityDeclaration.readerCarryDeclaration.waitingForResolution.length > 0, true);
      assert.equal(transition.hookContinuityDeclaration.readerCarryDeclaration.continuityReassuranceSignals.length > 0, true);
      assert.equal(transition.hookContinuityDeclaration.structuralCuriosityDrivers.length > 0, true);
      assert.equal(transition.hookContinuityDeclaration.philosophicalEngagementDrivers.length > 0, true);
      assert.equal(transition.hookContinuityDeclaration.unresolvedContinuityPressureCarryForward.length > 0, true);
    }
  });

  it("hard-fails anti-dropoff when low hook continuity lacks required continuity lines", () => {
    const brokenPack = structuredClone(pack);
    const transition = brokenPack.temporalTransitionProfiles[0];
    if (!transition) throw new Error("expected transition profile");
    transition.hookContinuityDeclaration.hookContinuityScore = 0.42;
    transition.hookContinuityDeclaration.attachmentContinuitySignals = ["single-weak-signal"];
    transition.hookContinuityDeclaration.unresolvedContinuityPressureCarryForward = ["single-unresolved-pressure"];
    transition.bridgeAnchorIds = ["single-anchor"];

    const validation = new EpicContinuityValidationService().validatePack(brokenPack);
    assert.equal(validation.valid, false);
    assert.equal(validation.risks.some((risk) => risk.includes("ANTI-DROPOFF HARD-FAIL")), true);
  });

  it("renders cockpit continuity summary through authoritative cockpit", () => {
    const cockpit = buildAuthorCommandCockpitBundle({
      runtimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      context: resolveCockpitScopeContext({ scope: "chapter", chapterId: "book1-chapter-01" }),
      metrics: {
        chapterProgressionState: 0.6,
        contradictionRisk: 0.4,
        chapterReadiness: 0.7,
      },
      epicContinuity: {
        epicId: pack.epicContinuityProfile.epicId,
        chapterId: pack.cockpitSummary.chapterId,
        currentQuestionExpression: pack.cockpitSummary.currentQuestionExpression,
        activeAnchorIds: pack.cockpitSummary.activeAnchorIds,
        anchorRecurrenceHealth: pack.cockpitSummary.anchorRecurrenceHealth,
        identityPersistenceStatus: pack.cockpitSummary.identityPersistenceStatus,
        meaningEscalationStatus: pack.cockpitSummary.meaningEscalationStatus,
        readerMemoryTargets: pack.cockpitSummary.readerMemoryTargets,
        hookLayerStatus: pack.cockpitSummary.hookLayerStatus,
        temporalTransitionHealth: pack.cockpitSummary.temporalTransitionHealth,
        disconnectionWarnings: pack.cockpitSummary.disconnectionWarnings,
        unresolvedEpicContinuityRisks: pack.cockpitSummary.unresolvedEpicContinuityRisks,
      },
    });
    assert.equal(cockpit.epicContinuity?.epicId, "campti-epic");
    assert.equal(cockpit.epicContinuity?.activeAnchorIds.length > 0, true);
  });

  it("keeps sample continuity pack machine-valid and health-checked", () => {
    const parsed = CamptiEpicContinuityPackSchema.parse(pack);
    const validation = new EpicContinuityValidationService().validatePack(parsed);
    assert.equal(parsed.artifact, "campti_epic_continuity_pack");
    assert.equal(validation.score > 0.5, true);
  });
});
