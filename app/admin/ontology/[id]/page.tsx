import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFormError } from "@/components/admin-form-error";
import { updateOntologyType } from "@/app/actions/ontology";
import { RECORD_TYPE_ORDER, VISIBILITY_ORDER } from "@/lib/constitutional-rule-constants";
import { ONTOLOGY_FAMILY_ORDER } from "@/lib/ontology-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PageHeader } from "@/components/page-header";
import { getOntologyTypeByIdForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditOntologyTypePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const row = await getOntologyTypeByIdForAdmin(id);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin/ontology" className="text-sm text-amber-900 hover:underline">
        ← Ontology types
      </Link>
      <PageHeader title={row.name} description={`Key: ${row.key}`} />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}

      <form action={updateOntologyType} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="key" value={row.key} />
        <p className="text-sm text-stone-600">
          Key: <span className="font-mono">{row.key}</span> (immutable)
        </p>
        <label className={labelClass}>
          <span className={labelSpanClass}>Name</span>
          <input name="name" required defaultValue={row.name} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" required rows={4} defaultValue={row.description} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Family</span>
          <select name="family" required defaultValue={row.family} className={fieldClass}>
            {ONTOLOGY_FAMILY_ORDER.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" required defaultValue={row.recordType} className={fieldClass}>
              {RECORD_TYPE_ORDER.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Visibility</span>
            <select name="visibility" required defaultValue={row.visibility} className={fieldClass}>
              {VISIBILITY_ORDER.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Active</span>
          <select name="isActive" className={fieldClass} defaultValue={row.isActive ? "true" : "false"}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Applies to JSON</span>
          <textarea
            name="appliesToJson"
            rows={3}
            defaultValue={
              row.appliesTo && typeof row.appliesTo === "object" ? JSON.stringify(row.appliesTo, null, 2) : ""
            }
            className={fieldClass}
          />
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
