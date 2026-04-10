import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createWorldEducationNormProfile,
  deleteWorldEducationNormProfile,
  updateWorldEducationNormProfile,
} from "@/app/actions/continuity-order";
import { PageHeader } from "@/components/page-header";
import { getWorldEducationNormProfileForAdmin, getWorldStateById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function WorldStateEducationPage({ params }: Props) {
  const { id } = await params;
  const ws = await getWorldStateById(id);
  if (!ws) notFound();

  const norm = await getWorldEducationNormProfileForAdmin(id);

  const jsonFields = (
    [
      ["childTrainingModelJson", "Child training model", norm?.childTrainingModel],
      ["youthInitiationModelJson", "Youth initiation model", norm?.youthInitiationModel],
      ["elderTransmissionModeJson", "Elder transmission mode", norm?.elderTransmissionMode],
      ["literacyAccessPatternJson", "Literacy access pattern", norm?.literacyAccessPattern],
      ["specialistTrainingPathsJson", "Specialist training paths", norm?.specialistTrainingPaths],
      ["genderedTrainingDifferencesJson", "Gendered training differences", norm?.genderedTrainingDifferences],
    ] as const
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link href="/admin/world-states" className="text-amber-900 hover:underline">
          ← World states
        </Link>
        <Link href={`/admin/world-states/${ws.id}/knowledge`} className="text-amber-900 hover:underline">
          Knowledge →
        </Link>
        <Link href={`/admin/world-states/${ws.id}/relationships`} className="text-amber-900 hover:underline">
          Relationships →
        </Link>
        <Link href={`/admin/world-states/${ws.id}/health`} className="text-amber-900 hover:underline">
          Health →
        </Link>
        {norm ? (
          <Link href={`/admin/continuity/education/${norm.id}`} className="text-amber-900 hover:underline">
            Open in continuity index →
          </Link>
        ) : null}
      </div>
      <PageHeader
        title={`Education norms · ${ws.eraId}`}
        description="Stage 6.5 — how training and knowledge access are structured in this era (not simulation)."
      />

      {norm ? (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900">World education norm profile</h2>
          <form action={updateWorldEducationNormProfile} className="mt-4 space-y-3">
            <input type="hidden" name="id" value={norm.id} />
            <label className={labelClass}>
              <span className={labelSpanClass}>Label</span>
              <input name="label" className={fieldClass} defaultValue={norm.label} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelSpanClass}>Elite knowledge access (0–100)</span>
                <input
                  name="eliteKnowledgeAccess"
                  type="number"
                  min={0}
                  max={100}
                  className={fieldClass}
                  defaultValue={norm.eliteKnowledgeAccess}
                />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Common knowledge access (0–100)</span>
                <input
                  name="commonKnowledgeAccess"
                  type="number"
                  min={0}
                  max={100}
                  className={fieldClass}
                  defaultValue={norm.commonKnowledgeAccess}
                />
              </label>
            </div>
            {jsonFields.map(([name, lab, val]) => (
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
                  {(Object.values(RecordType) as RecordType[]).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Visibility</span>
                <select name="visibility" className={fieldClass} defaultValue={norm.visibility}>
                  {(Object.values(VisibilityStatus) as VisibilityStatus[]).map((v) => (
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
              Save education norms
            </button>
          </form>
          <form action={deleteWorldEducationNormProfile} className="mt-4 border-t border-stone-100 pt-4">
            <input type="hidden" name="id" value={norm.id} />
            <button type="submit" className="text-sm text-rose-800 hover:underline">
              Delete education norm profile
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900">World education norm profile</h2>
          <p className="mt-2 text-sm text-stone-600">None yet. Create one for this world state.</p>
          <form action={createWorldEducationNormProfile} className="mt-4 space-y-3">
            <input type="hidden" name="worldStateId" value={ws.id} />
            <label className={labelClass}>
              <span className={labelSpanClass}>Label</span>
              <input name="label" className={fieldClass} required placeholder="Short label" />
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
            <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm text-amber-50">
              Create
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
