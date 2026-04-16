import { z } from "zod";

const RegenerationSummarySchema = z.object({
  chapter: z.literal(1),
  generatedAt: z.string(),
  changedSystems: z.array(z.string()),
  changedChapterLawConditions: z.array(z.string()),
  changedCharacterStateConditions: z.array(z.string()),
  whatImproved: z.array(z.string()),
  whatWorsened: z.array(z.string()),
  unchangedRisks: z.array(z.string()),
  enneagramOverexposureRisk: z.string().optional(),
  behaviorMediationQuality: z.string().optional(),
  proseTheorizationRisk: z.string().optional(),
  recommendation: z.enum(["accept new draft", "reject new draft", "iterate again"]),
  canonRisk: z.enum(["low", "moderate", "high", "critical"]),
  lockedAnchorsEnforced: z.boolean(),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()),
  }),
});

const RegenerationDiffSchema = z.object({
  chapter: z.literal(1),
  generatedAt: z.string(),
  comparedAgainst: z.object({
    draft: z.string(),
    consistency: z.string(),
    voice: z.string(),
    gap: z.string(),
    adversarialSummary: z.string(),
  }),
  metrics: z.object({
    consistencyPassCount: z.object({ before: z.number(), after: z.number(), trend: z.enum(["improved", "worsened", "unchanged"]) }),
    voicePassRate: z.object({ before: z.number(), after: z.number(), trend: z.enum(["improved", "worsened", "unchanged"]) }),
    gapCount: z.object({ before: z.number(), after: z.number(), trend: z.enum(["improved", "worsened", "unchanged"]) }),
    adversarialCriticalFindings: z.object({ before: z.number(), after: z.number(), trend: z.enum(["improved", "worsened", "unchanged"]) }),
    adversarialHighFindings: z.object({ before: z.number(), after: z.number(), trend: z.enum(["improved", "worsened", "unchanged"]) }),
    proseShapeCriticalFindings: z
      .object({ before: z.number(), after: z.number(), trend: z.enum(["improved", "worsened", "unchanged"]) })
      .optional(),
    proseShapeFindingCount: z
      .object({ before: z.number(), after: z.number(), trend: z.enum(["improved", "worsened", "unchanged"]) })
      .optional(),
  }),
  lockEnforcement: z.object({
    lockedAnchorViolations: z.number(),
    blockedMutations: z.array(z.string()),
  }),
});

const CharacterSessionSchema = z.object({
  generatedAt: z.string(),
  branchSandbox: z.object({
    simulatedMutations: z.array(
      z.object({
        mutationId: z.string(),
        mutationKind: z.string(),
        targetKey: z.string(),
        patch: z.record(z.string(), z.unknown()),
      }),
    ),
    canonicalMutations: z.array(
      z.object({
        mutationId: z.string(),
        targetKey: z.string(),
      }),
    ),
  }),
  evaluations: z.array(
    z.object({
      turnId: z.string(),
      accepted: z.boolean(),
      mutationEvaluation: z
        .object({
          mutationId: z.string(),
          allowed: z.boolean(),
          sandboxApplied: z.boolean(),
          canonicalApplied: z.boolean(),
        })
        .optional(),
    }),
  ),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()),
  }),
});

const LawSessionSchema = z.object({
  generatedAt: z.string(),
  branchSandbox: z.object({
    simulatedPatches: z.array(
      z.object({
        actionId: z.string(),
        actionType: z.string(),
        targetKey: z.string(),
        patch: z.record(z.string(), z.unknown()),
      }),
    ),
    canonicalMutations: z.array(
      z.object({
        actionId: z.string(),
      }),
    ),
  }),
  evaluations: z.array(
    z.object({
      actionId: z.string(),
      actionType: z.string(),
      allowed: z.boolean(),
      lockedAnchorViolation: z.boolean(),
      canonRisk: z.enum(["low", "moderate", "high", "critical"]),
      reason: z.string(),
    }),
  ),
  sourceStateProvenance: z.object({
    sourceArtifacts: z.array(z.string()),
  }),
});

const ConsistencyReportSchema = z.object({
  artifact: z.literal("chapter_consistency_report"),
  chronology: z.object({ passed: z.boolean(), findings: z.array(z.string()) }),
  futureArc: z.object({ passed: z.boolean(), findings: z.array(z.string()) }),
  firewall: z.object({ passed: z.boolean(), findings: z.array(z.string()) }),
});

