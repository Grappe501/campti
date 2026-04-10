import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getWorldPressureBundlesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> };

export default async function AdminPressureBundlesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rows = await getWorldPressureBundlesForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="World pressure bundles" description="Stage 5 — inspectable weight mix per world state." />
      <p className="text-sm">
        <Link href="/admin/pressure/bundles/new" className="text-amber-900 hover:underline">
          New bundle
        </Link>
        {" · "}
        <Link href="/admin/world-states" className="text-amber-900 hover:underline">
          World states
        </Link>
      </p>
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      {sp.deleted ? <p className="text-sm text-amber-900">Removed.</p> : null}
      {sp.error ? <p className="text-sm text-rose-800">Error.</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-stone-600">No bundles.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <Link href={`/admin/pressure/bundles/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.worldState.eraId}
              </Link>
              <span className="text-stone-600">
                {" "}
                — weights {r.governanceWeight}/{r.economicWeight}/{r.demographicWeight}/{r.familyWeight}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
