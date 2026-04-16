import {
  HookOrchestrationProfileSchema,
  type HookOrchestrationProfile,
} from "@/lib/domain/epic-narrative-continuity";

export class HookOrchestrationService {
  buildCamptiProfile(): HookOrchestrationProfile {
    return HookOrchestrationProfileSchema.parse({
      artifact: "hook_orchestration_profile",
      schemaVersion: "1.0.0",
      profileId: "campti-hook-orchestration-v1",
      epicId: "campti-epic",
      hookLayers: [
        {
          layerId: "hook-layer-scene",
          layerType: "line_scene_curiosity",
          activationLogic: ["Open scene on lived tension signal.", "End with unresolved but meaningful pressure."],
          antiCheapCliffhangerRule: "No pure shock ending; every scene hook must tie to identity or continuity pressure.",
        },
        {
          layerId: "hook-layer-thread",
          layerType: "thread_curiosity",
          activationLogic: ["Seed delayed convergence markers.", "Trigger callback windows with altered context."],
          antiCheapCliffhangerRule: "Thread hooks require evidence-linked uncertainty.",
        },
        {
          layerId: "hook-layer-character",
          layerType: "character_attachment",
          activationLogic: ["Bind hooks to feared relational loss or duty transfer."],
          antiCheapCliffhangerRule: "No mechanical jeopardy without attachment consequence.",
        },
        {
          layerId: "hook-layer-philosophy",
          layerType: "philosophical_curiosity",
          activationLogic: ["Reframe prior scene meaning through continuity question lens."],
          antiCheapCliffhangerRule: "Philosophical hooks must emerge from action and memory evidence.",
        },
        {
          layerId: "hook-layer-epic-question",
          layerType: "epic_question_curiosity",
          activationLogic: ["Each chapter closure echoes central epic question variant."],
          antiCheapCliffhangerRule: "Avoid explicit thesis statements; use symbolic and relational expression.",
        },
      ],
      hookCadencePlan: [
        {
          cadencePlanId: "hook-cadence-chapter",
          scale: "chapter",
          targetDensity: 0.78,
          carryForwardModes: ["unresolved-meaning", "attachment-under-threat", "anticipated-revelation"],
        },
        {
          cadencePlanId: "hook-cadence-book",
          scale: "book",
          targetDensity: 0.66,
          carryForwardModes: ["structural-connection-curiosity", "identity-persistence-curiosity"],
        },
      ],
      hookCarryForwardPlan: [
        {
          carryForwardPlanId: "hook-cf-scene-to-chapter",
          fromScale: "scene",
          toScale: "chapter",
          continuityUnderThreatSignals: ["warning pattern mismatch", "gesture appears in wrong context"],
          anticipatedRevelationSignals: ["delayed convergence key appears twice", "name fragment recurrence"],
        },
      ],
      tonalShiftGuardrails: [
        "When tone shifts, maintain at least one anchor-driven hook and one attachment-driven hook.",
        "Era jumps must preserve epic question curiosity within first two scene clusters.",
      ],
      validationFlags: ["multi-layer-hooking-enabled"],
    });
  }
}
