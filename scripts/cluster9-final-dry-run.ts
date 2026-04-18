import "./load-env";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { finalDryRunDefectLog } from "@/lib/domain/final-execution-package";
import type { FinalDryRunDefect } from "@/lib/domain/final-execution-package";
import { isOpenAIApiKeyConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { buildFinalAuthorWorkflowReport } from "@/lib/services/final-author-workflow-service";
import { buildFinalDemoRunbook } from "@/lib/services/final-demo-runbook-service";
import {
  buildFinalExecutionPackage,
  buildRehearsalStubFinalExecutionPackage,
} from "@/lib/services/final-execution-package-service";
import { buildFinalReadinessScorecard } from "@/lib/services/final-readiness-scorecard-service";
import {
  loadPersistedCharacterSimulationProfilesForPersonIds,
  summarizeCharacterSimulationProfileTruth,
} from "@/lib/services/character-simulation-author-bundle-load-service";
import { buildCharacterSimulationWorkbenchSceneRollup } from "@/lib/services/character-simulation-workbench-scene-aggregate-service";
import { executeRehearsalGuardedSceneLaunch } from "@/lib/services/scene-launch-guard-service";

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  const dryRunId = `cluster9_${new Date().toISOString().replaceAll(":", "").slice(0, 17)}`;
  const defects: FinalDryRunDefect[] = [];

  const scene = await prisma.scene.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true, chapterId: true, persons: { select: { id: true } } },
  });

  if (!scene) {
    defects.push({
      code: "no_scene",
      severity: "error",
      message: "No Scene row in database — cannot rehearse canonical path.",
      layer: "persistence",
    });
    await writeFile(
      path.join(reportsDir, "final-dry-run-defect-log.json"),
      `${JSON.stringify(finalDryRunDefectLog({ dryRunId, sceneId: null, defects }), null, 2)}\n`,
      "utf-8",
    );
    console.log(JSON.stringify({ ok: false, defects }, null, 2));
    return;
  }

  const personIds = scene.persons.map((p) => p.id);
  const persisted = await loadPersistedCharacterSimulationProfilesForPersonIds(personIds);
  const profileTruth = summarizeCharacterSimulationProfileTruth(personIds, persisted);
  const workbenchRollup = await buildCharacterSimulationWorkbenchSceneRollup(personIds);
  const characterSimulationWorkbenchSummary = {
    summaryLine: workbenchRollup.summaryLine,
    validationFlags: workbenchRollup.validationFlags,
    blockedParticipatingPeople: workbenchRollup.perPerson.filter((p) => p.readinessImpact === "blocked").length,
  };

  const executionId = `${dryRunId}_${scene.id}`;
  let pkg;

  if (!isOpenAIApiKeyConfigured()) {
    defects.push({
      code: "openai_missing",
      severity: "warning",
      message: "OPENAI_API_KEY not set — skipped live LLM generation; emitted rehearsal stub package only.",
      layer: "llm",
    });
    try {
      await executeRehearsalGuardedSceneLaunch({
        sceneId: scene.id,
        intent: "full_generation",
        launchSource: "cluster9_dry_run",
        allowModelMutation: false,
        auditMeta: { dryRunId, reason: "openai_missing_rehearsal_non_launch" },
      });
    } catch {
      /* preflight/DB optional — rehearsal audit is best-effort when key missing */
    }
    pkg = buildRehearsalStubFinalExecutionPackage({
      executionId,
      sceneId: scene.id,
      chapterId: scene.chapterId,
      profileTruth,
      rehearsalNotes: defects.map((d) => `${d.code}: ${d.message}`),
      characterSimulationWorkbenchSummary,
    });
  } else {
    try {
      const guarded = await executeRehearsalGuardedSceneLaunch(
        {
          sceneId: scene.id,
          intent: "full_generation",
          launchSource: "cluster9_dry_run",
          allowModelMutation: true,
          saveGenerationText: false,
          registerDependencies: false,
          runProseQuality: false,
          runSocialPressureAdvisory: true,
          runHumanizationAdvisory: true,
          auditMeta: { dryRunId },
        },
        {},
      );
      if (!guarded.ok) {
        throw new Error(`[scene_launch_guard:${guarded.code}] ${guarded.message}`);
      }
      if (!guarded.run) {
        throw new Error("Rehearsal launch produced no run.");
      }
      const run = guarded.run;
      pkg = buildFinalExecutionPackage({
        executionId,
        runtimeId: run.cluster7RuntimeTruth?.canonicalArtifact.runtimeId ?? "scene_chapter_production_runtime",
        sceneId: scene.id,
        chapterId: scene.chapterId,
        run,
        profileTruth,
        characterSimulationWorkbenchSummary,
      });
    } catch (e) {
      defects.push({
        code: "run_failed",
        severity: "error",
        message: e instanceof Error ? e.message : String(e),
        layer: "runtime",
      });
      pkg = buildRehearsalStubFinalExecutionPackage({
        executionId,
        sceneId: scene.id,
        chapterId: scene.chapterId,
        profileTruth,
        rehearsalNotes: defects.map((d) => `${d.code}: ${d.message}`),
        characterSimulationWorkbenchSummary,
      });
    }
  }

  const scorecard = buildFinalReadinessScorecard({ executionPackage: pkg });
  const runbook = buildFinalDemoRunbook({ executionPackage: pkg });
  const authorWorkflow = buildFinalAuthorWorkflowReport({ executionPackage: pkg });

  await writeFile(path.join(reportsDir, "final-execution-package.json"), `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
  await writeFile(
    path.join(reportsDir, "final-readiness-scorecard.json"),
    `${JSON.stringify(scorecard, null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    path.join(reportsDir, "final-dry-run-defect-log.json"),
    `${JSON.stringify(finalDryRunDefectLog({ dryRunId, sceneId: scene.id, defects }), null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    path.join(reportsDir, "cluster9-demo-runbook.snapshot.json"),
    `${JSON.stringify({ runbook, authorWorkflow }, null, 2)}\n`,
    "utf-8",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        sceneId: scene.id,
        readinessStatus: pkg.readinessStatus,
        scorecard,
        defectCount: defects.length,
        paths: {
          finalExecutionPackage: "reports/final-execution-package.json",
          finalReadinessScorecard: "reports/final-readiness-scorecard.json",
          finalDryRunDefectLog: "reports/final-dry-run-defect-log.json",
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
