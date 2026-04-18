"use client";

import Link from "next/link";
import { useState } from "react";

import { logRecommendationFollowupAction } from "@/app/actions/scene-recommendation-learning";
import type {
  SceneDecisionAssistViewModel,
  SceneDecisionRecommendation,
  SceneDecisionRecommendationAction,
} from "@/lib/domain/scene-decision-assist";
import type { SceneRecommendationActionType } from "@/lib/domain/scene-recommendation-learning";

function strengthClass(s: SceneDecisionRecommendation["strength"]): string {
  if (s === "strong") return "bg-rose-100 text-rose-950 border-rose-300";
  if (s === "moderate") return "bg-amber-100 text-amber-950 border-amber-300";
  if (s === "light") return "bg-sky-100 text-sky-950 border-sky-300";
  return "bg-stone-100 text-stone-800 border-stone-300";
}

function logAssistFollowup(sceneId: string, actionType: SceneRecommendationActionType, category: SceneDecisionRecommendation["category"]) {
  void logRecommendationFollowupAction({ sceneId, actionType, recommendationCategory: category });
}

function followupActionForSceneTab(tab: NonNullable<SceneDecisionRecommendationAction["sceneTab"]>): SceneRecommendationActionType | null {
  if (tab === "preflight") return "opened_preflight";
  if (tab === "research") return "opened_research";
  if (tab === "runs") return "opened_diff";
  return null;
}

function followupActionForHref(href: string): SceneRecommendationActionType | null {
  if (href.includes("/admin/research")) return "opened_research";
  if (href.includes("simulation-workbench")) return "opened_simulation";
  return null;
}

