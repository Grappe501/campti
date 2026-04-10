import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { deleteRiskRegime, updateRiskRegime } from "@/app/actions/environment";
import { getRiskRegimeByIdForAdmin } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { EnvironmentRiskCategory, RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const cats = Object.values(EnvironmentRiskCategory);
const recordTypeOptions = Object.values(RecordType);
const visibilityOptions = Object.values(VisibilityStatus);

export default async function RiskRegimeDetailPage({ params }: Props) {
  const { id } = await params;
  const r = await getRiskRegimeByIdForAdmin(id);
  if (!r) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={r.label} description={`Key: ${r.key}`} />
      <Link href="/admin/risks" className="text-sm text-amber-900 hover:underline">
        ← Risk regimes
      </Link>
      <form action={updateRiskRegime} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={r.id} />
        <label className={labelClass}>
          <span className={labelSpanClass}>Key</span>
          <input name="key" className={fieldClass} defaultValue={r.key} required />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" className={fieldClass} defaultValue={r.label} required />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" rows={3} className={fieldClass} defaultValue={r.description ?? ""} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Category</span>
          <select name="category" className={fieldClass} defaultValue={r.category} required>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Base severity</span>
          <input name="baseSeverity" type="number" min={0} max={100} className={fieldClass} defaultValue={r.baseSeverity} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={r.recordType ?? ""}>
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
            <select name="visibility" className={fieldClass} defaultValue={r.visibility ?? ""}>
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
            <input name="certainty" className={fieldClass} defaultValue={r.certainty ?? ""} />
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} className={fieldClass} defaultValue={r.notes ?? ""} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
          Save
        </button>
      </form>

      <form action={deleteRiskRegime} className="rounded-lg border border-rose-100 bg-rose-50/40 p-4 text-sm">
        <input type="hidden" name="id" value={r.id} />
        <button type="submit" className="text-sm font-medium text-rose-800 hover:underline">
          Delete risk regime
        </button>
      </form>
    </div>
  );
}
