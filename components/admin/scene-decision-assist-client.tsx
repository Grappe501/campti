"use client";

import Link from "next/link";
import { useState } from "react";

import { RecommendationEffectivenessAnalyticsPanel } from "@/components/admin/recommendation-effectiveness-analytics-panel";
import { logRecommendationFollowupAction } from "@/app/actions/scene-recommendation-learning";
import type {
  SceneDecisionAssistViewModel,
  SceneDecisionRecommendation,
  SceneDecisionRecommendationAction,
} from "@/lib/domain/scene-decision-assist";
import type {
  SceneRecommendationActionType,
  SceneRecommendationStrengthShiftPolarity,
} from "@/lib/domain/scene-recommendation-learning";

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

function shiftPolarityBadgeClass(p: SceneRecommendationStrengthShiftPolarity): string {
  if (p === "stronger") return "border-emerald-400 bg-emerald-100 text-emerald-950";
  if (p === "weaker") return "border-amber-500 bg-amber-100 text-amber-950";
  return "border-stone-400 bg-stone-100 text-stone-900";
}

function shiftSectionBorderClass(p: SceneRecommendationStrengthShiftPolarity): string {
  if (p === "stronger") return "border-emerald-300 bg-emerald-50/90";
  if (p === "weaker") return "border-amber-300 bg-amber-50/90";
  return "border-slate-300 bg-slate-50/90";
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

      <div className="mt-3 rounded-lg border border-stone-200 bg-white/70 p-3 text-[11px] text-stone-900">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">Why this recommendation</p>
        <p className="mt-1 leading-snug">{r.basis.summary}</p>
      </div>

      {learn ? (
        <div className={`mt-3 rounded-xl border p-3 text-[11px] leading-snug ${shiftSectionBorderClass(learn.strengthShiftPolarity)}`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-700">Why this confidence label changed</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${shiftPolarityBadgeClass(learn.strengthShiftPolarity)}`}
            >
              {learn.strengthShiftPolarity}
            </span>
          </div>
          <p className="mt-2 font-medium text-stone-950">{learn.strengthShiftHeadline}</p>
          {learn.strengthShiftSubline ? <p className="mt-2 text-stone-800">{learn.strengthShiftSubline}</p> : null}
          {learn.ruleBasedStrength !== learn.effectiveStrength ? (
            <p className="mt-2 text-[11px] text-stone-800">
              Rules emitted <span className="font-medium capitalize">{learn.ruleBasedStrength}</span> — displayed label is{" "}
              <span className="font-medium capitalize">{learn.effectiveStrength}</span> after bounded learning (does not change guard policy).
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-stone-700">
              Displayed strength matches rule output after the learning pass (same label, observational notes may still apply).
            </p>
          )}
          {learn.historicalNote ? (
            <div className="mt-3 rounded-lg border border-violet-200/80 bg-violet-50/60 p-2 text-[11px] text-violet-950">
              <p className="font-semibold text-violet-950">Log pattern (observational)</p>
              <p className="mt-1">{learn.historicalNote}</p>
              {learn.confidenceAdjustment.explanation ? (
                <p className="mt-1 text-violet-900">{learn.confidenceAdjustment.explanation}</p>
              ) : null}
              {learn.confidenceAdjustment.notes.length ? (
                <ul className="mt-1 list-inside list-disc text-violet-900">
                  {learn.confidenceAdjustment.notes.map((n) => (
                    <li key={n.text}>
                      ({n.derivation}) {n.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-1 text-[10px] text-violet-800">
                Adjustment kind: <span className="font-mono">{learn.confidenceAdjustment.kind}</span> · History:{" "}
                {learn.historyStatus.replaceAll("_", " ")}
              </p>
            </div>
          ) : learn.historyStatus === "insufficient_history" ? (
            <p className="mt-2 text-[11px] text-stone-600">
              Not enough category-specific history to add a log pattern note — the headline above is the full learning signal for this card.
            </p>
          ) : null}
          {learn.strengthChangeExplanationLines.length ? (
            <details className="mt-3 rounded-lg border border-stone-200 bg-white/80 p-2 text-stone-900">
              <summary className="cursor-pointer text-[11px] font-semibold text-stone-900">Thresholds and technical detail</summary>
              <ul className="mt-2 list-inside list-disc text-[11px] text-stone-800">
                {learn.strengthChangeExplanationLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-sm text-stone-900">{r.recommendationText}</p>
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
  const {
    recommendations,
    summary,
    suppressionsApplied,
    runFocus,
    effectivenessSummary,
    sceneOperatingMode,
    stabilityForecasts,
    stabilityMemory,
  } = initial;

  if (compact) {
    const top = recommendations.primary;
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50/80 p-3 text-xs text-teal-950">
        <p className="font-semibold text-teal-950">Decision assist (this selection)</p>
        {sceneOperatingMode ? (
          <p className="mt-1 text-[11px] text-teal-900">
            Scene mode: <span className="font-medium">{sceneOperatingMode.mode.replaceAll("_", " ")}</span> — {sceneOperatingMode.headline}
          </p>
        ) : null}
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

      {sceneOperatingMode ? (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-950">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-900">Scene operating mode (summary)</p>
          <p className="mt-2 text-sm font-semibold text-indigo-950">
            <span className="rounded-full border border-indigo-400 bg-white px-2 py-0.5 capitalize">{sceneOperatingMode.mode.replaceAll("_", " ")}</span>
          </p>
          <p className="mt-2 text-indigo-950">{sceneOperatingMode.headline}</p>
          <ul className="mt-2 list-inside list-disc text-[11px] text-indigo-900">
            {sceneOperatingMode.trace.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          {sceneOperatingMode.uncertaintyNote ? (
            <p className="mt-2 text-[11px] text-indigo-800">{sceneOperatingMode.uncertaintyNote}</p>
          ) : null}
          <p className="mt-2 text-[10px] text-indigo-800">
            Modes are advisory labels derived from ledger, preflight, research, simulation, and output hints — they do not change launch guard policy.
          </p>
        </section>
      ) : null}

      {stabilityForecasts.length ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-950">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">Early warnings (bounded forecast)</p>
          <ul className="mt-2 space-y-2">
            {stabilityForecasts.map((f) => (
              <li key={f.code} className="rounded-lg border border-amber-200 bg-white/80 p-2">
                <span className="font-medium">{f.label}</span>{" "}
                <span className="text-[10px] text-amber-800">({f.derivation})</span>
                <p className="mt-1 text-[11px] text-amber-950">{f.description}</p>
                <ul className="mt-1 list-inside list-disc text-[10px] text-amber-900">
                  {f.basis.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stabilityMemory ? (
        <details className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-xs text-stone-800">
          <summary className="cursor-pointer font-medium text-stone-900">Scene stability memory (compact)</summary>
          <p className="mt-2 text-[11px]">
            Window runs: {stabilityMemory.windowRunCount} · Risky: {stabilityMemory.riskyLaunchCount} · Blocked: {stabilityMemory.blockedLaunchCount}{" "}
            · Replays: {stabilityMemory.replayAuditCount} · Repairs/revisions: {stabilityMemory.repairOrRevisionCount} · Failed gens:{" "}
            {stabilityMemory.failedGenerationCount}
          </p>
          <p className="mt-1 text-[11px]">
            Research blocking: {stabilityMemory.researchBlockingContradictions ?? "—"} · Sim blocked people:{" "}
            {stabilityMemory.simulationBlockedPersons ?? "—"} · Preflight blockers/risks: {stabilityMemory.preflightPrimaryBlockers}/
            {stabilityMemory.preflightPrimaryRisks}
          </p>
          <p className="mt-1 text-[11px]">
            Output oscillation: {stabilityMemory.outputLengthOscillation ? "yes" : "no"} · Opening/ending shift:{" "}
            {stabilityMemory.outputOpeningEndingShift ? "yes" : "no"} · Repeated blocked saves:{" "}
            {stabilityMemory.repeatedBlockedSaveOutputs ? "yes" : "no"}
          </p>
        </details>
      ) : null}

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

      {effectivenessSummary ? <RecommendationEffectivenessAnalyticsPanel vm={effectivenessSummary} /> : null}
    </div>
  );
}
