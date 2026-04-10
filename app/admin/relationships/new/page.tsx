import Link from "next/link";
import { createRelationshipProfile } from "@/app/actions/relationship-order";
import { PageHeader } from "@/components/page-header";
import { getPeople, getWorldStateReferences } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PublicStatus, RecordType, RelationshipType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function NewRelationshipProfilePage() {
  const [people, worlds] = await Promise.all([getPeople(), getWorldStateReferences()]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/relationships" className="text-sm text-amber-900 hover:underline">
        ← Relationships
      </Link>
      <PageHeader title="New relationship profile" description="Pair two people in one world state. IDs are normalized (lexicographic order) in storage." />

      <form action={createRelationshipProfile} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Person A</span>
            <select name="personIdOne" required className={fieldClass}>
              <option value="">—</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Person B</span>
            <select name="personIdTwo" required className={fieldClass}>
              <option value="">—</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>World state</span>
          <select name="worldStateId" required className={fieldClass}>
            <option value="">—</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.eraId} — {w.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Relationship type</span>
          <select name="relationshipType" className={fieldClass} defaultValue={RelationshipType.KINSHIP}>
            {(Object.values(RelationshipType) as RelationshipType[]).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Public status</span>
          <select name="publicStatus" className={fieldClass} defaultValue={PublicStatus.IMPLIED}>
            {(Object.values(PublicStatus) as PublicStatus[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Private status</span>
          <input name="privateStatus" className={fieldClass} placeholder="Optional" />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["trustLevel", "Trust"],
              ["fearLevel", "Fear"],
              ["shameLeverage", "Shame leverage"],
              ["obligationWeight", "Obligation"],
              ["betrayalThreshold", "Betrayal threshold"],
              ["rescueThreshold", "Rescue threshold"],
            ] as const
          ).map(([name, lab]) => (
            <label key={name} className={labelClass}>
              <span className={labelSpanClass}>{lab}</span>
              <input name={name} type="number" min={0} max={100} className={fieldClass} defaultValue={50} />
            </label>
          ))}
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Hidden truth (JSON)</span>
          <textarea name="hiddenTruthJson" rows={2} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Power direction (JSON)</span>
          <textarea name="powerDirectionJson" rows={2} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Dependency direction (JSON)</span>
          <textarea name="dependencyDirectionJson" rows={2} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={RecordType.HYBRID}>
              {Object.values(RecordType).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Visibility</span>
            <select name="visibility" className={fieldClass} defaultValue={VisibilityStatus.REVIEW}>
              {Object.values(VisibilityStatus).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Certainty</span>
          <input name="certainty" className={fieldClass} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
          Create
        </button>
      </form>
    </div>
  );
}
