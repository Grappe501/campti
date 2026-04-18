import type { GenerationalBurdenProfile } from "@/lib/domain/epic-emotional-gravity";

export type GenerationalBurdenSceneBias = {
  activeBurdenLines: string[];
  inheritedWarningLines: string[];
  burdenPressureSummary: string;
};

/**
 * Surfaces inheritance pressure for obligation, silence, and warning recurrence.
 */
export class GenerationalBurdenRuntimeService {
  derive(input: { profile: GenerationalBurdenProfile }): GenerationalBurdenSceneBias {
    const activeBurdenLines = input.profile.inheritedBurdens.map(
      (b) =>
        `${b.burdenId}: ${b.burdenLabel} (weight ${b.burdenWeight.toFixed(2)}${
          b.mistakenForIdentity ? "; mistaken for identity" : ""
        })`,
    );

    const inheritedWarningLines = input.profile.transmittedWarnings.map(
      (w) => `${w.warningId}: ${w.currentGenerationVariant}`,
    );

    const giftBurdenConfusion = input.profile.inheritedGifts
      .filter((g) => g.mistakenForBurden)
      .map((g) => `gift_misread_as_burden:${g.giftLabel} (recoverability ${g.recoverability.toFixed(2)})`);

    const mutationLines = input.profile.burdenMutations.map(
      (m) => `burden_mutation:${m.fromForm}→${m.toForm} (${m.mutationDriver})`,
    );

    const silences = input.profile.burdenSilences.map(
      (s) => `silence:${s.silenceMechanism}→${s.downstreamEffect}`,
    );

    const mergedBurdenLines = [
      ...activeBurdenLines,
      ...giftBurdenConfusion.slice(0, 2),
      ...mutationLines.slice(0, 2),
    ].slice(0, 10);

    const burdenPressureSummary = [
      mergedBurdenLines.length ? `Inherited burdens: ${mergedBurdenLines.slice(0, 2).join(" | ")}` : "",
      inheritedWarningLines.length ? `Warnings: ${inheritedWarningLines.slice(0, 2).join(" | ")}` : "",
      silences.length ? `Silence mechanics: ${silences.slice(0, 2).join(" | ")}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      activeBurdenLines: mergedBurdenLines.slice(0, 8),
      inheritedWarningLines: inheritedWarningLines.slice(0, 8),
      burdenPressureSummary: burdenPressureSummary || "Burden profile present — prefer ritual, avoidance, or duty-shaped action over abstract theme statements.",
    };
  }
}
