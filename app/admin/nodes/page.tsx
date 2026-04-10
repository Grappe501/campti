import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getEnvironmentNodesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminNodesPage() {
  const nodes = await getEnvironmentNodesForAdmin();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Environment nodes"
        description="Simulation network locations (river channel, landing, hub). Classify with nodeType; align to RegistryValue (ENVIRONMENT) later."
      />
      <p className="text-sm">
        <Link href="/admin/nodes/new" className="text-amber-900 hover:underline">
          New node
        </Link>
      </p>
      {nodes.length === 0 ? (
        <p className="text-sm text-stone-600">No nodes yet. Seed data or create one.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-xs font-medium uppercase text-stone-500">
              <tr>
                <th className="px-4 py-2">Key</th>
                <th className="px-4 py-2">Label</th>
                <th className="px-4 py-2">Place</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Core</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {nodes.map((n) => (
                <tr key={n.id}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/nodes/${n.id}`} className="text-amber-900 hover:underline">
                      {n.key}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{n.label}</td>
                  <td className="px-4 py-2 text-stone-600">{n.place.name}</td>
                  <td className="px-4 py-2 text-stone-600">{n.nodeType ?? "—"}</td>
                  <td className="px-4 py-2">{n.isCoreNode ? "yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
