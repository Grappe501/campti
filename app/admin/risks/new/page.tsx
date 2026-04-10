import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createRiskRegime } from "@/app/actions/environment";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { EnvironmentRiskCategory, RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const cats = Object.values(EnvironmentRiskCategory);
const recordTypeOptions = Object.values(RecordType);
const visibilityOptions = Object.values(VisibilityStatus);

export default function NewRiskRegimePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="New risk regime" description="Keyed reusable risk for layering on place / node state." />
      <Link href="/admin/risks" className="text-sm text-amber-900 hover:underline">
        ← Risk regimes
      </Link>
      <form action={createRiskRegime} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className={labelClass}>
          <span className={labelSpanClass}>Key (unique)</span>
          <input name="key" className={fieldClass} required />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" className={fieldClass} required />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" rows={3} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Category</span>
          <select name="category" className={fieldClass} required>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Base severity (0–100)</span>
          <input name="baseSeverity" type="number" min={0} max={100} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue="">
              <option value="">—</option>
              {recordTypeOptions.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Visibility</span>
            <select name="visibility" className={fieldClass} defaultValue="">
              <option value="">—</option>
              {visibilityOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Certainty</span>
            <input name="certainty" className={fieldClass} />
          </label>
        </div>
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
