"use server";

import type {
  SimulationRunInput,
  SimulationRunResult,
  SimulationVariableOverride,
} from "@/lib/domain/simulation-run";
import {
  buildSimulationScenario,
  compareSimulationRuns,
  executeSimulationRun,
  rerunCharacterCognitionForSimulation,
} from "@/lib/services/simulation-run-service";

/** Typed scenario create with `SimulationOverrideSet` payload. */
export async function actionBuildSimulationScenario(
  params: Parameters<typeof buildSimulationScenario>[0]
) {
  return buildSimulationScenario(params);
}

export async function actionExecuteSimulationRun(params: SimulationRunInput) {
  return executeSimulationRun(params);
}

export async function actionCompareSimulationRuns(
  left: SimulationRunResult,
  right: SimulationRunResult
) {
  return compareSimulationRuns(left, right);
}

export async function actionRerunCharacterCognitionForSimulation(
  characterId: string,
  sceneId: string,
  overrides: SimulationVariableOverride[]
) {
  return rerunCharacterCognitionForSimulation(characterId, sceneId, overrides);
}
