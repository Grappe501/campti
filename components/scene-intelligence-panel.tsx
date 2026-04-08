import Link from "next/link";
import { linkFragmentToMetaSceneAction } from "@/app/actions/world-model";
import {
  refreshSceneIntelligenceSuggestionsAction,
  updateSceneConstructionSuggestionStatusAction,
} from "@/app/actions/scene-intelligence";
import { createClusterAction } from "@/app/actions/clusters";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import type { SceneIntelligenceReport } from "@/lib/scene-intelligence";
import { CLUSTER_TYPES } from "@/lib/scene-intelligence-validation";
import { FRAGMENT_LINK_ROLES } from "@/lib/fragment-types";
import type { SceneConstructionSuggestion } from "@prisma/client";

type Props = {
  metaSceneId: string;
  report: SceneIntelligenceReport;
  storedSuggestions: Pick<
    SceneConstructionSuggestion,
    "id" | "title" | "suggestionType" | "summary" | "confidence" | "status" | "supportingFragmentIds"
  >[];
  linkedFragmentIds: string[];
};

export function SceneIntelligencePanel({ metaSceneId, report, storedSuggestions, linkedFragmentIds }: Props) {
  const clusterIdsJson = JSON.stringify(linkedFragmentIds.slice(0, 12));

  return (
    <details open className="rounded-xl border border-amber-200/80 bg-amber-50/30 shadow-sm">
      <summary className="cursor-pointer list-none px-5 py-4 font-medium text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-sm uppercase tracking-wide text-stone-500">Scene Intelligence ·</span> Editorial read
      </summary>
      <div className="border-t border-amber-100/80 space-y-6 px-5 py-4 text-sm text-stone-800">
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Strengths</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
              {report.strengths.length === 0 ? <li className="text-stone-500">None flagged.</li> : null}
              {report.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Missing / weak</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
              {report.missingElements.length === 0 ? <li className="text-stone-500">Looks covered.</li> : null}
              {report.missingElements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Flatness</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
              {report.flatness.length === 0 ? <li className="text-stone-500">No static cues.</li> : null}
              {report.flatness.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Tension arc hints</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
              {report.tensionArc.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="rounded-lg border border-stone-100 bg-white px-3 py-2">
            <p className="text-xs font-medium text-stone-500">Symbolic coverage</p>
            <p className="mt-1 text-stone-800">{report.symbolicCoverage}</p>
          </div>
          <div className="rounded-lg border border-stone-100 bg-white px-3 py-2">
            <p className="text-xs font-medium text-stone-500">POV strength</p>
            <p className="mt-1 text-stone-800">{report.povStrength}</p>
          </div>
          <div className="rounded-lg border border-stone-100 bg-white px-3 py-2">
            <p className="text-xs font-medium text-stone-500">Environment liveliness</p>
            <p className="mt-1 text-stone-800">{report.environmentLiveliness}</p>
          </div>
          <div className="rounded-lg border border-stone-100 bg-white px-3 py-2">
            <p className="text-xs font-medium text-stone-500">Fragment support</p>
            <p className="mt-1 text-stone-800">{report.fragmentSupport}</p>
          </div>
          <div className="rounded-lg border border-stone-100 bg-white px-3 py-2">
            <p className="text-xs font-medium text-stone-500">Grounding</p>
            <p className="mt-1 text-stone-800">{report.groundingQuality}</p>
          </div>
          <div className="rounded-lg border border-stone-100 bg-white px-3 py-2">
            <p className="text-xs font-medium text-stone-500">Scene movement</p>
            <p className="mt-1 text-stone-800">{report.sceneMovement}</p>
          </div>
        </div>

        <section>
          <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Candidate fragments (not linked)</h4>
          {report.candidateUnlinkedFragments.length === 0 ? (
            <p className="mt-2 text-stone-500">No obvious matches from heuristics.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {report.candidateUnlinkedFragments.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-100 bg-white px-3 py-2">
                  <div>
                    <Link href={`/admin/fragments/${f.id}`} className="font-medium text-amber-900 hover:underline">
                      {f.title ?? f.id.slice(0, 8)}
                    </Link>
                    <p className="text-xs text-stone-600">{f.reason}</p>
                  </div>
                  <form action={linkFragmentToMetaSceneAction} className="flex items-center gap-2">
                    <input type="hidden" name="metaSceneId" value={metaSceneId} />
                    <input type="hidden" name="fragmentId" value={f.id} />
                    <input type="hidden" name="linkedType" value="meta_scene" />
                    <input type="hidden" name="linkedId" value={metaSceneId} />
                    <select name="linkRole" className={`${fieldClass} text-xs`} defaultValue="informs_scene">
                      {FRAGMENT_LINK_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-full bg-stone-900 px-3 py-1 text-xs text-amber-50">
                      Link
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">Suggested clusters (heuristic)</h4>
          {report.clusterSuggestions.length === 0 ? (
            <p className="mt-2 text-stone-500">No tight clusters proposed.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {report.clusterSuggestions.slice(0, 4).map((c, i) => (
                <li key={`${c.title}-${i}`} className="rounded-lg border border-stone-100 bg-white px-3 py-2">
                  <p className="font-medium text-stone-900">{c.title}</p>
                  <p className="text-xs text-stone-600">{c.summary}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {c.clusterType} · {c.fragmentIds.length} fragment(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <h4 className="text-sm font-medium text-stone-900">Record suggestions for review</h4>
          <p className="mt-1 text-xs text-stone-600">
            Writes durable rows you can accept or dismiss — does not replace the live read above.
          </p>
          <form action={refreshSceneIntelligenceSuggestionsAction} className="mt-3">
            <input type="hidden" name="metaSceneId" value={metaSceneId} />
            <button
              type="submit"
              className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-xs font-medium text-stone-900 hover:bg-stone-100"
            >
              Refresh suggestion queue
            </button>
          </form>

          {storedSuggestions.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {storedSuggestions.map((s) => (
                <li key={s.id} className="rounded border border-stone-100 px-3 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-stone-900">{s.title}</p>
                      <p className="text-xs text-stone-500">{s.suggestionType}</p>
                      <p className="mt-1 text-sm text-stone-700">{s.summary}</p>
                    </div>
                    <span className="text-xs text-stone-500">{s.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={updateSceneConstructionSuggestionStatusAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="metaSceneId" value={metaSceneId} />
                      <input type="hidden" name="status" value="accepted" />
                      <button type="submit" className="text-xs text-emerald-800 hover:underline">
                        Accept
                      </button>
                    </form>
                    <form action={updateSceneConstructionSuggestionStatusAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="metaSceneId" value={metaSceneId} />
                      <input type="hidden" name="status" value="rejected" />
                      <button type="submit" className="text-xs text-stone-600 hover:underline">
                        Dismiss
                      </button>
                    </form>
                    <form action={updateSceneConstructionSuggestionStatusAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="metaSceneId" value={metaSceneId} />
                      <input type="hidden" name="status" value="deferred" />
                      <button type="submit" className="text-xs text-stone-600 hover:underline">
                        Defer
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-stone-500">No stored suggestions yet — use “Refresh suggestion queue”.</p>
          )}
        </section>

        {linkedFragmentIds.length >= 2 ? (
          <section className="rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-4">
            <h4 className="text-sm font-medium text-stone-900">Create cluster from linked fragments</h4>
            <p className="mt-1 text-xs text-stone-600">Uses up to 12 IDs currently linked to this meta scene.</p>
            <form action={createClusterAction} className="mt-3 space-y-3">
              <input type="hidden" name="metaSceneId" value={metaSceneId} />
              <input type="hidden" name="fragmentIdsJson" value={clusterIdsJson} />
              <label className={labelClass}>
                <span className={labelSpanClass}>Title</span>
                <input name="title" className={fieldClass} placeholder="e.g. Smoke / memory / continuity" required />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Type</span>
                <select name="clusterType" className={fieldClass} defaultValue="theme">
                  {CLUSTER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Summary (optional)</span>
                <textarea name="summary" rows={2} className={fieldClass} />
              </label>
              <button
                type="submit"
                className="rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-amber-50 hover:bg-stone-800"
              >
                Create cluster
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </details>
  );
}
