import { z } from "zod";

export const EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION = "1.0.0" as const;

export const ReaderBondModeSchema = z.enum([
  "protectiveness",
  "recognition",
  "fascination",
  "ache_tenderness",
  "dread_for_character",
  "respect_admiration",
  "grief_attachment",
  "inheritance_attachment",
]);
export type ReaderBondMode = z.infer<typeof ReaderBondModeSchema>;

export const IrreversibilityClassSchema = z.enum([
  "reversible",
  "partially_reversible",
  "structurally_irreversible",
  "emotionally_irreversible",
  "historically_irreversible",
]);
export type IrreversibilityClass = z.infer<typeof IrreversibilityClassSchema>;

const IntensityWindowSchema = z.object({
  windowId: z.string().min(1),
  windowLabel: z.string().min(1),
  intensity: z.number().min(0).max(1),
});

export const VulnerabilityExposureSchema = z.object({
  exposureId: z.string().min(1),
  characterId: z.string().min(1),
  exposureType: z.enum(["body_cost", "social_cost", "moral_cost", "identity_cost", "relational_cost"]),
  visibilityMode: z.enum(["direct", "indirect", "withheld_then_revealed"]),
  severity: z.number().min(0).max(1),
  sceneWindows: z.array(z.string().min(1)).min(1),
});
export type VulnerabilityExposure = z.infer<typeof VulnerabilityExposureSchema>;

export const DesireLineSchema = z.object({
  desireLineId: z.string().min(1),
  characterId: z.string().min(1),
  desireStatement: z.string().min(1),
  clarity: z.number().min(0).max(1),
  obstructionLevel: z.number().min(0).max(1),
  chapterWindows: z.array(z.string().min(1)).min(1),
});
export type DesireLine = z.infer<typeof DesireLineSchema>;

export const FearLineSchema = z.object({
  fearLineId: z.string().min(1),
  characterId: z.string().min(1),
  fearStatement: z.string().min(1),
  salience: z.number().min(0).max(1),
  activationTriggers: z.array(z.string().min(1)).min(1),
  chapterWindows: z.array(z.string().min(1)).min(1),
});
export type FearLine = z.infer<typeof FearLineSchema>;

export const ContradictionProfileSchema = z.object({
  contradictionId: z.string().min(1),
  characterId: z.string().min(1),
  conflictStatement: z.string().min(1),
  pressure: z.number().min(0).max(1),
  consequenceRisk: z.string().min(1),
});
export type ContradictionProfile = z.infer<typeof ContradictionProfileSchema>;

export const AttachmentBondVectorSchema = z.object({
  vectorId: z.string().min(1),
  characterId: z.string().min(1),
  bondModes: z.array(ReaderBondModeSchema).min(1),
  desireClarity: z.number().min(0).max(1),
  fearPresence: z.number().min(0).max(1),
  vulnerabilityExposure: z.number().min(0).max(1),
  contradictionPressure: z.number().min(0).max(1),
  relationalDependence: z.number().min(0).max(1),
  moralIdentityRisk: z.number().min(0).max(1),
  attachmentIntensityOverTime: z.array(IntensityWindowSchema).min(1),
  bookEraVariation: z.array(
    z.object({
      eraId: z.string().min(1),
      dominantBondMode: ReaderBondModeSchema,
      rationale: z.string().min(1),
    }),
  ),
});
export type AttachmentBondVector = z.infer<typeof AttachmentBondVectorSchema>;

