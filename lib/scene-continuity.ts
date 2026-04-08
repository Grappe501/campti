import type { WritingMode } from "@prisma/client";

type SceneContinuityInput = {
  sceneStatus?: string | null;
  writingMode?: WritingMode;
  draftText?: string | null;
  personsCount: number;
  placesCount: number;
  events: Array<{ startYear: number | null; endYear: number | null; title?: string | null }>;
  sourcesCount: number;
};

export type ContinuityWarning = {
  code: "missing_entities" | "conflicting_years" | "unlinked_key_entities";
  message: string;
};

export function detectMissingEntities(scene: SceneContinuityInput): ContinuityWarning[] {
  const w: ContinuityWarning[] = [];
  if (scene.placesCount === 0) w.push({ code: "missing_entities", message: "No place linked" });
  if (scene.personsCount === 0) w.push({ code: "missing_entities", message: "No people linked" });
  if (scene.events.length === 0) w.push({ code: "missing_entities", message: "No event linked" });
  if (scene.sourcesCount === 0) w.push({ code: "missing_entities", message: "No supporting sources linked" });
  return w;
}

export function detectConflictingYears(scene: SceneContinuityInput): ContinuityWarning[] {
  const years: number[] = [];
  for (const e of scene.events) {
    if (typeof e.startYear === "number") years.push(e.startYear);
    if (typeof e.endYear === "number") years.push(e.endYear);
  }
  const uniq = Array.from(new Set(years)).sort((a, b) => a - b);
  if (uniq.length <= 1) return [];

  const min = uniq[0]!;
  const max = uniq[uniq.length - 1]!;
  // Heuristic: a single scene spanning widely separated years usually means linking is off.
  if (max - min >= 25) {
    return [{ code: "conflicting_years", message: `Conflicting timeline signals (${min}–${max})` }];
  }
  return [];
}

export function detectUnlinkedKeyEntities(scene: SceneContinuityInput): ContinuityWarning[] {
  const text = (scene.draftText ?? "").trim();
  if (!text.length) return [];

  const hasAnyLink = scene.personsCount + scene.placesCount + scene.events.length > 0;
  if (!hasAnyLink) {
    return [{ code: "unlinked_key_entities", message: "Draft text exists but no entities are linked yet" }];
  }
  return [];
}

export function getSceneContinuityWarnings(scene: SceneContinuityInput): ContinuityWarning[] {
  return [
    ...detectMissingEntities(scene),
    ...detectConflictingYears(scene),
    ...detectUnlinkedKeyEntities(scene),
  ];
}

