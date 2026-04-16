import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import { Book1CriticFeedbackMapperService } from "@/lib/services/book1-critic-feedback-mapper-service";
import { Book1HighFindingReducerService } from "@/lib/services/book1-high-finding-reducer-service";
import { Book1RegenerationLoopService } from "@/lib/services/book1-regeneration-loop-service";

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  const chapterOutline = await readJson<Chapter1DeepOutline>(path.join(reportsDir, "book1-chapter-01-outline.json"));
  const chapterEvidencePack = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_evidence_pack.json"));
  const chapterLaw = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_law.json"));
  const chapterVoiceSpec = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_voice_spec.json"));
  const chapterCharacterHiddenHistories = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_character_hidden_histories.json"));
  const chapterEpicSimulation = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_epic_simulation.json"));

  const previousDraft = await readJson(path.join(reportsDir, "book1-chapter-01-draft.json"));
  const previousConsistencyReport = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_consistency_report.json"));
  const previousVoiceReport = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_voice_report.json"));
  const previousGapReport = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_gap_report.json"));
  const previousAdversarialSummary = await readJson(path.join(reportsDir, "book1-chapter-01-adversarial-summary.json"));
  const latestProseShapeCritic = await readJson(path.join(reportsDir, "book1-chapter-01-prose-shape-critic.json"));
  const latestDecisionPanel = await readJson(path.join(reportsDir, "book1-chapter-01-decision-panel.json"));
  const latestRegenerationDiff = await readJson(path.join(reportsDir, "book1-chapter-01-regeneration-diff.json"));

  const characterConsoleSession = await readJson(path.join(reportsDir, "book1-character-console-session.json"));
  const lawConsoleSession = await readJson(path.join(reportsDir, "book1-law-console-session.json"));
  const criticFeedbackMap = new Book1CriticFeedbackMapperService().map({
    proseShapeCritic: latestProseShapeCritic,
    adversarialSummary: previousAdversarialSummary,
    decisionPanel: latestDecisionPanel,
    regenerationDiff: latestRegenerationDiff,
  });
  const highFindingReductionPlan = new Book1HighFindingReducerService().build({
    feedbackMap: criticFeedbackMap,
    adversarialSummary: previousAdversarialSummary,
  });

  const result = new Book1RegenerationLoopService().run({
    chapterOutline,
    chapterEvidencePack,
    chapterLaw,
    chapterVoiceSpec,
    chapterCharacterHiddenHistories,
    chapterEpicSimulation,
    previousDraft,
    previousConsistencyReport,
    previousVoiceReport,
    previousGapReport,
    previousAdversarialSummary,
    characterConsoleSession,
    lawConsoleSession,
    criticFeedbackMap,
    highFindingReductionPlan,
    commitCanonical: false,
  });

  const regeneratedDraftJsonPath = path.join(reportsDir, "book1-chapter-01-regenerated-draft.json");
  const regeneratedDraftTextPath = path.join(reportsDir, "book1-chapter-01-regenerated-draft.txt");
  const voiceContractPath = path.join(reportsDir, "book1-chapter-01-voice-contract.json");
  const proseBriefsPath = path.join(reportsDir, "book1-chapter-01-prose-briefs.json");
  const livedHistoryPath = path.join(reportsDir, "book1-chapter-01-lived-history.json");
  const cognitionSignaturesPath = path.join(reportsDir, "book1-chapter-01-cognition-signatures.json");
  const segmentSimulationStatePath = path.join(reportsDir, "book1-chapter-01-segment-simulation-state.json");
  const thoughtRecurrenceGuardPath = path.join(reportsDir, "book1-chapter-01-thought-recurrence-guard.json");
  const motiveCompressionPath = path.join(reportsDir, "book1-chapter-01-motive-compression.json");
  const characterDistinctionPlanPath = path.join(reportsDir, "book1-chapter-01-character-distinction-plan.json");
  const enneagramOperatingLayerPath = path.join(reportsDir, "book1-chapter-01-enneagram-operating-layer.json");
  const enneagramConsciousnessEnginePath = path.join(reportsDir, "book1-chapter-01-enneagram-consciousness-engine.json");
  const enneagramMediationLayerPath = path.join(reportsDir, "book1-chapter-01-enneagram-mediation-layer.json");
  const abstractFearSuppressionPath = path.join(reportsDir, "book1-chapter-01-abstract-fear-suppression.json");
  const entryStrategyPlanPath = path.join(reportsDir, "book1-chapter-01-entry-strategy-plan.json");
  const paragraphShapePlanPath = path.join(reportsDir, "book1-chapter-01-paragraph-shape-plan.json");
  const embodimentAssemblyAdjustmentsPath = path.join(reportsDir, "book1-chapter-01-embodiment-assembly-adjustments.json");
  const transitionTexturePlanPath = path.join(reportsDir, "book1-chapter-01-transition-texture-plan.json");
  const segment24OpenerPolicyPath = path.join(reportsDir, "book1-chapter-01-segment-2-4-opener-policy.json");
  const segment24EmbodimentPolicyPath = path.join(reportsDir, "book1-chapter-01-segment-2-4-embodiment-policy.json");
  const openingFamilyAuditPath = path.join(reportsDir, "book1-chapter-01-opening-family-audit.json");
  const openingParagraphFamilyPlanPath = path.join(reportsDir, "book1-chapter-01-opening-paragraph-family-plan.json");
  const openerTokenAuditPath = path.join(reportsDir, "book1-chapter-01-opener-token-audit.json");
  const firstTwoSentencePlanPath = path.join(reportsDir, "book1-chapter-01-first-two-sentence-plan.json");
  const openerFamilyMemoryPath = path.join(reportsDir, "book1-chapter-01-opener-family-memory.json");
  const segment1OpenerIsolationPath = path.join(reportsDir, "book1-chapter-01-segment-1-opener-isolation.json");
  const earlyParagraphAntiSymmetryPath = path.join(reportsDir, "book1-chapter-01-early-paragraph-anti-symmetry.json");
  const voiceEngineRulebookPath = path.join(reportsDir, "book1-chapter-01-voice-engine-rulebook.json");
  const narrativeDistancePlanPath = path.join(reportsDir, "book1-chapter-01-narrative-distance-plan.json");
  const abstractionSuppressionPath = path.join(reportsDir, "book1-chapter-01-abstraction-suppression.json");
  const voiceCognitionMapPath = path.join(reportsDir, "book1-chapter-01-voice-cognition-map.json");
  const perspectiveRoutingPlanPath = path.join(reportsDir, "book1-chapter-01-perspective-routing-plan.json");
  const voiceLawEnginePath = path.join(reportsDir, "book1-chapter-01-voice-law-engine.json");
  const languageSuppressionMapPath = path.join(reportsDir, "book1-chapter-01-language-suppression-map.json");
  const renderDirectivesPath = path.join(reportsDir, "book1-chapter-01-render-directives.json");
  const consciousnessCohesionRouterPath = path.join(reportsDir, "book1-chapter-01-consciousness-cohesion-router.json");
  const voiceIdentityStabilizerPath = path.join(reportsDir, "book1-chapter-01-voice-identity-stabilizer.json");
  const embodiedInnerLifeRouterPath = path.join(reportsDir, "book1-chapter-01-embodied-inner-life-router.json");
  const sentencePatternPlanPath = path.join(reportsDir, "book1-chapter-01-sentence-pattern-plan.json");
  const segmentEnergyPath = path.join(reportsDir, "book1-chapter-01-segment-energy.json");
  const embodimentPath = path.join(reportsDir, "book1-chapter-01-embodiment.json");
  const proseShapeCriticPath = path.join(reportsDir, "book1-chapter-01-prose-shape-critic.json");
  const proseShapeSummaryPath = path.join(reportsDir, "book1-chapter-01-prose-shape-summary.json");
  const regeneratedConsistencyReportPath = path.join(reportsDir, "book1-chapter-01-regenerated-consistency-report.json");
  const regeneratedVoiceReportPath = path.join(reportsDir, "book1-chapter-01-regenerated-voice-report.json");
  const regeneratedGapReportPath = path.join(reportsDir, "book1-chapter-01-regenerated-gap-report.json");
  const regeneratedAdversarialSummaryPath = path.join(reportsDir, "book1-chapter-01-regenerated-adversarial-summary.json");
  const regenerationReviewPath = path.join(reportsDir, "book1-chapter-01-regeneration-review.json");
  const regenerationDiffPath = path.join(reportsDir, "book1-chapter-01-regeneration-diff.json");
  const regenerationSummaryPath = path.join(reportsDir, "book1-chapter-01-regeneration-summary.json");
  const criticFeedbackMapPath = path.join(reportsDir, "book1-chapter-01-critic-feedback-map.json");
  const highFindingReductionPlanPath = path.join(reportsDir, "book1-chapter-01-high-finding-reduction-plan.json");
  const beatAssemblyResultPath = path.join(reportsDir, "book1-chapter-01-beat-assembly-result.json");
  const beatAssemblyPreflightPath = path.join(reportsDir, "book1-chapter-01-beat-assembly-preflight.json");
  const narrativePsychologyArchitecturePath = path.join(reportsDir, "book1-narrative-psychology-architecture.json");
  const narrativePsychologyValidationPath = path.join(reportsDir, "book1-chapter-01-narrative-psychology-validation.json");
  const narrativePsychologyChapterStateBiasPath = path.join(reportsDir, "book1-chapter-01-narrative-psychology-chapter-state-bias.json");
  const narrativePsychologyBeatBiasPath = path.join(reportsDir, "book1-chapter-01-narrative-psychology-beat-bias.json");
  const proseGenerationConstraintsPath = path.join(reportsDir, "book1-chapter-01-prose-generation-constraints.json");
  const proseGenerationPreflightPath = path.join(reportsDir, "book1-chapter-01-prose-generation-preflight.json");
  const proseGenerationValidationPath = path.join(reportsDir, "book1-chapter-01-prose-generation-validation.json");
  const literaryDevicePackPath = path.join(reportsDir, "book1-chapter-01-literary-device-pack.json");
  const literaryDeviceApplicationPlanPath = path.join(reportsDir, "book1-chapter-01-literary-device-application-plan.json");
  const literaryDeviceValidationPath = path.join(reportsDir, "book1-chapter-01-literary-device-validation.json");
  const literaryDeviceCockpitSummaryPath = path.join(reportsDir, "book1-chapter-01-literary-device-cockpit-summary.json");
  const chapter1ProsePacketPath = path.join(reportsDir, "book1-chapter-01-prose-generation-packet.json");
  const chapter1ProseOutputPathReportPath = path.join(reportsDir, "book1-chapter-01-prose-output-path-report.json");
  const authorCockpitBundlePath = path.join(reportsDir, "book1-chapter-01-author-cockpit-bundle.json");

  const regeneratedFromReview = (result.regenerationReview as { regenerated?: Record<string, unknown> }).regenerated ?? {};
  const regeneratedConsistencyReport = regeneratedFromReview.consistencyReport;
  const regeneratedVoiceReport = regeneratedFromReview.voiceReport;
  const regeneratedGapReport = regeneratedFromReview.gapReport;
  const regeneratedAdversarialSummary =
    (regeneratedFromReview.adversarialReview as { summary?: Record<string, unknown> } | undefined)?.summary;

  if (!regeneratedConsistencyReport || !regeneratedVoiceReport || !regeneratedGapReport || !regeneratedAdversarialSummary) {
    throw new Error("Regeneration review is missing regenerated report artifacts.");
  }

  await Promise.all([
    writeFile(regeneratedDraftJsonPath, `${JSON.stringify(result.regeneratedDraftJson, null, 2)}\n`, "utf-8"),
    writeFile(regeneratedDraftTextPath, `${result.regeneratedDraftText}\n`, "utf-8"),
    writeFile(voiceContractPath, `${JSON.stringify(result.voiceContract, null, 2)}\n`, "utf-8"),
    writeFile(proseBriefsPath, `${JSON.stringify(result.proseBriefs, null, 2)}\n`, "utf-8"),
    writeFile(livedHistoryPath, `${JSON.stringify(result.livedHistory, null, 2)}\n`, "utf-8"),
    writeFile(cognitionSignaturesPath, `${JSON.stringify(result.cognitionSignatures, null, 2)}\n`, "utf-8"),
    writeFile(segmentSimulationStatePath, `${JSON.stringify(result.segmentSimulationState, null, 2)}\n`, "utf-8"),
    writeFile(thoughtRecurrenceGuardPath, `${JSON.stringify(result.thoughtRecurrenceGuard, null, 2)}\n`, "utf-8"),
    writeFile(motiveCompressionPath, `${JSON.stringify(result.motiveCompression, null, 2)}\n`, "utf-8"),
    writeFile(characterDistinctionPlanPath, `${JSON.stringify(result.characterDistinctionPlan, null, 2)}\n`, "utf-8"),
    writeFile(enneagramOperatingLayerPath, `${JSON.stringify(result.enneagramOperatingLayer, null, 2)}\n`, "utf-8"),
    writeFile(enneagramConsciousnessEnginePath, `${JSON.stringify(result.enneagramConsciousnessEngine, null, 2)}\n`, "utf-8"),
    writeFile(enneagramMediationLayerPath, `${JSON.stringify(result.enneagramMediationLayer, null, 2)}\n`, "utf-8"),
    writeFile(abstractFearSuppressionPath, `${JSON.stringify(result.abstractFearSuppression, null, 2)}\n`, "utf-8"),
    writeFile(entryStrategyPlanPath, `${JSON.stringify(result.entryStrategyPlan, null, 2)}\n`, "utf-8"),
    writeFile(paragraphShapePlanPath, `${JSON.stringify(result.paragraphShapePlan, null, 2)}\n`, "utf-8"),
    writeFile(embodimentAssemblyAdjustmentsPath, `${JSON.stringify(result.embodimentAssemblyAdjustments, null, 2)}\n`, "utf-8"),
    writeFile(transitionTexturePlanPath, `${JSON.stringify(result.transitionTexturePlan, null, 2)}\n`, "utf-8"),
    writeFile(segment24OpenerPolicyPath, `${JSON.stringify(result.segment24OpenerPolicy, null, 2)}\n`, "utf-8"),
    writeFile(segment24EmbodimentPolicyPath, `${JSON.stringify(result.segment24EmbodimentPolicy, null, 2)}\n`, "utf-8"),
    writeFile(openingFamilyAuditPath, `${JSON.stringify(result.openingFamilyAudit, null, 2)}\n`, "utf-8"),
    writeFile(openingParagraphFamilyPlanPath, `${JSON.stringify(result.openingParagraphFamilyPlan, null, 2)}\n`, "utf-8"),
    writeFile(openerTokenAuditPath, `${JSON.stringify(result.openerTokenAudit, null, 2)}\n`, "utf-8"),
    writeFile(firstTwoSentencePlanPath, `${JSON.stringify(result.firstTwoSentencePlan, null, 2)}\n`, "utf-8"),
    writeFile(openerFamilyMemoryPath, `${JSON.stringify(result.openerFamilyMemory, null, 2)}\n`, "utf-8"),
    writeFile(segment1OpenerIsolationPath, `${JSON.stringify(result.segment1OpenerIsolation, null, 2)}\n`, "utf-8"),
    writeFile(earlyParagraphAntiSymmetryPath, `${JSON.stringify(result.earlyParagraphAntiSymmetry, null, 2)}\n`, "utf-8"),
    writeFile(voiceEngineRulebookPath, `${JSON.stringify(result.voiceEngineRulebook, null, 2)}\n`, "utf-8"),
    writeFile(narrativeDistancePlanPath, `${JSON.stringify(result.narrativeDistancePlan, null, 2)}\n`, "utf-8"),
    writeFile(abstractionSuppressionPath, `${JSON.stringify(result.abstractionSuppression, null, 2)}\n`, "utf-8"),
    writeFile(voiceCognitionMapPath, `${JSON.stringify(result.voiceCognitionMap, null, 2)}\n`, "utf-8"),
    writeFile(perspectiveRoutingPlanPath, `${JSON.stringify(result.perspectiveRoutingPlan, null, 2)}\n`, "utf-8"),
    writeFile(voiceLawEnginePath, `${JSON.stringify(result.voiceLawEngine, null, 2)}\n`, "utf-8"),
    writeFile(languageSuppressionMapPath, `${JSON.stringify(result.languageSuppressionMap, null, 2)}\n`, "utf-8"),
    writeFile(renderDirectivesPath, `${JSON.stringify(result.renderDirectives, null, 2)}\n`, "utf-8"),
    writeFile(consciousnessCohesionRouterPath, `${JSON.stringify(result.consciousnessCohesionRouter, null, 2)}\n`, "utf-8"),
    writeFile(voiceIdentityStabilizerPath, `${JSON.stringify(result.voiceIdentityStabilizer, null, 2)}\n`, "utf-8"),
    writeFile(embodiedInnerLifeRouterPath, `${JSON.stringify(result.embodiedInnerLifeRouter, null, 2)}\n`, "utf-8"),
    writeFile(sentencePatternPlanPath, `${JSON.stringify(result.sentencePatternPlan, null, 2)}\n`, "utf-8"),
    writeFile(segmentEnergyPath, `${JSON.stringify(result.segmentEnergy, null, 2)}\n`, "utf-8"),
    writeFile(embodimentPath, `${JSON.stringify(result.embodiment, null, 2)}\n`, "utf-8"),
    writeFile(proseShapeCriticPath, `${JSON.stringify(result.proseShapeCritic, null, 2)}\n`, "utf-8"),
    writeFile(proseShapeSummaryPath, `${JSON.stringify(result.proseShapeSummary, null, 2)}\n`, "utf-8"),
    writeFile(regeneratedConsistencyReportPath, `${JSON.stringify(regeneratedConsistencyReport, null, 2)}\n`, "utf-8"),
    writeFile(regeneratedVoiceReportPath, `${JSON.stringify(regeneratedVoiceReport, null, 2)}\n`, "utf-8"),
    writeFile(regeneratedGapReportPath, `${JSON.stringify(regeneratedGapReport, null, 2)}\n`, "utf-8"),
    writeFile(regeneratedAdversarialSummaryPath, `${JSON.stringify(regeneratedAdversarialSummary, null, 2)}\n`, "utf-8"),
    writeFile(regenerationReviewPath, `${JSON.stringify(result.regenerationReview, null, 2)}\n`, "utf-8"),
    writeFile(regenerationDiffPath, `${JSON.stringify(result.regenerationDiff, null, 2)}\n`, "utf-8"),
    writeFile(regenerationSummaryPath, `${JSON.stringify(result.regenerationSummary, null, 2)}\n`, "utf-8"),
    writeFile(criticFeedbackMapPath, `${JSON.stringify(criticFeedbackMap, null, 2)}\n`, "utf-8"),
    writeFile(highFindingReductionPlanPath, `${JSON.stringify(highFindingReductionPlan, null, 2)}\n`, "utf-8"),
    writeFile(beatAssemblyResultPath, `${JSON.stringify(result.beatAssemblyResult, null, 2)}\n`, "utf-8"),
    writeFile(beatAssemblyPreflightPath, `${JSON.stringify(result.beatAssemblyPreflight, null, 2)}\n`, "utf-8"),
    writeFile(narrativePsychologyArchitecturePath, `${JSON.stringify(result.narrativePsychologyArchitecture, null, 2)}\n`, "utf-8"),
    writeFile(narrativePsychologyValidationPath, `${JSON.stringify(result.narrativePsychologyValidation, null, 2)}\n`, "utf-8"),
    writeFile(narrativePsychologyChapterStateBiasPath, `${JSON.stringify(result.narrativePsychologyChapterStateBias, null, 2)}\n`, "utf-8"),
    writeFile(narrativePsychologyBeatBiasPath, `${JSON.stringify(result.narrativePsychologyBeatBias, null, 2)}\n`, "utf-8"),
    writeFile(proseGenerationConstraintsPath, `${JSON.stringify(result.proseGenerationConstraints, null, 2)}\n`, "utf-8"),
    writeFile(proseGenerationPreflightPath, `${JSON.stringify(result.proseGenerationPreflight, null, 2)}\n`, "utf-8"),
    writeFile(proseGenerationValidationPath, `${JSON.stringify(result.proseGenerationValidation, null, 2)}\n`, "utf-8"),
    writeFile(literaryDevicePackPath, `${JSON.stringify(result.literaryDevicePack, null, 2)}\n`, "utf-8"),
    writeFile(literaryDeviceApplicationPlanPath, `${JSON.stringify(result.literaryDeviceApplicationPlan, null, 2)}\n`, "utf-8"),
    writeFile(literaryDeviceValidationPath, `${JSON.stringify(result.literaryDeviceValidation, null, 2)}\n`, "utf-8"),
    writeFile(literaryDeviceCockpitSummaryPath, `${JSON.stringify(result.literaryDeviceCockpitSummary, null, 2)}\n`, "utf-8"),
    writeFile(chapter1ProsePacketPath, `${JSON.stringify(result.chapter1ProseGenerationPacket, null, 2)}\n`, "utf-8"),
    writeFile(chapter1ProseOutputPathReportPath, `${JSON.stringify(result.chapter1ProseOutputPathReport, null, 2)}\n`, "utf-8"),
    writeFile(authorCockpitBundlePath, `${JSON.stringify(result.authorCockpitBundle, null, 2)}\n`, "utf-8"),
  ]);

  console.log(
    JSON.stringify(
      {
        chapter: 1,
        outputPaths: [
          path.relative(process.cwd(), regeneratedDraftJsonPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), regeneratedDraftTextPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), voiceContractPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), proseBriefsPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), livedHistoryPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), cognitionSignaturesPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), segmentSimulationStatePath).replace(/\\/g, "/"),
          path.relative(process.cwd(), thoughtRecurrenceGuardPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), motiveCompressionPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), characterDistinctionPlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), enneagramOperatingLayerPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), enneagramConsciousnessEnginePath).replace(/\\/g, "/"),
          path.relative(process.cwd(), enneagramMediationLayerPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), abstractFearSuppressionPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), entryStrategyPlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), paragraphShapePlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), embodimentAssemblyAdjustmentsPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), transitionTexturePlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), segment24OpenerPolicyPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), segment24EmbodimentPolicyPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), openingFamilyAuditPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), openingParagraphFamilyPlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), openerTokenAuditPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), firstTwoSentencePlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), openerFamilyMemoryPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), segment1OpenerIsolationPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), earlyParagraphAntiSymmetryPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), voiceEngineRulebookPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), narrativeDistancePlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), abstractionSuppressionPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), voiceCognitionMapPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), perspectiveRoutingPlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), voiceLawEnginePath).replace(/\\/g, "/"),
          path.relative(process.cwd(), languageSuppressionMapPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), renderDirectivesPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), consciousnessCohesionRouterPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), voiceIdentityStabilizerPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), embodiedInnerLifeRouterPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), sentencePatternPlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), segmentEnergyPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), embodimentPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), proseShapeCriticPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), proseShapeSummaryPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), regeneratedConsistencyReportPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), regeneratedVoiceReportPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), regeneratedGapReportPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), regeneratedAdversarialSummaryPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), regenerationReviewPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), regenerationDiffPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), regenerationSummaryPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), criticFeedbackMapPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), highFindingReductionPlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), beatAssemblyResultPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), beatAssemblyPreflightPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), narrativePsychologyArchitecturePath).replace(/\\/g, "/"),
          path.relative(process.cwd(), narrativePsychologyValidationPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), narrativePsychologyChapterStateBiasPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), narrativePsychologyBeatBiasPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), proseGenerationConstraintsPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), proseGenerationPreflightPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), proseGenerationValidationPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), literaryDevicePackPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), literaryDeviceApplicationPlanPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), literaryDeviceValidationPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), literaryDeviceCockpitSummaryPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), chapter1ProsePacketPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), chapter1ProseOutputPathReportPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), authorCockpitBundlePath).replace(/\\/g, "/"),
        ],
        recommendation: result.regenerationSummary.recommendation,
        changedSystems: result.regenerationSummary.changedSystems,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Chapter 1 regeneration loop failed.");
  console.error(error);
  process.exitCode = 1;
});
