import type { CharacterCognitionFrame } from "@/lib/domain/cognition";
import type { ActionCandidate, DecisionTraceRequest } from "@/lib/domain/decision-trace";
import { buildWorldStateThoughtStyle } from "@/lib/inner-voice/framing/world-state-thought-style";
import { loadWorldStateThoughtStyleSource } from "@/lib/inner-voice/load-world-state-thought-style-source";

import {
  buildActionCandidateFromLabel,
  buildDecisionPressureBreakdown,
  compareSelectedVsAlternateAction,
  explainSelectedActionFromCognition,
} from "@/lib/decision-trace/decision-trace-deterministic";

export type BuildDecisionTraceRequestInput = {
  frame: CharacterCognitionFrame;
  cognitionFramePayload: Record<string, unknown>;
  selectedAction: string | ActionCandidate;
  alternateAction?: string | ActionCandidate | null;
};

export async function buildDecisionTraceRequest(
  input: BuildDecisionTraceRequestInput
): Promise<DecisionTraceRequest> {
  const selected =
    typeof input.selectedAction === "string"
      ? buildActionCandidateFromLabel(input.selectedAction)
      : input.selectedAction;
  const alternate =
    input.alternateAction === undefined || input.alternateAction === "" || input.alternateAction === null
      ? null
      : typeof input.alternateAction === "string"
        ? buildActionCandidateFromLabel(input.alternateAction)
        : input.alternateAction;

  const breakdown = buildDecisionPressureBreakdown(input.frame);
  const summarySkeleton = explainSelectedActionFromCognition(input.frame, selected, breakdown);
  const compare = compareSelectedVsAlternateAction(selected, alternate);
  const alternateCompareSkeleton = compare
    ? [compare.whyNotChosen, ...compare.whatWouldNeedToChange].join(" | ")
    : null;

  let worldStateStyleSummary = "";
  if (input.frame.effectiveWorldState?.id) {
    const src = await loadWorldStateThoughtStyleSource(input.frame.effectiveWorldState.id);
    worldStateStyleSummary = buildWorldStateThoughtStyle(src).summaryForModel;
  }

  return {
    contractVersion: "2",
    characterId: input.frame.characterId,
    sceneId: input.frame.sceneId,
    selectedAction: selected,
    alternateAction: alternate,
    cognitionFramePayload: input.cognitionFramePayload,
    pressureBreakdown: breakdown,
    deterministicScaffolding: {
      summarySkeleton,
      alternateCompareSkeleton,
    },
    worldStateStyleSummary,
    ageBand: input.frame.cognitionAgeBand ?? "ADULT",
    builtAtIso: new Date().toISOString(),
  };
}
