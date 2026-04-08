import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getPeople } from "@/lib/data-access";
import { getRelationshipsForAdmin } from "@/lib/data-access";
import { upsertCharacterRelationshipAction } from "@/app/actions/scene-soul";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

export default async function RelationshipsPage() {
  const [rows, people] = await Promise.all([getRelationshipsForAdmin(), getPeople()]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        title="Relationships"
        description="Interpretive bonds between two people — Enneagram-aware dynamics are suggestions, not fate."
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">New relationship</h2>
        <form action={upsertCharacterRelationshipAction} className="mt-4 space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Person A</span>
              <select name="personAId" className={fieldClass} required>
                <option value="">—</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Person B</span>
              <select name="personBId" className={fieldClass} required>
                <option value="">—</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Type</span>
            <input name="relationshipType" className={fieldClass} placeholder="parent_child, ally, rival…" required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Summary</span>
            <textarea name="relationshipSummary" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Emotional pattern</span>
            <textarea name="emotionalPattern" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Enneagram dynamic (interpretive)</span>
            <textarea name="enneagramDynamic" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Confidence (1–5)</span>
            <input name="confidence" type="number" min={1} max={5} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
          >
            Create
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">All relationships</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rows.length === 0 ? (
            <li className="text-stone-500">None yet.</li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-stone-100 bg-white px-4 py-3">
                <div>
                  <Link href={`/admin/relationships/${r.id}`} className="font-medium text-amber-900 hover:underline">
                    {r.personA.name} ↔ {r.personB.name}
                  </Link>
                  <p className="text-xs text-stone-500">{r.relationshipType}</p>
                </div>
                <span className="text-xs text-stone-400">{r.updatedAt.toISOString().slice(0, 10)}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
