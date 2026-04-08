import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getNarrativePatternsList } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminPatternsPage() {
  const patterns = await getNarrativePatternsList();
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="Narrative patterns" description="Lineage, emotional, relational, and identity patterns." />
      <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {patterns.length === 0 ? (
          <li className="text-sm text-stone-600">No patterns yet.</li>
        ) : (
          patterns.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/patterns/${p.id}`} className="text-amber-900 hover:underline">
                {p.title}
              </Link>
              <span className="ml-2 text-xs text-stone-500">{p.patternType}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
