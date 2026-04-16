import { RecallReframingPlanSchema, type RecallReframingPlan } from "@/lib/domain/narrative-sequence";
import type { ReinterpretationAnchor } from "@/lib/domain/chapter-composition";

export class RecallReframingService {
  buildPlans(input: {
    chapterId: string;
    reinterpretationAnchors: ReinterpretationAnchor[];
  }): RecallReframingPlan[] {
    return input.reinterpretationAnchors.map((anchor) =>
      RecallReframingPlanSchema.parse({
        eventId: anchor.reinterpretationAnchorId,
        originalChapter: input.chapterId,
        recallWindow: [anchor.reentryEligibilityWindow, "chapter+2:echo_window"],
        reinterpretationWindow: [`${anchor.reentryEligibilityWindow}:alternate_pov`, "book-mid:convergence_reframe"],
        povShiftOptions: anchor.alternatePovCandidates,
        meaningShiftRules: [
          anchor.likelyMeaningShift,
          `Hidden delta: ${anchor.hiddenInformationDelta}`,
        ],
        memoryDistortionAllowance: Number(Math.min(0.8, 0.2 + anchor.sourceThreadIds.length * 0.12).toFixed(2)),
      }),
    );
  }
}

