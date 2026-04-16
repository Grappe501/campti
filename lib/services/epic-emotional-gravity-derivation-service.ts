import {
  BookEmotionalGravityPlanSchema,
  CamptiEpicEmotionalGravityPackSchema,
  EpicEmotionalGravityCockpitSummarySchema,
  EpicEmotionalGravityDiagnosticsSchema,
  EpicEmotionalGravityDownstreamBiasSchema,
  EpicEmotionalGravityProfileSchema,
  SeriesEmotionalGravityPlanSchema,
  type CamptiEpicEmotionalGravityPack,
} from "@/lib/domain/epic-emotional-gravity";
import { CharacterAttachmentEngineService } from "@/lib/services/character-attachment-engine-service";
import { EmotionalCarryForwardService } from "@/lib/services/emotional-carry-forward-service";
import { FateAgencyEngineService } from "@/lib/services/fate-agency-engine-service";
import { GenerationalBurdenService } from "@/lib/services/generational-burden-service";
import { IrreversibilityConsequenceService } from "@/lib/services/irreversibility-consequence-service";
import { RelationalStakesService } from "@/lib/services/relational-stakes-service";
import { TemporalEmotionalContinuityService } from "@/lib/services/temporal-emotional-continuity-service";

export class EpicEmotionalGravityDerivationService {
  private readonly attachment = new CharacterAttachmentEngineService();

  private readonly consequence = new IrreversibilityConsequenceService();

  private readonly fateAgency = new FateAgencyEngineService();

  private readonly relational = new RelationalStakesService();

  private readonly burden = new GenerationalBurdenService();

  private readonly carryForward = new EmotionalCarryForwardService();

  private readonly temporal = new TemporalEmotionalContinuityService();

