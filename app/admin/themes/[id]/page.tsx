import Link from "next/link";
import { notFound } from "next/navigation";
import { updateThemeAction } from "@/app/actions/narrative-dna-admin";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { autoSuggestBindings } from "@/lib/narrative-binding";
import { DnaSourceSupportPanel } from "@/components/admin/dna-source-support-panel";
import { getDnaEntitySourceSupport, getThemeById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function AdminThemeDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const theme = await getThemeById(id);
  if (!theme) notFound();

  const suggestions = await autoSuggestBindings({
    type: "theme",
    id: theme.id,
    label: theme.name,
    textBlob: `${theme.name} ${theme.description}`,
  });

  const layersJson =
    theme.layers && Array.isArray(theme.layers) ? JSON.stringify(theme.layers) : "";

  const sourceSupport = await getDnaEntitySourceSupport("theme", theme.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/admin/themes" className="text-sm text-amber-900 hover:underline">
        ← All themes
      </Link>
      <PageHeader title={theme.name} description="Theme documentation and layers." />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateThemeAction} className="space-y-4">
          <input type="hidden" name="id" value={theme.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Name</span>
            <input name="name" required defaultValue={theme.name} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" required rows={8} defaultValue={theme.description} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Intensity (1–5)</span>
              <input name="intensity" type="number" min={1} max={5} defaultValue={theme.intensity ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Category</span>
              <input name="category" defaultValue={theme.category ?? ""} className={fieldClass} placeholder="core, subtheme" />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} defaultValue={theme.notes ?? ""} className={fieldClass} />
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

      {theme.notes?.includes("[merge]") || theme.notes?.includes("[policy]") ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-stone-800">
          <h2 className="font-medium text-stone-900">Merge / consolidation notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-xs text-stone-700">{theme.notes}</p>
        </section>
      ) : null}

      <DnaSourceSupportPanel
        entityLabel="theme"
        primarySource={
          sourceSupport.primarySource ??
          (theme.source ? { id: theme.source.id, title: theme.source.title } : null)
        }
        fromBindings={sourceSupport.fromBindings}
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Suggested links</h2>
        <ul className="mt-4 space-y-2 text-sm text-stone-700">
          {suggestions.slice(0, 12).map((s, i) => (
            <li key={i}>
              {s.sourceLabel} → {s.targetType} ({s.targetLabel})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
