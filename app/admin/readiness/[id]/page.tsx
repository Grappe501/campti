import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFormError } from "@/components/admin-form-error";
import { updateSceneReadinessProfile } from "@/app/actions/ontology";
import { RECORD_TYPE_ORDER, VISIBILITY_ORDER } from "@/lib/constitutional-rule-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PageHeader } from "@/components/page-header";
import { getSceneReadinessProfileByIdForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditReadinessProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const row = await getSceneReadinessProfileByIdForAdmin(id);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin/readiness" className="text-sm text-amber-900 hover:underline">
        ← Readiness
      </Link>
      <PageHeader title={row.label} description={`Key: ${row.key}`} />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}

      <form action={updateSceneReadinessProfile} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
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
          <span className={labelSpanClass}>Draftable</span>
          <select name="isDraftable" defaultValue={row.isDraftable ? "true" : "false"} className={fieldClass}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={row.recordType}>
              <option value="">(default)</option>
              {RECORD_TYPE_ORDER.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Visibility</span>
            <select name="visibility" className={fieldClass} defaultValue={row.visibility}>
              <option value="">(default)</option>
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
          <select name="isActive" defaultValue={row.isActive ? "true" : "false"} className={fieldClass}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
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
