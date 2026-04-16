import type { ChapterCompositionPlan } from "@/lib/domain/chapter-composition";
import type { LiteraryDeviceApplicationPlan } from "@/lib/domain/literary-device-control";
import { SceneGenerationRequestSchema, type SceneGenerationRequest } from "@/lib/domain/scene-generation-engine";
import type { ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";

export class SceneGenerationRequestDerivationService {
  derive(input: {
    chapterId: string;
    parentBookId: string;
    parentChapterStateId: string;
    parentNarrativePsychologyId: string;
    chapterCompositionPlan: ChapterCompositionPlan;
    sequencePlanId?: string;
    activeThreadPackId: string;
    routeLedgerSnapshot: Record<string, unknown>;
    philosophyPropagationPlanId: string;
    callbackPlanId: string;
    reinterpretationAnchorSetId: string;
    chapterLevelProseConstraints: ProseGenerationConstraints;
    chapterLevelLiteraryDevicePlan: LiteraryDeviceApplicationPlan;
  }): SceneGenerationRequest {
    return SceneGenerationRequestSchema.parse({
      artifact: "scene_generation_request",
      schemaVersion: "1.0.0",
      requestId: `${input.chapterId}:scene-generation-request`,
      chapterId: input.chapterId,
      parentBookId: input.parentBookId,
      parentChapterStateId: input.parentChapterStateId,
      parentNarrativePsychologyId: input.parentNarrativePsychologyId,
      parentChapterCompositionPlanId: input.chapterCompositionPlan.compositionPlanId,
      parentSequencePlanId: input.sequencePlanId,
      activeThreadPackId: input.activeThreadPackId,
      scenePlanSequence: input.chapterCompositionPlan.sceneSequence.map((scene) => scene.scenePlanId),
      routeLedgerSnapshot: input.routeLedgerSnapshot,
      philosophyPropagationPlanId: input.philosophyPropagationPlanId,
      callbackPlanId: input.callbackPlanId,
      reinterpretationAnchorSetId: input.reinterpretationAnchorSetId,
      chapterLevelProseConstraints: input.chapterLevelProseConstraints,
      chapterLevelLiteraryDevicePlan: input.chapterLevelLiteraryDevicePlan,
      validationFlags: ["composition_truth_consumed", input.sequencePlanId ? "sequence_truth_consumed" : "sequence_optional_missing"],
    });
  }
}

