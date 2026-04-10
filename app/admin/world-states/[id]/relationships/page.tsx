import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createWorldRelationshipNormProfile,
  deleteWorldRelationshipNormProfile,
  updateWorldRelationshipNormProfile,
} from "@/app/actions/relationship-order";
import { PageHeader } from "@/components/page-header";
import { getWorldRelationshipNormProfileForAdmin, getWorldStateById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function WorldStateRelationshipsPage({ params }: Props) {
  const { id } = await params;
  const ws = await getWorldStateById(id);
  if (!ws) notFound();

  const norm = await getWorldRelationshipNormProfileForAdmin(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link href="/admin/world-states" className="text-amber-900 hover:underline">
          ← World states
        </Link>
        <Link href={`/admin/world-states/${ws.id}/pressure`} className="text-amber-900 hover:underline">
          Pressure →
        </Link>
        <Link href={`/admin/world-states/${ws.id}/knowledge`} className="text-amber-900 hover:underline">
          Knowledge →
        </Link>
      </div>
      <PageHeader
        title={`Relationship norms · ${ws.eraId}`}
        description="Stage 6 — era-level marriage, desire, taboo, and relational visibility (not simulation)."
      />

      {norm ? (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900">World relationship norm profile</h2>
          <form action={updateWorldRelationshipNormProfile} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={norm.id} />
            <label className={labelClass}>
              <span className={labelSpanClass}>Label</span>
              <input name="label" className={fieldClass} defaultValue={norm.label} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelSpanClass}>Relational visibility (0–100)</span>
                <input name="relationalVisibility" type="number" min={0} max={100} className={fieldClass} defaultValue={norm.relationalVisibility} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Punishment for violation (0–100)</span>
                <input name="punishmentForViolation" type="number" min={0} max={100} className={fieldClass} defaultValue={norm.punishmentForViolation} />
              </label>
            </div>
            {(
              [
                ["marriageRulesJson", "Marriage rules", norm.marriageRules],
                ["sexualNormsJson", "Sexual norms", norm.sexualNorms],
                ["desireExpressionRulesJson", "Desire expression rules", norm.desireExpressionRules],
                ["tabooSystemJson", "Taboo system", norm.tabooSystem],
                ["emotionalExpressionRulesJson", "Emotional expression rules", norm.emotionalExpressionRules],
                ["genderDynamicsJson", "Gender dynamics", norm.genderDynamics],
              ] as const
            ).map(([name, lab, val]) => (
              <label key={name} className={labelClass}>
                <span className={labelSpanClass}>{lab} (JSON)</span>
                <textarea name={name} rows={3} className={fieldClass} defaultValue={profileJsonFieldToFormText(val)} />
              </label>
            ))}
            <label className={labelClass}>
              <span className={labelSpanClass}>Notes</span>
              <textarea name="notes" rows={2} className={fieldClass} defaultValue={norm.notes ?? ""} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelSpanClass}>Record type</span>
                <select name="recordType" className={fieldClass} defaultValue={norm.recordType}>
                  {Object.values(RecordType).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Visibility</span>
                <select name="visibility" className={fieldClass} defaultValue={norm.visibility}>
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
              <input name="certainty" className={fieldClass} defaultValue={norm.certainty ?? ""} />
            </label>
            <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm text-amber-50">
              Save norms
            </button>
          </form>
          <form action={deleteWorldRelationshipNormProfile} className="mt-4 border-t border-stone-100 pt-4">
            <input type="hidden" name="id" value={norm.id} />
            <button type="submit" className="text-sm text-rose-800 hover:underline">
              Delete norm profile
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900">World relationship norm profile</h2>
          <p className="mt-2 text-sm text-stone-600">None yet. Create one for this world state.</p>
          <form action={createWorldRelationshipNormProfile} className="mt-4 space-y-3">
            <input type="hidden" name="worldStateId" value={ws.id} />
            <label className={labelClass}>
              <span className={labelSpanClass}>Label</span>
              <input name="label" className={fieldClass} required placeholder="Short label" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelSpanClass}>Relational visibility</span>
                <input name="relationalVisibility" type="number" min={0} max={100} className={fieldClass} defaultValue={50} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Punishment for violation</span>
                <input name="punishmentForViolation" type="number" min={0} max={100} className={fieldClass} defaultValue={50} />
              </label>
            </div>
            <label className={labelClass}>
              <span className={labelSpanClass}>Taboo system (JSON)</span>
              <textarea name="tabooSystemJson" rows={3} className={fieldClass} />
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
            <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm text-amber-50">
              Create norm profile
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
