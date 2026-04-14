"use server";

import type { PlaceTickQuery, WorldTickQuery } from "@/lib/domain/world-observability";
import type { BuildCharacterObserverParams } from "@/lib/services/world-observer-service";
import {
  buildCharacterObserverSnapshot,
  buildPlaceSnapshot,
  buildSceneObserverSnapshot,
  buildSimulationObserverSnapshot,
  buildSimulationObserverSnapshotPair,
  buildWorldSnapshot,
} from "@/lib/services/world-observer-service";

export async function actionBuildWorldSnapshot(query: WorldTickQuery) {
  return buildWorldSnapshot(query);
}

export async function actionBuildPlaceSnapshot(query: PlaceTickQuery) {
  return buildPlaceSnapshot(query);
}

export async function actionBuildCharacterObserverSnapshot(params: BuildCharacterObserverParams) {
  return buildCharacterObserverSnapshot(params);
}

export async function actionBuildSceneObserverSnapshot(sceneId: string) {
  return buildSceneObserverSnapshot(sceneId);
}

export async function actionBuildSimulationObserverSnapshot(runId: string) {
  return buildSimulationObserverSnapshot(runId);
}

export async function actionBuildSimulationObserverSnapshotPair(leftRunId: string, rightRunId: string) {
  return buildSimulationObserverSnapshotPair(leftRunId, rightRunId);
}
