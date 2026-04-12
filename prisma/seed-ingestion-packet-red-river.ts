import type { PrismaClient } from "@prisma/client";
import {
  AttachmentStyle,
  EnvironmentRiskCategory,
  FragmentType,
  JusticeMode,
  NodeConnectionType,
  PlaceType,
  PublicStatus,
  RecordType,
  RelationshipType,
  SelfPerceptionState,
  SourceType,
  StatusPosition,
  TrainingMode,
  VisibilityStatus,
  WritingMode,
} from "@prisma/client";
import { DEFAULT_BOOK_ID } from "../lib/constants/narrative-defaults";
import { FRAGMENT_DECOMPOSITION_VERSION } from "../lib/fragment-constants";
import { normalizePersonPair } from "../lib/relationship-order";

/**
 * CAMPTI — Red River Trade Era vertical slice (WS-09): Asha × “The Riverbank Disclosure”.
 *
 * Depends on seed.ts (people), seed-environment, seed-pressure, seed-relationship, seedContinuity,
 * and runs after seedIngestionPacket01.
 *
 * Packet 03: full WS-09 stack for Elaya (counterpart) — mirrors Asha profile coverage for two-sided bundles.
 * Packet 03b: symmetric CharacterProfile (1:1 mind model) for Asha + Elaya — fills the remaining agent gap vs world-sliced rows alone.
 * Packet 04: scene-scoped CharacterState for Elaya — enables focal-switch validation vs Asha without changing fixtures.
 */
