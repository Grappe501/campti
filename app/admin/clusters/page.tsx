import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { AdminFormError } from "@/components/admin-form-error";
import { getClustersForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function AdminClustersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const clusters = await getClustersForAdmin();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Fragment clusters"
        description="Constellations of related fragments — themes, symbols, emotional arcs. Small, strong groups beat noisy auto-graphs."
      />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Saved.
        </p>
      ) : null}

      <p className="text-sm text-stone-600">
        <Link href="/admin/brain" className="text-amber-900 hover:underline">
          Brain dashboard
        </Link>
      </p>

      {clusters.length === 0 ? (
        <p className="text-sm text-stone-600">No clusters yet. Create one from a meta scene compose view or seed data.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-xs font-medium uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Fragments</th>
                <th className="px-4 py-3">Tone</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {clusters.map((c) => (
                <tr key={c.id} className="align-top hover:bg-stone-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clusters/${c.id}`} className="font-medium text-amber-900 hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{c.clusterType}</td>
                  <td className="px-4 py-3 tabular-nums text-stone-700">{c._count.fragmentLinks}</td>
                  <td className="px-4 py-3 text-stone-600">{c.emotionalTone ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">{c.confidence ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/clusters/${c.id}`} className="text-amber-900 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
