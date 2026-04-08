import Link from "next/link";
import { createMetaSceneAction } from "@/app/actions/world-model";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { getMetaScenesForAdmin, getPlacesPeopleForMetaSceneForms, getScenesForMetaScenePicker } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string; saved?: string }> };

export default async function MetaScenesListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rows = await getMetaScenesForAdmin();
  const { places, people } = await getPlacesPeopleForMetaSceneForms();
  const scenes = await getScenesForMetaScenePicker();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        title="Meta scenes"
        description="World-layer scene records: POV, place, constraints, and symbolic intent — optionally linked to a draft scene."
      />

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Create meta scene</h2>
        <form action={createMetaSceneAction} className="mt-4 space-y-4">
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" className={fieldClass} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Place</span>
              <select name="placeId" className={fieldClass} required>
                <option value="">Select…</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>POV person</span>
              <select name="povPersonId" className={fieldClass} required>
                <option value="">Select…</option>
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
            <select name="sceneId" className={fieldClass}>
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
              <input name="timePeriod" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Date estimate</span>
              <input name="dateEstimate" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Participants (one per line)</span>
            <textarea name="participants" rows={3} className={fieldClass} placeholder="Name or role per line" />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Environment description</span>
            <textarea name="environmentDescription" rows={3} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Sensory field</span>
            <textarea name="sensoryField" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Historical constraints</span>
            <textarea name="historicalConstraints" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Social constraints</span>
            <textarea name="socialConstraints" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Character states summary</span>
            <textarea name="characterStatesSummary" rows={2} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional voltage</span>
              <input name="emotionalVoltage" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Source support level</span>
              <input name="sourceSupportLevel" className={fieldClass} placeholder="strong, moderate…" />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Central conflict</span>
            <textarea name="centralConflict" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Symbolic elements</span>
            <textarea name="symbolicElements" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Narrative purpose</span>
            <textarea name="narrativePurpose" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Continuity dependencies</span>
            <textarea name="continuityDependencies" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
          >
            Create
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">All meta scenes</h2>
        <ul className="mt-4 space-y-2">
          {rows.length === 0 ? (
            <li className="text-sm text-stone-600">None yet.</li>
          ) : (
            rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <Link href={`/admin/meta-scenes/${r.id}`} className="font-medium text-amber-900 hover:underline">
                    {r.title}
                  </Link>
                  <p className="text-xs text-stone-600">
                    {r.place.name} · POV {r.povPerson.name}
                    {r.scene ? ` · linked scene` : ""}
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <Link href={`/admin/meta-scenes/${r.id}/compose`} className="text-stone-600 hover:text-amber-900 hover:underline">
                    Compose
                  </Link>
                  <Link href={`/admin/meta-scenes/${r.id}/view`} className="text-stone-600 hover:text-amber-900 hover:underline">
                    World view
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
