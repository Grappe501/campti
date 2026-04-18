import { flattenAuthorVoiceShapingToPromptLines } from "@/lib/author-workflow/author-voice-helpers";
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import type { HumanizationAdvisoryReport } from "@/lib/domain/author-voice-humanization";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import type { SceneGenerationRunResult } from "@/lib/domain/scene-generation-output";
import { analyzeProseDeterministic } from "@/lib/prose-quality";
import { prisma } from "@/lib/prisma";
import { computeSceneGenerationInputHash } from "@/lib/scene-generation/canonical-scene-generation-hash";
import { assessProseHumanizationAdvisory } from "@/lib/scene-generation/prose-humanization-advisory";
import { adviseSocialPressureInGeneratedProse } from "@/lib/scene-generation/social-pressure-qa";
import { generateSceneProseWithModel } from "@/lib/scene-generation/scene-generation-llm-adapter";
import { loadSceneGenerationInput } from "@/lib/services/scene-generation-input-loader";
import { prepareCanonicalPreGenerationBundleForScene } from "@/lib/services/scene-generation-governance-input-adapter";
import { HumanGravityRuntimeDerivationService } from "@/lib/services/human-gravity-runtime-derivation-service";
import { HumanGravityValidationService } from "@/lib/services/human-gravity-validation-service";
import { ProseRealismDerivationService } from "@/lib/services/prose-realism-derivation-service";
import { ProseRealismValidationService } from "@/lib/services/prose-realism-validation-service";
import {
  hashDependencyPlan,
  registerSceneGenerationDependencies,
  type SceneGenerationDependencyPlan,
} from "@/lib/services/scene-generation-dependency-service";
import { buildCluster7RuntimeTruthEnvelope } from "@/lib/services/cluster7-runtime-truth-service";
import { loadPersistedCharacterSimulationProfilesForPersonIds } from "@/lib/services/character-simulation-author-bundle-load-service";
import { CharacterSimulationRuntimeDerivationService } from "@/lib/services/character-simulation-runtime-service";
import { CharacterSimulationValidationService } from "@/lib/services/character-simulation-validation-service";
import { assertWorldStateMatchesBook } from "@/lib/services/world-book-mapper";

