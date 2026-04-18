# Readiness & certification semantic depth (Cluster 7)

## Normative rules

See `lib/domain/certification-truth-rules.ts` and the module header on `lib/domain/readiness-certification-depth.ts`.

- **CERTIFICATION TRUTH RULE:** A run may not be presented as execution-ready or production-grade unless readiness/certification evidence is derived from canonical runtime truth, semantically valid artifact records, and non-downgraded save eligibility.
- **ARTIFACT TRUTH RULE:** Any scene/chapter/run artifact that does not preserve authority class, enforcement truth, validation outcome, and save eligibility is invalid as canonical evidence.

## Implementation

| Concern | Location |
|--------|----------|
| Depth evaluation | `evaluateReadinessCertificationDepth` in `lib/services/readiness-certification-depth-service.ts` |
| Artifact rule | `evaluateArtifactTruthRule` in `lib/services/artifact-canonical-evidence-validation-service.ts` |
| Evidence inflation helper | `evaluateReadinessEvidenceInflationRisk` in `lib/services/readiness-evidence-semantic-service.ts` |
| Record shape | `ReadinessCertificationEvidenceRecord` in `lib/domain/readiness-certification-depth.ts` |
| Cockpit projection | `buildCockpitCertificationHardeningSummary` in `lib/services/cluster7-runtime-truth-service.ts` |

## Production-grade gate

`mayPresentAsProductionGrade` requires, among other checks: `certificationTruthRuleSatisfied`, `artifactTrust === "authoritative_production"`, non-downgraded save eligibility, realism and human-gravity truth not failed, and cockpit not observational-only when that flag is supplied.

## Next refinement

Thread `cockpitObservationalOnly` from live cockpit builds into `evaluateReadinessCertificationDepth` for regeneration vs DB production parity.