export const CharacterAttachmentProfileSchema = z.object({
  artifact: z.literal("character_attachment_profile"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  characterId: z.string().min(1),
  povWeightingBias: z.array(z.string().min(1)).min(1),
  chapterFunctionBias: z.array(z.string().min(1)).min(1),
  sceneRoleBias: z.array(z.string().min(1)).min(1),
  proseConstraintBias: z.array(z.string().min(1)).min(1),
  literaryDeviceBias: z.array(z.string().min(1)).min(1),
  hookOrchestrationBias: z.array(z.string().min(1)).min(1),
  vulnerabilityExposures: z.array(VulnerabilityExposureSchema).min(1),
  desireLines: z.array(DesireLineSchema).min(1),
  fearLines: z.array(FearLineSchema).min(1),
  contradictionProfile: ContradictionProfileSchema,
  bondVector: AttachmentBondVectorSchema,
  validationFlags: z.array(z.string()),
});
export type CharacterAttachmentProfile = z.infer<typeof CharacterAttachmentProfileSchema>;

export const IrreversibilityMarkerSchema = z.object({
  markerId: z.string().min(1),
  chapterId: z.string().min(1),
  sceneId: z.string().min(1),
  markerType: z.enum([
    "identity_fracture",
    "trust_damage",
    "permanent_loss",
    "memory_distortion",
    "place_rupture",
    "inheritance_burden",
    "missed_chance",
    "survival_price",
  ]),
  irreversibilityClass: IrreversibilityClassSchema,
  shadowStrength: z.number().min(0).max(1),
  consequenceShadow: z.string().min(1),
});
export type IrreversibilityMarker = z.infer<typeof IrreversibilityMarkerSchema>;

export const IdentityFractureEventSchema = z.object({
  eventId: z.string().min(1),
  characterId: z.string().min(1),
  oldIdentityClaim: z.string().min(1),
  newIdentityConstraint: z.string().min(1),
  permanence: IrreversibilityClassSchema,
});
export type IdentityFractureEvent = z.infer<typeof IdentityFractureEventSchema>;

export const RelationshipAlterationEventSchema = z.object({
  eventId: z.string().min(1),
  relationshipId: z.string().min(1),
  oldBondState: z.string().min(1),
  newBondState: z.string().min(1),
  repairDifficulty: z.number().min(0).max(1),
  permanence: IrreversibilityClassSchema,
});
export type RelationshipAlterationEvent = z.infer<typeof RelationshipAlterationEventSchema>;

export const LossLedgerEntrySchema = z.object({
  entryId: z.string().min(1),
  lossType: z.enum(["person", "trust", "place", "memory", "possibility", "self_image"]),
  lossStatement: z.string().min(1),
  accumulationWeight: z.number().min(0).max(1),
  carriedBy: z.array(z.string().min(1)).min(1),
});
export type LossLedgerEntry = z.infer<typeof LossLedgerEntrySchema>;

export const NoReturnThresholdSchema = z.object({
  thresholdId: z.string().min(1),
  thresholdLabel: z.string().min(1),
  triggerCondition: z.string().min(1),
  triggeredByMarkerIds: z.array(z.string().min(1)).min(1),
  chapterWindow: z.string().min(1),
});
export type NoReturnThreshold = z.infer<typeof NoReturnThresholdSchema>;

export const PermanentChangeRecordSchema = z.object({
  recordId: z.string().min(1),
  targetKind: z.enum(["character", "relationship", "family_line", "place", "collective_memory"]),
  targetId: z.string().min(1),
  permanentChangeStatement: z.string().min(1),
  irreversibleSince: z.string().min(1),
});
export type PermanentChangeRecord = z.infer<typeof PermanentChangeRecordSchema>;

export const ConsequenceProfileSchema = z.object({
  artifact: z.literal("consequence_profile"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  irreversibilityMarkers: z.array(IrreversibilityMarkerSchema).min(1),
  identityFractureEvents: z.array(IdentityFractureEventSchema).min(1),
  relationshipAlterationEvents: z.array(RelationshipAlterationEventSchema).min(1),
  lossLedger: z.array(LossLedgerEntrySchema).min(1),
  noReturnThresholds: z.array(NoReturnThresholdSchema).min(1),
  permanentChangeRecords: z.array(PermanentChangeRecordSchema).min(1),
  validationFlags: z.array(z.string()),
});
export type ConsequenceProfile = z.infer<typeof ConsequenceProfileSchema>;

export const RepeatingPatternSchema = z.object({
  patternId: z.string().min(1),
  patternLabel: z.string().min(1),
  patternType: z.enum([
    "generational_warning_repetition",
    "inherited_fear",
    "inherited_survival_logic",
    "inherited_silence",
    "land_route_attachment",
    "recurring_relational_pattern",
  ]),
  generationWindows: z.array(z.string().min(1)).min(2),
  pressureStrength: z.number().min(0).max(1),
});
export type RepeatingPattern = z.infer<typeof RepeatingPatternSchema>;

export const InheritedPressureLineSchema = z.object({
  lineId: z.string().min(1),
  sourceGeneration: z.string().min(1),
  targetGeneration: z.string().min(1),
  pressureType: z.string().min(1),
  transmissionMode: z.enum(["direct_warning", "ritual", "silence", "misread_story", "social_enforcement"]),
});
export type InheritedPressureLine = z.infer<typeof InheritedPressureLineSchema>;

export const AttemptedBreakEventSchema = z.object({
  eventId: z.string().min(1),
  patternId: z.string().min(1),
  characterId: z.string().min(1),
  refusalAction: z.string().min(1),
  immediateCost: z.string().min(1),
  outcome: z.enum(["failed", "partial_success", "success"]),
});
export type AttemptedBreakEvent = z.infer<typeof AttemptedBreakEventSchema>;

export const DivergenceEventSchema = z.object({
  eventId: z.string().min(1),
  fromPatternId: z.string().min(1),
  divergenceType: z.enum(["new_path", "pattern_mutation", "burden_reframing"]),
  evidence: z.string().min(1),
  durability: z.number().min(0).max(1),
});
export type DivergenceEvent = z.infer<typeof DivergenceEventSchema>;

export const FalseEscapeEventSchema = z.object({
  eventId: z.string().min(1),
  assumedEscapeClaim: z.string().min(1),
  hiddenPatternReturn: z.string().min(1),
  revealWindow: z.string().min(1),
});
export type FalseEscapeEvent = z.infer<typeof FalseEscapeEventSchema>;

export const TransformationWindowSchema = z.object({
  windowId: z.string().min(1),
  generationWindow: z.string().min(1),
  enablingConditions: z.array(z.string().min(1)).min(1),
  blockedBy: z.array(z.string().min(1)),
  transformationPotential: z.number().min(0).max(1),
});
export type TransformationWindow = z.infer<typeof TransformationWindowSchema>;

export const FateAgencyProfileSchema = z.object({
  artifact: z.literal("fate_agency_profile"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  epicQuestionTensionLine: z.string().min(1),
  repeatingPatterns: z.array(RepeatingPatternSchema).min(1),
  inheritedPressureLines: z.array(InheritedPressureLineSchema).min(1),
  attemptedBreakEvents: z.array(AttemptedBreakEventSchema).min(1),
  divergenceEvents: z.array(DivergenceEventSchema).min(1),
  falseEscapeEvents: z.array(FalseEscapeEventSchema),
  transformationWindows: z.array(TransformationWindowSchema).min(1),
  validationFlags: z.array(z.string()),
});
export type FateAgencyProfile = z.infer<typeof FateAgencyProfileSchema>;

export const RelationshipBondSchema = z.object({
  relationshipId: z.string().min(1),
  relationshipType: z.enum([
    "parent_child",
    "sibling",
    "kin",
    "chosen_kin",
    "intimate_bond",
    "mentor_witness",
    "community_collective",
    "place_relationship",
  ]),
  participants: z.array(z.string().min(1)).min(1),
  whyItMatters: z.string().min(1),
  baselineStrength: z.number().min(0).max(1),
});
export type RelationshipBond = z.infer<typeof RelationshipBondSchema>;

export const DependencyLineSchema = z.object({
  dependencyId: z.string().min(1),
  relationshipId: z.string().min(1),
  dependencyType: z.enum(["emotional", "material", "identity", "protection", "memory"]),
  asymmetry: z.number().min(0).max(1),
  exposureRisk: z.number().min(0).max(1),
});
export type DependencyLine = z.infer<typeof DependencyLineSchema>;

export const ThreatenedBondSchema = z.object({
  threatenedBondId: z.string().min(1),
  relationshipId: z.string().min(1),
  threatSource: z.string().min(1),
  threatType: z.enum(["betrayal", "distance", "violence", "silence", "institutional_pressure", "migration"]),
  riskLevel: z.number().min(0).max(1),
});
export type ThreatenedBond = z.infer<typeof ThreatenedBondSchema>;

export const UnspokenNeedSchema = z.object({
  needId: z.string().min(1),
  relationshipId: z.string().min(1),
  holderCharacterId: z.string().min(1),
  needStatement: z.string().min(1),
  visibility: z.enum(["invisible", "partially_visible", "visible_to_reader_not_characters"]),
});
export type UnspokenNeed = z.infer<typeof UnspokenNeedSchema>;

export const ShameLineSchema = z.object({
  shameLineId: z.string().min(1),
  relationshipId: z.string().min(1),
  shameSource: z.string().min(1),
  suppressionCost: z.number().min(0).max(1),
});
export type ShameLine = z.infer<typeof ShameLineSchema>;

export const ObligationLineSchema = z.object({
  obligationId: z.string().min(1),
  relationshipId: z.string().min(1),
  obligationStatement: z.string().min(1),
  burdenWeight: z.number().min(0).max(1),
});
export type ObligationLine = z.infer<typeof ObligationLineSchema>;

export const BreakRiskSchema = z.object({
  relationshipId: z.string().min(1),
  breakRisk: z.number().min(0).max(1),
  triggerFactors: z.array(z.string().min(1)).min(1),
});
export type BreakRisk = z.infer<typeof BreakRiskSchema>;

export const RepairDifficultySchema = z.object({
  relationshipId: z.string().min(1),
  repairDifficulty: z.number().min(0).max(1),
  reasons: z.array(z.string().min(1)).min(1),
});
export type RepairDifficulty = z.infer<typeof RepairDifficultySchema>;

export const RelationalStakeProfileSchema = z.object({
  artifact: z.literal("relational_stake_profile"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  relationshipBonds: z.array(RelationshipBondSchema).min(1),
  dependencyLines: z.array(DependencyLineSchema).min(1),
  threatenedBonds: z.array(ThreatenedBondSchema).min(1),
  unspokenNeeds: z.array(UnspokenNeedSchema).min(1),
  shameLines: z.array(ShameLineSchema),
  obligationLines: z.array(ObligationLineSchema).min(1),
  breakRisks: z.array(BreakRiskSchema).min(1),
  repairDifficulty: z.array(RepairDifficultySchema).min(1),
  validationFlags: z.array(z.string()),
});
export type RelationalStakeProfile = z.infer<typeof RelationalStakeProfileSchema>;

export const InheritedBurdenSchema = z.object({
  burdenId: z.string().min(1),
  burdenLabel: z.string().min(1),
  knowinglyCarried: z.boolean(),
  burdenWeight: z.number().min(0).max(1),
  mistakenForIdentity: z.boolean(),
});
export type InheritedBurden = z.infer<typeof InheritedBurdenSchema>;

export const InheritedGiftSchema = z.object({
  giftId: z.string().min(1),
  giftLabel: z.string().min(1),
  mistakenForBurden: z.boolean(),
  recoverability: z.number().min(0).max(1),
});
export type InheritedGift = z.infer<typeof InheritedGiftSchema>;

export const TransmittedWarningSchema = z.object({
  warningId: z.string().min(1),
  originalWarning: z.string().min(1),
  currentGenerationVariant: z.string().min(1),
  alteredBy: z.array(z.string().min(1)).min(1),
});
export type TransmittedWarning = z.infer<typeof TransmittedWarningSchema>;

export const BurdenMutationSchema = z.object({
  mutationId: z.string().min(1),
  burdenId: z.string().min(1),
  fromForm: z.string().min(1),
  toForm: z.string().min(1),
  mutationDriver: z.string().min(1),
});
export type BurdenMutation = z.infer<typeof BurdenMutationSchema>;

export const BurdenSilenceSchema = z.object({
  silenceId: z.string().min(1),
  suppressedBurdenId: z.string().min(1),
  silenceMechanism: z.string().min(1),
  downstreamEffect: z.string().min(1),
});
export type BurdenSilence = z.infer<typeof BurdenSilenceSchema>;

export const ReclaimedInheritanceSchema = z.object({
  reclaimId: z.string().min(1),
  burdenOrGiftId: z.string().min(1),
  reclamationAction: z.string().min(1),
  emotionalCost: z.string().min(1),
  transformedOutcome: z.string().min(1),
});
export type ReclaimedInheritance = z.infer<typeof ReclaimedInheritanceSchema>;

export const GenerationalBurdenProfileSchema = z.object({
  artifact: z.literal("generational_burden_profile"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  inheritedBurdens: z.array(InheritedBurdenSchema).min(1),
  inheritedGifts: z.array(InheritedGiftSchema).min(1),
  transmittedWarnings: z.array(TransmittedWarningSchema).min(1),
  burdenMutations: z.array(BurdenMutationSchema).min(1),
  burdenSilences: z.array(BurdenSilenceSchema).min(1),
  reclaimedInheritance: z.array(ReclaimedInheritanceSchema).min(1),
  validationFlags: z.array(z.string()),
});
export type GenerationalBurdenProfile = z.infer<typeof GenerationalBurdenProfileSchema>;

const CarryStateSchema = z.object({
  weight: z.number().min(0).max(1),
  source: z.string().min(1),
  transformedByTimeJump: z.boolean(),
});

export const ResidualEmotionStateSchema = z.object({
  stateId: z.string().min(1),
  chapterId: z.string().min(1),
  residueSummary: z.string().min(1),
  dreadCarry: CarryStateSchema,
  hopeCarry: CarryStateSchema,
  acheCarry: CarryStateSchema,
  curiosityCarry: CarryStateSchema,
  griefCarry: CarryStateSchema,
  recognitionCarry: CarryStateSchema,
});
export type ResidualEmotionState = z.infer<typeof ResidualEmotionStateSchema>;

export const UnfinishedNeedSchema = z.object({
  needId: z.string().min(1),
  needStatement: z.string().min(1),
  ownerLine: z.string().min(1),
  urgency: z.number().min(0).max(1),
});
export type UnfinishedNeed = z.infer<typeof UnfinishedNeedSchema>;

export const EmotionalCarryForwardProfileSchema = z.object({
  artifact: z.literal("emotional_carry_forward_profile"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  chapterToChapterCarry: z.array(ResidualEmotionStateSchema).min(1),
  bookToBookCarry: z.array(ResidualEmotionStateSchema).min(1),
  eraTransitionCarry: z.array(ResidualEmotionStateSchema).min(1),
  unfinishedNeeds: z.array(UnfinishedNeedSchema).min(1),
  validationFlags: z.array(z.string()),
});
export type EmotionalCarryForwardProfile = z.infer<typeof EmotionalCarryForwardProfileSchema>;

export const TemporalEmotionalContinuityProfileSchema = z.object({
  artifact: z.literal("temporal_emotional_continuity_profile"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  fromEraId: z.string().min(1),
  toEraId: z.string().min(1),
  continuousEmotionalSignature: z.array(z.string().min(1)).min(1),
  continuousAttachmentMode: z.array(ReaderBondModeSchema).min(1),
  continuousBurdenLines: z.array(z.string().min(1)).min(1),
  continuityAnchor: z.array(z.string().min(1)).min(1),
  continuousQuestionPressure: z.array(z.string().min(1)).min(1),
  continuousConsequenceShadow: z.array(z.string().min(1)).min(1),
  continuousHopeDreadLine: z.array(z.string().min(1)).min(1),
  requiredDifferences: z.array(z.string().min(1)).min(1),
  validationFlags: z.array(z.string()),
});
export type TemporalEmotionalContinuityProfile = z.infer<typeof TemporalEmotionalContinuityProfileSchema>;

const DreadHopeBalanceProfileSchema = z.object({
  dreadWeight: z.number().min(0).max(1),
  hopeWeight: z.number().min(0).max(1),
  coexistenceRule: z.string().min(1),
});

export const EpicEmotionalGravityProfileSchema = z.object({
  artifact: z.literal("epic_emotional_gravity_profile"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  epicId: z.string().min(1),
  emotionalNorthStar: z.string().min(1),
  attachmentStrategyProfileId: z.string().min(1),
  consequenceProfileId: z.string().min(1),
  fateAgencyProfileId: z.string().min(1),
  relationalStakesProfileId: z.string().min(1),
  generationalBurdenProfileId: z.string().min(1),
  emotionalCarryForwardProfileId: z.string().min(1),
  temporalEmotionalContinuityProfiles: z.array(z.string().min(1)).min(1),
  dreadHopeBalanceProfile: DreadHopeBalanceProfileSchema,
  validationFlags: z.array(z.string()),
});
export type EpicEmotionalGravityProfile = z.infer<typeof EpicEmotionalGravityProfileSchema>;

export const SeriesEmotionalGravityPlanSchema = z.object({
  seriesId: z.string().min(1),
  parentEpicId: z.string().min(1),
  emotionalRoleInEpic: z.string().min(1),
  attachmentGoals: z.array(z.string().min(1)).min(1),
  consequenceGoals: z.array(z.string().min(1)).min(1),
  fateAgencyRole: z.array(z.string().min(1)).min(1),
  relationalWeightTargets: z.array(z.string().min(1)).min(1),
  generationalBurdenTargets: z.array(z.string().min(1)).min(1),
  carryForwardTargets: z.array(z.string().min(1)).min(1),
  fearHopeMix: DreadHopeBalanceProfileSchema,
  validationFlags: z.array(z.string()),
});
export type SeriesEmotionalGravityPlan = z.infer<typeof SeriesEmotionalGravityPlanSchema>;

export const BookEmotionalGravityPlanSchema = z.object({
  bookId: z.string().min(1),
  parentEpicId: z.string().min(1),
  emotionalRoleInEpic: z.string().min(1),
  attachmentGoals: z.array(z.string().min(1)).min(1),
  consequenceGoals: z.array(z.string().min(1)).min(1),
  fateAgencyRole: z.array(z.string().min(1)).min(1),
  relationalWeightTargets: z.array(z.string().min(1)).min(1),
  generationalBurdenTargets: z.array(z.string().min(1)).min(1),
  carryForwardTargets: z.array(z.string().min(1)).min(1),
  fearHopeMix: DreadHopeBalanceProfileSchema,
  validationFlags: z.array(z.string()),
});
export type BookEmotionalGravityPlan = z.infer<typeof BookEmotionalGravityPlanSchema>;

const EmotionalFunctionSchema = z.enum([
  "attach",
  "threaten_attachment",
  "escalate_consequence",
  "force_choice",
  "reveal_burden",
  "carry_forward_pressure",
  "reframe_memory",
  "partial_relief_with_shadow",
]);

export const ChapterEmotionalGravityPlanSchema = z.object({
  chapterId: z.string().min(1),
  dominantEmotionalFunction: EmotionalFunctionSchema,
  attachmentFunction: z.string().min(1),
  consequenceExposureLevel: z.number().min(0).max(1),
  relationalRiskLevel: z.number().min(0).max(1),
  vulnerabilityWindow: z.array(z.string().min(1)).min(1),
  fearLinePresence: z.array(z.string().min(1)).min(1),
  desireLinePresence: z.array(z.string().min(1)).min(1),
  irreversibilityPotential: z.number().min(0).max(1),
  fateAgencyPressure: z.number().min(0).max(1),
  carryForwardWeight: z.number().min(0).max(1),
  validationFlags: z.array(z.string()),
});
export type ChapterEmotionalGravityPlan = z.infer<typeof ChapterEmotionalGravityPlanSchema>;

export const SceneEmotionalGravityPlanSchema = z.object({
  sceneId: z.string().min(1),
  dominantEmotionalFunction: EmotionalFunctionSchema,
  attachmentFunction: z.string().min(1),
  consequenceExposureLevel: z.number().min(0).max(1),
  relationalRiskLevel: z.number().min(0).max(1),
  vulnerabilityWindow: z.array(z.string().min(1)).min(1),
  fearLinePresence: z.array(z.string().min(1)).min(1),
  desireLinePresence: z.array(z.string().min(1)).min(1),
  irreversibilityPotential: z.number().min(0).max(1),
  fateAgencyPressure: z.number().min(0).max(1),
  carryForwardWeight: z.number().min(0).max(1),
  validationFlags: z.array(z.string()),
});
export type SceneEmotionalGravityPlan = z.infer<typeof SceneEmotionalGravityPlanSchema>;

export const EpicEmotionalGravityDownstreamBiasSchema = z.object({
  artifact: z.literal("epic_emotional_gravity_downstream_bias"),
  chapterId: z.string().min(1),
  narrativePsychologyBias: z.array(z.string().min(1)).min(1),
  chapterStateBias: z.array(z.string().min(1)).min(1),
  narrativeThreadPriorityBias: z.array(z.string().min(1)).min(1),
  sequenceArchitectureBias: z.array(z.string().min(1)).min(1),
  chapterCompositionRequirements: z.array(z.string().min(1)).min(1),
  sceneGenerationPriorityBias: z.array(z.string().min(1)).min(1),
  proseConstraintBias: z.array(z.string().min(1)).min(1),
  literaryDeviceAllowanceBias: z.array(z.string().min(1)).min(1),
  hookCarryForwardBias: z.array(z.string().min(1)).min(1),
  povWeightingBias: z.array(z.string().min(1)).min(1),
});
export type EpicEmotionalGravityDownstreamBias = z.infer<typeof EpicEmotionalGravityDownstreamBiasSchema>;

export const EpicEmotionalGravityCockpitSummarySchema = z.object({
  artifact: z.literal("epic_emotional_gravity_cockpit_summary"),
  epicId: z.string().min(1),
  chapterId: z.string().min(1),
  attachmentStatusByCharacter: z.array(z.string().min(1)).min(1),
  activeFearDesireVulnerabilityLines: z.array(z.string().min(1)).min(1),
  consequenceIrreversibilityMarkers: z.array(z.string().min(1)).min(1),
  fateAgencyPressureMap: z.array(z.string().min(1)).min(1),
  relationalStakesMap: z.array(z.string().min(1)).min(1),
  generationalBurdenStatus: z.array(z.string().min(1)).min(1),
  emotionalCarryForwardSummary: z.array(z.string().min(1)).min(1),
  temporalEmotionalContinuityHealth: z.string().min(1),
  emotionallyThinWarnings: z.array(z.string()),
  resetHeavyWarnings: z.array(z.string()),
  epicEmotionalGravityScore: z.number().min(0).max(1),
  diagnostics: z.array(z.string().min(1)).min(1),
});
export type EpicEmotionalGravityCockpitSummary = z.infer<typeof EpicEmotionalGravityCockpitSummarySchema>;

export const EpicEmotionalGravityDiagnosticsSchema = z.object({
  artifact: z.literal("epic_emotional_gravity_diagnostics"),
  epicId: z.string().min(1),
  emotionalGravityStrengthScore: z.number().min(0).max(1),
  risks: z.array(z.string()),
  protections: z.array(z.string().min(1)).min(1),
  unresolvedItems: z.array(z.string()),
});
export type EpicEmotionalGravityDiagnostics = z.infer<typeof EpicEmotionalGravityDiagnosticsSchema>;

export const CamptiEpicEmotionalGravityPackSchema = z.object({
  artifact: z.literal("campti_epic_emotional_gravity_pack"),
  schemaVersion: z.literal(EPIC_EMOTIONAL_GRAVITY_SCHEMA_VERSION),
  generatedAt: z.string(),
  epicEmotionalGravityProfile: EpicEmotionalGravityProfileSchema,
  seriesEmotionalGravityPlans: z.array(SeriesEmotionalGravityPlanSchema).min(1),
  bookEmotionalGravityPlans: z.array(BookEmotionalGravityPlanSchema).min(1),
  chapterEmotionalGravityPlans: z.array(ChapterEmotionalGravityPlanSchema).min(1),
  sceneEmotionalGravityPlans: z.array(SceneEmotionalGravityPlanSchema).min(1),
  characterAttachmentProfiles: z.array(CharacterAttachmentProfileSchema).min(1),
  consequenceProfile: ConsequenceProfileSchema,
  fateAgencyProfile: FateAgencyProfileSchema,
  relationalStakesProfile: RelationalStakeProfileSchema,
  generationalBurdenProfile: GenerationalBurdenProfileSchema,
  emotionalCarryForwardProfile: EmotionalCarryForwardProfileSchema,
  temporalEmotionalContinuityProfiles: z.array(TemporalEmotionalContinuityProfileSchema).min(1),
  downstreamBias: EpicEmotionalGravityDownstreamBiasSchema,
  cockpitSummary: EpicEmotionalGravityCockpitSummarySchema,
  diagnostics: EpicEmotionalGravityDiagnosticsSchema,
});
export type CamptiEpicEmotionalGravityPack = z.infer<typeof CamptiEpicEmotionalGravityPackSchema>;
