import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteWorldGovernanceProfile, updateWorldGovernanceProfile } from "@/app/actions/pressure-order";
import { PageHeader } from "@/components/page-header";
import { getWorldGovernanceProfileByIdForAdmin } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { JusticeMode, RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> };

export default async function GovernanceDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const row = await getWorldGovernanceProfileByIdForAdmin(id);
  if (!row) notFound();

  const justiceModes = Object.values(JusticeMode);
  const recordTypes = Object.values(RecordType);
  const vis = Object.values(VisibilityStatus);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={row.label} description={`World: ${row.worldState.eraId}`} />
      <Link href="/admin/pressure/governance" className="text-sm text-amber-900 hover:underline">
        ← Governance list
      </Link>
      <p className="text-xs text-stone-500">
        <Link href={`/admin/world-states/${row.worldStateId}/pressure`} className="text-amber-900 hover:underline">
          World state pressure page →
        </Link>
      </p>
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      {sp.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">Save failed.</p>
      ) : null}
      <form action={updateWorldGovernanceProfile} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={row.id} />
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" className={fieldClass} required defaultValue={row.label} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["controlIntensity", "Control intensity", row.controlIntensity],
              ["punishmentSeverity", "Punishment severity", row.punishmentSeverity],
              ["enforcementVisibility", "Enforcement visibility", row.enforcementVisibility],
              ["justiceFairness", "Justice fairness", row.justiceFairness],
              ["conformityPressure", "Conformity pressure", row.conformityPressure],
            ] as const
          ).map(([name, label, val]) => (
            <label key={name} className={labelClass}>
              <span className={labelSpanClass}>{label} (0–100)</span>
              <input name={name} type="number" min={0} max={100} className={fieldClass} defaultValue={val} />
            </label>
          ))}
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Justice mode</span>
          <select name="justiceMode" className={fieldClass} defaultValue={row.justiceMode}>
            {justiceModes.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Authority profile (JSON)</span>
          <textarea
            name="authorityProfileJson"
            rows={4}
            className={fieldClass}
            defaultValue={profileJsonFieldToFormText(row.authorityProfile)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={row.recordType ?? ""}>
              <option value="">—</option>
              {recordTypes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Visibility</span>
            <select name="visibility" className={fieldClass} defaultValue={row.visibility ?? ""}>
              <option value="">—</option>
              {vis.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Certainty</span>
            <input name="certainty" className={fieldClass} defaultValue={row.certainty ?? ""} />
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} className={fieldClass} defaultValue={row.notes ?? ""} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
          Save
        </button>
      </form>

      <form action={deleteWorldGovernanceProfile} className="rounded-lg border border-rose-100 bg-rose-50/40 p-4 text-sm">
        <input type="hidden" name="id" value={row.id} />
        <button type="submit" className="text-rose-800 hover:underline">
          Delete governance profile
        </button>
      </form>
    </div>
  );
}
