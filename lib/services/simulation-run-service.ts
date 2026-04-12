import { createHash } from "node:crypto";

import type { CognitionCanonicalStatus } from "@prisma/client";

import { buildDecisionPressureBreakdown } from "@/lib/decision-trace/decision-trace-deterministic";
import type { ActionCandidate } from "@/lib/domain/decision-trace";
import {
  SIMULATION_ENGINE_VERSION,
  SIMULATION_RUN_CONTRACT_VERSION,
  type SimulationResolutionPatch,
  type SimulationRunInput,
  type SimulationRunResult,
  type SimulationScenarioInput,
  type SimulationVariableOverride,
} from "@/lib/domain/simulation-run";
import { buildCharacterInnerVoiceRequest } from "@/lib/inner-voice/build-character-inner-voice-request";
import { openAiInnerVoiceAdapter } from "@/lib/inner-voice/inner-voice-llm-adapter";
import { cognitionPrisma } from "@/lib/prisma-cognition-access";
import {
  enrichOverridesWithBaseFrame,
  buildEffectiveSimulationContext,
} from "@/lib/simulation/apply-simulation-overrides";
import { parseSimulationOverrideSet } from "@/lib/simulation/parse-simulation-override-set";
import {
  buildSimulationComparisonSummary,
  buildSimulationDiff,
  comparePressureBreakdownPair,
} from "@/lib/simulation/simulation-diff";
import {
  cognitionFrameToPromptPayload,
  resolveCharacterCognitionFrame,
} from "@/lib/services/character-cognition-resolver";
import { generateDecisionTrace } from "@/lib/services/decision-trace-service";
import {
  createSimulationScenario,
  persistSimulationRunRecord,
} from "@/lib/services/simulation-scenario-service";

/**
 * Phase 5E orchestration: exploratory reruns sit above canonical scene rows; PINNED / promotion is explicit elsewhere.
 * See `simulation-canonical-policy.ts`.
 */

function hashSimulationInputs(parts: unknown[]): string {
  return createHash("sha256")
    .update(parts.map((p) => JSON.stringify(p)).join("\u001e"))
    .digest("hex");
}

function normalizeSelectedAction(
  input: SimulationRunInput,
  patch: SimulationResolutionPatch
): string | ActionCandidate | null {
  if (patch.selectedActionCandidate) return patch.selectedActionCandidate;
  return input.selectedAction ?? null;
}

function stripRetainedFrames(
  r: SimulationRunResult
): Omit<SimulationRunResult, "retainedFrames"> {
  const { retainedFrames: _x, ...rest } = r;
  return rest;
}

function resolveFocusCharacterId(input: SimulationRunInput): string {
  const direct = input.characterId?.trim();
  if (direct) return direct;
  const first = input.characterIds?.map((id) => id.trim()).filter(Boolean)[0];
  if (first) return first;
  throw new Error(
    "SimulationRunInput requires characterId or characterIds[0] for the focus character."
  );
}

/** Re-resolve cognition with an explicit override bundle (no DB writes). */
export async function rerunCharacterCognitionForSimulation(
  characterId: string,
  sceneId: string,
  overrides: SimulationVariableOverride[]
) {
  const { patch } = buildEffectiveSimulationContext(overrides);
  return resolveCharacterCognitionFrame(characterId, sceneId, { patch });
}

export async function buildSimulationScenario(input: SimulationScenarioInput) {
  return createSimulationScenario({
    sceneId: input.sceneId,
    title: input.title,
    baseSnapshotId: input.baseSnapshotId ?? undefined,
    variableOverridesJson: input.overrideSet as unknown as import("@prisma/client").Prisma.InputJsonValue,
    createdBy: input.createdBy ?? undefined,
  });
}

