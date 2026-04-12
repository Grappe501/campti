import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getWorldStateReferencesWithEraCoverage } from "@/lib/data-access";
import { ERA_PROFILE_PRIORITY_ERA_IDS } from "@/lib/world-era-profile-tuning";

export const dynamic = "force-dynamic";

export default async function AdminWorldStatesPage() {
  const states = await getWorldStateReferencesWithEraCoverage();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="World states"
        description="Era slices (WorldStateReference). Use Era profile to tune economic/social interpretation and effective pressure weights; fill priority eras in your active slices first."
      />
      {states.length === 0 ? (
        <p className="text-sm text-stone-600">No world states. Seed or add via Prisma.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {states.map((w) => (
            <li key={w.id} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Link href={`/admin/world-states/${w.id}/pressure`} className="font-medium text-amber-900 hover:underline">
                  {w.eraId}
                </Link>
                {ERA_PROFILE_PRIORITY_ERA_IDS.has(w.eraId) ? (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-950">Tune first</span>
                ) : null}
              </span>
              <span className="text-stone-600"> — {w.label}</span>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500">
                <span>
                  Era profile:{" "}
                  {w.worldEraProfile ? (
                    <span className="text-emerald-800">saved</span>
                  ) : (
                    <span className="text-amber-800">missing</span>
                  )}
                  {w.worldEraProfile?.evidenceRationale?.trim() ? (
                    <span className="text-stone-500"> · evidence noted</span>
                  ) : w.worldEraProfile ? (
                    <span className="text-stone-400"> · add evidence ties</span>
                  ) : null}
                </span>
                <span>
                  Pressure bundle: {w.worldPressureBundle ? <span className="text-emerald-800">yes</span> : <span className="text-stone-500">no</span>}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm">
                <Link href={`/admin/world-states/${w.id}/pressure`} className="text-amber-900 hover:underline">
                  Pressure
                </Link>
                <span className="text-stone-300">·</span>
                <Link href={`/admin/world-states/${w.id}/profile`} className="text-amber-900 hover:underline">
                  Era profile
                </Link>
                <span className="text-stone-300">·</span>
                <Link href={`/admin/world-states/${w.id}/knowledge`} className="text-amber-900 hover:underline">
                  Knowledge
                </Link>
                <span className="text-stone-300">·</span>
                <Link href={`/admin/world-states/${w.id}/relationships`} className="text-amber-900 hover:underline">
                  Relationships
                </Link>
                <span className="text-stone-300">·</span>
                <Link href={`/admin/world-states/${w.id}/education`} className="text-amber-900 hover:underline">
                  Education
                </Link>
                <span className="text-stone-300">·</span>
                <Link href={`/admin/world-states/${w.id}/health`} className="text-amber-900 hover:underline">
                  Health
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
