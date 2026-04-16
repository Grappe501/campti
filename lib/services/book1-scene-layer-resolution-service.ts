import {
  Book1CanonStatus,
  Book1ConfidenceType,
  Book1SceneComponentType,
  type Book1SceneComponent,
  type PrismaClient,
} from "@prisma/client";

const SCENE1_SEEDED_SOURCE_KEY = "book1_scene_01_river_layer_stack";

function confidenceRank(value: Book1ConfidenceType): number {
  return {
    [Book1ConfidenceType.HISTORICAL]: 6,
    [Book1ConfidenceType.INFERRED_HISTORICAL]: 5,
    [Book1ConfidenceType.NARRATIVE_DESIGN]: 4,
    [Book1ConfidenceType.INTERPRETIVE]: 3,
    [Book1ConfidenceType.UNRESOLVED]: 1,
  }[value];
}

function canonRank(value: Book1CanonStatus): number {
  return {
    [Book1CanonStatus.CANON]: 5,
    [Book1CanonStatus.CANDIDATE]: 3,
    [Book1CanonStatus.OPTIONAL]: 2,
    [Book1CanonStatus.DEPRECATED]: 0,
  }[value];
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function shouldSupersede(preferredText: string, candidateText: string): boolean {
  const a = normalizeText(preferredText);
  const b = normalizeText(candidateText);
  if (a.length === 0 || b.length === 0) return false;
  if (a === b) return true;
  const shortest = Math.min(a.length, b.length);
  if (shortest < 80) return false;
  return a.slice(0, 120) === b.slice(0, 120);
}

function scoreComponent(input: {
  componentType: Book1SceneComponentType;
  confidenceType: Book1ConfidenceType;
  canonStatus: Book1CanonStatus;
  orderPriority: number | null;
  sourceKey: string | null;
  sceneNumber: number;
}): number {
  let score = 0;
  score += confidenceRank(input.confidenceType) * 10;
  score += canonRank(input.canonStatus) * 6;
  if (input.orderPriority !== null) score += Math.max(0, 20 - input.orderPriority / 5);
  if (input.sceneNumber === 1 && input.sourceKey === SCENE1_SEEDED_SOURCE_KEY) score += 50;
  if (input.componentType === Book1SceneComponentType.PRIMARY_POV) score += 1;
  return score;
}

export type SceneLayerResolutionResult = {
  preferredComponentId: string;
  preferredComponentKey: string | null;
  demotedComponentIds: string[];
  supersededComponentIds: string[];
  totalInLayer: number;
};

export type SceneLayerComponentCandidate = Pick<
  Book1SceneComponent,
  "id" | "componentKey" | "componentType" | "confidenceType" | "canonStatus" | "orderPriority" | "textContent" | "createdAt"
> & {
  sourceKey: string | null;
  sceneNumber: number;
};

export function computeSceneLayerResolution(
  components: SceneLayerComponentCandidate[],
): SceneLayerResolutionResult | null {
  if (components.length === 0) return null;
  const ranked = [...components].sort((a, b) => {
    const scoreA = scoreComponent({
      componentType: a.componentType,
      confidenceType: a.confidenceType,
      canonStatus: a.canonStatus,
      orderPriority: a.orderPriority,
      sourceKey: a.sourceKey,
      sceneNumber: a.sceneNumber,
    });
    const scoreB = scoreComponent({
      componentType: b.componentType,
      confidenceType: b.confidenceType,
      canonStatus: b.canonStatus,
      orderPriority: b.orderPriority,
      sourceKey: b.sourceKey,
      sceneNumber: b.sceneNumber,
    });
    return scoreB - scoreA || a.createdAt.getTime() - b.createdAt.getTime();
  });

  const preferred = ranked[0];
  const demoted: string[] = [];
  const superseded: string[] = [];
  for (const candidate of ranked.slice(1)) {
    const shouldDeprecate = shouldSupersede(preferred.textContent, candidate.textContent);
    demoted.push(candidate.id);
    if (shouldDeprecate) superseded.push(candidate.id);
  }

  return {
    preferredComponentId: preferred.id,
    preferredComponentKey: preferred.componentKey,
    demotedComponentIds: demoted,
    supersededComponentIds: superseded,
    totalInLayer: ranked.length,
  };
}

export async function resolveSceneLayerPreference(input: {
  db: PrismaClient;
  sceneAnchorId: string;
  componentType: Book1SceneComponentType;
}): Promise<SceneLayerResolutionResult | null> {
  const components = await input.db.book1SceneComponent.findMany({
    where: {
      sceneAnchorId: input.sceneAnchorId,
      componentType: input.componentType,
    },
    include: {
      source: { select: { sourceKey: true } },
      sceneAnchor: { select: { sceneNumber: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });
  const decision = computeSceneLayerResolution(
    components.map((component) => ({
      ...component,
      sourceKey: component.source.sourceKey,
      sceneNumber: component.sceneAnchor.sceneNumber,
    })),
  );
  if (!decision) return null;

  await input.db.book1SceneComponent.update({
    where: { id: decision.preferredComponentId },
    data: { canonStatus: Book1CanonStatus.CANON },
  });

  const supersededSet = new Set(decision.supersededComponentIds);
  for (const candidateId of decision.demotedComponentIds) {
    const nextStatus = supersededSet.has(candidateId) ? Book1CanonStatus.DEPRECATED : Book1CanonStatus.CANDIDATE;
    await input.db.book1SceneComponent.update({
      where: { id: candidateId },
      data: { canonStatus: nextStatus },
    });
  }

  return decision;
}
