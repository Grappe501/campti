import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteCharacterBiologicalState,
  deleteCharacterDevelopmentProfile,
  deleteCharacterIntelligenceProfile,
  upsertCharacterBiologicalState,
  upsertCharacterDevelopmentProfile,
  upsertCharacterIntelligenceProfile,
} from "@/app/actions/intelligence";
import { PageHeader } from "@/components/page-header";
import {
  getCharacterIntelligenceProfilesForAdmin,
  getPersonById,
  getWorldIntelligenceHorizonsForWorldIds,
  getWorldStateReferences,
} from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { assembleCharacterCognitiveEnvelope } from "@/lib/intelligence-engine";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
};

function mapByWorld<T extends { worldStateId: string }>(rows: T[]) {
  const m = new Map<string, T>();
  for (const r of rows) m.set(r.worldStateId, r);
  return m;
}

export default async function CharacterIntelligencePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const person = await getPersonById(id);
  if (!person) notFound();

  const worlds = await getWorldStateReferences();
  const profiles = await getCharacterIntelligenceProfilesForAdmin(id);
  const intelMap = mapByWorld(profiles.intelligence);
  const devMap = mapByWorld(profiles.development);
  const bioMap = mapByWorld(profiles.biological);

  const { knowledgeByWorld, expressionByWorld } = await getWorldIntelligenceHorizonsForWorldIds(worlds.map((w) => w.id));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/people/${id}`} className="text-sm text-amber-900 hover:underline">
          ← {person.name}
        </Link>
        <PageHeader
          title={`Intelligence · ${person.name}`}
          description="Stage 5.5 — cognitive capacity, knowledge horizon, development, biological load, and derived cognitive envelope (bounded mind wrapper for inference)."
        />
      </div>

      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          Saved ({sp.saved}).
        </p>
      ) : null}
      {sp.deleted ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
          Removed ({sp.deleted}).
        </p>
      ) : null}
      {sp.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">Save failed.</p>
      ) : null}

      {worlds.length === 0 ? (
        <p className="text-sm text-stone-600">No world states defined. Add WorldStateReference rows first.</p>
      ) : (
        <ul className="space-y-6">
          {worlds.map((w) => {
            const intRow = intelMap.get(w.id);
            const devRow = devMap.get(w.id);
            const bioRow = bioMap.get(w.id);
            const wk = knowledgeByWorld.get(w.id) ?? null;
            const we = expressionByWorld.get(w.id) ?? null;
            const envelope = assembleCharacterCognitiveEnvelope({
              worldKnowledge: wk,
              worldExpression: we,
              intelligence: intRow ?? null,
              development: devRow ?? null,
              biological: bioRow ?? null,
            });

            return (
              <li key={w.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-medium text-stone-900">
                    {w.eraId}
                    <span className="font-normal text-stone-600"> — {w.label}</span>
                  </h2>
                  <Link href={`/admin/world-states/${w.id}/knowledge`} className="text-xs text-amber-900 hover:underline">
                    Edit world knowledge →
                  </Link>
                </div>

                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-xs text-stone-800">
                  <p className="font-medium text-stone-900">Derived cognitive envelope (stub)</p>
                  <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                    <div>
                      <dt className="text-stone-500">Inferential ceiling</dt>
                      <dd className="font-mono">{envelope.inferentialCeiling.toFixed(0)}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Abstraction ceiling</dt>
                      <dd className="font-mono">{envelope.abstractionCeiling.toFixed(0)}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Expression ceiling</dt>
                      <dd className="font-mono">{envelope.expressionCeiling.toFixed(0)}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Planning horizon</dt>
                      <dd className="font-mono">{envelope.planningHorizon.toFixed(0)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-stone-500">Maturity-adjusted decision space</dt>
                      <dd className="font-mono">{envelope.maturityAdjustedDecisionSpace.toFixed(0)}</dd>
                    </div>
                  </dl>
                  <ul className="mt-2 list-inside list-disc text-stone-600">
                    {envelope.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Cognitive capacity</summary>
                  <form action={upsertCharacterIntelligenceProfile} className="mt-3 space-y-2">
                    <input type="hidden" name="personId" value={person.id} />
                    <input type="hidden" name="worldStateId" value={w.id} />
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(
                        [
                          ["patternRecognition", "Pattern recognition"],
                          ["workingMemory", "Working memory"],
                          ["abstractionCapacity", "Abstraction"],
                          ["socialInference", "Social inference"],
                          ["environmentalInference", "Environmental inference"],
                          ["selfReflectionDepth", "Self-reflection"],
                          ["impulseControl", "Impulse control"],
                          ["planningHorizon", "Planning horizon"],
                          ["metacognition", "Metacognition"],
                          ["memoryStrength", "Memory strength"],
                          ["expressionComplexity", "Expression complexity"],
                        ] as const
                      ).map(([name, lab]) => (
                        <label key={name} className={labelClass}>
                          <span className={labelSpanClass}>{lab}</span>
                          <input
                            name={name}
                            type="number"
                            min={0}
                            max={100}
                            className={fieldClass}
                            defaultValue={(intRow as Record<string, number> | undefined)?.[name] ?? 50}
                          />
                        </label>
                      ))}
                    </div>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Notes</span>
                      <textarea name="notes" rows={2} className={fieldClass} defaultValue={intRow?.notes ?? ""} />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Record type</span>
                        <select name="recordType" className={fieldClass} defaultValue={intRow?.recordType ?? RecordType.HYBRID}>
                          {Object.values(RecordType).map((r) => (
                            <option key={r} value={r}>
                              {r.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Visibility</span>
                        <select name="visibility" className={fieldClass} defaultValue={intRow?.visibility ?? VisibilityStatus.REVIEW}>
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
                      <input name="certainty" className={fieldClass} defaultValue={intRow?.certainty ?? ""} />
                    </label>
                    <button
                      type="submit"
                      className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
                    >
                      Save cognition
                    </button>
                  </form>
                  {intRow ? (
                    <form action={deleteCharacterIntelligenceProfile} className="mt-2">
                      <input type="hidden" name="id" value={intRow.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-900 hover:bg-rose-50"
                      >
                        Remove cognition row
                      </button>
                    </form>
                  ) : null}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Development / age</summary>
                  <form action={upsertCharacterDevelopmentProfile} className="mt-3 space-y-2">
                    <input type="hidden" name="personId" value={person.id} />
                    <input type="hidden" name="worldStateId" value={w.id} />
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Age band (free text)</span>
                      <input name="ageBand" className={fieldClass} defaultValue={devRow?.ageBand ?? ""} placeholder="e.g. adolescent, elder" />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Social role by age</span>
                      <textarea name="socialRoleByAge" rows={2} className={fieldClass} defaultValue={devRow?.socialRoleByAge ?? ""} />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(
                        [
                          ["maturityRate", "Maturity rate"],
                          ["regulationLevel", "Regulation"],
                          ["responsibilityLoad", "Responsibility load"],
                          ["roleCompression", "Role compression"],
                          ["protectednessExposure", "Protectedness (vs exposure)"],
                        ] as const
                      ).map(([name, lab]) => (
                        <label key={name} className={labelClass}>
                          <span className={labelSpanClass}>{lab}</span>
                          <input
                            name={name}
                            type="number"
                            min={0}
                            max={100}
                            className={fieldClass}
                            defaultValue={(devRow as Record<string, number> | undefined)?.[name] ?? 50}
                          />
                        </label>
                      ))}
                    </div>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Developmental compression (JSON)</span>
                      <textarea
                        name="developmentalCompressionJson"
                        rows={2}
                        className={fieldClass}
                        defaultValue={profileJsonFieldToFormText(devRow?.developmentalCompression)}
                      />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Notes</span>
                      <textarea name="notes" rows={2} className={fieldClass} defaultValue={devRow?.notes ?? ""} />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Record type</span>
                        <select name="recordType" className={fieldClass} defaultValue={devRow?.recordType ?? RecordType.HYBRID}>
                          {Object.values(RecordType).map((r) => (
                            <option key={r} value={r}>
                              {r.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Visibility</span>
                        <select name="visibility" className={fieldClass} defaultValue={devRow?.visibility ?? VisibilityStatus.REVIEW}>
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
                      <input name="certainty" className={fieldClass} defaultValue={devRow?.certainty ?? ""} />
                    </label>
                    <button
                      type="submit"
                      className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
                    >
                      Save development
                    </button>
                  </form>
                  {devRow ? (
                    <form action={deleteCharacterDevelopmentProfile} className="mt-2">
                      <input type="hidden" name="id" value={devRow.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-900 hover:bg-rose-50"
                      >
                        Remove development row
                      </button>
                    </form>
                  ) : null}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Biological / environmental modifiers</summary>
                  <form action={upsertCharacterBiologicalState} className="mt-3 space-y-2">
                    <input type="hidden" name="personId" value={person.id} />
                    <input type="hidden" name="worldStateId" value={w.id} />
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(
                        [
                          ["nutritionLoad", "Nutrition load"],
                          ["fatigueLoad", "Fatigue"],
                          ["illnessLoad", "Illness"],
                          ["chronicStress", "Chronic stress"],
                          ["bodyPain", "Body pain"],
                          ["laborExhaustion", "Labor exhaustion"],
                          ["environmentalExposure", "Environmental exposure"],
                          ["traumaLoad", "Trauma load"],
                        ] as const
                      ).map(([name, lab]) => (
                        <label key={name} className={labelClass}>
                          <span className={labelSpanClass}>{lab}</span>
                          <input
                            name={name}
                            type="number"
                            min={0}
                            max={100}
                            className={fieldClass}
                            defaultValue={(bioRow as Record<string, number | undefined> | undefined)?.[name] ?? 50}
                          />
                        </label>
                      ))}
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Reproductive load (optional)</span>
                        <input
                          name="reproductiveLoad"
                          type="number"
                          min={0}
                          max={100}
                          className={fieldClass}
                          defaultValue={bioRow?.reproductiveLoad ?? ""}
                          placeholder="empty = none"
                        />
                      </label>
                    </div>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Notes</span>
                      <textarea name="notes" rows={2} className={fieldClass} defaultValue={bioRow?.notes ?? ""} />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Record type</span>
                        <select name="recordType" className={fieldClass} defaultValue={bioRow?.recordType ?? RecordType.HYBRID}>
                          {Object.values(RecordType).map((r) => (
                            <option key={r} value={r}>
                              {r.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Visibility</span>
                        <select name="visibility" className={fieldClass} defaultValue={bioRow?.visibility ?? VisibilityStatus.REVIEW}>
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
                      <input name="certainty" className={fieldClass} defaultValue={bioRow?.certainty ?? ""} />
                    </label>
                    <button
                      type="submit"
                      className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
                    >
                      Save biological state
                    </button>
                  </form>
                  {bioRow ? (
                    <form action={deleteCharacterBiologicalState} className="mt-2">
                      <input type="hidden" name="id" value={bioRow.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-900 hover:bg-rose-50"
                      >
                        Remove biological row
                      </button>
                    </form>
                  ) : null}
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
