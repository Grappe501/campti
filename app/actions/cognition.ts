"use server";

import type { Prisma } from "@prisma/client";

import { innerVoiceSessionStructuredSchemaV1 } from "@/lib/cognition/inner-voice-contract";
import type { CharacterInnerVoiceStructured } from "@/lib/domain/cognition";
import type { InnerVoiceMode } from "@/lib/domain/inner-voice";
import { buildCharacterInnerVoiceRequest } from "@/lib/inner-voice/build-character-inner-voice-request";
import { openAiInnerVoiceAdapter } from "@/lib/inner-voice/inner-voice-llm-adapter";
import { responseAdvisoryFlagForStatus } from "@/lib/inner-voice/pinned-policy";
import {
  cognitionFrameToPromptPayload,
  resolveCharacterCognitionFrame,
} from "@/lib/services/character-cognition-resolver";
import type { ActionCandidate } from "@/lib/domain/decision-trace";
import {
  buildDecisionTracePackage,
  explainCharacterDecision,
  generateDecisionTrace,
} from "@/lib/services/decision-trace-service";
import {
  createSimulationScenario,
  recordSimulationRun,
} from "@/lib/services/simulation-scenario-service";
import { cognitionPrisma } from "@/lib/prisma-cognition-access";

export async function actionResolveCognitionFrame(characterId: string, sceneId: string) {
  const frame = await resolveCharacterCognitionFrame(characterId, sceneId);
  return { frame, payload: cognitionFrameToPromptPayload(frame) };
}

/** Deterministic request assembly only (no LLM). */
export async function actionBuildInnerVoiceRequest(params: {
  characterId: string;
  sceneId: string;
  mode: InnerVoiceMode;
  authorQuestion?: string | null;
  approximateStoryYearOverride?: number | null;
}) {
  const frame = await resolveCharacterCognitionFrame(params.characterId, params.sceneId);
  const request = await buildCharacterInnerVoiceRequest({
    frame,
    mode: params.mode,
    authorQuestion: params.authorQuestion,
    approximateStoryYearOverride: params.approximateStoryYearOverride,
  });
  return {
    frame,
    request,
    cognitionPayload: cognitionFrameToPromptPayload(frame),
  };
}

/**
 * Resolve frame → build request → call inner voice LLM. Does not persist.
 * Output remains advisory until explicitly PINNED elsewhere.
 */
export async function actionGenerateInnerVoice(params: {
  characterId: string;
  sceneId: string;
  mode: InnerVoiceMode;
  authorQuestion?: string | null;
  approximateStoryYearOverride?: number | null;
}) {
  const { frame, request, cognitionPayload } = await actionBuildInnerVoiceRequest(params);
  const response = await openAiInnerVoiceAdapter.generateInnerVoice(request);
  return {
    frame,
    request,
    cognitionPayload,
    response,
    /** Exploratory runs are never canon until PINNED (see `pinned-policy`). */
    advisoryOnly: responseAdvisoryFlagForStatus("EXPLORATORY"),
  };
}

export async function actionSaveInnerVoiceSession(params: {
  personId: string;
  sceneId?: string | null;
  mode: "INNER_VOICE" | "DECISION_TRACE" | "ALTERNATE_RUN" | "GOD_MODE_QA";
  prompt: string;
  response: string;
  structured?: CharacterInnerVoiceStructured | null;
  canonicalStatus?: "EXPLORATORY" | "PINNED" | "REJECTED";
  inputContextJson: Prisma.InputJsonValue;
  createdBy?: string | null;
}) {
  let outputSummaryJson: Prisma.InputJsonValue | undefined;
  if (params.structured) {
    outputSummaryJson = innerVoiceSessionStructuredSchemaV1.parse(
      params.structured
    ) as unknown as Prisma.InputJsonValue;
  }
  return cognitionPrisma.characterInnerVoiceSession.create({
    data: {
      personId: params.personId,
      sceneId: params.sceneId ?? undefined,
      mode: params.mode,
      prompt: params.prompt,
      response: params.response,
      canonicalStatus: params.canonicalStatus ?? "EXPLORATORY",
      inputContextJson: params.inputContextJson,
      outputSummaryJson,
      createdBy: params.createdBy ?? undefined,
    },
  });
}

/** Deterministic decision trace package (no LLM). */
export async function actionBuildDecisionTraceRequest(params: {
  characterId: string;
  sceneId: string;
  selectedAction: string | ActionCandidate;
  alternateAction?: string | ActionCandidate | null;
}) {
  return buildDecisionTracePackage(params);
}

/** Resolve cognition → pressure breakdown → structured decision trace (LLM). Does not persist. */
export async function actionGenerateDecisionTrace(params: {
  characterId: string;
  sceneId: string;
  selectedAction: string | ActionCandidate;
  alternateAction?: string | ActionCandidate | null;
}) {
  return generateDecisionTrace(params);
}

export async function actionExplainDecision(params: {
  characterId: string;
  sceneId: string;
  chosenAction: string;
  alternateAction?: string;
}) {
  return explainCharacterDecision(params);
}

export async function actionCreateSimulationScenario(
  params: Parameters<typeof createSimulationScenario>[0]
) {
  return createSimulationScenario(params);
}

export async function actionRecordSimulationRun(
  params: Parameters<typeof recordSimulationRun>[0]
) {
  return recordSimulationRun(params);
}
