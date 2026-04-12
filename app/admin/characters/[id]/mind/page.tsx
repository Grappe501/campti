import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addCharacterMemoryAction,
  deleteCharacterMemoryAction,
} from "@/app/actions/world-model";
import {
  addCharacterStateAction,
  createCharacterChoiceProfile,
  createCharacterConstraint,
  createCharacterPerceptionProfile,
  createCharacterTrigger,
  createCharacterVoiceProfile,
  deleteCharacterStateAction,
  updateCharacterState,
  upsertCharacterProfileAction,
} from "@/app/actions/character-engine";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { buildEnneagramInferenceSummary } from "@/lib/character-type-inference";
import { describeCharacterMindRichly } from "@/lib/descriptive-synthesis";
import { SyntheticRead } from "@/components/synthetic-read";
import { getCharacterMindBundle, getScenesForMetaScenePicker, getWorldStateReferences } from "@/lib/data-access";
import { ENNEAGRAM_TYPE_VALUES } from "@/lib/scene-soul-validation";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import {
  CharacterConstraintType,
  CharacterTriggerType,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; worldStateId?: string }>;
};

const profileTextFields = [
  ["worldview", "Worldview"],
  ["theologyFramework", "Theology framework"],
  ["roleArchetype", "Role archetype"],
  ["narrativeFunction", "Narrative function"],
  ["socialPosition", "Social position"],
  ["educationLevel", "Education level"],
  ["religiousContext", "Religious context"],
  ["emotionalBaseline", "Emotional baseline"],
  ["behavioralPatterns", "Behavioral patterns"],
  ["speechPatterns", "Speech patterns"],
  ["memoryBias", "Memory bias"],
  ["sensoryBias", "Sensory bias"],
  ["moralFramework", "Moral framework"],
  ["contradictions", "Contradictions"],
  ["notes", "Notes"],
] as const;

const profileJsonFields = [
  ["coreBeliefsJson", "Core beliefs (JSON array or object)"],
  ["misbeliefsJson", "Misbeliefs (JSON)"],
  ["fearsJson", "Fears (JSON)"],
  ["desiresJson", "Desires (JSON)"],
  ["internalConflictsJson", "Internal conflicts (JSON)"],
] as const;

const soulFields = [
  ["stressPattern", "Stress pattern"],
  ["growthPattern", "Growth pattern"],
  ["defensiveStyle", "Defensive style"],
  ["coreLonging", "Core longing"],
  ["coreFear", "Core fear"],
  ["attentionBias", "Attention bias"],
  ["relationalStyle", "Relational style"],
  ["conflictStyle", "Conflict style"],
  ["attachmentPattern", "Attachment pattern"],
  ["shameTrigger", "Shame trigger"],
  ["angerPattern", "Anger pattern"],
  ["griefPattern", "Grief pattern"],
  ["controlPattern", "Control pattern"],
  ["notesOnTypeUse", "Notes on type use"],
] as const;

const recordTypeOptions = Object.values(RecordType);
const visibilityOptions = Object.values(VisibilityStatus);
const constraintTypeOptions = Object.values(CharacterConstraintType);
const triggerTypeOptions = Object.values(CharacterTriggerType);

