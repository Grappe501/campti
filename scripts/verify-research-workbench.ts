#!/usr/bin/env npx tsx
/**
 * Research workbench verification — honest prerequisites and compile wiring.
 * Run: npx tsx scripts/verify-research-workbench.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { ResearchTargetCreateInputSchema } from "@/lib/domain/research-workbench-validation";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const schema = readFileSync(schemaPath, "utf-8");

let failed = false;
function log(m: string) {
  console.log(m);
}
function ok(cond: boolean, pass: string, fail: string) {
  if (cond) log(`[ok] ${pass}`);
  else {
    failed = true;
    log(`[fail] ${fail}`);
  }
}

log("--- Research workbench verification ---");
ok(schema.includes("model AuthorResearchTarget"), "Prisma AuthorResearchTarget", "Missing AuthorResearchTarget");
ok(schema.includes("model AuthorCanonKnowledgeRecord"), "Prisma AuthorCanonKnowledgeRecord", "Missing canon knowledge model");

const parsed = ResearchTargetCreateInputSchema.safeParse({
  targetType: "scene",
  targetName: "Verify",
  linkedSceneIds: ["scene-verify"],
  linkedChapterIds: [],
  linkedBookIds: [],
  linkedCharacterIds: [],
  linkedSettingIds: [],
  linkedEraIds: [],
  linkedThreadIds: [],
});
ok(parsed.success, "Target create schema accepts linked scene", "Target schema regression");

async function probeDb() {
  try {
    const { loadResearchWorkbenchDashboard } = await import("@/lib/services/research-workbench-dashboard-load-service");
    const dash = await loadResearchWorkbenchDashboard();
    ok(dash.contractVersion === "1", "Dashboard load returns contract v1", "Dashboard load failed");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("P2021") || msg.toLowerCase().includes("does not exist")) {
      log("[advisory] Database tables missing for RICRE — migrate deploy required.");
    } else {
      failed = true;
      log(`[fail] DB probe: ${msg}`);
    }
  }
}

async function main() {
  await probeDb();
  log("--- Summary ---");
  if (failed) {
    log("RESULT: FAILED");
    process.exitCode = 1;
  } else {
    log("RESULT: PASSED (schema + validation + optional DB probe).");
  }
}

void main();
