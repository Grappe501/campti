import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCharacterConsequenceMemoryProfile,
  createCharacterEducationProfile,
  createCharacterEmotionalHealthProfile,
  createCharacterHealthEnvelope,
  createCharacterLearningEnvelope,
  createCharacterMentalHealthProfile,
  createCharacterPhysicalHealthProfile,
  createCharacterRumorReputationProfile,
  createCharacterTraumaProfile,
  deleteCharacterConsequenceMemoryProfile,
  deleteCharacterEducationProfile,
  deleteCharacterEmotionalHealthProfile,
  deleteCharacterHealthEnvelope,
  deleteCharacterLearningEnvelope,
  deleteCharacterMentalHealthProfile,
  deleteCharacterPhysicalHealthProfile,
  deleteCharacterRumorReputationProfile,
  deleteCharacterTraumaProfile,
  updateCharacterConsequenceMemoryProfile,
  updateCharacterEducationProfile,
  updateCharacterEmotionalHealthProfile,
  updateCharacterHealthEnvelope,
  updateCharacterLearningEnvelope,
  updateCharacterMentalHealthProfile,
  updateCharacterPhysicalHealthProfile,
  updateCharacterRumorReputationProfile,
  updateCharacterTraumaProfile,
} from "@/app/actions/continuity-order";
import { PageHeader } from "@/components/page-header";
import { getCharacterContinuityBundle, getPersonById, getWorldStateReferences } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { RecordType, TrainingMode, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CharacterContinuityPage({ params }: Props) {
  const { id } = await params;
  const person = await getPersonById(id);
  if (!person) notFound();

  const worlds = await getWorldStateReferences();
  const bundles = await Promise.all(worlds.map((w) => getCharacterContinuityBundle(id, w.id)));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/people/${id}`} className="text-sm text-amber-900 hover:underline">
          ← {person.name}
        </Link>
        <PageHeader
          title={`Continuity · ${person.name}`}
          description="Stage 6.5 — trauma, consequence, rumor, education, learning; physical / mental / emotional health and health envelope (world-state-shaped, not DSM-first); references to intelligence, pressure, relationships."
        />
      </div>

      {worlds.length === 0 ? (
        <p className="text-sm text-stone-600">No world states defined.</p>
      ) : (
        <ul className="space-y-8">
          {worlds.map((w, i) => {
            const b = bundles[i];
            if (!b) return null;
            const {
              trauma,
              consequenceMemory,
              rumorReputation,
              education,
              learningEnvelope,
              worldEducationNorm,
              worldHealthNorm,
              physicalHealth,
              mentalHealth,
              emotionalHealth,
              healthEnvelope,
              intelligenceRef,
              pressureRef,
              relationshipRef,
            } = b;

            return (
              <li key={w.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-medium text-stone-900">
                    {w.eraId}
                    <span className="font-normal text-stone-600"> — {w.label}</span>
                  </h2>
                  <div className="flex flex-wrap gap-x-3 text-xs">
                    <Link href={`/admin/world-states/${w.id}/education`} className="text-amber-900 hover:underline">
                      Education norms →
                    </Link>
                    <Link href={`/admin/world-states/${w.id}/health`} className="text-amber-900 hover:underline">
                      Health norms →
                    </Link>
                  </div>
                </div>
                {worldEducationNorm ? (
                  <p className="mt-2 text-xs text-stone-600">
                    Education norm: <span className="font-medium text-stone-800">{worldEducationNorm.label}</span> · elite{" "}
                    {worldEducationNorm.eliteKnowledgeAccess} / common {worldEducationNorm.commonKnowledgeAccess}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-amber-800">No world education norm profile for this era.</p>
                )}
                {worldHealthNorm ? (
                  <p className="mt-1 text-xs text-stone-600">
                    Health norm: <span className="font-medium text-stone-800">{worldHealthNorm.label}</span> · community care{" "}
                    {worldHealthNorm.communityCareCapacity} · survival burden {worldHealthNorm.survivalBurden}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-amber-800">No world health norm profile for this era.</p>
                )}

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">References (Stages 5 / 5.5 / 6)</summary>
                  <div className="mt-2 space-y-1 text-xs text-stone-600">
                    <p>
                      Intelligence profile: {intelligenceRef?.intelligence ? "yes" : "no"} · Development:{" "}
                      {intelligenceRef?.development ? "yes" : "no"} · Biological: {intelligenceRef?.biological ? "yes" : "no"}
                    </p>
                    <p>
                      Pressure — governance: {pressureRef?.governanceImpact ? "yes" : "no"} · family:{" "}
                      {pressureRef?.familyPressure ? "yes" : "no"}
                    </p>
                    <p>
                      Relationships — masking: {relationshipRef?.masking ? "yes" : "no"} · desire:{" "}
                      {relationshipRef?.desire ? "yes" : "no"} · dyads: {relationshipRef?.relationshipProfilesInvolvingPerson.length ?? 0}
                    </p>
                  </div>
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Trauma profile</summary>
                  {trauma ? (
                    <>
                    <form action={updateCharacterTraumaProfile} className="mt-3 space-y-2">
                      <input type="hidden" name="id" value={trauma.id} />
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(
                          [
                            ["traumaLoad", trauma.traumaLoad],
                            ["silenceLoad", trauma.silenceLoad],
                            ["hypervigilanceLoad", trauma.hypervigilanceLoad],
                            ["shameResidue", trauma.shameResidue],
                            ["griefResidue", trauma.griefResidue],
                          ] as const
                        ).map(([k, v]) => (
                          <label key={k} className={labelClass}>
                            <span className={labelSpanClass}>{k}</span>
                            <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                          </label>
                        ))}
                      </div>
                      {(
                        [
                          ["bodyMemoryJson", "Body memory", trauma.bodyMemory],
                          ["triggerPatternsJson", "Trigger patterns", trauma.triggerPatterns],
                          ["copingPatternsJson", "Coping patterns", trauma.copingPatterns],
                        ] as const
                      ).map(([name, lab, val]) => (
                        <label key={name} className={labelClass}>
                          <span className={labelSpanClass}>{lab} (JSON)</span>
                          <textarea name={name} rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(val)} />
                        </label>
                      ))}
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Notes</span>
                        <textarea name="notes" rows={2} className={fieldClass} defaultValue={trauma.notes ?? ""} />
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Record type</span>
                          <select name="recordType" className={fieldClass} defaultValue={trauma.recordType}>
                            {(Object.values(RecordType) as RecordType[]).map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Visibility</span>
                          <select name="visibility" className={fieldClass} defaultValue={trauma.visibility}>
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
                        <input name="certainty" className={fieldClass} defaultValue={trauma.certainty ?? ""} />
                      </label>
                      <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                        Save trauma
                      </button>
                    </form>
                    <form action={deleteCharacterTraumaProfile} className="mt-2">
                      <input type="hidden" name="id" value={trauma.id} />
                      <button type="submit" className="text-xs text-rose-800 hover:underline">
                        Remove trauma profile
                      </button>
                    </form>
                    </>
                  ) : (
                    <form action={createCharacterTraumaProfile} className="mt-3 space-y-2">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <p className="text-xs text-stone-600">Create a trauma profile row for this era.</p>
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create trauma profile
                      </button>
                    </form>
                  )}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Consequence memory</summary>
                  {consequenceMemory ? (
                    <>
                    <form action={updateCharacterConsequenceMemoryProfile} className="mt-3 space-y-2">
                      <input type="hidden" name="id" value={consequenceMemory.id} />
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(
                          [
                            ["punishmentMemory", consequenceMemory.punishmentMemory],
                            ["protectionMemory", consequenceMemory.protectionMemory],
                            ["betrayalMemory", consequenceMemory.betrayalMemory],
                            ["rewardConditioning", consequenceMemory.rewardConditioning],
                            ["exposureLearning", consequenceMemory.exposureLearning],
                          ] as const
                        ).map(([k, v]) => (
                          <label key={k} className={labelClass}>
                            <span className={labelSpanClass}>{k}</span>
                            <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                          </label>
                        ))}
                      </div>
                      {(
                        [
                          ["learnedRulesJson", "Learned rules", consequenceMemory.learnedRules],
                          ["avoidancePatternsJson", "Avoidance patterns", consequenceMemory.avoidancePatterns],
                          ["reinforcementPatternsJson", "Reinforcement patterns", consequenceMemory.reinforcementPatterns],
                        ] as const
                      ).map(([name, lab, val]) => (
                        <label key={name} className={labelClass}>
                          <span className={labelSpanClass}>{lab} (JSON)</span>
                          <textarea name={name} rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(val)} />
                        </label>
                      ))}
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Notes</span>
                        <textarea name="notes" rows={2} className={fieldClass} defaultValue={consequenceMemory.notes ?? ""} />
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Record type</span>
                          <select name="recordType" className={fieldClass} defaultValue={consequenceMemory.recordType}>
                            {(Object.values(RecordType) as RecordType[]).map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Visibility</span>
                          <select name="visibility" className={fieldClass} defaultValue={consequenceMemory.visibility}>
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
                        <input name="certainty" className={fieldClass} defaultValue={consequenceMemory.certainty ?? ""} />
                      </label>
                      <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                        Save consequence memory
                      </button>
                    </form>
                    <form action={deleteCharacterConsequenceMemoryProfile} className="mt-2">
                      <input type="hidden" name="id" value={consequenceMemory.id} />
                      <button type="submit" className="text-xs text-rose-800 hover:underline">
                        Remove consequence profile
                      </button>
                    </form>
                    </>
                  ) : (
                    <form action={createCharacterConsequenceMemoryProfile} className="mt-3">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create consequence memory profile
                      </button>
                    </form>
                  )}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Rumor / reputation</summary>
                  {rumorReputation ? (
                    <>
                    <form action={updateCharacterRumorReputationProfile} className="mt-3 space-y-2">
                      <input type="hidden" name="id" value={rumorReputation.id} />
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(
                          [
                            ["publicTrust", rumorReputation.publicTrust],
                            ["suspicionLoad", rumorReputation.suspicionLoad],
                            ["scandalRisk", rumorReputation.scandalRisk],
                            ["narrativeControl", rumorReputation.narrativeControl],
                            ["rumorExposure", rumorReputation.rumorExposure],
                          ] as const
                        ).map(([k, v]) => (
                          <label key={k} className={labelClass}>
                            <span className={labelSpanClass}>{k}</span>
                            <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                          </label>
                        ))}
                      </div>
                      {(
                        [
                          ["reputationThemesJson", "Reputation themes", rumorReputation.reputationThemes],
                          ["vulnerableNarrativesJson", "Vulnerable narratives", rumorReputation.vulnerableNarratives],
                          ["protectiveNarrativesJson", "Protective narratives", rumorReputation.protectiveNarratives],
                        ] as const
                      ).map(([name, lab, val]) => (
                        <label key={name} className={labelClass}>
                          <span className={labelSpanClass}>{lab} (JSON)</span>
                          <textarea name={name} rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(val)} />
                        </label>
                      ))}
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Notes</span>
                        <textarea name="notes" rows={2} className={fieldClass} defaultValue={rumorReputation.notes ?? ""} />
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Record type</span>
                          <select name="recordType" className={fieldClass} defaultValue={rumorReputation.recordType}>
                            {(Object.values(RecordType) as RecordType[]).map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Visibility</span>
                          <select name="visibility" className={fieldClass} defaultValue={rumorReputation.visibility}>
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
                        <input name="certainty" className={fieldClass} defaultValue={rumorReputation.certainty ?? ""} />
                      </label>
                      <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                        Save rumor profile
                      </button>
                    </form>
                    <form action={deleteCharacterRumorReputationProfile} className="mt-2">
                      <input type="hidden" name="id" value={rumorReputation.id} />
                      <button type="submit" className="text-xs text-rose-800 hover:underline">
                        Remove rumor profile
                      </button>
                    </form>
                    </>
                  ) : (
                    <form action={createCharacterRumorReputationProfile} className="mt-3">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create rumor/reputation profile
                      </button>
                    </form>
                  )}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Education / training</summary>
                  {education ? (
                    <>
                    <form action={updateCharacterEducationProfile} className="mt-3 space-y-2">
                      <input type="hidden" name="id" value={education.id} />
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Primary training mode</span>
                        <select name="primaryTrainingMode" className={fieldClass} defaultValue={education.primaryTrainingMode}>
                          {(Object.values(TrainingMode) as TrainingMode[]).map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(
                          [
                            ["literacyLevel", education.literacyLevel],
                            ["numeracyLevel", education.numeracyLevel],
                            ["oralTraditionDepth", education.oralTraditionDepth],
                            ["ecologicalKnowledgeDepth", education.ecologicalKnowledgeDepth],
                            ["institutionalSchoolingAccess", education.institutionalSchoolingAccess],
                            ["religiousInstructionDepth", education.religiousInstructionDepth],
                            ["strategicTrainingDepth", education.strategicTrainingDepth],
                            ["historicalAwarenessRange", education.historicalAwarenessRange],
                          ] as const
                        ).map(([k, v]) => (
                          <label key={k} className={labelClass}>
                            <span className={labelSpanClass}>{k}</span>
                            <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                          </label>
                        ))}
                      </div>
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Apprenticeship domains (JSON)</span>
                        <textarea
                          name="apprenticeshipDomainsJson"
                          rows={2}
                          className={fieldClass}
                          defaultValue={profileJsonFieldToFormText(education.apprenticeshipDomains)}
                        />
                      </label>
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Language exposure (JSON)</span>
                        <textarea
                          name="languageExposureJson"
                          rows={2}
                          className={fieldClass}
                          defaultValue={profileJsonFieldToFormText(education.languageExposure)}
                        />
                      </label>
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Notes</span>
                        <textarea name="notes" rows={2} className={fieldClass} defaultValue={education.notes ?? ""} />
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Record type</span>
                          <select name="recordType" className={fieldClass} defaultValue={education.recordType}>
                            {(Object.values(RecordType) as RecordType[]).map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Visibility</span>
                          <select name="visibility" className={fieldClass} defaultValue={education.visibility}>
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
                        <input name="certainty" className={fieldClass} defaultValue={education.certainty ?? ""} />
                      </label>
                      <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                        Save education
                      </button>
                    </form>
                    <form action={deleteCharacterEducationProfile} className="mt-2">
                      <input type="hidden" name="id" value={education.id} />
                      <button type="submit" className="text-xs text-rose-800 hover:underline">
                        Remove education profile
                      </button>
                    </form>
                    </>
                  ) : (
                    <form action={createCharacterEducationProfile} className="mt-3">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create education profile
                      </button>
                    </form>
                  )}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Learning envelope</summary>
                  {learningEnvelope ? (
                    <>
                    <form action={updateCharacterLearningEnvelope} className="mt-3 space-y-2">
                      <input type="hidden" name="id" value={learningEnvelope.id} />
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(
                          [
                            ["trainedCapacity", learningEnvelope.trainedCapacity],
                            ["expressiveCapacity", learningEnvelope.expressiveCapacity],
                            ["pressureDistortion", learningEnvelope.pressureDistortion],
                            ["learnedAvoidance", learningEnvelope.learnedAvoidance],
                            ["socialRiskAdjustedDisclosure", learningEnvelope.socialRiskAdjustedDisclosure],
                          ] as const
                        ).map(([k, v]) => (
                          <label key={k} className={labelClass}>
                            <span className={labelSpanClass}>{k}</span>
                            <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                          </label>
                        ))}
                      </div>
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Summary (JSON)</span>
                        <textarea
                          name="summaryJson"
                          rows={3}
                          className={fieldClass}
                          defaultValue={profileJsonFieldToFormText(learningEnvelope.summary)}
                        />
                      </label>
                      <label className={labelClass}>
                        <span className={labelSpanClass}>Notes</span>
                        <textarea name="notes" rows={2} className={fieldClass} defaultValue={learningEnvelope.notes ?? ""} />
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Record type</span>
                          <select name="recordType" className={fieldClass} defaultValue={learningEnvelope.recordType}>
                            {(Object.values(RecordType) as RecordType[]).map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Visibility</span>
                          <select name="visibility" className={fieldClass} defaultValue={learningEnvelope.visibility}>
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
                        <input name="certainty" className={fieldClass} defaultValue={learningEnvelope.certainty ?? ""} />
                      </label>
                      <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                        Save envelope
                      </button>
                    </form>
                    <form action={deleteCharacterLearningEnvelope} className="mt-2">
                      <input type="hidden" name="id" value={learningEnvelope.id} />
                      <button type="submit" className="text-xs text-rose-800 hover:underline">
                        Remove learning envelope
                      </button>
                    </form>
                    </>
                  ) : (
                    <form action={createCharacterLearningEnvelope} className="mt-3">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create learning envelope
                      </button>
                    </form>
                  )}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Physical health</summary>
                  {physicalHealth ? (
                    <>
                      <form action={updateCharacterPhysicalHealthProfile} className="mt-3 space-y-2">
                        <input type="hidden" name="id" value={physicalHealth.id} />
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(
                            [
                              ["injuryLoad", physicalHealth.injuryLoad],
                              ["chronicPainLoad", physicalHealth.chronicPainLoad],
                              ["illnessBurden", physicalHealth.illnessBurden],
                              ["nutritionStatus", physicalHealth.nutritionStatus],
                              ["sleepQuality", physicalHealth.sleepQuality],
                              ["enduranceCapacity", physicalHealth.enduranceCapacity],
                              ["mobilityLimitationLoad", physicalHealth.mobilityLimitationLoad],
                              ["reproductiveBurden", physicalHealth.reproductiveBurden],
                              ["agingBurden", physicalHealth.agingBurden],
                              ["recoveryCapacity", physicalHealth.recoveryCapacity],
                            ] as const
                          ).map(([k, v]) => (
                            <label key={k} className={labelClass}>
                              <span className={labelSpanClass}>{k}</span>
                              <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                            </label>
                          ))}
                        </div>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Sensory limitations (JSON)</span>
                          <textarea
                            name="sensoryLimitationsJson"
                            rows={2}
                            className={fieldClass}
                            defaultValue={profileJsonFieldToFormText(physicalHealth.sensoryLimitations)}
                          />
                        </label>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Notes</span>
                          <textarea name="notes" rows={2} className={fieldClass} defaultValue={physicalHealth.notes ?? ""} />
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className={labelClass}>
                            <span className={labelSpanClass}>Record type</span>
                            <select name="recordType" className={fieldClass} defaultValue={physicalHealth.recordType}>
                              {(Object.values(RecordType) as RecordType[]).map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={labelClass}>
                            <span className={labelSpanClass}>Visibility</span>
                            <select name="visibility" className={fieldClass} defaultValue={physicalHealth.visibility}>
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
                          <input name="certainty" className={fieldClass} defaultValue={physicalHealth.certainty ?? ""} />
                        </label>
                        <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                          Save physical health
                        </button>
                      </form>
                      <form action={deleteCharacterPhysicalHealthProfile} className="mt-2">
                        <input type="hidden" name="id" value={physicalHealth.id} />
                        <button type="submit" className="text-xs text-rose-800 hover:underline">
                          Remove physical health profile
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={createCharacterPhysicalHealthProfile} className="mt-3">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create physical health profile
                      </button>
                    </form>
                  )}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Mental health (regulation / load)</summary>
                  {mentalHealth ? (
                    <>
                      <form action={updateCharacterMentalHealthProfile} className="mt-3 space-y-2">
                        <input type="hidden" name="id" value={mentalHealth.id} />
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(
                            [
                              ["attentionStability", mentalHealth.attentionStability],
                              ["clarityLevel", mentalHealth.clarityLevel],
                              ["intrusiveThoughtLoad", mentalHealth.intrusiveThoughtLoad],
                              ["dissociationTendency", mentalHealth.dissociationTendency],
                              ["vigilanceLevel", mentalHealth.vigilanceLevel],
                              ["despairLoad", mentalHealth.despairLoad],
                              ["controlCompulsion", mentalHealth.controlCompulsion],
                              ["moodInstability", mentalHealth.moodInstability],
                              ["stressTolerance", mentalHealth.stressTolerance],
                              ["realityCoherence", mentalHealth.realityCoherence],
                            ] as const
                          ).map(([k, v]) => (
                            <label key={k} className={labelClass}>
                              <span className={labelSpanClass}>{k}</span>
                              <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                            </label>
                          ))}
                        </div>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Notes</span>
                          <textarea name="notes" rows={2} className={fieldClass} defaultValue={mentalHealth.notes ?? ""} />
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className={labelClass}>
                            <span className={labelSpanClass}>Record type</span>
                            <select name="recordType" className={fieldClass} defaultValue={mentalHealth.recordType}>
                              {(Object.values(RecordType) as RecordType[]).map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={labelClass}>
                            <span className={labelSpanClass}>Visibility</span>
                            <select name="visibility" className={fieldClass} defaultValue={mentalHealth.visibility}>
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
                          <input name="certainty" className={fieldClass} defaultValue={mentalHealth.certainty ?? ""} />
                        </label>
                        <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                          Save mental health
                        </button>
                      </form>
                      <form action={deleteCharacterMentalHealthProfile} className="mt-2">
                        <input type="hidden" name="id" value={mentalHealth.id} />
                        <button type="submit" className="text-xs text-rose-800 hover:underline">
                          Remove mental health profile
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={createCharacterMentalHealthProfile} className="mt-3">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create mental health profile
                      </button>
                    </form>
                  )}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Emotional health</summary>
                  {emotionalHealth ? (
                    <>
                      <form action={updateCharacterEmotionalHealthProfile} className="mt-3 space-y-2">
                        <input type="hidden" name="id" value={emotionalHealth.id} />
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(
                            [
                              ["emotionalRange", emotionalHealth.emotionalRange],
                              ["suppressionLoad", emotionalHealth.suppressionLoad],
                              ["griefSaturation", emotionalHealth.griefSaturation],
                              ["shameSaturation", emotionalHealth.shameSaturation],
                              ["tendernessAccess", emotionalHealth.tendernessAccess],
                              ["angerRegulation", emotionalHealth.angerRegulation],
                              ["fearCarryover", emotionalHealth.fearCarryover],
                              ["relationalOpenness", emotionalHealth.relationalOpenness],
                              ["recoveryAfterDistress", emotionalHealth.recoveryAfterDistress],
                              ["emotionalNumbnessLoad", emotionalHealth.emotionalNumbnessLoad],
                              ["emotionalFloodingLoad", emotionalHealth.emotionalFloodingLoad],
                            ] as const
                          ).map(([k, v]) => (
                            <label key={k} className={labelClass}>
                              <span className={labelSpanClass}>{k}</span>
                              <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                            </label>
                          ))}
                        </div>
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Notes</span>
                          <textarea name="notes" rows={2} className={fieldClass} defaultValue={emotionalHealth.notes ?? ""} />
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className={labelClass}>
                            <span className={labelSpanClass}>Record type</span>
                            <select name="recordType" className={fieldClass} defaultValue={emotionalHealth.recordType}>
                              {(Object.values(RecordType) as RecordType[]).map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={labelClass}>
                            <span className={labelSpanClass}>Visibility</span>
                            <select name="visibility" className={fieldClass} defaultValue={emotionalHealth.visibility}>
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
                          <input name="certainty" className={fieldClass} defaultValue={emotionalHealth.certainty ?? ""} />
                        </label>
                        <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                          Save emotional health
                        </button>
                      </form>
                      <form action={deleteCharacterEmotionalHealthProfile} className="mt-2">
                        <input type="hidden" name="id" value={emotionalHealth.id} />
                        <button type="submit" className="text-xs text-rose-800 hover:underline">
                          Remove emotional health profile
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={createCharacterEmotionalHealthProfile} className="mt-3">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create emotional health profile
                      </button>
                    </form>
                  )}
                </details>

                <details className="mt-4 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-900">Health envelope (function + narratives)</summary>
                  {healthEnvelope ? (
                    <>
                      <form action={updateCharacterHealthEnvelope} className="mt-3 space-y-2">
                        <input type="hidden" name="id" value={healthEnvelope.id} />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className={labelClass}>
                            <span className={labelSpanClass}>functionalCapacity</span>
                            <input
                              name="functionalCapacity"
                              type="number"
                              min={0}
                              max={100}
                              className={fieldClass}
                              defaultValue={healthEnvelope.functionalCapacity}
                            />
                          </label>
                          <label className={labelClass}>
                            <span className={labelSpanClass}>careAccess</span>
                            <input
                              name="careAccess"
                              type="number"
                              min={0}
                              max={100}
                              className={fieldClass}
                              defaultValue={healthEnvelope.careAccess}
                            />
                          </label>
                        </div>
                        {(
                          [
                            ["visibleHealthPresentationJson", "Visible / social presentation (JSON)", healthEnvelope.visibleHealthPresentation],
                            ["hiddenHealthBurdenJson", "Hidden burden (JSON)", healthEnvelope.hiddenHealthBurden],
                            ["socialInterpretationJson", "Social interpretation (JSON)", healthEnvelope.socialInterpretation],
                            ["simulationLayerJson", "Simulation / engine layer (JSON)", healthEnvelope.simulationLayer],
                            ["worldFacingHealthNarrativeJson", "World-facing / era language (JSON)", healthEnvelope.worldFacingHealthNarrative],
                            ["summaryJson", "Summary (JSON)", healthEnvelope.summary],
                          ] as const
                        ).map(([name, lab, val]) => (
                          <label key={name} className={labelClass}>
                            <span className={labelSpanClass}>{lab}</span>
                            <textarea name={name} rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(val)} />
                          </label>
                        ))}
                        <label className={labelClass}>
                          <span className={labelSpanClass}>Notes</span>
                          <textarea name="notes" rows={2} className={fieldClass} defaultValue={healthEnvelope.notes ?? ""} />
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className={labelClass}>
                            <span className={labelSpanClass}>Record type</span>
                            <select name="recordType" className={fieldClass} defaultValue={healthEnvelope.recordType}>
                              {(Object.values(RecordType) as RecordType[]).map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className={labelClass}>
                            <span className={labelSpanClass}>Visibility</span>
                            <select name="visibility" className={fieldClass} defaultValue={healthEnvelope.visibility}>
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
                          <input name="certainty" className={fieldClass} defaultValue={healthEnvelope.certainty ?? ""} />
                        </label>
                        <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                          Save health envelope
                        </button>
                      </form>
                      <form action={deleteCharacterHealthEnvelope} className="mt-2">
                        <input type="hidden" name="id" value={healthEnvelope.id} />
                        <button type="submit" className="text-xs text-rose-800 hover:underline">
                          Remove health envelope
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={createCharacterHealthEnvelope} className="mt-3">
                      <input type="hidden" name="personId" value={id} />
                      <input type="hidden" name="worldStateId" value={w.id} />
                      <button type="submit" className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800">
                        Create health envelope
                      </button>
                    </form>
                  )}
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