export default async function CharacterMindPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const selectedWorldForBrain = sp.worldStateId?.trim() || null;
  const person = await getCharacterMindBundle(id);
  if (!person) notFound();

  const scenes = await getScenesForMetaScenePicker();
  const worldStates = await getWorldStateReferences();
  const profile = person.characterProfile;
  const perception = person.characterPerceptionProfile;
  const voice = person.characterVoiceProfile;
  const choice = person.characterChoiceProfile;
  const inference = await buildEnneagramInferenceSummary(id);
  const mindSynthesis = await describeCharacterMindRichly(id);

  const relRows = [
    ...person.relationshipsAsA.map((r) => ({ r, other: r.personB })),
    ...person.relationshipsAsB.map((r) => ({ r, other: r.personA })),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/people/${id}`} className="text-sm text-amber-900 hover:underline">
          ← {person.name}
        </Link>
        <PageHeader
          title={`Mind model · ${person.name}`}
          description="Character profile, simulation layers (constraints, triggers, perception, voice, choice), memories, and scene states — bounded, curated inputs for deterministic narrative simulation."
        />
        {worldStates.length > 0 ? (
          <p className="mt-3 text-sm text-stone-600">
            <span className="font-medium text-stone-800">Stage 7 brain (by era):</span>{" "}
            {worldStates.map((w, i) => {
              const href = `/admin/characters/${id}/brain?worldStateId=${w.id}`;
              const isSelected = selectedWorldForBrain === w.id;
              return (
                <span key={w.id}>
                  {i > 0 ? " · " : null}
                  <Link
                    href={href}
                    className={
                      isSelected
                        ? "font-medium text-amber-950 underline decoration-amber-300 underline-offset-2"
                        : "text-amber-900 hover:underline"
                    }
                  >
                    {w.label}
                  </Link>
                </span>
              );
            })}
          </p>
        ) : null}
      </div>

      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Saved.
        </p>
      ) : null}

      <section className="rounded-xl border border-violet-100 bg-violet-50/20 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Embodied mind synthesis</h2>
        <p className="mt-1 text-sm text-stone-600">
          Enneagram law + profile + memory + relationships, rendered as interpretive prose — not diagnosis.
        </p>
        <div className="mt-4 max-h-[28rem] overflow-y-auto">
          <SyntheticRead title="How this consciousness tends to work">{mindSynthesis}</SyntheticRead>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Character profile</h2>
        <p className="mt-1 text-sm text-stone-600">
          Beliefs, fears, and desires are JSON so they can hold structured lists. Paste IDs on fragments to link with types{" "}
          <code className="text-xs">character_profile</code> / <code className="text-xs">character_memory</code>.
          {profile ? (
            <>
              {" "}
              Profile ID: <code className="text-xs break-all">{profile.id}</code>
            </>
          ) : (
            <> Save once to create a profile row and expose its ID for linking.</>
          )}
        </p>
        <form action={upsertCharacterProfileAction} className="mt-4 space-y-4">
          <input type="hidden" name="personId" value={person.id} />
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={profile?.recordType ?? ""}>
                <option value="">— default (HYBRID)</option>
                {recordTypeOptions.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={profile?.visibility ?? ""}>
                <option value="">— default (REVIEW)</option>
                {visibilityOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Certainty label</span>
              <input name="certainty" className={fieldClass} defaultValue={profile?.certainty ?? ""} placeholder="optional key" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {profileTextFields.map(([name, label]) => (
              <label key={name} className={labelClass + (name === "notes" || name === "worldview" ? " sm:col-span-2" : "")}>
                <span className={labelSpanClass}>{label}</span>
                <textarea
                  name={name}
                  rows={name === "notes" || name === "worldview" ? 3 : 2}
                  defaultValue={(profile?.[name as keyof NonNullable<typeof profile>] as string | undefined) ?? ""}
                  className={fieldClass}
                />
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-1">
            {profileJsonFields.map(([name, label]) => {
              const key = name.replace("Json", "") as "coreBeliefs" | "misbeliefs" | "fears" | "desires" | "internalConflicts";
              const raw = profile?.[key];
              return (
                <label key={name} className={labelClass}>
                  <span className={labelSpanClass}>{label}</span>
                  <textarea name={name} rows={4} defaultValue={profileJsonFieldToFormText(raw)} className={fieldClass} />
                </label>
              );
            })}
          </div>
          <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-4">
            <h3 className="text-sm font-medium text-stone-900">Soul pattern (Enneagram law)</h3>
            <p className="mt-1 text-xs text-stone-600">
              Default story-system personality law. Leave unset if you prefer no type. Uncertainty is fine.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelSpanClass}>Enneagram type</span>
                <select name="enneagramType" className={fieldClass} defaultValue={profile?.enneagramType ?? "__none__"}>
                  <option value="__none__">—</option>
                  {ENNEAGRAM_TYPE_VALUES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Wing (optional)</span>
                <input name="enneagramWing" className={fieldClass} defaultValue={profile?.enneagramWing ?? ""} placeholder="e.g. SEVEN" />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Confidence (1–5)</span>
                <input
                  name="enneagramConfidence"
                  type="number"
                  min={1}
                  max={5}
                  className={fieldClass}
                  defaultValue={profile?.enneagramConfidence ?? ""}
                />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Source</span>
                <input
                  name="enneagramSource"
                  className={fieldClass}
                  defaultValue={profile?.enneagramSource ?? ""}
                  placeholder="authored, inferred, hybrid"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {soulFields.map(([name, label]) => (
                <label key={name} className={labelClass + (name === "notesOnTypeUse" ? " sm:col-span-2" : "")}>
                  <span className={labelSpanClass}>{label}</span>
                  <textarea
                    name={name}
                    rows={2}
                    defaultValue={(profile?.[name as keyof NonNullable<typeof profile>] as string | undefined) ?? ""}
                    className={fieldClass}
                  />
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
          >
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Inference (advisory)</h2>
        <p className="mt-1 text-sm text-stone-600">{inference.note}</p>
        {inference.candidates.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No heuristic candidates yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-stone-800">
            {inference.candidates.map((c) => (
              <li key={c.type} className="rounded-md border border-stone-100 bg-stone-50/80 px-3 py-2">
                <span className="font-medium">{c.type}</span>
                <span className="ml-2 text-xs text-stone-500">confidence {c.confidence}</span>
                <p className="mt-1 text-xs text-stone-600">{c.rationale}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Relationships</h2>
        {relRows.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">
            None linked.{" "}
            <Link href="/admin/relationships" className="text-amber-900 hover:underline">
              Open relationships →
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {relRows.map(({ r, other }) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-stone-100 px-3 py-2">
                <span>
                  <Link href={`/admin/relationships/${r.id}`} className="text-amber-900 hover:underline">
                    {other.name}
                  </Link>
                  <span className="ml-2 text-xs text-stone-500">{r.relationshipType}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DetailSection title="Character memories">
        <ul className="space-y-4">
          {person.characterMemories.length === 0 ? (
            <li className="text-sm text-stone-600">No memories yet.</li>
          ) : (
            person.characterMemories.map((m) => (
              <li key={m.id} className="rounded-lg border border-stone-100 bg-stone-50/80 p-4 text-sm">
                <p className="text-xs text-stone-500">
                  Memory ID: <code className="break-all">{m.id}</code>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-stone-900">{m.description}</p>
                <dl className="mt-2 grid gap-1 text-xs text-stone-600 sm:grid-cols-3">
                  <div>Weight: {m.emotionalWeight ?? "—"}</div>
                  <div>Time: {m.timePeriod ?? "—"}</div>
                  <div>Reliability: {m.reliability ?? "—"}</div>
                </dl>
                {m.fragmentId ? (
                  <p className="mt-2 text-xs">
                    Fragment:{" "}
                    <Link href={`/admin/fragments/${m.fragmentId}`} className="text-amber-900 hover:underline">
                      {m.fragmentId.slice(0, 8)}…
                    </Link>
                  </p>
                ) : null}
                <form action={deleteCharacterMemoryAction} className="mt-2">
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="personId" value={person.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
        <form action={addCharacterMemoryAction} className="mt-6 space-y-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="personId" value={person.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={3} className={fieldClass} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional weight</span>
              <input name="emotionalWeight" type="number" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Time period</span>
              <input name="timePeriod" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Reliability</span>
              <input name="reliability" className={fieldClass} placeholder="factual, inferred…" />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Optional fragment ID</span>
            <input name="fragmentId" className={fieldClass} placeholder="cuid…" />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <input name="notes" className={fieldClass} />
          </label>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add memory
          </button>
        </form>
      </DetailSection>

      <DetailSection title="World context (era & place pressure)">
        <p className="text-sm text-stone-600">
          Ground each labelled state in a world-era pointer (<code className="text-xs">WorldStateReference</code>) and optional JSON
          snapshots. Decision engines will combine this with PlaceState and RiskRegime — not enforced yet.
        </p>
        {person.characterStates.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No character states — add one below to attach era context.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-stone-700">
            {person.characterStates.map((s) => (
              <li key={`wc-${s.id}`} className="flex flex-wrap gap-2">
                <span className="font-medium">{s.label || "(unlabeled)"}</span>
                <span className="text-stone-500">
                  era: {s.worldState?.eraId ?? "—"} · worldStateId: {s.worldStateId ?? "—"}
                </span>
                {!s.worldStateId ? (
                  <span className="text-amber-800">No world state linked (dev logs a soft warning when inspected).</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Character states (dynamic)">
        <p className="text-sm text-stone-600">
          Label arc slices (e.g. opening_day). Scene link is optional; future simulation will bind tighter to Scene / MetaScene.
        </p>
        <ul className="mt-3 space-y-4">
          {person.characterStates.length === 0 ? (
            <li className="text-sm text-stone-600">None yet.</li>
          ) : (
            person.characterStates.map((s) => (
              <li key={s.id} className="rounded-md border border-stone-100 p-3 text-sm">
                <p className="text-xs text-stone-500">
                  {s.scene ? (
                    <Link href={`/admin/scenes/${s.scene.id}`} className="text-amber-900 hover:underline">
                      Scene
                    </Link>
                  ) : (
                    "No scene"
                  )}{" "}
                  · label: {s.label ?? "—"}
                </p>
                <p className="mt-1 text-stone-800">{s.emotionalState || s.motivation || s.notes || "—"}</p>
                <p className="mt-1 text-xs text-stone-500">
                  trust {s.trustLevel} · fear {s.fearLevel} · stability {s.stabilityLevel} · load {s.cognitiveLoad}
                  {s.pressureLevel ? ` · pressure ${s.pressureLevel}` : ""}
                </p>
                {s.worldStateId ? (
                  <p className="mt-1 text-xs">
                    <Link
                      href={`/admin/characters/${id}/brain?worldStateId=${s.worldStateId}${s.sceneId ? `&sceneId=${s.sceneId}` : ""}`}
                      className="text-amber-900 hover:underline"
                    >
                      Open Stage 7 brain snapshot
                      {s.sceneId ? " (scene-aware)" : ""} →
                    </Link>
                  </p>
                ) : null}
                <form action={updateCharacterState} className="mt-3 space-y-2 rounded border border-dashed border-stone-200 p-3">
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="personId" value={person.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Label</span>
                      <input name="label" className={fieldClass} defaultValue={s.label ?? ""} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Scene</span>
                      <select name="sceneId" className={fieldClass} defaultValue={s.sceneId ?? ""}>
                        <option value="">—</option>
                        {scenes.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {(sc.chapter?.title ? `${sc.chapter.title}: ` : "") + sc.description.slice(0, 64)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Emotional baseline</span>
                      <input name="emotionalBaseline" className={fieldClass} defaultValue={s.emotionalBaseline ?? ""} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Pressure level</span>
                      <input name="pressureLevel" className={fieldClass} defaultValue={s.pressureLevel ?? ""} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Trust (0–100)</span>
                      <input name="trustLevel" type="number" min={0} max={100} className={fieldClass} defaultValue={s.trustLevel} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Fear (0–100)</span>
                      <input name="fearLevel" type="number" min={0} max={100} className={fieldClass} defaultValue={s.fearLevel} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Stability (0–100)</span>
                      <input name="stabilityLevel" type="number" min={0} max={100} className={fieldClass} defaultValue={s.stabilityLevel} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Cognitive load (0–100)</span>
                      <input name="cognitiveLoad" type="number" min={0} max={100} className={fieldClass} defaultValue={s.cognitiveLoad} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Emotional state</span>
                      <input name="emotionalState" className={fieldClass} defaultValue={s.emotionalState ?? ""} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Motivation</span>
                      <input name="motivation" className={fieldClass} defaultValue={s.motivation ?? ""} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Fear state</span>
                      <input name="fearState" className={fieldClass} defaultValue={s.fearState ?? ""} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Knowledge state</span>
                      <input name="knowledgeState" className={fieldClass} defaultValue={s.knowledgeState ?? ""} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Physical state</span>
                      <input name="physicalState" className={fieldClass} defaultValue={s.physicalState ?? ""} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Social constraint</span>
                      <input name="socialConstraint" className={fieldClass} defaultValue={s.socialConstraint ?? ""} />
                    </label>
                  </div>
                  <div className="rounded border border-amber-100 bg-amber-50/40 p-3">
                    <p className="text-xs font-medium text-stone-800">World context (JSON)</p>
                    <label className={labelClass + " mt-2"}>
                      <span className={labelSpanClass}>World state (era pointer)</span>
                      <select name="worldStateId" className={fieldClass} defaultValue={s.worldStateId ?? ""}>
                        <option value="">— none</option>
                        {worldStates.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.eraId} — {w.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Environment snapshot (JSON)</span>
                      <textarea
                        name="environmentSnapshotJson"
                        rows={2}
                        className={fieldClass}
                        defaultValue={profileJsonFieldToFormText(s.environmentSnapshot)}
                      />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Power context (JSON)</span>
                      <textarea name="powerContextJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(s.powerContext)} />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Economic context (JSON)</span>
                      <textarea
                        name="economicContextJson"
                        rows={2}
                        className={fieldClass}
                        defaultValue={profileJsonFieldToFormText(s.economicContext)}
                      />
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Social context (JSON)</span>
                      <textarea name="socialContextJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(s.socialContext)} />
                    </label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Record type</span>
                      <select name="recordType" className={fieldClass} defaultValue={s.recordType ?? ""}>
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
                      <select name="visibility" className={fieldClass} defaultValue={s.visibility ?? ""}>
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
                      <input name="certainty" className={fieldClass} defaultValue={s.certainty ?? ""} />
                    </label>
                  </div>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Notes</span>
                    <textarea name="notes" rows={2} className={fieldClass} defaultValue={s.notes ?? ""} />
                  </label>
                  <button type="submit" className="text-xs font-medium text-amber-900 hover:underline">
                    Update state
                  </button>
                </form>
                <form action={deleteCharacterStateAction} className="mt-2">
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="personId" value={person.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
        <form action={addCharacterStateAction} className="mt-4 space-y-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="personId" value={person.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Label (optional)</span>
              <input name="label" className={fieldClass} placeholder="opening_day" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Scene (optional)</span>
              <select name="sceneId" className={fieldClass}>
                <option value="">—</option>
                {scenes.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {(sc.chapter?.title ? `${sc.chapter.title}: ` : "") + sc.description.slice(0, 64)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional baseline</span>
              <input name="emotionalBaseline" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Pressure level</span>
              <input name="pressureLevel" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Trust (0–100)</span>
              <input name="trustLevel" type="number" min={0} max={100} className={fieldClass} placeholder="50" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Fear (0–100)</span>
              <input name="fearLevel" type="number" min={0} max={100} className={fieldClass} placeholder="50" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Stability (0–100)</span>
              <input name="stabilityLevel" type="number" min={0} max={100} className={fieldClass} placeholder="50" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Cognitive load (0–100)</span>
              <input name="cognitiveLoad" type="number" min={0} max={100} className={fieldClass} placeholder="50" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional state</span>
              <input name="emotionalState" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Motivation</span>
              <input name="motivation" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Fear state</span>
              <input name="fearState" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Knowledge state</span>
              <input name="knowledgeState" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Physical state</span>
              <input name="physicalState" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Social constraint</span>
              <input name="socialConstraint" className={fieldClass} />
            </label>
          </div>
          <div className="rounded border border-amber-100 bg-amber-50/40 p-3">
            <p className="text-xs font-medium text-stone-800">World context (optional)</p>
            <label className={labelClass + " mt-2"}>
              <span className={labelSpanClass}>World state</span>
              <select name="worldStateId" className={fieldClass} defaultValue="">
                <option value="">— none</option>
                {worldStates.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.eraId} — {w.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Environment snapshot (JSON)</span>
              <textarea name="environmentSnapshotJson" rows={2} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Power / economic / social (JSON)</span>
              <textarea name="powerContextJson" rows={1} className={fieldClass} placeholder="power" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Economic context (JSON)</span>
              <textarea name="economicContextJson" rows={1} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Social context (JSON)</span>
              <textarea name="socialContextJson" rows={1} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue="">
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
              <select name="visibility" className={fieldClass} defaultValue="">
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
              <input name="certainty" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add state
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Constraints (moral / social / physical / psychological)">
        <p className="text-sm text-stone-600">Hard and soft limits — checked later against ConstitutionalRule and scene law.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {person.characterConstraints.length === 0 ? (
            <li className="text-stone-500">None yet.</li>
          ) : (
            person.characterConstraints.map((c) => (
              <li key={c.id} className="rounded border border-stone-100 px-3 py-2">
                <span className="font-medium">{c.type}</span>
                {c.isHardConstraint ? <span className="ml-2 text-xs text-rose-700">hard</span> : <span className="ml-2 text-xs text-stone-500">soft</span>}
                <p className="mt-1 whitespace-pre-wrap">{c.description}</p>
                {c.notes ? <p className="mt-1 text-xs text-stone-500">{c.notes}</p> : null}
              </li>
            ))
          )}
        </ul>
        <form action={createCharacterConstraint} className="mt-4 space-y-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="personId" value={person.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Type</span>
            <select name="type" className={fieldClass} required>
              {constraintTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={3} className={fieldClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Hard constraint</span>
            <select name="isHardConstraint" className={fieldClass} defaultValue="true">
              <option value="true">Hard</option>
              <option value="false">Soft</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue="">
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
              <select name="visibility" className={fieldClass} defaultValue="">
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
              <input name="certainty" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add constraint
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Triggers">
        <p className="text-sm text-stone-600">Activation patterns — future links to environment and events in application logic.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {person.characterTriggers.length === 0 ? (
            <li className="text-stone-500">None yet.</li>
          ) : (
            person.characterTriggers.map((t) => (
              <li key={t.id} className="rounded border border-stone-100 px-3 py-2">
                <span className="font-medium">{t.triggerType}</span>
                <span className="ml-2 text-xs text-stone-500">intensity {t.intensity}</span>
                <p className="mt-1 whitespace-pre-wrap">{t.description}</p>
                {t.responsePattern ? <p className="mt-1 text-xs text-stone-600">Response: {t.responsePattern}</p> : null}
              </li>
            ))
          )}
        </ul>
        <form action={createCharacterTrigger} className="mt-4 space-y-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="personId" value={person.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Trigger type</span>
            <select name="triggerType" className={fieldClass} required>
              {triggerTypeOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={3} className={fieldClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Intensity (1–5)</span>
            <input name="intensity" type="number" min={1} max={5} className={fieldClass} defaultValue={3} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Response pattern</span>
            <textarea name="responsePattern" rows={2} className={fieldClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue="">
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
              <select name="visibility" className={fieldClass} defaultValue="">
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
              <input name="certainty" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add trigger
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Perception profile (1:1)">
        <p className="text-sm text-stone-600">
          Filters scene truth for POV pipelines. <code className="text-xs">narrativePermissionKey</code> aligns with NarrativePermissionProfile.key (Stage 2).
        </p>
        <form action={createCharacterPerceptionProfile} className="mt-4 space-y-3">
          <input type="hidden" name="personId" value={person.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Sensory bias</span>
              <textarea name="sensoryBias" rows={2} className={fieldClass} defaultValue={perception?.sensoryBias ?? ""} />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Attention focus</span>
              <textarea name="attentionFocus" rows={2} className={fieldClass} defaultValue={perception?.attentionFocus ?? ""} />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Blind spots (JSON)</span>
              <textarea
                name="blindSpotsJson"
                rows={3}
                className={fieldClass}
                defaultValue={profileJsonFieldToFormText(perception?.blindSpots)}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Interpretation style</span>
              <textarea name="interpretationStyle" rows={2} className={fieldClass} defaultValue={perception?.interpretationStyle ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Memory reliability</span>
              <textarea name="memoryReliability" rows={2} className={fieldClass} defaultValue={perception?.memoryReliability ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Narrative permission key</span>
              <input name="narrativePermissionKey" className={fieldClass} defaultValue={perception?.narrativePermissionKey ?? ""} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={perception?.recordType ?? ""}>
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
              <select name="visibility" className={fieldClass} defaultValue={perception?.visibility ?? ""}>
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
              <input name="certainty" className={fieldClass} defaultValue={perception?.certainty ?? ""} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} defaultValue={perception?.notes ?? ""} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save perception profile
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Voice profile (simulation, 1:1)">
        <p className="text-sm text-stone-600">Distinct from NarrativeVoiceProfile — bounded speech behavior for prose simulation.</p>
        <form action={createCharacterVoiceProfile} className="mt-4 space-y-3">
          <input type="hidden" name="personId" value={person.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Diction level</span>
              <input name="dictionLevel" className={fieldClass} defaultValue={voice?.dictionLevel ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Rhythm style</span>
              <input name="rhythmStyle" className={fieldClass} defaultValue={voice?.rhythmStyle ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Metaphor style</span>
              <input name="metaphorStyle" className={fieldClass} defaultValue={voice?.metaphorStyle ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional expression</span>
              <textarea name="emotionalExpressionStyle" rows={2} className={fieldClass} defaultValue={voice?.emotionalExpressionStyle ?? ""} />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Dialect notes</span>
              <textarea name="dialectNotes" rows={2} className={fieldClass} defaultValue={voice?.dialectNotes ?? ""} />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Silence patterns</span>
              <textarea name="silencePatterns" rows={2} className={fieldClass} defaultValue={voice?.silencePatterns ?? ""} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={voice?.recordType ?? ""}>
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
              <select name="visibility" className={fieldClass} defaultValue={voice?.visibility ?? ""}>
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
              <input name="certainty" className={fieldClass} defaultValue={voice?.certainty ?? ""} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} defaultValue={voice?.notes ?? ""} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save voice profile
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Choice profile (1:1)">
        <p className="text-sm text-stone-600">Bounded decision inputs for branch and scene engines. Loyalty priority is JSON.</p>
        <form action={createCharacterChoiceProfile} className="mt-4 space-y-3">
          <input type="hidden" name="personId" value={person.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Risk tolerance (0–100)</span>
              <input
                name="riskTolerance"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={choice?.riskTolerance ?? ""}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Decision speed</span>
              <input name="decisionSpeed" className={fieldClass} defaultValue={choice?.decisionSpeed ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Conflict style</span>
              <input name="conflictStyle" className={fieldClass} defaultValue={choice?.conflictStyle ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Self-preservation bias (0–100)</span>
              <input
                name="selfPreservationBias"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={choice?.selfPreservationBias ?? ""}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Moral rigidity (0–100)</span>
              <input
                name="moralRigidity"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={choice?.moralRigidity ?? ""}
              />
            </label>
            <label className={labelClass + " sm:col-span-2"}>
              <span className={labelSpanClass}>Loyalty priority (JSON)</span>
              <textarea
                name="loyaltyPriorityJson"
                rows={3}
                className={fieldClass}
                defaultValue={profileJsonFieldToFormText(choice?.loyaltyPriority)}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={choice?.recordType ?? ""}>
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
              <select name="visibility" className={fieldClass} defaultValue={choice?.visibility ?? ""}>
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
              <input name="certainty" className={fieldClass} defaultValue={choice?.certainty ?? ""} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} defaultValue={choice?.notes ?? ""} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save choice profile
          </button>
        </form>
      </DetailSection>
    </div>
  );
}
