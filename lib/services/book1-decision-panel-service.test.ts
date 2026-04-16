import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1DecisionPanelService } from "@/lib/services/book1-decision-panel-service";

describe("book1-decision-panel-service", () => {
  it("builds a decision panel with chapter status and grouped mutations", () => {
    const panel = new Book1DecisionPanelService().build({
      canonicalArtifacts: {
        chapterDraftPath: "reports/book1-chapter-01-chapter_draft.json",
        chapterLawPath: "reports/book1-chapter-01-chapter_law.json",
        chapterVoiceSpecPath: "reports/book1-chapter-01-chapter_voice_spec.json",
        chapterEvidencePackPath: "reports/book1-chapter-01-chapter_evidence_pack.json",
      },
      latestRegeneratedDraftPath: "reports/book1-chapter-01-regenerated-draft.json",
      characterConsoleSession: {
        generatedAt: new Date().toISOString(),
        branchSandbox: {
          simulatedMutations: [{ mutationId: "m1", mutationKind: "dialogue", targetKey: "k", patch: { a: 1 } }],
          canonicalMutations: [],
        },
        evaluations: [],
        provenance: { sourceArtifacts: ["reports/book1-character-console-session.json"] },
      },
      lawConsoleSession: {
        generatedAt: new Date().toISOString(),
        branchSandbox: {
          simulatedPatches: [{ actionId: "a1", actionType: "adjust_symbolic_emphasis", targetKey: "t", patch: { w: 0.7 } }],
          canonicalMutations: [],
        },
        evaluations: [{ actionId: "a2", actionType: "propose_anchor_mutation", allowed: false, lockedAnchorViolation: true, canonRisk: "critical", reason: "blocked" }],
        sourceStateProvenance: { sourceArtifacts: ["reports/book1-law-console-session.json"] },
      },
      regenerationSummary: {
        chapter: 1,
        generatedAt: new Date().toISOString(),
        changedSystems: ["character_console", "law_console"],
        changedChapterLawConditions: [],
        changedCharacterStateConditions: [],
        whatImproved: ["gapCount"],
        whatWorsened: ["voicePassRate"],
        unchangedRisks: ["consistencyPassCount"],
        enneagramOverexposureRisk: "moderate",
        behaviorMediationQuality: "adequate",
        proseTheorizationRisk: "moderate",
        recommendation: "iterate again",
        canonRisk: "high",
        lockedAnchorsEnforced: true,
        provenance: { sourceArtifacts: [] },
      },
      regenerationDiff: {
        chapter: 1,
        generatedAt: new Date().toISOString(),
        comparedAgainst: {
          draft: "reports/book1-chapter-01-draft.json",
          consistency: "reports/book1-chapter-01-chapter_consistency_report.json",
          voice: "reports/book1-chapter-01-chapter_voice_report.json",
          gap: "reports/book1-chapter-01-chapter_gap_report.json",
          adversarialSummary: "reports/book1-chapter-01-adversarial-summary.json",
        },
        metrics: {
          consistencyPassCount: { before: 3, after: 3, trend: "unchanged" },
          voicePassRate: { before: 1, after: 0, trend: "worsened" },
          gapCount: { before: 3, after: 1, trend: "improved" },
          adversarialCriticalFindings: { before: 10, after: 8, trend: "improved" },
          adversarialHighFindings: { before: 9, after: 7, trend: "improved" },
        },
        lockEnforcement: { lockedAnchorViolations: 1, blockedMutations: ["law:a2"] },
      },
      consistencyReport: {
        artifact: "chapter_consistency_report",
        chronology: { passed: true, findings: [] },
        futureArc: { passed: true, findings: [] },
        firewall: { passed: true, findings: [] },
      },
      voiceReport: {
        artifact: "chapter_voice_report",
        passRate: 0,
        checks: [],
      },
      gapReport: {
        artifact: "chapter_gap_report",
        missingInformation: [{ gapId: "g1", requiredBeforeLock: true, impactOnChapter: "impact" }],
      },
      adversarialSummary: {
        chapter: 1,
        generatedAt: new Date().toISOString(),
        severityTotals: { low: 0, medium: 1, high: 3, critical: 1 },
        critics: {
          voice: { findingCount: 1, criticalCount: 0 },
          historical: { findingCount: 4, criticalCount: 1 },
          novel: { findingCount: 3, criticalCount: 1 },
          proseShape: { findingCount: 3, criticalCount: 1 },
        },
        releaseDecision: "BLOCKED",
      },
    });

    const typedPanel = panel as Record<string, unknown>;
    const appliedMutations = typedPanel.appliedMutations as {
      characterConsole: { count: number };
      lawConsole: { count: number };
    };
    const lockedAnchorWarnings = typedPanel.lockedAnchorWarnings as { violations: number };
    assert.equal(typedPanel.chapterStatus, "needs_iteration");
    assert.equal(appliedMutations.characterConsole.count, 1);
    assert.equal(appliedMutations.lawConsole.count, 1);
    assert.equal(lockedAnchorWarnings.violations, 1);
    assert.equal(typeof typedPanel.finalRecommendation, "string");
    assert.equal(typeof typedPanel.temporalIntegrityRisk, "string");
    assert.equal(typeof typedPanel.voiceIdentityRisk, "string");
    assert.equal(typeof typedPanel.characterInteriorBlendingRisk, "string");
    assert.equal(typeof typedPanel.abstractionLeakRisk, "string");
    assert.equal(typeof typedPanel.enneagramOverexposureRisk, "string");
    assert.equal(typeof typedPanel.behaviorMediationQuality, "string");
    assert.equal(typeof typedPanel.proseTheorizationRisk, "string");
  });
});
