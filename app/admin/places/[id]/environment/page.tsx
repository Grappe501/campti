import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addSettingStateAction,
  deleteSettingStateAction,
  upsertSettingProfileAction,
} from "@/app/actions/world-model";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { getSettingEnvironmentBundle } from "@/lib/data-access";
import { describePlaceEnvironmentRichly } from "@/lib/descriptive-synthesis";
import { SyntheticRead } from "@/components/synthetic-read";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const sf = [
  ["physicalDescription", "Physical description"],
  ["environmentType", "Environment type"],
  ["climateDescription", "Climate"],
  ["typicalWeather", "Typical weather"],
  ["sounds", "Sounds"],
  ["smells", "Smells"],
  ["textures", "Textures"],
  ["lightingConditions", "Lighting"],
  ["dominantActivities", "Dominant activities"],
  ["socialRules", "Social rules"],
  ["classDynamics", "Class dynamics"],
  ["racialDynamics", "Racial dynamics"],
  ["religiousPresence", "Religious presence"],
  ["economicContext", "Economic context"],
  ["materialsPresent", "Materials present"],
  ["notes", "Notes"],
] as const;

export default async function PlaceEnvironmentPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const place = await getSettingEnvironmentBundle(id);
  if (!place) notFound();

  const profile = place.settingProfile;
  const placeSynthesis = await describePlaceEnvironmentRichly(id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/places/${id}`} className="text-sm text-amber-900 hover:underline">
          ← {place.name}
        </Link>
        <PageHeader
          title={`Environment · ${place.name}`}
          description="Setting profile and time-based states. Link fragments with type setting_profile and roles such as informs_setting."
        />
        {profile ? (
          <p className="mt-2 text-sm text-stone-600">
            Setting profile ID: <code className="text-xs break-all">{profile.id}</code>
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-600">Save the profile once to create an ID for fragment links.</p>
        )}
      </div>

      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Saved.
        </p>
      ) : null}

      <section className="rounded-xl border border-violet-100 bg-violet-50/20 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Environmental synthesis</h2>
        <p className="mt-1 text-sm text-stone-600">Integrated read — not a replacement for the fields below.</p>
        <div className="mt-4 max-h-96 overflow-y-auto">
          <SyntheticRead title="Lived place">{placeSynthesis}</SyntheticRead>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Setting profile</h2>
        <form action={upsertSettingProfileAction} className="mt-4 space-y-4">
          <input type="hidden" name="placeId" value={place.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            {sf.map(([name, label]) => (
              <label
                key={name}
                className={
                  labelClass +
                  (name === "notes" || name === "physicalDescription" ? " sm:col-span-2" : "")
                }
              >
                <span className={labelSpanClass}>{label}</span>
                <textarea
                  name={name}
                  rows={name === "physicalDescription" || name === "notes" ? 4 : 2}
                  defaultValue={profile?.[name] ?? ""}
                  className={fieldClass}
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
          >
            Save setting profile
          </button>
        </form>
      </section>

      <DetailSection title="Setting states (time / season)">
        <ul className="space-y-3">
          {place.settingStates.length === 0 ? (
            <li className="text-sm text-stone-600">No states yet.</li>
          ) : (
            place.settingStates.map((s) => (
              <li key={s.id} className="rounded-md border border-stone-100 p-3 text-sm text-stone-800">
                <p className="font-medium">
                  {s.timePeriod ?? "—"} · {s.season ?? "—"} · {s.weather ?? "—"}
                </p>
                {s.notableConditions ? <p className="mt-1 text-stone-700">{s.notableConditions}</p> : null}
                {s.notes ? <p className="mt-1 text-xs text-stone-600">{s.notes}</p> : null}
                <form action={deleteSettingStateAction} className="mt-2">
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="placeId" value={place.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
        <form action={addSettingStateAction} className="mt-4 space-y-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="placeId" value={place.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Time period</span>
              <input name="timePeriod" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Season</span>
              <input name="season" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Weather</span>
              <input name="weather" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Population type</span>
              <input name="populationType" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Activity level</span>
              <input name="activityLevel" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notable conditions</span>
            <textarea name="notableConditions" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add state
          </button>
        </form>
      </DetailSection>

      <section className="rounded-xl border border-dashed border-violet-200/80 bg-violet-50/30 p-5 text-sm text-stone-700">
        <h2 className="text-sm font-medium text-stone-900">Character-type lens (hook)</h2>
        <p className="mt-2 text-stone-600">
          The same environment lands differently per Enneagram pattern: gut types may read threat in bodies and rank; heart
          types in image and belonging; head types in information and exit routes. Use the POV mind page to assign a type —
          Campti will derive pressure, salience, and blind spots without replacing your judgment.
        </p>
      </section>
    </div>
  );
}
