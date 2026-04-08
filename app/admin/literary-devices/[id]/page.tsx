import Link from "next/link";
import { notFound } from "next/navigation";
import { updateLiteraryDeviceAction } from "@/app/actions/narrative-dna-admin";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { DnaSourceSupportPanel } from "@/components/admin/dna-source-support-panel";
import { getDnaEntitySourceSupport, getLiteraryDeviceById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function AdminLiteraryDeviceDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const d = await getLiteraryDeviceById(id);
  if (!d) notFound();
  const layersJson = d.layers && Array.isArray(d.layers) ? JSON.stringify(d.layers) : "";

  const sourceSupport = await getDnaEntitySourceSupport("literary_device", d.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/admin/literary-devices" className="text-sm text-amber-900 hover:underline">
        ← Literary devices
      </Link>
      <PageHeader title={d.name} description="Edit device." />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateLiteraryDeviceAction} className="space-y-4">
          <input type="hidden" name="id" value={d.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Name</span>
            <input name="name" required defaultValue={d.name} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" required rows={5} defaultValue={d.description} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>System effect</span>
            <textarea name="systemEffect" required rows={4} defaultValue={d.systemEffect} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} defaultValue={d.notes ?? ""} className={fieldClass} />
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

      {d.notes?.includes("[merge]") || d.notes?.includes("[policy]") ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-stone-800">
          <h2 className="font-medium text-stone-900">Merge / consolidation notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-xs text-stone-700">{d.notes}</p>
        </section>
      ) : null}

      <DnaSourceSupportPanel
        entityLabel="literary device"
        primarySource={
          sourceSupport.primarySource ?? (d.source ? { id: d.source.id, title: d.source.title } : null)
        }
        fromBindings={sourceSupport.fromBindings}
      />
    </div>
  );
}
