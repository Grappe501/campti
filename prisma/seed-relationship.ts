import type { Prisma, PrismaClient } from "@prisma/client";
import {
  AttachmentStyle,
  PublicStatus,
  RecordType,
  RelationshipType,
  VisibilityStatus,
} from "@prisma/client";
import { normalizePersonPair } from "../lib/relationship-order";

/**
 * Stage 6 — Relationship, desire, masking (additive upserts only).
 * Depends on seed-environment world states and seed.ts people.
 */
export async function seedRelationship(prisma: PrismaClient): Promise<void> {
  const ws = {
    ws01: "seed-ws-ref-ws01",
    ws04: "seed-ws-ref-ws04",
    ws06: "seed-ws-ref-ws06",
    ws07: "seed-ws-ref-ws07",
  };

  const alexis = "seed-person-alexis";
  const francois = "seed-person-francois";
  const pair = normalizePersonPair(alexis, francois);

  const normRows: {
    id: string;
    worldStateId: string;
    label: string;
    relationalVisibility: number;
    punishmentForViolation: number;
    marriageRules: Prisma.InputJsonValue;
    tabooSystem: Prisma.InputJsonValue;
  }[] = [
    {
      id: "seed-wr-norm-ws01",
      worldStateId: ws.ws01,
      label: "WS-01 communal / kin-balanced relational field",
      relationalVisibility: 42,
      punishmentForViolation: 38,
      marriageRules: { pattern: "kin_alliance", notes: "Sacred-trade corridor; obligation to kin visible in public ritual." },
      tabooSystem: { direct_challenge_to_elder: "coded_avoidance" },
    },
    {
      id: "seed-wr-norm-ws04",
      worldStateId: ws.ws04,
      label: "WS-04 slavery-distorted relationship system",
      relationalVisibility: 72,
      punishmentForViolation: 88,
      marriageRules: { pattern: "coerced_stability", notes: "Legal marriage thin cover for property relations." },
      tabooSystem: { solidarity_across_status: "extremely_dangerous" },
    },
    {
      id: "seed-wr-norm-ws06",
      worldStateId: ws.ws06,
      label: "WS-06 coded Jim Crow relational system",
      relationalVisibility: 78,
      punishmentForViolation: 82,
      marriageRules: { pattern: "segregated_public_legibility" },
      tabooSystem: { cross_line_friendship: "coded_or_denied" },
    },
    {
      id: "seed-wr-norm-ws07",
      worldStateId: ws.ws07,
      label: "WS-07 modern fragmented relational world",
      relationalVisibility: 55,
      punishmentForViolation: 48,
      marriageRules: { pattern: "optional_contract", notes: "Legibility mixed; surveillance uneven." },
      tabooSystem: { public_display_of_grief: "variable" },
    },
  ];

  for (const n of normRows) {
    await prisma.worldRelationshipNormProfile.upsert({
      where: { id: n.id },
      update: {
        label: n.label,
        relationalVisibility: n.relationalVisibility,
        punishmentForViolation: n.punishmentForViolation,
        marriageRules: n.marriageRules,
        tabooSystem: n.tabooSystem,
      },
      create: {
        id: n.id,
        worldStateId: n.worldStateId,
        label: n.label,
        relationalVisibility: n.relationalVisibility,
        punishmentForViolation: n.punishmentForViolation,
        marriageRules: n.marriageRules,
        tabooSystem: n.tabooSystem,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  await prisma.characterMaskingProfile.upsert({
    where: { id: "seed-mask-alexis-ws01" },
    update: {
      maskingIntensity: 44,
      codeSwitchingLoad: 36,
      secrecyNeed: 30,
      disclosureRisk: 40,
    },
    create: {
      id: "seed-mask-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      maskingIntensity: 44,
      codeSwitchingLoad: 36,
      secrecyNeed: 30,
      disclosureRisk: 40,
      authenticPrivateSelf: { voice: "questioning", restraint: "high" },
      publicMask: { role: "young_arrival", deference: "selective" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterDesireProfile.upsert({
    where: { id: "seed-desire-alexis-ws01" },
    update: {
      desireVisibility: 48,
      desireSuppression: 42,
      intimacyNeed: 55,
      autonomyNeed: 62,
    },
    create: {
      id: "seed-desire-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      attachmentStyle: AttachmentStyle.ANXIOUS,
      desireVisibility: 48,
      desireSuppression: 42,
      intimacyNeed: 55,
      autonomyNeed: 62,
      tabooExposureRisk: 35,
      attractionPattern: { openness: "exploratory", shame_load: "moderate" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.relationshipNetworkSummary.upsert({
    where: { id: "seed-net-alexis-ws01" },
    update: {
      keyBonds: { kin: ["seed-person-francois"], place: "Campti corridor" },
    },
    create: {
      id: "seed-net-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      keyBonds: { kin: ["seed-person-francois"], place: "Campti corridor" },
      primaryTensions: { obligation_vs_curiosity: "active" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  const rpId = "seed-rp-alexis-francois-ws01";
  await prisma.relationshipProfile.upsert({
    where: { id: rpId },
    update: {
      trustLevel: 58,
      fearLevel: 32,
      publicStatus: PublicStatus.IMPLIED,
    },
    create: {
      id: rpId,
      personAId: pair.personAId,
      personBId: pair.personBId,
      worldStateId: ws.ws01,
      relationshipType: RelationshipType.KINSHIP,
      publicStatus: PublicStatus.IMPLIED,
      privateStatus: "kin-obligation with room for tenderness",
      trustLevel: 58,
      fearLevel: 32,
      shameLeverage: 28,
      obligationWeight: 52,
      betrayalThreshold: 40,
      rescueThreshold: 55,
      hiddenTruth: { unspoken_competition: "trade_vs_land" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.relationshipDynamicState.upsert({
    where: { id: "seed-rdyn-ws01-1" },
    update: { emotionalTemperature: 52, conflictLoad: 38 },
    create: {
      id: "seed-rdyn-ws01-1",
      relationshipProfileId: rpId,
      label: "opening_arc",
      emotionalTemperature: 52,
      volatility: 35,
      intimacyLevel: 48,
      conflictLoad: 38,
      mutualRecognition: 50,
      disclosureSafety: 45,
      currentTensions: { topic: "inheritance_expectation" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.relationshipDisclosureProfile.upsert({
    where: { id: "seed-rdisc-ws01-1" },
    update: { truthShareCapacity: 46, secrecyBurden: 40 },
    create: {
      id: "seed-rdisc-ws01-1",
      relationshipProfileId: rpId,
      worldStateId: ws.ws01,
      truthShareCapacity: 46,
      emotionalDisclosureCapacity: 44,
      secrecyBurden: 40,
      misrecognitionRisk: 35,
      exposureConsequence: 42,
      safeTopics: { weather: true, trade_routes: true },
      unsafeTopics: { challenge_to_patriarch: true },
      codedChannels: { gesture: "threshold_hesitation" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });
}
