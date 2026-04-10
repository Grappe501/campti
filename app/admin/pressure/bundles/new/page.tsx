import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createWorldPressureBundle } from "@/app/actions/pressure-order";
import { getWorldStateReferences } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ worldStateId?: string; error?: string }> };

export default async function NewBundlePage({ searchParams }: Props) {
  const sp = await searchParams;
  const worlds = await getWorldStateReferences();
  const recordTypes = Object.values(RecordType);
  const vis = Object.values(VisibilityStatus);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="New world pressure bundle" description="One bundle per world state (unique)." />
      <Link href="/admin/pressure/bundles" className="text-sm text-amber-900 hover:underline">
        ← Bundles
      </Link>
      {sp.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">Could not save.</p>
      ) : null}
      <form action={createWorldPressureBundle} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className={labelClass}>
          <span className={labelSpanClass}>World state</span>
          <select name="worldStateId" className={fieldClass} required defaultValue={sp.worldStateId ?? ""}>
            <option value="">— select —</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.eraId}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["governanceWeight", "Governance weight"],
              ["economicWeight", "Economic weight"],
              ["demographicWeight", "Demographic weight"],
              ["familyWeight", "Family weight"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className={labelClass}>
              <span className={labelSpanClass}>{label} (0–100)</span>
              <input name={name} type="number" min={0} max={100} className={fieldClass} />
            </label>
          ))}
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Summary (JSON)</span>
          <textarea name="summaryJson" rows={4} className={fieldClass} placeholder='{"notes":[]}' />
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
