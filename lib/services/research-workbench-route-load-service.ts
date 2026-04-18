import type { ResearchWorkbenchUrlState } from "@/lib/domain/research-workbench-nav";
import type { ResearchWorkbenchNarrowContext } from "@/lib/domain/research-workbench";
import { prisma } from "@/lib/prisma";
import {
  type ResearchWorkbenchDashboardQuery,
  loadResearchWorkbenchDashboard,
} from "@/lib/services/research-workbench-dashboard-load-service";
import { resolveNarrowResearchTargetIds } from "@/lib/services/research-target-scene-graph-service";

function buildNarrowDescription(f: ResearchWorkbenchUrlState): string {
  const parts: string[] = [];
  if (f.sceneId) parts.push(`scene ${f.sceneId}`);
  if (f.chapterId) parts.push(`chapter ${f.chapterId}`);
  if (f.personId) parts.push(`person ${f.personId}`);
  if (f.placeId) parts.push(`place ${f.placeId}`);
  if (f.queue === "open_claims") parts.push("queue: open claims");
  if (f.queue === "contradictions") parts.push("queue: contradictions");
  return parts.length ? `Filtered: ${parts.join(" · ")}` : "Unfiltered workspace";
}

function toNarrowContext(f: ResearchWorkbenchUrlState): ResearchWorkbenchNarrowContext {
  return {
    description: buildNarrowDescription(f),
    sceneId: f.sceneId,
    chapterId: f.chapterId,
    personId: f.personId,
    placeId: f.placeId,
    queue: f.queue,
  };
}

/**
 * Resolves URL search params into dashboard query options for `/admin/research`.
 */
export async function loadResearchWorkbenchDashboardFromRoute(
  filters: ResearchWorkbenchUrlState,
): Promise<ReturnType<typeof loadResearchWorkbenchDashboard>> {
  const hasEntityFilters = Boolean(filters.sceneId || filters.chapterId || filters.personId || filters.placeId);
  const narrowIds = hasEntityFilters ? await resolveNarrowResearchTargetIds(filters) : null;

  let sceneScope: ResearchWorkbenchDashboardQuery["sceneScopeForAcceptedCanonCount"] | undefined;
  if (filters.sceneId?.trim()) {
    const scene = await prisma.scene.findUnique({
      where: { id: filters.sceneId },
      select: { id: true, chapterId: true, persons: { select: { id: true } }, places: { select: { id: true } } },
    });
    if (scene) {
      sceneScope = {
        sceneId: scene.id,
        chapterId: scene.chapterId,
        personIds: scene.persons.map((p) => p.id),
        placeIds: scene.places.map((p) => p.id),
      };
    }
  }

  const narrowContext = toNarrowContext(filters);

  if (!hasEntityFilters && !filters.queue) {
    return loadResearchWorkbenchDashboard(undefined);
  }

  return loadResearchWorkbenchDashboard({
    narrowTargetIds: hasEntityFilters ? (narrowIds ?? []) : null,
    sceneScopeForAcceptedCanonCount: sceneScope,
    queue: filters.queue,
    narrowContext: hasEntityFilters || filters.queue ? narrowContext : null,
  });
}
