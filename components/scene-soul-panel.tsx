import Link from "next/link";
import {
  refreshSceneSoulSuggestionsAction,
  updateSceneSoulSuggestionStatusAction,
} from "@/app/actions/scene-soul";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import type { SceneSoulSuggestion } from "@prisma/client";
import {
  buildEmbodiedPerspectiveContext,
  deriveEnvironmentalInterpretation,
  deriveWhatFeelsSafeOrThreatening,
  deriveWhatThisCharacterMisses,
  deriveWhatThisCharacterNoticesFirst,
  deriveWhatThisCharacterWouldNeverSay,
  deriveWhatThisCharacterNeedsButCannotName,
  deriveWhatTriggersMemory,
  summarizeEmbodiedPerspective,
} from "@/lib/perspective-engine";
import {
  buildRelationshipContext,
  deriveLikelyConflictLoop,
  deriveLikelyRepairPath,
} from "@/lib/relationship-dynamics";
import { howEnvironmentActsOnCharacter } from "@/lib/embodied-environment";
import { deriveHeartDeficits } from "@/lib/scene-heart";

type Props = {
  metaSceneId: string;
  povPersonId: string;
  placeId: string;
  timePeriod: string | null;
  soulSuggestions: Pick<
    SceneSoulSuggestion,
    "id" | "title" | "suggestionType" | "summary" | "confidence" | "status" | "notes"
  >[];
  participantPersonIds: string[];
};

