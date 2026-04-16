import {
  NarratorProseConstraintAdapterSchema,
  type NarratorModeProfile,
  type NarratorProseConstraintAdapter,
} from "@/lib/domain/narrator-presence";
import {
  ProseGenerationConstraintsSchema,
  type ProseGenerationConstraints,
} from "@/lib/domain/prose-generation-constraints";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function distanceDirective(level: NarratorModeProfile["currentPresenceLevel"]): ProseGenerationConstraints["narrativeDistance"] {
  if (level === "first_person") return "close_interior_observational";
  if (level === "intimate" || level === "personal") return "selective_reflective";
  if (level === "reflective" || level === "interpretive") return "very_limited_interpretive";
  return "close_externalized_embodied";
}

export class NarratorPresenceToProseService {
  deriveAdapter(input: { chapterId: string; modeProfile: NarratorModeProfile }): NarratorProseConstraintAdapter {
    const isFirstPerson = input.modeProfile.currentPresenceLevel === "first_person";
    return NarratorProseConstraintAdapterSchema.parse({
      artifact: "narrator_prose_constraint_adapter",
      chapterId: input.chapterId,
      narrativeDistanceDirective: distanceDirective(input.modeProfile.currentPresenceLevel),
      reflectionAllowance: clamp01(0.2 + input.modeProfile.emotionalStakeLevel * 0.45),
      certaintyStyleDirective:
        input.modeProfile.certaintyMode === "admitted_unknown" || input.modeProfile.certaintyMode === "memory_fragment"
          ? "bounded-uncertainty"
          : "evidence-linked-certainty",
      cadenceShiftDirective: [
        isFirstPerson ? "allow direct first-person cadence pivots." : "keep narrator cadence subordinate to character scene pressure.",
        "retain era-grounded diction even when reflective pressure increases.",
      ],
      dictionShiftDirective: [
        "favor witness vocabulary over abstract thesis language",
        isFirstPerson
          ? "allow lived-memory lexical cues where direct witness threshold is met"
          : "suppress declarative self-centered modern abstraction",
      ],
      allowedInterpretiveCommentary: [
        "continuity-anchor framing",
        "lineage-burden framing when supported by scene evidence",
        "bounded uncertainty statements about unresolved continuity pressure",
      ],
      forbiddenOmniscientOverreach: [
        "narrator cannot overwrite character-era cognition",
        "narrator cannot claim certainty without knowledge-mode support",
      ],
      narratorCharacterBoundaryRules: [
        "when character interiority is active, narrator language must stay in framing lane",
        "first-person narrator entries require trigger evidence and convergence stage readiness",
      ],
    });
  }

  applyToChapterConstraints(input: {
    constraints: ProseGenerationConstraints;
    modeProfile: NarratorModeProfile;
  }): ProseGenerationConstraints {
    const adapter = this.deriveAdapter({
      chapterId: input.constraints.chapterId,
      modeProfile: input.modeProfile,
    });

    return ProseGenerationConstraintsSchema.parse({
      ...input.constraints,
      narrativeDistance: adapter.narrativeDistanceDirective,
      interpretationAllowance: clamp01(
        input.constraints.interpretationAllowance +
          (input.modeProfile.currentPresenceLevel === "reflective" || input.modeProfile.currentPresenceLevel === "interpretive" ? 0.08 : 0.02),
      ),
      meaningReflectionAllowance: clamp01(adapter.reflectionAllowance),
      expositionAllowance: clamp01(
        input.constraints.expositionAllowance + (input.modeProfile.currentPresenceLevel === "first_person" ? 0.02 : 0),
      ),
      cadenceProfile: input.constraints.cadenceProfile.concat(adapter.cadenceShiftDirective),
      dictionGuardrails: input.constraints.dictionGuardrails.concat(adapter.dictionShiftDirective),
      forbiddenPatterns: input.constraints.forbiddenPatterns.concat(adapter.forbiddenOmniscientOverreach),
      requiredPatterns: input.constraints.requiredPatterns.concat(adapter.narratorCharacterBoundaryRules),
      validationFlags: input.constraints.validationFlags.concat("narrator_presence_to_prose_applied"),
    });
  }
}
