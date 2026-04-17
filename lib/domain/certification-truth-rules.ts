/**
 * Certification truth rule (normative):
 * A run may not be presented as execution-ready or production-grade unless readiness/certification
 * evidence is derived from canonical runtime truth, semantically valid artifact records, and
 * non-downgraded save eligibility.
 *
 * Artifact truth rule (normative):
 * Any scene/chapter/run artifact that does not preserve authority class, enforcement truth,
 * validation outcome, and save eligibility is invalid as canonical evidence.
 *
 * Enforcement is implemented in `evaluateReadinessCertificationDepth` and
 * `evaluateArtifactTruthRule` (see `lib/services/artifact-canonical-evidence-validation-service.ts`).
 */

export const CERTIFICATION_TRUTH_RULES_DOC_VERSION = "1" as const;
