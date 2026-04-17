import type { ReadinessEvidenceTrustClass } from "@/lib/domain/enforcement-contract";

export const READINESS_CERTIFICATION_DEPTH_CONTRACT_VERSION = "2" as const;

/**
 * Machine-usable certification depth for Cluster 7 — beyond boolean pass/fail.
 *
 * Normative rules (see `lib/domain/certification-truth-rules.ts`):
 * - Certification truth: execution-ready / production-grade presentation requires canonical runtime truth,
 *   valid artifact evidence, and non-downgraded save eligibility.
 * - Artifact truth: canonical evidence requires authority, enforcement, validation outcomes, and save eligibility preserved.
 */
export type ReadinessCertificationEvidenceRecord = {
  contractVersion: typeof READINESS_CERTIFICATION_DEPTH_CONTRACT_VERSION;
  evaluationId: string;
  evaluatedAtIso: string;
  canonicalRuntimeAuthorityUsed: boolean;
  governanceConvergenceSatisfied: boolean | null;
  cluster3GovernorsMaterial: boolean | null;
  humanGravityNoResetTruthPreserved: boolean | null;
  proseRealismNotCriticallyFailed: boolean | null;
  narratorBoundaryRespected: boolean | null;
  continuityEmotionalHookSystemsTruthfullyClassified: boolean | null;
  artifactTrustClass: ReadinessEvidenceTrustClass;
  /** True when no save was requested, or persistence matches canonical-ready semantics when save was requested. */
  persistedOutputsMatchClaims: boolean;
  /** When any subsystem uses advisory-only evidence, surfaced explicitly. */
  advisoryEvidenceUsed: boolean;
  /** Readiness record built from Cluster 7 runtime envelope (canonical path), not report-only stitching. */
  evidenceDerivedFromCluster7Envelope: boolean;
  /** Artifact truth rule: structural + coherence of authority, enforcement, validation, save eligibility. */
  artifactTruthRuleSatisfied: boolean;
  /** No save-invalid overrides — downgraded eligibility disqualifies production-grade presentation. */
  saveEligibilityNonDowngraded: boolean;
  /**
   * Certification truth rule: canonical authority + valid artifact + non-downgraded save + no hard semantic failures
   * + evidence derived from Cluster 7 envelope when required for this evaluation path.
   */
  certificationTruthRuleSatisfied: boolean;
  /** May surface as execution-ready (stricter than raw CI pass). */
  mayPresentAsExecutionReady: boolean;
  /** May surface as production-grade (stricter than execution-ready). */
  mayPresentAsProductionGrade: boolean;
  blockingReasons: string[];
  qualificationNotes: string[];
  validationFlags: string[];
};