  deriveCamptiPack(input: {
    chapterId: string;
    chapterSequence: number;
    chapterMode: string;
    chapterPsychologyMode: string;
    activeThreadIds: string[];
    recallWindows: string[];
    sceneIds: string[];
  }): CamptiEpicEmotionalGravityPack {
    const characterAttachmentProfiles = this.attachment.buildCamptiProfiles();
    const consequenceProfile = this.consequence.buildCamptiProfile();
    const fateAgencyProfile = this.fateAgency.buildCamptiProfile();
    const relationalStakesProfile = this.relational.buildCamptiProfile();
    const generationalBurdenProfile = this.burden.buildCamptiProfile();
    const emotionalCarryForwardProfile = this.carryForward.buildCamptiProfile();
    const temporalEmotionalContinuityProfiles = this.temporal.buildCamptiProfiles();
    const transitionValidation = this.temporal.validateProfiles({ profiles: temporalEmotionalContinuityProfiles });
    const { chapterPlan, scenePlans } = this.attachment.buildChapterScenePlan({
      chapterId: input.chapterId,
      sceneIds: input.sceneIds.length > 0 ? input.sceneIds : [`${input.chapterId}-scene-01`],
    });

    const seriesPlan = SeriesEmotionalGravityPlanSchema.parse({
      seriesId: "campti-trilogy-mainline",
      parentEpicId: "campti-epic",
      emotionalRoleInEpic: "Scale inherited burden into world-historical consequence without losing attachment intimacy.",
      attachmentGoals: ["Maintain protectiveness and inheritance attachment across era shifts."],
      consequenceGoals: ["Accumulate irreversible costs across books without reset feel."],
      fateAgencyRole: ["Keep repetition pressure active while opening real divergence windows."],
      relationalWeightTargets: ["Increase repair difficulty before each major convergence."],
      generationalBurdenTargets: ["Convert silence burden into reclaimable inheritance by final movement."],
      carryForwardTargets: ["Each ending must preserve dread + hope + unfinished need."],
      fearHopeMix: {
        dreadWeight: 0.56,
        hopeWeight: 0.44,
        coexistenceRule: "Hope must emerge through cost-bearing action, never by consequence erasure.",
      },
      validationFlags: ["series-emotional-role-defined"],
    });

    const bookPlan = BookEmotionalGravityPlanSchema.parse({
      bookId: "book1",
      parentEpicId: "campti-epic",
      emotionalRoleInEpic: "Install attachment and warning-burden architecture under rising pressure.",
      attachmentGoals: ["Make reader protective of continuity keepers and burdened inheritors."],
      consequenceGoals: ["Establish identity and trust changes that cannot fully revert."],
      fateAgencyRole: ["Show first clear attempts to break inherited silence pattern."],
      relationalWeightTargets: ["Parent/child warning transmission must carry primary emotional risk."],
      generationalBurdenTargets: ["Seed burden mutation from protective silence to inherited ache."],
      carryForwardTargets: ["Close with unresolved need plus emotional residue bridge into next book."],
      fearHopeMix: {
        dreadWeight: 0.61,
        hopeWeight: 0.39,
        coexistenceRule: "Hope survives only if relationship repair remains possible but costly.",
      },
      validationFlags: ["book-emotional-role-defined"],
    });

    const epicEmotionalGravityProfile = EpicEmotionalGravityProfileSchema.parse({
      artifact: "epic_emotional_gravity_profile",
      schemaVersion: "1.0.0",
      epicId: "campti-epic",
      emotionalNorthStar: "Attachment under pressure produces irreversible identity change with burdened hope.",
      attachmentStrategyProfileId: characterAttachmentProfiles[0]?.profileId ?? "attachment-missing",
      consequenceProfileId: consequenceProfile.profileId,
      fateAgencyProfileId: fateAgencyProfile.profileId,
      relationalStakesProfileId: relationalStakesProfile.profileId,
      generationalBurdenProfileId: generationalBurdenProfile.profileId,
      emotionalCarryForwardProfileId: emotionalCarryForwardProfile.profileId,
      temporalEmotionalContinuityProfiles: temporalEmotionalContinuityProfiles.map((row) => row.profileId),
      dreadHopeBalanceProfile: {
        dreadWeight: 0.58,
        hopeWeight: 0.42,
        coexistenceRule: "Never dissolve dread without preserving burden memory.",
      },
      validationFlags: ["core-emotional-architecture-wired"],
    });

    const downstreamBias = EpicEmotionalGravityDownstreamBiasSchema.parse({
      artifact: "epic_emotional_gravity_downstream_bias",
      chapterId: input.chapterId,
      narrativePsychologyBias: [
        `prioritize ${input.chapterPsychologyMode} with explicit vulnerability exposure`,
        "enforce active fear/desire lines in chapter emotional objective",
      ],
      chapterStateBias: [
        `bias chapter mode ${input.chapterMode} toward durable consequence shadow`,
        "increase relational_heat + meaning_load when irreversibility markers are active",
      ],
      narrativeThreadPriorityBias: [
        "raise priority for inheritance and relationship fracture threads",
        ...input.activeThreadIds.slice(0, 2).map((threadId) => `maintain emotional thread carry-forward: ${threadId}`),
      ],
      sequenceArchitectureBias: [
        "require consequence escalation in closure windows",
        "enforce unresolved emotional residue in next-chapter setup",
      ],
      chapterCompositionRequirements: [
        "at least one vulnerability exposure scene",
        "at least one relational risk event",
        "at least one visible consequence shadow cue",
      ],
      sceneGenerationPriorityBias: [
        "prefer attachment-rich observational framing for protectiveness bond mode",
        "increase no-reset language when irreversibility potential > 0.7",
      ],
      proseConstraintBias: [
        "close externalized embodied narration for vulnerability windows",
        "reduce abstract emotional labeling; prefer concrete burden signals",
      ],
      literaryDeviceAllowanceBias: [
        "allow inheritance motifs only when tied to burden lines",
        "allow callback phrase recurrence when reinforcing consequence memory",
      ],
      hookCarryForwardBias: [
        "end scenes with dread/hope braid rather than pure cliffhanger",
        `bridge into recall windows: ${input.recallWindows.join(", ") || "none"}`,
      ],
      povWeightingBias: [
        "weight POV toward characters with highest attachment intensity and moral risk",
        "rotate POV at era transitions only if carry-forward residues stay visible",
      ],
    });

    const attachmentStatus = this.attachment.deriveAttachmentStatus(characterAttachmentProfiles);
    const fatePressureMap = this.fateAgency.derivePressureMap(fateAgencyProfile);
    const relationalMap = this.relational.deriveRelationalMap(relationalStakesProfile);
    const burdenStatus = this.burden.deriveBurdenStatus(generationalBurdenProfile);
    const carrySummary = this.carryForward.deriveCarrySummary(emotionalCarryForwardProfile);
    const irreversibilitySummary = consequenceProfile.irreversibilityMarkers.map(
      (marker) => `${marker.markerId}:${marker.irreversibilityClass}:${marker.consequenceShadow}`,
    );

    const emotionallyThinWarnings =
      chapterPlan.vulnerabilityWindow.length > 0 &&
      chapterPlan.fearLinePresence.length > 0 &&
      chapterPlan.desireLinePresence.length > 0 &&
      chapterPlan.relationalRiskLevel > 0 &&
      chapterPlan.carryForwardWeight > 0 &&
      chapterPlan.consequenceExposureLevel > 0
        ? []
        : ["chapter-fails-anti-thin-emotion-rule"];

    const cockpitSummary = EpicEmotionalGravityCockpitSummarySchema.parse({
      artifact: "epic_emotional_gravity_cockpit_summary",
      epicId: epicEmotionalGravityProfile.epicId,
      chapterId: input.chapterId,
      attachmentStatusByCharacter: attachmentStatus,
      activeFearDesireVulnerabilityLines: [
        ...characterAttachmentProfiles.flatMap((row) => row.fearLines.map((line) => line.fearLineId)),
        ...characterAttachmentProfiles.flatMap((row) => row.desireLines.map((line) => line.desireLineId)),
        ...characterAttachmentProfiles.flatMap((row) => row.vulnerabilityExposures.map((line) => line.exposureId)),
      ],
      consequenceIrreversibilityMarkers: irreversibilitySummary,
      fateAgencyPressureMap: fatePressureMap,
      relationalStakesMap: relationalMap,
      generationalBurdenStatus: burdenStatus,
      emotionalCarryForwardSummary: carrySummary,
      temporalEmotionalContinuityHealth: transitionValidation.continuityHealth,
      emotionallyThinWarnings,
      resetHeavyWarnings:
        consequenceProfile.irreversibilityMarkers.every((marker) => marker.irreversibilityClass === "reversible")
          ? ["all-consequence-markers-reversible-risk-reset-feel"]
          : [],
      epicEmotionalGravityScore: Number(
        (
          (chapterPlan.carryForwardWeight +
            chapterPlan.consequenceExposureLevel +
            chapterPlan.relationalRiskLevel +
            Math.min(1, consequenceProfile.irreversibilityMarkers.length / 3)) /
          4
        ).toFixed(3),
      ),
      diagnostics: [
        "attachment lines active",
        "consequence shadow tracked",
        "fate/agency pressure visible",
        transitionValidation.continuityHealth,
      ],
    });

    const diagnostics = EpicEmotionalGravityDiagnosticsSchema.parse({
      artifact: "epic_emotional_gravity_diagnostics",
      epicId: epicEmotionalGravityProfile.epicId,
      emotionalGravityStrengthScore: cockpitSummary.epicEmotionalGravityScore,
      risks: cockpitSummary.emotionallyThinWarnings.concat(cockpitSummary.resetHeavyWarnings, transitionValidation.warnings),
      protections: [
        "attachment vectors include desire, fear, vulnerability, contradiction",
        "consequence model tracks irreversible identity/relationship/loss effects",
        "era transition enforces emotional continuity rule set",
      ],
      unresolvedItems: transitionValidation.warnings,
    });

    return CamptiEpicEmotionalGravityPackSchema.parse({
      artifact: "campti_epic_emotional_gravity_pack",
      schemaVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      epicEmotionalGravityProfile,
      seriesEmotionalGravityPlans: [seriesPlan],
      bookEmotionalGravityPlans: [bookPlan],
      chapterEmotionalGravityPlans: [chapterPlan],
      sceneEmotionalGravityPlans: scenePlans,
      characterAttachmentProfiles,
      consequenceProfile,
      fateAgencyProfile,
      relationalStakesProfile,
      generationalBurdenProfile,
      emotionalCarryForwardProfile,
      temporalEmotionalContinuityProfiles,
      downstreamBias,
      cockpitSummary,
      diagnostics,
    });
  }
}
