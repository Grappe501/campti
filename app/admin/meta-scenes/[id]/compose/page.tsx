import Link from "next/link";
import { notFound } from "next/navigation";
import { FragmentType } from "@prisma/client";
import {
  linkFragmentToMetaSceneAction,
  setCharacterStateForSceneAction,
  setSettingStateForSceneAction,
  unlinkFragmentFromMetaSceneAction,
  updateMetaSceneContextAction,
  updateMetaSceneCoreAction,
} from "@/app/actions/world-model";
import { AdminFormError } from "@/components/admin-form-error";
import { PageHeader } from "@/components/page-header";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { SceneSoulPanel } from "@/components/scene-soul-panel";
import {
  getPlacesPeopleForMetaSceneForms,
  getSceneConstructionSuggestionsForMetaScene,
  getSceneSoulSuggestionsForMetaScene,
  getScenesForMetaScenePicker,
} from "@/lib/data-access";
import { buildSceneSoulContext } from "@/lib/scene-composition";
import { fragmentTypeLabel, FRAGMENT_LINK_ROLES } from "@/lib/fragment-types";
import { getMetaSceneComposerData } from "@/lib/meta-scene-composer";
import { profileJsonFieldToString } from "@/lib/profile-json";
import {
  buildComposerSynthesisBundle,
  describePerspectiveRichly,
  describeWorldStateRichly,
} from "@/lib/descriptive-synthesis";
import { evaluateMetaScene } from "@/lib/scene-intelligence";
import { SceneIntelligencePanel } from "@/components/scene-intelligence-panel";
import { SyntheticRead } from "@/components/synthetic-read";
import { getNarrativePassesForMetaScene } from "@/lib/data-access";
import {
  deleteNarrativePassAction,
  enhanceMetaSceneWithAIAction,
  generateDescriptivePreviewAction,
  generateMetaSceneNarrativePassAction,
  updateNarrativePassStatusAction,
} from "@/app/actions/narrative-passes";

export const dynamic = "force-dynamic";

const TENSION_TYPES = ["internal", "interpersonal", "environmental", "social", "existential"] as const;

const CONSTRAINT_HINT_LABELS = [
  "Class limitations (speech, access, education)",
  "Racial restrictions (movement, visibility, risk)",
  "Technology limits for the period",
  "Travel constraints (distance, roads, curfew)",
  "Time-of-day restrictions (work hours, church bells)",
] as const;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; fragmentType?: string; error?: string; saved?: string }>;
};

