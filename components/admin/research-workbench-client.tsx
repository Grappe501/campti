"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  researchWorkbenchCompareAction,
  researchWorkbenchCreateTargetAction,
  researchWorkbenchDownstreamImpactAction,
  researchWorkbenchExtractAction,
  researchWorkbenchFetchClaimDetailAction,
  researchWorkbenchIngestManualAction,
  researchWorkbenchIngestUrlAction,
  researchWorkbenchSubmitDecisionAction,
} from "@/app/actions/research-workbench";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import type { ResearchDownstreamImpactSummary, ResearchWorkbenchDashboardViewModel } from "@/lib/domain/research-workbench";
import { RESEARCH_TARGET_TYPES } from "@/lib/domain/research-ingestion";

type Props = {
  initialDashboard: ResearchWorkbenchDashboardViewModel;
};

function splitIds(s: string): string[] {
  return s
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function ResearchWorkbenchClient({ initialDashboard }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [downstream, setDownstream] = useState<ResearchDownstreamImpactSummary | null>(null);

  function isOrchestrationFailure(v: unknown): v is { ok: false; message: string } {
    return Boolean(v && typeof v === "object" && "ok" in v && (v as { ok: boolean }).ok === false && "message" in v);
  }

  const [targetName, setTargetName] = useState("");
  const [targetType, setTargetType] = useState<string>("scene");
  const [researchIntent, setResearchIntent] = useState("");
  const [scenesText, setScenesText] = useState("");
  const [chaptersText, setChaptersText] = useState("");
  const [peopleText, setPeopleText] = useState("");
  const [placesText, setPlacesText] = useState("");

  const [selectedTargetId, setSelectedTargetId] = useState(() => initialDashboard.recentTargets[0]?.id ?? "");

  const [manualTitle, setManualTitle] = useState("");
  const [manualBody, setManualBody] = useState("");
  const [manualTrust, setManualTrust] = useState<string>("secondary");

  const [urlTitle, setUrlTitle] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [urlFetch, setUrlFetch] = useState(true);

  const [decisionClaimId, setDecisionClaimId] = useState("");
  const [decisionKind, setDecisionKind] = useState<"accept" | "reject" | "uncertain" | "divergence">("accept");
  const [decisionReason, setDecisionReason] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [canonTargetType, setCanonTargetType] = useState("scene");
  const [canonTargetId, setCanonTargetId] = useState("");
  const [knowledgeType, setKnowledgeType] = useState("ricre_research_claim");
  const [histStatus, setHistStatus] = useState("likely_historical");
  const [storyStatus, setStoryStatus] = useState("accepted_story_canon");

  const [claimDetailOpen, setClaimDetailOpen] = useState<string | null>(null);
  const [claimDetailJson, setClaimDetailJson] = useState<string | null>(null);

  const advisory = initialDashboard.summaryBar.advisoryLabels;

  function run<T>(fn: () => Promise<T>, onOk?: (v: T) => void) {
    setError(null);
    start(async () => {
      try {
        const r = await fn();
        if (isOrchestrationFailure(r)) {
          setError(r.message);
          return;
        }
        onOk?.(r as T);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  const primarySceneForCanon = useMemo(() => splitIds(scenesText)[0] ?? "", [scenesText]);

  return (
    <div className="space-y-6">
      {initialDashboard.narrowContext ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 shadow-sm">
          <span className="font-semibold">Narrow view:</span> {initialDashboard.narrowContext.description}
        </section>
      ) : null}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-emerald-900">Summary bar</p>
        <div className="mt-2 grid gap-3 text-sm text-emerald-950 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-medium">Open claims</span>
            <p className="text-2xl font-semibold tabular-nums">{initialDashboard.summaryBar.openClaimsTotal}</p>
          </div>
          <div>
            <span className="font-medium">Contradiction-shaped queue</span>
            <p className="text-2xl font-semibold tabular-nums">{initialDashboard.summaryBar.contradictionQueueTotal}</p>
          </div>
          <div>
            <span className="font-medium">Active accepted canon rows</span>
            <p className="text-2xl font-semibold tabular-nums">{initialDashboard.summaryBar.acceptedCanonActiveTotal}</p>
          </div>
          <div>
            <span className="font-medium">Research targets</span>
            <p className="text-2xl font-semibold tabular-nums">{initialDashboard.summaryBar.researchTargetsTotal}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-emerald-900">
          Last decision: {initialDashboard.summaryBar.lastDecisionAtIso ?? "—"} · {initialDashboard.honestyBanner}
        </p>
        <ul className="mt-2 list-disc pl-5 text-xs text-emerald-900">
          {advisory.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <span className="font-medium">Blocked.</span> {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
        <p className="text-xs uppercase tracking-widest text-stone-500">Target creation</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Target type</span>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className={fieldClass}>
              {RESEARCH_TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Target name / label</span>
            <input value={targetName} onChange={(e) => setTargetName(e.target.value)} className={fieldClass} />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            <span className={labelSpanClass}>Research intent (required for `other` with no links)</span>
            <textarea value={researchIntent} onChange={(e) => setResearchIntent(e.target.value)} rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Scene ids (comma or newline)</span>
            <textarea value={scenesText} onChange={(e) => setScenesText(e.target.value)} rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Chapter ids</span>
            <textarea value={chaptersText} onChange={(e) => setChaptersText(e.target.value)} rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Person ids</span>
            <textarea value={peopleText} onChange={(e) => setPeopleText(e.target.value)} rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Place ids</span>
            <textarea value={placesText} onChange={(e) => setPlacesText(e.target.value)} rows={2} className={fieldClass} />
          </label>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () =>
                researchWorkbenchCreateTargetAction({
                  targetType,
                  targetName,
                  researchIntent: researchIntent.trim() || null,
                  linkedSceneIds: splitIds(scenesText),
                  linkedChapterIds: splitIds(chaptersText),
                  linkedBookIds: [],
                  linkedCharacterIds: splitIds(peopleText),
                  linkedSettingIds: splitIds(placesText),
                  linkedEraIds: [],
                  linkedThreadIds: [],
                }),
              (r) => {
                if (r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok === true && "data" in r) {
                  const id = (r as { data: { targetId: string } }).data.targetId;
                  setSelectedTargetId(id);
                }
              }
            )
          }
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-50"
        >
          Create target
        </button>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-4">
        <p className="text-xs uppercase tracking-widest text-stone-500">Source ingestion</p>
        <label className={labelClass}>
          <span className={labelSpanClass}>Active research target id</span>
          <input value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)} className={fieldClass} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-stone-200 p-3">
            <p className="text-sm font-medium text-stone-900">Manual text</p>
            <p className="text-xs text-stone-600">No network. Body cap 400,000 characters.</p>
            <label className={labelClass}>
              <span className={labelSpanClass}>Title</span>
              <input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Trust tier</span>
              <select value={manualTrust} onChange={(e) => setManualTrust(e.target.value)} className={fieldClass}>
                <option value="primary">primary</option>
                <option value="secondary">secondary</option>
                <option value="tertiary">tertiary</option>
                <option value="popular_or_unverified">popular_or_unverified</option>
                <option value="unknown">unknown</option>
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Body</span>
              <textarea value={manualBody} onChange={(e) => setManualBody(e.target.value)} rows={6} className={fieldClass} />
            </label>
            <button
              type="button"
              disabled={pending || !selectedTargetId}
              onClick={() =>
                run(() =>
                  researchWorkbenchIngestManualAction({
                    researchTargetId: selectedTargetId,
                    sourceTitle: manualTitle,
                    manualText: manualBody,
                    sourceTrustTier: manualTrust,
                  })
                )
              }
              className="rounded-full border border-stone-400 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              Ingest manual source
            </button>
          </div>
          <div className="space-y-2 rounded-lg border border-stone-200 p-3">
            <p className="text-sm font-medium text-stone-900">Optional single-URL fetch</p>
            <p className="text-xs text-stone-600">Bounded: one URL, timeout and byte caps in ResearchSourceIngestionService — no crawl expansion.</p>
            <label className={labelClass}>
              <span className={labelSpanClass}>Title</span>
              <input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>URL (https)</span>
              <input value={urlValue} onChange={(e) => setUrlValue(e.target.value)} className={fieldClass} />
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={urlFetch} onChange={(e) => setUrlFetch(e.target.checked)} />
              Attempt bounded fetch (uncheck to store URL metadata only)
            </label>
            <button
              type="button"
              disabled={pending || !selectedTargetId}
              onClick={() =>
                run(() =>
                  researchWorkbenchIngestUrlAction({
                    researchTargetId: selectedTargetId,
                    sourceTitle: urlTitle,
                    sourceUrl: urlValue,
                    fetchRemote: urlFetch,
                  })
                )
              }
              className="rounded-full border border-stone-400 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              Ingest URL source
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
        <p className="text-xs uppercase tracking-widest text-stone-500">Recent sources (extract)</p>
        <ul className="divide-y divide-stone-100 text-sm">
          {initialDashboard.recentSources.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <span className="font-medium text-stone-900">{s.sourceTitle}</span>
                <span className="ml-2 text-xs text-stone-500">{s.ingestMethod}</span>
                <p className="text-xs text-stone-600">Trust: {s.sourceTrustTier} · fetch: {s.fetchHonestyLabel.replaceAll("_", " ")}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => researchWorkbenchExtractAction(s.id))}
                className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-50"
              >
                Run extraction
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
        <p className="text-xs uppercase tracking-widest text-stone-500">Claim review queue</p>
        <div className="space-y-3">
          {initialDashboard.claimReviewQueue.map((c) => (
            <div key={c.claimId} className="rounded-lg border border-stone-100 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs uppercase text-stone-500">{c.claimStatus}</span>
                  <p className="mt-1 text-stone-800">{c.claimText.slice(0, 280)}{c.claimText.length > 280 ? "…" : ""}</p>
                  <p className="text-xs text-stone-600">
                    Source: {c.sourceTitle} · extraction: {c.extractionMethod} ({c.extractionHonestyLabel})
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => researchWorkbenchCompareAction(c.claimId))}
                    className="rounded-full border border-stone-400 px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-50"
                  >
                    Run comparisons
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setDecisionClaimId(c.claimId);
                      if (primarySceneForCanon) {
                        setCanonTargetType("scene");
                        setCanonTargetId(primarySceneForCanon);
                      }
                    }}
                    className="rounded-full border border-amber-700 px-2 py-1 text-xs font-medium text-amber-950 hover:bg-amber-50"
                  >
                    Prepare decision
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setClaimDetailOpen(c.claimId);
                      start(async () => {
                        const row = await researchWorkbenchFetchClaimDetailAction(c.claimId);
                        setClaimDetailJson(JSON.stringify(row, null, 2));
                      });
                    }}
                    className="rounded-full border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
                  >
                    Inspect claim
                  </button>
                </div>
              </div>
              {c.comparisons.length ? (
                <ul className="mt-2 space-y-1 text-xs text-stone-600">
                  {c.comparisons.slice(0, 4).map((x) => (
                    <li key={x.comparisonId}>
                      {x.comparisonResult} vs {x.comparedAgainstType}:{x.comparedAgainstId}{" "}
                      {x.contradictionType ? `(shape: ${x.contradictionType})` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm space-y-2">
        <p className="text-xs uppercase tracking-widest text-amber-900">Contradiction-shaped comparisons</p>
        {initialDashboard.contradictionQueue.length === 0 ? (
          <p className="text-sm text-amber-950">No contradiction-shaped rows in the current open-claim window.</p>
        ) : (
          <ul className="space-y-2 text-sm text-amber-950">
            {initialDashboard.contradictionQueue.map((x) => (
              <li key={x.comparisonId}>
                <span className="font-medium">{x.comparisonResult}</span> — claim {x.claimId.slice(0, 8)}… · {x.sourceTitle}
                {x.contradictionType ? ` · ${x.contradictionType}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
        <p className="text-xs uppercase tracking-widest text-stone-500">Author decision</p>
        <p className="text-xs text-stone-600">
          `merge_with_existing` is not exposed: backend would create a new canon row today, not a true merge-by-id — deferred honestly.
        </p>
        <label className={labelClass}>
          <span className={labelSpanClass}>Claim id</span>
          <input value={decisionClaimId} onChange={(e) => setDecisionClaimId(e.target.value)} className={fieldClass} />
        </label>
        <div className="flex flex-wrap gap-3 text-sm">
          {(["accept", "reject", "uncertain", "divergence"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1">
              <input type="radio" name="dk" checked={decisionKind === k} onChange={() => setDecisionKind(k)} />
              {k}
            </label>
          ))}
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Decision reason</span>
          <textarea value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} rows={3} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Override notes (required for divergence)</span>
          <textarea value={overrideNotes} onChange={(e) => setOverrideNotes(e.target.value)} rows={2} className={fieldClass} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClass}>
            <span className={labelSpanClass}>Canon target type</span>
            <input value={canonTargetType} onChange={(e) => setCanonTargetType(e.target.value)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Canon target id</span>
            <input value={canonTargetId} onChange={(e) => setCanonTargetId(e.target.value)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Knowledge type</span>
            <input value={knowledgeType} onChange={(e) => setKnowledgeType(e.target.value)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Historical reality status</span>
            <input value={histStatus} onChange={(e) => setHistStatus(e.target.value)} className={fieldClass} />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            <span className={labelSpanClass}>Story reality status</span>
            <input value={storyStatus} onChange={(e) => setStoryStatus(e.target.value)} className={fieldClass} />
          </label>
        </div>
        <button
          type="button"
          disabled={pending || !decisionClaimId}
          onClick={() =>
            run(() =>
              researchWorkbenchSubmitDecisionAction({
                claimId: decisionClaimId,
                workbenchDecision: decisionKind,
                decisionReason,
                overrideNotes: overrideNotes.trim() || null,
                canonTargetType,
                canonTargetId,
                knowledgeType,
                historicalRealityStatus: histStatus,
                storyRealityStatus: storyStatus,
              })
            )
          }
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-50"
        >
          Submit decision
        </button>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2">
        <p className="text-xs uppercase tracking-widest text-stone-500">Audit / recent decisions</p>
        <ul className="space-y-2 text-sm text-stone-700">
          {initialDashboard.recentDecisions.map((d) => (
            <li key={d.decisionId} className="border-b border-stone-100 pb-2">
              <span className="text-xs text-stone-500">{d.createdAtIso}</span>{" "}
              <span className="font-medium text-stone-900">{d.authorDecision}</span> on claim {d.claimId.slice(0, 8)}…
              <p className="text-xs">{d.decisionReasonPreview}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm space-y-2">
        <p className="text-xs uppercase tracking-widest text-sky-900">Downstream impact</p>
        <button
          type="button"
          disabled={pending || !selectedTargetId}
          onClick={() =>
            start(async () => {
              setError(null);
              const s = await researchWorkbenchDownstreamImpactAction(selectedTargetId);
              setDownstream(s);
            })
          }
          className="rounded-full border border-sky-600 px-3 py-1.5 text-xs font-medium text-sky-950 hover:bg-white disabled:opacity-50"
        >
          Evaluate target downstream
        </button>
        {downstream ? (
          <ul className="mt-2 list-disc pl-5 text-sm text-sky-950">
            <li>Active canon rows (linked scope): {downstream.acceptedActiveCanonTotal}</li>
            <li>Scene linked: {downstream.sceneLinked ? "yes" : "no"}</li>
            <li>Primary scene: {downstream.primarySceneId ?? "—"}</li>
            <li>RICRE bundle record count: {downstream.ricrePromptBundleRecordCount ?? "—"}</li>
            <li>Prompt injection eligible: {downstream.ricrePromptEligible ? "yes" : "no"}</li>
            <li>Hash would include RICRE bundle: {downstream.canonicalHashWouldIncludeRicre ? "yes" : "no"}</li>
          </ul>
        ) : null}
        {downstream?.honestyNotes.map((n) => (
          <p key={n} className="text-xs text-sky-900">
            — {n}
          </p>
        ))}
      </section>

      {claimDetailOpen ? (
        <details open className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800">
          <summary className="cursor-pointer font-medium">Advanced — claim {claimDetailOpen}</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap">{claimDetailJson ?? "Loading…"}</pre>
        </details>
      ) : null}
    </div>
  );
}
