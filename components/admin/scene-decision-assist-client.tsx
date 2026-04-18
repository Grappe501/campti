"use client";

import Link from "next/link";
import { useState } from "react";

import type { SceneDecisionAssistViewModel, SceneDecisionRecommendation } from "@/lib/domain/scene-decision-assist";

function strengthClass(s: SceneDecisionRecommendation["strength"]): string {
  if (s === "strong") return "bg-rose-100 text-rose-950 border-rose-300";
  if (s === "moderate") return "bg-amber-100 text-amber-950 border-amber-300";
  if (s === "light") return "bg-sky-100 text-sky-950 border-sky-300";
  return "bg-stone-100 text-stone-800 border-stone-300";
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

  return (
    <article className={`rounded-xl border p-4 ${strengthClass(r.strength)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{r.category.replaceAll("_", " ")}</p>
          <h3 className="mt-1 text-sm font-semibold text-stone-950">{r.title}</h3>
        </div>
        <span className="rounded-full border border-stone-400/50 bg-white/80 px-2 py-0.5 text-[11px] font-medium capitalize">{r.strength}</span>
      </div>
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
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/admin/scenes/${sceneId}?tab=${a.sceneTab}`}
                        className="inline-block rounded-full border border-stone-400 bg-white px-3 py-1 text-xs font-medium text-stone-900 hover:bg-stone-50"
                      >
                        {a.label}
                      </Link>
                    </li>
                  );
                }
                if (a.kind === "href" && a.href) {
                  return (
                    <li key={a.id}>
                      <Link
                        href={a.href}
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
  const { recommendations, summary, suppressionsApplied, runFocus } = initial;

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
    </div>
  );
}
