import type { SceneLegalityView } from "@/app/actions/scene-constraints";
import type { OutcomeEnvelopeEntry } from "@/lib/scene-outcome-envelope-types";
import type { WorldStateReference } from "@prisma/client";
import Link from "next/link";

function OutcomeEnvelopeBulletList({ entries }: { entries: OutcomeEnvelopeEntry[] }) {
  const rows = entries.length ? entries.slice(0, 8) : [{ text: "—" }];
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-stone-800">
      {rows.map((e, i) => (
        <li key={i}>
          <span>{e.text}</span>
          {e.reason ? (
            <span className="mt-0.5 block text-[10px] font-normal leading-snug text-stone-500">{e.reason}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type PersonOption = { id: string; name: string };

function levelStyles(level: SceneLegalityView["readiness"]["level"]) {
  if (level === "ready") return "bg-emerald-100 text-emerald-950 border-emerald-200";
  if (level === "partial") return "bg-amber-100 text-amber-950 border-amber-200";
  return "bg-rose-100 text-rose-950 border-rose-200";
}

function ReasonBucket({
  title,
  tone,
  reasons,
}: {
  title: string;
  tone: "blocking" | "warning" | "info";
  reasons: ReadonlyArray<{ code: string; message: string }>;
}) {
  if (reasons.length === 0) return null;
  const box =
    tone === "blocking"
      ? "border-rose-200 bg-rose-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-stone-200 bg-stone-50";
  const label =
    tone === "blocking" ? "text-rose-900" : tone === "warning" ? "text-amber-950" : "text-stone-800";

  return (
    <div className={`rounded-lg border px-3 py-2 ${box}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${label}`}>{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-stone-800">
        {reasons.map((r) => (
          <li key={r.code}>
            <span className="font-mono text-[10px] text-stone-500">{r.code}</span>
            <span className="text-stone-600"> — </span>
            {r.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SceneReadinessPanel(props: {
  sceneId: string;
  legality: SceneLegalityView | null;
  worldStates: WorldStateReference[];
  people: PersonOption[];
  selectedWorldStateId: string | null;
  selectedFocalPersonId: string | null;
  /** When true, append <code>?debug=1</code> to workspace URL to show JSON inspector. */
  debug?: boolean;
}) {
  const { sceneId, legality, worldStates, people, selectedWorldStateId, selectedFocalPersonId, debug } = props;

  if (!legality) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-stone-900">Stage 8 · Legality</p>
        <p className="mt-2 text-xs text-stone-600">Could not load constraint snapshot.</p>
      </div>
    );
  }

  const { set, readiness } = legality;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-stone-900">Stage 8 · Legality</p>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${levelStyles(readiness.level)}`}
        >
          {readiness.level}
        </span>
      </div>

      <p className="text-xs text-stone-600">
        Derived constraint surface. Query params <code className="text-stone-800">ws</code> and{" "}
        <code className="text-stone-800">focal</code> choose world-era and focal cast for the Stage 7.5 bundle. Authors can patch
        derivation with <code className="text-stone-800">Scene.structuredDataJson</code> (same keys as Stage 7.5 plus Stage 8:{" "}
        <code className="text-stone-800">sceneClass</code>, <code className="text-stone-800">visibilityLegibility</code>,{" "}
        <code className="text-stone-800">focalPerceptionOverride</code>, <code className="text-stone-800">dominantInterpretationOverride</code>,{" "}
        <code className="text-stone-800">historicalSupportRequired</code>, …). Author <code className="text-stone-800">sceneClass</code>{" "}
        fully replaces inferred class for readiness policy (not a nudge).
      </p>

      <form action={`/admin/scenes/${sceneId}/workspace`} method="get" className="space-y-2 rounded-lg bg-stone-50 p-3 text-xs">
        {debug ? <input type="hidden" name="debug" value="1" /> : null}
        <p className="font-medium text-stone-800">Evaluation context</p>
        <label className="space-y-1 block">
          <span className="text-stone-600">World state</span>
          <select
            name="ws"
            className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-stone-900"
            defaultValue={selectedWorldStateId === null ? "" : selectedWorldStateId}
          >
            <option value="">(heuristic — no bundle)</option>
            {worldStates.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} ({w.eraId})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 block">
          <span className="text-stone-600">Focal person</span>
          <select
            name="focal"
            className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-stone-900"
            defaultValue={selectedFocalPersonId ?? ""}
          >
            <option value="">(first linked person)</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-stone-800"
        >
          Apply
        </button>
        {people.length >= 2 && selectedWorldStateId ? (
          <div className="mt-3 border-t border-stone-200 pt-3">
            <p className="mb-1.5 font-medium text-stone-800">Focal alternation</p>
            <p className="mb-2 text-[11px] leading-snug text-stone-600">
              Same scene + world — switch focal to compare Stage 7.5 / 8 bundles (dyad scenes with two linked people).
            </p>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => {
                const qs = new URLSearchParams();
                qs.set("ws", selectedWorldStateId);
                qs.set("focal", p.id);
                if (debug) qs.set("debug", "1");
                const active = selectedFocalPersonId === p.id;
                return (
                  <Link
                    key={p.id}
                    href={`/admin/scenes/${sceneId}/workspace?${qs.toString()}`}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                      active
                        ? "border-amber-800 bg-amber-100 text-amber-950"
                        : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50"
                    }`}
                  >
                    Focal: {p.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </form>

      <div className="text-xs space-y-1 text-stone-700">
        <p>
          <span className="font-medium text-stone-900">Brain bundle:</span> {set.usedBrainBundle ? "yes" : "no"}
          {" · "}
          <span className="font-medium text-stone-900">Scene-time brain:</span> {set.usedFocalSceneBrainRunner ? "yes" : "no"}
        </p>
        <p>
          <span className="font-medium text-stone-900">Scene visibility:</span> {set.pressure.sceneVisibility}
        </p>
        <p className="text-stone-600">{set.pressure.visibilityPressureNote}</p>
        <p>
          <span className="font-medium text-stone-900">Scene class:</span> {set.sceneReadinessClass}{" "}
          <span className="text-stone-500">({set.sceneReadinessClassSource})</span>
        </p>
        <p className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-[11px] leading-snug text-stone-700">
          <span className="font-medium text-stone-900">Policy provenance: </span>
          effective <span className="font-mono text-[10px] text-stone-800">{set.stage8PolicyProvenance.effectiveClass}</span> · source{" "}
          <span className="font-medium">{set.stage8PolicyProvenance.classSource}</span>
          {set.stage8PolicyProvenance.classSource === "author" ? (
            <>
              {" "}
              · inference-without-<code className="text-stone-800">sceneClass</code> would be{" "}
              <span className="font-mono text-[10px] text-stone-800">
                {set.stage8PolicyProvenance.inferredClassSansAuthorOverride}
              </span>
            </>
          ) : null}
          {set.stage8PolicyProvenance.sceneClassAuthorDiffersFromInference ? (
            <span className="text-amber-900"> · author class overrides inference</span>
          ) : null}
          <br />
          <span className="text-stone-600">Stage 8 JSON overrides applied: </span>
          {[
            set.stage8PolicyProvenance.overridesApplied.sceneClass && "sceneClass",
            set.stage8PolicyProvenance.overridesApplied.visibilityLegibility && "visibilityLegibility",
            set.stage8PolicyProvenance.overridesApplied.focalPerception && "focalPerceptionOverride",
            set.stage8PolicyProvenance.overridesApplied.dominantInterpretation && "dominantInterpretationOverride",
            set.stage8PolicyProvenance.overridesApplied.historicalSupportRequired && "historicalSupportRequired",
          ]
            .filter(Boolean)
            .join(", ") || "none"}
        </p>
        <p className="text-stone-600">
          Sources linked: {set.sourcesLinkedCount} · historical confidence: {set.historicalConfidence ?? "—"}
        </p>
        {set.focalPersonId ? (
          <p>
            <span className="font-medium text-stone-900">Focal:</span>{" "}
            {people.find((p) => p.id === set.focalPersonId)?.name ?? set.focalPersonId}
          </p>
        ) : null}
        {set.focalSceneRunner ? (
          <p className="text-stone-600">
            <span className="font-medium text-stone-800">Focal runner:</span> regulation {set.focalSceneRunner.regulationMode}, speech{" "}
            {set.focalSceneRunner.speechStyle}
            {set.focalSceneRunner.primaryFear ? ` · fear: ${set.focalSceneRunner.primaryFear.slice(0, 80)}` : ""}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-500">Readiness policy</p>
        <ReasonBucket title="Blocking" tone="blocking" reasons={readiness.policy.blocking} />
        <ReasonBucket title="Warnings" tone="warning" reasons={readiness.policy.warnings} />
        <ReasonBucket title="Info" tone="info" reasons={readiness.policy.info} />
        {readiness.policy.blocking.length === 0 &&
        readiness.policy.warnings.length === 0 &&
        readiness.policy.info.length === 0 ? (
          <p className="text-xs text-stone-600">
            {readiness.weakAreas.length > 0
              ? "No entries in blocking / warnings / info buckets; see weak areas below."
              : "No policy messages — inputs look sufficient for legality."}
          </p>
        ) : null}
      </div>

      {readiness.missingDependencies.length ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
          <p className="font-semibold text-stone-900">Missing dependencies</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-stone-700">
            {readiness.missingDependencies.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.weakAreas.length ? (
        <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
          <span className="font-semibold text-stone-900">Weak areas: </span>
          {readiness.weakAreas.join(" · ")}
        </div>
      ) : null}

      <div className="border-t border-stone-100 pt-3 space-y-2 text-xs">
        <p className="font-medium text-stone-900">Pressure map</p>
        {set.pressure.placeNotes.length ? (
          <ul className="list-disc space-y-0.5 pl-4 text-stone-600">
            {set.pressure.placeNotes.slice(0, 5).map((n, idx) => (
              <li key={idx}>{n}</li>
            ))}
          </ul>
        ) : null}
        {set.pressure.focalBrainHints.length ? (
          <div>
            <span className="font-medium text-stone-800">Focal brain hints:</span>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-stone-600">
              {set.pressure.focalBrainHints.slice(0, 5).map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {set.pressure.placeRiskFlags.length ? (
          <p className="text-amber-900/90">
            <span className="font-medium">Place risk flags:</span> {set.pressure.placeRiskFlags.join(", ")}
          </p>
        ) : null}
        <ul className="list-disc space-y-0.5 pl-4 text-stone-700">
          {set.pressure.items.slice(0, 10).map((x) => (
            <li key={x.id}>
              {x.label}{" "}
              <span className="text-stone-500">
                ({x.strength}, {x.source})
              </span>
            </li>
          ))}
        </ul>
        {set.pressure.items.length > 10 ? (
          <p className="text-stone-500">+{set.pressure.items.length - 10} more pressure rows</p>
        ) : null}
      </div>

      <div className="space-y-2 text-xs">
        <p className="font-medium text-stone-900">Perception map</p>
        <p className="text-stone-600">{set.perception.visibilityLegibility}</p>
        {set.perception.placeEnvironmentCues.length ? (
          <div>
            <span className="font-medium text-stone-800">Place cues:</span>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-stone-600">
              {set.perception.placeEnvironmentCues.slice(0, 6).map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {set.perception.focalDominantInterpretation ? (
          <p className="text-stone-700">
            <span className="font-medium text-stone-800">Dominant interpretation:</span> {set.perception.focalDominantInterpretation}
          </p>
        ) : null}
        {set.perception.focalBrainPerceptionHints.length ? (
          <div>
            <span className="font-medium text-stone-800">Focal perception hints:</span>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-stone-600">
              {set.perception.focalBrainPerceptionHints.slice(0, 8).map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-stone-600">
          <span className="font-medium text-stone-800">Visible anchors:</span> {set.perception.visibleAnchors.slice(0, 6).join("; ") || "—"}
        </p>
        <p className="text-stone-600">
          <span className="font-medium text-stone-800">Gaps:</span> {set.perception.hiddenOrUnknown.join("; ") || "—"}
        </p>
      </div>

      <div className="space-y-1 text-xs">
        <p className="font-medium text-stone-900">Reveal budget</p>
        <p className="text-stone-700">
          {set.revealBudget.score0to100 ?? "—"} ({set.revealBudget.band})
        </p>
      </div>

      <div className="space-y-2 text-xs">
        <p className="font-medium text-stone-900">Stage 8.5 · Outcome envelope</p>
        <p className="text-[11px] text-stone-600">
          Derived outcome families: allowed, costly, blocked, unstable (not dialogue or branches).
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-2">
            <p className="font-semibold text-emerald-950">Allowed</p>
            <OutcomeEnvelopeBulletList entries={set.outcomeEnvelope.allowedOutcomes} />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2">
            <p className="font-semibold text-amber-950">Costly</p>
            <OutcomeEnvelopeBulletList entries={set.outcomeEnvelope.costlyOutcomes} />
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-2">
            <p className="font-semibold text-rose-950">Blocked</p>
            <OutcomeEnvelopeBulletList entries={set.outcomeEnvelope.blockedOutcomes} />
          </div>
          <div className="rounded-lg border border-violet-200 bg-violet-50/80 px-2.5 py-2">
            <p className="font-semibold text-violet-950">Unstable</p>
            <OutcomeEnvelopeBulletList entries={set.outcomeEnvelope.unstableOutcomes} />
          </div>
        </div>
        {set.outcomeEnvelope.notes.length ? (
          <div className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-2 text-stone-700">
            <span className="font-medium text-stone-900">Notes: </span>
            {set.outcomeEnvelope.notes.join(" · ")}
          </div>
        ) : null}
      </div>

      {debug ? (
        <details className="rounded-lg border border-stone-300 bg-stone-900 p-3 text-xs text-amber-50">
          <summary className="cursor-pointer font-medium text-amber-100">Stage 8 debug JSON</summary>
          <pre className="mt-2 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed">
            {JSON.stringify(
              {
                stage8StructuredPatch: set.stage8StructuredPatch,
                sceneReadinessClass: set.sceneReadinessClass,
                sceneReadinessClassSource: set.sceneReadinessClassSource,
                stage8PolicyProvenance: set.stage8PolicyProvenance,
                sourcesLinkedCount: set.sourcesLinkedCount,
                historicalConfidence: set.historicalConfidence,
                outcomeEnvelope: set.outcomeEnvelope,
                readiness: legality.readiness,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : (
        <p className="text-[11px] text-stone-500">
          Add <code className="text-stone-700">?debug=1</code> to the URL for structured patch + readiness JSON.
        </p>
      )}

      <p className="text-[11px] text-stone-500">Spec: repo file docs/stage-8-scene-legality-layer.md</p>
    </div>
  );
}
