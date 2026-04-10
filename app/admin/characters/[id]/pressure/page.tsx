import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCharacterDemographicProfile,
  createCharacterFamilyPressureProfile,
  createCharacterGovernanceImpact,
  createCharacterSocioEconomicProfile,
  deleteCharacterDemographicProfile,
  deleteCharacterFamilyPressureProfile,
  deleteCharacterGovernanceImpact,
  deleteCharacterSocioEconomicProfile,
  updateCharacterDemographicProfile,
  updateCharacterFamilyPressureProfile,
  updateCharacterGovernanceImpact,
  updateCharacterSocioEconomicProfile,
} from "@/app/actions/pressure-order";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { getCharacterPressureProfilesForAdmin, getPersonById, getWorldStateReferences } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { RecordType, SelfPerceptionState, StatusPosition, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
};

const rt = Object.values(RecordType);
const vis = Object.values(VisibilityStatus);
const statusPos = Object.values(StatusPosition);
const selfPerc = Object.values(SelfPerceptionState);

export default async function CharacterPressurePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const person = await getPersonById(id);
  if (!person) notFound();

  const worlds = await getWorldStateReferences();
  const profiles = await getCharacterPressureProfilesForAdmin(id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/people/${id}`} className="text-sm text-amber-900 hover:underline">
          ← {person.name}
        </Link>
        <PageHeader
          title={`Pressure · ${person.name}`}
          description="Stage 5 — governance, socio-economic, demographic, and family layers by world state."
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

      <DetailSection title="Governance impact">
        <ul className="space-y-3">
          {profiles.governanceImpacts.map((g) => (
            <li key={g.id} className="rounded border border-stone-100 p-2">
              <details>
                <summary className="cursor-pointer text-stone-900">
                  {g.worldState.eraId} · expression {g.allowedExpressionRange}
                </summary>
                <form action={updateCharacterGovernanceImpact} className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                  <input type="hidden" name="id" value={g.id} />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Allowed range</span>
                      <input
                        name="allowedExpressionRange"
                        type="number"
                        min={0}
                        max={100}
                        className={fieldClass}
                        defaultValue={g.allowedExpressionRange}
                      />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Suppression</span>
                      <input name="suppressionLevel" type="number" min={0} max={100} className={fieldClass} defaultValue={g.suppressionLevel} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Punishment risk</span>
                      <input name="punishmentRisk" type="number" min={0} max={100} className={fieldClass} defaultValue={g.punishmentRisk} />
                    </label>
                  </div>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Adaptive behavior (JSON)</span>
                    <textarea name="adaptiveBehaviorJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(g.adaptiveBehavior)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Authentic self (JSON)</span>
                    <textarea name="authenticSelfJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(g.authenticSelf)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Allowed self (JSON)</span>
                    <textarea name="allowedSelfJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(g.allowedSelf)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Suppressed self (JSON)</span>
                    <textarea name="suppressedSelfJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(g.suppressedSelf)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Notes</span>
                    <textarea name="notes" rows={2} className={fieldClass} defaultValue={g.notes ?? ""} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Record type</span>
                      <select name="recordType" className={fieldClass} defaultValue={g.recordType ?? ""}>
                        <option value="">—</option>
                        {rt.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Visibility</span>
                      <select name="visibility" className={fieldClass} defaultValue={g.visibility ?? ""}>
                        <option value="">—</option>
                        {vis.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Certainty</span>
                      <input name="certainty" className={fieldClass} defaultValue={g.certainty ?? ""} />
                    </label>
                  </div>
                  <button type="submit" className="rounded-full bg-stone-900 px-4 py-1 text-xs text-amber-50">
                    Save
                  </button>
                </form>
                <form action={deleteCharacterGovernanceImpact} className="mt-2">
                  <input type="hidden" name="id" value={g.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </details>
            </li>
          ))}
          {profiles.governanceImpacts.length === 0 ? (
            <li className="text-stone-600">None yet.</li>
          ) : null}
        </ul>
        <form action={createCharacterGovernanceImpact} className="mt-4 space-y-2 border-t border-dashed border-stone-200 pt-4">
          <input type="hidden" name="personId" value={id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>World state</span>
            <select name="worldStateId" className={fieldClass} required>
              <option value="">—</option>
              {worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.eraId}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Allowed range</span>
              <input name="allowedExpressionRange" type="number" min={0} max={100} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Suppression</span>
              <input name="suppressionLevel" type="number" min={0} max={100} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Punishment risk</span>
              <input name="punishmentRisk" type="number" min={0} max={100} className={fieldClass} />
            </label>
          </div>
          <button type="submit" className="text-sm text-amber-900 hover:underline">
            Add governance impact
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Socio-economic profile">
        <ul className="space-y-3">
          {profiles.socioEconomicProfiles.map((s) => (
            <li key={s.id} className="rounded border border-stone-100 p-2">
              <details>
                <summary className="cursor-pointer">{s.worldState.eraId} · {s.statusPosition ?? "—"}</summary>
                <form action={updateCharacterSocioEconomicProfile} className="mt-3 space-y-2 border-t pt-3">
                  <input type="hidden" name="id" value={s.id} />
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Status position</span>
                    <select name="statusPosition" className={fieldClass} defaultValue={s.statusPosition ?? ""}>
                      <option value="">—</option>
                      {statusPos.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["resourceAccess", "Resource access"],
                        ["roleExpectation", "Role expectation"],
                        ["mobilityPotential", "Mobility"],
                        ["dependencyLevel", "Dependency"],
                        ["survivalPressure", "Survival pressure"],
                        ["privilegeFactor", "Privilege"],
                      ] as const
                    ).map(([name, lab]) => (
                      <label key={name} className={labelClass}>
                        <span className={labelSpanClass}>{lab}</span>
                        <input name={name} type="number" min={0} max={100} className={fieldClass} defaultValue={(s as never)[name]} />
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Perceived value</span>
                    <input name="perceivedValue" className={fieldClass} defaultValue={s.perceivedValue ?? ""} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Internal effects (JSON)</span>
                    <textarea name="internalEffectsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(s.internalEffects)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Coping patterns (JSON)</span>
                    <textarea name="copingPatternsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(s.copingPatterns)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Notes</span>
                    <textarea name="notes" rows={2} className={fieldClass} defaultValue={s.notes ?? ""} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select name="recordType" className={fieldClass} defaultValue={s.recordType ?? ""}>
                      <option value="">record</option>
                      {rt.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <select name="visibility" className={fieldClass} defaultValue={s.visibility ?? ""}>
                      <option value="">visibility</option>
                      {vis.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <input name="certainty" className={fieldClass} placeholder="Certainty" defaultValue={s.certainty ?? ""} />
                  </div>
                  <button type="submit" className="rounded-full bg-stone-900 px-4 py-1 text-xs text-amber-50">
                    Save
                  </button>
                </form>
                <form action={deleteCharacterSocioEconomicProfile} className="mt-2">
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </details>
            </li>
          ))}
          {profiles.socioEconomicProfiles.length === 0 ? <li className="text-stone-600">None yet.</li> : null}
        </ul>
        <form action={createCharacterSocioEconomicProfile} className="mt-4 space-y-2 border-t border-dashed pt-4">
          <input type="hidden" name="personId" value={id} />
          <select name="worldStateId" className={fieldClass} required>
            <option value="">World state</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.eraId}
              </option>
            ))}
          </select>
          <select name="statusPosition" className={fieldClass}>
            <option value="">Status</option>
            {statusPos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button type="submit" className="text-sm text-amber-900 hover:underline">
            Add socio-economic profile
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Demographic / identity">
        <ul className="space-y-3">
          {profiles.demographicProfiles.map((demo) => (
            <li key={demo.id} className="rounded border border-stone-100 p-2">
              <details>
                <summary className="cursor-pointer">{demo.worldState.eraId}</summary>
                <form action={updateCharacterDemographicProfile} className="mt-3 space-y-2 border-t pt-3">
                  <input type="hidden" name="id" value={demo.id} />
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Self perception</span>
                    <select name="selfPerception" className={fieldClass} defaultValue={demo.selfPerception ?? ""}>
                      <option value="">—</option>
                      {selfPerc.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Status value (-100–100)</span>
                      <input name="statusValue" type="number" min={-100} max={100} className={fieldClass} defaultValue={demo.statusValue} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Trust bias (-100–100)</span>
                      <input name="trustBias" type="number" min={-100} max={100} className={fieldClass} defaultValue={demo.trustBias} />
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        "inclusionLevel",
                        "riskExposure",
                        "privilegeModifier",
                        "mobilityModifier",
                        "punishmentRiskModifier",
                        "belongingSense",
                        "identityCohesion",
                        "vigilanceLevel",
                      ] as const
                    ).map((name) => (
                      <label key={name} className={labelClass}>
                        <span className={labelSpanClass}>{name}</span>
                        <input name={name} type="number" min={0} max={100} className={fieldClass} defaultValue={(demo as never)[name]} />
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Visible traits (JSON)</span>
                    <textarea name="visibleTraitsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(demo.visibleTraits)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Ancestry (JSON)</span>
                    <textarea name="ancestryContextJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(demo.ancestryContext)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Stress patterns (JSON)</span>
                    <textarea name="stressPatternsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(demo.stressPatterns)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Adaptive behaviors (JSON)</span>
                    <textarea name="adaptiveBehaviorsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(demo.adaptiveBehaviors)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Notes</span>
                    <textarea name="notes" rows={2} className={fieldClass} defaultValue={demo.notes ?? ""} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select name="recordType" className={fieldClass} defaultValue={demo.recordType ?? ""}>
                      <option value="">record</option>
                      {rt.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <select name="visibility" className={fieldClass} defaultValue={demo.visibility ?? ""}>
                      <option value="">visibility</option>
                      {vis.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <input name="certainty" className={fieldClass} defaultValue={demo.certainty ?? ""} />
                  </div>
                  <button type="submit" className="rounded-full bg-stone-900 px-4 py-1 text-xs text-amber-50">
                    Save
                  </button>
                </form>
                <form action={deleteCharacterDemographicProfile} className="mt-2">
                  <input type="hidden" name="id" value={demo.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </details>
            </li>
          ))}
          {profiles.demographicProfiles.length === 0 ? <li className="text-stone-600">None yet.</li> : null}
        </ul>
        <form action={createCharacterDemographicProfile} className="mt-4 space-y-2 border-t border-dashed pt-4">
          <input type="hidden" name="personId" value={id} />
          <select name="worldStateId" className={fieldClass} required>
            <option value="">World state</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.eraId}
              </option>
            ))}
          </select>
          <button type="submit" className="text-sm text-amber-900 hover:underline">
            Add demographic profile
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Family pressure">
        <ul className="space-y-3">
          {profiles.familyPressureProfiles.map((f) => (
            <li key={f.id} className="rounded border border-stone-100 p-2">
              <details>
                <summary className="cursor-pointer">{f.worldState.eraId}</summary>
                <form action={updateCharacterFamilyPressureProfile} className="mt-3 space-y-2 border-t pt-3">
                  <input type="hidden" name="id" value={f.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["attachmentStrength", "Attachment"],
                        ["obligationPressure", "Obligation"],
                        ["emotionalExpressionRange", "Emotional range"],
                        ["individualFreedom", "Freedom"],
                        ["loyaltyExpectation", "Loyalty"],
                      ] as const
                    ).map(([name, lab]) => (
                      <label key={name} className={labelClass}>
                        <span className={labelSpanClass}>{lab}</span>
                        <input name={name} type="number" min={0} max={100} className={fieldClass} defaultValue={(f as never)[name]} />
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Conflict zones (JSON)</span>
                    <textarea name="conflictZonesJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(f.conflictZones)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Felt love (JSON)</span>
                    <textarea name="feltLoveJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(f.feltLove)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Expressed love (JSON)</span>
                    <textarea name="expressedLoveJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(f.expressedLove)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Constrained emotion (JSON)</span>
                    <textarea name="constrainedEmotionJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(f.constrainedEmotion)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Behavior patterns (JSON)</span>
                    <textarea name="behaviorPatternsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(f.behaviorPatterns)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Notes</span>
                    <textarea name="notes" rows={2} className={fieldClass} defaultValue={f.notes ?? ""} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select name="recordType" className={fieldClass} defaultValue={f.recordType ?? ""}>
                      <option value="">record</option>
                      {rt.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <select name="visibility" className={fieldClass} defaultValue={f.visibility ?? ""}>
                      <option value="">visibility</option>
                      {vis.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <input name="certainty" className={fieldClass} defaultValue={f.certainty ?? ""} />
                  </div>
                  <button type="submit" className="rounded-full bg-stone-900 px-4 py-1 text-xs text-amber-50">
                    Save
                  </button>
                </form>
                <form action={deleteCharacterFamilyPressureProfile} className="mt-2">
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </details>
            </li>
          ))}
          {profiles.familyPressureProfiles.length === 0 ? <li className="text-stone-600">None yet.</li> : null}
        </ul>
        <form action={createCharacterFamilyPressureProfile} className="mt-4 space-y-2 border-t border-dashed pt-4">
          <input type="hidden" name="personId" value={id} />
          <select name="worldStateId" className={fieldClass} required>
            <option value="">World state</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.eraId}
              </option>
            ))}
          </select>
          <button type="submit" className="text-sm text-amber-900 hover:underline">
            Add family pressure profile
          </button>
        </form>
      </DetailSection>
    </div>
  );
}
