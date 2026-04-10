import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createWorldGovernanceProfile } from "@/app/actions/pressure-order";
import { getWorldStateReferences } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { JusticeMode, RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ worldStateId?: string; error?: string }> };

export default async function NewGovernancePage({ searchParams }: Props) {
  const sp = await searchParams;
  const worlds = await getWorldStateReferences();
  const justiceModes = Object.values(JusticeMode);
  const recordTypes = Object.values(RecordType);
  const vis = Object.values(VisibilityStatus);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="New governance profile" description="One profile per world state (unique)." />
      <Link href="/admin/pressure/governance" className="text-sm text-amber-900 hover:underline">
        ← Governance list
      </Link>
      {sp.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">Could not save.</p>
      ) : null}
      <form action={createWorldGovernanceProfile} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className={labelClass}>
          <span className={labelSpanClass}>World state</span>
          <select name="worldStateId" className={fieldClass} required defaultValue={sp.worldStateId ?? ""}>
            <option value="">— select —</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.eraId} — {w.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" className={fieldClass} required placeholder="Mature Caddo / Jim Crow / …" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["controlIntensity", "Control intensity"],
              ["punishmentSeverity", "Punishment severity"],
              ["enforcementVisibility", "Enforcement visibility"],
              ["justiceFairness", "Justice fairness"],
              ["conformityPressure", "Conformity pressure"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className={labelClass}>
              <span className={labelSpanClass}>{label} (0–100)</span>
              <input name={name} type="number" min={0} max={100} className={fieldClass} />
            </label>
          ))}
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Justice mode</span>
          <select name="justiceMode" className={fieldClass} defaultValue="">
            <option value="">— default —</option>
            {justiceModes.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Authority profile (JSON)</span>
          <textarea name="authorityProfileJson" rows={3} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue="">
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
            <select name="visibility" className={fieldClass} defaultValue="">
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
