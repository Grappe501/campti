# Final demo operator flow (truthful canonical path)

Use this flow when demonstrating Campti to a first-time operator. Every step is the **same** code used in production; labels explain observational vs mutating surfaces.

## A. Open Author Cockpit

1. Navigate to `/admin/narrative`.
2. Read **Operator execution truth (Cluster 9)** first:
   - Canonical runtime id vs cockpit inspection runtime id.
   - **Character simulation profile source** — persisted author JSON, deterministic seed only, or mixed cast.

## B. Inspect before generating

1. **Certification & validation truth (Cluster 7)** — save eligibility, artifact id, semantic hard failures, remediation targets.
2. **Enforcement semantic truth** — which panels are advisory vs hard-enforced; which are deterministic/sample-seeded.
3. **Human gravity** — no-reset participation and warnings.
4. **Prose realism** — scores and refinement targets.
5. **Character simulation** — necessity/conflict previews, cognitive and voice snapshots, `profileTruth`.

## C. If blocked or downgraded

- If **save** is blocked: read `saveBlockedReasons`; fix realism or human-gravity truth before using overrides (overrides are audited on the artifact stamp).
- If **semantic invariants** hard-fail: work remediation targets; rerun.
- If **cockpit runtime** is not canonical: remember the bundle is **observational only** — rerun prose from Scenes admin for canonical output.

## D. Safe outputs to show

- Cockpit summaries and Cluster 7 envelope fields.
- `reports/final-execution-package.json` and `reports/final-readiness-scorecard.json` from the dry-run script.
- Scene `generationText` only when save succeeded and presentation rules from Cluster 7 allow it.

## E. Advisory surfaces (must be said aloud in demo)

- Guided signals and indicator bank metrics are **bounded advisory** unless the enforcement registry states otherwise.
- Social pressure QA scalars and humanization advisories are post-generation advisory unless wired as enforced in the registry.

## F. Export / print

- **JSON:** run `scripts/cluster9-final-dry-run.ts` or copy run payloads from tooling.
- **Print:** browser print on cockpit or scene admin views; no separate “demo PDF pipeline” is required for Cluster 9.
