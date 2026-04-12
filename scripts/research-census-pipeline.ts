/**
 * End-to-end: copy campti_* from Downloads → uploads/incoming → index SourceChunks,
 * then import campti_census.sqlite into Postgres with normalized labels for story assembly.
 *
 *   npx tsx scripts/research-census-pipeline.ts
 *
 * Skip file copy (only re-import DB from existing SQLite):
 *   CAMPTI_PIPELINE_SKIP_SYNC=1 npx tsx scripts/research-census-pipeline.ts
 */
import "./load-env";
import { execSync } from "child_process";

const cwd = process.cwd();

if (!process.env.CAMPTI_PIPELINE_SKIP_SYNC) {
  console.log("Step 1/2: sync Downloads → uploads/incoming + index text sources…\n");
  execSync("npx tsx scripts/sync-campti-research-bundle.ts", { cwd, stdio: "inherit" });
} else {
  console.log("Skipping sync (CAMPTI_PIPELINE_SKIP_SYNC). Running DB import only.\n");
}

console.log("Step 2/2: import SQLite → Postgres (normalized labels)…\n");
execSync("npx tsx scripts/import-campti-census-sqlite.ts", { cwd, stdio: "inherit" });

console.log(
  "\nDone. Use server actions censusResearchSearchForAssemblyAction / censusResearchStoryContextBlockAction for AI story assembly.",
);
