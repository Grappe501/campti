/**
 * Copies `campti_*` files from the user Downloads folder into `uploads/incoming/campti-research/`,
 * then runs the incoming-upload indexer (same as `npm run uploads:index`).
 *
 *   npx tsx scripts/sync-campti-research-bundle.ts
 *
 * Override source directory:
 *   CAMPTI_RESEARCH_SOURCE_DIR="C:\\path\\to\\folder" npx tsx scripts/sync-campti-research-bundle.ts
 */
import "./load-env";
import { execSync } from "child_process";
import { copyFile, mkdir, readdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

const DEST_REL = join("uploads", "incoming", "campti-research");

async function main() {
  const sourceRoot =
    process.env.CAMPTI_RESEARCH_SOURCE_DIR?.trim() || join(homedir(), "Downloads");
  const destAbs = join(process.cwd(), DEST_REL);
  await mkdir(destAbs, { recursive: true });

  let names: string[];
  try {
    names = await readdir(sourceRoot);
  } catch (e) {
    console.error(`Cannot read source folder: ${sourceRoot}`, e);
    process.exit(1);
  }

  const matches = names.filter((n) => n.startsWith("campti_") && !n.startsWith("."));
  if (matches.length === 0) {
    console.warn(`No campti_* files in ${sourceRoot}. Nothing copied.`);
  }

  for (const name of matches.sort()) {
    const from = join(sourceRoot, name);
    const to = join(destAbs, name);
    await copyFile(from, to);
    console.log(`Copied ${name} -> ${DEST_REL}/`);
  }

  console.log(`\nRunning indexer (${matches.length} file(s) in ${DEST_REL})...\n`);
  execSync("npx tsx scripts/index-incoming-uploads.ts", {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
