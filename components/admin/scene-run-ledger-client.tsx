"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { loadSceneDecisionAssistAction } from "@/app/actions/scene-decision-assist";
import { evaluateSceneLaunchGuardAction } from "@/app/actions/scene-launch-guard";
import { loadSceneRunStructuredDiffAction } from "@/app/actions/scene-run-analytics";
import { replaySceneRunAction } from "@/app/actions/scene-run-ledger";
import { SceneDecisionAssistClient } from "@/components/admin/scene-decision-assist-client";
import type { SceneDecisionAssistViewModel } from "@/lib/domain/scene-decision-assist";
import type { SceneLaunchGuardResult } from "@/lib/domain/scene-launch-guard";
import type { SceneRunDiffViewModel, SceneRunOutcomeAnalyticsViewModel } from "@/lib/domain/scene-run-diff-analytics";
import type { SceneRunLedgerEntry, SceneRunLedgerViewModel } from "@/lib/domain/scene-run-ledger";
import { suggestDefaultComparison, suggestMachineVsInteractiveComparison } from "@/lib/services/scene-run-diff-service";

type Props = {
  sceneId: string;
  sceneTitle: string | null;
  initialLedger: SceneRunLedgerViewModel;
  initialGuard: SceneLaunchGuardResult;
  initialAnalytics: SceneRunOutcomeAnalyticsViewModel;
  initialDecisionAssist: SceneDecisionAssistViewModel | null;
};

function eligibilityBadgeClass(e: SceneRunLedgerEntry["replayEligibility"]): string {
  if (e === "replay_allowed") return "bg-emerald-100 text-emerald-950 border-emerald-300";
  if (e === "replay_allowed_with_risk") return "bg-amber-100 text-amber-950 border-amber-300";
  if (e === "replay_blocked") return "bg-rose-100 text-rose-950 border-rose-300";
  if (e === "historical_only") return "bg-slate-100 text-slate-800 border-slate-300";
  return "bg-stone-100 text-stone-800 border-stone-300";
}

function historyBadgeClass(h: SceneRunLedgerEntry["historyCompleteness"]): string {
  if (h === "full") return "text-emerald-800";
  if (h === "partial") return "text-amber-800";
  if (h === "legacy") return "text-violet-800";
  return "text-stone-600";
}

function outputLinkageShortLabel(status: SceneRunLedgerEntry["output"]["linkageStatus"]): string {
  switch (status) {
    case "linked_output":
      return "Linked";
    case "unlinked_output":
      return "Unlinked";
    case "legacy_output_unknown":
      return "Legacy · unknown";
    case "output_not_persisted_by_policy":
      return "Not persisted";
    case "linked_output_missing_artifact":
      return "Link broken";
    default:
      return status;
  }
}

function outputLinkageToneClass(status: SceneRunLedgerEntry["output"]["linkageStatus"]): string {
  switch (status) {
    case "linked_output":
      return "text-emerald-900";
    case "unlinked_output":
      return "text-stone-600";
    case "legacy_output_unknown":
      return "text-violet-900";
    case "output_not_persisted_by_policy":
      return "text-amber-900";
    case "linked_output_missing_artifact":
      return "text-rose-900";
    default:
      return "text-stone-700";
  }
}

