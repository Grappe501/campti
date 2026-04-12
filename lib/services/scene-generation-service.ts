import { createHash } from "node:crypto";

import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import type { SceneGenerationRunResult } from "@/lib/domain/scene-generation-output";
import { analyzeProseDeterministic } from "@/lib/prose-quality";
import { prisma } from "@/lib/prisma";
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
  /** Overrides loader defaults when provided. */
  inputOverride?: Partial<Pick<SceneGenerationInput, "generationMode" | "generationPurpose" | "proseBasis" | "basisProseOverride">>;
  proseQaContext?: SceneGenerationInput["proseQaContext"];
};

export async function runSceneGeneration(
  params: RunSceneGenerationParams
): Promise<SceneGenerationRunResult> {
  const proseQaContext = params.proseQaContext ?? {};
  const genInput = await loadSceneGenerationInput(params.sceneId, proseQaContext, {
    generationMode: params.inputOverride?.generationMode,
    generationPurpose: params.inputOverride?.generationPurpose,
    proseBasis: params.inputOverride?.proseBasis,
    basisProseOverride: params.inputOverride?.basisProseOverride,
  });

  const merged: SceneGenerationInput = {
    ...genInput,
    ...(params.inputOverride ?? {}),
    proseQaContext: genInput.proseQaContext,
  };

  const basis =
    merged.generationMode === "draft" && merged.generationPurpose === "author_draft"
      ? null
      : await resolveBasisProse(params.sceneId, merged);

  const output = await generateSceneProseWithModel(merged, basis);

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
  };
}

export async function buildSceneGenerationInputForAction(
  sceneId: string,
  proseQaContext: SceneGenerationInput["proseQaContext"],
  options?: Parameters<typeof loadSceneGenerationInput>[2]
) {
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
