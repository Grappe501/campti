import type { CharacterCognitionFrame } from "@/lib/domain/cognition";
import type {
  ActionCandidate,
  AlternateOutcomeHypothesis,
  DecisionPressureBreakdown,
  DecisionTraceRequest,
  DecisionTraceResponse,
  DecisionTraceSimulationBridge,
} from "@/lib/domain/decision-trace";
import { buildDecisionTraceRequest } from "@/lib/decision-trace/build-decision-trace-request";
import {
  buildDecisionPressureBreakdown,
  compareSelectedVsAlternateAction,
} from "@/lib/decision-trace/decision-trace-deterministic";
import { openAiDecisionTraceAdapter } from "@/lib/decision-trace/decision-trace-llm-adapter";
import type { ResolveCognitionFrameSimulationOptions } from "@/lib/domain/simulation-run";
import {
  cognitionFrameToPromptPayload,
  resolveCharacterCognitionFrame,
} from "@/lib/services/character-cognition-resolver";

export type BuildDecisionTracePackageParams = {
  characterId: string;
  sceneId: string;
  selectedAction: string | ActionCandidate;
  alternateAction?: string | ActionCandidate | null;
  /** Phase 5E: rerun decision trace on a patched cognition frame (exploratory). */
  simulation?: ResolveCognitionFrameSimulationOptions;
};

export type DecisionTracePackage = {
  frame: CharacterCognitionFrame;
  cognitionPayload: Record<string, unknown>;
  pressureBreakdown: DecisionPressureBreakdown;
  alternateHypothesis: AlternateOutcomeHypothesis | null;
  request: DecisionTraceRequest;
};

/**
 * Resolve cognition + deterministic pressure breakdown + assembled request (no LLM).
 */
export async function buildDecisionTracePackage(
  params: BuildDecisionTracePackageParams
): Promise<DecisionTracePackage> {
  const frame = await resolveCharacterCognitionFrame(
    params.characterId,
    params.sceneId,
    params.simulation
  );
  const pressureBreakdown = buildDecisionPressureBreakdown(frame);
  const cognitionPayload = {
    ...cognitionFrameToPromptPayload(frame),
    decisionTraceDeterministic: { pressureBreakdown },
  };

  const request = await buildDecisionTraceRequest({
    frame,
    cognitionFramePayload: cognitionPayload,
    selectedAction: params.selectedAction,
    alternateAction: params.alternateAction ?? null,
  });

  const altCand = request.alternateAction;
  const selCand = request.selectedAction;
  const alternateHypothesis = compareSelectedVsAlternateAction(selCand, altCand);

  return {
    frame,
    cognitionPayload,
    pressureBreakdown,
    alternateHypothesis,
    request,
  };
}

/**
 * Deterministic package + LLM structured explanation (advisory).
 */
export async function generateDecisionTrace(
  params: BuildDecisionTracePackageParams
): Promise<{
  package: DecisionTracePackage;
  response: DecisionTraceResponse;
  simulationBridge: DecisionTraceSimulationBridge;
}> {
  const pkg = await buildDecisionTracePackage(params);
  const response = await openAiDecisionTraceAdapter.generateDecisionTrace(pkg.request);
  const simulationBridge: DecisionTraceSimulationBridge = {
    traceContractVersion: "2",
    suggestedVariableKeys: [
      "embodiment.painLevel",
      "embodiment.hungerLevel",
      "desire.forbiddenPressure",
      "world.desire.visibilityRiskForDesire",
      "snapshot.currentFear",
      "snapshot.currentObligation",
    ],
    notes:
      "Phase 5E: attach same DecisionTraceRequest with SimulationVariableOverride bundles on scenario reruns; diff pressureBreakdown + response.whatCouldChangeIt across runs.",
  };
  return { package: pkg, response, simulationBridge };
}

/** @deprecated Prefer `generateDecisionTrace` + `DecisionTraceResponse`. */
export async function explainCharacterDecision(params: {
  characterId: string;
  sceneId: string;
  chosenAction: string;
  alternateAction?: string;
}): Promise<{
  response: DecisionTraceResponse;
  frame: CharacterCognitionFrame;
}> {
  const { response, package: pkg } = await generateDecisionTrace({
    characterId: params.characterId,
    sceneId: params.sceneId,
    selectedAction: params.chosenAction,
    alternateAction: params.alternateAction,
  });
  return { response, frame: pkg.frame };
}
