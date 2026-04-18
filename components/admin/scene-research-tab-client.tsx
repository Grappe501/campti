"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  sceneResearchCompareAction,
  sceneResearchCreateTargetAction,
  sceneResearchExtractAction,
  sceneResearchIngestManualAction,
  sceneResearchIngestUrlAction,
  sceneResearchSubmitDecisionAction,
} from "@/app/actions/scene-research-tab";
import { researchWorkbenchFetchClaimDetailAction } from "@/app/actions/research-workbench";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { buildResearchWorkbenchUrl } from "@/lib/domain/research-workbench-nav";
import { RESEARCH_TARGET_TYPES } from "@/lib/domain/research-ingestion";
import type { SceneResearchTabViewModel } from "@/lib/domain/scene-research-tab";

type Props = {
  initial: SceneResearchTabViewModel;
  sceneId: string;
};

function isFail(v: unknown): v is { ok: false; message: string } {
  return Boolean(v && typeof v === "object" && "ok" in v && (v as { ok: boolean }).ok === false && "message" in v);
}

export function SceneResearchTabClient({ initial, sceneId }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [inspectJson, setInspectJson] = useState<string | null>(null);

  const workbenchAll = useMemo(() => buildResearchWorkbenchUrl({ sceneId }), [sceneId]);
  const workbenchOpen = useMemo(() => buildResearchWorkbenchUrl({ sceneId, queue: "open_claims" }), [sceneId]);
  const workbenchContra = useMemo(() => buildResearchWorkbenchUrl({ sceneId, queue: "contradictions" }), [sceneId]);

  const [targetName, setTargetName] = useState(`${initial.scene.title} — research`);
  const [targetType, setTargetType] = useState<string>("scene");
  const [researchIntent, setResearchIntent] = useState("");

  const [selectedTargetId, setSelectedTargetId] = useState(() => initial.linkedTargets[0]?.targetId ?? "");
  const [manualTitle, setManualTitle] = useState("Scene notes");
  const [manualBody, setManualBody] = useState("");
  const [manualTrust, setManualTrust] = useState("secondary");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [urlFetch, setUrlFetch] = useState(true);

  const [decisionClaimId, setDecisionClaimId] = useState(() => initial.openClaims[0]?.claimId ?? "");
  const [decisionKind, setDecisionKind] = useState<"accept" | "reject" | "uncertain" | "divergence">("accept");
  const [decisionReason, setDecisionReason] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [canonTargetType, setCanonTargetType] = useState("scene");
  const [canonTargetId, setCanonTargetId] = useState(sceneId);
  const [knowledgeType, setKnowledgeType] = useState("ricre_research_claim");
  const [histStatus, setHistStatus] = useState("likely_historical");
  const [storyStatus, setStoryStatus] = useState("accepted_story_canon");

  function run<T>(fn: () => Promise<T>) {
    setError(null);
    start(async () => {
      try {
        const r = await fn();
        if (isFail(r)) {
          setError(r.message);
          return;
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-900">Research summary</p>
        <div className="mt-2 grid gap-3 text-sm text-violet-950 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <span className="font-medium">Accepted canon (rows)</span>
            <p className="text-2xl font-semibold tabular-nums">{initial.summary.acceptedCanonCount}</p>
          </div>
          <div>
            <span className="font-medium">Open claims</span>
            <p className="text-2xl font-semibold tabular-nums">{initial.summary.openClaimsCount}</p>
          </div>
          <div>
            <span className="font-medium">Contradiction-shaped</span>
            <p className="text-2xl font-semibold tabular-nums">{initial.summary.contradictionShapedCount}</p>
          </div>
          <div>
            <span className="font-medium">Linked targets</span>
            <p className="text-2xl font-semibold tabular-nums">{initial.summary.linkedTargetsCount}</p>
          </div>
          <div>
            <span className="font-medium">Last decision</span>
            <p className="text-xs leading-snug">{initial.summary.lastRelevantDecisionAtIso ?? "—"}</p>
          </div>
        </div>
        <ul className="mt-2 list-disc pl-5 text-xs text-violet-900">
          {initial.summary.advisoryLabels.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-violet-900">{initial.honestyBanner}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Accepted canon in force for this scene</h3>
        <p className="mt-1 text-xs text-stone-600">
          Active rows matching scene, chapter, and in-scene people/places. Heuristic extraction and approximate contradictions remain labeled elsewhere.
        </p>
        {initial.acceptedCanon.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No active accepted canon rows for this scene scope.</p>
        ) : (
          <div className="mt-3 space-y-5">
            {initial.acceptedCanonGrouped.map((g) => (
              <div key={g.targetType}>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Target type: {g.targetType}</p>
                <ul className="mt-2 space-y-3">
                  {g.items.map((c) => (
                    <li key={c.canonRecordId} className="rounded-lg border border-stone-100 bg-stone-50/80 p-3 text-sm">
                      <p className="font-medium text-stone-900">
                        [{c.targetType}:{c.targetId}] {c.knowledgeType}
                      </p>
                      <p className="mt-1 text-stone-800">{c.contentPreview}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        Status {c.canonicalStatus} · story {c.storyRealityStatus} · hist {c.historicalRealityStatus} · {c.trustSummary}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Last author decision affecting this row: {c.lastCanonDecisionAtIso ?? "—"} · row updated {c.updatedAtIso}
                      </p>
                      <p className="mt-1 text-xs text-amber-900">
                        <span className="font-medium">{c.relevance}</span> — {c.relevanceExplanation}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Linked research targets</h3>
        <p className="mt-1 text-xs text-stone-600">Only targets tied to this scene, its chapter, or in-scene entities appear here.</p>
        {initial.linkedTargets.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No research targets linked yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {initial.linkedTargets.map((t) => (
              <li key={t.targetId} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-stone-100 p-2">
                <div>
                  <span className="font-medium text-stone-900">{t.targetName}</span>
                  <span className="text-stone-500"> · {t.targetType}</span>
                  <p className="text-xs text-amber-900">
                    {t.primaryRelevance} — {t.relevanceExplanation}
                  </p>
                  <Link href={workbenchAll} className="mt-1 inline-block text-xs text-violet-800 hover:underline">
                    Manage in workbench (scene filter)
                  </Link>
                </div>
                <div className="text-xs text-stone-600">
                  Open claims {t.openClaimCount} · sources {t.sourceCount}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Open claims (scene-scoped)</h3>
        {initial.openClaims.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No unresolved claims for linked targets.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {initial.openClaims.map((c) => (
              <li key={c.claimId} className="rounded-lg border border-stone-100 p-3 text-sm">
                <p className="text-stone-900">{c.claimText}</p>
                <p className="mt-1 text-xs text-stone-600">
                  {c.targetName} · {c.sourceTitle} · {c.extractionMethod} · claim status {c.claimStatus} · comparisons {c.comparisonStatus}
                  {c.contradictionFlag ? " · contradiction-shaped signal" : ""}
                  {c.priorDecisionCount > 0 ? ` · prior author decisions on this claim: ${c.priorDecisionCount}` : " · no prior decisions on this claim"}
                </p>
                {c.evidenceSnippet ? (
                  <p className="mt-1 text-xs text-stone-500">
                    <span className="font-medium text-stone-600">Evidence (heuristic):</span> {c.evidenceSnippet}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-amber-900">
                  {c.relevance} — {c.relevanceExplanation}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                    onClick={() =>
                      run(() => sceneResearchCompareAction({ sceneId, claimId: c.claimId }))
                    }
                  >
                    Re-run comparisons
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                    onClick={() =>
                      run(async () => {
                        const detail = await researchWorkbenchFetchClaimDetailAction(c.claimId);
                        setInspectJson(JSON.stringify(detail, null, 2));
                      })
                    }
                  >
                    Inspect claim
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-amber-950">Contradictions / tension (approximate)</h3>
        {initial.contradictions.length === 0 ? (
          <p className="mt-2 text-sm text-amber-900/80">No contradiction-shaped comparisons for open claims in this scope.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-amber-950">
            {initial.contradictions.map((x) => (
              <li key={`${x.claimId}-${x.comparisonId}`} className="rounded-lg border border-amber-100 bg-white/70 p-3">
                <p className="font-medium">
                  [{x.severity}] {x.comparisonResult}
                  {x.contradictionType ? ` · ${x.contradictionType}` : ""}
                </p>
                <p className="mt-1 text-xs">{x.claimTextPreview}</p>
                <p className="mt-1 text-xs text-amber-900/90">{x.recommendedNextStep}</p>
                <p className="mt-1 text-xs text-stone-600">
                  {x.honestyLabel} · severity {x.severity} ({x.severity === "blocking" ? "treat as high-signal" : x.severity === "warning" ? "review before treating as settled" : "advisory unless you promote it"})
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Research impact on scene generation</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
          <li>
            <code className="rounded bg-stone-100 px-1">RICRE_ACCEPTED_CANON</code> bundle assembled for prompt:{" "}
            <span className="font-medium">{initial.promptImpact.ricreAcceptedCanonBundleLoaded ? "yes" : "no"}</span> (
            {initial.promptImpact.activeAcceptedCanonRecordCount} active rows contributing to instruction lines)
          </li>
          <li>Prompt block eligible: {initial.promptImpact.ricrePromptBlockEligible ? "yes" : "no"}</li>
          <li>Canonical hash includes RICRE bundle projection: {initial.hashImpact.canonicalHashIncludesRicreBundle ? "yes" : "no"}</li>
        </ul>
        <p className="mt-2 text-xs text-stone-600">{initial.promptImpact.subordinationNote}</p>
        <p className="mt-1 text-xs text-stone-500">{initial.hashImpact.explanation}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Entity research pressure</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {initial.entityImpacts.map((e) => (
            <div key={`${e.entityKind}-${e.entityId}`} className="rounded-lg border border-stone-100 p-3 text-sm">
              <p className="font-medium text-stone-900">
                {e.entityKind}: {e.entityName}
              </p>
              <p className="text-xs text-stone-600">
                Accepted canon {e.acceptedCanonCount} · Open claims {e.openClaimCount} · Contradictions {e.contradictionCount}
              </p>
              <p className="text-xs text-stone-500">Last decision: {e.lastDecisionAtIso ?? "—"}</p>
              <Link
                href={buildResearchWorkbenchUrl(
                  e.entityKind === "person" ? { sceneId, personId: e.entityId } : { sceneId, placeId: e.entityId },
                )}
                className="mt-2 inline-block text-xs font-medium text-violet-800 hover:underline"
              >
                Open workbench for this {e.entityKind}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Recent decisions (scene-linked claims)</h3>
        {initial.decisionHistory.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No decisions recorded for claims on these targets.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs text-stone-700">
            {initial.decisionHistory.map((d) => (
              <li key={d.decisionId} className="rounded border border-stone-100 p-2">
                <span className="font-medium">{d.createdAtIso}</span> · {d.authorDecision} · {d.targetName ?? "target"}
                <p className="text-stone-600">{d.decisionReasonPreview}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-emerald-950">Quick actions</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Link href={workbenchAll} className="rounded-full bg-emerald-900 px-3 py-1.5 text-xs font-medium text-emerald-50 hover:bg-emerald-800">
            Open workbench (this scene)
          </Link>
          <Link href={workbenchOpen} className="rounded-full border border-emerald-800 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-100">
            Open open-claims queue
          </Link>
          <Link href={workbenchContra} className="rounded-full border border-emerald-800 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-100">
            Open contradictions queue
          </Link>
        </div>
        <p className="mt-2 text-xs text-emerald-900">
          Deeper queue management stays in /admin/research. Actions below reuse the same orchestration and validation paths.
        </p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Create scene-linked target</h3>
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() =>
              sceneResearchCreateTargetAction({
                sceneId,
                anchorSceneId: sceneId,
                targetName,
                targetType,
                researchIntent: researchIntent.trim() || null,
                linkedSceneIds: [sceneId],
                linkedChapterIds: [initial.scene.chapterId],
                linkedBookIds: [],
                linkedCharacterIds: initial.entityImpacts.filter((x) => x.entityKind === "person").map((x) => x.entityId),
                linkedSettingIds: initial.entityImpacts.filter((x) => x.entityKind === "place").map((x) => x.entityId),
                linkedEraIds: [],
                linkedThreadIds: [],
              }),
            );
          }}
        >
          <label className={labelClass}>
            <span className={labelSpanClass}>Target name</span>
            <input className={fieldClass} value={targetName} onChange={(e) => setTargetName(e.target.value)} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Target type</span>
            <select className={fieldClass} value={targetType} onChange={(e) => setTargetType(e.target.value)}>
              {RESEARCH_TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Research intent (optional)</span>
            <textarea className={fieldClass} rows={2} value={researchIntent} onChange={(e) => setResearchIntent(e.target.value)} />
          </label>
          <p className="text-xs text-stone-600">
            Prefills scene id, chapter id, and in-scene people/places as linkage hints. Adjust in the full workbench if you need a tighter scope.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:opacity-50"
          >
            Create target
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Ingest source for this scene</h3>
        {!initial.quickActions.hasSceneLinkedTargets && initial.linkedTargets.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Create a target first.</p>
        ) : (
          <div className="mt-3 space-y-4">
            <label className={labelClass}>
              <span className={labelSpanClass}>Research target</span>
              <select className={fieldClass} value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)}>
                {initial.linkedTargets.length === 0 ? (
                  <option value="">No linked targets</option>
                ) : null}
                {initial.linkedTargets.map((t) => (
                  <option key={t.targetId} value={t.targetId}>
                    {t.targetName}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-xs font-medium text-stone-700">Manual paste (bounded size, no network)</p>
              <form
                className="mt-2 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() =>
                    sceneResearchIngestManualAction({
                      sceneId,
                      researchTargetId: selectedTargetId,
                      sourceTitle: manualTitle,
                      manualText: manualBody,
                      sourceTrustTier: manualTrust,
                    }),
                  );
                }}
              >
                <input className={fieldClass} placeholder="Source title" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} required />
                <textarea
                  className={fieldClass}
                  rows={4}
                  placeholder="Paste excerpt…"
                  value={manualBody}
                  onChange={(e) => setManualBody(e.target.value)}
                  required
                />
                <select className={fieldClass} value={manualTrust} onChange={(e) => setManualTrust(e.target.value)}>
                  <option value="primary">primary</option>
                  <option value="secondary">secondary</option>
                  <option value="tertiary">tertiary</option>
                </select>
                <button type="submit" disabled={pending || !selectedTargetId} className="rounded-full bg-stone-800 px-4 py-2 text-sm text-white disabled:opacity-50">
                  Ingest manual
                </button>
              </form>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-700">Optional single URL (bounded fetch)</p>
              <form
                className="mt-2 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() =>
                    sceneResearchIngestUrlAction({
                      sceneId,
                      researchTargetId: selectedTargetId,
                      sourceTitle: urlTitle,
                      sourceUrl: urlValue,
                      fetchRemote: urlFetch,
                    }),
                  );
                }}
              >
                <input className={fieldClass} placeholder="Source title" value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} required />
                <input className={fieldClass} placeholder="https://…" value={urlValue} onChange={(e) => setUrlValue(e.target.value)} required />
                <label className="flex items-center gap-2 text-xs text-stone-700">
                  <input type="checkbox" checked={urlFetch} onChange={(e) => setUrlFetch(e.target.checked)} />
                  Fetch remote (single URL, timeout/byte caps — no crawl)
                </label>
                <button type="submit" disabled={pending || !selectedTargetId} className="rounded-full bg-stone-800 px-4 py-2 text-sm text-white disabled:opacity-50">
                  Ingest URL
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Run extraction (recent sources)</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {initial.sources.map((s) => (
            <li key={s.sourceId} className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-100 p-2">
              <span className="text-stone-800">{s.sourceTitle}</span>
              <button
                type="button"
                disabled={pending}
                className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium hover:bg-stone-50 disabled:opacity-50"
                onClick={() => run(() => sceneResearchExtractAction({ sceneId, sourceId: s.sourceId }))}
              >
                Extract
              </button>
            </li>
          ))}
        </ul>
        {initial.sources.length === 0 ? <p className="text-xs text-stone-500">No sources yet for linked targets.</p> : null}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Compact author decision</h3>
        <p className="text-xs text-stone-600">
          Same canonical reconciliation path as the workbench. `merge_with_existing` remains deferred — use the full workbench when that workflow ships.
        </p>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() =>
              sceneResearchSubmitDecisionAction({
                sceneId,
                claimId: decisionClaimId,
                workbenchDecision: decisionKind,
                decisionReason,
                overrideNotes: overrideNotes.trim() || null,
                canonTargetType,
                canonTargetId,
                knowledgeType,
                historicalRealityStatus: histStatus,
                storyRealityStatus: storyStatus,
              }),
            );
          }}
        >
          <label className={labelClass}>
            <span className={labelSpanClass}>Claim</span>
            <select className={fieldClass} value={decisionClaimId} onChange={(e) => setDecisionClaimId(e.target.value)}>
              {initial.openClaims.map((c) => (
                <option key={c.claimId} value={c.claimId}>
                  {preview(c.claimText, 80)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Decision</span>
            <select className={fieldClass} value={decisionKind} onChange={(e) => setDecisionKind(e.target.value as typeof decisionKind)}>
              <option value="accept">accept</option>
              <option value="reject">reject</option>
              <option value="uncertain">uncertain</option>
              <option value="divergence">divergence</option>
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Reason</span>
            <textarea className={fieldClass} rows={2} value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Override notes (required for divergence)</span>
            <textarea className={fieldClass} rows={2} value={overrideNotes} onChange={(e) => setOverrideNotes(e.target.value)} />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Canon target type</span>
              <input className={fieldClass} value={canonTargetType} onChange={(e) => setCanonTargetType(e.target.value)} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Canon target id</span>
              <input className={fieldClass} value={canonTargetId} onChange={(e) => setCanonTargetId(e.target.value)} />
            </label>
          </div>
          <button type="submit" disabled={pending || !decisionClaimId} className="rounded-full bg-violet-900 px-4 py-2 text-sm text-white disabled:opacity-50">
            Submit decision
          </button>
        </form>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {inspectJson ? (
        <pre className="max-h-80 overflow-auto rounded-lg border border-stone-200 bg-stone-900/95 p-3 text-xs text-amber-50">{inspectJson}</pre>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <button type="button" className="text-xs font-medium text-stone-700 hover:underline" onClick={() => setAdvancedOpen(!advancedOpen)}>
          {advancedOpen ? "Hide" : "Show"} advanced inspection
        </button>
        {advancedOpen ? (
          <div className="mt-3 space-y-4 text-xs text-stone-700">
            <div>
              <p className="font-semibold text-stone-800">Scene / chapter ids</p>
              <p>sceneId: {sceneId}</p>
              <p>chapterId: {initial.scene.chapterId}</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800">Sources — provenance hash & ingest</p>
              {initial.sources.length === 0 ? (
                <p className="text-stone-500">No sources in scope.</p>
              ) : (
                <ul className="mt-1 max-h-48 space-y-2 overflow-y-auto font-mono text-[11px]">
                  {initial.sources.map((s) => (
                    <li key={s.sourceId} className="rounded border border-stone-200 bg-white p-2">
                      <div className="break-all">{s.sourceTitle}</div>
                      <div>hash: {s.provenanceHash}</div>
                      <div>
                        trust: {s.sourceTrustTier} · {s.ingestMethod} · {s.fetchHonestyLabel}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-stone-600">
              Raw claim JSON: use <strong>Inspect claim</strong> on a row above. Full comparison payloads live in the workbench for deep review.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function preview(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}
