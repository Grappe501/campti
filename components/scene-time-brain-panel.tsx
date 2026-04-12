import Link from "next/link";
import type { ReactNode } from "react";
import type { CounterpartAlternateCandidate } from "@/lib/brain-assembly-types";
import type { RunnerTraceLine, SceneTimeBrainRunnerOutput } from "@/lib/scene-brain-runner-types";

function traceBlockTitle(label: RunnerTraceLine["label"]): string {
  switch (label) {
    case "watched_by_counterpart":
      return "Watched by counterpart";
    case "safety_from_counterpart":
      return "Seeking safety from counterpart";
    case "judgment_from_counterpart":
      return "Fear of judgment from counterpart";
    case "disclose_pull_counterpart":
      return "Desire to disclose to counterpart";
    case "mask_from_counterpart":
      return "Need to mask from counterpart";
    default:
      return label;
  }
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4">
      <div className="font-medium text-neutral-600">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <div className="text-neutral-500">None loaded.</div>;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function SceneTimeBrainPanel({
  evaluation,
  counterpartAlternates = [],
  pinnedCounterpartPersonId = null,
  hrefBrainPage,
}: {
  evaluation: SceneTimeBrainRunnerOutput;
  counterpartAlternates?: CounterpartAlternateCandidate[];
  pinnedCounterpartPersonId?: string | null;
  hrefBrainPage: (opts: { counterpartPersonId?: string | null }) => string;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <div className="text-sm text-neutral-500">
          Stage 7.5b scene-time runner
          {evaluation.counterpartSummary || counterpartAlternates.length > 0 ? " · counterpart-aware" : ""}
        </div>
        <h2 className="text-lg font-semibold">Moment evaluation</h2>
        {evaluation.counterpartSummary ? (
          <p className="mt-2 text-sm text-neutral-600">
            Relative to <span className="font-medium">{evaluation.counterpartSummary.displayName}</span>
            {evaluation.counterpartSummary.dyadLoaded ? " (relationship dyad loaded)" : " (name only — no dyad row)"}
            {evaluation.counterpartSummary.resolutionSource
              ? ` · source: ${evaluation.counterpartSummary.resolutionSource.replace(/_/g, " ")}`
              : ""}
          </p>
        ) : counterpartAlternates.length > 0 ? (
          <p className="mt-2 text-sm text-neutral-600">
            No focal counterpart was resolved — pick someone in scene to evaluate against, or add hints in scene or character JSON.
          </p>
        ) : null}
        {(counterpartAlternates.length > 0 || pinnedCounterpartPersonId) ? (
          <div className="mt-3 space-y-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/90 p-3 text-sm">
            {pinnedCounterpartPersonId ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-neutral-600">
                  Counterpart pinned via URL — resolver uses <span className="font-medium">explicit arg</span>.
                </span>
                <Link
                  className="font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-700"
                  href={hrefBrainPage({ counterpartPersonId: null })}
                >
                  Clear pin (auto-select)
                </Link>
              </div>
            ) : evaluation.counterpartSummary ? (
              <p className="text-neutral-600">
                Counterpart chosen automatically — use links below to pin someone else for this page load.
              </p>
            ) : null}
            {counterpartAlternates.length > 0 ? (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Other people in scene (likely relational salience)
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {counterpartAlternates.map((a) => (
                    <li key={a.counterpartPersonId}>
                      <Link
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-neutral-800 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-50"
                        href={hrefBrainPage({ counterpartPersonId: a.counterpartPersonId })}
                      >
                        <span className="font-medium">{a.displayName}</span>
                        <span className="text-xs tabular-nums text-neutral-500">{a.salienceScore.toFixed(0)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 text-sm text-neutral-800">
        <Line label="Regulation mode" value={evaluation.regulationMode} />
        <Line label="Dominant interpretation" value={evaluation.dominantInterpretation} />
        <Line label="Primary fear" value={evaluation.primaryFear} />
        <Line label="Most likely move" value={evaluation.mostLikelyMove ?? "None"} />
        <Line label="Salient signals" value={<List items={evaluation.salientSignals} />} />
        <Line label="Speech style" value={evaluation.speechWindow.style} />
        <Line label="Can speak" value={evaluation.speechWindow.canSpeak ? "Yes" : "No"} />
        <Line label="Safe topics" value={<List items={evaluation.speechWindow.safeTopics} />} />
        <Line label="Unsafe topics" value={<List items={evaluation.speechWindow.unsafeTopics} />} />
        <Line label="Speech blockers" value={<List items={evaluation.speechWindow.blockers} />} />
        <Line label="Available actions" value={<List items={evaluation.actionWindow.available} />} />
        <Line label="Blocked actions" value={<List items={evaluation.actionWindow.blocked} />} />
        <Line label="Costly actions" value={<List items={evaluation.actionWindow.costly} />} />
        <Line label="Safest action" value={evaluation.actionWindow.ranked.safestAction ?? "None"} />
        <Line label="Most likely action" value={evaluation.actionWindow.ranked.mostLikelyAction ?? "None"} />
        <Line label="Highest-risk temptation" value={evaluation.actionWindow.ranked.highestRiskTemptingAction ?? "None"} />
        <Line label="Action tension notes" value={<List items={evaluation.actionWindow.ranked.tensionNotes} />} />
        <Line
          label="Runner trace"
          value={
            <div className="space-y-3">
              {evaluation.runnerTrace.map((trace) => (
                <div key={trace.label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="font-medium">{traceBlockTitle(trace.label)}</div>
                  <div className="mt-1">{trace.summary}</div>
                  <div className="mt-2 text-neutral-600">
                    <List items={trace.drivers} />
                  </div>
                </div>
              ))}
            </div>
          }
        />
        <Line label="Runner notes" value={<List items={evaluation.runnerNotes} />} />
      </div>
    </section>
  );
}
