import type { ChapterState, ChapterStateAxisKey, ContinuityThread } from "@/lib/domain/chapter-state";
import {
  type NarrativeThread,
  type ThreadChapterStateInfluence,
  ThreadChapterStateInfluenceSchema,
} from "@/lib/domain/narrative-thread";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function threadToAxisInfluence(thread: NarrativeThread): Partial<Record<ChapterStateAxisKey, number>> {
  const weight = thread.currentTensionLevel * 10 + thread.currentMeaningLoad * 10;
  switch (thread.threadType) {
    case "continuity_thread":
    case "memory_thread":
      return {
        memory_continuity: weight * 0.45,
        meaning_load: weight * 0.3,
      };
    case "relational_thread":
      return {
        relational_heat: weight * 0.5,
        social_cohesion: -weight * 0.3,
      };
    case "movement_thread":
      return {
        movement_pressure: weight * 0.6,
        decision_pressure: weight * 0.28,
      };
    case "route_thread":
    case "setting_thread":
      return {
        external_awareness: weight * 0.45,
        signal_integrity: -weight * 0.24,
      };
    case "rumor_signal_thread":
    case "warning_thread":
      return {
        signal_integrity: -weight * 0.42,
        memory_continuity: weight * 0.2,
      };
    case "philosophy_thread":
    case "belief_worldview_thread":
      return {
        meaning_load: weight * 0.56,
        identity_stability: -weight * 0.22,
      };
    default:
      return {
        decision_pressure: weight * 0.18,
      };
  }
}

function activationCandidatesFromChapterState(chapterState: ChapterState): Array<{ type: NarrativeThread["threadType"]; reason: string }> {
  const candidates: Array<{ type: NarrativeThread["threadType"]; reason: string }> = [];

  if (chapterState.stateAxes.signal_integrity.score <= 50) {
    candidates.push({ type: "memory_thread", reason: "Low signal integrity requires memory comparison and warning traces." });
    candidates.push({ type: "warning_thread", reason: "Signal degradation amplifies warning thread necessity." });
  }
  if (chapterState.stateAxes.movement_pressure.score >= 55) {
    candidates.push({ type: "movement_thread", reason: "High movement pressure calls route and movement threads." });
    candidates.push({ type: "route_thread", reason: "Route continuity should surface as pressure rises." });
  }
  if (chapterState.stateAxes.external_awareness.score >= 55) {
    candidates.push({ type: "rumor_signal_thread", reason: "External awareness growth increases rumor/trade signals." });
    candidates.push({ type: "trade_contact_thread", reason: "Trade contact lines become active at higher awareness." });
  }
  if (chapterState.stateAxes.identity_stability.score <= 58 || chapterState.stateAxes.meaning_load.score >= 60) {
    candidates.push({ type: "philosophy_thread", reason: "Identity pressure and meaning load activate philosophy carriers." });
    candidates.push({ type: "belief_worldview_thread", reason: "Worldview reinterpretation pressure is active." });
  }
  return candidates;
}

export class NarrativeThreadToChapterStateService {
  deriveInfluence(input: { chapterState: ChapterState; threads: NarrativeThread[] }): ThreadChapterStateInfluence {
    const deltas = new Map<ChapterStateAxisKey, number>();
    const rationales = new Map<ChapterStateAxisKey, string[]>();

    for (const thread of input.threads) {
      if (thread.currentStatus === "latent" || thread.currentStatus === "suppressed") continue;
      const influence = threadToAxisInfluence(thread);
      for (const [axis, delta] of Object.entries(influence) as Array<[ChapterStateAxisKey, number]>) {
        deltas.set(axis, (deltas.get(axis) ?? 0) + delta);
        const list = rationales.get(axis) ?? [];
        list.push(`${thread.threadId} (${thread.threadType})`);
        rationales.set(axis, list);
      }
    }

    const candidates = activationCandidatesFromChapterState(input.chapterState);
    const recommendedActivations = candidates.map((candidate) => {
      const candidateThread = input.threads.find((thread) => thread.threadType === candidate.type);
      return {
        threadId: candidateThread?.threadId ?? `recommended:${candidate.type}`,
        reason: candidate.reason,
        activationConfidence: candidateThread ? Number((0.45 + candidateThread.callbackPotential * 0.4).toFixed(3)) : 0.5,
      };
    });

    return ThreadChapterStateInfluenceSchema.parse({
      artifact: "narrative_thread_chapter_state_influence",
      chapterId: input.chapterState.chapterId,
      influencedAxes: Array.from(deltas.entries()).map(([axis, delta]) => ({
        axis,
        delta: Number(delta.toFixed(2)),
        rationale: `Derived from active threads: ${(rationales.get(axis) ?? []).join(", ")}`,
      })),
      recommendedActivations,
    });
  }

  projectContinuityThreads(threads: NarrativeThread[]): {
    activeContinuityThreads: ContinuityThread[];
    threatenedContinuityThreads: ContinuityThread[];
  } {
    const relevant = threads.filter((thread) =>
      ["continuity_thread", "memory_thread", "setting_thread", "route_thread", "philosophy_thread"].includes(thread.threadType),
    );
    const activeContinuityThreads: ContinuityThread[] = relevant
      .filter((thread) => ["active", "converging", "recalled"].includes(thread.currentStatus))
      .slice(0, 8)
      .map((thread) => ({
        threadId: thread.threadId,
        label: thread.threadName,
        strength: clampScore((thread.currentMeaningLoad * 0.6 + thread.currentTensionLevel * 0.4) * 100),
        status: "active",
      }));
    const threatenedContinuityThreads: ContinuityThread[] = relevant
      .filter((thread) => ["latent", "suppressed", "diverging", "redirected"].includes(thread.currentStatus))
      .slice(0, 8)
      .map((thread) => ({
        threadId: thread.threadId,
        label: thread.threadName,
        strength: clampScore((thread.currentTensionLevel * 0.7 + (1 - thread.currentMeaningLoad) * 0.3) * 100),
        status: thread.currentStatus === "suppressed" ? "suppressed" : "threatened",
      }));

    return { activeContinuityThreads, threatenedContinuityThreads };
  }
}
