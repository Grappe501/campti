import Link from "next/link";
import { notFound } from "next/navigation";
import { upsertWorldStateEraProfile } from "@/app/actions/pressure-order";
import { PageHeader } from "@/components/page-header";
import {
  getWorldPressureBundleForAdmin,
  getWorldStateById,
  getWorldStateEraProfileForAdmin,
} from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import {
  ERA_KNOB_ENGINE_MAP,
  ERA_PROFILE_PRIORITY_ERA_IDS,
  summarizeTuningSession,
} from "@/lib/world-era-profile-tuning";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
};

export default async function WorldStateEraProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const ws = await getWorldStateById(id);
  if (!ws) notFound();

  const [profile, pressureBundle] = await Promise.all([
    getWorldStateEraProfileForAdmin(id),
    getWorldPressureBundleForAdmin(id),
  ]);

  const { effective, deltas, formulaLines, sanity } = summarizeTuningSession(pressureBundle, profile);
  const driversText = profile?.coreEconomicDrivers?.length
    ? profile.coreEconomicDrivers.join("\n")
    : "";

  const brainHint = `/admin/characters/<personId>/brain?worldStateId=${encodeURIComponent(ws.id)}`;

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
        title={`Era profile · ${ws.eraId}`}
        description="Core economic drivers, power summary, and five simulation knobs. Feeds brain assembly and tilts world pressure weights when a pressure bundle exists. Tie knobs to drivers and sources — not standalone vibes."
      />

      {ERA_PROFILE_PRIORITY_ERA_IDS.has(ws.eraId) ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          This era is flagged as a high-priority tuning target for active slices (compare brain + pressure before expanding the full library).
        </p>
      ) : null}

      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      {sp.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          Could not save (validation or database). Check fields and try again.
        </p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Pressure weight preview</h2>
        {!pressureBundle ? (
          <p className="mt-2 text-sm text-stone-600">
            No world pressure bundle for this state yet.{" "}
            <Link href={`/admin/pressure/bundles/new?worldStateId=${encodeURIComponent(ws.id)}`} className="text-amber-900 hover:underline">
              Create bundle
            </Link>{" "}
            to apply era tilts at runtime.
          </p>
        ) : (
          <div className="mt-2 space-y-3 text-sm text-stone-700">
            <p>
              Base bundle: gov {pressureBundle.governanceWeight} · econ {pressureBundle.economicWeight} · demo{" "}
              {pressureBundle.demographicWeight} · fam {pressureBundle.familyWeight}
            </p>
            {effective ? (
              <>
                <p className="font-medium text-stone-900">
                  Effective (normalized after era tilt): gov {effective.governanceWeight} · econ {effective.economicWeight} · demo{" "}
                  {effective.demographicWeight} · fam {effective.familyWeight}
                </p>
                {deltas ? (
                  <ul className="list-inside list-disc text-stone-600">
                    {deltas.map((d) => (
                      <li key={d.key}>
                        {d.label}: {d.base} → {d.effective} ({d.delta >= 0 ? "+" : ""}
                        {d.delta})
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-stone-500">Save an era profile below to compute effective weights.</p>
            )}
            {profile && formulaLines.length > 0 ? (
              <details className="rounded border border-stone-100 bg-stone-50 px-3 py-2">
                <summary className="cursor-pointer text-stone-800">How knobs combine (engine)</summary>
                <ul className="mt-2 list-inside list-disc text-xs text-stone-600">
                  {formulaLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        )}
      </section>

      {sanity.length > 0 ? (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-stone-900">Tuning checks</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {sanity.map((s, i) => (
              <li
                key={i}
                className={s.level === "warn" ? "text-amber-900" : "text-stone-600"}
              >
                {s.level === "warn" ? "Warning: " : ""}
                {s.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Knob reference (linked to extraction, labor, cohesion)</h2>
        <ul className="mt-3 space-y-3 text-sm text-stone-700">
          {ERA_KNOB_ENGINE_MAP.map((row) => (
            <li key={row.key}>
              <span className="font-medium text-stone-900">{row.label}</span>
              <span className="text-stone-600"> — {row.tilts}</span>
              <p className="mt-0.5 text-xs text-stone-500">{row.tieTo}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Verify on a focal character</h2>
        <p className="mt-2 text-sm text-stone-600">
          After saving, open the brain for someone grounded in this world and compare explanatory framing, danger, and runner tension with the same{" "}
          <code className="rounded bg-stone-100 px-1 text-xs">worldStateId</code>:
        </p>
        <p className="mt-2 break-all font-mono text-xs text-stone-800">{brainHint}</p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">{profile ? "Edit era profile" : "Create era profile"}</h2>
        <form action={upsertWorldStateEraProfile} className="mt-4 space-y-4">
          <input type="hidden" name="worldStateId" value={ws.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Core economic drivers (one per line, up to six)</span>
            <textarea
              name="driversText"
              rows={6}
              className={fieldClass}
              placeholder={"Trade networks\nAgriculture\n…"}
              defaultValue={driversText}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Power summary (who holds leverage)</span>
            <textarea
              name="powerSummary"
              rows={4}
              className={fieldClass}
              defaultValue={profile?.powerSummary ?? ""}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Meaning of work in this era</span>
            <textarea
              name="meaningOfWork"
              rows={3}
              className={fieldClass}
              placeholder="e.g. identity and duty vs wage labor vs coercion…"
              defaultValue={profile?.meaningOfWork ?? ""}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["knobEconomicPressure", "Economic pressure (0–100)", profile?.knobEconomicPressure ?? 50],
                ["knobRelationalInterdependence", "Relational interdependence (0–100)", profile?.knobRelationalInterdependence ?? 50],
                ["knobAutonomyBaseline", "Autonomy baseline (0–100)", profile?.knobAutonomyBaseline ?? 50],
                ["knobSystemicExtraction", "Systemic extraction / coercion climate (0–100)", profile?.knobSystemicExtraction ?? 50],
                ["knobCollectiveCohesion", "Collective / community cohesion (0–100)", profile?.knobCollectiveCohesion ?? 50],
              ] as const
            ).map(([name, lab, def]) => (
              <label key={name} className={labelClass}>
                <span className={labelSpanClass}>{lab}</span>
                <input name={name} type="number" min={0} max={100} className={fieldClass} defaultValue={def} />
              </label>
            ))}
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Evidence / source ties (why these knobs match this era)</span>
            <textarea
              name="evidenceRationale"
              rows={4}
              className={fieldClass}
              placeholder="One short paragraph: cite drivers, labor structure, or sources that justify the knob spread (not mood adjectives)."
              defaultValue={profile?.evidenceRationale ?? ""}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} defaultValue={profile?.notes ?? ""} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={profile?.recordType ?? RecordType.HYBRID}>
                {Object.values(RecordType).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={profile?.visibility ?? VisibilityStatus.REVIEW}>
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
            <input name="certainty" className={fieldClass} defaultValue={profile?.certainty ?? ""} />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            Save era profile
          </button>
        </form>
      </section>
    </div>
  );
}
