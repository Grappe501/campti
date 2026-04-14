/**
 * Drift check: find `contractVersion` string literals under lib/ and app/ that are not
 * covered by any registry `readableVersions`. Does not map literals to specific contracts —
 * flags suspicious tokens for human review.
 *
 * Run: npx tsx scripts/check-contract-registry-drift.ts
 * Exit 1 if suspected drift found.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { getAllReadableVersionTokens, listContracts } from "@/lib/contracts/contract-registry";

const ROOT = path.resolve(process.cwd());
const SCAN_DIRS = ["lib", "app"].map((d) => path.join(ROOT, d));

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  "dist",
  "coverage",
]);

/** Matches contractVersion: 'x' or "x" (single-line heuristic). */
const CONTRACT_VERSION_LITERAL_RE = /contractVersion\s*:\s*["']([^'"]+)["']/g;

function walkTsFiles(dir: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR_NAMES.has(e.name)) continue;
      walkTsFiles(full, out);
    } else if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx"))) {
      out.push(full);
    }
  }
}

function main(): void {
  const allowed = getAllReadableVersionTokens();
  const files: string[] = [];
  for (const d of SCAN_DIRS) {
    walkTsFiles(d, files);
  }

  const suspected: Array<{ file: string; line: number; version: string; lineText: string }> = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (rel.startsWith(`lib${path.sep}contracts${path.sep}contract-registry.ts`)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((lineText, i) => {
      let m: RegExpExecArray | null;
      const re = new RegExp(CONTRACT_VERSION_LITERAL_RE.source, "g");
      while ((m = re.exec(lineText)) !== null) {
        const version = m[1];
        if (!allowed.has(version)) {
          suspected.push({
            file: rel,
            line: i + 1,
            version,
            lineText: lineText.trim().slice(0, 200),
          });
        }
      }
    });
  }

  console.log("Contract registry drift check");
  console.log("Registered contracts:", listContracts().map((c) => c.contractName).join(", "));
  console.log("Readable version token count:", allowed.size);
  console.log("");

  if (suspected.length === 0) {
    console.log("No suspected unregistered contractVersion literals (heuristic).");
    process.exit(0);
  }

  console.error(`Suspected drift: ${suspected.length} literal(s) not in any readableVersions set:\n`);
  for (const s of suspected) {
    console.error(`  ${s.file}:${s.line}  contractVersion: "${s.version}"`);
    console.error(`    ${s.lineText}`);
    console.error("");
  }
  console.error(
    "Review: add version to lib/contracts/contract-registry.ts or fix typo; constants may alias registry versions."
  );
  process.exit(1);
}

main();
