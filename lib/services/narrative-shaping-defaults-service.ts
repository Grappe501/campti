import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  HierarchyShapingResolution,
  NarrativeShapingDefaults,
  NarrativeShapingObserverSummary,
  NarrativeShapingOverrideSet,
} from "@/lib/domain/narrative-shaping-defaults";
import {
  buildHierarchyResolution,
  extractNarrativeShapingDefaultsFromContainer,
  mergeNarrativeShapingOverrides,
  normalizeNarrativeShapingDefaults,
  wrapNarrativeShapingDefaultsV1,
} from "@/lib/narrative-shaping/narrative-shaping-resolution";
import { NARRATIVE_SHAPING_METADATA_KEY } from "@/lib/domain/narrative-shaping-defaults";

function hasLayerContent(d: NarrativeShapingDefaults | null | undefined): boolean {
  if (!d) return false;
  return Object.keys(d).length > 0;
}

export function buildNarrativeShapingObserverSummaryFromLayers(
  merged: NarrativeShapingDefaults,
  fieldSources: HierarchyShapingResolution["fieldSources"],
  layers: HierarchyShapingResolution["layers"]
): NarrativeShapingObserverSummary {
  return {
    narrativeWitnessMode: merged.narrativeWitnessMode ?? null,
    productionMode: merged.productionMode ?? null,
    shapingNotes: merged.shapingNotes ?? null,
    fieldSources,
    layersPresent: {
      epic: hasLayerContent(layers.epic),
      book: hasLayerContent(layers.book),
      chapter: hasLayerContent(layers.chapter),
      scene: hasLayerContent(layers.scene),
    },
  };
}

export function buildNarrativeShapingObserverSummary(
  resolution: HierarchyShapingResolution
): NarrativeShapingObserverSummary {
  return buildNarrativeShapingObserverSummaryFromLayers(
    resolution.merged,
    resolution.fieldSources,
    resolution.layers
  );
}

export async function resolveNarrativeShapingDefaultsForScene(
  sceneId: string,
  runtimeOverride?: NarrativeShapingOverrideSet | null
): Promise<HierarchyShapingResolution> {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: {
      id: true,
      structuredDataJson: true,
      chapter: {
        select: {
          id: true,
          generationMetadataJson: true,
          book: {
            select: {
              id: true,
              metadataJson: true,
              epic: { select: { id: true, metadataJson: true } },
            },
          },
        },
      },
    },
  });

  const epicDefaults = extractNarrativeShapingDefaultsFromContainer(scene.chapter.book.epic.metadataJson);
  const bookDefaults = extractNarrativeShapingDefaultsFromContainer(scene.chapter.book.metadataJson);
  const chapterDefaults = extractNarrativeShapingDefaultsFromContainer(scene.chapter.generationMetadataJson);
  const sceneDefaults = extractNarrativeShapingDefaultsFromContainer(scene.structuredDataJson);

  return buildHierarchyResolution({
    sceneId: scene.id,
    epicId: scene.chapter.book.epic.id,
    bookId: scene.chapter.book.id,
    chapterId: scene.chapter.id,
    epicDefaults,
    bookDefaults,
    chapterDefaults,
    sceneDefaults,
    runtimeOverride: runtimeOverride ?? null,
  });
}

export async function resolveNarrativeShapingDefaultsForBook(bookId: string): Promise<{
  merged: NarrativeShapingDefaults;
  fieldSources: HierarchyShapingResolution["fieldSources"];
  layers: HierarchyShapingResolution["layers"];
}> {
  const book = await prisma.book.findUniqueOrThrow({
    where: { id: bookId },
    select: {
      id: true,
      metadataJson: true,
      epic: { select: { metadataJson: true } },
    },
  });
  const epicDefaults = extractNarrativeShapingDefaultsFromContainer(book.epic.metadataJson);
  const bookDefaults = extractNarrativeShapingDefaultsFromContainer(book.metadataJson);
  const { merged, fieldSources } = mergeNarrativeShapingOverrides([
    { source: "epic", defaults: epicDefaults },
    { source: "book", defaults: bookDefaults },
  ]);
  return {
    merged,
    fieldSources,
    layers: {
      epic: epicDefaults,
      book: bookDefaults,
      chapter: null,
      scene: null,
    },
  };
}

