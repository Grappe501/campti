import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getSceneReadinessProfilesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Search = { saved?: string };

export default async function ReadinessAdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const rows = await getSceneReadinessProfilesForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Scene readiness profiles"
          description="Draft gating states. Aligns with RegistryValue family READINESS and future SceneReadiness engine."
        />
        <Link
          href="/admin/readiness/new"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50"
        >
          New profile
        </Link>
      </div>

      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-sm text-stone-600">No profiles. Run seed.</li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="px-4 py-3 text-sm">
              <Link href={`/admin/readiness/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.label}
              </Link>
              <span className="ml-2 font-mono text-xs text-stone-500">
                {r.key} · draftable={String(r.isDraftable)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
