import { createHash } from "node:crypto";

import { flattenAuthorVoiceShapingToPromptLines } from "@/lib/author-workflow/author-voice-helpers";
import type { HumanizationAdvisoryReport } from "@/lib/domain/author-voice-humanization";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import type { SceneGenerationRunResult } from "@/lib/domain/scene-generation-output";
import { analyzeProseDeterministic } from "@/lib/prose-quality";
import { prisma } from "@/lib/prisma";
import { assessProseHumanizationAdvisory } from "@/lib/scene-generation/prose-humanization-advisory";
import { adviseSocialPressureInGeneratedProse } from "@/lib/scene-generation/social-pressure-qa";
import { generateSceneProseWithModel } from "@/lib/scene-generation/scene-generation-llm-adapter";
import { loadSceneGenerationInput } from "@/lib/services/scene-generation-input-loader";
import {
  hashDependencyPlan,
  registerSceneGenerationDependencies,
  type SceneGenerationDependencyPlan,
} from "@/lib/services/scene-generation-dependency-service";

function hashGenerationInput(input: SceneGenerationInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        mode: input.generationMode,
        purpose: input.generationPurpose,
        contract: input.contract,
        hasCognition: Boolean(input.cognitionFramePayload),
        hasDt: Boolean(input.pinnedDecisionTracePayload),
        hasSocialFieldGeneration: Boolean(input.contract.socialFieldGeneration),
        hasSocialGuidanceLines: Boolean(input.socialFieldSummaryForGeneration),
        authorVoiceShaping: input.authorVoiceShaping ?? null,
      })
    )
    .digest("hex");
}

function buildDependencyPlanFromInput(input: SceneGenerationInput): SceneGenerationDependencyPlan {
  const c = input.contract;
  return {
    sceneId: c.scene.id,
    assertionIds: c.genealogicalAssertions.map((a) => a.id),
    personIds: c.participatingPeople.map((p) => p.id),
    worldStateId: c.effectiveWorldState.worldStateId,
    placeId: c.place?.id ?? null,
    epicId: c.epic.id,
    bookId: c.book.id,
    chapterId: c.chapter.id,
    simulationScenarioIds: (c.linkedSimulationScenarios ?? []).map((s) => s.id),
    cognitionSessionIds: [
      ...(c.pinnedCognitionSessions ?? []).map((s) => s.id),
      ...(c.pinnedDecisionTraceSessions ?? []).map((s) => s.id),
    ],
  };
}

async function resolveBasisProse(
  sceneId: string,
  input: SceneGenerationInput
): Promise<string | null> {
  if (input.basisProseOverride?.trim()) {
    return input.basisProseOverride.trim();
  }
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { generationText: true, authoringText: true },
  });
  if (!scene) return null;
  if (input.proseBasis === "authoring_text") {
    return scene.authoringText?.trim() ?? null;
  }
  return scene.generationText?.trim() ?? scene.authoringText?.trim() ?? null;
}

export type RunSceneGenerationParams = {
  sceneId: string;
  saveGenerationText?: boolean;
  registerDependencies?: boolean;
  runProseQuality?: boolean;
  /** Phase 6.1 — append deterministic social-pressure advisories to `output.warnings`. Default true. */
  runSocialPressureAdvisory?: boolean;
  proseQaContext?: SceneGenerationInput["proseQaContext"];
  /** Forwarded to `loadSceneGenerationInput`. */
  loaderOptions?: Parameters<typeof loadSceneGenerationInput>[2];
  /** Overrides loader defaults when provided. */
  inputOverride?: Partial<SceneGenerationInput>;
  /** Phase 7 — append deterministic humanization advisories to warnings. Default true. */
  runHumanizationAdvisory?: boolean;
};

