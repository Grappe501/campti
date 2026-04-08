import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getSymbolsAdminList } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminSymbolsPage() {
  const symbols = await getSymbolsAdminList();
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Symbols"
        description="Layered symbols with certainty and DNA fields — link to themes, fragments, and scenes via bindings."
      />
      <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {symbols.length === 0 ? (
          <li className="text-sm text-stone-600">No symbols yet.</li>
        ) : (
          symbols.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/symbols/${s.id}`} className="text-amber-900 hover:underline">
                {s.name}
              </Link>
              {s.source ? <span className="ml-2 text-xs text-stone-500">· from {s.source.title}</span> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
