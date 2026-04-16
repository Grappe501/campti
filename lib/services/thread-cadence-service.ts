import { ThreadCadencePlanSchema, type ThreadCadencePlan } from "@/lib/domain/narrative-sequence";
import type { NarrativeThread } from "@/lib/domain/narrative-thread";

function cadenceByType(threadType: NarrativeThread["threadType"]): number {
  if (threadType === "continuity_thread" || threadType === "primary_plot_thread") return 1;
  if (threadType === "philosophy_thread" || threadType === "memory_thread") return 2;
  return 3;
}

export class ThreadCadenceService {
  buildPlans(input: {
    threads: NarrativeThread[];
    chapterIds: string[];
    defaultPayoffWindow: string;
  }): ThreadCadencePlan[] {
    return input.threads.map((thread) => {
      const recurrenceInterval = cadenceByType(thread.threadType);
      const introWindow = [`${input.chapterIds[0] ?? "chapter-01"}:intro`];
      const latentWindows = input.chapterIds.filter((_, index) => index % Math.max(1, recurrenceInterval) !== 0).map((chapterId) => `${chapterId}:latent`);
      const convergenceWindows = input.chapterIds
        .filter((_, index) => index >= Math.max(1, Math.floor(input.chapterIds.length * 0.6)))
        .map((chapterId) => `${chapterId}:convergence`);
      const reinterpretationWindows = thread.reinterpretationPotential >= 0.5
        ? input.chapterIds
          .filter((_, index) => index >= 1)
          .map((chapterId) => `${chapterId}:reinterpret`)
        : [];

      return ThreadCadencePlanSchema.parse({
        threadId: thread.threadId,
        introWindow,
        recurrenceInterval,
        latentWindows,
        convergenceWindows,
        reinterpretationWindows,
        payoffWindow: thread.payoffDelayProfile.expectedWindow ?? input.defaultPayoffWindow,
        disappearanceAllowance: recurrenceInterval + 1,
        echoFrequency: Number(Math.max(0.15, Math.min(0.95, thread.memoryTraceStrength)).toFixed(2)),
      });
    });
  }
}

