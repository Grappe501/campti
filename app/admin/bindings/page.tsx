import { PageHeader } from "@/components/page-header";
import {
  createNarrativeBindingAction,
  deleteNarrativeBindingAction,
} from "@/app/actions/narrative-dna-admin";
import { mergeNarrativeDnaDuplicatesAction } from "@/app/actions/narrative-dna-consolidation";
import { AdminFormError } from "@/components/admin-form-error";
import { NARRATIVE_BINDING_TYPES } from "@/lib/narrative-binding";
import { getNarrativeBindingsRecent } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

const RELATIONSHIPS = ["influences", "expresses", "contradicts", "emerges_from"] as const;

type Search = { error?: string; saved?: string };

export default async function AdminBindingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const bindings = await getNarrativeBindingsRecent(150);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Narrative bindings"
        description="Polymorphic links between DNA entities and the world model (scenes, people, fragments, etc.)."
      />
      <AdminFormError error={sp.error} />
      {sp.saved === "1" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Binding saved.</p>
      ) : null}
      {sp.saved === "deleted" ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-800">Binding removed.</p>
      ) : null}
      {sp.saved === "merged" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          Duplicate DNA row merged into canonical; bindings redirected.
        </p>
      ) : null}

      <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Merge duplicate DNA rows</h2>
        <p className="mt-1 text-xs text-stone-600">
          Absorbs the duplicate into the canonical id (keeps emerges_from sources where possible). Use after reviewing
          admin DNA pages.
        </p>
        <form action={mergeNarrativeDnaDuplicatesAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Canonical id</span>
            <input name="canonicalId" required className={fieldClass} placeholder="cuid…" />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Duplicate id</span>
            <input name="duplicateId" required className={fieldClass} placeholder="cuid…" />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <span className={labelSpanClass}>Entity type</span>
            <select name="type" required className={fieldClass} defaultValue="symbol">
              <option value="symbol">symbol</option>
              <option value="theme">theme</option>
              <option value="motif">motif</option>
              <option value="narrative_rule">narrative_rule</option>
              <option value="literary_device">literary_device</option>
              <option value="narrative_pattern">narrative_pattern</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
            >
              Merge duplicate into canonical
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Create binding</h2>
        <form action={createNarrativeBindingAction} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Source type</span>
              <select name="sourceType" required className={fieldClass}>
                {NARRATIVE_BINDING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Source ID</span>
              <input name="sourceId" required className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Target type</span>
              <select name="targetType" required className={fieldClass}>
                {NARRATIVE_BINDING_TYPES.map((t) => (
                  <option key={`t-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Target ID</span>
              <input name="targetId" required className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Relationship</span>
              <select name="relationship" className={fieldClass} defaultValue="influences">
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Strength (1–5)</span>
              <input name="strength" type="number" min={1} max={5} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <input name="notes" className={fieldClass} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
            Create binding
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Recent bindings</h2>
        <ul className="mt-4 space-y-3 text-sm text-stone-800">
          {bindings.length === 0 ? (
            <li className="text-stone-600">None yet.</li>
          ) : (
            bindings.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-stone-100 bg-stone-50/50 px-3 py-2"
              >
                <div>
                  <span className="font-medium">
                    {b.sourceType}:{b.sourceId}
                  </span>
                  <span className="text-stone-500"> {b.relationship} </span>
                  <span className="font-medium">
                    {b.targetType}:{b.targetId}
                  </span>
                  {b.notes ? <p className="mt-1 text-xs text-stone-600">{b.notes}</p> : null}
                </div>
                <form action={deleteNarrativeBindingAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Delete
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
