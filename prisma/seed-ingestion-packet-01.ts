import type { PrismaClient } from "@prisma/client";
import {
  AttachmentStyle,
  FragmentType,
  RecordType,
  SelfPerceptionState,
  SourceType,
  StatusPosition,
  TrainingMode,
  VisibilityStatus,
  WritingMode,
} from "@prisma/client";
import { DEFAULT_BOOK_ID } from "../lib/constants/narrative-defaults";
import { FRAGMENT_DECOMPOSITION_VERSION } from "../lib/fragment-constants";

/**
 * CAMPTI INGESTION PACKET 01 — one complete vertical slice (seeded).
 *
 * Slice title: Jim Crow rural (WS-06) + Alexis Grappe + intimate disclosure / REVIEW scaffold
 *
 * Depends on: seed.ts (people, base sources), seed-environment (world states), seed-pressure,
 * seed-relationship, seedContinuity — run after those.
 *
 * Content is a production-shaped scaffold: structured admin fields are populated with
 * era-appropriate defaults; no long prose dumps. Unknowns stay blank or are marked in notes.
 */
export async function seedIngestionPacket01(prisma: PrismaClient): Promise<void> {
  const WS06 = "seed-ws-ref-ws06";
  const FOCAL = "seed-person-alexis";
  const COUNTERPART = "seed-person-francois";
  const CHAPTER_ID = "ing-pkt-01-chapter";
  const SCENE_ID = "ing-pkt-01-scene-intimate-review";
  const PLACE_ID = "demo-place-natchitoches-landing";
  const SOURCE_ID = "ing-pkt-01-source-curated";
  const CS_ID = "ing-pkt-01-cs-alexis-ws06-scene";

  await prisma.source.upsert({
    where: { id: SOURCE_ID },
    update: {
      title: "Ingestion packet 01 — curated cues (WS-06 / intimate disclosure slice)",
      summary:
        "Method note: short bullet cues for legality-relevant claims; replace with primary sources when pinned. Not a full documentary dump.",
      visibility: VisibilityStatus.REVIEW,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: false,
      processingNotes:
        "Packet 01 scaffold. Expand with era-specific citations; keep facts in Claim / Fragment rows.",
    },
    create: {
      id: SOURCE_ID,
      title: "Ingestion packet 01 — curated cues (WS-06 / intimate disclosure slice)",
      summary:
        "Method note: short bullet cues for legality-relevant claims; replace with primary sources when pinned. Not a full documentary dump.",
      visibility: VisibilityStatus.REVIEW,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: false,
      processingNotes:
        "Packet 01 scaffold. Expand with era-specific citations; keep facts in Claim / Fragment rows.",
    },
  });

  await prisma.source.update({
    where: { id: SOURCE_ID },
    data: {
      persons: { connect: [{ id: FOCAL }] },
    },
  });

  const curatedNote =
    "Curated ingestion cues (packet 01). Replace with transcribed primary material when the campaign pins a single era/scene.";

  await prisma.sourceText.upsert({
    where: { sourceId: SOURCE_ID },
    update: {
      rawText: curatedNote,
      textStatus: "stub",
      textNotes: "Intentionally short — routed to claims/fragments/world fields, not one blob.",
    },
    create: {
      sourceId: SOURCE_ID,
      rawText: curatedNote,
      textStatus: "stub",
      textNotes: "Intentionally short — routed to claims/fragments/world fields, not one blob.",
    },
  });

  await prisma.claim.upsert({
    where: { id: "ing-pkt-01-claim-public-legibility" },
    update: {
      description: "Under Jim Crow rural order, cross-status recognition in public is often coded or denied.",
      confidence: 3,
      needsReview: true,
    },
    create: {
      id: "ing-pkt-01-claim-public-legibility",
      visibility: VisibilityStatus.REVIEW,
      recordType: RecordType.HYBRID,
      description:
        "Under Jim Crow rural order, cross-status recognition in public is often coded or denied.",
      confidence: 3,
      sourceId: SOURCE_ID,
      needsReview: true,
      quoteExcerpt: null,
      notes: "Supports Stage 6 norms + Stage 8 visibility legibility; verify against chosen historical sources.",
    },
  });

  await prisma.claim.upsert({
    where: { id: "ing-pkt-01-claim-disclosure-audience" },
    update: {
      description: "Intimate truth under audience scrutiny carries reputational and safety cost, not only internal cost.",
      confidence: 3,
    },
    create: {
      id: "ing-pkt-01-claim-disclosure-audience",
      visibility: VisibilityStatus.REVIEW,
      recordType: RecordType.HYBRID,
      description:
        "Intimate truth under audience scrutiny carries reputational and safety cost, not only internal cost.",
      confidence: 3,
      sourceId: SOURCE_ID,
      needsReview: true,
      notes: "Feeds Stage 8 / 8.5 outcome envelope (disclosure vs spectacle lines).",
    },
  });

  await prisma.fragment.upsert({
    where: { id: "ing-pkt-01-frag-implication-channel" },
    update: {
      text: "Half-said truth — implication as the safer public channel when surveillance is social, not only official.",
    },
    create: {
      id: "ing-pkt-01-frag-implication-channel",
      sourceId: SOURCE_ID,
      fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
      visibility: VisibilityStatus.REVIEW,
      recordType: RecordType.HYBRID,
      text: "Half-said truth — implication as the safer public channel when surveillance is social, not only official.",
      summary: "Implication vs naming — legality-relevant speech pattern.",
      placementStatus: "placed",
      reviewStatus: "pending",
      confidence: 3,
      decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
    },
  });

  // --- World state: knowledge / expression (Stage 5.5) — WS-06 was missing these rows ---
  await prisma.worldKnowledgeProfile.upsert({
    where: { worldStateId: WS06 },
    update: {
      label: "WS-06 knowledge horizon — segregated literacy and rumor-intensive truth",
      abstractionCeiling: 52,
      literacyRegime:
        "Formal schooling racially segregated and uneven; oral networks and church/school literacies split by community.",
      dominantExplanatorySystems: {
        primary: ["biblical_moral_frame", "progress_narratives_of_the_powerful"],
        suppressed: ["cross_community_solidarity_as_public_truth"],
      },
      technologyHorizon: { transport: "auto_road_epoch", media: "print_and_radio_local", medicine: "segregated_care" },
      informationFlowSpeed: 48,
      geographicAwarenessNorm: "Town grid legible locally; wider geography often hearsay until travel.",
      tabooKnowledgeDomains: { interracial_kinship: "dangerous_to_name", resistance_plans: "silence_default" },
      notes: "Scaffold — deepen with parish/year-specific sources when pinned.",
      certainty: "ingestion_packet_01",
    },
    create: {
      id: "ing-pkt-01-wkp-ws06",
      worldStateId: WS06,
      label: "WS-06 knowledge horizon — segregated literacy and rumor-intensive truth",
      abstractionCeiling: 52,
      literacyRegime:
        "Formal schooling racially segregated and uneven; oral networks and church/school literacies split by community.",
      dominantExplanatorySystems: {
        primary: ["biblical_moral_frame", "progress_narratives_of_the_powerful"],
        suppressed: ["cross_community_solidarity_as_public_truth"],
      },
      technologyHorizon: { transport: "auto_road_epoch", media: "print_and_radio_local", medicine: "segregated_care" },
      informationFlowSpeed: 48,
      geographicAwarenessNorm: "Town grid legible locally; wider geography often hearsay until travel.",
      tabooKnowledgeDomains: { interracial_kinship: "dangerous_to_name", resistance_plans: "silence_default" },
      notes: "Scaffold — deepen with parish/year-specific sources when pinned.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.worldExpressionProfile.upsert({
    where: { worldStateId: WS06 },
    update: {
      label: "WS-06 expression — coded public speech",
      publicExpressionCeiling: 44,
      internalLanguageComplexityNorm: 58,
      metaphorSourceDomains: { religion: "high", land_labor: "high", domestic: "high" },
      acceptableExplanationModes: { public: "euphemism_and_indirection", private: "more_plain_with_cost" },
      silencePatternsNorm:
        "Silence as protection; laughter as misdirection; 'everyone knows' without witnessable admission.",
      tabooPhrasingDomains: { naming_taboo: "cross_line_attraction_or_kinship", witness: "accusation_without_proof" },
      notes: "Aligns with Stage 8 intimate_disclosure under REVIEW/PUBLIC visibility.",
      certainty: "ingestion_packet_01",
    },
    create: {
      id: "ing-pkt-01-wep-ws06",
      worldStateId: WS06,
      label: "WS-06 expression — coded public speech",
      publicExpressionCeiling: 44,
      internalLanguageComplexityNorm: 58,
      metaphorSourceDomains: { religion: "high", land_labor: "high", domestic: "high" },
      acceptableExplanationModes: { public: "euphemism_and_indirection", private: "more_plain_with_cost" },
      silencePatternsNorm:
        "Silence as protection; laughter as misdirection; 'everyone knows' without witnessable admission.",
      tabooPhrasingDomains: { naming_taboo: "cross_line_attraction_or_kinship", witness: "accusation_without_proof" },
      notes: "Aligns with Stage 8 intimate_disclosure under REVIEW/PUBLIC visibility.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.worldEducationNormProfile.upsert({
    where: { worldStateId: WS06 },
    update: {
      label: "WS-06 education — segregated institutions + oral transmission",
      eliteKnowledgeAccess: 72,
      commonKnowledgeAccess: 38,
      childTrainingModel: { mode: "segregated_school_or_none", discipline: "high_formality_public" },
      youthInitiationModel: { church: "high_salience", labor: "early" },
      elderTransmissionMode: { home: "story_and_warning", craft: "apprentice_shadow" },
      literacyAccessPattern: { white: "expanded", black: "underfunded_or_denied", native: "often_erased_in_record" },
      specialistTrainingPaths: { clergy: "visible", trades: "racially_gated" },
      genderedTrainingDifferences: { domestic_skills: "enforced_for_girls", mobility: "asymmetric" },
      notes: "High-level scaffold — not parish-specific.",
    },
    create: {
      id: "ing-pkt-01-wedu-ws06",
      worldStateId: WS06,
      label: "WS-06 education — segregated institutions + oral transmission",
      eliteKnowledgeAccess: 72,
      commonKnowledgeAccess: 38,
      childTrainingModel: { mode: "segregated_school_or_none", discipline: "high_formality_public" },
      youthInitiationModel: { church: "high_salience", labor: "early" },
      elderTransmissionMode: { home: "story_and_warning", craft: "apprentice_shadow" },
      literacyAccessPattern: { white: "expanded", black: "underfunded_or_denied", native: "often_erased_in_record" },
      specialistTrainingPaths: { clergy: "visible", trades: "racially_gated" },
      genderedTrainingDifferences: { domestic_skills: "enforced_for_girls", mobility: "asymmetric" },
      notes: "High-level scaffold — not parish-specific.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.worldHealthNormProfile.upsert({
    where: { worldStateId: WS06 },
    update: {
      label: "WS-06 health interpretation — stigma, segregated care, somatic idioms",
      bodyInterpretationModel: { fatigue: "moral_or_sin_frame_common", pain: "often_private" },
      mindInterpretationModel: { nerves: "shame_or_weakness_risk", prayer: "first_line_public" },
      emotionInterpretationModel: { anger: "dangerous_in_public", grief: "church_or_home" },
      healingSystems: { doctor: "segregated_access", rootwork: "quiet_networks", church: "public_legible" },
      stigmaPatterns: { psychiatric: "heavy_stigma", reproductive: "unspeakable_in_public" },
      communityCareCapacity: 52,
      institutionalCareCapacity: 38,
      survivalBurden: 62,
      restPossibility: 40,
      notes: "Era-level only — not clinical.",
    },
    create: {
      id: "ing-pkt-01-whp-ws06",
      worldStateId: WS06,
      label: "WS-06 health interpretation — stigma, segregated care, somatic idioms",
      bodyInterpretationModel: { fatigue: "moral_or_sin_frame_common", pain: "often_private" },
      mindInterpretationModel: { nerves: "shame_or_weakness_risk", prayer: "first_line_public" },
      emotionInterpretationModel: { anger: "dangerous_in_public", grief: "church_or_home" },
      healingSystems: { doctor: "segregated_access", rootwork: "quiet_networks", church: "public_legible" },
      stigmaPatterns: { psychiatric: "heavy_stigma", reproductive: "unspeakable_in_public" },
      communityCareCapacity: 52,
      institutionalCareCapacity: 38,
      survivalBurden: 62,
      restPossibility: 40,
      notes: "Era-level only — not clinical.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.worldPressureBundle.upsert({
    where: { worldStateId: WS06 },
    update: {
      governanceWeight: 32,
      economicWeight: 24,
      demographicWeight: 28,
      familyWeight: 16,
      summary: {
        note: "Packet 01: Jim Crow order weights governance + demographic surveillance heavily for legibility work.",
      },
    },
    create: {
      id: "ing-pkt-01-wpb-ws06",
      worldStateId: WS06,
      governanceWeight: 32,
      economicWeight: 24,
      demographicWeight: 28,
      familyWeight: 16,
      summary: {
        note: "Packet 01: Jim Crow order weights governance + demographic surveillance heavily for legibility work.",
      },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  // --- Focal character × WS-06 (Alexis) ---
  await prisma.characterGovernanceImpact.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      allowedExpressionRange: 34,
      suppressionLevel: 72,
      punishmentRisk: 68,
      notes: "Jim Crow scaffold for packet 01 — tune if POV status differs.",
    },
    create: {
      id: "ing-pkt-01-cgi-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      allowedExpressionRange: 34,
      suppressionLevel: 72,
      punishmentRisk: 68,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterSocioEconomicProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      statusPosition: StatusPosition.LOW,
      survivalPressure: 68,
      resourceAccess: 36,
      perceivedValue: "Legibility through labor and kin; narrow room for public self-definition.",
    },
    create: {
      id: "ing-pkt-01-csep-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      statusPosition: StatusPosition.LOW,
      resourceAccess: 36,
      roleExpectation: 58,
      mobilityPotential: 32,
      dependencyLevel: 58,
      survivalPressure: 68,
      privilegeFactor: 22,
      perceivedValue: "Legibility through labor and kin; narrow room for public self-definition.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterDemographicProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      inclusionLevel: 28,
      riskExposure: 78,
      vigilanceLevel: 76,
      selfPerception: SelfPerceptionState.CONDITIONAL,
    },
    create: {
      id: "ing-pkt-01-cdp-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      statusValue: 4,
      trustBias: -12,
      inclusionLevel: 28,
      riskExposure: 78,
      privilegeModifier: 24,
      mobilityModifier: 30,
      punishmentRiskModifier: 72,
      belongingSense: 36,
      identityCohesion: 40,
      vigilanceLevel: 76,
      selfPerception: SelfPerceptionState.CONDITIONAL,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterFamilyPressureProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      obligationPressure: 62,
      emotionalExpressionRange: 38,
      loyaltyExpectation: 64,
    },
    create: {
      id: "ing-pkt-01-cfpp-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      attachmentStrength: 54,
      obligationPressure: 62,
      emotionalExpressionRange: 38,
      individualFreedom: 32,
      loyaltyExpectation: 64,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterIntelligenceProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      patternRecognition: 58,
      socialInference: 62,
      environmentalInference: 56,
      selfReflectionDepth: 52,
      expressionComplexity: 48,
      notes: "High social inference load under surveillance; expression clipped in public.",
    },
    create: {
      id: "ing-pkt-01-cip-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      patternRecognition: 58,
      workingMemory: 50,
      abstractionCapacity: 48,
      socialInference: 62,
      environmentalInference: 56,
      selfReflectionDepth: 52,
      impulseControl: 58,
      planningHorizon: 46,
      metacognition: 50,
      memoryStrength: 52,
      expressionComplexity: 48,
      notes: "High social inference load under surveillance; expression clipped in public.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterMaskingProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      maskingIntensity: 72,
      codeSwitchingLoad: 68,
      secrecyNeed: 64,
      disclosureRisk: 70,
    },
    create: {
      id: "ing-pkt-01-mask-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      maskingIntensity: 72,
      codeSwitchingLoad: 68,
      secrecyNeed: 64,
      disclosureRisk: 70,
      authenticPrivateSelf: { voice: "plain_with_kin", fear: "exposure" },
      publicMask: { role: "nonthreatening", deference: "high" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterDesireProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      desireSuppression: 62,
      tabooExposureRisk: 58,
      intimacyNeed: 52,
    },
    create: {
      id: "ing-pkt-01-desire-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      attachmentStyle: AttachmentStyle.DUTY_BOUND,
      desireVisibility: 36,
      desireSuppression: 62,
      jealousySensitivity: 48,
      intimacyNeed: 52,
      autonomyNeed: 44,
      tabooExposureRisk: 58,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterEducationProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      literacyLevel: 40,
      institutionalSchoolingAccess: 35,
      oralTraditionDepth: 58,
      languageExposure: { primary: "regional_english", secondary: "family_french_fragments" },
    },
    create: {
      id: "ing-pkt-01-edu-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      primaryTrainingMode: TrainingMode.HOUSEHOLD_TRAINING,
      literacyLevel: 40,
      numeracyLevel: 38,
      oralTraditionDepth: 58,
      ecologicalKnowledgeDepth: 44,
      institutionalSchoolingAccess: 35,
      apprenticeshipDomains: { labor: "farm_and_store_edges" },
      religiousInstructionDepth: 52,
      strategicTrainingDepth: 36,
      historicalAwarenessRange: 42,
      languageExposure: { primary: "regional_english", secondary: "family_french_fragments" },
      notes: "Plausible scaffold — not census.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterTraumaProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      traumaLoad: 52,
      hypervigilanceLoad: 68,
      silenceLoad: 58,
      bodyMemory: { glare: "shoulders", doorway: "pause" },
      triggerPatterns: { slur: "freeze_or_deflect", crowd: "scan_exits" },
    },
    create: {
      id: "ing-pkt-01-trauma-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      traumaLoad: 52,
      silenceLoad: 58,
      hypervigilanceLoad: 68,
      shameResidue: 54,
      griefResidue: 48,
      bodyMemory: { glare: "shoulders", doorway: "pause" },
      triggerPatterns: { slur: "freeze_or_deflect", crowd: "scan_exits" },
      copingPatterns: { humor: "minimal_public", kin: "retreat" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterConsequenceMemoryProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      punishmentMemory: 62,
      learnedRules: { public_contradiction: "dangerous", kin_loyalty: "survival_default" },
    },
    create: {
      id: "ing-pkt-01-conseq-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      punishmentMemory: 62,
      protectionMemory: 40,
      betrayalMemory: 44,
      rewardConditioning: 38,
      exposureLearning: 58,
      learnedRules: { public_contradiction: "dangerous", kin_loyalty: "survival_default" },
      avoidancePatterns: { witness_room: "prefer_silence" },
      reinforcementPatterns: { careful_agreement: "safer" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterRumorReputationProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      suspicionLoad: 72,
      scandalRisk: 70,
      rumorExposure: 68,
      publicTrust: 34,
      narrativeControl: 40,
    },
    create: {
      id: "ing-pkt-01-rumor-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      publicTrust: 34,
      suspicionLoad: 72,
      scandalRisk: 70,
      narrativeControl: 40,
      rumorExposure: 68,
      vulnerableNarratives: { exposure: "kinship_and_desire", witness: "half_said_truth" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterMentalHealthProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      vigilanceLevel: 74,
      stressTolerance: 42,
      intrusiveThoughtLoad: 48,
    },
    create: {
      id: "ing-pkt-01-mh-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      attentionStability: 48,
      clarityLevel: 46,
      intrusiveThoughtLoad: 48,
      dissociationTendency: 40,
      vigilanceLevel: 74,
      despairLoad: 46,
      controlCompulsion: 52,
      moodInstability: 44,
      stressTolerance: 42,
      realityCoherence: 58,
      notes: "Regulation load for Stage 7.5 / 8.5 — not diagnosis.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.characterLearningEnvelope.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS06 } },
    update: {
      pressureDistortion: 62,
      socialRiskAdjustedDisclosure: 40,
      summary: { packet: "01", note: "Trained capacity meets high social risk on disclosure." },
    },
    create: {
      id: "ing-pkt-01-cle-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      trainedCapacity: 48,
      expressiveCapacity: 36,
      pressureDistortion: 62,
      learnedAvoidance: 58,
      socialRiskAdjustedDisclosure: 40,
      summary: { packet: "01", note: "Trained capacity meets high social risk on disclosure." },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  await prisma.relationshipNetworkSummary.upsert({
    where: { id: "ing-pkt-01-net-alexis-ws06" },
    update: {
      keyBonds: { kin: [COUNTERPART], risk: "public_legibility" },
      primaryTensions: { safety_vs_truth: "active" },
    },
    create: {
      id: "ing-pkt-01-net-alexis-ws06",
      personId: FOCAL,
      worldStateId: WS06,
      keyBonds: { kin: [COUNTERPART], risk: "public_legibility" },
      primaryTensions: { safety_vs_truth: "active" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });

  // --- Scene shell (legality-first) ---
  await prisma.chapter.upsert({
    where: { id: CHAPTER_ID },
    update: {
      bookId: DEFAULT_BOOK_ID,
      title: "Ingestion packet 01 — legality scaffold (WS-06)",
      summary: "Holds the Stage 8 / 8.5 intimate_disclosure × REVIEW reference scene.",
    },
    create: {
      id: CHAPTER_ID,
      bookId: DEFAULT_BOOK_ID,
      sequenceInBook: 901,
      title: "Ingestion packet 01 — legality scaffold (WS-06)",
      chapterNumber: 901,
      summary: "Holds the Stage 8 / 8.5 intimate_disclosure × REVIEW reference scene.",
      visibility: VisibilityStatus.REVIEW,
      recordType: RecordType.HYBRID,
      status: "scaffold",
      privateNotes: "Synthetic chapter for pipeline testing — not a volume position.",
    },
  });

  const structuredPatch = {
    sceneClass: "intimate_disclosure" as const,
    revealBudgetScore: 50,
    socialExposureScore: 58,
    visibilityLegibility:
      "Semi-public river landing — enough witnesses for shame risk without a full square crowd.",
  };

  await prisma.scene.upsert({
    where: { id: SCENE_ID },
    update: {
      description:
        "Whispered confession — intimate disclosure under REVIEW visibility; secret truth presses toward the surface near the landing.",
      summary:
        "Packet 01 reference: focal must manage disclosure under social scrutiny; implication safer than spectacle.",
      narrativeIntent: "Test intimate_disclosure readiness and outcome envelope under REVIEW + frozen regulation.",
      emotionalTone: "tight_throat",
      visibility: VisibilityStatus.REVIEW,
      structuredDataJson: structuredPatch,
      historicalConfidence: 2,
      sourceTraceSummary: "Scaffold scene — replace with cited scene when campaign pins prose.",
      sceneStatus: "scaffold",
    },
    create: {
      id: SCENE_ID,
      chapterId: CHAPTER_ID,
      description:
        "Whispered confession — intimate disclosure under REVIEW visibility; secret truth presses toward the surface near the landing.",
      summary:
        "Packet 01 reference: focal must manage disclosure under social scrutiny; implication safer than spectacle.",
      narrativeIntent: "Test intimate_disclosure readiness and outcome envelope under REVIEW + frozen regulation.",
      emotionalTone: "tight_throat",
      writingMode: WritingMode.STRUCTURED,
      orderInChapter: 1,
      sceneNumber: 1,
      visibility: VisibilityStatus.REVIEW,
      recordType: RecordType.HYBRID,
      structuredDataJson: structuredPatch,
      historicalConfidence: 2,
      sourceTraceSummary: "Scaffold scene — replace with cited scene when campaign pins prose.",
      sceneStatus: "scaffold",
    },
  });

  await prisma.scene.update({
    where: { id: SCENE_ID },
    data: {
      persons: { set: [{ id: FOCAL }, { id: COUNTERPART }] },
      places: { set: [{ id: PLACE_ID }] },
      sources: { connect: [{ id: SOURCE_ID }] },
    },
  });

  await prisma.characterState.upsert({
    where: { id: CS_ID },
    update: {
      worldStateId: WS06,
      sceneId: SCENE_ID,
      label: "ingestion_packet_01_focal",
      emotionalBaseline: "strained",
      trustLevel: 42,
      fearLevel: 64,
      stabilityLevel: 40,
      cognitiveLoad: 62,
      emotionalState: "fear_grief_mix",
      motivation: "protect_kin_face",
      fearState: "exposure",
      socialConstraint: "coded_speech_only",
      notes: "Scene-scoped state for workspace / brain — packet 01.",
      certainty: "ingestion_packet_01",
    },
    create: {
      id: CS_ID,
      personId: FOCAL,
      worldStateId: WS06,
      sceneId: SCENE_ID,
      label: "ingestion_packet_01_focal",
      emotionalBaseline: "strained",
      trustLevel: 42,
      fearLevel: 64,
      stabilityLevel: 40,
      cognitiveLoad: 62,
      emotionalState: "fear_grief_mix",
      motivation: "protect_kin_face",
      fearState: "exposure",
      socialConstraint: "coded_speech_only",
      notes: "Scene-scoped state for workspace / brain — packet 01.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.REVIEW,
      certainty: "ingestion_packet_01",
    },
  });
}
