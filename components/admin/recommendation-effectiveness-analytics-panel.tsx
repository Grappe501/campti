"use client";

import type { SceneRecommendationEffectivenessViewModel } from "@/lib/domain/scene-recommendation-learning";

function pct(n: number | null): string {
  if (n === null) return "—";
  return `${n}%`;
}

function historyBadgeClass(status: string): string {
  if (status === "insufficient_history") return "bg-stone-200 text-stone-900 border-stone-400";
  if (status === "low_confidence_pattern") return "bg-amber-100 text-amber-950 border-amber-300";
  if (status === "ambiguous_followup") return "bg-violet-100 text-violet-950 border-violet-300";
  return "bg-emerald-100 text-emerald-950 border-emerald-300";
}

type Props = {
  vm: SceneRecommendationEffectivenessViewModel;
};

export function RecommendationEffectivenessAnalyticsPanel({ vm }: Props) {
  const { stats, honestyBanner, overallHistoryStatus, followup } = vm;
  const snap = stats.replayRepairSnapshot;

  const rows = stats.categoryCorrelations.filter(
    (c) => c.shownCount > 0 || c.outcomeLinkedCount > 0 || c.followedCount > 0,
  );

  return (
    <section className="rounded-xl border border-slate-300 bg-gradient-to-b from-slate-50 to-white p-4 text-xs text-slate-900 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Recommendation effectiveness analytics</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">Which categories actually helped in this scene (observational)</p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${historyBadgeClass(overallHistoryStatus)}`}
        >
          {overallHistoryStatus.replaceAll("_", " ")}
        </span>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-800">{honestyBanner}</p>

      <p className="mt-3 text-[11px] text-slate-800">
        Window: last <span className="font-medium">{stats.windowDays}</span> days · Advice shown events:{" "}
        <span className="font-mono tabular-nums">{stats.totalShownEvents}</span> · Ledger-linked outcomes:{" "}
        <span className="font-mono tabular-nums">{stats.totalOutcomeLinkedEvents}</span> · Evaluated{" "}
        <span className="font-mono text-[10px] text-slate-600">{vm.evaluatedAtIso.slice(0, 19)}Z</span>
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-900">Replay-oriented (replay now)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-rose-950">
            {snap.replayNow.shownCount} <span className="text-sm font-normal text-rose-800">shown</span>
          </p>
          <p className="mt-1 text-lg font-medium tabular-nums text-rose-900">
            {snap.replayNow.followedCount} <span className="text-sm font-normal text-rose-800">follow-up logs</span>
          </p>
          <p className="mt-2 text-[11px] text-rose-900">
            Follow-through rate: <span className="font-mono font-semibold">{pct(snap.replayNow.followRatePercent)}</span> of shows
          </p>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-900">Repair-first (repair instead of replay)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-teal-950">
            {snap.repairInstead.shownCount} <span className="text-sm font-normal text-teal-800">shown</span>
          </p>
          <p className="mt-1 text-lg font-medium tabular-nums text-teal-900">
            {snap.repairInstead.followedCount} <span className="text-sm font-normal text-teal-800">follow-up logs</span>
          </p>
          <p className="mt-2 text-[11px] text-teal-900">
            Follow-through rate: <span className="font-mono font-semibold">{pct(snap.repairInstead.followRatePercent)}</span> of shows
          </p>
        </div>
      </div>

      {followup.lastActionAtIso ? (
        <p className="mt-3 text-[11px] text-slate-800">
          Recent follow-up actions: {followup.recentActionTypes.slice(-8).join(", ").replaceAll("_", " ") || "—"} · last logged{" "}
          {followup.lastActionAtIso.slice(0, 19)}Z
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-slate-600">No follow-up navigation events logged in this window — follow rates stay at zero until actions are recorded.</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-[720px] w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 text-[10px] uppercase tracking-wide text-slate-700">
              <th className="px-2 py-2 font-semibold">Category</th>
              <th className="px-2 py-2 font-semibold tabular-nums">Shown</th>
              <th className="px-2 py-2 font-semibold tabular-nums">Followed</th>
              <th className="px-2 py-2 font-semibold">Clean / risky / blocked</th>
              <th className="px-2 py-2 font-semibold">Churn pressure</th>
              <th className="px-2 py-2 font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-slate-600">
                  No category-level activity in this window — effectiveness metrics will populate as recommendations are shown and launches are linked.
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const d = c.subsequentAllowanceDistribution;
                const churnLabel =
                  c.churnPressureShare === null
                    ? "—"
                    : `${Math.round(c.churnPressureShare * 100)}% non-clean (linked)`;
                const sparseLabel = c.sparseData ? "Sparse" : c.historyStatus === "low_confidence_pattern" ? "Low confidence" : "OK";
                return (
                  <tr key={c.category} className="border-b border-slate-100 align-top hover:bg-slate-50/80">
                    <td className="px-2 py-2 font-medium capitalize text-slate-950">{c.category.replaceAll("_", " ")}</td>
                    <td className="px-2 py-2 tabular-nums text-slate-800">{c.shownCount}</td>
                    <td className="px-2 py-2 tabular-nums text-slate-800">{c.followedCount}</td>
                    <td className="px-2 py-2 text-slate-800">
                      {c.outcomeLinkedCount === 0 ? (
                        <span className="text-slate-500">No linked outcomes</span>
                      ) : (
                        <span>
                          {d.allowed} / {d.allowed_with_risk} / {d.blocked}
                          {d.failed_generation ? ` (+${d.failed_generation} fail)` : ""}
                          {d.unknown ? ` · ${d.unknown} unk` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-slate-800">{churnLabel}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                          c.sparseData || c.historyStatus === "insufficient_history"
                            ? "border-amber-300 bg-amber-50 text-amber-950"
                            : "border-slate-200 bg-white text-slate-800"
                        }`}
                      >
                        {sparseLabel}
                      </span>
                      {c.linkStatus === "ambiguous_followup" ? (
                        <span className="ml-1 text-[10px] text-violet-800">ambiguous link</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-[11px] font-semibold text-slate-900">Why learning would nudge strength (or leave it unchanged)</p>
          <ul className="space-y-3">
            {rows.map((c) => (
              <li key={`insight-${c.category}`} className="rounded-lg border border-slate-200 bg-slate-50/90 p-3">
                <p className="font-medium capitalize text-slate-950">{c.category.replaceAll("_", " ")}</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-slate-800">
                  {(c.operatorInsightLines ?? []).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-[10px] leading-snug text-slate-600">
        “Churn pressure” is the share of linked subsequent launches that were not fully clean (risky, blocked, or failed generation). It is a bounded
        proxy, not artistic causality. Categories with sparse labels have too few shows or linked outcomes to treat correlations as predictive.
      </p>
    </section>
  );
}