export async function SceneSoulPanel({
  metaSceneId,
  povPersonId,
  placeId,
  timePeriod,
  soulSuggestions,
  participantPersonIds,
}: Props) {
  const embodied = await buildEmbodiedPerspectiveContext(povPersonId, placeId, timePeriod, metaSceneId);
  const summary = summarizeEmbodiedPerspective(embodied);
  const heart = await deriveHeartDeficits(metaSceneId);

  const relBlocks: { label: string; text: string }[] = [];
  for (const oid of participantPersonIds) {
    const ctx = await buildRelationshipContext(povPersonId, oid);
    if (!ctx) continue;
    const repair = deriveLikelyRepairPath(ctx.profileA, ctx.profileB);
    const loop = deriveLikelyConflictLoop(ctx.profileA, ctx.profileB);
    relBlocks.push({
      label: `With participant ${oid.slice(0, 8)}…`,
      text: [ctx.enneagramRead, loop, repair].filter(Boolean).join(" "),
    });
  }

  const settingProfile = embodied.settingProfile;
  const settingStates = embodied.settingStates;
  const envAct = howEnvironmentActsOnCharacter({
    settingProfile,
    settingStates,
    constraints: embodied.constraints,
  });

  return (
    <details className="rounded-xl border border-violet-200/90 bg-violet-50/40 shadow-sm">
      <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm uppercase tracking-wide text-violet-700/90">Scene Soul ·</span> Embodied POV
      </summary>
      <div className="space-y-6 border-t border-violet-100/90 px-5 py-4 text-sm text-stone-800">
        <div className="flex flex-wrap gap-3 text-xs text-stone-600">
          <Link href={`/admin/characters/${povPersonId}/mind`} className="text-amber-900 hover:underline">
            Character mind →
          </Link>
          <span>Heart: {heart.hasHeart ? "present (heuristic)" : "needs work"}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm">
            <h4 className="text-xs font-medium uppercase tracking-wide text-violet-800/90">Enneagram law</h4>
            <p className="mt-2 text-stone-700">
              {embodied.enneagramDerived ? (
                <>
                  <span className="font-medium">{embodied.enneagramDerived.label}</span>
                  {embodied.characterProfile?.enneagramSource ? (
                    <span className="text-stone-500"> · source {embodied.characterProfile.enneagramSource}</span>
                  ) : null}
                  <span className="mt-2 block text-stone-600">
                    Attention: {embodied.enneagramDerived.attentionBias.slice(0, 220)}
                  </span>
                </>
              ) : (
                "No type assigned — pattern law inactive until you set a type on the character mind page."
              )}
            </p>
            <dl className="mt-3 space-y-2 text-xs text-stone-600">
              <div>
                <dt className="font-medium text-stone-500">Fear / desire (type-default or profile)</dt>
                <dd>
                  {embodied.characterProfile?.coreFear?.trim() || embodied.enneagramDerived?.coreFear || "—"} ·{" "}
                  {embodied.characterProfile?.coreLonging?.trim() || embodied.enneagramDerived?.coreLonging || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-stone-500">Stress / growth</dt>
                <dd className="whitespace-pre-wrap">
                  {embodied.characterProfile?.stressPattern?.trim() || embodied.enneagramDerived?.stressBehavior || "—"}
                  {" → "}
                  {embodied.characterProfile?.growthPattern?.trim() || embodied.enneagramDerived?.growthBehavior || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm">
            <h4 className="text-xs font-medium uppercase tracking-wide text-violet-800/90">Salience &amp; tension</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
              <li>Notices first: {deriveWhatThisCharacterNoticesFirst(embodied)}</li>
              <li>Likely suppresses / misses: {deriveWhatThisCharacterMisses(embodied)}</li>
              <li>Threat / safety read: {deriveWhatFeelsSafeOrThreatening(embodied)}</li>
              <li>Memory activation: {deriveWhatTriggersMemory(embodied)}</li>
              <li>Unspoken need: {deriveWhatThisCharacterNeedsButCannotName(embodied)}</li>
              <li>Would not say (guardrail): {deriveWhatThisCharacterWouldNeverSay(embodied)}</li>
            </ul>
          </section>
        </div>

        <section className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm">
          <h4 className="text-xs font-medium uppercase tracking-wide text-violet-800/90">Environment acts on POV</h4>
          <p className="mt-2 text-stone-700">{envAct}</p>
          <p className="mt-2 text-xs text-stone-600">{deriveEnvironmentalInterpretation(embodied)}</p>
        </section>

        <section className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm">
          <h4 className="text-xs font-medium uppercase tracking-wide text-violet-800/90">Relationship pressure (participants)</h4>
          {relBlocks.length === 0 ? (
            <p className="mt-2 text-stone-600">No resolved participant IDs, or no dyad data yet.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {relBlocks.map((r) => (
                <li key={r.label} className="rounded-md border border-stone-100 bg-stone-50/80 px-3 py-2 text-stone-700">
                  <p className="text-xs font-medium text-stone-500">{r.label}</p>
                  <p className="mt-1">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm">
          <h4 className="text-xs font-medium uppercase tracking-wide text-violet-800/90">Embodied summary</h4>
          <dl className="mt-2 grid gap-2 text-xs text-stone-700 sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Threat perception</dt>
              <dd>{summary.threatPerception}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Desire pull</dt>
              <dd>{summary.desirePull}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-stone-500">Internal tension</dt>
              <dd>{summary.internalTension}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-amber-200/60 bg-amber-50/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-medium text-stone-900">Soul suggestions queue</h4>
            <form action={refreshSceneSoulSuggestionsAction}>
              <input type="hidden" name="metaSceneId" value={metaSceneId} />
              <button
                type="submit"
                className="rounded-full bg-violet-900 px-4 py-2 text-xs font-medium text-violet-50 hover:bg-violet-800"
              >
                Generate soul suggestions
              </button>
            </form>
          </div>
          {soulSuggestions.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600">None yet — generate to capture structured inner-life passes.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {soulSuggestions.map((s) => (
                <li key={s.id} className="rounded-md border border-stone-100 bg-white px-3 py-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium text-stone-900">{s.title}</span>
                    <span className="text-xs text-stone-500">
                      {s.suggestionType} · conf {s.confidence ?? "—"}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-stone-700">{s.summary}</p>
                  <p className="mt-1 text-xs text-stone-500">Status: {s.status}</p>
                  <form action={updateSceneSoulSuggestionStatusAction} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="metaSceneId" value={metaSceneId} />
                    <label className={labelClass + " min-w-[140px]"}>
                      <span className={labelSpanClass}>Update status</span>
                      <select name="status" className={fieldClass + " text-xs"} defaultValue={s.status}>
                        <option value="suggested">suggested</option>
                        <option value="accepted">accepted</option>
                        <option value="rejected">rejected</option>
                        <option value="deferred">deferred</option>
                      </select>
                    </label>
                    <label className={`${labelClass} flex-1 min-w-[160px]`}>
                      <span className={labelSpanClass}>Notes</span>
                      <input name="notes" className={fieldClass + " text-xs"} defaultValue={s.notes ?? ""} />
                    </label>
                    <button
                      type="submit"
                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-50"
                    >
                      Save
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </details>
  );
}
