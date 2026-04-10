import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createWorldEducationNormProfile } from "@/app/actions/continuity-order";
import { getWorldStateReferences } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function NewWorldEducationNormPage() {
  const worlds = await getWorldStateReferences();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/continuity/education" className="text-sm text-amber-900 hover:underline">
        ← Education norms
      </Link>
      <PageHeader title="New world education norm" description="Attach training norms to a world state (unique per era)." />
      {worlds.length === 0 ? (
        <p className="text-sm text-stone-600">No world states.</p>
      ) : (
        <form action={createWorldEducationNormProfile} className="space-y-3 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <label className={labelClass}>
            <span className={labelSpanClass}>World state</span>
            <select name="worldStateId" className={fieldClass} required>
              {worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.eraId} — {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Label</span>
            <input name="label" className={fieldClass} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Elite knowledge access</span>
              <input name="eliteKnowledgeAccess" type="number" min={0} max={100} className={fieldClass} defaultValue={50} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Common knowledge access</span>
              <input name="commonKnowledgeAccess" type="number" min={0} max={100} className={fieldClass} defaultValue={50} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={RecordType.HYBRID}>
                {(Object.values(RecordType) as RecordType[]).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={VisibilityStatus.REVIEW}>
                {(Object.values(VisibilityStatus) as VisibilityStatus[]).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm text-amber-50">
            Create
          </button>
        </form>
      )}
    </div>
  );
}
