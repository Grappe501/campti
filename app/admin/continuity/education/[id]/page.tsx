import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteWorldEducationNormProfile, updateWorldEducationNormProfile } from "@/app/actions/continuity-order";
import { PageHeader } from "@/components/page-header";
import { getWorldEducationNormProfileByIdForAdmin } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ContinuityEducationDetailPage({ params }: Props) {
  const { id } = await params;
  const norm = await getWorldEducationNormProfileByIdForAdmin(id);
  if (!norm) notFound();

  const jsonFields = (
    [
      ["childTrainingModelJson", "Child training model", norm.childTrainingModel],
      ["youthInitiationModelJson", "Youth initiation model", norm.youthInitiationModel],
      ["elderTransmissionModeJson", "Elder transmission mode", norm.elderTransmissionMode],
      ["literacyAccessPatternJson", "Literacy access pattern", norm.literacyAccessPattern],
      ["specialistTrainingPathsJson", "Specialist training paths", norm.specialistTrainingPaths],
      ["genderedTrainingDifferencesJson", "Gendered training differences", norm.genderedTrainingDifferences],
    ] as const
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/continuity/education" className="text-amber-900 hover:underline">
          ← Education norms
        </Link>
        <Link href={`/admin/world-states/${norm.worldStateId}/education`} className="text-amber-900 hover:underline">
          World state page →
        </Link>
      </div>
      <PageHeader title={norm.label} description={`${norm.worldState.eraId} · world education norm profile`} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateWorldEducationNormProfile} className="space-y-3">
          <input type="hidden" name="id" value={norm.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Label</span>
            <input name="label" className={fieldClass} defaultValue={norm.label} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Elite knowledge access</span>
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
              <span className={labelSpanClass}>Common knowledge access</span>
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
            Save
          </button>
        </form>
        <form action={deleteWorldEducationNormProfile} className="mt-6 border-t border-stone-100 pt-4">
          <input type="hidden" name="id" value={norm.id} />
          <button type="submit" className="text-sm text-rose-800 hover:underline">
            Delete
          </button>
        </form>
      </section>
    </div>
  );
}
