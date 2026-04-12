import Link from "next/link";
import { getAssembledCharacterBrainState } from "@/app/actions/brain-assembly";

/** Optional preview block when `personId` + `worldStateId` are known (e.g. from search params or parent selection). */
export async function BrainSummaryPreview({
  personId,
  worldStateId,
  sceneId,
}: {
  personId?: string;
  worldStateId?: string;
  sceneId?: string;
}) {
  if (!personId || !worldStateId) {
    return null;
  }

  const { brain } = await getAssembledCharacterBrainState(personId, worldStateId, sceneId);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Stage 7 brain preview</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Derived snapshot from intelligence, pressure, relationships, continuity, health, and environment.
          </p>
        </div>
        <Link
          href={`/admin/characters/${personId}/brain?worldStateId=${worldStateId}${sceneId ? `&sceneId=${sceneId}` : ""}`}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          Open full brain page
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Notice bandwidth</div>
          <div className="mt-1 font-medium">{brain.perception.noticeBandwidth}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Disclosure cost</div>
          <div className="mt-1 font-medium">{brain.relationalSafety.disclosureCost}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Freeze risk</div>
          <div className="mt-1 font-medium">{brain.regulation.freezeRisk}</div>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Most likely move</div>
          <div className="mt-1 font-medium">{brain.decision.mostLikelyMove ?? "None"}</div>
        </div>
      </div>
    </section>
  );
}