const VoiceReportSchema = z.object({
  artifact: z.literal("chapter_voice_report"),
  passRate: z.number(),
  checks: z.array(z.object({ check: z.string(), passed: z.boolean(), detail: z.string() })),
});

const GapReportSchema = z.object({
  artifact: z.literal("chapter_gap_report"),
  missingInformation: z.array(
    z.object({
      gapId: z.string(),
      requiredBeforeLock: z.boolean(),
      impactOnChapter: z.string(),
    }),
  ),
});

const AdversarialSummarySchema = z.object({
  chapter: z.literal(1),
  generatedAt: z.string(),
  severityTotals: z.object({
    low: z.number(),
    medium: z.number(),
    high: z.number(),
    critical: z.number(),
  }),
  critics: z.object({
    voice: z.object({ findingCount: z.number(), criticalCount: z.number() }),
    historical: z.object({ findingCount: z.number(), criticalCount: z.number() }),
    novel: z.object({ findingCount: z.number(), criticalCount: z.number() }),
    proseShape: z.object({ findingCount: z.number(), criticalCount: z.number() }),
  }),
  proseShapeCategoryTotals: z.record(z.string(), z.number()).optional(),
  releaseDecision: z.string(),
});

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function riskLevel(score: number): "low" | "moderate" | "high" | "critical" {
  if (score >= 0.75) return "critical";
  if (score >= 0.5) return "high";
  if (score >= 0.25) return "moderate";
  return "low";
}

function statusFromInputs(input: {
  finalRecommendation: "accept new draft" | "reject new draft" | "iterate again";
  releaseDecision: string;
}): "accepted" | "blocked" | "needs_iteration" {
  if (input.finalRecommendation === "accept new draft") return "accepted";
  if (input.finalRecommendation === "iterate again") return "needs_iteration";
  if (input.releaseDecision.toLowerCase().includes("blocked")) return "blocked";
  return "blocked";
}

