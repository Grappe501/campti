import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getWorldGovernanceProfilesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> };

export default async function AdminGovernanceListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rows = await getWorldGovernanceProfilesForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Governance profiles"
        description="Stage 5 — order, justice mode, and conformity pressure per world state."
      />
      <p className="text-sm">
        <Link href="/admin/pressure/governance/new" className="text-amber-900 hover:underline">
          New governance profile
        </Link>
        {" · "}
        <Link href="/admin/world-states" className="text-amber-900 hover:underline">
          World states
        </Link>
      </p>
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      {sp.deleted ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">Removed.</p>
      ) : null}
      {sp.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">Error: {sp.error}</p>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-sm text-stone-600">No profiles yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <Link href={`/admin/pressure/governance/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.label}
              </Link>
              <span className="text-stone-600"> — {r.worldState.eraId}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
