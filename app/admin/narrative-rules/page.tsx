import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getNarrativeRulesList } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminNarrativeRulesPage() {
  const rules = await getNarrativeRulesList();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Narrative rules"
        description="Atomic constraints and laws extracted from documents — editable, strength-weighted."
      />
      <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {rules.length === 0 ? (
          <li className="text-sm text-stone-600">No rules yet. Run narrative DNA extraction on a reviewed source.</li>
        ) : (
          rules.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/narrative-rules/${r.id}`} className="text-amber-900 hover:underline">
                {r.title}
              </Link>
              <span className="ml-2 text-xs text-stone-500">
                {r.category}
                {r.source ? ` · ${r.source.title}` : ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
