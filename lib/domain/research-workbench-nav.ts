import type { ResearchWorkbenchRouteNarrowing } from "@/lib/services/research-target-scene-graph-service";

export type ResearchWorkbenchQueueParam = "open_claims" | "contradictions";

export type ResearchWorkbenchUrlState = ResearchWorkbenchRouteNarrowing & {
  queue?: ResearchWorkbenchQueueParam;
};

const QUEUES: ResearchWorkbenchQueueParam[] = ["open_claims", "contradictions"];

function isQueue(v: string | undefined): v is ResearchWorkbenchQueueParam {
  return v != null && (QUEUES as string[]).includes(v);
}

/**
 * Stable query semantics for `/admin/research` deep links from scene surfaces.
 */
export function buildResearchWorkbenchUrl(state: ResearchWorkbenchUrlState): string {
  const p = new URLSearchParams();
  if (state.sceneId?.trim()) p.set("sceneId", state.sceneId.trim());
  if (state.chapterId?.trim()) p.set("chapterId", state.chapterId.trim());
  if (state.personId?.trim()) p.set("personId", state.personId.trim());
  if (state.placeId?.trim()) p.set("placeId", state.placeId.trim());
  if (state.queue && isQueue(state.queue)) p.set("queue", state.queue);
  const qs = p.toString();
  return qs ? `/admin/research?${qs}` : "/admin/research";
}

export function parseResearchWorkbenchUrlState(sp: Record<string, string | string[] | undefined>): ResearchWorkbenchUrlState {
  const one = (k: string) => {
    const v = sp[k];
    if (Array.isArray(v)) return v[0]?.trim() ?? undefined;
    return typeof v === "string" ? v.trim() || undefined : undefined;
  };
  const q = one("queue");
  return {
    sceneId: one("sceneId"),
    chapterId: one("chapterId"),
    personId: one("personId"),
    placeId: one("placeId"),
    queue: isQueue(q) ? q : undefined,
  };
}
