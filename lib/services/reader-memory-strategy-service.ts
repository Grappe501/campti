import {
  ReaderMemoryStrategySchema,
  type ReaderMemoryStrategy,
} from "@/lib/domain/epic-narrative-continuity";

export class ReaderMemoryStrategyService {
  buildCamptiStrategy(): ReaderMemoryStrategy {
    return ReaderMemoryStrategySchema.parse({
      artifact: "reader_memory_strategy",
      schemaVersion: "1.0.0",
      strategyId: "campti-reader-memory-v1",
      epicId: "campti-epic",
      memoryTargets: [
        {
          targetId: "memory-target-warning-phrase",
          targetType: "phrase_image_memory",
          markingStrategy: "Embed phrase in relational dialogue, not narration commentary.",
          overSignalingGuard: "Never explain phrase significance in same scene.",
          linkedAnchorIds: ["anchor-phrase-warning"],
        },
        {
          targetId: "memory-target-river-gesture",
          targetType: "scene_shape_memory",
          markingStrategy: "Repeat the river-check beat shape before major transitions.",
          overSignalingGuard: "At least two chapters between direct explicit repeats.",
          linkedAnchorIds: ["anchor-gesture-river-check", "anchor-river-witness"],
        },
        {
          targetId: "memory-target-name-fragment",
          targetType: "symbol_memory",
          markingStrategy: "Surface name fragment in official and oral records with mismatch tension.",
          overSignalingGuard: "Keep one fragment unresolved until later-era payoff.",
          linkedAnchorIds: ["anchor-family-name-pattern"],
        },
      ],
      recognitionRewardPlans: [
        {
          planId: "reward-warning-recognition",
          targetId: "memory-target-warning-phrase",
          rewardType: "continuity-confirmation",
          emotionalOutcome: "Reader feels continuity while tone/era changes.",
        },
      ],
      recallWindows: [
        {
          recallWindowId: "recall-warning-book1",
          sourceTargetId: "memory-target-warning-phrase",
          earliestScale: "chapter",
          latestScale: "book",
          rewardMode: "recognition_reward",
          payoffCondition: "Phrase appears in mutated diction during late-book pressure moment.",
        },
        {
          recallWindowId: "recall-name-book3",
          sourceTargetId: "memory-target-name-fragment",
          earliestScale: "book",
          latestScale: "series",
          rewardMode: "reinterpretation_reward",
          payoffCondition: "Fragment maps to recovered lineage proof.",
        },
      ],
      reinterpretationRewardPlans: [
        {
          planId: "reinterpret-river-judgment",
          targetId: "memory-target-river-gesture",
          reinterpretationTrigger: "River/check gesture appears in displaced interior setting.",
          revisedMeaning: "Gesture is not superstition; it is continuity protocol under erasure.",
          emotionalCost: "Recognition carries grief and pride simultaneously.",
        },
      ],
      callbackIntegrationRules: [
        "Each recall window must connect to callback/reentry plans.",
        "Every reinterpretation reward must alter meaning, not simply confirm prior interpretation.",
      ],
      validationFlags: ["memory-targets-callback-compatible"],
    });
  }
}