function DeltaBlock({
  title,
  completeness,
  lines,
  fields,
}: {
  title: string;
  completeness: string;
  lines: string[];
  fields: { field: string; before: unknown; after: unknown; changed: boolean; kind: string }[];
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-xs font-semibold text-stone-900">{title}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-stone-500">Completeness: {completeness.replaceAll("_", " ")}</p>
      {lines.length ? (
        <ul className="mt-2 list-inside list-disc text-xs text-stone-700">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-2 space-y-1 text-xs">
        {fields
          .filter((f) => f.changed)
          .map((f) => (
            <li key={f.field} className="font-mono text-stone-800">
              <span className="text-stone-500">{f.kind}</span> · {f.field}: {String(f.before)} → {String(f.after)}
            </li>
          ))}
      </ul>
      {fields.every((f) => !f.changed) ? <p className="mt-1 text-xs text-stone-500">No field changes in this category.</p> : null}
    </div>
  );
}

export function SceneRunLedgerClient({
  sceneId,
  sceneTitle,
  initialLedger,
  initialGuard,
  initialAnalytics,
  initialDecisionAssist,
}: Props) {
  const [ledger] = useState(initialLedger);
  const [analytics] = useState(initialAnalytics);
  const [guard, setGuard] = useState(initialGuard);
  const baselineAssist = useRef(initialDecisionAssist);
  const [assistVm, setAssistVm] = useState<SceneDecisionAssistViewModel | null>(initialDecisionAssist);
  const [assistPending, startAssist] = useTransition();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string | null>(() => suggestDefaultComparison(initialLedger.entries)?.ledgerRunKeyA ?? null);
  const [compareB, setCompareB] = useState<string | null>(() => suggestDefaultComparison(initialLedger.entries)?.ledgerRunKeyB ?? null);
  const [diffLine, setDiffLine] = useState<string | null>(null);
  const [structuredDiff, setStructuredDiff] = useState<SceneRunDiffViewModel | null>(null);
  const [riskAck, setRiskAck] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const selected = useMemo(
    () => ledger.entries.find((e) => e.ledgerRunKey === selectedKey) ?? null,
    [ledger.entries, selectedKey],
  );

  useEffect(() => {
    if (selectedKey === null) {
      setAssistVm(baselineAssist.current);
      return;
    }
    startAssist(async () => {
      const r = await loadSceneDecisionAssistAction({ sceneId, ledgerRunKey: selectedKey, maxLedgerEntries: 80 });
      if (r.ok) setAssistVm(r.data);
    });
  }, [selectedKey, sceneId]);

  const refreshGuard = () => {
    setMsg(null);
    start(async () => {
      const r = await evaluateSceneLaunchGuardAction({ sceneId });
      if (!r.ok) {
        setMsg(r.message);
        return;
      }
      setGuard(r.data);
      setRiskAck(false);
    });
  };

  const runReplay = () => {
    if (!selected) return;
    setMsg(null);
    start(async () => {
      const r = await replaySceneRunAction({
        sceneId,
        sourceLedgerRunKey: selected.ledgerRunKey,
        freshnessDigest: guard.freshnessDigest,
        riskAcknowledged: riskAck,
      });
      if (!r.ok) {
        setMsg(`${r.code}: ${r.message}`);
        return;
      }
      setMsg(`Replay completed (non-persisting). Run id: ${r.run.cluster7RuntimeTruth?.runId ?? "—"}`);
    });
  };

  const runCompare = () => {
    setDiffLine(null);
    setStructuredDiff(null);
    if (!compareA || !compareB || compareA === compareB) {
      setDiffLine("Pick two distinct runs.");
      return;
    }
    if (!ledger.entries.some((e) => e.ledgerRunKey === compareA) || !ledger.entries.some((e) => e.ledgerRunKey === compareB)) {
      setDiffLine("Runs not found in loaded page.");
      return;
    }
    start(async () => {
      const r = await loadSceneRunStructuredDiffAction({
        sceneId,
        ledgerRunKeyA: compareA,
        ledgerRunKeyB: compareB,
      });
      if (!r.ok) {
        setDiffLine(r.message);
        return;
      }
      setStructuredDiff(r.data);
      setDiffLine(r.data.diff.headline);
    });
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
        <p className="text-xs uppercase tracking-widest text-stone-500">Run Ledger</p>
        <h2 className="mt-1 text-lg font-semibold text-stone-900">Scene generation history</h2>
        <p className="mt-2 text-sm text-stone-700">
          Curated from launch audits. Historical rows may be <span className="font-medium">partial</span> or{" "}
          <span className="font-medium">legacy</span> if they predate full classification. Replay always uses{" "}
          <span className="font-medium">current</span> guard truth and does <span className="font-medium">not</span> save
          generation text.
        </p>
        {sceneTitle ? <p className="mt-2 text-sm text-stone-600">Scene: {sceneTitle}</p> : null}
      </header>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Outcome analytics (this scene)</h3>
        <p className="mt-1 text-xs text-stone-600">
          Operational signals from the ledger window — not a literary quality score. Heuristics are labeled; facts come from audits.
        </p>
        <div className="mt-3 grid gap-3 text-xs text-stone-800 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-indigo-100 bg-white p-2">
            <p className="font-medium text-stone-900">Launch allowance (window)</p>
            <p>allowed: {analytics.summary.allowanceDistribution.allowed}</p>
            <p>allowed_with_risk: {analytics.summary.allowanceDistribution.allowed_with_risk}</p>
            <p>blocked: {analytics.summary.allowanceDistribution.blocked}</p>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-white p-2">
            <p className="font-medium text-stone-900">Launch class mix</p>
            <p>interactive: {analytics.summary.interactiveRunCount}</p>
            <p>machine: {analytics.summary.machineRunCount}</p>
            <p>rehearsal: {analytics.summary.rehearsalRunCount}</p>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-white p-2">
            <p className="font-medium text-stone-900">Churn signals</p>
            <p>repair/revision runs: {analytics.summary.repairOrRevisionRunCount}</p>
            <p>replay audits: {analytics.summary.replayAttemptCount}</p>
            <p>failed gens: {analytics.summary.failedGenerationCount}</p>
          </div>
        </div>
        {analytics.trend.trendNote ? <p className="mt-3 text-xs text-amber-900">{analytics.trend.trendNote}</p> : null}
        {analytics.instabilitySignals.length ? (
          <div className="mt-3">
            <p className="text-xs font-medium text-stone-900">Instability / pressure (mixed fact & heuristic)</p>
            <ul className="mt-1 space-y-1 text-xs text-stone-800">
              {analytics.instabilitySignals.map((s) => (
                <li key={s.code}>
                  <span className="font-medium">{s.label}</span>{" "}
                  <span className="text-stone-500">({s.kind})</span> — {s.description}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {analytics.pressureSources.length ? (
          <div className="mt-3">
            <p className="text-xs font-medium text-stone-900">Likely pressure sources (advisory, not causal)</p>
            <ul className="mt-1 space-y-1 text-xs text-stone-800">
              {analytics.pressureSources.map((p) => (
                <li key={p.sourceId}>
                  <span className="font-medium">{p.label}</span>{" "}
                  <span className="text-stone-500">(indicative ×{p.indicativeCount})</span> — {p.description}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {analytics.currentGenerationTextStats ? (
          <p className="mt-3 text-xs text-stone-600">
            Current scene <span className="font-medium">generationText</span> (context only, not per-run):{" "}
            {analytics.currentGenerationTextStats.present
              ? `${analytics.currentGenerationTextStats.characterCount} chars, ~${analytics.currentGenerationTextStats.paragraphCount} paragraphs`
              : "empty"}
          </p>
        ) : null}
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2 text-[11px] text-amber-950">
          <p className="font-medium">Advisory next steps (never auto-executed)</p>
          <ul className="mt-1 list-inside list-disc">
            <li>If risky launches dominate — open Preflight and resolve downgrade sources before replay.</li>
            <li>If repair/revision churn is high — triage root blockers instead of repeated automation.</li>
            <li>Replay only via the guarded replay button below — analytics do not mutate prose.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Structured run diff</h3>
        <p className="mt-1 text-xs text-stone-600">
          Separates governance, preflight proxies, execution, and output linkage. When both runs have durable{" "}
          <span className="font-medium">SceneRunGenerationOutput</span> rows, bounded signals (length, opening/ending
          fingerprints, scene-linked entity mentions) load below — factual and bounded, not a prose-quality score.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100"
            onClick={() => {
              const p = suggestDefaultComparison(ledger.entries);
              if (p) {
                setCompareA(p.ledgerRunKeyA);
                setCompareB(p.ledgerRunKeyB);
              }
            }}
          >
            Preset: latest vs previous
          </button>
          <button
            type="button"
            className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100"
            onClick={() => {
              const p = suggestMachineVsInteractiveComparison(ledger.entries);
              if (p) {
                setCompareA(p.ledgerRunKeyA);
                setCompareB(p.ledgerRunKeyB);
              }
            }}
          >
            Preset: interactive vs machine (first match)
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-stone-600">
            Run A
            <select
              className="ml-1 mt-1 block rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900"
              value={compareA ?? ""}
              onChange={(e) => setCompareA(e.target.value || null)}
            >
              <option value="">—</option>
              {ledger.entries.map((e) => (
                <option key={e.ledgerRunKey} value={e.ledgerRunKey}>
                  {e.startedAtIso.slice(0, 19)} · {e.audit.launchClass ?? "—"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-stone-600">
            Run B
            <select
              className="ml-1 mt-1 block rounded border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900"
              value={compareB ?? ""}
              onChange={(e) => setCompareB(e.target.value || null)}
            >
              <option value="">—</option>
              {ledger.entries.map((e) => (
                <option key={`b-${e.ledgerRunKey}`} value={e.ledgerRunKey}>
                  {e.startedAtIso.slice(0, 19)} · {e.audit.launchClass ?? "—"}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={runCompare}
            disabled={pending}
            className="rounded-full border border-stone-400 bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-900 hover:bg-stone-200 disabled:opacity-50"
          >
            Compare
          </button>
        </div>
        {diffLine ? <p className="mt-3 text-sm font-medium text-stone-900">{diffLine}</p> : null}
        {structuredDiff ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-stone-500">
              Overall completeness: {structuredDiff.diff.overallCompleteness.replaceAll("_", " ")} · model v{structuredDiff.contractVersion}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <DeltaBlock
                title="Governance delta"
                completeness={structuredDiff.diff.governance.completeness}
                lines={structuredDiff.diff.governance.summaryLines}
                fields={structuredDiff.diff.governance.fields}
              />
              <DeltaBlock
                title="Preflight delta (audit proxies)"
                completeness={structuredDiff.diff.preflight.completeness}
                lines={structuredDiff.diff.preflight.summaryLines}
                fields={structuredDiff.diff.preflight.fields}
              />
              <DeltaBlock
                title="Execution delta"
                completeness={structuredDiff.diff.execution.completeness}
                lines={structuredDiff.diff.execution.summaryLines}
                fields={structuredDiff.diff.execution.fields}
              />
              <DeltaBlock
                title="Output / artifact delta"
                completeness={structuredDiff.diff.output.completeness}
                lines={structuredDiff.diff.output.summaryLines}
                fields={structuredDiff.diff.output.fields}
              />
            </div>
            {structuredDiff.diff.output.boundedComparison ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-xs font-semibold text-emerald-950">Bounded prose comparison</p>
                <p className="mt-1 text-[11px] text-emerald-900">{structuredDiff.diff.output.boundedComparison.linkageNote}</p>
                <p className="mt-2 text-[11px] text-emerald-900">
                  {structuredDiff.diff.output.boundedComparison.existence.summary}
                </p>
                <div className="mt-2 grid gap-2 text-xs text-emerald-950 sm:grid-cols-2">
                  <div className="rounded border border-emerald-100 bg-white/80 p-2">
                    <p className="font-medium">Opening</p>
                    <p className="mt-1 text-[11px] text-emerald-900">{structuredDiff.diff.output.boundedComparison.opening.summary}</p>
                  </div>
                  <div className="rounded border border-emerald-100 bg-white/80 p-2">
                    <p className="font-medium">Ending</p>
                    <p className="mt-1 text-[11px] text-emerald-900">{structuredDiff.diff.output.boundedComparison.ending.summary}</p>
                  </div>
                </div>
                <div className="mt-2 rounded border border-emerald-100 bg-white/80 p-2 text-xs text-emerald-950">
                  <p className="font-medium">Length & structure</p>
                  <p className="mt-1 text-[11px]">
                    Chars Δ {structuredDiff.diff.output.boundedComparison.length.charDelta ?? "—"} · ¶ Δ{" "}
                    {structuredDiff.diff.output.boundedComparison.length.paragraphDelta ?? "—"} ·{" "}
                    {structuredDiff.diff.output.boundedComparison.length.charDeltaLabel ?? "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-900">{structuredDiff.diff.output.boundedComparison.structure.summary}</p>
                </div>
                {structuredDiff.diff.output.boundedComparison.signals.length ? (
                  <ul className="mt-2 list-inside list-disc text-xs text-emerald-950">
                    {structuredDiff.diff.output.boundedComparison.signals.map((s) => (
                      <li key={s.code}>
                        <span className="font-medium">{s.label}</span>{" "}
                        <span className="text-emerald-800">({s.derivation})</span> — {s.description}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {structuredDiff.diff.output.boundedComparison.entityMentions.length ? (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-emerald-950">Scene-linked entity mentions (approximate)</p>
                    <ul className="mt-1 max-h-32 overflow-y-auto text-[11px] text-emerald-900">
                      {structuredDiff.diff.output.boundedComparison.entityMentions.slice(0, 12).map((e) => (
                        <li key={`${e.entityId}-${e.label}`}>
                          {e.kind} · {e.label}: {e.countA} → {e.countB}
                          {e.delta !== 0 ? ` (Δ ${e.delta > 0 ? "+" : ""}${e.delta})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3 text-xs text-stone-700">
                <p className="font-medium text-stone-900">Bounded prose comparison</p>
                <p className="mt-1 text-[11px]">
                  Not shown: requires two runs with durable linked snapshots (
                  <span className="font-medium">linked_output</span>) and successful load from{" "}
                  <span className="font-medium">SceneRunGenerationOutput</span>. Older or policy-skipped runs stay
                  explicit in the output delta above — no guessed prose pairing.
                </p>
              </div>
            )}
            {structuredDiff.diff.outcomeSignals.heuristics.length ? (
              <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
                <p className="text-xs font-semibold text-violet-950">Advisory heuristics (not quality scores)</p>
                <ul className="mt-2 space-y-2 text-xs text-violet-950">
                  {structuredDiff.diff.outcomeSignals.heuristics.map((h) => (
                    <li key={h.id}>
                      <span className="font-medium">{h.label}</span> ({h.strength}, {h.derivedFrom}) — {h.basis}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {structuredDiff.diff.outcomeSignals.factualNotes.length ? (
              <ul className="list-inside list-disc text-xs text-stone-700">
                {structuredDiff.diff.outcomeSignals.factualNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th className="px-3 py-2">Started (UTC)</th>
              <th className="px-3 py-2">Class / source</th>
              <th className="px-3 py-2">Allowance → outcome</th>
              <th className="px-3 py-2">Digest / hash</th>
              <th className="px-3 py-2">Output</th>
              <th className="px-3 py-2">History</th>
              <th className="px-3 py-2">Replay</th>
              <th className="px-3 py-2"> </th>
            </tr>
          </thead>
          <tbody>
            {ledger.entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-stone-600">
                  No launch audits recorded for this scene yet.
                </td>
              </tr>
            ) : (
              ledger.entries.map((e) => (
                <tr key={e.ledgerRunKey} className="border-b border-stone-100 hover:bg-stone-50/80">
                  <td className="px-3 py-2 font-mono text-xs text-stone-800">{e.startedAtIso.slice(0, 19)}</td>
                  <td className="px-3 py-2 text-stone-800">
                    <div>{e.audit.launchClass ?? "—"}</div>
                    <div className="text-xs text-stone-500">{e.audit.launchSource ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-stone-800">
                    <div>{e.historicalGuard.launchAllowance ?? "—"}</div>
                    <div className="text-xs text-stone-500">
                      {e.output.generationFailed ? "failed" : e.output.generationFinished ? "finished" : "incomplete"}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-stone-700">
                    {e.historicalGuard.freshnessDigestPrefix ?? "—"}
                    <div className="text-stone-500">{e.historicalGuard.inputHashPreview?.slice(0, 24) ?? ""}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className={`font-medium ${outputLinkageToneClass(e.output.linkageStatus)}`}>
                      {outputLinkageShortLabel(e.output.linkageStatus)}
                    </div>
                    {e.output.linkageStatus === "linked_output" &&
                    e.output.storedCharacterCount != null &&
                    e.output.storedParagraphCount != null ? (
                      <div className="text-[11px] text-stone-500">
                        {e.output.storedCharacterCount} ch · {e.output.storedParagraphCount} ¶
                        {e.output.outputCompleteness ? (
                          <span className="block truncate" title={e.output.outputCompleteness}>
                            {e.output.outputCompleteness.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                  <td className={`px-3 py-2 text-xs font-medium ${historyBadgeClass(e.historyCompleteness)}`}>
                    {e.historyCompleteness}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${eligibilityBadgeClass(e.replayEligibility)}`}
                    >
                      {e.replayEligibility.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKey(e.ledgerRunKey);
                        setMsg(null);
                      }}
                      className="text-amber-900 underline-offset-2 hover:underline"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-500">
        Ledger contract v{ledger.summary.contractVersion} · {ledger.summary.totalEntries} runs shown ·{" "}
        {ledger.summary.legacyOrPartialCount} partial/legacy
      </p>

      {selected && assistVm ? (
        <div className="relative">
          {assistPending ? (
            <p className="absolute right-0 top-0 text-[11px] text-stone-500" aria-live="polite">
              Refreshing decision assist…
            </p>
          ) : null}
          <SceneDecisionAssistClient sceneId={sceneId} initial={assistVm} compact />
        </div>
      ) : null}

      {selected ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">Run detail / replay panel</h3>
          <div className="mt-3 grid gap-3 text-sm text-stone-800 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-stone-500">Historical guard</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>Allowance: {selected.historicalGuard.launchAllowance ?? "—"}</li>
                <li>Confirmation mode (audit): {selected.audit.confirmationMode ?? "—"}</li>
                <li>Intent: {selected.historicalGuard.intent ?? "—"}</li>
                <li>
                  Blockers / risks: {selected.historicalGuard.blockerCount ?? "—"} / {selected.historicalGuard.riskCount ?? "—"}
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Execution</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>Cluster7 run id: {selected.output.cluster7RunId ?? "—"}</li>
                <li>Persisted output known: {selected.output.persistedOutputKnown ? "yes" : "no (honest default)"}</li>
                <li>Ended: {selected.endedAtIso?.slice(0, 19) ?? "—"}</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-700">
            <p className="font-medium text-stone-900">Current preflight (replay feasibility)</p>
            <p className="mt-1">Allowance: {guard.launchAllowance}</p>
            <p>Digest prefix: {guard.freshnessDigest.slice(0, 16)}…</p>
            <button
              type="button"
              onClick={refreshGuard}
              disabled={pending}
              className="mt-2 rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-50"
            >
              Refresh guard
            </button>
            {guard.launchAllowance === "allowed_with_risk" ? (
              <label className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={riskAck} onChange={(e) => setRiskAck(e.target.checked)} />
                I acknowledge downgrade risk for this replay
              </label>
            ) : null}
            <button
              type="button"
              onClick={runReplay}
              disabled={
                pending ||
                selected.replayEligibility === "replay_blocked" ||
                selected.replayEligibility === "historical_only" ||
                selected.replayEligibility === "insufficient_history" ||
                (selected.replayEligibility === "replay_allowed_with_risk" && !riskAck)
              }
              className="mt-3 rounded-full bg-amber-700 px-4 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-800 disabled:opacity-40"
            >
              Run governed replay (no save)
            </button>
          </div>
          {selected.replayNotes.length ? (
            <ul className="mt-3 list-inside list-disc text-xs text-stone-700">
              {selected.replayNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {msg ? (
        <p className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800" role="status">
          {msg}
        </p>
      ) : null}

      <p className="text-xs text-stone-600">
        Open{" "}
        <Link href={`/admin/scenes/${sceneId}?tab=preflight`} className="font-medium text-amber-900 hover:underline">
          Preflight
        </Link>{" "}
        for full subsystem breakdown,{" "}
        <Link href={`/admin/scenes/${sceneId}?tab=assist`} className="font-medium text-teal-900 hover:underline">
          Decision assist
        </Link>{" "}
        for traceable recommendations, or{" "}
        <Link href={`/admin/narrative?scope=scene&sceneId=${sceneId}`} className="font-medium text-amber-900 hover:underline">
          Author cockpit (scene)
        </Link>
        .
      </p>
    </div>
  );
}
