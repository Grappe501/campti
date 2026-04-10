import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFormError } from "@/components/admin-form-error";
import { updateNarrativePermissionProfile } from "@/app/actions/ontology";
import { RECORD_TYPE_ORDER, VISIBILITY_ORDER } from "@/lib/constitutional-rule-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PageHeader } from "@/components/page-header";
import { getNarrativePermissionProfileByIdForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

function BoolSelect({ name, defaultValue }: { name: string; defaultValue: boolean }) {
  return (
    <select name={name} defaultValue={defaultValue ? "true" : "false"} className={fieldClass}>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

export default async function EditPermissionProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const row = await getNarrativePermissionProfileByIdForAdmin(id);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin/permissions" className="text-sm text-amber-900 hover:underline">
        ← Permissions
      </Link>
      <PageHeader title={row.name} description={`Key: ${row.key}`} />
      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}

      <form
        action={updateNarrativePermissionProfile}
        className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="key" value={row.key} />
        <p className="text-sm text-stone-600">
          Key: <span className="font-mono">{row.key}</span>
        </p>
        <label className={labelClass}>
          <span className={labelSpanClass}>Name</span>
          <input name="name" required defaultValue={row.name} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" rows={3} defaultValue={row.description ?? ""} className={fieldClass} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Direct narrative use</span>
            <BoolSelect name="allowsDirectNarrativeUse" defaultValue={row.allowsDirectNarrativeUse} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Scene support</span>
            <BoolSelect name="allowsSceneSupport" defaultValue={row.allowsSceneSupport} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Atmosphere support</span>
            <BoolSelect name="allowsAtmosphereSupport" defaultValue={row.allowsAtmosphereSupport} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Canonical reveal</span>
            <BoolSelect name="allowsCanonicalReveal" defaultValue={row.allowsCanonicalReveal} />
          </label>
        </div>
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
          <BoolSelect name="isActive" defaultValue={row.isActive} />
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
