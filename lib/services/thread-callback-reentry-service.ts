import {
  type DelayedConvergenceEvent,
  DelayedConvergenceEventSchema,
  type NarrativeThread,
  type PovReinterpretation,
  PovReinterpretationSchema,
  type ThreadCallbackEvent,
  ThreadCallbackEventSchema,
} from "@/lib/domain/narrative-thread";

export class ThreadCallbackReentryService {
  deriveCallbackEvents(threads: NarrativeThread[]): ThreadCallbackEvent[] {
    const events: ThreadCallbackEvent[] = [];
    for (const thread of threads) {
      for (const node of thread.nodes) {
        if (!node.callbackMarker || node.laterReentryTargets.length === 0) continue;
        const target = node.laterReentryTargets[0];
        events.push(
          ThreadCallbackEventSchema.parse({
            callbackEventId: `callback:${thread.threadId}:${node.threadNodeId}`,
            threadId: thread.threadId,
            sourceNodeId: node.threadNodeId,
            reentryChapterId: target.chapterId,
            reentrySceneId: target.sceneId,
            addedMeaningLoad: Number(Math.min(1, thread.currentMeaningLoad + thread.callbackPotential * 0.2).toFixed(3)),
            marker: node.callbackMarker,
          }),
        );
      }
    }
    return events;
  }

  deriveMultiPovReinterpretation(input: {
    thread: NarrativeThread;
    sourcePov: string;
    targetPov: string;
    eventAnchorId: string;
    reinterpretationDelta: string;
    explicitness?: "low" | "medium" | "high";
  }): PovReinterpretation {
    return PovReinterpretationSchema.parse({
      reinterpretationId: `reinterpret:${input.thread.threadId}:${input.eventAnchorId}:${input.targetPov}`,
      threadId: input.thread.threadId,
      eventAnchorId: input.eventAnchorId,
      sourcePov: input.sourcePov,
      targetPov: input.targetPov,
      reinterpretationDelta: input.reinterpretationDelta,
      memoryDistortionFactor: Number(Math.max(0, Math.min(1, 1 - input.thread.memoryTraceStrength)).toFixed(3)),
      explicitness: input.explicitness ?? "medium",
    });
  }

  deriveDelayedConvergenceEvents(threads: NarrativeThread[], revealChapterId: string, revealSceneId: string): DelayedConvergenceEvent[] {
    const byKey = new Map<string, string[]>();
    for (const thread of threads) {
      for (const node of thread.nodes) {
        if (!node.hiddenConvergenceKey) continue;
        const list = byKey.get(node.hiddenConvergenceKey) ?? [];
        list.push(node.threadNodeId);
        byKey.set(node.hiddenConvergenceKey, list);
      }
    }

    const events: DelayedConvergenceEvent[] = [];
    for (const [key, sourceNodeIds] of byKey.entries()) {
      if (sourceNodeIds.length < 2) continue;
      events.push(
        DelayedConvergenceEventSchema.parse({
          convergenceId: `convergence:${key}`,
          hiddenConvergenceKey: key,
          sourceNodeIds,
          revealedInChapterId: revealChapterId,
          revealedInSceneId: revealSceneId,
          mode: this.classifyConvergenceMode(key),
          meaningGain: 0.62,
        }),
      );
    }
    return events;
  }

  private classifyConvergenceMode(key: string): DelayedConvergenceEvent["mode"] {
    if (key.includes("route") || key.includes("trade")) return "trade_disturbance";
    if (key.includes("warning")) return "warning_pattern";
    if (key.includes("philosophy")) return "philosophy_echo";
    if (key.includes("location")) return "location_reveal";
    return "network_link";
  }
}
