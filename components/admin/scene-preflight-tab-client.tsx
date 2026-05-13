"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { evaluateSceneLaunchGuardAction } from "@/app/actions/scene-launch-guard";
import { recomputeSceneGenerationPreflightAction } from "@/app/actions/scene-generation-preflight";
import { SceneGenerationLaunchPanel } from "@/components/admin/scene-generation-launch-panel";
import type {
  SceneGenerationLaunchAllowance,
  SceneGenerationPreflightViewModel,
  SceneGenerationReadinessClass,
  SceneGenerationSubsystemKey,
  SceneGenerationSubsystemStatus,
} from "@/lib/domain/scene-generation-preflight";
import type { SceneLaunchGuardResult } from "@/lib/domain/scene-launch-guard";

type Props = {
  initial: SceneGenerationPreflightViewModel;
  initialGuard: SceneLaunchGuardResult;
  sceneId: string;
  sceneTitle: string | null;
};

const SUBSYSTEM_LABEL: Record<SceneGenerationSubsystemKey, string> = {
  scene_input: "Scene input",
  canonical_hash: "Canonical hash",
  governance: "Governance",
  human_gravity: "Human gravity",
  character_simulation: "Character simulation",
  research_canon: "Research canon",
  prompt_assembly: "Prompt assembly",
  execution_environment: "Execution environment",
  final_execution_truth: "Final execution truth",
};

function allowanceLabel(a: SceneGenerationLaunchAllowance): string {
  if (a === "blocked") return "Launch blocked";
  if (a === "allowed_with_risk") return "Launch allowed with risk";
  return "Launch allowed";
}

function allowanceBarClass(a: SceneGenerationLaunchAllowance): string {
  if (a === "blocked") return "border-rose-300 bg-rose-50";
  if (a === "allowed_with_risk") return "border-amber-300 bg-amber-50";
  return "border-emerald-300 bg-emerald-50";
}

function readinessBadgeClass(rc: SceneGenerationReadinessClass): string {
  if (rc === "blocked") return "bg-rose-900 text-rose-50";
  if (rc === "downgrade_risk") return "bg-amber-900 text-amber-50";
  if (rc === "ready_with_advisories") return "bg-amber-800 text-amber-50";
  if (rc === "ready") return "bg-emerald-900 text-emerald-50";
  if (rc === "observational_only") return "bg-slate-600 text-slate-50";
  if (rc === "rehearsal_incomplete") return "bg-violet-900 text-violet-50";
  return "bg-stone-700 text-stone-50";
}

function subsystemCardBorder(s: SceneGenerationSubsystemStatus): string {
  if (s.isBlocker) return "border-rose-200";
  if (s.isDowngradeRisk) return "border-amber-200";
  if (s.isAdvisory) return "border-amber-100";
  if (s.isObservationalOnly) return "border-slate-200";
  return "border-emerald-100";
}

function preflightServerSyncKey(
  m: SceneGenerationPreflightViewModel,
  g: SceneLaunchGuardResult,
): string {
  return `${m.summary.evaluatedAtIso}|${g.freshnessDigest}`;
}

