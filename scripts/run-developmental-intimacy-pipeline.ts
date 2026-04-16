import * as fs from "node:fs";
import * as path from "node:path";

import { Book1RegenerationLoopService } from "@/lib/services/book1-regeneration-loop-service";
import { Book1ChapterAdversarialReviewService } from "@/lib/services/book1-chapter-adversarial-review-service";
import { Book1DecisionPanelService } from "@/lib/services/book1-decision-panel-service";

const reportsDir = path.resolve(__dirname, "../reports");

function loadJson(filename: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(reportsDir, filename), "utf-8"));
}

function saveJson(filename: string, data: unknown): void {
  fs.writeFileSync(path.join(reportsDir, filename), JSON.stringify(data, null, 2));
}

const outline = loadJson("book1-chapter-01-outline.json") as { chapter: number; timeline: Array<{ segment: number; sceneFocus: string; setting: string; characters: string[]; psychology: string; narrativePurpose: string; readerExperience: string; foreshadowing: string; historicalContext: string; transitionToNext: string }> };
const evidencePack = loadJson("book1-chapter-01-chapter_evidence_pack.json");
const law = loadJson("book1-chapter-01-chapter_law.json");
const voiceSpec = loadJson("book1-chapter-01-chapter_voice_spec.json");
const hiddenHistories = loadJson("book1-chapter-01-chapter_character_hidden_histories.json");
const epicSimulation = loadJson("book1-chapter-01-chapter_epic_simulation.json");
const previousDraft = loadJson("book1-chapter-01-draft.json");
const previousConsistency = loadJson("book1-chapter-01-chapter_consistency_report.json");
const previousVoice = loadJson("book1-chapter-01-chapter_voice_report.json");
const previousGap = loadJson("book1-chapter-01-chapter_gap_report.json");
const previousAdversarial = loadJson("book1-chapter-01-adversarial-summary.json");

let characterSession: unknown;
try { characterSession = loadJson("book1-character-console-session.json"); } catch {
  characterSession = {
    governancePolicy: { allowAnchorMutation: false },
    branchSandbox: { simulatedMutations: [], canonicalMutations: [{ mutationId: "M-1", targetKey: "alexis.state.fearWeight" }] },
    turns: [{ proposedMutation: { mutationId: "M-1", mutationKind: "character_state", targetKey: "alexis.state.fearWeight", patch: { fearWeight: 0.8 }, provenanceRefs: [] } }],
  };
}

let lawSession: unknown;
try { lawSession = loadJson("book1-law-console-session.json"); } catch {
  lawSession = {
    governancePolicy: { allowAnchorMutation: false },
    branchSandbox: { simulatedPatches: [], canonicalMutations: [{ actionId: "L-1" }] },
    actions: [{ actionId: "L-1", actionType: "adjust_symbolic_emphasis", targetKey: "river-oath", patch: { motifWeight: 0.72 }, provenanceRefs: [] }],
  };
}

let criticFeedbackMap: unknown;
try { criticFeedbackMap = loadJson("book1-chapter-01-critic-feedback-map.json"); } catch { criticFeedbackMap = undefined; }

let highFindingReductionPlan: unknown;
try { highFindingReductionPlan = loadJson("book1-chapter-01-high-finding-reduction-plan.json"); } catch { highFindingReductionPlan = undefined; }

console.log("=== Regeneration Loop (with Developmental Intimacy Engine) ===");
const regenerationService = new Book1RegenerationLoopService();
const result = regenerationService.run({
  chapterOutline: outline,
  chapterEvidencePack: evidencePack,
  chapterLaw: law,
  chapterVoiceSpec: voiceSpec,
  chapterCharacterHiddenHistories: hiddenHistories,
  chapterEpicSimulation: epicSimulation,
  previousDraft,
  previousConsistencyReport: previousConsistency,
  previousVoiceReport: previousVoice,
  previousGapReport: previousGap,
  previousAdversarialSummary: previousAdversarial,
  characterConsoleSession: characterSession,
  lawConsoleSession: lawSession,
  criticFeedbackMap,
  highFindingReductionPlan,
});

saveJson("book1-chapter-01-developmental-regenerated-draft.json", result.regeneratedDraftJson);
fs.writeFileSync(path.join(reportsDir, "book1-chapter-01-developmental-regenerated-draft.txt"), result.regeneratedDraftText);
saveJson("book1-chapter-01-developmental-regeneration-diff.json", result.regenerationDiff);
saveJson("book1-chapter-01-developmental-regeneration-summary.json", result.regenerationSummary);
saveJson("book1-chapter-01-developmental-intimacy-engine-output.json", result.developmentalIntimacyEngine);

console.log("Regeneration complete.");
const summary = result.regenerationSummary as {
  recommendation: string;
  whatImproved: string[];
  whatWorsened: string[];
  unchangedRisks: string[];
  enneagramOverexposureRisk: string;
  behaviorMediationQuality: string;
  proseTheorizationRisk: string;
  changedSystems: string[];
};
console.log(`  Recommendation: ${summary.recommendation}`);
console.log(`  Changed systems: ${summary.changedSystems.length}`);
console.log(`  Improved: ${summary.whatImproved.join(", ") || "none"}`);
console.log(`  Worsened: ${summary.whatWorsened.join(", ") || "none"}`);
console.log(`  Unchanged risks: ${summary.unchangedRisks.join(", ") || "none"}`);
console.log(`  Enneagram overexposure: ${summary.enneagramOverexposureRisk}`);
console.log(`  Behavior mediation: ${summary.behaviorMediationQuality}`);
console.log(`  Prose theorization: ${summary.proseTheorizationRisk}`);
console.log(`  Developmental engine in changed systems: ${summary.changedSystems.includes("developmental_intimacy_engine")}`);

