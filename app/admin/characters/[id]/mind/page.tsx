import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addCharacterMemoryAction,
  addCharacterStateAction,
  deleteCharacterMemoryAction,
  deleteCharacterStateAction,
  upsertCharacterProfileAction,
} from "@/app/actions/world-model";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { buildEnneagramInferenceSummary } from "@/lib/character-type-inference";
import { describeCharacterMindRichly } from "@/lib/descriptive-synthesis";
import { SyntheticRead } from "@/components/synthetic-read";
import { getCharacterMindBundle, getScenesForMetaScenePicker } from "@/lib/data-access";
import { ENNEAGRAM_TYPE_VALUES } from "@/lib/scene-soul-validation";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const pf = [
  ["worldview", "Worldview"],
  ["coreBeliefs", "Core beliefs"],
  ["fears", "Fears"],
  ["desires", "Desires"],
  ["internalConflicts", "Internal conflicts"],
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

export default async function CharacterMindPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const person = await getCharacterMindBundle(id);
  if (!person) notFound();

  const scenes = await getScenesForMetaScenePicker();
  const profile = person.characterProfile;
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
          description="Character profile, internal memories, and optional scene states — all optional, additive, and human-curated."
        />
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
          Paste IDs on fragments to link with types <code className="text-xs">character_profile</code> /{" "}
          <code className="text-xs">character_memory</code> and roles such as{" "}
          <code className="text-xs">informs_character</code>.
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
          <div className="grid gap-4 sm:grid-cols-2">
            {pf.map(([name, label]) => (
              <label key={name} className={labelClass + (name === "notes" || name === "worldview" ? " sm:col-span-2" : "")}>
                <span className={labelSpanClass}>{label}</span>
                <textarea
                  name={name}
                  rows={name === "notes" || name === "worldview" ? 3 : 2}
                  defaultValue={profile?.[name] ?? ""}
                  className={fieldClass}
                />
              </label>
            ))}
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

      <DetailSection title="Character states (scene-scoped)">
        <ul className="space-y-3">
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
                  )}
                </p>
                <p className="mt-1 text-stone-800">{s.emotionalState || s.motivation || s.notes || "—"}</p>
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
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add state
          </button>
        </form>
      </DetailSection>
    </div>
  );
}
