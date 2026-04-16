/**
 * Cluster 2 — validates enforcement registry and writes a machine-readable snapshot to reports/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildEnforcementRegistry, validateEnforcementRegistry } from "@/lib/services/enforcement-registry-service";

const root = process.cwd();
const outDir = join(root, "reports");
const outFile = join(outDir, "enforcement-registry-snapshot.json");

void (() => {
  mkdirSync(outDir, { recursive: true });
  const registry = validateEnforcementRegistry(buildEnforcementRegistry());
  writeFileSync(outFile, JSON.stringify(registry, null, 2), "utf8");
  console.log(`[enforcement-contract] OK — wrote ${outFile}`);
  process.exit(0);
})();