console.log("\n=== Adversarial Review ===");
const adversarialService = new Book1ChapterAdversarialReviewService();
const draftForCritics = {
  artifact: "chapter_draft" as const,
  schemaVersion: "1.0.0" as const,
  chapter: 1 as const,
  generatedAt: new Date().toISOString(),
  composerInputs: ["chapter_law", "chapter_evidence_pack"],
  title: result.regeneratedDraftJson.title,
  segments: result.regeneratedDraftJson.segmentDrafts.map((s) => ({
    segment: s.segment,
    objective: "scene embodiment",
    text: s.text,
    evidenceRefs: ["KN-1"],
  })),
  fullText: result.regeneratedDraftJson.fullText,
};
const adversarialResult = adversarialService.run({ chapterDraft: draftForCritics, outline });
saveJson("book1-chapter-01-developmental-adversarial-summary.json", adversarialResult.summary);

console.log(`  Total findings: ${adversarialResult.summary.severityTotals.low + adversarialResult.summary.severityTotals.medium + adversarialResult.summary.severityTotals.high + adversarialResult.summary.severityTotals.critical}`);
console.log(`  Critical: ${adversarialResult.summary.severityTotals.critical}`);
console.log(`  High: ${adversarialResult.summary.severityTotals.high}`);
console.log(`  Medium: ${adversarialResult.summary.severityTotals.medium}`);
console.log(`  Low: ${adversarialResult.summary.severityTotals.low}`);
console.log(`  Voice findings: ${adversarialResult.summary.critics.voice.findingCount} (critical: ${adversarialResult.summary.critics.voice.criticalCount})`);
console.log(`  ProseShape findings: ${adversarialResult.summary.critics.proseShape.findingCount} (critical: ${adversarialResult.summary.critics.proseShape.criticalCount})`);
console.log(`  Release decision: ${adversarialResult.summary.releaseDecision}`);

const proseCategories = adversarialResult.summary.proseShapeCategoryTotals ?? {};
console.log("\n=== Target Metric Measurement ===");
const characterInteriorBlending =
  (proseCategories.character_interior_blending ?? 0) +
  (proseCategories.motive_restatement_clusters ?? 0) +
  (proseCategories.repeated_thought_content ?? 0);
const voiceIdentityRisk =
  (adversarialResult.summary.critics.voice.criticalCount * 2) +
  adversarialResult.summary.critics.voice.findingCount +
  (proseCategories.repeated_opener ?? 0);
const abstractionLeak =
  (proseCategories.abstraction_overuse_by_segment ?? 0) +
  (proseCategories.repeated_abstract_fear_language ?? 0) +
  (proseCategories.repeated_symbolic_paraphrase ?? 0);
const proseTheorizationSignals = Object.entries(proseCategories)
  .filter(([key]) => key.includes("abstraction") || key.includes("theory"))
  .reduce((sum, [, count]) => sum + (count as number), 0);

console.log(`  character_interior_blending composite: ${characterInteriorBlending}`);
console.log(`  voice_identity_risk composite: ${voiceIdentityRisk}`);
console.log(`  abstraction_leak composite: ${abstractionLeak}`);
console.log(`  prose_theorization signals: ${proseTheorizationSignals}`);

const diffMetrics = (result.regenerationDiff as { metrics: Record<string, { before: number; after: number; trend: string }> }).metrics;
console.log("\n=== Regeneration Diff Metrics ===");
for (const [key, val] of Object.entries(diffMetrics)) {
  console.log(`  ${key}: ${val.before} -> ${val.after} (${val.trend})`);
}

console.log("\n=== Decision Panel ===");
const decisionService = new Book1DecisionPanelService();
const decisionPanel = decisionService.build({
  canonicalArtifacts: {
    chapterDraftPath: "reports/book1-chapter-01-chapter_draft.json",
    chapterLawPath: "reports/book1-chapter-01-chapter_law.json",
    chapterVoiceSpecPath: "reports/book1-chapter-01-chapter_voice_spec.json",
    chapterEvidencePackPath: "reports/book1-chapter-01-chapter_evidence_pack.json",
  },
  latestRegeneratedDraftPath: "reports/book1-chapter-01-developmental-regenerated-draft.json",
  characterConsoleSession: characterSession,
  lawConsoleSession: lawSession,
  regenerationSummary: result.regenerationSummary,
  regenerationDiff: result.regenerationDiff,
  consistencyReport: previousConsistency,
  voiceReport: previousVoice,
  gapReport: previousGap,
  adversarialSummary: adversarialResult.summary,
});
saveJson("book1-chapter-01-developmental-decision-panel.json", decisionPanel);

console.log(`  Chapter status: ${decisionPanel.chapterStatus}`);
console.log(`  Final recommendation: ${decisionPanel.finalRecommendation}`);
console.log(`  Voice identity risk: ${decisionPanel.voiceIdentityRisk}`);
console.log(`  Character interior blending risk: ${decisionPanel.characterInteriorBlendingRisk}`);
console.log(`  Abstraction leak risk: ${decisionPanel.abstractionLeakRisk}`);
console.log(`  Prose theorization risk: ${decisionPanel.proseTheorizationRisk}`);
console.log(`  Enneagram overexposure risk: ${decisionPanel.enneagramOverexposureRisk}`);
console.log(`  Behavior mediation quality: ${decisionPanel.behaviorMediationQuality}`);

console.log("\n=== Pipeline Complete ===");
