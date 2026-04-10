import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getRiskRegimesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminRisksPage() {
  const rows = await getRiskRegimesForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Risk regimes" description="Reusable risk definitions (flood, conflict, isolation, …) for environment and node analytics." />
      <p className="text-sm">
        <Link href="/admin/risks/new" className="text-amber-900 hover:underline">
          New risk regime
        </Link>
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-600">No risk regimes yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <Link href={`/admin/risks/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.key}
              </Link>
              <span className="text-stone-600"> — {r.label}</span>
              <span className="ml-2 text-xs text-stone-500">
                {r.category} · severity {r.baseSeverity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
