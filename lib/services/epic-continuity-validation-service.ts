import {
  CamptiEpicContinuityPackSchema,
  type CamptiEpicContinuityPack,
} from "@/lib/domain/epic-narrative-continuity";

export class EpicContinuityValidationService {
  private readonly hookContinuityThreshold = 0.7;

  validatePack(input: CamptiEpicContinuityPack): {
    valid: boolean;
    score: number;
    warnings: string[];
    risks: string[];
  } {
    const pack = CamptiEpicContinuityPackSchema.parse(input);
    const warnings: string[] = [];
    const risks: string[] = [];

    if (pack.epicQuestionProfile.expressionVariants.length < 3) {
      warnings.push("Epic question variants are sparse across scales.");
    }
    if (pack.anchorRegistry.activeAnchorFamilies.length < 4) {
      warnings.push("Anchor family coverage is narrow for cross-era continuity.");
    }
    if (pack.temporalTransitionProfiles.length === 0) {
      risks.push("No temporal transition profiles; era jumps may disconnect.");
    }
    for (const plan of pack.bookContinuityPlans) {
      if (plan.hookContinuityDeclaration.emotionalAttachmentDrivers.length === 0) {
        risks.push(`Book ${plan.bookId} is missing emotional attachment continuity drivers.`);
      }
      if (plan.hookContinuityDeclaration.structuralCuriosityDrivers.length === 0) {
        risks.push(`Book ${plan.bookId} is missing structural curiosity continuity drivers.`);
      }
      if (plan.hookContinuityDeclaration.philosophicalEngagementDrivers.length === 0) {
        risks.push(`Book ${plan.bookId} is missing philosophical engagement continuity drivers.`);
      }
      if (plan.hookContinuityDeclaration.unresolvedContinuityPressureCarryForward.length === 0) {
        risks.push(`Book ${plan.bookId} is missing unresolved continuity carry-forward pressure.`);
      }
      const bookAttachmentContinuityAbsent =
        plan.hookContinuityDeclaration.emotionalAttachmentDrivers.length === 0 ||
        plan.hookContinuityDeclaration.attachmentContinuitySignals.length < 2;
      const bookAnchorContinuityAbsent = plan.bookAnchorRequirements.length < 2;
      const unresolvedContinuityAbsent = plan.hookContinuityDeclaration.unresolvedContinuityPressureCarryForward.length < 2;
      const lowHookContinuity = plan.hookContinuityDeclaration.hookContinuityScore < this.hookContinuityThreshold;
      if (lowHookContinuity && (bookAttachmentContinuityAbsent || bookAnchorContinuityAbsent || unresolvedContinuityAbsent)) {
        risks.push(
          `ANTI-DROPOFF HARD-FAIL: Book boundary ${plan.bookId} has hookContinuityScore ${plan.hookContinuityDeclaration.hookContinuityScore.toFixed(2)} below ${this.hookContinuityThreshold.toFixed(2)} while required continuity signals are absent.`,
        );
      }
    }
    for (const transition of pack.temporalTransitionProfiles) {
      if (transition.hookContinuityDeclaration.emotionalAttachmentDrivers.length === 0) {
        risks.push(`Transition ${transition.profileId} is missing emotional attachment continuity drivers.`);
      }
      if (transition.hookContinuityDeclaration.structuralCuriosityDrivers.length === 0) {
        risks.push(`Transition ${transition.profileId} is missing structural curiosity continuity drivers.`);
      }
      if (transition.hookContinuityDeclaration.philosophicalEngagementDrivers.length === 0) {
        risks.push(`Transition ${transition.profileId} is missing philosophical engagement continuity drivers.`);
      }
      if (transition.hookContinuityDeclaration.unresolvedContinuityPressureCarryForward.length === 0) {
        risks.push(`Transition ${transition.profileId} is missing unresolved continuity carry-forward pressure.`);
      }
      const transitionAttachmentContinuityAbsent =
        transition.hookContinuityDeclaration.emotionalAttachmentDrivers.length === 0 ||
        transition.hookContinuityDeclaration.attachmentContinuitySignals.length < 2;
      const transitionAnchorContinuityAbsent = transition.bridgeAnchorIds.length < 2;
      const transitionUnresolvedContinuityAbsent =
        transition.hookContinuityDeclaration.unresolvedContinuityPressureCarryForward.length < 2;
      const transitionLowHook =
        transition.hookContinuityDeclaration.hookContinuityScore < this.hookContinuityThreshold;
      if (
        transitionLowHook &&
        (transitionAttachmentContinuityAbsent || transitionAnchorContinuityAbsent || transitionUnresolvedContinuityAbsent)
      ) {
        risks.push(
          `ANTI-DROPOFF HARD-FAIL: Era transition ${transition.profileId} has hookContinuityScore ${transition.hookContinuityDeclaration.hookContinuityScore.toFixed(2)} below ${this.hookContinuityThreshold.toFixed(2)} while required continuity signals are absent.`,
        );
      }

      const readerCarry = transition.hookContinuityDeclaration.readerCarryDeclaration;
      if (readerCarry.emotionalCarry.length === 0) {
        risks.push(`READER-CARRY FAIL: Transition ${transition.profileId} is missing emotional carry declaration.`);
      }
      if (readerCarry.understandingQuestion.length === 0) {
        risks.push(`READER-CARRY FAIL: Transition ${transition.profileId} is missing understanding question declaration.`);
      }
      if (readerCarry.waitingForResolution.length === 0) {
        risks.push(`READER-CARRY FAIL: Transition ${transition.profileId} is missing waiting-for-resolution declaration.`);
      }
      if (readerCarry.continuityReassuranceSignals.length === 0) {
        risks.push(`READER-CARRY FAIL: Transition ${transition.profileId} is missing continuity reassurance declaration.`);
      }
    }
    if (pack.diagnostics.continuityStrengthScore < 0.6) {
      risks.push("Continuity strength score is below target.");
    }
    if (pack.cockpitSummary.disconnectionWarnings.length > 0) {
      warnings.push(...pack.cockpitSummary.disconnectionWarnings);
    }
    if (pack.cockpitSummary.unresolvedEpicContinuityRisks.length > 0) {
      risks.push(...pack.cockpitSummary.unresolvedEpicContinuityRisks);
    }

    const score = Number(Math.max(0, 1 - warnings.length * 0.04 - risks.length * 0.12).toFixed(3));
    return {
      valid: risks.length === 0,
      score,
      warnings,
      risks,
    };
  }
}
