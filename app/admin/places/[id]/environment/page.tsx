import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addSettingStateAction,
  deleteSettingStateAction,
  upsertSettingProfileAction,
} from "@/app/actions/world-model";
import {
  createPlaceEnvironmentProfile,
  createPlaceMemoryProfile,
  createPlaceState,
} from "@/app/actions/environment";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { getPlaceFullEnvironmentBundle, getWorldStateReferences } from "@/lib/data-access";
import { describePlaceEnvironmentRichly } from "@/lib/descriptive-synthesis";
import { SyntheticRead } from "@/components/synthetic-read";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { RecordType, VisibilityStatus } from "@prisma/client";

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

const recordTypeOptions = Object.values(RecordType);
const visibilityOptions = Object.values(VisibilityStatus);

export default async function PlaceEnvironmentPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const bundle = await getPlaceFullEnvironmentBundle(id);
  if (!bundle) notFound();

  const place = bundle.place;
  const profile = place.settingProfile;
  const envProfile = bundle.environmentProfile;
  const worldStates = await getWorldStateReferences();
  const placeSynthesis = await describePlaceEnvironmentRichly(id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/places/${id}`} className="text-sm text-amber-900 hover:underline">
          ← {place.name}
        </Link>
        <PageHeader
          title={`Environment · ${place.name}`}
          description="Prose setting profile (below) plus simulation layers: terrain, era-specific place states, nodes, memory, and corridors — Environment & Node Engine."
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

      <p className="text-sm text-stone-600">
        <Link href="/admin/nodes" className="text-amber-900 hover:underline">
          Environment nodes
        </Link>
        {" · "}
        <Link href="/admin/connections" className="text-amber-900 hover:underline">
          Connections
        </Link>
        {" · "}
        <Link href="/admin/risks" className="text-amber-900 hover:underline">
          Risk regimes
        </Link>
      </p>

      <section className="rounded-xl border border-violet-100 bg-violet-50/20 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Environmental synthesis</h2>
        <p className="mt-1 text-sm text-stone-600">Integrated read — not a replacement for the fields below.</p>
        <div className="mt-4 max-h-96 overflow-y-auto">
          <SyntheticRead title="Lived place">{placeSynthesis}</SyntheticRead>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Setting profile (prose-facing)</h2>
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

      <section className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Simulation environment profile</h2>
        <p className="mt-1 text-sm text-stone-600">
          Persistent terrain / hydrology / risk — distinct from prose setting. Aligns with RegistryValue (ENVIRONMENT) in a later
          pass.
        </p>
        <form action={createPlaceEnvironmentProfile} className="mt-4 space-y-3">
          <input type="hidden" name="placeId" value={place.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Terrain type</span>
              <input name="terrainType" className={fieldClass} defaultValue={envProfile?.terrainType ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Hydrology type</span>
              <input name="hydrologyType" className={fieldClass} defaultValue={envProfile?.hydrologyType ?? ""} />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Fertility profile</span>
              <textarea name="fertilityProfile" rows={2} className={fieldClass} defaultValue={envProfile?.fertilityProfile ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Flood risk (0–100)</span>
              <input
                name="floodRiskLevel"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={envProfile?.floodRiskLevel ?? ""}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Drought risk (0–100)</span>
              <input
                name="droughtRiskLevel"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={envProfile?.droughtRiskLevel ?? ""}
              />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Mobility profile</span>
              <textarea name="mobilityProfile" rows={2} className={fieldClass} defaultValue={envProfile?.mobilityProfile ?? ""} />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Sensory profile (JSON)</span>
              <textarea
                name="sensoryProfileJson"
                rows={2}
                className={fieldClass}
                defaultValue={profileJsonFieldToFormText(envProfile?.sensoryProfile)}
              />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Resource profile (JSON)</span>
              <textarea
                name="resourceProfileJson"
                rows={2}
                className={fieldClass}
                defaultValue={profileJsonFieldToFormText(envProfile?.resourceProfile)}
              />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Sacred profile (JSON)</span>
              <textarea
                name="sacredProfileJson"
                rows={2}
                className={fieldClass}
                defaultValue={profileJsonFieldToFormText(envProfile?.sacredProfile)}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={envProfile?.recordType ?? ""}>
                <option value="">— default</option>
                {recordTypeOptions.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={envProfile?.visibility ?? ""}>
                <option value="">— default</option>
                {visibilityOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Certainty</span>
              <input name="certainty" className={fieldClass} defaultValue={envProfile?.certainty ?? ""} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} defaultValue={envProfile?.notes ?? ""} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save simulation environment profile
          </button>
        </form>
      </section>

      <DetailSection title="Place states (era / world-state slices)">
        <ul className="space-y-3">
          {bundle.placeStates.length === 0 ? (
            <li className="text-sm text-stone-600">No simulation place states yet.</li>
          ) : (
            bundle.placeStates.map((s) => (
              <li key={s.id} className="rounded-md border border-stone-100 p-3 text-sm">
                <p className="font-medium">{s.label}</p>
                <p className="text-xs text-stone-500">
                  world: {s.worldState?.eraId ?? "—"} · risk {s.riskLevel} · strategic {s.strategicValue}
                </p>
              </li>
            ))
          )}
        </ul>
        <form action={createPlaceState} className="mt-4 space-y-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="placeId" value={place.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Label</span>
            <input name="label" className={fieldClass} required placeholder="proto_landing, supply_node, …" />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>World state</span>
            <select name="worldStateId" className={fieldClass} defaultValue="">
              <option value="">— optional</option>
              {worldStates.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.eraId} — {w.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Settlement pattern</span>
              <input name="settlementPattern" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Strategic value (0–100)</span>
              <input name="strategicValue" type="number" min={0} max={100} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Risk level (0–100)</span>
              <input name="riskLevel" type="number" min={0} max={100} className={fieldClass} />
            </label>
          </div>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add place state
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Place memory layers">
        <ul className="space-y-2 text-sm">
          {bundle.memoryProfiles.length === 0 ? (
            <li className="text-stone-600">None yet.</li>
          ) : (
            bundle.memoryProfiles.map((m) => (
              <li key={m.id} className="rounded border border-stone-100 px-2 py-1">
                <span className="font-medium">{m.memoryType}</span> · {m.label}
              </li>
            ))
          )}
        </ul>
        <form action={createPlaceMemoryProfile} className="mt-4 space-y-2 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="placeId" value={place.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Memory type</span>
            <select name="memoryType" className={fieldClass} required>
              {(
                [
                  "SACRED",
                  "TRAUMA",
                  "BURIAL",
                  "TRADE",
                  "WAR",
                  "COMMUNITY",
                  "DISPLACEMENT",
                  "CONTINUITY",
                ] as const
              ).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Label</span>
            <input name="label" className={fieldClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={2} className={fieldClass} />
          </label>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add memory profile
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Environment nodes (this place)">
        {bundle.nodes.length === 0 ? (
          <p className="text-sm text-stone-600">No nodes linked. Create from the nodes admin.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {bundle.nodes.map((n) => (
              <li key={n.id}>
                <Link href={`/admin/nodes/${n.id}`} className="text-amber-900 hover:underline">
                  {n.key}
                </Link>
                <span className="text-stone-600"> — {n.label}</span>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

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
          The same environment lands differently per Enneagram pattern: gut types may read threat in bodies and rank; heart types
          in image and belonging; head types in information and exit routes. Use the POV mind page to assign a type — Campti will
          derive pressure, salience, and blind spots without replacing your judgment.
        </p>
      </section>
    </div>
  );
}