export async function executeSimulationRun(input: SimulationRunInput): Promise<SimulationRunResult> {
  const scenario = await cognitionPrisma.simulationScenario.findUniqueOrThrow({
    where: { id: input.scenarioId },
  });

  const sceneId = scenario.sceneId;
  const focusCharacterId = resolveFocusCharacterId(input);
  const overrideSet = parseSimulationOverrideSet(scenario.variableOverridesJson);
  const overrides = overrideSet.overrides;

  const { patch, unparsedOverrides } = buildEffectiveSimulationContext(overrides);

  const baseFrame = await resolveCharacterCognitionFrame(focusCharacterId, sceneId);
  const effectiveOverrides: SimulationVariableOverride[] = enrichOverridesWithBaseFrame(
    baseFrame,
    overrides
  );

  const alternateFrame = await resolveCharacterCognitionFrame(focusCharacterId, sceneId, {
    patch,
  });

  const basePayload = cognitionFrameToPromptPayload(baseFrame);
  const altPayload = cognitionFrameToPromptPayload(alternateFrame);
  const pressureBreakdownBase = buildDecisionPressureBreakdown(baseFrame);
  const pressureBreakdown = buildDecisionPressureBreakdown(alternateFrame);

  const selected = normalizeSelectedAction(input, patch);

  let decisionTraceResponse: import("@/lib/domain/decision-trace").DecisionTraceResponse | null = null;
  let decisionBase: import("@/lib/domain/decision-trace").DecisionTraceResponse | null = null;
  let decisionNext: import("@/lib/domain/decision-trace").DecisionTraceResponse | null = null;

  if (selected != null) {
    const { response: r0 } = await generateDecisionTrace({
      characterId: focusCharacterId,
      sceneId,
      selectedAction: selected,
      alternateAction: null,
    });
    const { response: r1 } = await generateDecisionTrace({
      characterId: focusCharacterId,
      sceneId,
      selectedAction: selected,
      alternateAction: null,
      simulation: { patch },
    });
    decisionBase = r0;
    decisionNext = r1;
    decisionTraceResponse = r1;
  }

  let innerVoiceResponse: import("@/lib/domain/inner-voice").CharacterInnerVoiceResponse | null = null;
  let innerVoiceBase: import("@/lib/domain/inner-voice").CharacterInnerVoiceResponse | null = null;
  let innerVoiceNext: import("@/lib/domain/inner-voice").CharacterInnerVoiceResponse | null = null;

  if (input.includeInnerVoice) {
    const mode = input.innerVoiceMode ?? "INNER_MONOLOGUE";
    const reqB = await buildCharacterInnerVoiceRequest({ frame: baseFrame, mode });
    const reqN = await buildCharacterInnerVoiceRequest({ frame: alternateFrame, mode });
    innerVoiceBase = await openAiInnerVoiceAdapter.generateInnerVoice(reqB);
    innerVoiceNext = await openAiInnerVoiceAdapter.generateInnerVoice(reqN);
    innerVoiceResponse = innerVoiceNext;
  }

  const diffFromBase = buildSimulationDiff({
    baseFrame,
    nextFrame: alternateFrame,
    pressureBase: pressureBreakdownBase,
    pressureNext: pressureBreakdown,
    decisionBase,
    decisionNext,
    innerVoiceBase,
    innerVoiceNext,
  });

  const summary = buildSimulationComparisonSummary(
    diffFromBase,
    effectiveOverrides.map((o) => o.key)
  );

  const inputHash = hashSimulationInputs([
    SIMULATION_ENGINE_VERSION,
    input.scenarioId,
    focusCharacterId,
    input.characterIds ?? null,
    sceneId,
    patch,
    effectiveOverrides,
  ]);

  const canonicalStatus: CognitionCanonicalStatus = input.canonicalStatus ?? "EXPLORATORY";

  const result: SimulationRunResult = {
    contractVersion: SIMULATION_RUN_CONTRACT_VERSION,
    engineVersion: SIMULATION_ENGINE_VERSION,
    scenarioId: input.scenarioId,
    sceneId,
    characterId: focusCharacterId,
    ...(input.characterIds?.length ? { characterIds: input.characterIds } : {}),
    createdAt: new Date().toISOString(),
    effectiveOverrides,
    appliedPatch: patch,
    inputHash,
    baseCognitionFramePayload: basePayload,
    cognitionFramePayload: altPayload,
    pressureBreakdownBase,
    pressureBreakdown,
    decisionTraceResponse,
    innerVoiceResponse,
    diffFromBase,
    summary,
    canonicalStatus,
    advisoryOnly: true,
    unparsedOverrides,
    retainedFrames: {
      base: baseFrame,
      alternate: alternateFrame,
    },
  };

  if (input.persist) {
    const stored = stripRetainedFrames(result);
    const run = await persistSimulationRunRecord({
      scenarioId: input.scenarioId,
      personId: focusCharacterId,
      inputHash,
      inputJson: {
        contractVersion: SIMULATION_RUN_CONTRACT_VERSION,
        engineVersion: SIMULATION_ENGINE_VERSION,
        characterId: focusCharacterId,
        characterIds: input.characterIds ?? null,
        sceneId,
        scenarioId: input.scenarioId,
        selectedAction: input.selectedAction ?? null,
        includeInnerVoice: Boolean(input.includeInnerVoice),
        innerVoiceMode: input.innerVoiceMode ?? null,
        canonicalStatus,
      },
      outputJson: stored as unknown as import("@prisma/client").Prisma.InputJsonValue,
      diffFromBaseJson: diffFromBase as unknown as import("@prisma/client").Prisma.InputJsonValue,
      canonicalStatus,
    });
    result.runId = run.id;
  }

  return result;
}

/**
 * Compare two exploratory runs (e.g. different scenarios or re-executions). Uses full frames when
 * `retainedFrames` is present on both results; otherwise falls back to pressure-breakdown comparison only.
 */
export function compareSimulationRuns(
  left: SimulationRunResult,
  right: SimulationRunResult
): {
  pressures: ReturnType<typeof comparePressureBreakdownPair>;
  fullDiff: ReturnType<typeof buildSimulationDiff> | null;
  summary: string;
} {
  const pressures = comparePressureBreakdownPair(left.pressureBreakdown, right.pressureBreakdown);

  if (left.retainedFrames && right.retainedFrames) {
    const fullDiff = buildSimulationDiff({
      baseFrame: left.retainedFrames.alternate,
      nextFrame: right.retainedFrames.alternate,
      pressureBase: left.pressureBreakdown,
      pressureNext: right.pressureBreakdown,
      decisionBase: left.decisionTraceResponse,
      decisionNext: right.decisionTraceResponse,
      innerVoiceBase: left.innerVoiceResponse,
      innerVoiceNext: right.innerVoiceResponse,
    });
    return {
      pressures,
      fullDiff,
      summary:
        "Full diff: alternate cognition legs vs alternate cognition legs (exploratory comparison).",
    };
  }

  return {
    pressures,
    fullDiff: null,
    summary:
      "Partial compare: pressure stacks only (reload runs without retained frames — re-execute to diff cognition stacks).",
  };
}
