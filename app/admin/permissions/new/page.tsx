import Link from "next/link";
import { AdminFormError } from "@/components/admin-form-error";
import { createNarrativePermissionProfile } from "@/app/actions/ontology";
import { RECORD_TYPE_ORDER, VISIBILITY_ORDER } from "@/lib/constitutional-rule-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewPermissionProfilePage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin/permissions" className="text-sm text-amber-900 hover:underline">
        ← Permissions
      </Link>
      <PageHeader title="New narrative permission profile" description="Defines allowed narrative uses for governed content." />
      <AdminFormError error={sp.error} />

      <form
        action={createNarrativePermissionProfile}
        className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <label className={labelClass}>
          <span className={labelSpanClass}>Key</span>
          <input name="key" required className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Name</span>
          <input name="name" required className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" rows={3} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["allowsDirectNarrativeUse", "Direct narrative use"],
              ["allowsSceneSupport", "Scene support"],
              ["allowsAtmosphereSupport", "Atmosphere support"],
              ["allowsCanonicalReveal", "Canonical reveal"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={name} value="true" className="rounded border-stone-300" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue="">
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
            <select name="visibility" className={fieldClass} defaultValue="">
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
          <select name="isActive" defaultValue="true" className={fieldClass}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} className={fieldClass} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
          Create
        </button>
      </form>
    </div>
  );
}
