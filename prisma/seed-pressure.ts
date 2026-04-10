import type { PrismaClient } from "@prisma/client";
import {
  JusticeMode,
  RecordType,
  SelfPerceptionState,
  StatusPosition,
  VisibilityStatus,
} from "@prisma/client";

/**
 * Stage 5 — Pressure & historical order. Additive upserts only.
 * Depends on seed-environment world states and seed.ts people.
 */
export async function seedPressure(prisma: PrismaClient): Promise<void> {
  const ws = {
    ws01: "seed-ws-ref-ws01",
    ws04: "seed-ws-ref-ws04",
    ws06: "seed-ws-ref-ws06",
    ws07: "seed-ws-ref-ws07",
  };

  const govRows: {
    id: string;
    worldStateId: string;
    label: string;
    controlIntensity: number;
    punishmentSeverity: number;
    enforcementVisibility: number;
    justiceFairness: number;
    conformityPressure: number;
    justiceMode: JusticeMode;
  }[] = [
    {
      id: "seed-gov-ws01",
      worldStateId: ws.ws01,
      label: "Mature Caddo / sacred-trade corridor (colonial)",
      controlIntensity: 40,
      punishmentSeverity: 35,
      enforcementVisibility: 30,
      justiceFairness: 45,
      conformityPressure: 38,
      justiceMode: JusticeMode.MIXED,
    },
    {
      id: "seed-gov-ws04",
      worldStateId: ws.ws04,
      label: "Cotton / slavery economy — extractive order",
      controlIntensity: 75,
      punishmentSeverity: 85,
      enforcementVisibility: 70,
      justiceFairness: 25,
      conformityPressure: 72,
      justiceMode: JusticeMode.PUNITIVE,
    },
    {
      id: "seed-gov-ws06",
      worldStateId: ws.ws06,
      label: "Jim Crow rural — rigid social control",
      controlIntensity: 78,
      punishmentSeverity: 80,
      enforcementVisibility: 75,
      justiceFairness: 30,
      conformityPressure: 82,
      justiceMode: JusticeMode.HIERARCHICAL,
    },
    {
      id: "seed-gov-ws07",
      worldStateId: ws.ws07,
      label: "Modern / engineered — fragmented legitimacy",
      controlIntensity: 65,
      punishmentSeverity: 55,
      enforcementVisibility: 85,
      justiceFairness: 40,
      conformityPressure: 60,
      justiceMode: JusticeMode.MIXED,
    },
  ];

  for (const g of govRows) {
    await prisma.worldGovernanceProfile.upsert({
      where: { worldStateId: g.worldStateId },
      update: {
        label: g.label,
        controlIntensity: g.controlIntensity,
        punishmentSeverity: g.punishmentSeverity,
        enforcementVisibility: g.enforcementVisibility,
        justiceFairness: g.justiceFairness,
        conformityPressure: g.conformityPressure,
        justiceMode: g.justiceMode,
      },
      create: {
        id: g.id,
        worldStateId: g.worldStateId,
        label: g.label,
        controlIntensity: g.controlIntensity,
        punishmentSeverity: g.punishmentSeverity,
        enforcementVisibility: g.enforcementVisibility,
        justiceFairness: g.justiceFairness,
        conformityPressure: g.conformityPressure,
        justiceMode: g.justiceMode,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  const bundles: {
    id: string;
    worldStateId: string;
    governanceWeight: number;
    economicWeight: number;
    demographicWeight: number;
    familyWeight: number;
    summary: object;
  }[] = [
    {
      id: "seed-wpb-ws01",
      worldStateId: ws.ws01,
      governanceWeight: 22,
      economicWeight: 28,
      demographicWeight: 28,
      familyWeight: 22,
      summary: { note: "Early corridor; kin + trade + spiritual continuity weighted." },
    },
    {
      id: "seed-wpb-ws04",
      worldStateId: ws.ws04,
      governanceWeight: 30,
      economicWeight: 35,
      demographicWeight: 22,
      familyWeight: 13,
      summary: { note: "Economic extraction and legal violence dominate the stack." },
    },
    {
      id: "seed-wpb-ws07",
      worldStateId: ws.ws07,
      governanceWeight: 25,
      economicWeight: 25,
      demographicWeight: 25,
      familyWeight: 25,
      summary: { note: "High surveillance / policy visibility; mixed legitimacy." },
    },
  ];

  for (const b of bundles) {
    await prisma.worldPressureBundle.upsert({
      where: { worldStateId: b.worldStateId },
      update: {
        governanceWeight: b.governanceWeight,
        economicWeight: b.economicWeight,
        demographicWeight: b.demographicWeight,
        familyWeight: b.familyWeight,
        summary: b.summary,
      },
      create: {
        id: b.id,
        worldStateId: b.worldStateId,
        governanceWeight: b.governanceWeight,
        economicWeight: b.economicWeight,
        demographicWeight: b.demographicWeight,
        familyWeight: b.familyWeight,
        summary: b.summary,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
    });
  }

  const alexis = "seed-person-alexis";
  const francois = "seed-person-francois";

  await prisma.characterGovernanceImpact.upsert({
    where: { personId_worldStateId: { personId: alexis, worldStateId: ws.ws01 } },
    update: {
      allowedExpressionRange: 55,
      suppressionLevel: 40,
      punishmentRisk: 35,
    },
    create: {
      id: "seed-cgi-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      allowedExpressionRange: 55,
      suppressionLevel: 40,
      punishmentRisk: 35,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterSocioEconomicProfile.upsert({
    where: { personId_worldStateId: { personId: alexis, worldStateId: ws.ws01 } },
    update: {
      statusPosition: StatusPosition.MID,
      resourceAccess: 48,
      survivalPressure: 42,
      perceivedValue: "Skilled, mobile, dependent on patronage networks",
    },
    create: {
      id: "seed-csep-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      statusPosition: StatusPosition.MID,
      resourceAccess: 48,
      roleExpectation: 50,
      mobilityPotential: 55,
      dependencyLevel: 45,
      survivalPressure: 42,
      privilegeFactor: 40,
      perceivedValue: "Skilled, mobile, dependent on patronage networks",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterDemographicProfile.upsert({
    where: { personId_worldStateId: { personId: alexis, worldStateId: ws.ws01 } },
    update: {
      inclusionLevel: 50,
      riskExposure: 45,
      vigilanceLevel: 48,
      selfPerception: SelfPerceptionState.CONDITIONAL,
    },
    create: {
      id: "seed-cdp-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      statusValue: 5,
      trustBias: -5,
      inclusionLevel: 50,
      riskExposure: 45,
      privilegeModifier: 45,
      mobilityModifier: 50,
      punishmentRiskModifier: 40,
      belongingSense: 52,
      identityCohesion: 48,
      vigilanceLevel: 48,
      selfPerception: SelfPerceptionState.CONDITIONAL,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterFamilyPressureProfile.upsert({
    where: { personId_worldStateId: { personId: alexis, worldStateId: ws.ws01 } },
    update: {
      attachmentStrength: 58,
      obligationPressure: 50,
      emotionalExpressionRange: 46,
    },
    create: {
      id: "seed-cfpp-alexis-ws01",
      personId: alexis,
      worldStateId: ws.ws01,
      attachmentStrength: 58,
      obligationPressure: 50,
      emotionalExpressionRange: 46,
      individualFreedom: 44,
      loyaltyExpectation: 55,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterGovernanceImpact.upsert({
    where: { personId_worldStateId: { personId: francois, worldStateId: ws.ws04 } },
    update: { suppressionLevel: 70, punishmentRisk: 65 },
    create: {
      id: "seed-cgi-francois-ws04",
      personId: francois,
      worldStateId: ws.ws04,
      allowedExpressionRange: 35,
      suppressionLevel: 70,
      punishmentRisk: 65,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });

  await prisma.characterSocioEconomicProfile.upsert({
    where: { personId_worldStateId: { personId: francois, worldStateId: ws.ws04 } },
    update: { survivalPressure: 72, dependencyLevel: 68 },
    create: {
      id: "seed-csep-francois-ws04",
      personId: francois,
      worldStateId: ws.ws04,
      statusPosition: StatusPosition.LOW,
      resourceAccess: 32,
      roleExpectation: 60,
      mobilityPotential: 28,
      dependencyLevel: 68,
      survivalPressure: 72,
      privilegeFactor: 25,
      perceivedValue: "Labor-defined; narrow room for self-definition",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "seed",
    },
  });
}
