import Link from "next/link";
import { OntologyFamily } from "@prisma/client";
import { AdminFormError } from "@/components/admin-form-error";
import { createOntologyType } from "@/app/actions/ontology";
import {
  ONTOLOGY_DEFAULT_RECORD_TYPE,
  ONTOLOGY_DEFAULT_VISIBILITY,
  ONTOLOGY_FAMILY_ORDER,
} from "@/lib/ontology-constants";
import { RECORD_TYPE_ORDER, VISIBILITY_ORDER } from "@/lib/constitutional-rule-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewOntologyTypePage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin/ontology" className="text-sm text-amber-900 hover:underline">
        ← Ontology types
      </Link>
      <PageHeader title="New ontology type" description="Add a governed object class (stable key)." />
      <AdminFormError error={sp.error} />

      <form action={createOntologyType} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className={labelClass}>
          <span className={labelSpanClass}>Key</span>
          <input name="key" required className={fieldClass} placeholder="custom_kind" />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Name</span>
          <input name="name" required className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" required rows={4} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Family</span>
          <select name="family" required defaultValue={OntologyFamily.ENTITY} className={fieldClass}>
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
            <select name="recordType" required defaultValue={ONTOLOGY_DEFAULT_RECORD_TYPE} className={fieldClass}>
              {RECORD_TYPE_ORDER.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Visibility</span>
            <select name="visibility" required defaultValue={ONTOLOGY_DEFAULT_VISIBILITY} className={fieldClass}>
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
          <select name="isActive" className={fieldClass} defaultValue="true">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Applies to JSON (optional object)</span>
          <textarea name="appliesToJson" rows={3} className={fieldClass} placeholder='{"models":["Person"]}' />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Source trace note</span>
          <input name="sourceTraceNote" className={fieldClass} />
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
