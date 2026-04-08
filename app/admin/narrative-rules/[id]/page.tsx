import Link from "next/link";
import { notFound } from "next/navigation";
import { updateNarrativeRuleAction } from "@/app/actions/narrative-dna-admin";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { autoSuggestBindings } from "@/lib/narrative-binding";
import { DnaSourceSupportPanel } from "@/components/admin/dna-source-support-panel";
import { getDnaEntitySourceSupport, getNarrativeRuleById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function AdminNarrativeRuleDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const rule = await getNarrativeRuleById(id);
  if (!rule) notFound();

  const suggestions = await autoSuggestBindings({
    type: "narrative_rule",
    id: rule.id,
    label: rule.title,
    textBlob: `${rule.title} ${rule.description}`,
  });

  const sourceSupport = await getDnaEntitySourceSupport("narrative_rule", rule.id);

  const layersJson =
    rule.layers && Array.isArray(rule.layers) ? JSON.stringify(rule.layers, null, 0) : "";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/admin/narrative-rules" className="text-sm text-amber-900 hover:underline">
        ← All narrative rules
      </Link>
      <PageHeader title={rule.title} description="Edit rule text, scope, and layers." />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateNarrativeRuleAction} className="space-y-4">
          <input type="hidden" name="id" value={rule.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required defaultValue={rule.title} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" required rows={8} defaultValue={rule.description} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Category</span>
              <input name="category" defaultValue={rule.category} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Strength (1–5)</span>
              <input name="strength" type="number" min={1} max={5} defaultValue={rule.strength ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Scope</span>
              <input name="scope" defaultValue={rule.scope ?? ""} className={fieldClass} placeholder="global, scene…" />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes / uncertainty</span>
            <textarea name="notes" rows={2} defaultValue={rule.notes ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Layers JSON (array of strings)</span>
            <input name="layersJson" defaultValue={layersJson} className={fieldClass} placeholder='["theme","rule"]' />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
            Save
          </button>
        </form>
      </section>

      {rule.notes?.includes("[merge]") || rule.notes?.includes("[policy]") ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-stone-800">
          <h2 className="font-medium text-stone-900">Merge / consolidation notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-xs text-stone-700">{rule.notes}</p>
        </section>
      ) : null}

      <DnaSourceSupportPanel
        entityLabel="rule"
        primarySource={
          sourceSupport.primarySource ??
          (rule.source ? { id: rule.source.id, title: rule.source.title } : null)
        }
        fromBindings={sourceSupport.fromBindings}
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Suggested links</h2>
        <p className="mt-1 text-xs text-stone-500">Token overlap — verify before creating bindings on the bindings admin page.</p>
        <ul className="mt-4 space-y-2 text-sm text-stone-700">
          {suggestions.length === 0 ? (
            <li>No suggestions.</li>
          ) : (
            suggestions.map((s, i) => (
              <li key={i}>
                {s.relationship}: {s.sourceLabel} → {s.targetType} {s.targetLabel}
                <span className="block text-xs text-stone-500">{s.rationale}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