export async function seedIngestionPacketRedRiver(prisma: PrismaClient): Promise<void> {
  const WS09 = "seed-ws-ref-ws09";
  const FOCAL = "seed-person-asha";
  const COUNTERPART = "seed-person-elaya";
  const CHAPTER_ID = "ing-rr-chapter-riverbank";
  const SCENE_ID = "ing-rr-scene-riverbank-disclosure";
  const PLACE_ID = "seed-place-rr-busy-riverbank";
  const SOURCE_ID = "ing-rr-source-curated";
  const SOURCE_TSHA_ID = "ing-rr-source-tsha-caddo-handbook";
  const ASHA_ELAYA_RP_ID = "ing-rr-rp-asha-elaya-ws09";
  const CS_ID = "ing-rr-cs-asha-ws09-scene";
  /** Packet 04 — Elaya-as-focal scene slice (paired with Asha CS for focal alternation in workspace). */
  const CS_ELAYA_ID = "ing-rr-cs-elaya-ws09-scene";
  const dyadPair = normalizePersonPair(FOCAL, COUNTERPART);

  await prisma.source.upsert({
    where: { id: SOURCE_ID },
    update: {
      title: "Red River Trade Era — curated cues (WS-09 / riverbank disclosure slice)",
      summary:
        "Method note: Caddo trade network, trade-house kinship, indirect public speech. Expand with primary sources when pinned.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: false,
      processingNotes:
        "WS-09 scaffold. Packet 02 claims: `ing-rr-claim-dyad-witness-leverage`, `ing-rr-claim-riverbank-perception-load` (+ earlier indirect/reputation claims). Routed to structured rows; not a single narrative blob.",
    },
    create: {
      id: SOURCE_ID,
      title: "Red River Trade Era — curated cues (WS-09 / riverbank disclosure slice)",
      summary:
        "Method note: Caddo trade network, trade-house kinship, indirect public speech. Expand with primary sources when pinned.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: false,
      processingNotes:
        "WS-09 scaffold. Packet 02 claims: `ing-rr-claim-dyad-witness-leverage`, `ing-rr-claim-riverbank-perception-load` (+ earlier indirect/reputation claims). Routed to structured rows; not a single narrative blob.",
    },
  });

  await prisma.source.update({
    where: { id: SOURCE_ID },
    data: {
      persons: { connect: [{ id: FOCAL }, { id: COUNTERPART }] },
    },
  });

  const curatedNote =
    "Red River trade network (Natchitoches, Yatasi, Kadohadacho among Caddoan-speaking groups): trade houses, kin ties, ritual diplomacy; reputation collective; public contradiction rare; implication and silence communicative.";

  await prisma.sourceText.upsert({
    where: { sourceId: SOURCE_ID },
    update: {
      rawText: curatedNote,
      textStatus: "stub",
      textNotes: "Short cues for ingestion — expand with cited material when era is pinned.",
    },
    create: {
      sourceId: SOURCE_ID,
      rawText: curatedNote,
      textStatus: "stub",
      textNotes: "Short cues for ingestion — expand with cited material when era is pinned.",
    },
  });

  await prisma.claim.upsert({
    where: { id: "ing-rr-claim-indirect-public" },
    update: {
      description:
        "In dense public gatherings, direct contradiction or open accusation is socially dangerous; meaning often travels by tone, implication, and silence.",
      confidence: 3,
      needsReview: true,
    },
    create: {
      id: "ing-rr-claim-indirect-public",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      description:
        "In dense public gatherings, direct contradiction or open accusation is socially dangerous; meaning often travels by tone, implication, and silence.",
      confidence: 3,
      sourceId: SOURCE_ID,
      needsReview: true,
      quoteExcerpt: null,
      notes: "Feeds knowledge/expression + Stage 8 public intimate disclosure norms.",
    },
  });

  await prisma.claim.upsert({
    where: { id: "ing-rr-claim-collective-reputation" },
    update: {
      description:
        "Reputation is collective: individual acts reflect on lineage and trade house; shame risk is high in public missteps.",
      confidence: 3,
    },
    create: {
      id: "ing-rr-claim-collective-reputation",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      description:
        "Reputation is collective: individual acts reflect on lineage and trade house; shame risk is high in public missteps.",
      confidence: 3,
      sourceId: SOURCE_ID,
      needsReview: true,
      notes: "Feeds pressure + relationship norms + Stage 8.5 costly exposure lines.",
    },
  });

  await prisma.fragment.upsert({
    where: { id: "ing-rr-frag-silence-speaks" },
    update: {
      text: "Silence is not absence — it can affirm, refuse, or warn while keeping the trade house face intact.",
    },
    create: {
      id: "ing-rr-frag-silence-speaks",
      sourceId: SOURCE_ID,
      fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      text: "Silence is not absence — it can affirm, refuse, or warn while keeping the trade house face intact.",
      summary: "Silence as meaningful act — legality-relevant.",
      placementStatus: "placed",
      reviewStatus: "pending",
      confidence: 3,
      decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
    },
  });

  await prisma.source.upsert({
    where: { id: SOURCE_TSHA_ID },
    update: {
      title: "Handbook of Texas Online — “Caddo Indians” (TSHA)",
      summary:
        "Secondary synthesis: Caddoan groups along the Red River; ranked society; long-distance trade; matrilineal clans; political/spiritual offices. Supports collective reputation and public ceremonial order — not scene-specific dialogue.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.WEB,
      ingestionReady: true,
      authorOrOrigin: "Timothy K. Perttula, Handbook of Texas Online",
      sourceDate: "accessed 2026-04-11",
      processingNotes:
        "Citation: Perttula, “Caddo Indians,” Handbook of Texas Online, https://www.tshaonline.org/handbook/entries/caddo-indians. Excerpts kept short; claims routed to structured rows.",
    },
    create: {
      id: SOURCE_TSHA_ID,
      title: "Handbook of Texas Online — “Caddo Indians” (TSHA)",
      summary:
        "Secondary synthesis: Caddoan groups along the Red River; ranked society; long-distance trade; matrilineal clans; political/spiritual offices. Supports collective reputation and public ceremonial order — not scene-specific dialogue.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.WEB,
      ingestionReady: true,
      authorOrOrigin: "Timothy K. Perttula, Handbook of Texas Online",
      sourceDate: "accessed 2026-04-11",
      processingNotes:
        "Citation: Perttula, “Caddo Indians,” Handbook of Texas Online, https://www.tshaonline.org/handbook/entries/caddo-indians. Excerpts kept short; claims routed to structured rows.",
    },
  });

  await prisma.source.update({
    where: { id: SOURCE_TSHA_ID },
    data: {
      persons: { connect: [{ id: FOCAL }, { id: COUNTERPART }] },
    },
  });

  await prisma.sourceText.upsert({
    where: { sourceId: SOURCE_TSHA_ID },
    update: {
      rawText:
        "Excerpt 1: “They developed long-distance trade networks in prehistoric times.”\n\n" +
        "Excerpt 2: “Religious and political authority in historic Caddoan society rested in a hierarchy of key positions within and between the various affiliated communities and groups.”\n\n" +
        "Excerpt 3: “The Caddos traced descent through the maternal line rather than the paternal.”",
      textStatus: "extracted",
      textNotes: "Quoted lines are verbatim from the TSHA article body (accessed 2026-04-11).",
    },
    create: {
      sourceId: SOURCE_TSHA_ID,
      rawText:
        "Excerpt 1: “They developed long-distance trade networks in prehistoric times.”\n\n" +
        "Excerpt 2: “Religious and political authority in historic Caddoan society rested in a hierarchy of key positions within and between the various affiliated communities and groups.”\n\n" +
        "Excerpt 3: “The Caddos traced descent through the maternal line rather than the paternal.”",
      textStatus: "extracted",
      textNotes: "Quoted lines are verbatim from the TSHA article body (accessed 2026-04-11).",
    },
  });

  await prisma.claim.upsert({
    where: { id: "ing-rr-claim-long-distance-trade-networks" },
    update: {
      description:
        "Caddoan peoples developed long-distance trade networks; prestige goods and materials moved over wide networks (implication: landings and public exchange sites are socially dense and status-bearing).",
      confidence: 4,
      needsReview: false,
    },
    create: {
      id: "ing-rr-claim-long-distance-trade-networks",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      description:
        "Caddoan peoples developed long-distance trade networks; prestige goods and materials moved over wide networks (implication: landings and public exchange sites are socially dense and status-bearing).",
      confidence: 4,
      sourceId: SOURCE_TSHA_ID,
      needsReview: false,
      quoteExcerpt: "They developed long-distance trade networks in prehistoric times.",
      notes: "Supports place-based transit/visibility pressure for riverbank trade scenes; not a claim about a specific historical beat.",
    },
  });

  await prisma.claim.upsert({
    where: { id: "ing-rr-claim-ranked-authority-hierarchy" },
    update: {
      description:
        "Historic Caddoan political and religious authority was hierarchically organized across affiliated communities — public order and reputation are not purely individual.",
      confidence: 4,
      needsReview: false,
    },
    create: {
      id: "ing-rr-claim-ranked-authority-hierarchy",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      description:
        "Historic Caddoan political and religious authority was hierarchically organized across affiliated communities — public order and reputation are not purely individual.",
      confidence: 4,
      sourceId: SOURCE_TSHA_ID,
      needsReview: false,
      quoteExcerpt:
        "Religious and political authority in historic Caddoan society rested in a hierarchy of key positions within and between the various affiliated communities and groups.",
      notes: "Supports collective shame / house-lineage stakes in WS-09 expression norms (interpretive bridge, not a primary document).",
    },
  });

  await prisma.fragment.upsert({
    where: { id: "ing-rr-frag-matriline-descent" },
    update: {
      text: "Matrilineal descent shapes how kin obligation and reputation propagate — individual acts refract through maternal lines.",
    },
    create: {
      id: "ing-rr-frag-matriline-descent",
      sourceId: SOURCE_TSHA_ID,
      fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      text: "Matrilineal descent shapes how kin obligation and reputation propagate — individual acts refract through maternal lines.",
      summary: "Kin-lineage logic — disclosure / shame leverage context.",
      placementStatus: "placed",
      reviewStatus: "pending",
      confidence: 4,
      decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
    },
  });

  await prisma.fragment.upsert({
    where: { id: "ing-rr-frag-trade-networks-public-density" },
    update: {
      text: "Long-distance trade ties make river landings nodes where strangers, allies, and kin overlap — overhearing and witness density rise by default.",
    },
    create: {
      id: "ing-rr-frag-trade-networks-public-density",
      sourceId: SOURCE_TSHA_ID,
      fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      text: "Long-distance trade ties make river landings nodes where strangers, allies, and kin overlap — overhearing and witness density rise by default.",
      summary: "Place pressure — visibility / surveillance via crowd physics.",
      placementStatus: "placed",
      reviewStatus: "pending",
      confidence: 4,
      decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
    },
  });

  await prisma.claim.upsert({
    where: { id: "ing-rr-claim-dyad-witness-leverage" },
    update: {
      description:
        "For Asha × Elaya (WS-09): tenderness or desire can be tactically ‘read’ by bystanders — witness converts intimacy into reputational leverage even when the bond is privately trusted.",
      confidence: 3,
      needsReview: true,
    },
    create: {
      id: "ing-rr-claim-dyad-witness-leverage",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      description:
        "For Asha × Elaya (WS-09): tenderness or desire can be tactically ‘read’ by bystanders — witness converts intimacy into reputational leverage even when the bond is privately trusted.",
      confidence: 3,
      sourceId: SOURCE_ID,
      needsReview: true,
      notes: "Supports RelationshipProfile `ing-rr-rp-asha-elaya-ws09` shameLeverage / disclosure logic — synthetic dyad beat.",
    },
  });

  await prisma.claim.upsert({
    where: { id: "ing-rr-claim-riverbank-perception-load" },
    update: {
      description:
        "Busy river landings couple water-edge glare, cargo clutter, and overlapping voices — stillness for private speech is scarce; peripheral listeners are structurally plausible.",
      confidence: 3,
      needsReview: true,
    },
    create: {
      id: "ing-rr-claim-riverbank-perception-load",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      description:
        "Busy river landings couple water-edge glare, cargo clutter, and overlapping voices — stillness for private speech is scarce; peripheral listeners are structurally plausible.",
      confidence: 3,
      sourceId: SOURCE_ID,
      needsReview: true,
      notes: "Supports PlaceState / SettingProfile for `seed-place-rr-busy-riverbank` — interpretive bridge from trade-network density (see also TSHA claim `ing-rr-claim-long-distance-trade-networks`).",
    },
  });

  await prisma.fragment.upsert({
    where: { id: "ing-rr-frag-implication-over-naming" },
    update: {
      text: "Public intimate truth routes through tone, timing, and river/kin metaphor before it routes through direct naming — naming aloud is the costly move.",
    },
    create: {
      id: "ing-rr-frag-implication-over-naming",
      sourceId: SOURCE_ID,
      fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      text: "Public intimate truth routes through tone, timing, and river/kin metaphor before it routes through direct naming — naming aloud is the costly move.",
      summary: "Disclosure channel ordering — Stage 7.5 / 8 legality.",
      placementStatus: "placed",
      reviewStatus: "pending",
      confidence: 3,
      decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
    },
  });

  await prisma.riskRegime.upsert({
    where: { key: "ing-rr-risk-landing-social-surveillance" },
    update: {
      label: "WS-09 — social surveillance / overhearing at busy landings",
      description:
        "Crowd physics at a trade landing: peripheral listeners, interrupted sight lines, and reputational exposure — social surveillance risk distinct from hydrology flood modeling.",
      category: EnvironmentRiskCategory.SURVEILLANCE,
      baseSeverity: 52,
      notes: "Tie to slice place `seed-place-rr-busy-riverbank` and PlaceState `ing-rr-placestate-riverbank-ws09` for authoring traceability.",
      certainty: "ingestion_red_river_packet02",
    },
    create: {
      id: "ing-rr-riskreg-landing-surveillance",
      key: "ing-rr-risk-landing-social-surveillance",
      label: "WS-09 — social surveillance / overhearing at busy landings",
      description:
        "Crowd physics at a trade landing: peripheral listeners, interrupted sight lines, and reputational exposure — social surveillance risk distinct from hydrology flood modeling.",
      category: EnvironmentRiskCategory.SURVEILLANCE,
      baseSeverity: 52,
      notes: "Tie to slice place `seed-place-rr-busy-riverbank` and PlaceState `ing-rr-placestate-riverbank-ws09` for authoring traceability.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet02",
    },
  });

  await prisma.worldGovernanceProfile.upsert({
    where: { worldStateId: WS09 },
    update: {
      label: "WS-09 — trade-house order, ritual diplomacy, kin accountability",
      controlIntensity: 48,
      punishmentSeverity: 52,
      enforcementVisibility: 44,
      justiceFairness: 42,
      conformityPressure: 58,
      justiceMode: JusticeMode.MIXED,
      notes:
        "Governance through reputation, kin obligation, and controlled public order — not bureaucratic courts. Partial external support: TSHA synthesis on ranked Caddoan authority across communities (see claim `ing-rr-claim-ranked-authority-hierarchy`).",
    },
    create: {
      id: "ing-rr-wgov-ws09",
      worldStateId: WS09,
      label: "WS-09 — trade-house order, ritual diplomacy, kin accountability",
      controlIntensity: 48,
      punishmentSeverity: 52,
      enforcementVisibility: 44,
      justiceFairness: 42,
      conformityPressure: 58,
      justiceMode: JusticeMode.MIXED,
      notes:
        "Governance through reputation, kin obligation, and controlled public order — not bureaucratic courts. Partial external support: TSHA synthesis on ranked Caddoan authority across communities (see claim `ing-rr-claim-ranked-authority-hierarchy`).",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.worldKnowledgeProfile.upsert({
    where: { worldStateId: WS09 },
    update: {
      label: "WS-09 knowledge — oral, experiential, trade participation",
      abstractionCeiling: 46,
      literacyRegime: "Oral and observational primacy; knowledge tied to elders, trade roles, and ritual participation.",
      dominantExplanatorySystems: {
        primary: ["kin_and_trade_house_honor", "spiritual_balance", "seasonal_and_river_logic"],
        suppressed: ["individual_psychology_as_public_frame"],
      },
      technologyHorizon: { transport: "river_and_trail", media: "oral_and_ritual", medicine: "communal_and_plant_lore" },
      informationFlowSpeed: 40,
      geographicAwarenessNorm: "Network of landings, trails, and kin — truth moves with travelers and obligation.",
      tabooKnowledgeDomains: {
        public_contradiction_of_elder: "dangerous",
        shaming_the_house: "unspeakable_in_open_air",
      },
      notes: "Pre-French-contact trade-era scaffold — refine with pinned sources.",
      certainty: "ingestion_red_river",
    },
    create: {
      id: "ing-rr-wkp-ws09",
      worldStateId: WS09,
      label: "WS-09 knowledge — oral, experiential, trade participation",
      abstractionCeiling: 46,
      literacyRegime: "Oral and observational primacy; knowledge tied to elders, trade roles, and ritual participation.",
      dominantExplanatorySystems: {
        primary: ["kin_and_trade_house_honor", "spiritual_balance", "seasonal_and_river_logic"],
        suppressed: ["individual_psychology_as_public_frame"],
      },
      technologyHorizon: { transport: "river_and_trail", media: "oral_and_ritual", medicine: "communal_and_plant_lore" },
      informationFlowSpeed: 40,
      geographicAwarenessNorm: "Network of landings, trails, and kin — truth moves with travelers and obligation.",
      tabooKnowledgeDomains: {
        public_contradiction_of_elder: "dangerous",
        shaming_the_house: "unspeakable_in_open_air",
      },
      notes: "Pre-French-contact trade-era scaffold — refine with pinned sources.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.worldExpressionProfile.upsert({
    where: { worldStateId: WS09 },
    update: {
      label: "WS-09 expression — indirect public truth, silence as speech",
      publicExpressionCeiling: 40,
      internalLanguageComplexityNorm: 54,
      metaphorSourceDomains: { river: "high", kin: "high", ritual: "high" },
      acceptableExplanationModes: { public: "implication_and_measured_tone", private: "plainer_with_kin_risk" },
      silencePatternsNorm:
        "Silence can refuse, defer, or protect; direct naming of conflict in public is rare and costly.",
      tabooPhrasingDomains: {
        open_accusation: "dangerous_to_house",
        witness: "public_shame_leverage",
      },
      notes: "Aligns with intimate_disclosure under PUBLIC visibility — implication over declaration.",
      certainty: "ingestion_red_river",
    },
    create: {
      id: "ing-rr-wep-ws09",
      worldStateId: WS09,
      label: "WS-09 expression — indirect public truth, silence as speech",
      publicExpressionCeiling: 40,
      internalLanguageComplexityNorm: 54,
      metaphorSourceDomains: { river: "high", kin: "high", ritual: "high" },
      acceptableExplanationModes: { public: "implication_and_measured_tone", private: "plainer_with_kin_risk" },
      silencePatternsNorm:
        "Silence can refuse, defer, or protect; direct naming of conflict in public is rare and costly.",
      tabooPhrasingDomains: {
        open_accusation: "dangerous_to_house",
        witness: "public_shame_leverage",
      },
      notes: "Aligns with intimate_disclosure under PUBLIC visibility — implication over declaration.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.worldEducationNormProfile.upsert({
    where: { worldStateId: WS09 },
    update: {
      label: "WS-09 education — oral, observational, apprenticeship",
      eliteKnowledgeAccess: 58,
      commonKnowledgeAccess: 48,
      childTrainingModel: { mode: "house_and_elders", discipline: "public_deference_high" },
      youthInitiationModel: { trade: "shadow_and_ceremony", river: "high_salience" },
      elderTransmissionMode: { story: "high", craft: "apprentice_at_landing" },
      literacyAccessPattern: { formal_script: "limited_or_absent", oral: "primary" },
      specialistTrainingPaths: { trade: "house_lineage", diplomacy: "ritual_observation" },
      genderedTrainingDifferences: { trade_house_daughters: "relational_and_exchange_craft", mobility: "contextual" },
      notes: "Knowledge tied to participation in trade and kin roles.",
    },
    create: {
      id: "ing-rr-wedu-ws09",
      worldStateId: WS09,
      label: "WS-09 education — oral, observational, apprenticeship",
      eliteKnowledgeAccess: 58,
      commonKnowledgeAccess: 48,
      childTrainingModel: { mode: "house_and_elders", discipline: "public_deference_high" },
      youthInitiationModel: { trade: "shadow_and_ceremony", river: "high_salience" },
      elderTransmissionMode: { story: "high", craft: "apprentice_at_landing" },
      literacyAccessPattern: { formal_script: "limited_or_absent", oral: "primary" },
      specialistTrainingPaths: { trade: "house_lineage", diplomacy: "ritual_observation" },
      genderedTrainingDifferences: { trade_house_daughters: "relational_and_exchange_craft", mobility: "contextual" },
      notes: "Knowledge tied to participation in trade and kin roles.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.worldHealthNormProfile.upsert({
    where: { worldStateId: WS09 },
    update: {
      label: "WS-09 health — relational and spiritual framing of distress",
      bodyInterpretationModel: { fatigue: "imbalance_or_load", pain: "often_communal_context" },
      mindInterpretationModel: { worry: "relational_rupture_or_sign", prayer_or_ritual: "first_line" },
      emotionInterpretationModel: { grief: "kin_and_spirit_linked", anger: "dangerous_if_public" },
      healingSystems: { kin: "high", ritual: "high", solitary_therapy: "not_a_category" },
      stigmaPatterns: { public_breakdown: "heavy_shame", house_honor: "survival_issue" },
      communityCareCapacity: 62,
      institutionalCareCapacity: 28,
      survivalBurden: 52,
      restPossibility: 44,
      notes: "Distress read as imbalance or relational disruption; healing communal — no private therapy frame.",
    },
    create: {
      id: "ing-rr-whp-ws09",
      worldStateId: WS09,
      label: "WS-09 health — relational and spiritual framing of distress",
      bodyInterpretationModel: { fatigue: "imbalance_or_load", pain: "often_communal_context" },
      mindInterpretationModel: { worry: "relational_rupture_or_sign", prayer_or_ritual: "first_line" },
      emotionInterpretationModel: { grief: "kin_and_spirit_linked", anger: "dangerous_if_public" },
      healingSystems: { kin: "high", ritual: "high", solitary_therapy: "not_a_category" },
      stigmaPatterns: { public_breakdown: "heavy_shame", house_honor: "survival_issue" },
      communityCareCapacity: 62,
      institutionalCareCapacity: 28,
      survivalBurden: 52,
      restPossibility: 44,
      notes: "Distress read as imbalance or relational disruption; healing communal — no private therapy frame.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.worldRelationshipNormProfile.upsert({
    where: { worldStateId: WS09 },
    update: {
      label: "WS-09 relationships — disclosure context-bound; shame leverage in kin",
      relationalVisibility: 70,
      punishmentForViolation: 74,
      marriageRules: { pattern: "kin_trade_alliance", notes: "Bonds real but often masked in public gatherings." },
      tabooSystem: {
        public_emotional_spectacle: "shames_lineage",
        direct_accusation_in_crowd: "invites_group_conflict",
      },
      emotionalExpressionRules: {
        intimate_truth: "safer_private",
        public: "coded_or_implied",
      },
      notes: "Intimate bonds operative; public legibility constrained.",
    },
    create: {
      id: "ing-rr-wrn-ws09",
      worldStateId: WS09,
      label: "WS-09 relationships — disclosure context-bound; shame leverage in kin",
      relationalVisibility: 70,
      punishmentForViolation: 74,
      marriageRules: { pattern: "kin_trade_alliance", notes: "Bonds real but often masked in public gatherings." },
      tabooSystem: {
        public_emotional_spectacle: "shames_lineage",
        direct_accusation_in_crowd: "invites_group_conflict",
      },
      emotionalExpressionRules: {
        intimate_truth: "safer_private",
        public: "coded_or_implied",
      },
      notes: "Intimate bonds operative; public legibility constrained.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.worldPressureBundle.upsert({
    where: { worldStateId: WS09 },
    update: {
      governanceWeight: 26,
      economicWeight: 28,
      demographicWeight: 22,
      familyWeight: 24,
      summary: {
        note: "WS-09: reputation and kin/trade dependency dominate; surveillance is social at landings and markets.",
      },
    },
    create: {
      id: "ing-rr-wpb-ws09",
      worldStateId: WS09,
      governanceWeight: 26,
      economicWeight: 28,
      demographicWeight: 22,
      familyWeight: 24,
      summary: {
        note: "WS-09: reputation and kin/trade dependency dominate; surveillance is social at landings and markets.",
      },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.place.upsert({
    where: { id: PLACE_ID },
    update: {
      name: "Red River bank — busy trade landing",
      description:
        "Goods loaded and exchanged; families and traders overlap; conversations stack — high visibility, relational density.",
      sourceTraceNote:
        "Place semantics aligned with TSHA-backed long-distance trade / Red River Caddoan context (claims `ing-rr-claim-long-distance-trade-networks`, `ing-rr-claim-ranked-authority-hierarchy`) — synthetic scene beat, not a pinned historical micro-location.",
    },
    create: {
      id: PLACE_ID,
      name: "Red River bank — busy trade landing",
      placeType: PlaceType.RIVER,
      description:
        "Goods loaded and exchanged; families and traders overlap; conversations stack — high visibility, relational density.",
      sourceTraceNote:
        "Place semantics aligned with TSHA-backed long-distance trade / Red River Caddoan context (claims `ing-rr-claim-long-distance-trade-networks`, `ing-rr-claim-ranked-authority-hierarchy`) — synthetic scene beat, not a pinned historical micro-location.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
    },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_ID },
    update: {
      environmentType: "river_landing_trade_corridor",
      physicalDescription:
        "Sloped bank to water; mud and slick stone at the edge; stacked bundles, cordage, and craft goods create irregular visual blocks; bodies pass close.",
      dominantActivities:
        "Loading and unloading; bargaining; kin greetings; ferrying; dogs and children underfoot; intermittent ritual/formal recognition when dignitaries move through.",
      socialRules:
        "Public deference to elders and house heads; conflict stays coded; spectacle shames the house; many simultaneous conversations make 'private' speech easy to overhear.",
      sounds:
        "Water slap and pole creak; hammering; shouted prices; overlapping talk; hoof and foot traffic; splashing at the edge.",
      lightingConditions: "open air — high glare off water; faces readable at short distance.",
      smells: "River mud, smoked fish, pine resin, sweat, wet cordage.",
      materialsPresent:
        "tags:visibility_dense; overhearing_plausible; transit_heavy; not_ritual_enclosure; cargo_visual_noise",
      economicContext: "Exchange node — prestige goods and utilitarian loads move through here.",
      notes:
        "Visibility-dense, transit-heavy: stillness and concealment are harder than in a screened dwelling; implication travels farther than whisper.",
    },
    create: {
      placeId: PLACE_ID,
      environmentType: "river_landing_trade_corridor",
      physicalDescription:
        "Sloped bank to water; mud and slick stone at the edge; stacked bundles, cordage, and craft goods create irregular visual blocks; bodies pass close.",
      dominantActivities:
        "Loading and unloading; bargaining; kin greetings; ferrying; dogs and children underfoot; intermittent ritual/formal recognition when dignitaries move through.",
      socialRules:
        "Public deference to elders and house heads; conflict stays coded; spectacle shames the house; many simultaneous conversations make 'private' speech easy to overhear.",
      sounds:
        "Water slap and pole creak; hammering; shouted prices; overlapping talk; hoof and foot traffic; splashing at the edge.",
      lightingConditions: "open air — high glare off water; faces readable at short distance.",
      smells: "River mud, smoked fish, pine resin, sweat, wet cordage.",
      materialsPresent:
        "tags:visibility_dense; overhearing_plausible; transit_heavy; not_ritual_enclosure; cargo_visual_noise",
      economicContext: "Exchange node — prestige goods and utilitarian loads move through here.",
      notes:
        "Visibility-dense, transit-heavy: stillness and concealment are harder than in a screened dwelling; implication travels farther than whisper.",
    },
  });

  await prisma.placeEnvironmentProfile.upsert({
    where: { placeId: PLACE_ID },
    update: {
      terrainType: "alluvial_riverbank",
      hydrologyType: "navigable_floodplain_channel_edge",
      mobilityProfile:
        "Foot traffic bottlenecks at the landing; unstable footing at mud and wet stone; cargo stacks and litters interrupt sight lines; hard to hold a private physical bubble without repositioning.",
      sensoryProfile: {
        crowding: "high",
        water_edge_glare: "high",
        trade_noise: "high",
        peripheral_listeners: "high",
        interruption_density: "high",
      },
      resourceProfile: { exchange_load: "high", portage_pressure: "moderate" },
      floodRiskLevel: 32,
      droughtRiskLevel: 18,
      notes:
        "Stage 8: supports stronger perception cues (sound/mobility) and brain environment immediate risks (terrain/hydrology lines).",
      certainty: "ingestion_red_river_packet02",
    },
    create: {
      placeId: PLACE_ID,
      terrainType: "alluvial_riverbank",
      hydrologyType: "navigable_floodplain_channel_edge",
      mobilityProfile:
        "Foot traffic bottlenecks at the landing; unstable footing at mud and wet stone; cargo stacks and litters interrupt sight lines; hard to hold a private physical bubble without repositioning.",
      sensoryProfile: {
        crowding: "high",
        water_edge_glare: "high",
        trade_noise: "high",
        peripheral_listeners: "high",
        interruption_density: "high",
      },
      resourceProfile: { exchange_load: "high", portage_pressure: "moderate" },
      floodRiskLevel: 32,
      droughtRiskLevel: 18,
      notes:
        "Stage 8: supports stronger perception cues (sound/mobility) and brain environment immediate risks (terrain/hydrology lines).",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet02",
    },
  });

  await prisma.placeState.upsert({
    where: { id: "ing-rr-placestate-riverbank-ws09" },
    update: {
      label: "WS-09 — busy landing surveillance physics",
      settlementPattern: "public_trade_node",
      strategicValue: 58,
      riskLevel: 52,
      pressureProfile: {
        reputational_exposure: "high",
        overhearing_likelihood: "high",
        interruption_likelihood: "high",
        movement_constraint: "loading_lanes_and_crowd_edges",
        stillness_concealment: "harder_at_open_bank",
        witness_spectacle_risk: "high_if_voice_carries",
        direct_plain_speech_difficulty: "high_under_crowd_acoustics",
        kin_trade_surveillance: "elders_and_house_heads_scan_public_deportment",
        visibility_legibility: "faces_and_posture_read_at_short_range_amid_visual_clutter",
      },
      accessProfile: { kin_access: "routine", stranger_presence: "elevated" },
      transportProfile: { river: "primary_corridor", trail: "secondary" },
      notes: "Era-scoped behavioral risk for intimate disclosure beats — not hydrology modeling.",
    },
    create: {
      id: "ing-rr-placestate-riverbank-ws09",
      placeId: PLACE_ID,
      worldStateId: WS09,
      label: "WS-09 — busy landing surveillance physics",
      settlementPattern: "public_trade_node",
      strategicValue: 58,
      riskLevel: 52,
      pressureProfile: {
        reputational_exposure: "high",
        overhearing_likelihood: "high",
        interruption_likelihood: "high",
        movement_constraint: "loading_lanes_and_crowd_edges",
        stillness_concealment: "harder_at_open_bank",
        witness_spectacle_risk: "high_if_voice_carries",
        direct_plain_speech_difficulty: "high_under_crowd_acoustics",
        kin_trade_surveillance: "elders_and_house_heads_scan_public_deportment",
        visibility_legibility: "faces_and_posture_read_at_short_range_amid_visual_clutter",
      },
      accessProfile: { kin_access: "routine", stranger_presence: "elevated" },
      transportProfile: { river: "primary_corridor", trail: "secondary" },
      notes: "Era-scoped behavioral risk for intimate disclosure beats — not hydrology modeling.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet02",
    },
  });

  await prisma.environmentNode.upsert({
    where: { key: "rr_ws09_busy_riverbank_landing" },
    update: {
      label: "Red River busy landing (WS-09 slice)",
      nodeType: "TRADE_LANDING",
      isCoreNode: true,
      regionLabel: "Red River trade corridor",
      summary: "High-witness bank where goods and kin overlap; implication-first intimacy default.",
    },
    create: {
      id: "ing-rr-env-node-busy-landing",
      placeId: PLACE_ID,
      key: "rr_ws09_busy_riverbank_landing",
      label: "Red River busy landing (WS-09 slice)",
      nodeType: "TRADE_LANDING",
      isCoreNode: true,
      regionLabel: "Red River trade corridor",
      summary: "High-witness bank where goods and kin overlap; implication-first intimacy default.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet02",
    },
  });

  const idRiverChannelNode = await prisma.environmentNode.findUnique({
    where: { key: "red_river_main_channel" },
    select: { id: true },
  });
  const idBusyLandingNode = await prisma.environmentNode.findUnique({
    where: { key: "rr_ws09_busy_riverbank_landing" },
    select: { id: true },
  });
  if (idRiverChannelNode?.id && idBusyLandingNode?.id) {
    await prisma.nodeConnection.upsert({
      where: { id: "ing-rr-nc-bank-channel-ws09" },
      update: {
        travelRisk: 38,
        travelDifficulty: 42,
        notes: "Landing segment tied to main channel — movement and noise couple disclosure risk to the water edge.",
        worldStateId: WS09,
      },
      create: {
        id: "ing-rr-nc-bank-channel-ws09",
        fromNodeId: idBusyLandingNode.id,
        toNodeId: idRiverChannelNode.id,
        connectionType: NodeConnectionType.RIVER,
        bidirectional: true,
        travelRisk: 38,
        travelDifficulty: 42,
        notes: "Landing segment tied to main channel — movement and noise couple disclosure risk to the water edge.",
        worldStateId: WS09,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.PUBLIC,
        certainty: "ingestion_red_river_packet02",
      },
    });
  }

  await prisma.source.update({
    where: { id: SOURCE_TSHA_ID },
    data: {
      places: { connect: { id: PLACE_ID } },
    },
  });

  // --- Focal character × WS-09 (Asha) ---
  await prisma.person.update({
    where: { id: FOCAL },
    data: {
      description:
        "Daughter of a respected trade-house leader; words weigh on the whole house. Emotionally perceptive; under pressure speech narrows to guarded implication.",
    },
  });

  await prisma.person.update({
    where: { id: COUNTERPART },
    data: {
      description:
        "Trade-network negotiator kin-tied to Asha's house: reads micro-signals and reciprocates implication; wants plain reciprocity off-stage — on the bank, witness turns tenderness into leverage risk (Packet 03 full WS-09 stack).",
    },
  });

  // 1:1 psychographic mind model (not world-sliced) — completes “cognitive agent” surface for admin + relationship-dynamics / perspective layers.
  await prisma.characterProfile.upsert({
    where: { personId: FOCAL },
    update: {
      worldview:
        "Honor is held in the house line; truth moves through kin and trade obligation — public air is for coded speech, not open confession.",
      coreBeliefs: [
        "The trade house cannot afford spectacle.",
        "Implication preserves face for everyone who must overhear.",
        "Elaya is a real tie — not a prop — but witness turns tenderness into risk.",
      ],
      fears: [
        "Naming desire aloud where strangers can parse it.",
        "House shame attached to her smallest public slip.",
        "Being misread as performing emotion for the crowd.",
      ],
      desires: [
        "Emotional clarity with Elaya without becoming the story of the landing.",
        "A private window where plain speech is possible.",
      ],
      internalConflicts: [
        "Duty to the house line versus hunger for unguarded reciprocity.",
        "Trust in Elaya versus fear of what bystanders will do with what they see.",
      ],
      relationalStyle: "attuned, deferential in public, searching in dyad",
      conflictStyle: "indirect, deflects to metaphor and silence under pressure",
      attachmentPattern: "duty-bound care braided with desire (not declared in crowd)",
      shameTrigger: "public exposure of private feeling as entertainment or leverage",
      emotionalBaseline: "controlled surface, high inner vigilance",
      speechPatterns: "short clauses; river/kin metaphor; silence as refusal or assent",
      narrativeFunction: "focal_intimate_disclosure_under_public_visibility",
      socialPosition: "trade_house_daughter_high_accountability",
      notes:
        "Red River WS-09 slice — pairs with world-sliced rows `ing-rr-*-asha-ws09`. Packet 03b: symmetric CharacterProfile with Elaya.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03b",
    },
    create: {
      id: "ing-rr-charprof-asha",
      personId: FOCAL,
      worldview:
        "Honor is held in the house line; truth moves through kin and trade obligation — public air is for coded speech, not open confession.",
      coreBeliefs: [
        "The trade house cannot afford spectacle.",
        "Implication preserves face for everyone who must overhear.",
        "Elaya is a real tie — not a prop — but witness turns tenderness into risk.",
      ],
      fears: [
        "Naming desire aloud where strangers can parse it.",
        "House shame attached to her smallest public slip.",
        "Being misread as performing emotion for the crowd.",
      ],
      desires: [
        "Emotional clarity with Elaya without becoming the story of the landing.",
        "A private window where plain speech is possible.",
      ],
      internalConflicts: [
        "Duty to the house line versus hunger for unguarded reciprocity.",
        "Trust in Elaya versus fear of what bystanders will do with what they see.",
      ],
      relationalStyle: "attuned, deferential in public, searching in dyad",
      conflictStyle: "indirect, deflects to metaphor and silence under pressure",
      attachmentPattern: "duty-bound care braided with desire (not declared in crowd)",
      shameTrigger: "public exposure of private feeling as entertainment or leverage",
      emotionalBaseline: "controlled surface, high inner vigilance",
      speechPatterns: "short clauses; river/kin metaphor; silence as refusal or assent",
      narrativeFunction: "focal_intimate_disclosure_under_public_visibility",
      socialPosition: "trade_house_daughter_high_accountability",
      notes:
        "Red River WS-09 slice — pairs with world-sliced rows `ing-rr-*-asha-ws09`. Packet 03b: symmetric CharacterProfile with Elaya.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03b",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: COUNTERPART },
    update: {
      worldview:
        "Alliances are lived in routes and greetings; affection is real but must survive kin eyes — the bank is a stage where generosity can be mistaken for claim.",
      coreBeliefs: [
        "Reciprocity is shown in timing and tone before it is shown in naming.",
        "Asha’s house face is not hers to spend casually in public.",
        "Witness density converts tenderness into leverage — guard the signal.",
      ],
      fears: [
        "Answering Asha in a way that shames her line.",
        "Being read as pressing when she only meant to meet.",
        "Losing the alliance mask before the wrong ears.",
      ],
      desires: [
        "Plain mutual recognition off the open bank.",
        "A clear return signal without forcing Asha to name anything aloud.",
      ],
      internalConflicts: [
        "Temptation to answer plainly versus restraint while elders scan the crowd.",
        "Private trust in Asha versus public performance of respectable alliance.",
      ],
      relationalStyle: "reciprocal, calibrated, protective of partner’s face",
      conflictStyle: "softens, redirects, offers implication-first shelter",
      attachmentPattern: "bonded through duty-network; desire held in subtext",
      shameTrigger: "being cast as the one who forced intimacy into spectacle",
      emotionalBaseline: "warm restraint; watchful generosity",
      speechPatterns: "measured agreement; asks in hints; leaves exits open",
      narrativeFunction: "counterpart_reciprocal_disclosure_pressure",
      socialPosition: "trade_network_kin_embedded_negotiator",
      notes:
        "Red River WS-09 slice — pairs with world-sliced rows `ing-rr-*-elaya-ws09`. Packet 03b: full mind model for two-sided interaction authoring.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03b",
    },
    create: {
      id: "ing-rr-charprof-elaya",
      personId: COUNTERPART,
      worldview:
        "Alliances are lived in routes and greetings; affection is real but must survive kin eyes — the bank is a stage where generosity can be mistaken for claim.",
      coreBeliefs: [
        "Reciprocity is shown in timing and tone before it is shown in naming.",
        "Asha’s house face is not hers to spend casually in public.",
        "Witness density converts tenderness into leverage — guard the signal.",
      ],
      fears: [
        "Answering Asha in a way that shames her line.",
        "Being read as pressing when she only meant to meet.",
        "Losing the alliance mask before the wrong ears.",
      ],
      desires: [
        "Plain mutual recognition off the open bank.",
        "A clear return signal without forcing Asha to name anything aloud.",
      ],
      internalConflicts: [
        "Temptation to answer plainly versus restraint while elders scan the crowd.",
        "Private trust in Asha versus public performance of respectable alliance.",
      ],
      relationalStyle: "reciprocal, calibrated, protective of partner’s face",
      conflictStyle: "softens, redirects, offers implication-first shelter",
      attachmentPattern: "bonded through duty-network; desire held in subtext",
      shameTrigger: "being cast as the one who forced intimacy into spectacle",
      emotionalBaseline: "warm restraint; watchful generosity",
      speechPatterns: "measured agreement; asks in hints; leaves exits open",
      narrativeFunction: "counterpart_reciprocal_disclosure_pressure",
      socialPosition: "trade_network_kin_embedded_negotiator",
      notes:
        "Red River WS-09 slice — pairs with world-sliced rows `ing-rr-*-elaya-ws09`. Packet 03b: full mind model for two-sided interaction authoring.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03b",
    },
  });

  await prisma.characterGovernanceImpact.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      allowedExpressionRange: 38,
      suppressionLevel: 68,
      punishmentRisk: 62,
      notes: "High collective accountability; narrow safe range for public speech.",
    },
    create: {
      id: "ing-rr-cgi-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      allowedExpressionRange: 38,
      suppressionLevel: 68,
      punishmentRisk: 62,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterSocioEconomicProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      statusPosition: StatusPosition.MID,
      survivalPressure: 58,
      resourceAccess: 52,
      perceivedValue: "Trade-house daughter — honor and obligation visible in every public gesture.",
    },
    create: {
      id: "ing-rr-csep-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      statusPosition: StatusPosition.MID,
      resourceAccess: 52,
      roleExpectation: 64,
      mobilityPotential: 44,
      dependencyLevel: 56,
      survivalPressure: 58,
      privilegeFactor: 48,
      perceivedValue: "Trade-house daughter — honor and obligation visible in every public gesture.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterDemographicProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      inclusionLevel: 52,
      riskExposure: 62,
      vigilanceLevel: 70,
      selfPerception: SelfPerceptionState.CONDITIONAL,
    },
    create: {
      id: "ing-rr-cdp-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      statusValue: 6,
      trustBias: -6,
      inclusionLevel: 52,
      riskExposure: 62,
      privilegeModifier: 40,
      mobilityModifier: 36,
      punishmentRiskModifier: 58,
      belongingSense: 58,
      identityCohesion: 56,
      vigilanceLevel: 70,
      selfPerception: SelfPerceptionState.CONDITIONAL,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterFamilyPressureProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      obligationPressure: 72,
      emotionalExpressionRange: 36,
      loyaltyExpectation: 76,
    },
    create: {
      id: "ing-rr-cfpp-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      attachmentStrength: 58,
      obligationPressure: 72,
      emotionalExpressionRange: 36,
      individualFreedom: 34,
      loyaltyExpectation: 76,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterIntelligenceProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      patternRecognition: 66,
      socialInference: 72,
      environmentalInference: 60,
      selfReflectionDepth: 54,
      expressionComplexity: 50,
      notes:
        "High social perception and fast pattern read; misread: assumes others see her inner state more clearly than they do. Relational, contextual cognition.",
    },
    create: {
      id: "ing-rr-cip-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      patternRecognition: 66,
      workingMemory: 52,
      abstractionCapacity: 48,
      socialInference: 72,
      environmentalInference: 60,
      selfReflectionDepth: 54,
      impulseControl: 62,
      planningHorizon: 50,
      metacognition: 54,
      memoryStrength: 54,
      expressionComplexity: 50,
      notes:
        "High social perception and fast pattern read; misread: assumes others see her inner state more clearly than they do. Relational, contextual cognition.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterMaskingProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      maskingIntensity: 64,
      codeSwitchingLoad: 58,
      secrecyNeed: 60,
      disclosureRisk: 68,
    },
    create: {
      id: "ing-rr-mask-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      maskingIntensity: 64,
      codeSwitchingLoad: 58,
      secrecyNeed: 60,
      disclosureRisk: 68,
      authenticPrivateSelf: { voice: "plain_with_trusted_kin", fear: "house_shame" },
      publicMask: { role: "trade_house_daughter", deference: "measured" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterDesireProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      desireSuppression: 58,
      tabooExposureRisk: 62,
      intimacyNeed: 54,
    },
    create: {
      id: "ing-rr-desire-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      attachmentStyle: AttachmentStyle.DUTY_BOUND,
      desireVisibility: 38,
      desireSuppression: 58,
      jealousySensitivity: 50,
      intimacyNeed: 54,
      autonomyNeed: 42,
      tabooExposureRisk: 62,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterEducationProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      literacyLevel: 32,
      institutionalSchoolingAccess: 22,
      oralTraditionDepth: 68,
      languageExposure: { primary: "caddoan_network_oral", secondary: "trade_pidgin_fragments" },
    },
    create: {
      id: "ing-rr-edu-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      primaryTrainingMode: TrainingMode.HOUSEHOLD_TRAINING,
      literacyLevel: 32,
      numeracyLevel: 44,
      oralTraditionDepth: 68,
      ecologicalKnowledgeDepth: 52,
      institutionalSchoolingAccess: 22,
      apprenticeshipDomains: { trade: "house_observation", river: "landing_etiquette" },
      religiousInstructionDepth: 48,
      strategicTrainingDepth: 46,
      historicalAwarenessRange: 48,
      languageExposure: { primary: "caddoan_network_oral", secondary: "trade_pidgin_fragments" },
      notes: "Era scaffold — not census.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterTraumaProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      traumaLoad: 44,
      hypervigilanceLoad: 62,
      silenceLoad: 54,
      triggerPatterns: { crowd: "narrow_speech", kin_watch: "guard" },
    },
    create: {
      id: "ing-rr-trauma-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      traumaLoad: 44,
      silenceLoad: 54,
      hypervigilanceLoad: 62,
      shameResidue: 58,
      griefResidue: 46,
      bodyMemory: { river_noise: "shoulders_high", gaze: "brief_drop" },
      triggerPatterns: { crowd: "narrow_speech", kin_watch: "guard" },
      copingPatterns: { public: "implication", private: "more_plain" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterConsequenceMemoryProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      punishmentMemory: 56,
      learnedRules: {
        public_speech: "indirect_default",
        family_shame: "existential_fear",
      },
    },
    create: {
      id: "ing-rr-conseq-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      punishmentMemory: 56,
      protectionMemory: 44,
      betrayalMemory: 40,
      rewardConditioning: 42,
      exposureLearning: 56,
      learnedRules: {
        public_speech: "indirect_default",
        family_shame: "existential_fear",
      },
      avoidancePatterns: { open_conflict_in_crowd: "avoid" },
      reinforcementPatterns: { measured_agreement: "safer" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterRumorReputationProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      suspicionLoad: 62,
      scandalRisk: 72,
      rumorExposure: 66,
      publicTrust: 46,
      narrativeControl: 44,
    },
    create: {
      id: "ing-rr-rumor-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      publicTrust: 46,
      suspicionLoad: 62,
      scandalRisk: 72,
      narrativeControl: 44,
      rumorExposure: 66,
      vulnerableNarratives: { house_honor: "fragile", desire: "half_said_only" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterMentalHealthProfile.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      vigilanceLevel: 70,
      stressTolerance: 48,
      intrusiveThoughtLoad: 46,
    },
    create: {
      id: "ing-rr-mh-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      attentionStability: 52,
      clarityLevel: 50,
      intrusiveThoughtLoad: 46,
      dissociationTendency: 36,
      vigilanceLevel: 70,
      despairLoad: 40,
      controlCompulsion: 54,
      moodInstability: 42,
      stressTolerance: 48,
      realityCoherence: 60,
      notes: "Regulation load for Stage 7 / 8.5 — not diagnosis.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterLearningEnvelope.upsert({
    where: { personId_worldStateId: { personId: FOCAL, worldStateId: WS09 } },
    update: {
      pressureDistortion: 56,
      socialRiskAdjustedDisclosure: 38,
      summary: { packet: "red_river", note: "Pressure → guarded narrowing; partial disclosure trained." },
    },
    create: {
      id: "ing-rr-cle-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      trainedCapacity: 52,
      expressiveCapacity: 40,
      pressureDistortion: 56,
      learnedAvoidance: 54,
      socialRiskAdjustedDisclosure: 38,
      summary: { packet: "red_river", note: "Pressure → guarded narrowing; partial disclosure trained." },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  // --- Counterpart × WS-09 (Elaya) — Packet 03: mirror Asha stack for two-sided bundles / admin ---
  await prisma.characterGovernanceImpact.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      allowedExpressionRange: 44,
      suppressionLevel: 60,
      punishmentRisk: 54,
      notes: "Traveling trade-network role — slightly wider public maneuver than house-heir; still kin-accountable.",
    },
    create: {
      id: "ing-rr-cgi-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      allowedExpressionRange: 44,
      suppressionLevel: 60,
      punishmentRisk: 54,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterSocioEconomicProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      statusPosition: StatusPosition.MID,
      survivalPressure: 54,
      resourceAccess: 56,
      perceivedValue: "Trade liaison / kin-embedded negotiator — credible in public, flexible at landings.",
    },
    create: {
      id: "ing-rr-csep-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      statusPosition: StatusPosition.MID,
      resourceAccess: 56,
      roleExpectation: 58,
      mobilityPotential: 58,
      dependencyLevel: 50,
      survivalPressure: 54,
      privilegeFactor: 50,
      perceivedValue: "Trade liaison / kin-embedded negotiator — credible in public, flexible at landings.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterDemographicProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      inclusionLevel: 54,
      riskExposure: 58,
      vigilanceLevel: 66,
      selfPerception: SelfPerceptionState.CONDITIONAL,
    },
    create: {
      id: "ing-rr-cdp-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      statusValue: 5,
      trustBias: -4,
      inclusionLevel: 54,
      riskExposure: 58,
      privilegeModifier: 42,
      mobilityModifier: 52,
      punishmentRiskModifier: 52,
      belongingSense: 56,
      identityCohesion: 58,
      vigilanceLevel: 66,
      selfPerception: SelfPerceptionState.CONDITIONAL,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterFamilyPressureProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      obligationPressure: 58,
      emotionalExpressionRange: 42,
      loyaltyExpectation: 64,
    },
    create: {
      id: "ing-rr-cfpp-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      attachmentStrength: 56,
      obligationPressure: 58,
      emotionalExpressionRange: 42,
      individualFreedom: 46,
      loyaltyExpectation: 64,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterIntelligenceProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      patternRecognition: 68,
      socialInference: 74,
      environmentalInference: 64,
      selfReflectionDepth: 52,
      expressionComplexity: 52,
      notes:
        "Reads micro-signals and alliance subtext fast; calibrated for reciprocity — misread: overweights her own signaling clarity to Asha when the bank is loud.",
    },
    create: {
      id: "ing-rr-cip-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      patternRecognition: 68,
      workingMemory: 54,
      abstractionCapacity: 50,
      socialInference: 74,
      environmentalInference: 64,
      selfReflectionDepth: 52,
      impulseControl: 60,
      planningHorizon: 54,
      metacognition: 56,
      memoryStrength: 56,
      expressionComplexity: 52,
      notes:
        "Reads micro-signals and alliance subtext fast; calibrated for reciprocity — misread: overweights her own signaling clarity to Asha when the bank is loud.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterMaskingProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      maskingIntensity: 58,
      codeSwitchingLoad: 54,
      secrecyNeed: 52,
      disclosureRisk: 56,
      publicMask: { role: "trade_network_kin_embedded", public_deportment: "respectable_alliance_surface" },
      trustedCircleExpression: { with_asha_off_stage: "more_direct_than_bank" },
      notes: "Packet 03: counterpart stack — witness pressure; aligns with dyad disclosure profile.",
    },
    create: {
      id: "ing-rr-mask-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      maskingIntensity: 58,
      codeSwitchingLoad: 54,
      secrecyNeed: 52,
      disclosureRisk: 56,
      authenticPrivateSelf: { voice: "warm_measured", stake: "alliance_and_desire_braided" },
      publicMask: { role: "trade_network_kin_embedded", public_deportment: "respectable_alliance_surface" },
      trustedCircleExpression: { with_asha_off_stage: "more_direct_than_bank" },
      notes: "Packet 03: counterpart stack — witness pressure; aligns with dyad disclosure profile.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterDesireProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      desireSuppression: 54,
      tabooExposureRisk: 58,
      intimacyNeed: 56,
      desireVisibility: 42,
    },
    create: {
      id: "ing-rr-desire-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      attachmentStyle: AttachmentStyle.DUTY_BOUND,
      desireVisibility: 42,
      desireSuppression: 54,
      jealousySensitivity: 48,
      intimacyNeed: 56,
      autonomyNeed: 48,
      tabooExposureRisk: 58,
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterEducationProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      literacyLevel: 30,
      institutionalSchoolingAccess: 24,
      oralTraditionDepth: 66,
      languageExposure: { primary: "caddoan_network_oral", secondary: "wider_trade_corridor_contact" },
    },
    create: {
      id: "ing-rr-edu-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      primaryTrainingMode: TrainingMode.HOUSEHOLD_TRAINING,
      literacyLevel: 30,
      numeracyLevel: 48,
      oralTraditionDepth: 66,
      ecologicalKnowledgeDepth: 54,
      institutionalSchoolingAccess: 24,
      apprenticeshipDomains: { trade: "route_and_counterparty_read", river: "landing_etiquette" },
      religiousInstructionDepth: 46,
      strategicTrainingDepth: 52,
      historicalAwarenessRange: 50,
      languageExposure: { primary: "caddoan_network_oral", secondary: "wider_trade_corridor_contact" },
      notes: "Era scaffold — not census.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterTraumaProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      traumaLoad: 38,
      hypervigilanceLoad: 58,
      silenceLoad: 48,
      triggerPatterns: { crowd: "signal_discipline", misread_by_asha: "retreat_to_mask" },
    },
    create: {
      id: "ing-rr-trauma-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      traumaLoad: 38,
      silenceLoad: 48,
      hypervigilanceLoad: 58,
      shameResidue: 52,
      griefResidue: 42,
      bodyMemory: { river_noise: "scan_for_elders", posture: "open_but_guarded" },
      triggerPatterns: { crowd: "signal_discipline", misread_by_asha: "retreat_to_mask" },
      copingPatterns: { public: "reciprocal_implication", private: "plain_reciprocity" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterConsequenceMemoryProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      punishmentMemory: 50,
      learnedRules: {
        public_speech: "coded_default",
        witness: "tenderness_becomes_leverage_if_named",
      },
    },
    create: {
      id: "ing-rr-conseq-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      punishmentMemory: 50,
      protectionMemory: 48,
      betrayalMemory: 38,
      rewardConditioning: 46,
      exposureLearning: 52,
      learnedRules: {
        public_speech: "coded_default",
        witness: "tenderness_becomes_leverage_if_named",
      },
      avoidancePatterns: { spectacle_with_asha: "avoid" },
      reinforcementPatterns: { matched_implication: "safer" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterRumorReputationProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      suspicionLoad: 58,
      scandalRisk: 68,
      rumorExposure: 62,
      publicTrust: 50,
      narrativeControl: 48,
    },
    create: {
      id: "ing-rr-rumor-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      publicTrust: 50,
      suspicionLoad: 58,
      scandalRisk: 68,
      narrativeControl: 48,
      rumorExposure: 62,
      vulnerableNarratives: { alliance_stability: "watch_topic", desire: "never_named_in_crowd" },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterMentalHealthProfile.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      vigilanceLevel: 64,
      stressTolerance: 52,
      intrusiveThoughtLoad: 44,
    },
    create: {
      id: "ing-rr-mh-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      attentionStability: 54,
      clarityLevel: 52,
      intrusiveThoughtLoad: 44,
      dissociationTendency: 34,
      vigilanceLevel: 64,
      despairLoad: 36,
      controlCompulsion: 50,
      moodInstability: 40,
      stressTolerance: 52,
      realityCoherence: 62,
      notes: "Regulation load for Stage 7 / 8.5 — not diagnosis.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterLearningEnvelope.upsert({
    where: { personId_worldStateId: { personId: COUNTERPART, worldStateId: WS09 } },
    update: {
      pressureDistortion: 52,
      socialRiskAdjustedDisclosure: 44,
      summary: {
        packet: "red_river_packet03",
        note: "Reciprocal calibration with Asha — temptation to answer plainly vs restraint on the bank.",
      },
    },
    create: {
      id: "ing-rr-cle-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      trainedCapacity: 54,
      expressiveCapacity: 44,
      pressureDistortion: 52,
      learnedAvoidance: 50,
      socialRiskAdjustedDisclosure: 44,
      summary: {
        packet: "red_river_packet03",
        note: "Reciprocal calibration with Asha — temptation to answer plainly vs restraint on the bank.",
      },
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.relationshipProfile.upsert({
    where: {
      personAId_personBId_worldStateId: {
        personAId: dyadPair.personAId,
        personBId: dyadPair.personBId,
        worldStateId: WS09,
      },
    },
    update: {
      relationshipType: RelationshipType.ALLIANCE,
      publicStatus: PublicStatus.IMPLIED,
      privateStatus:
        "bond: trade-house alliance with emotional recognition; publicly legible as respectable tie, not as open romantic confession",
      trustLevel: 57,
      fearLevel: 52,
      shameLeverage: 58,
      obligationWeight: 64,
      betrayalThreshold: 46,
      rescueThreshold: 54,
      hiddenTruth: {
        costly_disclosure: "direct naming of desire or wound in earshot of non-kin",
        safe_implication: "river-and-kin coded invitations; half-spoken assent",
        unstable_openness: "fluent vulnerable monologue under crowd strain",
        masking_under_public_pressure: "neutral face; eyes timed to passing elders",
        what_can_be_hinted: ["trade_and_route_coded_affect", "half_spoken_assent", "river_metaphor_invitation"],
        what_cannot_be_named_publicly: ["romantic_claim_aloud", "open_accusation", "full_confession_to_crowd"],
        dangerous_when_witnessed: ["tenderness_read_as_spectacle", "desire_turns_reputational_leverage"],
        safe_harbor_surface: "partial_in_trusted_dyad_off_public_stage_not_on_open_bank",
      },
      powerDirection: {
        public_stage: "house_heads_and_crowd",
        dyad: "near_parity_private",
        network: "tolerated_as_alliance_if_coded_precarious_if_named",
      },
      dependencyDirection: { trade_reputation: "mutual", kin_scrutiny: "asymmetric_on_asha_house_line" },
      notes:
        "Packet 02: shameLeverage 58 — engine marks dyad readsAsUnsafe + lists counterpart among unsafePeople under witness logic; trust stays below safe-harbor (58) so readsAsSafe false. Disclosure nuance in RelationshipDisclosureProfile JSON.",
      certainty: "ingestion_red_river_packet02",
    },
    create: {
      id: ASHA_ELAYA_RP_ID,
      personAId: dyadPair.personAId,
      personBId: dyadPair.personBId,
      worldStateId: WS09,
      relationshipType: RelationshipType.ALLIANCE,
      publicStatus: PublicStatus.IMPLIED,
      privateStatus:
        "bond: trade-house alliance with emotional recognition; publicly legible as respectable tie, not as open romantic confession",
      trustLevel: 57,
      fearLevel: 52,
      shameLeverage: 58,
      obligationWeight: 64,
      betrayalThreshold: 46,
      rescueThreshold: 54,
      hiddenTruth: {
        costly_disclosure: "direct naming of desire or wound in earshot of non-kin",
        safe_implication: "river-and-kin coded invitations; half-spoken assent",
        unstable_openness: "fluent vulnerable monologue under crowd strain",
        masking_under_public_pressure: "neutral face; eyes timed to passing elders",
        what_can_be_hinted: ["trade_and_route_coded_affect", "half_spoken_assent", "river_metaphor_invitation"],
        what_cannot_be_named_publicly: ["romantic_claim_aloud", "open_accusation", "full_confession_to_crowd"],
        dangerous_when_witnessed: ["tenderness_read_as_spectacle", "desire_turns_reputational_leverage"],
        safe_harbor_surface: "partial_in_trusted_dyad_off_public_stage_not_on_open_bank",
      },
      powerDirection: {
        public_stage: "house_heads_and_crowd",
        dyad: "near_parity_private",
        network: "tolerated_as_alliance_if_coded_precarious_if_named",
      },
      dependencyDirection: { trade_reputation: "mutual", kin_scrutiny: "asymmetric_on_asha_house_line" },
      notes:
        "Packet 02: shameLeverage 58 — engine marks dyad readsAsUnsafe + lists counterpart among unsafePeople under witness logic; trust stays below safe-harbor (58) so readsAsSafe false. Disclosure nuance in RelationshipDisclosureProfile JSON.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet02",
    },
  });

  await prisma.relationshipDynamicState.upsert({
    where: { id: "ing-rr-rdyn-asha-elaya-ws09" },
    update: {
      emotionalTemperature: 58,
      volatility: 46,
      intimacyLevel: 60,
      conflictLoad: 44,
      mutualRecognition: 62,
      disclosureSafety: 42,
      currentTensions: {
        public_legibility: "trade_alliance_okay_romantic_truth_not",
        riverbank_scene: "witness_density_high",
      },
      currentNeeds: {
        asha: "clarity_without_spectacle",
        elaya: "signal_reciprocity_without_naming",
      },
      notes: "Public beat — disclosureSafety lags intimacyLevel when visibility spikes.",
      certainty: "ingestion_red_river_packet02",
    },
    create: {
      id: "ing-rr-rdyn-asha-elaya-ws09",
      relationshipProfileId: ASHA_ELAYA_RP_ID,
      label: "riverbank_public_beat",
      emotionalTemperature: 58,
      volatility: 46,
      intimacyLevel: 60,
      conflictLoad: 44,
      mutualRecognition: 62,
      disclosureSafety: 42,
      currentTensions: {
        public_legibility: "trade_alliance_okay_romantic_truth_not",
        riverbank_scene: "witness_density_high",
      },
      currentNeeds: {
        asha: "clarity_without_spectacle",
        elaya: "signal_reciprocity_without_naming",
      },
      notes: "Public beat — disclosureSafety lags intimacyLevel when visibility spikes.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet02",
    },
  });

  await prisma.relationshipDisclosureProfile.upsert({
    where: {
      relationshipProfileId_worldStateId: {
        relationshipProfileId: ASHA_ELAYA_RP_ID,
        worldStateId: WS09,
      },
    },
    update: {
      truthShareCapacity: 52,
      emotionalDisclosureCapacity: 48,
      secrecyBurden: 58,
      misrecognitionRisk: 52,
      exposureConsequence: 72,
      safeTopics: {
        trade_and_river_conditions: true,
        kin_greetings: true,
        indirect_affection: "tone_gaze_only_public",
        private_halting_truth: "only_off_stage_or_deep_trust_window",
      },
      unsafeTopics: {
        witnessable_confession: true,
        naming_romantic_claim_in_crowd: true,
        open_accusation_or_humiliation: true,
        unguarded_tenderness_when_bystanders_can_parse: true,
      },
      codedChannels: {
        implication: "high",
        river_metaphor: "high",
        silence_paired_with_gaze: true,
        defer_to_elders_cue: "high",
        timed_withdrawal_to_cargo_shadow: "medium",
      },
      notes:
        "Structured disclosure logic for Stage 7.5 / 8: hint-heavy public surface; naming turns costly; witnessed vulnerability escalates shame leverage (align claim `ing-rr-claim-dyad-witness-leverage`).",
      certainty: "ingestion_red_river_packet02",
    },
    create: {
      id: "ing-rr-rdisc-asha-elaya-ws09",
      relationshipProfileId: ASHA_ELAYA_RP_ID,
      worldStateId: WS09,
      truthShareCapacity: 52,
      emotionalDisclosureCapacity: 48,
      secrecyBurden: 58,
      misrecognitionRisk: 52,
      exposureConsequence: 72,
      safeTopics: {
        trade_and_river_conditions: true,
        kin_greetings: true,
        indirect_affection: "tone_gaze_only_public",
        private_halting_truth: "only_off_stage_or_deep_trust_window",
      },
      unsafeTopics: {
        witnessable_confession: true,
        naming_romantic_claim_in_crowd: true,
        open_accusation_or_humiliation: true,
        unguarded_tenderness_when_bystanders_can_parse: true,
      },
      codedChannels: {
        implication: "high",
        river_metaphor: "high",
        silence_paired_with_gaze: true,
        defer_to_elders_cue: "high",
        timed_withdrawal_to_cargo_shadow: "medium",
      },
      notes:
        "Structured disclosure logic for Stage 7.5 / 8: hint-heavy public surface; naming turns costly; witnessed vulnerability escalates shame leverage.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet02",
    },
  });

  await prisma.relationshipNetworkSummary.upsert({
    where: { id: "ing-rr-net-asha-ws09" },
    update: {
      keyBonds: {
        trade_network: [COUNTERPART],
        kin: "high_expectation",
        dyad_asha_elaya: "alliance_implied_emotionally_salient",
      },
      primaryTensions: {
        truth_vs_house_face: "acute_on_riverbank",
        disclosure_channel: "implication_public_versus_naming",
      },
      notes:
        "Elaya is counterpart in scene `ing-rr-scene-riverbank-disclosure`; dyad row `ing-rr-rp-asha-elaya-ws09` drives counterpart context.",
      certainty: "ingestion_red_river_packet02",
    },
    create: {
      id: "ing-rr-net-asha-ws09",
      personId: FOCAL,
      worldStateId: WS09,
      keyBonds: {
        trade_network: [COUNTERPART],
        kin: "high_expectation",
        dyad_asha_elaya: "alliance_implied_emotionally_salient",
      },
      primaryTensions: {
        truth_vs_house_face: "acute_on_riverbank",
        disclosure_channel: "implication_public_versus_naming",
      },
      notes:
        "Elaya is counterpart in scene `ing-rr-scene-riverbank-disclosure`; dyad row `ing-rr-rp-asha-elaya-ws09` drives counterpart context.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet02",
    },
  });

  await prisma.relationshipNetworkSummary.upsert({
    where: { id: "ing-rr-net-elaya-ws09" },
    update: {
      keyBonds: {
        trade_network: [FOCAL],
        dyad_asha_elaya: "alliance_implied_emotionally_salient",
        asha_interpretation:
          "house-bound_heir_high_stakes_face; Elaya reads her as worth reciprocal protection — cannot answer spectacle without shaming Asha's line",
      },
      primaryTensions: {
        reciprocity_vs_public_mask: "active",
        disclosure_channel: "signal_without_witnessable_naming",
        temptation_vs_restraint: "answer_plainly_vs_hold_implication",
      },
      trustMap: { toward_asha: "high_private_trust_public_constraint" },
      notes:
        "Packet 03: Elaya-side rollup — relationship to Asha is reciprocal cognition, not backdrop; dyad `ing-rr-rp-asha-elaya-ws09`.",
      certainty: "ingestion_red_river_packet03",
    },
    create: {
      id: "ing-rr-net-elaya-ws09",
      personId: COUNTERPART,
      worldStateId: WS09,
      keyBonds: {
        trade_network: [FOCAL],
        dyad_asha_elaya: "alliance_implied_emotionally_salient",
        asha_interpretation:
          "house-bound_heir_high_stakes_face; Elaya reads her as worth reciprocal protection — cannot answer spectacle without shaming Asha's line",
      },
      primaryTensions: {
        reciprocity_vs_public_mask: "active",
        disclosure_channel: "signal_without_witnessable_naming",
        temptation_vs_restraint: "answer_plainly_vs_hold_implication",
      },
      trustMap: { toward_asha: "high_private_trust_public_constraint" },
      notes:
        "Packet 03: Elaya-side rollup — relationship to Asha is reciprocal cognition, not backdrop; dyad `ing-rr-rp-asha-elaya-ws09`.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet03",
    },
  });

  await prisma.characterRelationship.upsert({
    where: {
      personAId_personBId: { personAId: dyadPair.personAId, personBId: dyadPair.personBId },
    },
    update: {
      relationshipType: "trade_alliance_intimate_subtext",
      relationshipSummary:
        "Kin-embedded trade alliance with reciprocal recognition; publicly legible as respectable tie — affection travels by implication, not crowd-facing naming.",
      emotionalPattern: "attunement_high_expression_narrow_in_crowd",
      conflictPattern: "pressure_when_witness_interprets_tenderness_as_claim_or_spectacle",
      attachmentPattern: "duty_and_desire_braided",
      powerDynamic: "near_parity_dyad_asha_house_line_raises_public_stakes",
      confidence: 3,
      notes:
        "Interpretive row — runtime dyad uses RelationshipProfile `ing-rr-rp-asha-elaya-ws09`. Packet 03: Elaya’s read of Asha is high-trust off-stage / constraint-on-bank (see `ing-rr-net-elaya-ws09`).",
    },
    create: {
      id: "ing-rr-charrel-asha-elaya",
      personAId: dyadPair.personAId,
      personBId: dyadPair.personBId,
      relationshipType: "trade_alliance_intimate_subtext",
      relationshipSummary:
        "Kin-embedded trade alliance with reciprocal recognition; publicly legible as respectable tie — affection travels by implication, not crowd-facing naming.",
      emotionalPattern: "attunement_high_expression_narrow_in_crowd",
      conflictPattern: "pressure_when_witness_interprets_tenderness_as_claim_or_spectacle",
      attachmentPattern: "duty_and_desire_braided",
      powerDynamic: "near_parity_dyad_asha_house_line_raises_public_stakes",
      confidence: 3,
      notes:
        "Interpretive row — runtime dyad uses RelationshipProfile `ing-rr-rp-asha-elaya-ws09`. Packet 03: Elaya’s read of Asha is high-trust off-stage / constraint-on-bank (see `ing-rr-net-elaya-ws09`).",
    },
  });

  const structuredPatch = {
    counterpartPersonId: COUNTERPART,
    sceneClass: "intimate_disclosure" as const,
    revealBudgetScore: 42,
    socialExposureScore: 62,
    objective: "Clarify emotional truth without causing public shame",
    pressureTags: ["public", "reputation", "relational-risk", "visibility-dense", "transit-heavy", "overhearing"],
    visibilityLegibility:
      "Riverbank crowded with trade and kin — overlapping talk, water noise, visible postures; peripheral listeners plausible; intimacy must stay off the public stage.",
  };

  await prisma.chapter.upsert({
    where: { id: CHAPTER_ID },
    update: {
      bookId: DEFAULT_BOOK_ID,
      title: "Red River Trade Era — Riverbank disclosure (WS-09)",
      summary: "Public intimate disclosure beat: Asha and a trade-network tie at the busy landing.",
    },
    create: {
      id: CHAPTER_ID,
      bookId: DEFAULT_BOOK_ID,
      sequenceInBook: 902,
      title: "Red River Trade Era — Riverbank disclosure (WS-09)",
      chapterNumber: 902,
      summary: "Public intimate disclosure beat: Asha and a trade-network tie at the busy landing.",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      status: "scaffold",
      privateNotes: "Synthetic chapter for pipeline testing — Red River vertical slice.",
    },
  });

  await prisma.scene.upsert({
    where: { id: SCENE_ID },
    update: {
      description:
        "The Riverbank Disclosure — Asha stands with Elaya at a busy landing; goods move; voices overlap. Neutral surface, rising tension. She wants clarity on a private feeling; the crowd makes direct speech dangerous.",
      summary:
        "Intimate_disclosure × PUBLIC: indirect invitation, guarded focal speech, risk of house shame if she names the truth aloud.",
      narrativeIntent:
        "Exercise Stage 7–8.5: pressure map (public + relational), perception (high visibility, layered signals), outcome envelope (spectacle blocked; implication allowed).",
      emotionalTone: "tight_calm_surface",
      visibility: VisibilityStatus.PUBLIC,
      structuredDataJson: structuredPatch,
      historicalConfidence: 3,
      sourceTraceSummary:
        "Packet 02–04: sources `ing-rr-source-curated` (+ claims `ing-rr-claim-dyad-witness-leverage`, `ing-rr-claim-riverbank-perception-load`), `ing-rr-source-tsha-caddo-handbook`; dyad `ing-rr-rp-asha-elaya-ws09`; char-rel `ing-rr-charrel-asha-elaya`; place `seed-place-rr-busy-riverbank`; risk `ing-rr-risk-landing-social-surveillance`; scene CS `ing-rr-cs-asha-ws09-scene` + `ing-rr-cs-elaya-ws09-scene` (focal alternation) — prose beat still synthetic.",
      sceneStatus: "scaffold",
    },
    create: {
      id: SCENE_ID,
      chapterId: CHAPTER_ID,
      description:
        "The Riverbank Disclosure — Asha stands with Elaya at a busy landing; goods move; voices overlap. Neutral surface, rising tension. She wants clarity on a private feeling; the crowd makes direct speech dangerous.",
      summary:
        "Intimate_disclosure × PUBLIC: indirect invitation, guarded focal speech, risk of house shame if she names the truth aloud.",
      narrativeIntent:
        "Exercise Stage 7–8.5: pressure map (public + relational), perception (high visibility, layered signals), outcome envelope (spectacle blocked; implication allowed).",
      emotionalTone: "tight_calm_surface",
      writingMode: WritingMode.STRUCTURED,
      orderInChapter: 1,
      sceneNumber: 1,
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
      structuredDataJson: structuredPatch,
      historicalConfidence: 3,
      sourceTraceSummary:
        "Packet 02–04: sources `ing-rr-source-curated` (+ claims `ing-rr-claim-dyad-witness-leverage`, `ing-rr-claim-riverbank-perception-load`), `ing-rr-source-tsha-caddo-handbook`; dyad `ing-rr-rp-asha-elaya-ws09`; char-rel `ing-rr-charrel-asha-elaya`; place `seed-place-rr-busy-riverbank`; risk `ing-rr-risk-landing-social-surveillance`; scene CS `ing-rr-cs-asha-ws09-scene` + `ing-rr-cs-elaya-ws09-scene` (focal alternation) — prose beat still synthetic.",
      sceneStatus: "scaffold",
    },
  });

  await prisma.scene.update({
    where: { id: SCENE_ID },
    data: {
      persons: { set: [{ id: FOCAL }, { id: COUNTERPART }] },
      places: { set: [{ id: PLACE_ID }] },
      sources: { connect: [{ id: SOURCE_ID }, { id: SOURCE_TSHA_ID }] },
    },
  });

  await prisma.characterState.upsert({
    where: { id: CS_ID },
    update: {
      worldStateId: WS09,
      sceneId: SCENE_ID,
      label: "ingestion_red_river_focal",
      emotionalBaseline: "controlled",
      trustLevel: 48,
      fearLevel: 58,
      stabilityLevel: 46,
      cognitiveLoad: 60,
      emotionalState: "longing_and_fear_mix",
      motivation: "clarify_emotional_truth_without_house_shame",
      fearState: "being_overheard",
      socialConstraint: "public_indirection_only",
      notes: "Scene-scoped state — guarded narrowing under riverbank visibility.",
      certainty: "ingestion_red_river",
    },
    create: {
      id: CS_ID,
      personId: FOCAL,
      worldStateId: WS09,
      sceneId: SCENE_ID,
      label: "ingestion_red_river_focal",
      emotionalBaseline: "controlled",
      trustLevel: 48,
      fearLevel: 58,
      stabilityLevel: 46,
      cognitiveLoad: 60,
      emotionalState: "longing_and_fear_mix",
      motivation: "clarify_emotional_truth_without_house_shame",
      fearState: "being_overheard",
      socialConstraint: "public_indirection_only",
      notes: "Scene-scoped state — guarded narrowing under riverbank visibility.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river",
    },
  });

  await prisma.characterState.upsert({
    where: { id: CS_ELAYA_ID },
    update: {
      worldStateId: WS09,
      sceneId: SCENE_ID,
      label: "ingestion_red_river_focal_elaya",
      emotionalBaseline: "controlled_warm",
      trustLevel: 52,
      fearLevel: 54,
      stabilityLevel: 50,
      cognitiveLoad: 56,
      emotionalState: "reciprocity_pull_under_witness",
      motivation: "return_signal_to_asha_without_forcing_public_naming",
      fearState: "misstep_shames_asha_or_becomes_spectacle",
      socialConstraint: "coded_reciprocity_on_open_bank",
      notes:
        "Packet 04: Elaya-as-focal scene state — complements Asha CS; workspace focal=seed-person-elaya for A/B with focal=seed-person-asha.",
      certainty: "ingestion_red_river_packet04",
    },
    create: {
      id: CS_ELAYA_ID,
      personId: COUNTERPART,
      worldStateId: WS09,
      sceneId: SCENE_ID,
      label: "ingestion_red_river_focal_elaya",
      emotionalBaseline: "controlled_warm",
      trustLevel: 52,
      fearLevel: 54,
      stabilityLevel: 50,
      cognitiveLoad: 56,
      emotionalState: "reciprocity_pull_under_witness",
      motivation: "return_signal_to_asha_without_forcing_public_naming",
      fearState: "misstep_shames_asha_or_becomes_spectacle",
      socialConstraint: "coded_reciprocity_on_open_bank",
      notes:
        "Packet 04: Elaya-as-focal scene state — complements Asha CS; workspace focal=seed-person-elaya for A/B with focal=seed-person-asha.",
      recordType: RecordType.HYBRID,
      visibility: VisibilityStatus.PUBLIC,
      certainty: "ingestion_red_river_packet04",
    },
  });
}
