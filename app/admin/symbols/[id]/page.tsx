import Link from "next/link";
import { notFound } from "next/navigation";
import { SymbolCategory } from "@prisma/client";
import { updateSymbolAdminAction } from "@/app/actions/narrative-dna-admin";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { autoSuggestBindings } from "@/lib/narrative-binding";
import { DnaSourceSupportPanel } from "@/components/admin/dna-source-support-panel";
import { getDnaEntitySourceSupport, getSymbolByIdAdmin } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function AdminSymbolDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const sym = await getSymbolByIdAdmin(id);
  if (!sym) notFound();

  const suggestions = await autoSuggestBindings({
    type: "symbol",
    id: sym.id,
    label: sym.name,
    textBlob: `${sym.name} ${sym.meaning ?? ""} ${sym.meaningPrimary ?? ""}`,
  });

  const layersJson = sym.layers && Array.isArray(sym.layers) ? JSON.stringify(sym.layers) : "";

  const sourceSupport = await getDnaEntitySourceSupport("symbol", sym.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/admin/symbols" className="text-sm text-amber-900 hover:underline">
        ← Symbols
      </Link>
      <PageHeader title={sym.name} description="DNA-layered symbol fields." />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateSymbolAdminAction} className="space-y-4">
          <input type="hidden" name="id" value={sym.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Name</span>
            <input name="name" required defaultValue={sym.name} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Legacy meaning</span>
            <textarea name="meaning" rows={2} defaultValue={sym.meaning ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Meaning (primary)</span>
            <textarea name="meaningPrimary" rows={3} defaultValue={sym.meaningPrimary ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Meaning (secondary)</span>
            <textarea name="meaningSecondary" rows={2} defaultValue={sym.meaningSecondary ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional tone</span>
              <input name="emotionalTone" defaultValue={sym.emotionalTone ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Certainty</span>
              <input name="certainty" defaultValue={sym.certainty ?? ""} className={fieldClass} placeholder="interpretive…" />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Usage context</span>
            <textarea name="usageContext" rows={2} defaultValue={sym.usageContext ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Category</span>
            <select name="category" className={fieldClass} defaultValue={sym.category ?? ""}>
              <option value="">—</option>
              {Object.values(SymbolCategory).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Source trace</span>
            <input name="sourceTraceNote" defaultValue={sym.sourceTraceNote ?? ""} className={fieldClass} />
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

      {sym.sourceTraceNote?.includes("[merge]") || sym.sourceTraceNote?.includes("[policy]") ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-stone-800">
          <h2 className="font-medium text-stone-900">Merge / consolidation notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-xs text-stone-700">{sym.sourceTraceNote}</p>
        </section>
      ) : null}

      <DnaSourceSupportPanel
        entityLabel="symbol"
        primarySource={sourceSupport.primarySource ?? (sym.source ? { id: sym.source.id, title: sym.source.title } : null)}
        fromBindings={sourceSupport.fromBindings}
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Suggested links</h2>
        <ul className="mt-4 space-y-2 text-sm text-stone-700">
          {suggestions.slice(0, 14).map((s, i) => (
            <li key={i}>
              → {s.targetType}: {s.targetLabel}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
