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
    ws08: "seed-ws-ref-ws08",
    ws09: "seed-ws-ref-ws09",
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
    {
      id: "seed-wpb-ws08",
      worldStateId: ws.ws08,
      governanceWeight: 24,
      economicWeight: 26,
      demographicWeight: 26,
      familyWeight: 24,
      summary: { note: "Decline / memory era: institutions thin; social and economic pressure uneven." },
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

  const eraProfiles: {
    worldStateId: string;
    coreEconomicDrivers: string[];
    powerSummary: string;
    meaningOfWork: string;
    evidenceRationale: string;
    knobEconomicPressure: number;
    knobRelationalInterdependence: number;
    knobAutonomyBaseline: number;
    knobSystemicExtraction: number;
    knobCollectiveCohesion: number;
  }[] = [
    {
      worldStateId: ws.ws01,
      coreEconomicDrivers: [
        "Red River trade corridor",
        "Indigenous-European exchange",
        "River transport",
        "Seasonal agriculture",
        "Craft production",
        "Diplomatic alliance leverage",
      ],
      powerSummary:
        "Colonial hub at Natchitoches and military posts vs Indigenous nations who retain trade and land leverage.",
      meaningOfWork: "Trade, portage, and alliance labor — identity braided with obligation and external demand.",
      evidenceRationale:
        "Drivers reflect corridor exchange and seasonal production (not industrial extraction). Interdependence and cohesion are high because trade houses and kin networks carry reputation; autonomy sits mid because external empires and rivals constrain choices.",
      knobEconomicPressure: 42,
      knobRelationalInterdependence: 72,
      knobAutonomyBaseline: 48,
      knobSystemicExtraction: 38,
      knobCollectiveCohesion: 62,
    },
    {
      worldStateId: ws.ws04,
      coreEconomicDrivers: ["Cotton", "Enslaved labor", "River commerce", "Plantation credit", "Domestic labor", "Patrol law"],
      powerSummary: "Plantation elite and racial caste law; totalized control of Black labor and mobility.",
      meaningOfWork: "Coerced extraction — labor as property, surveillance, and survival under violence.",
      evidenceRationale:
        "Cotton and credit cycles squeeze material life; plantation law and patrols maximize extraction and minimize autonomy. Cohesion is intentionally broken among the enslaved while the planter household remains a coercive economic unit.",
      knobEconomicPressure: 92,
      knobRelationalInterdependence: 55,
      knobAutonomyBaseline: 12,
      knobSystemicExtraction: 96,
      knobCollectiveCohesion: 35,
    },
    {
      worldStateId: ws.ws07,
      coreEconomicDrivers: ["Service sector", "Oil/gas cycles", "Schools & state jobs", "Retail", "Corrections (regional)"],
      powerSummary: "Distant owners, policy, and volatile markets; thin local ownership.",
      meaningOfWork: "Precarious wages and credential gates — work often feels disconnected from place and lineage.",
      evidenceRationale:
        "Oil/service volatility and policy-heavy employers raise economic and extraction-style pressure without plantation law; autonomy is middling because mobility exists but credentials and markets gate survival.",
      knobEconomicPressure: 68,
      knobRelationalInterdependence: 44,
      knobAutonomyBaseline: 52,
      knobSystemicExtraction: 58,
      knobCollectiveCohesion: 40,
    },
    {
      worldStateId: ws.ws06,
      coreEconomicDrivers: [
        "Sharecropping / tenant farming",
        "Jim Crow commerce",
        "Domestic and church labor",
        "Local credit",
        "State & vigilante enforcement",
        "School-to-work pipeline (racialized)",
      ],
      powerSummary:
        "White civic and business elite plus police and extralegal violence; Black labor disciplined by law, debt, and terror.",
      meaningOfWork: "Racialized labor markets — dignity traded for precarious safety; mobility is risky and watched.",
      evidenceRationale:
        "Governance and demographic legibility dominate daily life; extraction runs through wages, debt, and terror more than kin obligation. Interdependence stays real but is politically unsafe to acknowledge.",
      knobEconomicPressure: 58,
      knobRelationalInterdependence: 46,
      knobAutonomyBaseline: 24,
      knobSystemicExtraction: 78,
      knobCollectiveCohesion: 54,
    },
    {
      worldStateId: ws.ws08,
      coreEconomicDrivers: [
        "Shrinking municipal budgets",
        "Care work",
        "Informal labor",
        "Heritage tourism (uneven)",
        "Remote policy",
        "Commodity agriculture (declining)",
      ],
      powerSummary:
        "Absent owners and thin institutions; memory and story compete with austerity and surveillance tech.",
      meaningOfWork: "Work is often survival plus caretaking — place attachment competes with leaving.",
      evidenceRationale:
        "Neither full autonomy nor tight collective institutions: cohesion is nostalgic and fragmented; economic pressure is real but unevenly distributed; extraction is bureaucratic and market-driven rather than plantation-total.",
      knobEconomicPressure: 56,
      knobRelationalInterdependence: 52,
      knobAutonomyBaseline: 58,
      knobSystemicExtraction: 50,
      knobCollectiveCohesion: 46,
    },
    {
      worldStateId: ws.ws09,
      coreEconomicDrivers: [
        "Long-distance trade networks",
        "Ranked trade houses",
        "River landing commerce",
        "Seasonal surplus",
        "Diplomatic gift economies",
        "Kin accountability at public sites",
      ],
      powerSummary:
        "Ranked houses and elders hold soft power; leverage is reputational and diplomatic as much as coercive — crowded landings make intimacy legible.",
      meaningOfWork:
        "Labor is alliance and household obligation in public view — skill and restraint at the landing are economic survival.",
      evidenceRationale:
        "WS-09 slice stresses kin/trade dependency and social surveillance at landings (ingestion bundle note). Extraction is moderate (not chattel plantation); cohesion and interdependence should read high so economic salience is not accidentally muted.",
      knobEconomicPressure: 48,
      knobRelationalInterdependence: 78,
      knobAutonomyBaseline: 50,
      knobSystemicExtraction: 34,
      knobCollectiveCohesion: 72,
    },
  ];

  for (const ep of eraProfiles) {
    await prisma.worldStateEraProfile.upsert({
      where: { worldStateId: ep.worldStateId },
      update: {
        coreEconomicDrivers: ep.coreEconomicDrivers,
        powerSummary: ep.powerSummary,
        meaningOfWork: ep.meaningOfWork,
        evidenceRationale: ep.evidenceRationale,
        knobEconomicPressure: ep.knobEconomicPressure,
        knobRelationalInterdependence: ep.knobRelationalInterdependence,
        knobAutonomyBaseline: ep.knobAutonomyBaseline,
        knobSystemicExtraction: ep.knobSystemicExtraction,
        knobCollectiveCohesion: ep.knobCollectiveCohesion,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "seed",
      },
      create: {
        worldStateId: ep.worldStateId,
        coreEconomicDrivers: ep.coreEconomicDrivers,
        powerSummary: ep.powerSummary,
        meaningOfWork: ep.meaningOfWork,
        evidenceRationale: ep.evidenceRationale,
        knobEconomicPressure: ep.knobEconomicPressure,
        knobRelationalInterdependence: ep.knobRelationalInterdependence,
        knobAutonomyBaseline: ep.knobAutonomyBaseline,
        knobSystemicExtraction: ep.knobSystemicExtraction,
        knobCollectiveCohesion: ep.knobCollectiveCohesion,
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