/**
 * Generation input hash (dependency `inputSnapshotHash`) uses
 * {@link computeSceneGenerationInputHash}: fully resolved `SceneGenerationInput` + same `basisProse`
 * passed to the model — see `lib/scene-generation/canonical-scene-generation-hash.ts`.
 * Legacy partial hashing (mode/purpose + booleans) is removed.
 */

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
  /**
   * Cluster 4 — run shared Cluster 3 narrative governance merge before the model (default true).
   * When false, generation is not canonical-governance-equivalent at the prose-constraint layer.
   */
  applyCanonicalNarrativeGovernance?: boolean;
  /** Cluster 6 — human-gravity runtime derivation + prompt injection + advisory validation (default true). */
  applyHumanGravityLayer?: boolean;
  /**
   * Cluster 8 — character simulation (mind/voice/relationship + scene emergence) on canonical path (default true).
   * Runs after human gravity so residue and no-reset pressure can shape character state.
   */
  applyCharacterSimulationLayer?: boolean;
  /** Cluster 5 — prose realism prompt shaping + validation (default true). */
  applyProseRealismLayer?: boolean;
  /**
   * When true, persist `generationText` even if realism rules mark the scene output invalid.
   * Default false — invalid generations are not saved (canonical truth: success requires valid runtime output).
   */
  allowSaveOnInvalidRealism?: boolean;
  /**
   * When true, persist `generationText` even if no-reset human-gravity rules mark the scene output invalid.
   * Default false.
   */
  allowSaveOnInvalidHumanGravity?: boolean;
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
  /** P2-E certified: preserve merge fallback for `sourceIdsUsed` / `narrativeSourcesForScene` when overrides omit them. */
  merged = {
    ...merged,
    sourceIdsUsed: merged.sourceIdsUsed ?? genInput.sourceIdsUsed,
    narrativeSourcesForScene: merged.narrativeSourcesForScene ?? genInput.narrativeSourcesForScene,
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

  let canonicalPreGeneration: SceneGenerationRunResult["canonicalPreGeneration"];
  if (params.applyCanonicalNarrativeGovernance !== false) {
    canonicalPreGeneration = await prepareCanonicalPreGenerationBundleForScene(params.sceneId);
    merged = { ...merged, canonicalPreGeneration };
  }

  if (params.applyHumanGravityLayer !== false && merged.canonicalPreGeneration?.governanceMergeApplied) {
    merged = {
      ...merged,
      humanGravityRuntime: new HumanGravityRuntimeDerivationService().deriveFromSceneGenerationInput(merged),
    };
  }

  if (params.applyCharacterSimulationLayer !== false && merged.canonicalPreGeneration?.governanceMergeApplied) {
    const personIds = merged.contract.participatingPeople.map((p) => p.id);
    const persistedMap = await loadPersistedCharacterSimulationProfilesForPersonIds(personIds);
    merged = {
      ...merged,
      persistedCharacterSimulationProfiles: Object.keys(persistedMap).length ? persistedMap : null,
    };
    merged = {
      ...merged,
      characterSimulationRuntime: new CharacterSimulationRuntimeDerivationService().derive(merged),
    };
  }

  if (params.applyProseRealismLayer !== false) {
    merged = {
      ...merged,
      proseRealismLayer: new ProseRealismDerivationService().derive(merged),
    };
  }

  /** P2-D — narrative book timeline must contain the scene’s resolved world state (when spine is calibrated). */
  await assertWorldStateMatchesBook(params.sceneId, merged.contract.book.id);

  const basis =
    merged.generationMode === "draft" && merged.generationPurpose === "author_draft"
      ? null
      : await resolveBasisProse(params.sceneId, merged);

  /** After loader merge + basis resolution; same tuple as `generateSceneProseWithModel`. */
  const inputHash = computeSceneGenerationInputHash(merged, basis);

  let output = await generateSceneProseWithModel(merged, basis);
  output = validateRegisteredContractPayload("sceneGenerationOutput", output, "write");

  let characterSimulationValidation: SceneGenerationRunResult["characterSimulationValidation"] = null;
  if (params.applyCharacterSimulationLayer !== false && merged.characterSimulationRuntime) {
    characterSimulationValidation = new CharacterSimulationValidationService().validate({
      sceneGenerationInput: merged,
      generatedText: output.generatedText,
    });
    const c8w: string[] = [];
    for (const h of characterSimulationValidation.hardIssues) {
      c8w.push(`[character_simulation:hard] ${h}`);
    }
    for (const s of characterSimulationValidation.softIssues) {
      c8w.push(`[character_simulation:soft] ${s}`);
    }
    if (c8w.length) {
      output = { ...output, warnings: [...output.warnings, ...c8w] };
    }
  }

  let humanGravityValidation: SceneGenerationRunResult["humanGravityValidation"] = null;
  if (params.applyHumanGravityLayer !== false && merged.humanGravityRuntime) {
    humanGravityValidation = new HumanGravityValidationService().validate({
      profile: merged.humanGravityRuntime,
      generatedText: output.generatedText,
    });
    const hg = humanGravityValidation.driftReport;
    const hgWarnings: string[] = [];
    for (const w of hg.hardWarnings) {
      hgWarnings.push(`[human_gravity:hard] ${w}`);
    }
    for (const w of hg.softWarnings) {
      hgWarnings.push(`[human_gravity:soft] ${w}`);
    }
    for (const v of humanGravityValidation.humanGravityTruth.noResetViolations) {
      hgWarnings.push(`[human_gravity:no_reset] ${v}`);
    }
    if (hgWarnings.length) {
      output = { ...output, warnings: [...output.warnings, ...hgWarnings] };
    }
    if (!humanGravityValidation.humanGravityTruth.sceneOutputValidUnderNoResetRules) {
      output = {
        ...output,
        continuityFlags: [...output.continuityFlags, "cluster6_human_gravity_no_reset_invalid"],
        warnings: [
          ...output.warnings,
          "[human_gravity:invalid] Scene output failed no-reset human-gravity rules — not a successful canonical generation for promotion.",
        ],
      };
    }
  }

  let proseRealism: SceneGenerationRunResult["proseRealism"] = null;
  if (params.applyProseRealismLayer !== false && merged.proseRealismLayer) {
    proseRealism = new ProseRealismValidationService().validate({
      sceneId: params.sceneId,
      generatedText: output.generatedText,
      sceneGenerationInput: merged,
      preGenerationProfile: merged.proseRealismLayer.profileSeed,
    });
    const drift = proseRealism.driftReport;
    const extraWarnings: string[] = [];
    for (const w of drift.warnings) {
      extraWarnings.push(`[prose_realism:warn] ${w}`);
    }
    for (const h of drift.hardFailures) {
      extraWarnings.push(`[prose_realism:hard] ${h}`);
    }
    if (extraWarnings.length) {
      output = { ...output, warnings: [...output.warnings, ...extraWarnings] };
    }

    if (!proseRealism.realismTruth.sceneOutputValidUnderRealismRules) {
      output = {
        ...output,
        continuityFlags: [...output.continuityFlags, "cluster5_realism_scene_output_invalid"],
        warnings: [
          ...output.warnings,
          "[prose_realism:invalid] Scene output failed realism truth rules — not a successful canonical generation for promotion.",
        ],
      };
    }
  }

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
  let generationTextSaveBlockedByRealism = false;
  let generationTextSaveBlockedByHumanGravity = false;
  if (params.saveGenerationText) {
    const realismInvalid =
      proseRealism?.realismTruth && !proseRealism.realismTruth.sceneOutputValidUnderRealismRules;
    const realismSaveBlocked = realismInvalid && params.allowSaveOnInvalidRealism !== true;

    const hgInvalid =
      humanGravityValidation?.humanGravityTruth &&
      !humanGravityValidation.humanGravityTruth.sceneOutputValidUnderNoResetRules;
    const humanGravitySaveBlocked = hgInvalid && params.allowSaveOnInvalidHumanGravity !== true;

    if (realismSaveBlocked) {
      generationTextSaveBlockedByRealism = true;
      output = {
        ...output,
        warnings: [
          ...output.warnings,
          "[prose_realism:blocked_save] generationText not persisted — scene failed realism truth rules; set allowSaveOnInvalidRealism to override.",
        ],
      };
    } else if (humanGravitySaveBlocked) {
      generationTextSaveBlockedByHumanGravity = true;
      output = {
        ...output,
        warnings: [
          ...output.warnings,
          "[human_gravity:blocked_save] generationText not persisted — scene failed no-reset human-gravity rules; set allowSaveOnInvalidHumanGravity to override.",
        ],
      };
    } else {
      await prisma.scene.update({
        where: { id: params.sceneId },
        data: { generationText: output.generatedText },
      });
      savedGenerationText = true;
    }
  }

  const plan = buildDependencyPlanFromInput(merged);
  let registeredDependencyIds: string[] = [];
  if (params.registerDependencies !== false) {
    registeredDependencyIds = await registerSceneGenerationDependencies(plan, inputHash);
  }

  let proseQuality: SceneGenerationRunResult["proseQuality"];
  if (params.runProseQuality) {
    proseQuality = analyzeProseDeterministic(output.generatedText, merged.proseQaContext);
  }

  const runResult: SceneGenerationRunResult = {
    output,
    proseQuality,
    savedGenerationText,
    registeredDependencyIds,
    socialFieldGeneration: socialBundle,
    socialFieldQaScalars: merged.socialFieldQaScalars ?? null,
    humanizationAdvisory,
    canonicalPreGeneration: merged.canonicalPreGeneration ?? null,
    characterSimulationRuntime: merged.characterSimulationRuntime ?? null,
    characterSimulationValidation,
    humanGravityRuntime: merged.humanGravityRuntime ?? null,
    humanGravityValidation,
    humanGravityTruth: humanGravityValidation?.humanGravityTruth ?? null,
    proseRealism,
    realismTruth: proseRealism?.realismTruth ?? null,
    generationTextSaveBlockedByRealism: generationTextSaveBlockedByRealism || undefined,
    generationTextSaveBlockedByHumanGravity: generationTextSaveBlockedByHumanGravity || undefined,
  };

  const cluster7RunId = `sg_${params.sceneId}_${inputHash.slice(0, 16)}`;
  const cluster7RuntimeTruth = buildCluster7RuntimeTruthEnvelope({
    runId: cluster7RunId,
    sceneId: params.sceneId,
    sceneGenerationInputHash: inputHash,
    applyCanonicalNarrativeGovernance: params.applyCanonicalNarrativeGovernance !== false,
    saveGenerationTextRequested: params.saveGenerationText === true,
    allowSaveOnInvalidRealism: params.allowSaveOnInvalidRealism === true,
    allowSaveOnInvalidHumanGravity: params.allowSaveOnInvalidHumanGravity === true,
    run: runResult,
  });

  return {
    ...runResult,
    cluster7RuntimeTruth,
  };
}

export async function buildSceneGenerationInputForAction(
  sceneId: string,
  proseQaContext: SceneGenerationInput["proseQaContext"],
  options?: Parameters<typeof loadSceneGenerationInput>[2]
): Promise<SceneGenerationInput> {
  return loadSceneGenerationInput(sceneId, proseQaContext, options);
}

/**
 * Thin entry points — same model call; purpose/mode live on `SceneGenerationInput`.
 *
 * **Governance:** Canonical server/automation callers must use `executeSceneLaunchAfterGuard` /
 * `executeMachineGuardedSceneLaunch` / `executeRehearsalGuardedSceneLaunch` so preflight, digest policy,
 * and `SceneLaunchAuditLog` stay aligned. These functions are low-level internals for cases that already
 * passed the guarded launch core (or non-canonical test utilities).
 */
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
