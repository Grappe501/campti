import Link from "next/link";
import { notFound } from "next/navigation";
import { updateNarrativePatternAction } from "@/app/actions/narrative-dna-admin";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { autoSuggestBindings } from "@/lib/narrative-binding";
import { DnaSourceSupportPanel } from "@/components/admin/dna-source-support-panel";
import { getDnaEntitySourceSupport, getNarrativePatternById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function AdminPatternDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const pattern = await getNarrativePatternById(id);
  if (!pattern) notFound();

  const suggestions = await autoSuggestBindings({
    type: "narrative_pattern",
    id: pattern.id,
    label: pattern.title,
    textBlob: `${pattern.title} ${pattern.description}`,
  });

  const layersJson =
    pattern.layers && Array.isArray(pattern.layers) ? JSON.stringify(pattern.layers) : "";

  const sourceSupport = await getDnaEntitySourceSupport("narrative_pattern", pattern.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/admin/patterns" className="text-sm text-amber-900 hover:underline">
        ← Patterns
      </Link>
      <PageHeader title={pattern.title} description="Pattern type and strength." />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateNarrativePatternAction} className="space-y-4">
          <input type="hidden" name="id" value={pattern.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required defaultValue={pattern.title} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" required rows={7} defaultValue={pattern.description} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Pattern type</span>
              <input name="patternType" defaultValue={pattern.patternType} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Strength (1–5)</span>
              <input name="strength" type="number" min={1} max={5} defaultValue={pattern.strength ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} defaultValue={pattern.notes ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Layers JSON</span>
            <input name="layersJson" defaultValue={layersJson} className={fieldClass} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
            Save
          </button>
        </form>
      </section>

      {pattern.notes?.includes("[merge]") || pattern.notes?.includes("[policy]") ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-stone-800">
          <h2 className="font-medium text-stone-900">Merge / consolidation notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-xs text-stone-700">{pattern.notes}</p>
        </section>
      ) : null}

      <DnaSourceSupportPanel
        entityLabel="pattern"
        primarySource={
          sourceSupport.primarySource ??
          (pattern.source ? { id: pattern.source.id, title: pattern.source.title } : null)
        }
        fromBindings={sourceSupport.fromBindings}
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Suggested character / scene links</h2>
        <ul className="mt-4 space-y-2 text-sm text-stone-700">
          {suggestions.slice(0, 16).map((s, i) => (
            <li key={i}>
              → {s.targetType}: {s.targetLabel} ({s.rationale})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
