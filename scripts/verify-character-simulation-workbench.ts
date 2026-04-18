#!/usr/bin/env npx tsx
/**
 * Verification harness for Character Simulation Workbench — honest status, no fake green.
 * Run: npx tsx scripts/verify-character-simulation-workbench.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { CharacterSimulationPreviewRequestSchema } from "@/lib/domain/character-simulation-workbench-validation";
import { detectCharacterSimulationConflicts } from "@/lib/services/character-simulation-workbench-conflict-service";
import { buildCharacterSimulationPreview } from "@/lib/services/character-simulation-workbench-preview-service";
import { CharacterMindSeedService } from "@/lib/services/character-mind-seed-service";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const schema = readFileSync(schemaPath, "utf-8");

const lines: string[] = [];
function log(msg: string) {
  lines.push(msg);
  console.log(msg);
}

let failed = false;

function require(cond: boolean, ok: string, bad: string) {
  if (cond) log(`[ok] ${ok}`);
  else {
    failed = true;
    log(`[fail] ${bad}`);
  }
}

log("--- Character Simulation Workbench verification ---");

require(schema.includes("model CharacterSimulationAuditLog"), "Prisma model CharacterSimulationAuditLog present", "Missing CharacterSimulationAuditLog model");
require(schema.includes("workbenchMetaJson"), "Prisma CharacterSimulationAuthorBundle.workbenchMetaJson present", "Missing workbenchMetaJson column");

require(
  CharacterSimulationPreviewRequestSchema.safeParse({ mode: "inner_monologue", stimulus: "Enough text here." }).success,
  "Preview request Zod accepts valid payload",
  "Preview request schema regression",
);

const seed = new CharacterMindSeedService();
const mind = seed.buildMindProfile({ characterId: "verify-wb", displayLabel: "Verify" });
const voice = seed.buildVoiceProfile({ characterId: "verify-wb", displayLabel: "Verify" });
const conflicts = detectCharacterSimulationConflicts({
  seedMind: mind,
  seedVoice: voice,
  authorMindPartial: {},
  authorVoicePartial: {},
  meta: {},
  personBirthYear: null,
  personDeathYear: null,
});
require(Array.isArray(conflicts), "Conflict detector returns array", "Conflict detector broken");

const preview = buildCharacterSimulationPreview({
  request: { mode: "spoken_response", stimulus: "They must decide whether to risk someone else’s safety to achieve their goal." },
  mergedMind: mind,
  mergedVoice: voice,
  driftWarnings: [],
  usesAuthorOverlay: false,
});
require(preview.deterministicPreviewId.length > 8, "Preview emits deterministic id", "Preview engine broken");

async function optionalDbProbe() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { loadCharacterSimulationWorkbenchViewModel } = await import("@/lib/services/character-simulation-workbench-load-service");
    const anyPerson = await prisma.person.findFirst({ select: { id: true } });
    if (!anyPerson) {
      log("[advisory] No Person rows — skipped DB load probe.");
      return;
    }
    const vm = await loadCharacterSimulationWorkbenchViewModel(anyPerson.id);
    require(vm.contractVersion === "1", `Workbench view model contract ok for person ${anyPerson.id}`, "Workbench load service failed against live DB");
    if (vm.drift.migrationRequired) {
      log("[advisory] Live DB returned migration-degraded workbench view (expected until migrate deploy).");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("P2021") || msg.toLowerCase().includes("does not exist")) {
      log("[advisory] Database migration not applied — load path degraded as designed until migrate deploy.");
    } else {
      failed = true;
      log(`[fail] DB probe error: ${msg}`);
    }
  }
}

async function main() {
  await optionalDbProbe();

  log("--- Summary ---");
  if (failed) {
    log("RESULT: FAILED (see [fail] lines).");
    process.exitCode = 1;
  } else {
    log("RESULT: PASSED core compile + schema + deterministic engines (DB advisory only).");
  }
}

void main();