function RecommendationCard({
  r,
  sceneId,
  defaultOpen,
}: {
  r: SceneDecisionRecommendation;
  sceneId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const learn = r.learningAugmentation;

  return (
    <article className={`rounded-xl border p-4 ${strengthClass(r.strength)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{r.category.replaceAll("_", " ")}</p>
          <h3 className="mt-1 text-sm font-semibold text-stone-950">{r.title}</h3>
        </div>
        <span className="rounded-full border border-stone-400/50 bg-white/80 px-2 py-0.5 text-[11px] font-medium capitalize">{r.strength}</span>
      </div>
      {learn && learn.ruleBasedStrength !== r.strength ? (
        <p className="mt-2 text-[11px] text-stone-800">
          Rule-based strength was <span className="font-medium capitalize">{learn.ruleBasedStrength}</span> — effective label now{" "}
          <span className="font-medium capitalize">{learn.effectiveStrength}</span> after bounded historical adjustment (transparent, not a hidden
          policy change).
        </p>
      ) : null}
      {learn?.historicalNote ? (
        <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50/70 p-2 text-[11px] text-violet-950">
          <p className="font-semibold text-violet-950">Historical pattern (observational)</p>
          <p className="mt-1">{learn.historicalNote}</p>
          <p className="mt-1 text-violet-900">
            Confidence signal: <span className="font-mono">{learn.confidenceAdjustment.kind}</span>
            {learn.confidenceAdjustment.explanation ? ` — ${learn.confidenceAdjustment.explanation}` : null}
          </p>
          {learn.confidenceAdjustment.notes.length ? (
            <ul className="mt-1 list-inside list-disc text-violet-900">
              {learn.confidenceAdjustment.notes.map((n) => (
                <li key={n.text}>
                  ({n.derivation}) {n.text}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-1 text-[10px] text-violet-800">History status: {learn.historyStatus.replaceAll("_", " ")}</p>
        </div>
      ) : learn && learn.historyStatus === "insufficient_history" ? (
        <p className="mt-2 text-[11px] text-stone-600">
          Not enough logged history for this category to summarize patterns — the rule-based basis above is the full signal.
        </p>
      ) : null}
      <p className="mt-2 text-sm text-stone-900">{r.recommendationText}</p>
      <p className="mt-2 text-xs text-stone-800">
        <span className="font-medium">Basis:</span> {r.basis.summary}
      </p>
      {r.suppressionOrCautionNotes.length ? (
        <ul className="mt-2 list-inside list-disc text-xs text-stone-800">
          {r.suppressionOrCautionNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-3 text-xs font-medium text-stone-900 underline-offset-2 hover:underline"
      >
        {open ? "Hide evidence" : "Show evidence & actions"}
      </button>
      {open ? (
        <div className="mt-3 space-y-3 border-t border-stone-300/50 pt-3">
          {r.basis.factualEvidence.length ? (
            <div>
              <p className="text-[11px] font-semibold text-stone-900">Factual evidence</p>
              <ul className="mt-1 space-y-1 text-xs text-stone-800">
                {r.basis.factualEvidence.map((e) => (
                  <li key={e.id}>
                    <span className="font-mono text-[10px] text-stone-500">{e.kind}</span> · {e.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {r.basis.heuristicNotes.length ? (
            <div>
              <p className="text-[11px] font-semibold text-amber-950">Heuristic notes</p>
              <ul className="mt-1 space-y-1 text-xs text-amber-950">
                {r.basis.heuristicNotes.map((h) => (
                  <li key={h.id}>
                    ({h.noteStrength}) {h.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {r.basis.triggers.length ? (
            <div>
              <p className="text-[11px] font-semibold text-stone-900">Triggers</p>
              <ul className="mt-1 space-y-1 text-xs text-stone-800">
                {r.basis.triggers.map((t) => (
                  <li key={t.code}>
                    <span className="font-mono text-[10px] text-stone-500">{t.kind}</span> · {t.label}: {t.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <p className="text-[11px] font-semibold text-stone-900">Next actions</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {r.actions.map((a) => {
                if (a.kind === "scene_tab" && a.sceneTab) {
                  const fa = followupActionForSceneTab(a.sceneTab);
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/admin/scenes/${sceneId}?tab=${a.sceneTab}`}
                        onClick={() => {
                          if (fa) logAssistFollowup(sceneId, fa, r.category);
                        }}
                        className="inline-block rounded-full border border-stone-400 bg-white px-3 py-1 text-xs font-medium text-stone-900 hover:bg-stone-50"
                      >
                        {a.label}
                      </Link>
                    </li>
                  );
                }
                if (a.kind === "href" && a.href) {
                  const fa = followupActionForHref(a.href);
                  return (
                    <li key={a.id}>
                      <Link
                        href={a.href}
                        onClick={() => {
                          if (fa) logAssistFollowup(sceneId, fa, r.category);
                        }}
                        className="inline-block rounded-full border border-stone-400 bg-white px-3 py-1 text-xs font-medium text-stone-900 hover:bg-stone-50"
                      >
                        {a.label}
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={a.id} className="text-xs text-stone-600">
                    {a.label} — <span className="italic">{a.explanation}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </article>
  );
}

type Props = {
  sceneId: string;
  initial: SceneDecisionAssistViewModel;
  /** When true, render a compact top strip (e.g. run ledger). */
  compact?: boolean;
};

export function SceneDecisionAssistClient({ sceneId, initial, compact }: Props) {
  const { recommendations, summary, suppressionsApplied, runFocus, effectivenessSummary } = initial;

  if (compact) {
    const top = recommendations.primary;
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50/80 p-3 text-xs text-teal-950">
        <p className="font-semibold text-teal-950">Decision assist (this selection)</p>
        {runFocus ? (
          <p className="mt-1 text-[11px] text-teal-900">
            Run focus · eligibility: <span className="font-mono">{runFocus.replayEligibility}</span>
          </p>
        ) : null}
        {top ? (
          <p className="mt-2 text-sm text-teal-950">
            <span className="capitalize">({top.strength})</span> {top.title}
          </p>
        ) : (
          <p className="mt-2 text-stone-600">No primary recommendation for this scope.</p>
        )}
        <p className="mt-2 text-[11px] text-teal-900">{summary.honestyBanner}</p>
        <p className="mt-2">
          <Link href={`/admin/scenes/${sceneId}?tab=assist`} className="font-medium text-teal-950 underline-offset-2 hover:underline">
            Open full Decision Assist tab →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
        <p className="text-xs uppercase tracking-widest text-teal-900">Decision assist</p>
        <h2 className="mt-1 text-lg font-semibold text-teal-950">Grounded next-step guidance</h2>
        <p className="mt-2 text-sm text-teal-950">{summary.honestyBanner}</p>
        {summary.partialHistoryCodes.length ? (
          <p className="mt-2 text-xs text-amber-900">
            Completeness: {summary.partialHistoryCodes.join(", ").replaceAll("_", " ")}
          </p>
        ) : null}
        {summary.outputChurnHints.length ? (
          <div className="mt-3 rounded-lg border border-stone-200 bg-white/80 p-2 text-xs text-stone-800">
            <p className="font-medium text-stone-900">Linked output signals (bounded)</p>
            <ul className="mt-1 list-inside list-disc">
              {summary.outputChurnHints.map((h) => (
                <li key={h.code}>
                  <span className="text-stone-500">({h.derivation})</span> {h.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {suppressionsApplied.length ? (
          <div className="mt-2 text-[11px] text-teal-900">
            <span className="font-medium">Suppression / demotion applied:</span>{" "}
            {suppressionsApplied.map((s) => s.message).join(" · ")}
          </div>
        ) : null}
        {runFocus ? (
          <div className="mt-3 rounded-lg border border-teal-300 bg-white/80 p-2 text-xs text-teal-950">
            <p className="font-medium">Run-scoped context</p>
            <ul className="mt-1 list-inside list-disc">
              {runFocus.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      {recommendations.primary ? (
        <div>
          <p className="mb-2 text-xs font-medium text-stone-700">Primary</p>
          <RecommendationCard r={recommendations.primary} sceneId={sceneId} defaultOpen />
        </div>
      ) : (
        <p className="text-sm text-stone-600">No ranked primary recommendation — review preflight and ledger manually.</p>
      )}

      {recommendations.secondary.length ? (
        <div>
          <p className="mb-2 text-xs font-medium text-stone-700">Secondary</p>
          <div className="space-y-3">
            {recommendations.secondary.map((r) => (
              <RecommendationCard key={r.id} r={r} sceneId={sceneId} />
            ))}
          </div>
        </div>
      ) : null}

      {effectivenessSummary ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Scene learning loop (bounded)</p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-800">{effectivenessSummary.honestyBanner}</p>
          <p className="mt-2 text-[11px]">
            Window: last {effectivenessSummary.stats.windowDays} days · Shown events: {effectivenessSummary.stats.totalShownEvents} · Outcome-linked
            launches: {effectivenessSummary.stats.totalOutcomeLinkedEvents} · Overall history:{" "}
            <span className="font-medium">{effectivenessSummary.overallHistoryStatus.replaceAll("_", " ")}</span>
          </p>
          {effectivenessSummary.followup.lastActionAtIso ? (
            <p className="mt-2 text-[11px] text-slate-800">
              Recent follow-up actions logged: {effectivenessSummary.followup.recentActionTypes.slice(-6).join(", ").replaceAll("_", " ") || "—"} ·
              last at {effectivenessSummary.followup.lastActionAtIso.slice(0, 19)}Z
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-slate-600">No follow-up navigation events logged yet for this scene in the window.</p>
          )}
          <details className="mt-3 rounded-lg border border-slate-200 bg-white/90 p-2">
            <summary className="cursor-pointer text-[11px] font-medium text-slate-900">Per-category observational counts</summary>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-[11px] text-slate-800">
              {effectivenessSummary.stats.categoryCorrelations
                .filter((c) => c.shownCount > 0 || c.outcomeLinkedCount > 0 || c.followedCount > 0)
                .map((c) => (
                  <li key={c.category}>
                    <span className="font-medium">{c.category.replaceAll("_", " ")}</span>: shown {c.shownCount}, follow-up logs {c.followedCount},
                    linked outcomes {c.outcomeLinkedCount}
                    {c.sparseData ? " · sparse / low confidence" : ""}
                    {c.linkStatus === "ambiguous_followup" ? " · some ambiguous timing" : ""}
                  </li>
                ))}
            </ul>
            {effectivenessSummary.stats.categoryCorrelations.every(
              (c) => c.shownCount === 0 && c.outcomeLinkedCount === 0 && c.followedCount === 0,
            ) ? (
              <p className="mt-1 text-[11px] text-slate-600">No category activity in this window yet.</p>
            ) : null}
          </details>
        </section>
      ) : null}
    </div>
  );
}
