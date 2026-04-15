import { STORY_HEALTH_CONTRACT_VERSION, type StoryHealth } from "@/lib/domain/story-health";
import type { ManuscriptCoherenceFinding } from "@/lib/domain/manuscript-coherence";
import { evaluateManuscriptCoherence } from "@/lib/services/manuscript-coherence-service";

export function evaluateStoryHealth(input: {
  manuscriptId: string;
  chapterCompletions: number;
  chapterStarts: number;
  reentryEvents: number;
  sessionsObserved: number;
  abandonedInteractions: number;
  interactionEvents: number;
  coherenceFindings: ManuscriptCoherenceFinding[];
}): StoryHealth {
  const chapterCompletionRate =
    input.chapterStarts > 0 ? Number((input.chapterCompletions / input.chapterStarts).toFixed(3)) : 0;
  const reentryAnomalyScore =
    input.sessionsObserved > 0 ? Number((input.reentryEvents / input.sessionsObserved).toFixed(3)) : 0;
  const interactionAbandonmentRate =
    input.interactionEvents > 0 ? Number((input.abandonedInteractions / input.interactionEvents).toFixed(3)) : 0;

  const coherenceReport = evaluateManuscriptCoherence({
    manuscriptId: input.manuscriptId,
    findings: input.coherenceFindings,
  });
  const coherenceWarnings = coherenceReport.findings
    .filter((finding) => finding.severity !== "low")
    .map((finding) => finding.findingId);

  const critical =
    chapterCompletionRate < 0.5 ||
    interactionAbandonmentRate > 0.45 ||
    reentryAnomalyScore > 0.8 ||
    coherenceWarnings.length > 2;
  const watch =
    !critical &&
    (chapterCompletionRate < 0.75 ||
      interactionAbandonmentRate > 0.25 ||
      reentryAnomalyScore > 0.5 ||
      coherenceWarnings.length > 0);

  return {
    contractVersion: STORY_HEALTH_CONTRACT_VERSION,
    manuscriptId: input.manuscriptId,
    chapterCompletionRate,
    reentryAnomalyScore,
    interactionAbandonmentRate,
    coherenceWarnings,
    healthStatus: critical ? "critical" : watch ? "watch" : "healthy",
  };
}