export class Book1DecisionPanelService {
  build(input: {
    canonicalArtifacts: {
      chapterDraftPath: string;
      chapterLawPath: string;
      chapterVoiceSpecPath: string;
      chapterEvidencePackPath: string;
    };
    latestRegeneratedDraftPath: string;
    characterConsoleSession: unknown;
    lawConsoleSession: unknown;
    regenerationSummary: unknown;
    regenerationDiff: unknown;
    consistencyReport: unknown;
    voiceReport: unknown;
    gapReport: unknown;
    adversarialSummary: unknown;
  }): Record<string, unknown> {
    const generatedAt = new Date().toISOString();
    const characterSession = CharacterSessionSchema.parse(input.characterConsoleSession);
    const lawSession = LawSessionSchema.parse(input.lawConsoleSession);
    const regenerationSummary = RegenerationSummarySchema.parse(input.regenerationSummary);
    const regenerationDiff = RegenerationDiffSchema.parse(input.regenerationDiff);
    const consistencyReport = ConsistencyReportSchema.parse(input.consistencyReport);
    const voiceReport = VoiceReportSchema.parse(input.voiceReport);
    const gapReport = GapReportSchema.parse(input.gapReport);
    const adversarialSummary = AdversarialSummarySchema.parse(input.adversarialSummary);

    const chapterStatus = statusFromInputs({
      finalRecommendation: regenerationSummary.recommendation,
      releaseDecision: adversarialSummary.releaseDecision,
    });

    const appliedCharacterMutations = characterSession.branchSandbox.simulatedMutations.map((mutation) => ({
      id: mutation.mutationId,
      kind: mutation.mutationKind,
      target: mutation.targetKey,
      patch: mutation.patch,
      scope: "sandbox",
    }));
    const appliedLawMutations = lawSession.branchSandbox.simulatedPatches.map((patch) => ({
      id: patch.actionId,
      actionType: patch.actionType,
      target: patch.targetKey,
      patch: patch.patch,
      scope: "sandbox",
    }));

    const lockedAnchorWarnings = lawSession.evaluations
      .filter((row) => row.lockedAnchorViolation)
      .map((row) => `Law action ${row.actionId} violated locked-anchor governance: ${row.reason}`)
      .concat(regenerationDiff.lockEnforcement.blockedMutations.map((row) => `Regeneration blocked mutation ${row}`));

    const voiceRiskScore =
      (1 - voiceReport.passRate) * 0.6 + (regenerationDiff.metrics.voicePassRate.trend === "worsened" ? 0.4 : 0);
    const historicalRiskScore =
      (adversarialSummary.critics.historical.criticalCount > 0 ? 0.6 : 0.2) +
      (gapReport.missingInformation.some((gap) => gap.requiredBeforeLock) ? 0.4 : 0.1);
    const coherenceRiskScore =
      (consistencyReport.chronology.passed && consistencyReport.futureArc.passed && consistencyReport.firewall.passed ? 0.2 : 0.7) +
      (regenerationDiff.metrics.consistencyPassCount.trend === "worsened" ? 0.2 : 0);
    const proseRiskScore =
      (adversarialSummary.critics.voice.findingCount > 0 ? 0.4 : 0.1) +
      (regenerationDiff.metrics.voicePassRate.trend === "worsened" ? 0.4 : 0.1) +
      (regenerationDiff.metrics.adversarialHighFindings.after > 5 ? 0.2 : 0.05) +
      (adversarialSummary.critics.proseShape.criticalCount > 0 ? 0.25 : 0.05);
    const proseCategories = adversarialSummary.proseShapeCategoryTotals ?? {};
    const temporalIntegrityScore =
      (consistencyReport.chronology.passed ? 0.1 : 0.55) +
      (consistencyReport.futureArc.passed ? 0.1 : 0.25) +
      (regenerationDiff.lockEnforcement.lockedAnchorViolations > 0 ? 0.35 : 0.05);
    const voiceIdentityScore =
      (adversarialSummary.critics.voice.criticalCount > 0 ? 0.5 : 0.2) +
      (adversarialSummary.critics.voice.findingCount > 6 ? 0.3 : 0.1) +
      ((proseCategories.repeated_opener ?? 0) > 0 ? 0.2 : 0.05);
    const characterInteriorBlendingScore =
      ((proseCategories.character_interior_blending ?? 0) > 0 ? 0.55 : 0.2) +
      ((proseCategories.motive_restatement_clusters ?? 0) > 0 ? 0.2 : 0.05) +
      ((proseCategories.repeated_thought_content ?? 0) > 0 ? 0.2 : 0.05);
    const abstractionLeakScore =
      ((proseCategories.abstraction_overuse_by_segment ?? 0) > 0 ? 0.45 : 0.15) +
      ((proseCategories.repeated_abstract_fear_language ?? 0) > 0 ? 0.25 : 0.1) +
      ((proseCategories.repeated_symbolic_paraphrase ?? 0) > 0 ? 0.2 : 0.05);
    const enneagramOverexposureScore =
      ((proseCategories.explicit_theory_language ?? 0) > 0 ? 0.45 : 0.1) +
      ((proseCategories.repeated_symbolic_paraphrase ?? 0) > 0 ? 0.2 : 0.05) +
      (regenerationSummary.enneagramOverexposureRisk === "critical"
        ? 0.35
        : regenerationSummary.enneagramOverexposureRisk === "high"
          ? 0.25
          : regenerationSummary.enneagramOverexposureRisk === "moderate"
            ? 0.15
            : 0.05);
    const proseTheorizationScore =
      ((proseCategories.abstraction_overuse_by_segment ?? 0) > 0 ? 0.4 : 0.1) +
      ((proseCategories.repeated_abstract_fear_language ?? 0) > 0 ? 0.25 : 0.05) +
      (regenerationSummary.proseTheorizationRisk === "critical"
        ? 0.35
        : regenerationSummary.proseTheorizationRisk === "high"
          ? 0.25
          : regenerationSummary.proseTheorizationRisk === "moderate"
            ? 0.15
            : 0.05);
    const novelRiskScore =
      (adversarialSummary.critics.novel.criticalCount > 0 ? 0.7 : 0.2) +
      (adversarialSummary.severityTotals.critical > 0 ? 0.3 : 0.1);

    const qualityRiskSummary = {
      voiceRisk: riskLevel(Math.min(1, voiceRiskScore)),
      historicalIntegrationRisk: riskLevel(Math.min(1, historicalRiskScore)),
      coherenceRisk: riskLevel(Math.min(1, coherenceRiskScore)),
      proseRisk: riskLevel(Math.min(1, proseRiskScore)),
      novelQualityRisk: riskLevel(Math.min(1, novelRiskScore)),
    };

    const recommendedNextActions = [
      "Reduce repeated opening and paragraph-shape templates by adding cadence variance controls in the composer.",
      "Strengthen prose-brief transformation so every segment encodes lived pressure instead of control-language residue.",
      "Expand lived-history packets with stronger material and social texture where prose shape flags abstraction drift.",
      "Tighten voice-contract compliance gates and fail regeneration when synthetic prose risk exceeds threshold.",
      "Introduce an anchor-aware mutation preflight that blocks illegal anchor actions before sandbox execution.",
      "Add a continuity calibration pass that validates scene-to-scene handoff semantics, not only structural compliance flags.",
    ];

    const decisionWhy = [
      `Status is ${chapterStatus} because regeneration recommendation is "${regenerationSummary.recommendation}" and adversarial release decision is "${adversarialSummary.releaseDecision}".`,
      `Key improvements: ${regenerationSummary.whatImproved.join(", ") || "none"}; key regressions: ${regenerationSummary.whatWorsened.join(", ") || "none"}.`,
      `Locked-anchor governance produced ${lockedAnchorWarnings.length} warning(s), and canon overwrite remains disabled.`,
    ];

    return {
      artifact: "book1_chapter_01_decision_panel",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      chapterStatus,
      latestAcceptedDraftReference: {
        path: input.canonicalArtifacts.chapterDraftPath,
        reason: chapterStatus === "accepted" ? "Latest accepted draft is canonical." : "Regenerated draft not accepted; canonical draft remains accepted baseline.",
      },
      latestRegeneratedDraftReference: {
        path: input.latestRegeneratedDraftPath,
        recommendation: regenerationSummary.recommendation,
      },
      appliedMutations: {
        characterConsole: {
          count: appliedCharacterMutations.length,
          mutations: appliedCharacterMutations,
        },
        lawConsole: {
          count: appliedLawMutations.length,
          mutations: appliedLawMutations,
        },
      },
      improvements: regenerationSummary.whatImproved,
      regressions: regenerationSummary.whatWorsened,
      unchangedRisks: regenerationSummary.unchangedRisks,
      lockedAnchorWarnings: {
        count: lockedAnchorWarnings.length,
        warnings: lockedAnchorWarnings,
        violations: regenerationDiff.lockEnforcement.lockedAnchorViolations,
      },
      qualityRiskSummary,
      temporalIntegrityRisk: riskLevel(Math.min(1, temporalIntegrityScore)),
      voiceIdentityRisk: riskLevel(Math.min(1, voiceIdentityScore)),
      characterInteriorBlendingRisk: riskLevel(Math.min(1, characterInteriorBlendingScore)),
      abstractionLeakRisk: riskLevel(Math.min(1, abstractionLeakScore)),
      enneagramOverexposureRisk:
        regenerationSummary.enneagramOverexposureRisk ?? riskLevel(Math.min(1, enneagramOverexposureScore)),
      behaviorMediationQuality: regenerationSummary.behaviorMediationQuality ?? "unknown",
      proseTheorizationRisk: regenerationSummary.proseTheorizationRisk ?? riskLevel(Math.min(1, proseTheorizationScore)),
      recommendedNextActions,
      finalRecommendation: regenerationSummary.recommendation,
      decisionRationalePlainLanguage: decisionWhy,
      sourceSnapshots: {
        consistencyReportPath: regenerationDiff.comparedAgainst.consistency,
        voiceReportPath: regenerationDiff.comparedAgainst.voice,
        gapReportPath: regenerationDiff.comparedAgainst.gap,
        adversarialSummaryPath: regenerationDiff.comparedAgainst.adversarialSummary,
      },
      provenance: {
        sourceArtifacts: unique(
          [
            input.canonicalArtifacts.chapterDraftPath,
            input.canonicalArtifacts.chapterLawPath,
            input.canonicalArtifacts.chapterVoiceSpecPath,
            input.canonicalArtifacts.chapterEvidencePackPath,
            input.latestRegeneratedDraftPath,
            "reports/book1-character-console-session.json",
            "reports/book1-law-console-session.json",
            "reports/book1-chapter-01-regeneration-summary.json",
            "reports/book1-chapter-01-regeneration-diff.json",
            "reports/book1-chapter-01-chapter_consistency_report.json",
            "reports/book1-chapter-01-chapter_voice_report.json",
            "reports/book1-chapter-01-chapter_gap_report.json",
            "reports/book1-chapter-01-adversarial-summary.json",
            "reports/book1-chapter-01-developmental-intimacy-engine.json",
          ].concat(regenerationSummary.provenance.sourceArtifacts, characterSession.provenance.sourceArtifacts, lawSession.sourceStateProvenance.sourceArtifacts),
        ),
      },
    };
  }
}
