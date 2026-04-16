import {
  CamptiEpicEmotionalGravityPackSchema,
  type CamptiEpicEmotionalGravityPack,
} from "@/lib/domain/epic-emotional-gravity";

export class EpicEmotionalGravityValidationService {
  validatePack(input: CamptiEpicEmotionalGravityPack): {
    valid: boolean;
    score: number;
    warnings: string[];
    risks: string[];
  } {
    const pack = CamptiEpicEmotionalGravityPackSchema.parse(input);
    const warnings: string[] = [];
    const risks: string[] = [];

    if (pack.characterAttachmentProfiles.length < 1) risks.push("No character attachment profiles defined.");
    if (pack.consequenceProfile.irreversibilityMarkers.length < 1) risks.push("No irreversibility markers defined.");
    if (pack.fateAgencyProfile.repeatingPatterns.length < 1) risks.push("No repeating fate patterns defined.");
    if (pack.relationalStakesProfile.relationshipBonds.length < 1) risks.push("No relational stakes bonds defined.");
    if (pack.generationalBurdenProfile.inheritedBurdens.length < 1) risks.push("No inherited burdens defined.");
    if (pack.emotionalCarryForwardProfile.chapterToChapterCarry.length < 1) risks.push("No chapter carry-forward residue.");
    if (pack.temporalEmotionalContinuityProfiles.length < 1) risks.push("No temporal emotional continuity profiles.");

    for (const chapter of pack.chapterEmotionalGravityPlans) {
      const antiThinFail =
        chapter.vulnerabilityWindow.length === 0 ||
        chapter.fearLinePresence.length === 0 ||
        chapter.desireLinePresence.length === 0 ||
        chapter.relationalRiskLevel <= 0 ||
        chapter.carryForwardWeight <= 0 ||
        chapter.consequenceExposureLevel <= 0;
      if (antiThinFail) {
        risks.push(`Chapter ${chapter.chapterId} violates anti-thin emotion rule.`);
      }
    }

    for (const transition of pack.temporalEmotionalContinuityProfiles) {
      const invalidContinuity =
        transition.continuousAttachmentMode.length < 1 ||
        transition.continuousBurdenLines.length < 1 ||
        transition.continuousConsequenceShadow.length < 1 ||
        transition.continuousQuestionPressure.length < 1 ||
        transition.continuousEmotionalSignature.length < 1;
      if (invalidContinuity) {
        risks.push(`Transition ${transition.profileId} violates emotional continuity rule.`);
      }
    }

    if (pack.cockpitSummary.epicEmotionalGravityScore < 0.6) warnings.push("Epic emotional gravity score below target.");
    if (pack.cockpitSummary.emotionallyThinWarnings.length > 0) warnings.push(...pack.cockpitSummary.emotionallyThinWarnings);
    if (pack.cockpitSummary.resetHeavyWarnings.length > 0) warnings.push(...pack.cockpitSummary.resetHeavyWarnings);

    const score = Number(Math.max(0, 1 - warnings.length * 0.04 - risks.length * 0.12).toFixed(3));
    return {
      valid: risks.length === 0,
      score,
      warnings,
      risks,
    };
  }
}
