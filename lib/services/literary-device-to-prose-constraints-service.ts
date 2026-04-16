import type { LiteraryDeviceApplicationPlan, LiteraryDeviceValidationResult } from "@/lib/domain/literary-device-control";
import { ProseGenerationConstraintsSchema, type ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export class LiteraryDeviceToProseConstraintsService {
  apply(input: {
    constraints: ProseGenerationConstraints;
    plan: LiteraryDeviceApplicationPlan;
    validation: LiteraryDeviceValidationResult;
  }): ProseGenerationConstraints {
    const active = new Set(input.plan.activeDeviceIds);
    const hardFailedDevices = new Set(input.validation.hardFailures.map((issue) => issue.category));
    const soundPatternAllowed = active.has("alliteration") || active.has("assonance") || active.has("consonance");
    const callbackAllowed = active.has("callback_echo") || active.has("recall_phrase_image");
    const placeMemoryAllowed = active.has("place_memory") || active.has("place_residue");
    const symbolismAllowed = active.has("symbolism") || active.has("environmental_symbolism");
    const metaphorAllowed = active.has("metaphor") || active.has("simile") || active.has("analogy");
    const overloadPenalty = input.validation.softWarnings.some((warning) => warning.category === "device_overload") ? 0.12 : 0;

    return ProseGenerationConstraintsSchema.parse({
      ...input.constraints,
      dictionGuardrails: input.constraints.dictionGuardrails.concat([
        "Device carriers must remain materially grounded and thread-bound.",
        "Avoid decorative literary ornament detached from scene action.",
      ]),
      cadenceProfile: input.constraints.cadenceProfile.concat([
        soundPatternAllowed ? "Sound pattern allowances enabled for constrained descriptive lines." : "Sound pattern pressure reduced in this chapter profile.",
      ]),
      forbiddenPatterns: input.constraints.forbiddenPatterns.concat(
        hardFailedDevices.has("forced_alliteration") ? ["forced alliteration in high-tension decision lines"] : [],
        hardFailedDevices.has("decorative_symbolism_without_binding") ? ["symbolism without thread/setting/object binding"] : [],
      ),
      requiredPatterns: input.constraints.requiredPatterns.concat([
        callbackAllowed ? "Permit callback phrase/image recurrence in closure windows." : "Callback phrase recurrence disabled for this pass.",
        placeMemoryAllowed ? "Insert place-memory opportunities where memory and route contexts overlap." : "Place-memory insertion remains optional.",
      ]),
      interpretationAllowance: clamp01(
        input.constraints.interpretationAllowance + (active.has("interpretive_hesitation") ? 0.08 : 0) - overloadPenalty,
      ),
      expositionAllowance: clamp01(
        input.constraints.expositionAllowance - (active.has("philosophy_echo") ? 0.03 : 0) - overloadPenalty,
      ),
      emotionalLabelAllowance: clamp01(
        input.constraints.emotionalLabelAllowance - (active.has("philosophy_echo") ? 0.02 : 0),
      ),
      literaryDeviceConstraints: {
        activeDeviceIds: input.plan.activeDeviceIds,
        suppressedDeviceIds: input.plan.suppressedDeviceSet,
        soundPatternAllowance: soundPatternAllowed ? "bounded" : "minimal",
        symbolismAllowance: symbolismAllowed ? "bound_thread_setting_only" : "minimal",
        metaphorSimileAllowance: metaphorAllowed ? "guarded" : "minimal",
        explicitnessCeiling: active.has("philosophy_echo") ? "low" : "moderate",
        closurePressureStyle: callbackAllowed ? "callback_seeded" : "state_pressure_seeded",
        callbackPhraseAllowance: callbackAllowed,
        placeMemoryInsertionOpportunities: placeMemoryAllowed ? ["paragraph_1_open", "paragraph_3_close"] : [],
        repetitionAllowance: active.has("repetition") ? "bounded_patterned" : "rare_only",
      },
      driftFlags: input.constraints.driftFlags.concat(input.validation.driftDiagnostics),
      validationFlags: input.constraints.validationFlags.concat(["literary_device_constraints_applied"]),
    });
  }
}