export async function resolveNarrativeShapingDefaultsForChapter(chapterId: string): Promise<{
  merged: NarrativeShapingDefaults;
  fieldSources: HierarchyShapingResolution["fieldSources"];
  layers: HierarchyShapingResolution["layers"];
}> {
  const chapter = await prisma.chapter.findUniqueOrThrow({
    where: { id: chapterId },
    select: {
      generationMetadataJson: true,
      book: {
        select: {
          metadataJson: true,
          epic: { select: { metadataJson: true } },
        },
      },
    },
  });
  const epicDefaults = extractNarrativeShapingDefaultsFromContainer(chapter.book.epic.metadataJson);
  const bookDefaults = extractNarrativeShapingDefaultsFromContainer(chapter.book.metadataJson);
  const chapterDefaults = extractNarrativeShapingDefaultsFromContainer(chapter.generationMetadataJson);
  const { merged, fieldSources } = mergeNarrativeShapingOverrides([
    { source: "epic", defaults: epicDefaults },
    { source: "book", defaults: bookDefaults },
    { source: "chapter", defaults: chapterDefaults },
  ]);
  return {
    merged,
    fieldSources,
    layers: {
      epic: epicDefaults,
      book: bookDefaults,
      chapter: chapterDefaults,
      scene: null,
    },
  };
}

export async function resolveNarrativeShapingDefaultsForEpic(epicId: string): Promise<{
  merged: NarrativeShapingDefaults;
  fieldSources: HierarchyShapingResolution["fieldSources"];
}> {
  const epic = await prisma.epic.findUniqueOrThrow({
    where: { id: epicId },
    select: { metadataJson: true },
  });
  const epicDefaults = extractNarrativeShapingDefaultsFromContainer(epic.metadataJson);
  const { merged, fieldSources } = mergeNarrativeShapingOverrides([
    { source: "epic", defaults: epicDefaults },
  ]);
  return { merged, fieldSources };
}

function mergeJsonWithShaping(
  existing: unknown,
  patch: NarrativeShapingDefaults
): Prisma.InputJsonValue {
  const existingDefaults = extractNarrativeShapingDefaultsFromContainer(existing);
  const { merged } = mergeNarrativeShapingOverrides([
    { source: "epic", defaults: existingDefaults },
    { source: "runtime", defaults: patch },
  ]);
  const root = existing && typeof existing === "object" && !Array.isArray(existing) ? { ...(existing as object) } : {};
  return {
    ...(root as Record<string, unknown>),
    [NARRATIVE_SHAPING_METADATA_KEY]: wrapNarrativeShapingDefaultsV1(merged),
  } as Prisma.InputJsonValue;
}

export async function setEpicNarrativeShapingDefaults(epicId: string, patch: NarrativeShapingDefaults) {
  const epic = await prisma.epic.findUniqueOrThrow({ where: { id: epicId }, select: { metadataJson: true } });
  const next = mergeJsonWithShaping(epic.metadataJson, patch);
  await prisma.epic.update({ where: { id: epicId }, data: { metadataJson: next } });
  return { ok: true as const, epicId };
}

export async function setBookNarrativeShapingDefaults(bookId: string, patch: NarrativeShapingDefaults) {
  const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId }, select: { metadataJson: true } });
  const next = mergeJsonWithShaping(book.metadataJson, patch);
  await prisma.book.update({ where: { id: bookId }, data: { metadataJson: next } });
  return { ok: true as const, bookId };
}

export async function setChapterNarrativeShapingDefaults(chapterId: string, patch: NarrativeShapingDefaults) {
  const ch = await prisma.chapter.findUniqueOrThrow({
    where: { id: chapterId },
    select: { generationMetadataJson: true },
  });
  const next = mergeJsonWithShaping(ch.generationMetadataJson, patch);
  await prisma.chapter.update({ where: { id: chapterId }, data: { generationMetadataJson: next } });
  return { ok: true as const, chapterId };
}

export async function setSceneNarrativeShapingDefaults(sceneId: string, patch: NarrativeShapingDefaults) {
  const sc = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: { structuredDataJson: true },
  });
  const next = mergeJsonWithShaping(sc.structuredDataJson, patch);
  await prisma.scene.update({ where: { id: sceneId }, data: { structuredDataJson: next } });
  return { ok: true as const, sceneId };
}

/** Parse defaults from an arbitrary JSON blob (e.g. admin paste). */
export function parseNarrativeShapingDefaultsPayload(raw: unknown): NarrativeShapingDefaults {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Expected JSON object for narrative shaping defaults.");
  }
  return normalizeNarrativeShapingDefaults(raw as Record<string, unknown>);
}
