import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFormError } from "@/components/admin-form-error";
import { updateRegistryValue } from "@/app/actions/ontology";
import { REGISTRY_FAMILY_ORDER } from "@/lib/ontology-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PageHeader } from "@/components/page-header";
import { getRegistryValueByIdForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditRegistryValuePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const row = await getRegistryValueByIdForAdmin(id);
  if (!row) notFound();

  const cfg =
    row.config && typeof row.config === "object" ? JSON.stringify(row.config, null, 2) : "";
  const app =
    row.appliesTo && typeof row.appliesTo === "object" ? JSON.stringify(row.appliesTo, null, 2) : "";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin/registries/values" className="text-sm text-amber-900 hover:underline">
        ← Registry values
      </Link>
      <PageHeader title={row.label} description={`Key: ${row.key}`} />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}

      <form action={updateRegistryValue} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="key" value={row.key} />
        <p className="text-sm text-stone-600">
          Key: <span className="font-mono">{row.key}</span>
        </p>
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" required defaultValue={row.label} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" rows={3} defaultValue={row.description ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Family</span>
          <select name="family" required defaultValue={row.family} className={fieldClass}>
            {REGISTRY_FAMILY_ORDER.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Registry type</span>
          <input name="registryType" required defaultValue={row.registryType} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Sort order</span>
          <input name="sortOrder" type="number" defaultValue={row.sortOrder} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Active</span>
          <select name="isActive" defaultValue={row.isActive ? "true" : "false"} className={fieldClass}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Config JSON</span>
          <textarea name="configJson" rows={3} defaultValue={cfg} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Applies to JSON</span>
          <textarea name="appliesToJson" rows={3} defaultValue={app} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Source trace note</span>
          <input name="sourceTraceNote" defaultValue={row.sourceTraceNote ?? ""} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} defaultValue={row.notes ?? ""} className={fieldClass} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
          Save
        </button>
      </form>
    </div>
  );
}
