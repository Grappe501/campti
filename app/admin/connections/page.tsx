import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getNodeConnectionsForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ deleted?: string }> };

export default async function AdminConnectionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rows = await getNodeConnectionsForAdmin();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Node connections"
        description="Corridors and adjacency (river, trail, trade path). Branch engine will use travel risk and seasonal modifiers."
      />
      {sp.deleted ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950" role="status">
          Connection removed.
        </p>
      ) : null}
      <p className="text-sm">
        <Link href="/admin/connections/new" className="text-amber-900 hover:underline">
          New connection
        </Link>
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-600">No connections yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-xs font-medium uppercase text-stone-500">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">From</th>
                <th className="px-4 py-2">To</th>
                <th className="px-4 py-2">Risk</th>
                <th className="px-4 py-2">World state</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/connections/${c.id}`} className="text-amber-900 hover:underline">
                      {c.connectionType}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-stone-700">{c.fromNode.key}</td>
                  <td className="px-4 py-2 text-stone-700">{c.toNode.key}</td>
                  <td className="px-4 py-2">{c.travelRisk}</td>
                  <td className="px-4 py-2 text-stone-600">{c.worldState?.eraId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
