/**
 * Paste at the top of every stage prompt when working in Cursor.
 */
export const CAMPTI_UNIVERSAL_CURSOR_RULES = `You are continuing development on the existing Campti project.

Build this stage as part of a deterministic narrative simulation system, not a generic content app.

Rules:
1. Extend the existing schema carefully. Do not duplicate concepts that already exist.
2. Prefer registry/data model integrity before UI polish.
3. Add TypeScript contracts and Zod validation for every new structure.
4. Add admin surfaces only after the backing model and server actions exist.
5. Preserve existing extraction, review, linking, merge, and chunking pipelines.
6. Preserve build safety when DATABASE_URL is absent during local build.
7. Do not add prose generation features unless explicitly instructed.
8. Every new narrative object should preserve recordType, visibility, confidence/certainty, and narrative permission when applicable.
9. Keep public routes curated and secondary to the admin simulation engine.
10. At the end, provide:
   - updated schema summary
   - routes added or changed
   - models added or changed
   - actions added
   - commands to run
   - migration cautions
   - anything intentionally deferred`;

export const CAMPTI_MASTER_BUILD_LAW =
  "law → ontology → variables → engines → admin surfaces → readiness gates → simulation runs";
