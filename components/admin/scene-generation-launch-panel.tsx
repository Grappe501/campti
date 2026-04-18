"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { confirmAndLaunchSceneGenerationAction, evaluateSceneLaunchGuardAction } from "@/app/actions/scene-launch-guard";
import type { SceneLaunchGuardResult } from "@/lib/domain/scene-launch-guard";

type Props = {
  sceneId: string;
  sceneTitle: string | null;
  initialGuard: SceneLaunchGuardResult | null;
  /** When compact, fewer chrome rows (cockpit strip). */
  compact?: boolean;
};

const SUBSYSTEM_LABEL: Record<string, string> = {
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

export function SceneGenerationLaunchPanel({ sceneId, sceneTitle, initialGuard, compact }: Props) {
  const router = useRouter();
  const [guard, setGuard] = useState<SceneLaunchGuardResult | null>(initialGuard);
  const [modal, setModal] = useState<"closed" | "risk" | "blocked">("closed");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, start] = useTransition();

  useEffect(() => {
    setGuard(initialGuard);
  }, [initialGuard]);

  const refreshGuard = useCallback(() => {
    start(async () => {
      setError(null);
      const ev = await evaluateSceneLaunchGuardAction({ sceneId });
      if (!ev.ok) {
        setError(ev.message);
        return;
      }
      setGuard(ev.data);
    });
  }, [sceneId]);

  function runAfterFreshEvaluation() {
    start(async () => {
      setError(null);
      setSuccess(null);
      const ev = await evaluateSceneLaunchGuardAction({ sceneId });
      if (!ev.ok) {
        setError(ev.message);
        return;
      }
      const g = ev.data;
      setGuard(g);
      if (g.launchAllowance === "blocked") {
        setModal("blocked");
        return;
      }
      if (g.launchAllowance === "allowed_with_risk") {
        setModal("risk");
        return;
      }
      const r = await confirmAndLaunchSceneGenerationAction({
        sceneId,
        freshnessDigest: g.freshnessDigest,
        riskAcknowledged: false,
        intent: "full_generation",
      });
      if (!r.ok) {
        setError(`${r.code}: ${r.message}`);
        return;
      }
      setSuccess("Generation completed — inspect generationText and cockpit certification.");
      router.refresh();
    });
  }

  function confirmRiskLaunch() {
    if (!guard) return;
    start(async () => {
      setError(null);
      const r = await confirmAndLaunchSceneGenerationAction({
        sceneId,
        freshnessDigest: guard.freshnessDigest,
        riskAcknowledged: true,
        intent: "full_generation",
      });
      setModal("closed");
      if (!r.ok) {
        if (r.code === "stale_guard_state") {
          setError(r.message);
          if (r.guard) setGuard(r.guard);
          return;
        }
        setError(`${r.code}: ${r.message}`);
        if (r.guard) setGuard(r.guard);
        return;
      }
      setSuccess("Generation completed under documented risk — review output and certification.");
      router.refresh();
    });
  }

  if (!guard) {
    return <p className="text-sm text-stone-600">Launch guard unavailable for this scene.</p>;
  }

  const blocked = guard.launchAllowance === "blocked";
  const risk = guard.launchAllowance === "allowed_with_risk";
  const allowedClean = guard.launchAllowance === "allowed";

  return (
    <section className={`rounded-2xl border border-stone-300 bg-stone-50/90 p-4 shadow-sm ${compact ? "text-sm" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-600">Scene launch guard</p>
          <p className="mt-1 font-medium text-stone-900">
            {sceneTitle ? <span>{sceneTitle}</span> : null}
            {sceneTitle ? <span className="text-stone-500"> · </span> : null}
            <span className="font-mono text-xs text-stone-600">{sceneId}</span>
          </p>
          <p className="mt-1 text-xs text-stone-600">
            Allowance: <strong>{guard.launchAllowance.replaceAll("_", " ")}</strong>
            {guard.confirmationRequired ? " · confirmation required for risk-class launches" : null}
          </p>
          {!compact ? (
            <p className="mt-1 text-[11px] text-stone-500">
              Digest prefix {guard.freshnessDigest.slice(0, 12)}… · {guard.preflightVersionSummary}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshGuard}
            disabled={busy}
            className="rounded-full border border-stone-400 bg-white px-3 py-1.5 text-xs font-medium text-stone-900 hover:bg-stone-100 disabled:opacity-60"
          >
            Re-evaluate guard
          </button>
          {blocked ? (
            <button
              type="button"
              onClick={() => setModal("blocked")}
              className="rounded-full border border-rose-400 bg-white px-3 py-1.5 text-xs font-semibold text-rose-950 hover:bg-rose-50"
            >
              View blockers
            </button>
          ) : null}
          <button
            type="button"
            onClick={runAfterFreshEvaluation}
            disabled={busy || blocked}
            className={`rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
              risk ? "bg-amber-900 text-amber-50 hover:bg-amber-800" : "bg-stone-900 text-amber-50 hover:bg-stone-800"
            }`}
            title={blocked ? "Launch is blocked until remediation — see Preflight blockers." : undefined}
          >
            {busy ? "Working…" : risk ? "Generate (review risks…)" : "Generate scene prose"}
          </button>
        </div>
      </div>

      {blocked ? (
        <p className="mt-2 text-xs text-rose-900">
          Generation is disabled: {guard.blockers.length} blocker(s). Open the Preflight blockers panel below or use remediation links.
        </p>
      ) : null}
      {risk && !compact ? (
        <p className="mt-2 text-xs text-amber-950">
          {guard.risks.length} downgrade risk(s) require explicit acknowledgement before the server will call the model.
        </p>
      ) : null}
      {allowedClean && !compact ? (
        <p className="mt-2 text-xs text-emerald-950">No blockers or downgrade risks on this snapshot — launch runs immediately after guard re-evaluation.</p>
      ) : null}

      {error ? <p className="mt-2 text-sm text-rose-800">{error}</p> : null}
      {success ? <p className="mt-2 text-sm text-emerald-900">{success}</p> : null}

      {modal === "risk" && guard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-stone-900">Launch allowed with risk</h2>
            <p className="mt-2 text-sm text-stone-700">
              The canonical launch guard reports downgrade risks. Proceeding runs <code className="text-xs">runSceneGeneration</code> with
              the current scene contract. This is not a generic confirmation — each risk is subsystem-scoped.
            </p>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm text-stone-800">
              {guard.risks.map((r) => (
                <li key={r.id} className="rounded-lg border border-amber-100 bg-amber-50/60 p-2">
                  <p className="font-medium text-amber-950">{r.title}</p>
                  <p className="text-xs text-stone-600">
                    [{SUBSYSTEM_LABEL[r.subsystemKey] ?? r.subsystemKey}] {r.explanation}
                  </p>
                  <p className="mt-1 text-xs text-stone-700">{r.launchImpact}</p>
                </li>
              ))}
            </ul>
            {guard.advisories.length > 0 ? (
              <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-2">
                <p className="text-xs font-semibold text-stone-700">Advisories (non-blocking)</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-stone-600">
                  {guard.advisories.slice(0, 6).map((a) => (
                    <li key={a.id}>{a.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setModal("closed")}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRiskLaunch}
                disabled={busy}
                className="rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-900 disabled:opacity-60"
              >
                Proceed anyway
              </button>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-stone-600">
              {guard.remediationLinks.map((l) => (
                <li key={l.id}>
                  <Link href={l.href} className="font-medium text-violet-900 underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {modal === "blocked" && guard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-rose-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-rose-950">Launch blocked</h2>
            <p className="mt-2 text-sm text-stone-700">The server will not call the model until these blockers are cleared.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {guard.blockers.map((b) => (
                <li key={b.id} className="rounded-lg border border-rose-100 bg-rose-50/80 p-2">
                  <p className="font-medium text-rose-950">{b.title}</p>
                  <p className="text-xs text-stone-600">{b.explanation}</p>
                  {b.remediationHref ? (
                    <Link href={b.remediationHref} className="mt-1 inline-block text-xs font-semibold text-rose-900 underline">
                      {b.remediationLabel ?? "Remediate"}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setModal("closed")}
              className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
