import Link from "next/link";
import type { DnaSourceSupportRow } from "@/lib/data-access";

type Props = {
  entityLabel: string;
  primarySource: { id: string; title: string } | null;
  fromBindings: DnaSourceSupportRow[];
};

export function DnaSourceSupportPanel({ entityLabel, primarySource, fromBindings }: Props) {
  const seen = new Set<string>();
  const rows: { id: string; title: string; via: string; strength: number | null }[] = [];

  if (primarySource) {
    seen.add(primarySource.id);
    rows.push({
      id: primarySource.id,
      title: primarySource.title,
      via: "Row sourceId",
      strength: null,
    });
  }

  for (const b of fromBindings) {
    if (seen.has(b.sourceId)) continue;
    seen.add(b.sourceId);
    rows.push({
      id: b.sourceId,
      title: b.title,
      via: b.bindingNotes?.includes("consolidation") ? "Consolidation support" : "DNA extraction",
      strength: b.strength,
    });
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-stone-900">Guide source support</h2>
      <p className="mt-1 text-xs text-stone-500">
        Traceability for this {entityLabel}: which archive sources justify the row (FK + emerges_from bindings).
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-600">No linked guide sources yet.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm text-stone-800">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2">
              <Link href={`/admin/sources/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.title}
              </Link>
              <p className="mt-1 text-xs text-stone-500">
                {r.via}
                {r.strength != null ? ` · strength ${r.strength}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