export default async function MetaSceneComposePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const data = await getMetaSceneComposerData(id, {
    q: sp.q,
    fragmentType: sp.fragmentType,
  });
  if (!data?.world) notFound();

  const meta = data.world.metaScene;
  const { places, people } = await getPlacesPeopleForMetaSceneForms();
  const scenes = await getScenesForMetaScenePicker();

  const preview = await describeWorldStateRichly(id);
  const [intel, storedSuggestions, soulCtx, soulSuggestions, synthesisBundle, narrativePasses] = await Promise.all([
    evaluateMetaScene(id),
    getSceneConstructionSuggestionsForMetaScene(id),
    buildSceneSoulContext(id),
    getSceneSoulSuggestionsForMetaScene(id),
    buildComposerSynthesisBundle(id),
    getNarrativePassesForMetaScene(id),
  ]);
  const linkedFragmentIds = [
    ...new Set(
      (["informs_scene", "drives_conflict", "provides_symbolism", "represents_memory", "other"] as const).flatMap(
        (k) => (data.linkedByRole[k] ?? []).map((r) => r.fragmentId),
      ),
    ),
  ];
  const perspectiveRich = await describePerspectiveRichly(id);

  const participantsText = meta.participants.length ? meta.participants.join("\n") : "";

  const roleBuckets = [
    { key: "informs_scene", label: "Informs scene" },
    { key: "drives_conflict", label: "Drives conflict" },
    { key: "provides_symbolism", label: "Provides symbolism" },
    { key: "represents_memory", label: "Represents memory" },
    { key: "other", label: "Other / unlabeled role" },
  ] as const;

  const savedLabel =
    sp.saved === "core"
      ? "Scene core saved."
      : sp.saved === "context"
        ? "Context layer saved."
        : sp.saved === "charstate"
          ? "Character state saved."
          : sp.saved === "settingstate"
            ? "Setting state saved."
            : sp.saved === "link"
              ? "Fragment linked."
              : sp.saved === "unlink"
                ? "Fragment unlinked."
                : sp.saved === "intel"
                  ? "Scene intelligence queue refreshed."
                  : sp.saved === "suggestion"
                    ? "Suggestion updated."
                    : sp.saved === "soul"
                      ? "Soul suggestions generated."
                      : sp.saved === "soulsug"
                        ? "Soul suggestion updated."
                        : sp.saved === "preview"
                          ? "Descriptive cache generated (template)."
                          : sp.saved === "aienhance"
                            ? "AI enhancement applied (optional layer)."
                            : sp.saved === "pass"
                              ? "Narrative pass saved."
                              : sp.saved === "passstatus"
                                ? "Pass status updated."
                                : sp.saved === "passdel"
                                  ? "Pass deleted."
                                  : sp.saved
                                    ? "Saved."
                                    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div>
        <Link href="/admin/meta-scenes" className="text-sm text-amber-900 hover:underline">
          ← Meta scenes
        </Link>
        <PageHeader
          title={`Compose: ${meta.title}`}
          description="World-state builder — place, POV, constraints, fragments, and perspective previews. Not a prose editor."
        />
        <p className="mt-2 text-sm text-stone-600">
          Meta scene ID: <code className="break-all text-xs">{meta.id}</code>
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href={`/admin/meta-scenes/${id}`} className="text-amber-900 hover:underline">
            Edit record (full form)
          </Link>
          <Link href={`/admin/meta-scenes/${id}/view`} className="text-amber-900 hover:underline">
            Readable world view
          </Link>
          <Link href={`/admin/meta-scenes/${id}/perception`} className="text-amber-900 hover:underline">
            Perception debug
          </Link>
          <Link href={`/admin/meta-scenes/${id}/cinematic`} className="text-amber-900 hover:underline">
            Cinematic passes
          </Link>
          <Link href={`/admin/meta-scenes/${id}/experience-tuning`} className="text-amber-900 hover:underline">
            Experience tuning
          </Link>
        </div>
      </div>

      <AdminFormError error={sp.error} />
      {savedLabel ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {savedLabel}
        </p>
      ) : null}

      {intel ? (
        <SceneIntelligencePanel
          metaSceneId={id}
          report={intel}
          storedSuggestions={storedSuggestions}
          linkedFragmentIds={linkedFragmentIds}
        />
      ) : null}

      {soulCtx ? (
        <SceneSoulPanel
          metaSceneId={id}
          povPersonId={meta.povPersonId}
          placeId={meta.placeId}
          timePeriod={meta.timePeriod}
          soulSuggestions={soulSuggestions}
          participantPersonIds={soulCtx.participantIds}
        />
      ) : null}

      {/* Panel 1 — Scene core */}
      <details open className="group rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="text-sm uppercase tracking-wide text-stone-500">Panel 1 ·</span> Scene core
        </summary>
        <div className="border-t border-stone-100 px-5 py-4">
          <form action={updateMetaSceneCoreAction} className="space-y-4">
            <input type="hidden" name="metaSceneId" value={id} />
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
                <span className={labelSpanClass}>POV character</span>
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
              <span className={labelSpanClass}>Participants (one per line)</span>
              <textarea name="participants" rows={3} className={fieldClass} defaultValue={participantsText} />
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
              <span className={labelSpanClass}>Linked draft scene (optional)</span>
              <select name="sceneId" className={fieldClass} defaultValue={meta.sceneId ?? ""}>
                <option value="">None</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.chapter.title} — {s.description.slice(0, 80)}
                    {s.description.length > 80 ? "…" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
            >
              Save scene core
            </button>
          </form>
          {synthesisBundle ? (
            <div className="mt-4 max-h-72 overflow-y-auto">
              <SyntheticRead title="Scene core — story terms">{synthesisBundle.sceneCore}</SyntheticRead>
            </div>
          ) : null}
        </div>
      </details>

      {/* Panel 2 — Character context */}
      <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
          <span className="text-sm uppercase tracking-wide text-stone-500">Panel 2 ·</span> Character context (POV)
        </summary>
        <div className="border-t border-stone-100 space-y-4 px-5 py-4 text-sm text-stone-700">
          <p>
            <Link href={`/admin/characters/${meta.povPersonId}/mind`} className="text-amber-900 hover:underline">
              Open full character mind →
            </Link>
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-stone-500">Worldview</dt>
              <dd className="mt-1 whitespace-pre-wrap">{data.profile?.worldview ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-500">Fears</dt>
              <dd className="mt-1 whitespace-pre-wrap">{profileJsonFieldToString(data.profile?.fears) || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-500">Desires</dt>
              <dd className="mt-1 whitespace-pre-wrap">{profileJsonFieldToString(data.profile?.desires) || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-stone-500">Internal conflicts</dt>
              <dd className="mt-1 whitespace-pre-wrap">{profileJsonFieldToString(data.profile?.internalConflicts) || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-stone-500">Emotional baseline</dt>
              <dd className="mt-1 whitespace-pre-wrap">{data.profile?.emotionalBaseline ?? "—"}</dd>
            </div>
          </dl>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Relevant memories</h4>
            <ul className="mt-2 space-y-2">
              {data.relevantMemories.length === 0 ? (
                <li className="text-stone-500">No memories matched this window.</li>
              ) : (
                data.relevantMemories.map((m) => (
                  <li key={m.id} className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2">
                    <p className="line-clamp-4">{m.description}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      weight {m.emotionalWeight ?? "—"} · {m.reliability ?? "reliability unset"}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Current character state</h4>
            {data.characterStatesForMoment.length === 0 ? (
              <p className="text-stone-500">No scene-scoped character state rows yet.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {data.characterStatesForMoment.map((s) => (
                  <li key={s.id} className="rounded border border-stone-100 px-3 py-2">
                    <p className="text-xs text-stone-500">{s.sceneId ? "Linked to draft scene" : "General (no scene id)"}</p>
                    <p className="whitespace-pre-wrap">{s.emotionalState ?? "—"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-4">
            <h4 className="text-sm font-medium text-stone-900">Add or update character state</h4>
            <p className="mt-1 text-xs text-stone-600">
              Choose an existing row to overwrite, or leave as “new snapshot” to create another.
            </p>
            <form action={setCharacterStateForSceneAction} className="mt-3 space-y-3">
              <input type="hidden" name="metaSceneId" value={id} />
              <label className={labelClass}>
                <span className={labelSpanClass}>Target</span>
                <select name="characterStateId" className={fieldClass} defaultValue="">
                  <option value="">New snapshot</option>
                  {data.characterStatesForMoment.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id.slice(0, 8)}… · {s.emotionalState?.slice(0, 40) ?? "state"}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Emotional state</span>
                <textarea name="emotionalState" rows={2} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Motivation</span>
                <textarea name="motivation" rows={2} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Fear state</span>
                <textarea name="fearState" rows={2} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Knowledge state</span>
                <textarea name="knowledgeState" rows={2} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Physical state</span>
                <textarea name="physicalState" rows={2} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Social constraint</span>
                <textarea name="socialConstraint" rows={2} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Notes</span>
                <textarea name="notes" rows={2} className={fieldClass} />
              </label>
              <button
                type="submit"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
              >
                Save character state
              </button>
            </form>
          </div>
          {synthesisBundle ? (
            <div className="mt-4 max-h-96 overflow-y-auto">
              <SyntheticRead title="Character context — interpretation & state">{synthesisBundle.characterContext}</SyntheticRead>
            </div>
          ) : null}
        </div>
      </details>

      {/* Panel 3 — Environment */}
      <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
          <span className="text-sm uppercase tracking-wide text-stone-500">Panel 3 ·</span> Environment context
        </summary>
        <div className="border-t border-stone-100 space-y-4 px-5 py-4 text-sm text-stone-700">
          <p>
            <Link href={`/admin/places/${meta.placeId}/environment`} className="text-amber-900 hover:underline">
              Open full place environment →
            </Link>
          </p>
          {data.world.settingProfile ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-stone-500">Physical</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.physicalDescription ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Sounds</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.sounds ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Smells</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.smells ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Textures</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.textures ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Lighting</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.lightingConditions ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Climate</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.climateDescription ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Social rules</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.socialRules ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Class dynamics</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.classDynamics ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Racial dynamics</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.racialDynamics ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500">Religious presence</dt>
                <dd className="mt-1 whitespace-pre-wrap">{data.world.settingProfile.religiousPresence ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-stone-500">No setting profile for this place yet.</p>
          )}

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Setting states</h4>
            {data.settingStates.length === 0 ? (
              <p className="text-stone-500">No setting state rows for this place / period.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {data.settingStates.map((s) => (
                  <li key={s.id} className="rounded border border-stone-100 px-3 py-2">
                    <p className="text-xs text-stone-500">
                      {s.season ?? "—"} · {s.weather ?? "—"} · {s.timePeriod ?? "—"}
                    </p>
                    <p className="whitespace-pre-wrap">{s.notableConditions ?? ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-4">
            <h4 className="text-sm font-medium text-stone-900">Add or update setting state</h4>
            <form action={setSettingStateForSceneAction} className="mt-3 space-y-3">
              <input type="hidden" name="metaSceneId" value={id} />
              <label className={labelClass}>
                <span className={labelSpanClass}>Target row</span>
                <select name="settingStateId" className={fieldClass} defaultValue="">
                  <option value="">New row</option>
                  {data.settingStates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id.slice(0, 8)}… · {s.season ?? "season"} · {s.weather ?? "weather"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className={labelSpanClass}>Time period</span>
                  <input name="timePeriod" className={fieldClass} defaultValue={meta.timePeriod ?? ""} />
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
                  <span className={labelSpanClass}>Population</span>
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
              <button
                type="submit"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
              >
                Save setting state
              </button>
            </form>
          </div>
          {synthesisBundle ? (
            <div className="mt-4 max-h-96 overflow-y-auto">
              <SyntheticRead title="Environment — lived integration">{synthesisBundle.environmentContext}</SyntheticRead>
            </div>
          ) : null}
        </div>
      </details>

      <form action={updateMetaSceneContextAction} className="space-y-6">
        <input type="hidden" name="metaSceneId" value={id} />

        {/* Panel 4 — Constraints */}
        <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
            <span className="text-sm uppercase tracking-wide text-stone-500">Panel 4 ·</span> Constraints layer
          </summary>
          <div className="border-t border-stone-100 space-y-4 px-5 py-4">
            <p className="text-sm text-stone-600">
              What is allowed or forbidden in this moment — not plot summary.
            </p>
            <ul className="list-inside list-disc text-xs text-stone-600">
              {CONSTRAINT_HINT_LABELS.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <ul className="space-y-1 text-xs text-stone-500">
              {data.constraintHints.map((h, i) => (
                <li key={`${i}-${h.slice(0, 40)}`} className="whitespace-pre-wrap">
                  → {h}
                </li>
              ))}
            </ul>
            <label className={labelClass}>
              <span className={labelSpanClass}>Historical constraints</span>
              <textarea
                name="historicalConstraints"
                rows={4}
                className={fieldClass}
                defaultValue={meta.historicalConstraints ?? ""}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Social constraints</span>
              <textarea name="socialConstraints" rows={4} className={fieldClass} defaultValue={meta.socialConstraints ?? ""} />
            </label>
            {synthesisBundle ? (
              <div className="mt-4 max-h-72 overflow-y-auto">
                <SyntheticRead title="Constraints — how structure presses">{synthesisBundle.constraints}</SyntheticRead>
              </div>
            ) : null}
          </div>
        </details>

        {/* Panel 5 — Emotional + conflict */}
        <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
            <span className="text-sm uppercase tracking-wide text-stone-500">Panel 5 ·</span> Emotional + conflict layer
          </summary>
          <div className="border-t border-stone-100 space-y-4 px-5 py-4">
            <p className="text-xs text-stone-500">Tension types to consider:</p>
            <ul className="flex flex-wrap gap-2 text-xs">
              {TENSION_TYPES.map((t) => (
                <li key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
                  {t}
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
              <p className="font-medium text-stone-800">Hints from current fields</p>
              <ul className="mt-1 list-inside list-disc">
                {data.tensionHints.possibleConflictTypes.map((x) => (
                  <li key={x}>Possible: {x}</li>
                ))}
              </ul>
              {data.tensionHints.missingTensionWarnings.map((w) => (
                <p key={w} className="mt-1 text-amber-900/90">
                  {w}
                </p>
              ))}
            </div>
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional voltage</span>
              <textarea name="emotionalVoltage" rows={2} className={fieldClass} defaultValue={meta.emotionalVoltage ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Central conflict</span>
              <textarea name="centralConflict" rows={3} className={fieldClass} defaultValue={meta.centralConflict ?? ""} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Character states summary</span>
              <textarea
                name="characterStatesSummary"
                rows={3}
                className={fieldClass}
                defaultValue={meta.characterStatesSummary ?? ""}
              />
            </label>
            {synthesisBundle ? (
              <div className="mt-4 max-h-96 overflow-y-auto">
                <SyntheticRead title="Emotional & conflict layer">{synthesisBundle.emotionalConflict}</SyntheticRead>
              </div>
            ) : null}
          </div>
        </details>

        {/* Panel 6 — Symbolic */}
        <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
            <span className="text-sm uppercase tracking-wide text-stone-500">Panel 6 ·</span> Symbolic layer
          </summary>
          <div className="border-t border-stone-100 space-y-4 px-5 py-4">
            <label className={labelClass}>
              <span className={labelSpanClass}>Symbolic elements (author notes)</span>
              <textarea name="symbolicElements" rows={4} className={fieldClass} defaultValue={meta.symbolicElements ?? ""} />
            </label>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Symbols on linked draft scene</h4>
              {data.sceneSymbols.length === 0 ? (
                <p className="mt-1 text-sm text-stone-500">None (or no scene linked).</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {data.sceneSymbols.map((s) => (
                    <li key={s.id}>
                      <span className="font-medium">{s.name}</span>
                      {s.meaning ? <span className="text-stone-600"> — {s.meaning}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Fragments with symbolic roles</h4>
              {data.symbolicFragmentLinks.length === 0 ? (
                <p className="mt-1 text-sm text-stone-500">None linked with symbolism roles / symbolic notes.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {data.symbolicFragmentLinks.map((row) => (
                    <li key={row.fragmentId}>
                      <Link href={`/admin/fragments/${row.fragmentId}`} className="text-amber-900 hover:underline">
                        {row.fragment.title ?? row.fragmentId.slice(0, 8)}
                      </Link>
                      <span className="text-xs text-stone-500"> · {row.linkRole ?? "role unset"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {synthesisBundle ? (
              <div className="mt-4 max-h-80 overflow-y-auto">
                <SyntheticRead title="Symbolic layer — what is alive vs decorative">{synthesisBundle.symbolicLayer}</SyntheticRead>
              </div>
            ) : null}
          </div>
        </details>

        {/* Meta layer fields (still part of same save) */}
        <details className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
            Environment + narrative meta (same save)
          </summary>
          <div className="border-t border-stone-100 space-y-4 px-5 py-4">
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
              <textarea name="sensoryField" rows={3} className={fieldClass} defaultValue={meta.sensoryField ?? ""} />
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
          </div>
        </details>

        {/* Panel 8 — Source grounding (editable support level) */}
        <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
            <span className="text-sm uppercase tracking-wide text-stone-500">Panel 8 ·</span> Source grounding
          </summary>
          <div className="border-t border-stone-100 space-y-4 px-5 py-4">
            <label className={labelClass}>
              <span className={labelSpanClass}>Source support level</span>
              <select name="sourceSupportLevel" className={fieldClass} defaultValue={meta.sourceSupportLevel ?? ""}>
                <option value="">Unset</option>
                <option value="strong">strong</option>
                <option value="moderate">moderate</option>
                <option value="weak">weak</option>
                <option value="speculative">speculative</option>
              </select>
            </label>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Sources via linked fragments</h4>
              {data.sourceSummary.length === 0 ? (
                <p className="mt-1 text-sm text-stone-500">Link fragments to see sources aggregate here.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {data.sourceSummary.map((s) => (
                    <li key={s.sourceId}>
                      <Link href={`/admin/sources/${s.sourceId}`} className="text-amber-900 hover:underline">
                        {s.title ?? s.sourceId}
                      </Link>
                      <span className="text-xs text-stone-500"> · {s.fragmentCount} fragment(s)</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </details>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-amber-50 hover:bg-stone-800"
          >
            Save context, emotional, symbolic & source layers
          </button>
        </div>
      </form>

      {/* Panel 7 — Fragment integration */}
      <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
          <span className="text-sm uppercase tracking-wide text-stone-500">Panel 7 ·</span> Fragment integration
        </summary>
        <div className="border-t border-stone-100 space-y-6 px-5 py-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Search</span>
              <input name="q" className={fieldClass} defaultValue={sp.q ?? ""} placeholder="Title, summary, text…" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Type</span>
              <select name="fragmentType" className={fieldClass} defaultValue={sp.fragmentType ?? ""}>
                <option value="">Any</option>
                {Object.values(FragmentType).map((ft) => (
                  <option key={ft} value={ft}>
                    {fragmentTypeLabel(ft)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-50"
            >
              Search
            </button>
          </form>
          <p className="text-xs text-stone-500">
            Search uses GET on this page — use filters to narrow, then link a fragment by ID below.
          </p>

          {data.searchResults.length > 0 ? (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Search results</h4>
              <ul className="mt-2 space-y-3">
                {data.searchResults.map((f) => (
                  <li key={f.id} className="rounded-lg border border-stone-100 px-3 py-2 text-sm">
                    <Link href={`/admin/fragments/${f.id}`} className="font-medium text-amber-900 hover:underline">
                      {f.title ?? f.id.slice(0, 8)}
                    </Link>
                    <span className="text-xs text-stone-500"> · {fragmentTypeLabel(f.fragmentType)}</span>
                    <p className="mt-1 line-clamp-2 text-stone-600">{f.summary ?? f.text.slice(0, 160)}</p>
                    <form action={linkFragmentToMetaSceneAction} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="metaSceneId" value={id} />
                      <input type="hidden" name="fragmentId" value={f.id} />
                      <input type="hidden" name="linkedType" value="meta_scene" />
                      <input type="hidden" name="linkedId" value={id} />
                      <label className="text-xs">
                        <span className="text-stone-500">Role</span>
                        <select name="linkRole" className={`${fieldClass} mt-0.5 min-w-[10rem]`} defaultValue="informs_scene">
                          {FRAGMENT_LINK_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="submit"
                        className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-stone-800"
                      >
                        Link to scene
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : sp.q ? (
            <p className="text-sm text-stone-500">No fragments match this search.</p>
          ) : null}

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Linked fragments by role</h4>
            <div className="mt-3 space-y-4">
              {roleBuckets.map((bucket) => {
                const rows = data.linkedByRole[bucket.key] ?? [];
                if (rows.length === 0) return null;
                return (
                  <div key={bucket.key}>
                    <p className="text-xs font-medium text-stone-600">{bucket.label}</p>
                    <ul className="mt-1 space-y-2">
                      {rows.map((row) => (
                        <li
                          key={row.linkId}
                          className="flex flex-wrap items-start justify-between gap-2 rounded border border-stone-100 px-3 py-2 text-sm"
                        >
                          <div>
                            <Link href={`/admin/fragments/${row.fragmentId}`} className="text-amber-900 hover:underline">
                              {row.fragment.title ?? row.fragmentId.slice(0, 8)}
                            </Link>
                            <span className="text-xs text-stone-500">
                              {" "}
                              · {fragmentTypeLabel(row.fragment.fragmentType)}
                            </span>
                            <p className="mt-1 line-clamp-2 text-xs text-stone-600">{row.fragment.summary ?? row.fragment.text.slice(0, 120)}</p>
                          </div>
                          <form action={unlinkFragmentFromMetaSceneAction}>
                            <input type="hidden" name="metaSceneId" value={id} />
                            <input type="hidden" name="linkId" value={row.linkId} />
                            <input type="hidden" name="fragmentId" value={row.fragmentId} />
                            <button
                              type="submit"
                              className="text-xs text-rose-800 underline hover:text-rose-950"
                            >
                              Unlink
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Unplaced candidates (heuristic)</h4>
            <p className="mt-1 text-xs text-stone-500">
              Fragments already linked to this POV, place, or profiles — but not yet linked to this meta scene.
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {data.candidateFragments.length === 0 ? (
                <li className="text-stone-500">No suggestions right now.</li>
              ) : (
                data.candidateFragments.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-dashed border-stone-200 px-3 py-2">
                    <div>
                      <Link href={`/admin/fragments/${f.id}`} className="text-amber-900 hover:underline">
                        {f.title ?? f.id.slice(0, 8)}
                      </Link>
                      <span className="text-xs text-stone-500"> · {fragmentTypeLabel(f.fragmentType)}</span>
                    </div>
                    <form action={linkFragmentToMetaSceneAction} className="flex items-center gap-2">
                      <input type="hidden" name="metaSceneId" value={id} />
                      <input type="hidden" name="fragmentId" value={f.id} />
                      <input type="hidden" name="linkedType" value="meta_scene" />
                      <input type="hidden" name="linkedId" value={id} />
                      <select name="linkRole" className={`${fieldClass} text-xs`} defaultValue="informs_scene">
                        <option value="informs_scene">informs_scene</option>
                        <option value="drives_conflict">drives_conflict</option>
                        <option value="provides_symbolism">provides_symbolism</option>
                        <option value="represents_memory">represents_memory</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-stone-800 px-3 py-1 text-xs text-amber-50 hover:bg-stone-700"
                      >
                        Link
                      </button>
                    </form>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-4">
            <h4 className="text-sm font-medium text-stone-900">Manual link by fragment ID</h4>
            <form action={linkFragmentToMetaSceneAction} className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="metaSceneId" value={id} />
              <input type="hidden" name="linkedType" value="meta_scene" />
              <input type="hidden" name="linkedId" value={id} />
              <label className={labelClass}>
                <span className={labelSpanClass}>Fragment ID</span>
                <input name="fragmentId" className={fieldClass} placeholder="cuid…" required />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Role</span>
                <select name="linkRole" className={fieldClass} defaultValue="informs_scene">
                  {FRAGMENT_LINK_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
              >
                Link
              </button>
            </form>
          </div>
          {synthesisBundle ? (
            <div className="mt-4 max-h-64 overflow-y-auto">
              <SyntheticRead title="Fragment integration — what this cluster argues for">{synthesisBundle.fragmentIntegration}</SyntheticRead>
            </div>
          ) : null}
        </div>
      </details>

      {/* Narrative passes & cached previews */}
      <details open className="rounded-xl border border-violet-200/80 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="text-sm uppercase tracking-wide text-stone-500">Narrative intelligence ·</span> Passes & cached summaries
        </summary>
        <div className="border-t border-violet-100 space-y-4 px-5 py-4 text-sm text-stone-700">
          <p className="text-xs text-stone-500">
            Generate structured passes (stored as rows) or refresh template/optional AI caches. Author fields above are never overwritten.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={generateDescriptivePreviewAction}>
              <input type="hidden" name="metaSceneId" value={id} />
              <button
                type="submit"
                className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-950 hover:bg-violet-100"
              >
                Refresh descriptive cache (template)
              </button>
            </form>
            <form action={enhanceMetaSceneWithAIAction}>
              <input type="hidden" name="metaSceneId" value={id} />
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
              >
                Enhance cache with OpenAI (optional)
              </button>
            </form>
          </div>
          {meta.generatedWorldSummary ? (
            <div className="max-h-56 overflow-y-auto">
              <SyntheticRead title="Cached world summary (generated field)">{meta.generatedWorldSummary}</SyntheticRead>
            </div>
          ) : (
            <p className="text-xs text-stone-500">No cached world summary yet — run template refresh.</p>
          )}
          {meta.generatedPerspectiveSummary ? (
            <div className="max-h-56 overflow-y-auto">
              <SyntheticRead title="Cached perspective summary (generated field)">{meta.generatedPerspectiveSummary}</SyntheticRead>
            </div>
          ) : null}
          <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-3">
            <p className="text-xs font-medium text-stone-600">Generate a structured pass</p>
            <form action={generateMetaSceneNarrativePassAction} className="mt-2 flex flex-wrap items-end gap-2">
              <input type="hidden" name="metaSceneId" value={id} />
              <label className="text-xs">
                <span className="text-stone-500">Type</span>
                <select name="passType" className={`${fieldClass} mt-0.5 text-xs`} defaultValue="full_structured">
                  <option value="opening">opening</option>
                  <option value="interior">interior</option>
                  <option value="environment">environment</option>
                  <option value="relationship_pressure">relationship_pressure</option>
                  <option value="symbolic">symbolic</option>
                  <option value="embodied">embodied</option>
                  <option value="full_structured">full_structured</option>
                </select>
              </label>
              <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-amber-50">
                Generate pass
              </button>
            </form>
          </div>
          {narrativePasses.length === 0 ? (
            <p className="text-xs text-stone-500">No narrative passes stored yet.</p>
          ) : (
            <ul className="space-y-3">
              {narrativePasses.map((p) => (
                <li key={p.id} className="rounded-lg border border-stone-100 bg-white px-3 py-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-stone-800">
                      {p.passType} · {p.status}
                    </span>
                    <form action={deleteNarrativePassAction} className="inline">
                      <input type="hidden" name="passId" value={p.id} />
                      <input type="hidden" name="metaSceneId" value={id} />
                      <button type="submit" className="text-rose-800 underline">
                        Delete
                      </button>
                    </form>
                  </div>
                  <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans text-stone-700">{p.content.slice(0, 1200)}{p.content.length > 1200 ? "…" : ""}</pre>
                  <form action={updateNarrativePassStatusAction} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="passId" value={p.id} />
                    <input type="hidden" name="metaSceneId" value={id} />
                    <select name="status" className={`${fieldClass} text-xs`} defaultValue={p.status}>
                      <option value="generated">generated</option>
                      <option value="accepted">accepted</option>
                      <option value="revised">revised</option>
                      <option value="rejected">rejected</option>
                      <option value="archived">archived</option>
                    </select>
                    <input name="notes" placeholder="notes" className={`${fieldClass} text-xs`} defaultValue={p.notes ?? ""} />
                    <button type="submit" className="rounded-full bg-stone-800 px-2 py-1 text-xs text-amber-50">
                      Update
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      {/* Panel 9 — World state preview */}
      <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
          <span className="text-sm uppercase tracking-wide text-stone-500">Panel 9 ·</span> World state preview
        </summary>
        <div className="border-t border-stone-100 space-y-4 px-5 py-4 text-sm text-stone-700">
          <p className="text-xs text-stone-500">
            Rich template synthesis from structured models — not final novel prose. Style: {preview?.styleNote ?? "—"}.
          </p>
          {preview ? (
            <>
              <section>
                <h4 className="text-xs font-medium uppercase text-stone-500">POV perspective summary</h4>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 font-sans text-sm leading-relaxed">
                  {preview.povSummary}
                </pre>
              </section>
              <section>
                <h4 className="text-xs font-medium uppercase text-stone-500">Environment</h4>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 font-sans text-sm leading-relaxed">
                  {preview.environmentSummary}
                </pre>
              </section>
              <section>
                <h4 className="text-xs font-medium uppercase text-stone-500">Emotional context</h4>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 font-sans text-sm leading-relaxed">
                  {preview.emotionalContext}
                </pre>
              </section>
              <section>
                <h4 className="text-xs font-medium uppercase text-stone-500">Constraints</h4>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 font-sans text-sm leading-relaxed">
                  {preview.constraintsSummary}
                </pre>
              </section>
              <section>
                <h4 className="text-xs font-medium uppercase text-stone-500">Symbolic</h4>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 font-sans text-sm leading-relaxed">
                  {preview.symbolicSummary}
                </pre>
              </section>
            </>
          ) : (
            <p className="text-stone-500">Preview unavailable.</p>
          )}
        </div>
      </details>

      {/* Panel 10 — Perspective synthesis */}
      <details open className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900">
          <span className="text-sm uppercase tracking-wide text-stone-500">Panel 10 ·</span> Perspective preview (embodied synthesis)
        </summary>
        <div className="border-t border-stone-100 space-y-3 px-5 py-4 text-sm text-stone-700">
          <p className="text-xs text-stone-500">
            Deterministic embodied read — Enneagram law, memory, environment, constraints. Optional OpenAI refines the cache in
            “Passes &amp; cached summaries.”
          </p>
          <pre className="whitespace-pre-wrap rounded-lg bg-stone-50 p-4 font-sans text-sm leading-relaxed">{perspectiveRich}</pre>
        </div>
      </details>
    </div>
  );
}