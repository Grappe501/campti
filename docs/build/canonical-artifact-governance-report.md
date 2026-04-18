# Canonical Artifact Governance (Cluster 7)

## Types

Defined in `lib/domain/canonical-artifact-governance.ts`:

- **`ArtifactAuthorityClass`** — `canonical_production` | `advisory_runtime` | `simulation_proof` | `incomplete` | `invalidated` | `blocked_from_save`
- **`ArtifactTruthStamp`** — hash hook, validation summary, save eligibility, readiness trust class, invalidation reasons, provenance notes
- **`CanonicalArtifactRecord`** — `artifactId`, `artifactType`, `runtimeId`, `runtimePathLabel`, `truthStamp`, `validationFlags`
- **`ArtifactCanonicalizationReport`** — multi-record aggregation (extensible for batch jobs)

## Builder

`lib/services/canonical-artifact-record-service.ts`:

- `buildArtifactTruthStamp`
- `buildSceneGenerationCanonicalArtifactRecord`

`lib/services/canonical-artifact-governance-service.ts`:

- Re-exports builders + `evaluateArtifactTruthRule`
- `buildArtifactCanonicalizationReport` — batch aggregation and ambiguous authority/trust combinations

Authority class derives from persistence label, governance merge, and realism / human-gravity validity. Overrides that persist invalid text downgrade trust and authority.

## Artifact truth rule (validation)

`evaluateArtifactTruthRule` in `lib/services/artifact-canonical-evidence-validation-service.ts` rejects canonical evidence when authority, enforcement classes (under governance merge), validation outcomes (when realism/human-gravity layers ran), or save eligibility are missing or inconsistent.