export async function runSceneGeneration(
  params: RunSceneGenerationParams
): Promise<SceneGenerationRunResult> {
  const proseQaContext = params.proseQaContext ?? {};
  const genInput = await loadSceneGenerationInput(params.sceneId, proseQaContext, {
    ...params.loaderOptions,
    ...params.inputOverride,
  });

  let merged: SceneGenerationInput = {
    ...genInput,
    ...(params.inputOverride ?? {}),
    proseQaContext: genInput.proseQaContext,
  };
  if (merged.authorVoiceShaping) {
    const flat = flattenAuthorVoiceShapingToPromptLines(merged.authorVoiceShaping);
    merged = {
      ...merged,
      humanizationHints: flat.humanizationHints,
      prosePresenceHints: flat.prosePresenceHints,
      witnessFrameLines: flat.witnessLines,
      voiceSummaryLines: flat.voiceSummaryLines,
      narrativeWitnessMode: merged.authorVoiceShaping.narrativeWitnessMode,
      contract: {
        ...merged.contract,
        authorVoiceShaping: merged.authorVoiceShaping,
      },
    };
  }

  const basis =
    merged.generationMode === "draft" && merged.generationPurpose === "author_draft"
      ? null
      : await resolveBasisProse(params.sceneId, merged);

  let output = await generateSceneProseWithModel(merged, basis);

  const socialBundle = merged.contract.socialFieldGeneration ?? null;
  if (params.runSocialPressureAdvisory !== false && socialBundle) {
    const extra = adviseSocialPressureInGeneratedProse(
      output.generatedText,
      socialBundle,
      merged.socialFieldQaScalars ?? null
    );
    if (extra.length) {
      output = {
        ...output,
        warnings: [...output.warnings, ...extra],
      };
    }
  }

  let humanizationAdvisory: HumanizationAdvisoryReport | null = null;
  if (params.runHumanizationAdvisory !== false) {
    humanizationAdvisory = assessProseHumanizationAdvisory(output.generatedText);
    if (humanizationAdvisory.findings.length) {
      output = {
        ...output,
        warnings: [
          ...output.warnings,
          ...humanizationAdvisory.findings.map((f) => `[humanization:${f.code}] ${f.message}`),
        ],
      };
    }
  }

  let savedGenerationText = false;
  if (params.saveGenerationText) {
    await prisma.scene.update({
      where: { id: params.sceneId },
      data: { generationText: output.generatedText },
    });
    savedGenerationText = true;
  }

  const plan = buildDependencyPlanFromInput(merged);
  const inputHash = hashGenerationInput(merged);
  let registeredDependencyIds: string[] = [];
  if (params.registerDependencies !== false) {
    registeredDependencyIds = await registerSceneGenerationDependencies(plan, inputHash);
  }

  let proseQuality: SceneGenerationRunResult["proseQuality"];
  if (params.runProseQuality) {
    proseQuality = analyzeProseDeterministic(output.generatedText, merged.proseQaContext);
  }

  return {
    output,
    proseQuality,
    savedGenerationText,
    registeredDependencyIds,
    socialFieldGeneration: socialBundle,
    socialFieldQaScalars: merged.socialFieldQaScalars ?? null,
    humanizationAdvisory,
  };
}

export async function buildSceneGenerationInputForAction(
  sceneId: string,
  proseQaContext: SceneGenerationInput["proseQaContext"],
  options?: Parameters<typeof loadSceneGenerationInput>[2]
): Promise<SceneGenerationInput> {
  return loadSceneGenerationInput(sceneId, proseQaContext, options);
}

/** Thin entry points — same model call; purpose/mode live on `SceneGenerationInput`. */
export async function generateSceneDraft(sceneId: string, opts?: RunSceneGenerationParams) {
  return runSceneGeneration({
    ...opts,
    sceneId,
    inputOverride: {
      generationMode: "draft",
      generationPurpose: "author_draft",
      ...opts?.inputOverride,
    },
  });
}

export async function rewriteSceneDraft(sceneId: string, opts?: RunSceneGenerationParams) {
  return runSceneGeneration({
    ...opts,
    sceneId,
    inputOverride: {
      generationMode: "rewrite",
      generationPurpose: "prose_rewrite",
      proseBasis: opts?.inputOverride?.proseBasis ?? "generation_text",
      ...opts?.inputOverride,
    },
  });
}

export async function repairSceneContinuity(sceneId: string, opts?: RunSceneGenerationParams) {
  return runSceneGeneration({
    ...opts,
    sceneId,
    inputOverride: {
      generationMode: "repair",
      generationPurpose: "continuity_repair",
      proseBasis: opts?.inputOverride?.proseBasis ?? "generation_text",
      ...opts?.inputOverride,
    },
  });
}

export { hashDependencyPlan };