export function ScenePreflightTabClient({ initial, initialGuard, sceneId, sceneTitle }: Props) {
  const router = useRouter();
  const [model, setModel] = useState(initial);
  const [guard, setGuard] = useState(initialGuard);
  const [lastServerSyncKey, setLastServerSyncKey] = useState(() =>
    preflightServerSyncKey(initial, initialGuard),
  );
  const [pending, start] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [detailKey, setDetailKey] = useState<SceneGenerationSubsystemKey | null>(null);

  const serverSyncKey = preflightServerSyncKey(initial, initialGuard);
  if (serverSyncKey !== lastServerSyncKey) {
    setLastServerSyncKey(serverSyncKey);
    setModel(initial);
    setGuard(initialGuard);
  }

  const detailSubsystem = useMemo(
    () => (detailKey ? model.subsystems.find((s) => s.subsystemKey === detailKey) ?? null : null),
    [detailKey, model.subsystems],
  );

  function rerun() {
    setActionError(null);
    start(async () => {
      const r = await recomputeSceneGenerationPreflightAction(sceneId);
      if (r.ok && "data" in r && r.data) {
        setModel(r.data);
        const eg = await evaluateSceneLaunchGuardAction({ sceneId });
        if (eg.ok) setGuard(eg.data);
        router.refresh();
        return;
      }
      setActionError("message" in r ? r.message : "Preflight recompute failed.");
    });
  }

  const { summary } = model;

  return (
    <div className="space-y-6">
      <SceneGenerationLaunchPanel
        key={`${model.summary.evaluatedAtIso}-${guard.freshnessDigest.slice(0, 12)}`}
        sceneId={sceneId}
        sceneTitle={sceneTitle}
        initialGuard={guard}
      />

      {/* Global launch status */}
      <section className={`rounded-2xl border-2 p-4 shadow-sm ${allowanceBarClass(summary.launchAllowance)}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-800">Launch status</p>
            <p className="mt-1 text-lg font-semibold text-stone-950">{allowanceLabel(summary.launchAllowance)}</p>
            <p className="mt-1 max-w-3xl text-sm text-stone-800">{summary.headline}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-700">
              <span className={`rounded-full px-2 py-0.5 font-medium ${readinessBadgeClass(summary.overallReadinessClass)}`}>
                Overall: {summary.overallReadinessClass.replaceAll("_", " ")}
              </span>
              <span>Evaluated {summary.evaluatedAtIso}</span>
              <span className="tabular-nums">
                Blockers {summary.primaryBlockerCount} · Risks {summary.primaryRiskCount} · Advisories {summary.advisoryCount}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={rerun}
            disabled={pending}
            className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-60"
          >
            {pending ? "Re-evaluating…" : "Re-run preflight"}
          </button>
        </div>
      </section>

      {actionError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{actionError}</p> : null}

      <p className="text-xs text-stone-600">{model.honestyBanner}</p>

      {/* Subsystem grid */}
      <section>
        <h3 className="text-sm font-semibold text-stone-900">Subsystem status</h3>
        <p className="mt-1 text-xs text-stone-600">Each row reflects the same canonical loaders and services used on the generation path.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {model.subsystems.map((s) => (
            <div key={s.subsystemKey} className={`rounded-xl border bg-white p-3 shadow-sm ${subsystemCardBorder(s)}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{SUBSYSTEM_LABEL[s.subsystemKey]}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${readinessBadgeClass(s.readinessClass)}`}>
                  {s.readinessClass.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-900">{s.title}</p>
              <p className="mt-1 text-xs text-stone-600">{s.explanation}</p>
              <p className="mt-2 font-mono text-[10px] leading-snug text-stone-500">{s.evidenceSummary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-amber-900 hover:underline"
                  onClick={() => setDetailKey(s.subsystemKey)}
                >
                  View details
                </button>
                {s.remediationHref && s.remediationLabel ? (
                  <Link href={s.remediationHref} className="text-xs font-medium text-violet-900 hover:underline">
                    {s.remediationLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {detailSubsystem ? (
        <div className="rounded-xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-800">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-stone-900">{SUBSYSTEM_LABEL[detailSubsystem.subsystemKey]}</p>
            <button type="button" className="text-xs text-stone-600 hover:underline" onClick={() => setDetailKey(null)}>
              Close
            </button>
          </div>
          <p className="mt-2">{detailSubsystem.explanation}</p>
          <p className="mt-2 font-mono text-xs text-stone-600">{detailSubsystem.evidenceSummary}</p>
          {detailSubsystem.remediationGuidance ? <p className="mt-2 text-xs text-stone-700">{detailSubsystem.remediationGuidance}</p> : null}
        </div>
      ) : null}

      {/* Blockers */}
      <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-rose-950">Blockers</h3>
        <p className="mt-1 text-xs text-rose-900">These conditions stop a canonical model generation run from succeeding or from being truth-safe.</p>
        {model.blockers.length === 0 ? (
          <p className="mt-3 text-sm text-rose-900/80">No blockers for this snapshot.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {model.blockers.map((b) => (
              <li key={b.id} className="rounded-lg border border-rose-200 bg-white p-3 text-sm text-stone-900">
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-stone-500">{SUBSYSTEM_LABEL[b.subsystemKey]}</p>
                <p className="mt-2 text-sm text-stone-800">{b.explanation}</p>
                <p className="mt-2 text-xs text-stone-600">{b.remediationGuidance}</p>
                {b.remediationHref && b.remediationLabel ? (
                  <Link href={b.remediationHref} className="mt-2 inline-block text-xs font-medium text-rose-900 hover:underline">
                    {b.remediationLabel} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Downgrade risks */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-amber-950">Downgrade risks</h3>
        <p className="mt-1 text-xs text-amber-900">Generation may proceed, but quality or truth integrity may be reduced.</p>
        {model.risks.length === 0 ? (
          <p className="mt-3 text-sm text-amber-950/80">No downgrade-risk rows for this snapshot.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {model.risks.map((r) => (
              <li key={r.id} className="rounded-lg border border-amber-200 bg-white p-3 text-sm text-stone-900">
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-stone-500">{SUBSYSTEM_LABEL[r.subsystemKey]}</p>
                <p className="mt-1 text-sm text-stone-800">{r.explanation}</p>
                {r.remediationHref && r.remediationLabel ? (
                  <Link href={r.remediationHref} className="mt-2 inline-block text-xs font-medium text-amber-900 hover:underline">
                    {r.remediationLabel} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Advisory */}
      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Advisories</h3>
        <p className="mt-1 text-xs text-stone-600">Softer signals — not launch blockers and not framed as quality-downgrade risks.</p>
        {model.advisories.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">No advisories.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-800">
            {model.advisories.map((a) => (
              <li key={a.id}>
                <span className="text-xs text-stone-500">[{SUBSYSTEM_LABEL[a.subsystemKey]}]</span> {a.title} — {a.explanation}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Observations */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Observational notes</h3>
        <p className="mt-1 text-xs text-slate-600">Context that does not gate launch.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
          {model.observations.map((o) => (
            <li key={o.id}>
              <span className="text-xs text-slate-500">[{SUBSYSTEM_LABEL[o.subsystemKey]}]</span> {o.text}
            </li>
          ))}
        </ul>
      </section>

      {/* Input / hash summary */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Canonical input and hash</h3>
        <dl className="mt-3 grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-stone-500">Input load</dt>
            <dd>{model.inputTruth.loadSucceeded ? "Succeeded" : `Failed: ${model.inputTruth.loadError ?? "unknown"}`}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Participating people</dt>
            <dd className="tabular-nums">{model.inputTruth.participatingPeopleCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Primary place</dt>
            <dd className="tabular-nums">{model.inputTruth.placesCount ? "Linked" : "None"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Narrative source ids</dt>
            <dd className="tabular-nums">{model.inputTruth.narrativeSourceIdsCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">RICRE bundle on input</dt>
            <dd>
              {model.inputTruth.ricreBundlePresent ? `Yes (${model.inputTruth.ricreRecordCount} rows)` : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Hash</dt>
            <dd>
              {model.hashSummary.hashComputed ? (
                <span className="font-mono text-xs">{model.hashSummary.hashPreview}</span>
              ) : (
                <span className="text-rose-800">Not computed{model.hashSummary.hashError ? `: ${model.hashSummary.hashError}` : ""}</span>
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-stone-600">{model.hashSummary.protectsSummary}</p>
      </section>

      {/* Launch boundary */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">What preflight does and does not do</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
          <li>Assembles the same `SceneGenerationInput` merge path used for hashing and cockpit inspection (read-only).</li>
          <li>Surfaces enforcement registry errors, human gravity influence truth, character simulation workbench rollups, and RICRE scene summaries.</li>
          <li>Does not call the LLM, does not write prose, and does not produce a FinalExecutionPackage or Cluster 7 envelope.</li>
          <li>Higher-order manuscript policy and author intent still supersede any green subsystem row.</li>
        </ul>
      </section>

      {/* Remediation actions */}
      <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-violet-950">Remediation</h3>
        <ul className="mt-2 flex flex-col gap-2 text-sm text-violet-950">
          <li>
            <Link href={`/admin/scenes/${sceneId}?tab=research`} className="font-medium hover:underline">
              Scene Research tab
            </Link>
          </li>
          <li>
            <Link href={`/admin/research?sceneId=${sceneId}`} className="font-medium hover:underline">
              Research workbench (scene filter)
            </Link>
          </li>
          <li>
            <Link href={`/admin/narrative?scope=scene&sceneId=${sceneId}`} className="font-medium hover:underline">
              Author cockpit (scene scope)
            </Link>
          </li>
          <li>
            <Link href={`/admin/scenes/${sceneId}/workspace`} className="font-medium hover:underline">
              Scene workspace (draft + entities)
            </Link>
          </li>
          <li>
            <button type="button" onClick={rerun} disabled={pending} className="text-left font-medium text-violet-950 hover:underline disabled:opacity-60">
              Re-run preflight
            </button>
          </li>
        </ul>
      </section>

      {/* Advanced */}
      <section className="rounded-xl border border-stone-200 bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-900"
          onClick={() => setAdvancedOpen((o) => !o)}
        >
          Advanced inspection
          <span className="text-xs text-stone-500">{advancedOpen ? "▼" : "▶"}</span>
        </button>
        {advancedOpen ? (
          <div className="border-t border-stone-100 px-4 py-3 text-xs text-stone-700">
            <p className="font-semibold text-stone-900">Subsystem evidence (raw)</p>
            <ul className="mt-2 space-y-2 font-mono leading-snug">
              {model.subsystems.map((s) => (
                <li key={s.subsystemKey}>
                  <span className="text-stone-500">{s.subsystemKey}:</span> {s.evidenceSummary}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-semibold text-stone-900">Summary record</p>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-stone-50 p-2 text-[10px]">{JSON.stringify(summary, null, 2)}</pre>
          </div>
        ) : null}
      </section>
    </div>
  );
}
