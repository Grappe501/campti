import type { CharacterSimulationWorkbenchSceneRollup } from "@/lib/domain/character-simulation-workbench";
import { loadCharacterSimulationWorkbenchViewModel } from "@/lib/services/character-simulation-workbench-load-service";

/**
 * Scene-level aggregate for cockpit / readiness surfaces (parallel per person; bounded cast sizes).
 */
export async function buildCharacterSimulationWorkbenchSceneRollup(personIds: string[]): Promise<CharacterSimulationWorkbenchSceneRollup> {
  const unique = [...new Set(personIds)].filter(Boolean);
  const views = await Promise.all(unique.map((id) => loadCharacterSimulationWorkbenchViewModel(id)));

  const flags: string[] = [];
  let blocking = 0;
  for (const v of views) {
    flags.push(...v.header.readinessImpact.reasons.map((r) => `person:${v.header.personId}:${r}`));
    if (v.header.readinessImpact.level === "blocked") blocking += 1;
    if (v.drift.migrationRequired) flags.push("character_simulation_workbench_migration_missing");
  }

  const summaryLine =
    blocking > 0
      ? `${blocking} cast member(s) have blocking Character Simulation Workbench contradictions or validation failures.`
      : views.some((v) => v.header.readinessImpact.level !== "ready")
        ? "Cast shows advisory or downgrade-risk simulation drift — inspect per-person workbenches."
        : "Cast simulation workbench signals are clear at aggregate level (per-person detail may still differ).";

  return {
    contractVersion: "1",
    summaryLine,
    validationFlags: Array.from(new Set(flags)).slice(0, 48),
    perPerson: views.map((v) => ({
      personId: v.header.personId,
      displayName: v.header.name,
      readinessImpact: v.header.readinessImpact.level,
      blockingConflicts: v.conflicts.filter((c) => c.blocksGenerationReadiness && !c.acceptedByOperator).length,
      advisoryConflicts: v.conflicts.filter((c) => c.severity === "advisory" && !c.acceptedByOperator).length,
      workbenchHref: `/admin/people/${v.header.personId}/simulation-workbench`,
    })),
  };
}
