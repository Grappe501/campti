/**
 * Pure scene–research relevance classification (shared by loader + tests).
 */

import type { SceneResearchRelevance } from "@/lib/domain/scene-research-tab";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function classifyTargetRelevance(args: {
  linkedSceneIds: unknown;
  linkedChapterIds: unknown;
  linkedPersonIds: unknown;
  linkedPlaceIds: unknown;
  sceneId: string;
  chapterId: string;
  personIds: string[];
  placeIds: string[];
}): { primary: SceneResearchRelevance; explanation: string } {
  const scenes = asStringArray(args.linkedSceneIds);
  const chapters = asStringArray(args.linkedChapterIds);
  const people = asStringArray(args.linkedPersonIds);
  const places = asStringArray(args.linkedPlaceIds);

  if (scenes.includes(args.sceneId)) {
    return { primary: "direct_scene_link", explanation: "Research target explicitly lists this scene id." };
  }
  if (chapters.includes(args.chapterId)) {
    return { primary: "chapter_link", explanation: "Target is linked to this scene’s chapter." };
  }
  const personHit = args.personIds.find((id) => people.includes(id));
  if (personHit) {
    return { primary: "person_link", explanation: "Target links a person who appears in this scene." };
  }
  const placeHit = args.placeIds.find((id) => places.includes(id));
  if (placeHit) {
    return { primary: "place_link", explanation: "Target links a place that appears in this scene." };
  }
  return { primary: "explicit_topic_link", explanation: "Target matched scene graph rules (e.g. combined linkage)." };
}

export function canonRelevance(
  row: { targetType: string; targetId: string },
  sceneId: string,
  chapterId: string,
): { r: SceneResearchRelevance; explanation: string } {
  if (row.targetType === "scene" && row.targetId === sceneId) {
    return { r: "accepted_scene_canon", explanation: "Active canon row targets this scene id." };
  }
  if (row.targetType === "chapter" && row.targetId === chapterId) {
    return { r: "accepted_chapter_canon", explanation: "Active canon row targets this scene’s chapter." };
  }
  if (row.targetType === "person" || row.targetType === "place") {
    return { r: "accepted_entity_canon", explanation: `Active canon row targets this ${row.targetType}.` };
  }
  return { r: "accepted_entity_canon", explanation: "Active canon row targets an entity in this scene’s generation scope." };
}

/** Group accepted canon rows for tab display (stable sort by target type). */
export function groupAcceptedCanonByTargetType<T extends { targetType: string }>(
  items: T[],
): { targetType: string; items: T[] }[] {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = it.targetType;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([targetType, group]) => ({ targetType, items: group }));
}
