import type { Prisma, PrismaClient } from "@prisma/client";
import { RecordType, TrainingMode, VisibilityStatus } from "@prisma/client";

/**
 * Stage 6.5 — Trauma, consequence, rumor, education norms, learning envelope (additive upserts).
 * Depends on seed-environment world states and seed people.
 */
export async function seedContinuity(prisma: PrismaClient): Promise<void> {
  const ws = {
    ws01: "seed-ws-ref-ws01",
    ws04: "seed-ws-ref-ws04",
    ws07: "seed-ws-ref-ws07",
  };

  const alexis = "seed-person-alexis";

  const normRows: {
    id: string;
    worldStateId: string;
    label: string;
    eliteKnowledgeAccess: number;
    commonKnowledgeAccess: number;
    childTrainingModel: Prisma.InputJsonValue;
    literacyAccessPattern: Prisma.InputJsonValue;
  }[] = [
    {
      id: "seed-wedu-norm-ws01",
      worldStateId: ws.ws01,
      label: "WS-01 oral / ecological / kin-embedded training field",
      eliteKnowledgeAccess: 48,
      commonKnowledgeAccess: 52,
      childTrainingModel: { mode: "household_and_river", elders: "story_circuits" },
      literacyAccessPattern: { script: "limited_trade_marks", oral: "primary" },
    },
    {
      id: "seed-wedu-norm-ws04",
      worldStateId: ws.ws04,
      label: "WS-04 highly unequal literacy and training access",
      eliteKnowledgeAccess: 82,
      commonKnowledgeAccess: 28,
      childTrainingModel: { mode: "coerced_skill_transfer", surveillance: "high" },
      literacyAccessPattern: { script: "restricted_to_elite_and_overseers", oral: "survival_dense" },
    },
    {
      id: "seed-wedu-norm-ws07",
      worldStateId: ws.ws07,
      label: "WS-07 broad but fragmented education / information",
      eliteKnowledgeAccess: 58,
      commonKnowledgeAccess: 62,
      childTrainingModel: { mode: "mixed_institutional_and_informal", screens: "variable" },
      literacyAccessPattern: { script: "default_schooling_uneven_depth", oral: "peer_networks" },
    },
  ];

  for (const n of normRows) {
    await prisma.worldEducationNormProfile.upsert({
      where: { id: n.id },
      update: {
        label: n.label,
        eliteKnowledgeAccess: n.eliteKnowledgeAccess,
        commonKnowledgeAccess: n.commonKnowledgeAccess,
        childTrainingModel: n.childTrainingModel,
        literacyAccessPattern: n.literacyAccessPattern,
      },
      create: {
        id: n.id,
        worldStateId: n.worldStateId,
        label: n.label,
        eliteKnowledgeAccess: n.eliteKnowledgeAccess,
        commonKnowledgeAccess: n.commonKnowledgeAccess,
        childTrainingModel: n.childTrainingModel,
        literacyAccessPattern: n.literacyAccessPattern,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  await prisma.characterEducationProfile.upsert({
    where: { id: "seed-edu-alexis-ws01" },
    update: {
      oralTraditionDepth: 62,
      ecologicalKnowledgeDepth: 58,
      institutionalSchoolingAccess: 28,
    },
    create: {
      id: "seed-edu-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      primaryTrainingMode: TrainingMode.ORAL_TRADITION,
      literacyLevel: 32,
      numeracyLevel: 36,
      oralTraditionDepth: 62,
      ecologicalKnowledgeDepth: 58,
      institutionalSchoolingAccess: 28,
      apprenticeshipDomains: { trade: "watching_uncles", kin: "story_obligation" },
      religiousInstructionDepth: 40,
      strategicTrainingDepth: 35,
      historicalAwarenessRange: 44,
      languageExposure: { primary: "Caddo-French creole", secondary: "church_latin_fragments" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterTraumaProfile.upsert({
    where: { id: "seed-trauma-alexis-ws01" },
    update: { traumaLoad: 38, silenceLoad: 34, hypervigilanceLoad: 42 },
    create: {
      id: "seed-trauma-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      traumaLoad: 38,
      silenceLoad: 34,
      hypervigilanceLoad: 42,
      shameResidue: 36,
      griefResidue: 40,
      bodyMemory: { river_cold: "startle", crowded_room: "scan" },
      triggerPatterns: { authority_tone: "freeze_or_appease" },
      copingPatterns: { humor: "deflection", kin: "lean" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterConsequenceMemoryProfile.upsert({
    where: { id: "seed-conseq-alexis-ws01" },
    update: { punishmentMemory: 44, protectionMemory: 48 },
    create: {
      id: "seed-conseq-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      punishmentMemory: 44,
      protectionMemory: 48,
      betrayalMemory: 36,
      rewardConditioning: 42,
      exposureLearning: 46,
      learnedRules: { public_disagreement: "expensive", kin_loyalty: "default" },
      avoidancePatterns: { direct_challenge: "rare" },
      reinforcementPatterns: { careful_question: "rewarded_once" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterRumorReputationProfile.upsert({
    where: { id: "seed-rumor-alexis-ws01" },
    update: { publicTrust: 48, suspicionLoad: 36 },
    create: {
      id: "seed-rumor-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      publicTrust: 48,
      suspicionLoad: 36,
      scandalRisk: 28,
      narrativeControl: 40,
      rumorExposure: 34,
      reputationThemes: { newcomer: "watching", kin: "promised" },
      vulnerableNarratives: { independence: "read_as_rebellion" },
      protectiveNarratives: { work_ethic: "recognized" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterLearningEnvelope.upsert({
    where: { id: "seed-learn-env-alexis-ws01" },
    update: { trainedCapacity: 52, expressiveCapacity: 46, pressureDistortion: 41 },
    create: {
      id: "seed-learn-env-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      trainedCapacity: 52,
      expressiveCapacity: 46,
      pressureDistortion: 41,
      learnedAvoidance: 39,
      socialRiskAdjustedDisclosure: 43,
      summary: {
        note: "High oral/ecological depth; literate channel narrow; trauma tightens disclosure.",
      },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterEducationProfile.upsert({
    where: { id: "seed-edu-alexis-ws07" },
    update: { institutionalSchoolingAccess: 55 },
    create: {
      id: "seed-edu-alexis-ws07",
      personId: alexis,
      worldStateId: ws.ws07,
      primaryTrainingMode: TrainingMode.MIXED,
      literacyLevel: 58,
      numeracyLevel: 52,
      oralTraditionDepth: 45,
      ecologicalKnowledgeDepth: 40,
      institutionalSchoolingAccess: 55,
      apprenticeshipDomains: { self: "online_skill_patches" },
      religiousInstructionDepth: 30,
      strategicTrainingDepth: 48,
      historicalAwarenessRange: 50,
      languageExposure: { primary: "English", codeswitch: "heritage_fragments" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed-contrast",
    },
  });

  const healthNormRows: {
    id: string;
    worldStateId: string;
    label: string;
    communityCareCapacity: number;
    survivalBurden: number;
    restPossibility: number;
    bodyInterpretationModel: Prisma.InputJsonValue;
    mindInterpretationModel: Prisma.InputJsonValue;
  }[] = [
    {
      id: "seed-whealth-norm-ws01",
      worldStateId: ws.ws01,
      label: "WS-01 kin-embedded / ecological health field",
      communityCareCapacity: 58,
      survivalBurden: 42,
      restPossibility: 48,
      bodyInterpretationModel: { strain: "seasonal_labor", recovery: "kin_rest" },
      mindInterpretationModel: { overload: "omen_burden_taboo", clarity: "story_and_ritual" },
    },
    {
      id: "seed-whealth-norm-ws04",
      worldStateId: ws.ws04,
      label: "WS-04 coercive survival; distorted care",
      communityCareCapacity: 28,
      survivalBurden: 88,
      restPossibility: 22,
      bodyInterpretationModel: { injury: "hidden_or_punished", exhaustion: "read_as_disobedience" },
      mindInterpretationModel: { vigilance: "strategic", collapse: "denied_publicly" },
    },
    {
      id: "seed-whealth-norm-ws07",
      worldStateId: ws.ws07,
      label: "WS-07 fragmented medicine + naming without wholeness",
      communityCareCapacity: 44,
      survivalBurden: 52,
      restPossibility: 46,
      bodyInterpretationModel: { access: "uneven_clinics", self_label: "common" },
      mindInterpretationModel: { vocabulary: "clinical_and_informal_mix", stigma: "variable" },
    },
  ];

  for (const h of healthNormRows) {
    await prisma.worldHealthNormProfile.upsert({
      where: { id: h.id },
      update: {
        label: h.label,
        communityCareCapacity: h.communityCareCapacity,
        survivalBurden: h.survivalBurden,
        restPossibility: h.restPossibility,
        bodyInterpretationModel: h.bodyInterpretationModel,
        mindInterpretationModel: h.mindInterpretationModel,
      },
      create: {
        id: h.id,
        worldStateId: h.worldStateId,
        label: h.label,
        communityCareCapacity: h.communityCareCapacity,
        institutionalCareCapacity: 45,
        survivalBurden: h.survivalBurden,
        restPossibility: h.restPossibility,
        bodyInterpretationModel: h.bodyInterpretationModel,
        mindInterpretationModel: h.mindInterpretationModel,
        emotionInterpretationModel: { grief: "recognized", shame: "publicly_policed" },
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  await prisma.characterPhysicalHealthProfile.upsert({
    where: { id: "seed-phys-alexis-ws01" },
    update: { sleepQuality: 46, chronicPainLoad: 34 },
    create: {
      id: "seed-phys-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      injuryLoad: 28,
      chronicPainLoad: 34,
      illnessBurden: 30,
      nutritionStatus: 52,
      sleepQuality: 46,
      enduranceCapacity: 55,
      mobilityLimitationLoad: 22,
      reproductiveBurden: 40,
      agingBurden: 25,
      recoveryCapacity: 48,
      sensoryLimitations: { hearing: "minor_ring_after_river" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterMentalHealthProfile.upsert({
    where: { id: "seed-mental-alexis-ws01" },
    update: { vigilanceLevel: 44, stressTolerance: 48 },
    create: {
      id: "seed-mental-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      attentionStability: 50,
      clarityLevel: 52,
      intrusiveThoughtLoad: 38,
      dissociationTendency: 32,
      vigilanceLevel: 44,
      despairLoad: 36,
      controlCompulsion: 34,
      moodInstability: 40,
      stressTolerance: 48,
      realityCoherence: 54,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterEmotionalHealthProfile.upsert({
    where: { id: "seed-emot-alexis-ws01" },
    update: { griefSaturation: 42, tendernessAccess: 48 },
    create: {
      id: "seed-emot-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      emotionalRange: 52,
      suppressionLoad: 40,
      griefSaturation: 42,
      shameSaturation: 36,
      tendernessAccess: 48,
      angerRegulation: 44,
      fearCarryover: 40,
      relationalOpenness: 46,
      recoveryAfterDistress: 42,
      emotionalNumbnessLoad: 35,
      emotionalFloodingLoad: 38,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterHealthEnvelope.upsert({
    where: { id: "seed-health-env-alexis-ws01" },
    update: { functionalCapacity: 50 },
    create: {
      id: "seed-health-env-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      functionalCapacity: 50,
      careAccess: 46,
      visibleHealthPresentation: { public: "capable_young_worker", stoic: "partial" },
      hiddenHealthBurden: { river_fatigue: "moderate", vigilance: "elevated" },
      socialInterpretation: { era: "she_carries_well", kin: "watching" },
      simulationLayer: {
        sleepDebt: 0.46,
        painInterference: 0.34,
        note: "engine-facing scalars for future modifiers",
      },
      worldFacingHealthNarrative: {
        phrases: ["worn but steady", "startles when the river talks loud"],
        avoids: ["panic_disorder", "clinical_dx"],
      },
      summary: { rollup: "health_modifies_labor_and_disclosure_not_diagnosis_copy" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });
}
