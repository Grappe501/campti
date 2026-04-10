import Link from "next/link";
import { AdminFormError } from "@/components/admin-form-error";
import { createSceneReadinessProfile } from "@/app/actions/ontology";
import { RECORD_TYPE_ORDER, VISIBILITY_ORDER } from "@/lib/constitutional-rule-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewReadinessProfilePage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin/readiness" className="text-sm text-amber-900 hover:underline">
        ← Readiness
      </Link>
      <PageHeader title="New scene readiness profile" description="Whether prose drafting is allowed at this gate." />
      <AdminFormError error={sp.error} />

      <form action={createSceneReadinessProfile} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className={labelClass}>
          <span className={labelSpanClass}>Key</span>
          <input name="key" required className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" required className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" rows={3} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Draftable</span>
          <select name="isDraftable" defaultValue="false" className={fieldClass}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
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
