import Link from "next/link";
import { notFound } from "next/navigation";
import { updateMetaSceneAction } from "@/app/actions/world-model";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { getMetaSceneByIdForAdmin, getPlacesPeopleForMetaSceneForms, getScenesForMetaScenePicker } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function MetaSceneEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const meta = await getMetaSceneByIdForAdmin(id);
  if (!meta) notFound();

  const { places, people } = await getPlacesPeopleForMetaSceneForms();
  const scenes = await getScenesForMetaScenePicker();
  const participantsText = meta.participants.length ? meta.participants.join("\n") : "";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/meta-scenes" className="text-sm text-amber-900 hover:underline">
          ← Meta scenes
        </Link>
        <PageHeader title={meta.title} description="Edit world-layer fields. Link fragments with type meta_scene and this row’s ID." />
        <p className="mt-2 text-sm text-stone-600">
          Meta scene ID: <code className="text-xs break-all">{meta.id}</code>
        </p>
      </div>

      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Saved.
        </p>
      ) : null}

      <p className="flex flex-wrap gap-4 text-sm">
        <Link href={`/admin/meta-scenes/${id}/compose`} className="text-amber-900 hover:underline">
          Meta scene composer →
        </Link>
        <Link href={`/admin/meta-scenes/${id}/view`} className="text-amber-900 hover:underline">
          Readable world view →
        </Link>
        <Link href={`/admin/meta-scenes/${id}/perception`} className="text-amber-900 hover:underline">
          Perception debug →
        </Link>
        <Link href={`/admin/meta-scenes/${id}/cinematic`} className="text-amber-900 hover:underline">
          Cinematic passes →
        </Link>
        <Link href={`/admin/meta-scenes/${id}/experience-tuning`} className="text-amber-900 hover:underline">
          Experience tuning →
        </Link>
      </p>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateMetaSceneAction} className="space-y-4">
          <input type="hidden" name="id" value={meta.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" className={fieldClass} defaultValue={meta.title} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Place</span>
              <select name="placeId" className={fieldClass} defaultValue={meta.placeId} required>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>POV person</span>
              <select name="povPersonId" className={fieldClass} defaultValue={meta.povPersonId} required>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Link to scene (optional)</span>
            <select name="sceneId" className={fieldClass} defaultValue={meta.sceneId ?? ""}>
              <option value="">—</option>
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.chapter?.title ? `${s.chapter.title}: ` : "") + s.description.slice(0, 72)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Time period</span>
              <input name="timePeriod" className={fieldClass} defaultValue={meta.timePeriod ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Date estimate</span>
              <input name="dateEstimate" className={fieldClass} defaultValue={meta.dateEstimate ?? ""} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Participants (one per line)</span>
            <textarea name="participants" rows={3} className={fieldClass} defaultValue={participantsText} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Environment description</span>
            <textarea
              name="environmentDescription"
              rows={3}
              className={fieldClass}
              defaultValue={meta.environmentDescription ?? ""}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Sensory field</span>
            <textarea name="sensoryField" rows={2} className={fieldClass} defaultValue={meta.sensoryField ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Historical constraints</span>
            <textarea
              name="historicalConstraints"
              rows={2}
              className={fieldClass}
              defaultValue={meta.historicalConstraints ?? ""}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Social constraints</span>
            <textarea
              name="socialConstraints"
              rows={2}
              className={fieldClass}
              defaultValue={meta.socialConstraints ?? ""}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Character states summary</span>
            <textarea
              name="characterStatesSummary"
              rows={2}
              className={fieldClass}
              defaultValue={meta.characterStatesSummary ?? ""}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional voltage</span>
              <input name="emotionalVoltage" className={fieldClass} defaultValue={meta.emotionalVoltage ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Source support level</span>
              <input name="sourceSupportLevel" className={fieldClass} defaultValue={meta.sourceSupportLevel ?? ""} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Central conflict</span>
            <textarea name="centralConflict" rows={2} className={fieldClass} defaultValue={meta.centralConflict ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Symbolic elements</span>
            <textarea name="symbolicElements" rows={2} className={fieldClass} defaultValue={meta.symbolicElements ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Narrative purpose</span>
            <textarea name="narrativePurpose" rows={2} className={fieldClass} defaultValue={meta.narrativePurpose ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Continuity dependencies</span>
            <textarea
              name="continuityDependencies"
              rows={2}
              className={fieldClass}
              defaultValue={meta.continuityDependencies ?? ""}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} defaultValue={meta.notes ?? ""} />
          </label>
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
          >
            Save
          </button>
        </form>
      </section>
    </div>
  );
}
