"use server";

import type { NarrativeShapingDefaults, NarrativeShapingOverrideSet } from "@/lib/domain/narrative-shaping-defaults";
import {
  parseNarrativeShapingDefaultsPayload,
  resolveNarrativeShapingDefaultsForBook,
  resolveNarrativeShapingDefaultsForChapter,
  resolveNarrativeShapingDefaultsForEpic,
  resolveNarrativeShapingDefaultsForScene,
  setBookNarrativeShapingDefaults,
  setChapterNarrativeShapingDefaults,
  setEpicNarrativeShapingDefaults,
  setSceneNarrativeShapingDefaults,
} from "@/lib/services/narrative-shaping-defaults-service";

export async function actionResolveNarrativeShapingDefaultsForScene(
  sceneId: string,
  runtimeOverride?: NarrativeShapingOverrideSet | null
) {
  return resolveNarrativeShapingDefaultsForScene(sceneId, runtimeOverride ?? null);
}

export async function actionResolveNarrativeShapingDefaultsForBook(bookId: string) {
  return resolveNarrativeShapingDefaultsForBook(bookId);
}

export async function actionResolveNarrativeShapingDefaultsForChapter(chapterId: string) {
  return resolveNarrativeShapingDefaultsForChapter(chapterId);
}

export async function actionResolveNarrativeShapingDefaultsForEpic(epicId: string) {
  return resolveNarrativeShapingDefaultsForEpic(epicId);
}

export async function actionSetEpicNarrativeShapingDefaults(epicId: string, patch: NarrativeShapingDefaults) {
  return setEpicNarrativeShapingDefaults(epicId, patch);
}

export async function actionSetBookNarrativeShapingDefaults(bookId: string, patch: NarrativeShapingDefaults) {
  return setBookNarrativeShapingDefaults(bookId, patch);
}

export async function actionSetChapterNarrativeShapingDefaults(
  chapterId: string,
  patch: NarrativeShapingDefaults
) {
  return setChapterNarrativeShapingDefaults(chapterId, patch);
}

export async function actionSetSceneNarrativeShapingDefaults(sceneId: string, patch: NarrativeShapingDefaults) {
  return setSceneNarrativeShapingDefaults(sceneId, patch);
}

/** Parse JSON object (e.g. from admin paste) into a validated patch before setters. */
export async function actionParseNarrativeShapingDefaultsPayload(raw: unknown): Promise<NarrativeShapingDefaults> {
  return parseNarrativeShapingDefaultsPayload(raw);
}
