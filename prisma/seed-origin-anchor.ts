import type { PrismaClient } from "@prisma/client";
import { EnneagramType, FragmentType, PlaceType, RecordType, SourceType, VisibilityStatus } from "@prisma/client";
import { FRAGMENT_DECOMPOSITION_VERSION } from "../lib/fragment-constants";

/**
 * Phase 9A.1 — Origin world anchor: Grande Terre, days before the attack.
 * Idempotent: safe to re-run; clears seed fragment links/candidates/insights before upserting those rows.
 */
export async function seedOriginWorldAnchor(prisma: PrismaClient) {
  const SOURCE_ID = "seed-source-francois-grappe-excerpt";
  const PERSON_MARIE = "seed-person-marie-anne-grande-terre";
  const PERSON_CHILD = "seed-person-child-grande-terre-pov";
  const PERSON_LOUISE = "seed-person-louise-guedon";
  const PERSON_FRANCOIS = "seed-person-francois";
  const PLACE_GT = "seed-place-grande-terre-homeland";
  const META_SCENE_ID = "seed-meta-grande-terre-3-days";

  const MEM_IDS = {
    river: "seed-cm-marie-river-trail",
    women: "seed-cm-marie-womens-rhythm",
    trade: "seed-cm-marie-trade-route",
    unease: "seed-cm-marie-outer-unease",
  } as const;

  const SETTING_STATE_LATE_SUMMER = "seed-setting-state-gt-late-summer";
  const SETTING_STATE_PRE_ATTACK = "seed-setting-state-gt-pre-attack";

  const FRAGMENT_IDS = [
    "seed-frag-gt-smoke-morning",
    "seed-frag-gt-trade-artery",
    "seed-frag-gt-elder-women-continuity",
    "seed-frag-gt-child-certainty",
    "seed-frag-gt-river-trail-embodied",
    "seed-frag-gt-adult-unease",
    "seed-frag-gt-women-carry-names",
    "seed-frag-gt-peace-before-destruction",
    "seed-frag-gt-maternal-order",
    "seed-frag-gt-francois-research-bridge",
  ] as const;

  const researchExcerpt = `Research excerpt (Dayna Bowker Lee, François Grappe and the Caddo Land Cession — summarized for narrative use; not a legal or tribal certification).

François Grappe is described as born in 1747 near the French–Caddo post in the country of present-day Texarkana, within networks of trade, diplomacy, and kinship that linked Caddo communities to imperial frontiers. His parents appear in the documentary trail as Alexis Grappe and Louise Marguerite Guédon; François was educated in part by Alexis and was embedded in Caddo communities while also moving through French, Spanish, and later United States administrative systems as a multilingual broker and interpreter. The research frames him as a mixed French–Indigenous frontier figure active in land-cession contexts and reciprocal relationships across colonial boundaries.

Later family movement toward the Campti area after Alexis’s relocation from the post is part of the genealogical bridge the novel uses — but Indigenous ancestry lines, formal titles, and undocumented kin ties should be treated as working hypotheses wherever records are silent or contested. This excerpt is a support layer for continuity, not a single certainty layer.`;

  await prisma.source.upsert({
    where: { id: SOURCE_ID },
    update: {
      title: "François Grappe and the Caddo Land Cession – Dayna Bowker Lee excerpt",
      summary:
        "Research excerpt describing François Grappe as a mixed French-Indigenous frontier figure born in 1747 near the Caddo post by present-day Texarkana, educated by Alexis Grappe, embedded with Caddo communities, and active across French, Spanish, and later U.S. frontier systems.",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      archiveStatus: "reviewed",
      ingestionReady: false,
      authorOrOrigin: "Dayna Bowker Lee (excerpt; author workspace)",
    },
    create: {
      id: SOURCE_ID,
      title: "François Grappe and the Caddo Land Cession – Dayna Bowker Lee excerpt",
      summary:
        "Research excerpt describing François Grappe as a mixed French-Indigenous frontier figure born in 1747 near the Caddo post by present-day Texarkana, educated by Alexis Grappe, embedded with Caddo communities, and active across French, Spanish, and later U.S. frontier systems.",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      archiveStatus: "reviewed",
      ingestionReady: false,
      authorOrOrigin: "Dayna Bowker Lee (excerpt; author workspace)",
    },
  });

  await prisma.sourceText.upsert({
    where: { sourceId: SOURCE_ID },
    update: {
      rawText: researchExcerpt,
      textStatus: "imported",
      textNotes: "Private research excerpt. Ingestion intentionally off (ingestionReady: false). Do not auto-extract.",
    },
    create: {
      sourceId: SOURCE_ID,
      rawText: researchExcerpt,
      textStatus: "imported",
      textNotes: "Private research excerpt. Ingestion intentionally off (ingestionReady: false). Do not auto-extract.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_MARIE },
    update: {
      name: "Marie Anne Thérèse de la Grande Terre",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description:
        "Origin matriarchal anchor for the opening world — inferred social position; formal title and exact role in community governance intentionally left ambiguous.",
      sourceTraceNote: "Fictional–historical hybrid; not a claim of documentary identity.",
    },
    create: {
      id: PERSON_MARIE,
      name: "Marie Anne Thérèse de la Grande Terre",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description:
        "Origin matriarchal anchor for the opening world — inferred social position; formal title and exact role in community governance intentionally left ambiguous.",
      sourceTraceNote: "Fictional–historical hybrid; not a claim of documentary identity.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_CHILD },
    update: {
      name: "Child POV — Grande Terre (opening)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
      description: "Narrative POV vehicle for pre-attack innocence and sensory immersion; not a historical individual.",
    },
    create: {
      id: PERSON_CHILD,
      name: "Child POV — Grande Terre (opening)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
      description: "Narrative POV vehicle for pre-attack innocence and sensory immersion; not a historical individual.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_LOUISE },
    update: {
      name: "Louise Marguerite Guédon",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description: "Genealogical bridge figure in the François Grappe research line; documentary presence varies — treat as hypothesis where records thin.",
      birthYear: null,
    },
    create: {
      id: PERSON_LOUISE,
      name: "Louise Marguerite Guédon",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description: "Genealogical bridge figure in the François Grappe research line; documentary presence varies — treat as hypothesis where records thin.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_FRANCOIS },
    update: {},
    create: {
      id: PERSON_FRANCOIS,
      name: "François Grappe",
      visibility: VisibilityStatus.PUBLIC,
      recordType: RecordType.HYBRID,
    },
  });

  await prisma.place.upsert({
    where: { id: PLACE_GT },
    update: {
      name: "Grande Terre Homeland Zone",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      placeType: PlaceType.REGION,
      description:
        "Trade-route homeland / village zone before rupture — composite setting for early-contact rhythm (not a single surveyed parcel).",
      sourceTraceNote: "Naming and boundaries partly inferential; anchor is experiential and narrative.",
    },
    create: {
      id: PLACE_GT,
      name: "Grande Terre Homeland Zone",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      placeType: PlaceType.REGION,
      description:
        "Trade-route homeland / village zone before rupture — composite setting for early-contact rhythm (not a single surveyed parcel).",
      sourceTraceNote: "Naming and boundaries partly inferential; anchor is experiential and narrative.",
    },
  });

  await prisma.source.update({
    where: { id: SOURCE_ID },
    data: {
      persons: {
        connect: [{ id: PERSON_FRANCOIS }, { id: PERSON_LOUISE }],
      },
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: PERSON_MARIE },
    update: {
      worldview:
        "Rooted in kinship, land, continuity, and lived trade relationships — the world holds because people hold each other to it.",
      coreBeliefs:
        "The world is relational. Survival depends on memory, lineage, and reciprocal obligation — not on paper or distant decrees.",
      fears:
        "Disruption of kinship lines; violent incursion; loss of daughters to chaos or capture; collapse of the order that keeps children safe.",
      desires:
        "Continuity, safety, transmission of culture, preservation of dignity and belonging for those who come after.",
      internalConflicts:
        "How to survive inside a changing world without surrendering what makes a people themselves — adaptation without self-erasure.",
      socialPosition:
        "High-status or lineage-bearing woman within a Native community structure; exact formal title unknown — preserve ambiguity.",
      educationLevel:
        "Deep oral, environmental, social, and ceremonial knowledge — intelligence measured by responsibility and recall, not schooling.",
      religiousContext:
        "Indigenous spiritual world (land, ancestors, seasonal obligation) prior to or in tension with colonial Christian overlay — do not flatten into one register.",
      emotionalBaseline: "Observant, controlled, protective.",
      behavioralPatterns:
        "Reads mood shifts quickly; notices subtle threats at the edge of camp; leads quietly rather than performing authority.",
      speechPatterns: "Economical, metaphor-rich, direct when the moment demands plainness.",
      memoryBias:
        "Family continuity and land memory prioritized over written or legal framing — documents are tools of outsiders.",
      sensoryBias:
        "Highly attuned to smoke, water, footpaths, rhythm, weather, and communal sound — the world announces itself bodily.",
      moralFramework: "Obligation to people over empire.",
      contradictions: "Adaptable but rooted; strategic but emotionally bound to place.",
      notes:
        "Ambiguity around exact titles and formal tribal role is intentional. This profile is a narrative-world anchor, not a certificate of identity.",
    },
    create: {
      personId: PERSON_MARIE,
      worldview:
        "Rooted in kinship, land, continuity, and lived trade relationships — the world holds because people hold each other to it.",
      coreBeliefs:
        "The world is relational. Survival depends on memory, lineage, and reciprocal obligation — not on paper or distant decrees.",
      fears:
        "Disruption of kinship lines; violent incursion; loss of daughters to chaos or capture; collapse of the order that keeps children safe.",
      desires:
        "Continuity, safety, transmission of culture, preservation of dignity and belonging for those who come after.",
      internalConflicts:
        "How to survive inside a changing world without surrendering what makes a people themselves — adaptation without self-erasure.",
      socialPosition:
        "High-status or lineage-bearing woman within a Native community structure; exact formal title unknown — preserve ambiguity.",
      educationLevel:
        "Deep oral, environmental, social, and ceremonial knowledge — intelligence measured by responsibility and recall, not schooling.",
      religiousContext:
        "Indigenous spiritual world (land, ancestors, seasonal obligation) prior to or in tension with colonial Christian overlay — do not flatten into one register.",
      emotionalBaseline: "Observant, controlled, protective.",
      behavioralPatterns:
        "Reads mood shifts quickly; notices subtle threats at the edge of camp; leads quietly rather than performing authority.",
      speechPatterns: "Economical, metaphor-rich, direct when the moment demands plainness.",
      memoryBias:
        "Family continuity and land memory prioritized over written or legal framing — documents are tools of outsiders.",
      sensoryBias:
        "Highly attuned to smoke, water, footpaths, rhythm, weather, and communal sound — the world announces itself bodily.",
      moralFramework: "Obligation to people over empire.",
      contradictions: "Adaptable but rooted; strategic but emotionally bound to place.",
      notes:
        "Ambiguity around exact titles and formal tribal role is intentional. This profile is a narrative-world anchor, not a certificate of identity.",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: PERSON_CHILD },
    update: {
      worldview: "The circle of adults is the shape of the world; trails and river are extensions of home.",
      coreBeliefs: "If the morning smoke rises, the day belongs to us.",
      sensoryBias: "Low horizon of fear; high resolution for sound, texture, and motion.",
      emotionalBaseline: "Open curiosity with occasional unease when adults tighten without explaining.",
      notes: "POV lens only — not a psychologized modern child.",
      enneagramType: EnneagramType.SEVEN,
      enneagramWing: "SIX",
      enneagramConfidence: 2,
      enneagramSource: "hybrid",
      stressPattern: "Scattered scanning when adults tighten without explanation.",
      growthPattern: "Sustained contact with one grounded adult; gratitude for small freedoms.",
      coreLonging: "Freedom to keep playing inside a safe world.",
      coreFear: "Being trapped in pain or boredom.",
      attentionBias: "Motion, novelty, exits, and the emotional weather of adults.",
    },
    create: {
      personId: PERSON_CHILD,
      worldview: "The circle of adults is the shape of the world; trails and river are extensions of home.",
      coreBeliefs: "If the morning smoke rises, the day belongs to us.",
      sensoryBias: "Low horizon of fear; high resolution for sound, texture, and motion.",
      emotionalBaseline: "Open curiosity with occasional unease when adults tighten without explaining.",
      notes: "POV lens only — not a psychologized modern child.",
      enneagramType: EnneagramType.SEVEN,
      enneagramWing: "SIX",
      enneagramConfidence: 2,
      enneagramSource: "hybrid",
      stressPattern: "Scattered scanning when adults tighten without explanation.",
      growthPattern: "Sustained contact with one grounded adult; gratitude for small freedoms.",
      coreLonging: "Freedom to keep playing inside a safe world.",
      coreFear: "Being trapped in pain or boredom.",
      attentionBias: "Motion, novelty, exits, and the emotional weather of adults.",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: PERSON_FRANCOIS },
    update: {
      worldview:
        "Frontier as translation zone — languages, kinship, and paperwork overlap; survival is fluency across systems.",
      socialPosition:
        "Mixed French–Indigenous broker/interpreter figure in research accounts; embedded with Caddo networks and imperial administrations.",
      educationLevel:
        "Multilingual education (Alexis as teacher in the research line) plus lived apprenticeship in trade and diplomacy.",
      internalConflicts:
        "Loyalty split across kin, trade obligation, and colonial demand — exact emotional interior is partly speculative.",
      notes:
        "Bridge character for genealogical and thematic continuity toward Campti. Do not overstate uncertain ancestry or undocumented lines as settled fact. See private research source for excerpt.",
    },
    create: {
      personId: PERSON_FRANCOIS,
      worldview:
        "Frontier as translation zone — languages, kinship, and paperwork overlap; survival is fluency across systems.",
      socialPosition:
        "Mixed French–Indigenous broker/interpreter figure in research accounts; embedded with Caddo networks and imperial administrations.",
      educationLevel:
        "Multilingual education (Alexis as teacher in the research line) plus lived apprenticeship in trade and diplomacy.",
      internalConflicts:
        "Loyalty split across kin, trade obligation, and colonial demand — exact emotional interior is partly speculative.",
      notes:
        "Bridge character for genealogical and thematic continuity toward Campti. Do not overstate uncertain ancestry or undocumented lines as settled fact. See private research source for excerpt.",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: PERSON_LOUISE },
    update: {
      socialPosition:
        "Mother figure in the François Grappe research line; documentary visibility may be partial — hold space for ambiguity.",
      coreBeliefs: "Continuity of family name and care across displacement.",
      notes: "Supporting bridge for lineage toward later generations; not meant to overload the opening Grande Terre scene.",
    },
    create: {
      personId: PERSON_LOUISE,
      socialPosition:
        "Mother figure in the François Grappe research line; documentary visibility may be partial — hold space for ambiguity.",
      coreBeliefs: "Continuity of family name and care across displacement.",
      notes: "Supporting bridge for lineage toward later generations; not meant to overload the opening Grande Terre scene.",
    },
  });

  const profileMarie = await prisma.characterProfile.findUniqueOrThrow({
    where: { personId: PERSON_MARIE },
    select: { id: true },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_GT },
    update: {
      physicalDescription: `Riverside and upland clearings tied by packed trails — not a “blank” frontier but a worked country. Lodges and arbors in seasonal arrangement; corn and other crops in pockets of alluvial soil; storage and drying racks within sight of the water. Paths register generations of foot traffic: to the river, to neighbors, to the smoke of someone else’s morning fire. The land reads as itinerary as much as territory.`,
      environmentType:
        "Humid subtropical riverine homeland with braided social geography — settlement clusters linked by trail and water.",
      climateDescription:
        "Long warm seasons; heavy summer growth; winter cool enough to mark time by fire and story rather than clock.",
      typicalWeather:
        "Late summer: heat that holds through the afternoon, thunderheads building, rain that steams off bark and packed earth by evening.",
      sounds:
        "River shoals; children’s voices; mortar and pestle rhythm; dogs; hoofbeats when travelers arrive; laughter at a distance; sometimes flute or song without spectacle.",
      smells:
        "Woodsmoke, parched grass after rain, river silt, corn and oil, cured fish or meat, sweat and river-cooled skin.",
      textures:
        "Packed trail grit under bare feet; woven cane and bark; worn wood; clay; the slick of stone at the ford.",
      lightingConditions:
        "Morning: low gold through haze and smoke. Midday: high white heat. Evening: copper along the tree line.",
      dominantActivities:
        "Agriculture and gathering; food processing; mending nets and tools; receiving travelers; negotiating exchange; teaching children by task; council and counsel among women as continuity infrastructure.",
      socialRules:
        "Reciprocity; hospitality with eyes open; children under collective watch; respect for elders as living archives; conflict handled before it becomes spectacle.",
      classDynamics:
        "Status through lineage, competence, generosity, and ritual knowledge — not through imported European rank labels.",
      racialDynamics:
        "Early-contact diversity along trade routes: familiarity and interdependence mixed with the threat that any outsider might be the advance guard of violence.",
      religiousPresence:
        "Ceremonial time and ancestor attention woven into daily labor; Christian presence may be distant rumor or occasional visitor — not the moral center of this scene.",
      economicContext:
        "Trade-route civilization: surplus and craft move along kin and alliance lines — exchange as relationship maintenance, not only transaction.",
      materialsPresent:
        "Ceramic and stone tools; fiber and woven goods; metal from trade; riverine resources; agricultural surplus for hospitality.",
      notes:
        "This setting refuses ‘empty wilderness.’ Emphasize completeness: agriculture, women’s authority, trail literacy, and the intelligence of routine.",
    },
    create: {
      placeId: PLACE_GT,
      physicalDescription: `Riverside and upland clearings tied by packed trails — not a “blank” frontier but a worked country. Lodges and arbors in seasonal arrangement; corn and other crops in pockets of alluvial soil; storage and drying racks within sight of the water. Paths register generations of foot traffic: to the river, to neighbors, to the smoke of someone else’s morning fire. The land reads as itinerary as much as territory.`,
      environmentType:
        "Humid subtropical riverine homeland with braided social geography — settlement clusters linked by trail and water.",
      climateDescription:
        "Long warm seasons; heavy summer growth; winter cool enough to mark time by fire and story rather than clock.",
      typicalWeather:
        "Late summer: heat that holds through the afternoon, thunderheads building, rain that steams off bark and packed earth by evening.",
      sounds:
        "River shoals; children’s voices; mortar and pestle rhythm; dogs; hoofbeats when travelers arrive; laughter at a distance; sometimes flute or song without spectacle.",
      smells:
        "Woodsmoke, parched grass after rain, river silt, corn and oil, cured fish or meat, sweat and river-cooled skin.",
      textures:
        "Packed trail grit under bare feet; woven cane and bark; worn wood; clay; the slick of stone at the ford.",
      lightingConditions:
        "Morning: low gold through haze and smoke. Midday: high white heat. Evening: copper along the tree line.",
      dominantActivities:
        "Agriculture and gathering; food processing; mending nets and tools; receiving travelers; negotiating exchange; teaching children by task; council and counsel among women as continuity infrastructure.",
      socialRules:
        "Reciprocity; hospitality with eyes open; children under collective watch; respect for elders as living archives; conflict handled before it becomes spectacle.",
      classDynamics:
        "Status through lineage, competence, generosity, and ritual knowledge — not through imported European rank labels.",
      racialDynamics:
        "Early-contact diversity along trade routes: familiarity and interdependence mixed with the threat that any outsider might be the advance guard of violence.",
      religiousPresence:
        "Ceremonial time and ancestor attention woven into daily labor; Christian presence may be distant rumor or occasional visitor — not the moral center of this scene.",
      economicContext:
        "Trade-route civilization: surplus and craft move along kin and alliance lines — exchange as relationship maintenance, not only transaction.",
      materialsPresent:
        "Ceramic and stone tools; fiber and woven goods; metal from trade; riverine resources; agricultural surplus for hospitality.",
      notes:
        "This setting refuses ‘empty wilderness.’ Emphasize completeness: agriculture, women’s authority, trail literacy, and the intelligence of routine.",
    },
  });

  const settingProfileId = (
    await prisma.settingProfile.findUniqueOrThrow({ where: { placeId: PLACE_GT }, select: { id: true } })
  ).id;

  const profileFrancois = await prisma.characterProfile.findUniqueOrThrow({
    where: { personId: PERSON_FRANCOIS },
    select: { id: true },
  });

  await prisma.settingState.upsert({
    where: { id: SETTING_STATE_LATE_SUMMER },
    update: {
      placeId: PLACE_GT,
      timePeriod: "Early 1700s — late-summer village rhythm",
      season: "Late summer",
      weather: "Heat, afternoon storms, thick air before rain",
      populationType: "Resident community plus periodic visitors from trade routes",
      activityLevel: "High daytime labor; slower mid-day; social peak near evening cool",
      notableConditions: "Calm trade period — movement reads as familiar rather than emergency",
      notes: "Baseline ‘peace as rhythm’ state for the anchor.",
    },
    create: {
      id: SETTING_STATE_LATE_SUMMER,
      placeId: PLACE_GT,
      timePeriod: "Early 1700s — late-summer village rhythm",
      season: "Late summer",
      weather: "Heat, afternoon storms, thick air before rain",
      populationType: "Resident community plus periodic visitors from trade routes",
      activityLevel: "High daytime labor; slower mid-day; social peak near evening cool",
      notableConditions: "Calm trade period — movement reads as familiar rather than emergency",
      notes: "Baseline ‘peace as rhythm’ state for the anchor.",
    },
  });

  await prisma.settingState.upsert({
    where: { id: SETTING_STATE_PRE_ATTACK },
    update: {
      placeId: PLACE_GT,
      timePeriod: "Days before violence — subtle shift",
      season: "Late summer",
      weather: "Same heat; weather no longer the main story",
      populationType: "Same — but attention tightens at the edges",
      activityLevel: "Outwardly unchanged; inwardly more watchfulness",
      notableConditions:
        "Optional unease: rumors, a late arrival, a question asked twice — not yet alarm, not yet proof",
      notes: "Light touch — premonition without telegraphing plot as certainty.",
    },
    create: {
      id: SETTING_STATE_PRE_ATTACK,
      placeId: PLACE_GT,
      timePeriod: "Days before violence — subtle shift",
      season: "Late summer",
      weather: "Same heat; weather no longer the main story",
      populationType: "Same — but attention tightens at the edges",
      activityLevel: "Outwardly unchanged; inwardly more watchfulness",
      notableConditions:
        "Optional unease: rumors, a late arrival, a question asked twice — not yet alarm, not yet proof",
      notes: "Light touch — premonition without telegraphing plot as certainty.",
    },
  });

  await prisma.metaScene.upsert({
    where: { id: META_SCENE_ID },
    update: {
      title: "Grande Terre — Three Days Before the Attack",
      placeId: PLACE_GT,
      povPersonId: PERSON_CHILD,
      sceneId: null,
      timePeriod: "Early 1700s — before French violence reaches the immediate scene (approximate)",
      dateEstimate: "Approximate — narrative anchor, not calendar certainty",
      participants: [
        "Marie Anne Thérèse de la Grande Terre (mother / authority)",
        "Elder women — continuity and counsel",
        "Children — play and learning at the edge of the village",
        "Traders and kin — familiar arrivals along the trail",
      ],
      environmentDescription: `The village holds its shape: smoke at the right hours, the river speaking its constant syllable, children inventing games that require no permission. Work is visible — corn, grinding, mend — and so is leisure as a form of trust. The world feels durable because nothing has yet forced the community to admit it might not be.`,
      sensoryField: `Heat; woodsmoke; wet stone at the crossing; the rhythmic work-sounds that mean “we are still here”; hoofbeats that still register as kinship possibility rather than raid.`,
      historicalConstraints: `No claim that every detail is documented. The scene is historically grounded inference: trade-route Indigenous life, early-contact pressures, matrilineal and women-centered continuity as plausible structure — specific family names beyond research bridges are fictional anchors.`,
      socialConstraints: `Hospitality remains obligatory; children are supervised collectively; elder women carry interpretive weight; strangers are read carefully — warmth without blindness.`,
      characterStatesSummary: `Child: immersion, safety assumed. Marie: watchful calm — love as vigilance. Elders: unhurried competence — the archive in person. Visitors: still inside the grammar of trade civility.`,
      emotionalVoltage: `High warmth with a thin wire of dread — the reader should love the world before learning its fragility.`,
      centralConflict: `Peace as earned equilibrium vs. forces that treat land and people as disposable — violence is not yet present, but the story’s moral stakes are named.`,
      symbolicElements: `Smoke as continuity; river/trail as embodied knowledge; women’s labor as civilization; child’s certainty as tragic irony.`,
      narrativePurpose: `Make the reader love the world before it breaks — emotional foundation for the entire novel.`,
      continuityDependencies: `Requires Grande Terre setting model, Marie’s mind model, child POV, and later rupture scenes to echo what is lost.`,
      sourceSupportLevel: "moderate",
      notes: `Meta scene for planning — not final prose. Honest uncertainty: moderate support from cultural/historical inference; research excerpt supports bridge characters (e.g. François line), not this specific village as fact.`,
    },
    create: {
      id: META_SCENE_ID,
      title: "Grande Terre — Three Days Before the Attack",
      placeId: PLACE_GT,
      povPersonId: PERSON_CHILD,
      timePeriod: "Early 1700s — before French violence reaches the immediate scene (approximate)",
      dateEstimate: "Approximate — narrative anchor, not calendar certainty",
      participants: [
        "Marie Anne Thérèse de la Grande Terre (mother / authority)",
        "Elder women — continuity and counsel",
        "Children — play and learning at the edge of the village",
        "Traders and kin — familiar arrivals along the trail",
      ],
      environmentDescription: `The village holds its shape: smoke at the right hours, the river speaking its constant syllable, children inventing games that require no permission. Work is visible — corn, grinding, mend — and so is leisure as a form of trust. The world feels durable because nothing has yet forced the community to admit it might not be.`,
      sensoryField: `Heat; woodsmoke; wet stone at the crossing; the rhythmic work-sounds that mean “we are still here”; hoofbeats that still register as kinship possibility rather than raid.`,
      historicalConstraints: `No claim that every detail is documented. The scene is historically grounded inference: trade-route Indigenous life, early-contact pressures, matrilineal and women-centered continuity as plausible structure — specific family names beyond research bridges are fictional anchors.`,
      socialConstraints: `Hospitality remains obligatory; children are supervised collectively; elder women carry interpretive weight; strangers are read carefully — warmth without blindness.`,
      characterStatesSummary: `Child: immersion, safety assumed. Marie: watchful calm — love as vigilance. Elders: unhurried competence — the archive in person. Visitors: still inside the grammar of trade civility.`,
      emotionalVoltage: `High warmth with a thin wire of dread — the reader should love the world before learning its fragility.`,
      centralConflict: `Peace as earned equilibrium vs. forces that treat land and people as disposable — violence is not yet present, but the story’s moral stakes are named.`,
      symbolicElements: `Smoke as continuity; river/trail as embodied knowledge; women’s labor as civilization; child’s certainty as tragic irony.`,
      narrativePurpose: `Make the reader love the world before it breaks — emotional foundation for the entire novel.`,
      continuityDependencies: `Requires Grande Terre setting model, Marie’s mind model, child POV, and later rupture scenes to echo what is lost.`,
      sourceSupportLevel: "moderate",
      notes: `Meta scene for planning — not final prose. Honest uncertainty: moderate support from cultural/historical inference; research excerpt supports bridge characters (e.g. François line), not this specific village as fact.`,
    },
  });

  await prisma.characterMemory.upsert({
    where: { id: MEM_IDS.river },
    update: {
      personId: PERSON_MARIE,
      description:
        "River memory: crossings timed to season and light — the water as road and border; children taught by repetition, not lecture.",
      timePeriod: "Life before the opening’s violent horizon",
      reliability: "inferred",
      emotionalWeight: 4,
      notes: "World-state anchor — not a clinical memory.",
    },
    create: {
      id: MEM_IDS.river,
      personId: PERSON_MARIE,
      description:
        "River memory: crossings timed to season and light — the water as road and border; children taught by repetition, not lecture.",
      timePeriod: "Life before the opening’s violent horizon",
      reliability: "inferred",
      emotionalWeight: 4,
      notes: "World-state anchor — not a clinical memory.",
    },
  });

  await prisma.characterMemory.upsert({
    where: { id: MEM_IDS.women },
    update: {
      personId: PERSON_MARIE,
      description:
        "Women’s work as communal rhythm — grinding, teaching, mending — the soundscape of continuity when politics is elsewhere.",
      timePeriod: "Ongoing",
      reliability: "emotional",
      emotionalWeight: 5,
      notes: "Elder women as system of knowledge transmission.",
    },
    create: {
      id: MEM_IDS.women,
      personId: PERSON_MARIE,
      description:
        "Women’s work as communal rhythm — grinding, teaching, mending — the soundscape of continuity when politics is elsewhere.",
      timePeriod: "Ongoing",
      reliability: "emotional",
      emotionalWeight: 5,
      notes: "Elder women as system of knowledge transmission.",
    },
  });

  await prisma.characterMemory.upsert({
    where: { id: MEM_IDS.trade },
    update: {
      personId: PERSON_MARIE,
      description:
        "Trade-route familiarity: certain hoof rhythms mean kin or ally; others require a second look — knowledge held in the body.",
      timePeriod: "Adult life",
      reliability: "inferred",
      emotionalWeight: 3,
    },
    create: {
      id: MEM_IDS.trade,
      personId: PERSON_MARIE,
      description:
        "Trade-route familiarity: certain hoof rhythms mean kin or ally; others require a second look — knowledge held in the body.",
      timePeriod: "Adult life",
      reliability: "inferred",
      emotionalWeight: 3,
    },
  });

  await prisma.characterMemory.upsert({
    where: { id: MEM_IDS.unease },
    update: {
      personId: PERSON_MARIE,
      description:
        "An early sign that does not yet name itself — a story repeated, a silence where joking used to be, a visitor’s eyes measuring too long.",
      timePeriod: "Days before rupture (narrative)",
      reliability: "uncertain",
      emotionalWeight: 4,
      notes: "Premonition without proof — keep ambiguous.",
    },
    create: {
      id: MEM_IDS.unease,
      personId: PERSON_MARIE,
      description:
        "An early sign that does not yet name itself — a story repeated, a silence where joking used to be, a visitor’s eyes measuring too long.",
      timePeriod: "Days before rupture (narrative)",
      reliability: "uncertain",
      emotionalWeight: 4,
      notes: "Premonition without proof — keep ambiguous.",
    },
  });

  await prisma.fragmentLink.deleteMany({ where: { fragmentId: { in: [...FRAGMENT_IDS] } } });
  await prisma.fragmentPlacementCandidate.deleteMany({ where: { fragmentId: { in: [...FRAGMENT_IDS] } } });
  await prisma.fragmentInsight.deleteMany({ where: { fragmentId: { in: [...FRAGMENT_IDS] } } });

  const sourceTextRow = await prisma.sourceText.findUnique({
    where: { sourceId: SOURCE_ID },
    select: { id: true },
  });

  type FragDef = {
    id: (typeof FRAGMENT_IDS)[number];
    fragmentType: FragmentType;
    title: string;
    text: string;
    summary: string;
    emotionalTone: string;
    narrativeFunction: string;
    timeHint: string;
    confidence: number;
    ambiguityLevel: number;
    placementStatus: string;
    reviewStatus: string;
    sourceId?: string;
    sourceTextId?: string | null;
    links: { linkedType: string; linkedId: string; linkRole: string; notes?: string }[];
    insights: { insightType: string; content: string; confidence: number }[];
    candidates?: { targetType: string; targetId?: string; targetLabel?: string; confidence: number; rationale: string; status: string }[];
    memoryFragmentFor?: keyof typeof MEM_IDS;
  };

  const fragDefs: FragDef[] = [
    {
      id: "seed-frag-gt-smoke-morning",
      fragmentType: FragmentType.IMAGE_OR_SENSORY,
      title: "Morning smoke — continuity without speech",
      text: "Smoke rises at the hour it is supposed to, and the child reads that as law: if smoke, then day; if day, then we continue.",
      summary: "Smoke as proof of ongoing life — sensory anchor for peace.",
      emotionalTone: "Grounded safety",
      narrativeFunction: "Open the world through ritual time",
      timeHint: "Dawn, late summer",
      confidence: 3,
      ambiguityLevel: 3,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "informs_scene", notes: "Sensory spine" },
        { linkedType: "setting_profile", linkedId: settingProfileId, linkRole: "informs_setting" },
        { linkedType: "character_profile", linkedId: profileMarie.id, linkRole: "provides_symbolism" },
      ],
      insights: [
        { insightType: "symbol", content: "Smoke as continuity and collective presence", confidence: 3 },
        { insightType: "theme", content: "Peace must be made visible before destruction earns its horror", confidence: 3 },
      ],
      candidates: [
        { targetType: "place", targetId: PLACE_GT, targetLabel: "Grande Terre Homeland Zone", confidence: 4, rationale: "Grounds sensory opening", status: "suggested" },
      ],
    },
    {
      id: "seed-frag-gt-trade-artery",
      fragmentType: FragmentType.SCENE_SEED,
      title: "The trail as familiar artery",
      text: "The trade route is not danger yet — it is the village’s widened breath: people you might love, goods you might need, stories carried in dust.",
      summary: "Trade civilization as relationship, not abstract ‘frontier.’",
      emotionalTone: "Open, connected",
      narrativeFunction: "Refuse emptiness tropes; show exchange as society",
      timeHint: "Pre-attack calm",
      confidence: 3,
      ambiguityLevel: 3,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "informs_scene" },
        { linkedType: "setting_profile", linkedId: settingProfileId, linkRole: "informs_setting" },
      ],
      insights: [
        { insightType: "narrative-angle", content: "Movement as civilization, not intrusion — until it is", confidence: 3 },
      ],
    },
    {
      id: "seed-frag-gt-elder-women-continuity",
      fragmentType: FragmentType.CHARACTER_INSIGHT,
      title: "Elder women as the system",
      text: "The elder women do not ‘help’ the village — they are its memory engine: who owes what, who married in, who cannot be trusted with fire.",
      summary: "Women-centered continuity — authority without podium.",
      emotionalTone: "Reverent, steady",
      narrativeFunction: "Matriarchal infrastructure explicit on the page",
      timeHint: "Ongoing",
      confidence: 3,
      ambiguityLevel: 4,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "character_profile", linkedId: profileMarie.id, linkRole: "informs_character" },
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "informs_scene" },
      ],
      insights: [{ insightType: "hidden-pattern", content: "Governance as care labor and memory", confidence: 3 }],
    },
    {
      id: "seed-frag-gt-child-certainty",
      fragmentType: FragmentType.EMOTIONAL_BEAT,
      title: "Child certainty the world will continue",
      text: "The child does not doubt tomorrow — doubt is an adult tool. Tomorrow is a shape adults build while the child plays inside it.",
      summary: "Innocence as dramatic irony reservoir.",
      emotionalTone: "Bright, fragile",
      narrativeFunction: "Make loss legible later",
      timeHint: "Three days before (narrative)",
      confidence: 3,
      ambiguityLevel: 2,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "informs_scene" },
        { linkedType: "character_profile", linkedId: profileMarie.id, linkRole: "drives_conflict", notes: "Adult knowledge vs child horizon" },
      ],
      insights: [{ insightType: "narrative-angle", content: "Reader affection through child POV", confidence: 4 }],
    },
    {
      id: "seed-frag-gt-river-trail-embodied",
      fragmentType: FragmentType.MEMORY,
      title: "River and trail knowledge — embodied",
      text: "Nobody explains the ford; bodies explain it — how cold, where the slick is, when the season makes the bank a lie.",
      summary: "Knowledge as practice, not lesson.",
      emotionalTone: "Physical confidence",
      narrativeFunction: "Tie Marie’s memory anchors to place",
      timeHint: "Life-long",
      confidence: 3,
      ambiguityLevel: 3,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "character_memory", linkedId: MEM_IDS.river, linkRole: "represents_memory" },
        { linkedType: "setting_profile", linkedId: settingProfileId, linkRole: "informs_setting" },
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "informs_scene" },
      ],
      insights: [{ insightType: "symbol", content: "Water and path as embodied literacy", confidence: 3 }],
      memoryFragmentFor: "river",
    },
    {
      id: "seed-frag-gt-adult-unease",
      fragmentType: FragmentType.SCENE_SEED,
      title: "Adult unease before violence names itself",
      text: "Someone laughs late; someone else doesn’t. A question hangs a half-beat too long. The child notices only that the day feels ordinary.",
      summary: "Subtle premonition — adult register only.",
      emotionalTone: "Quiet dread",
      narrativeFunction: "Foreshadow without collapsing into prophecy",
      timeHint: "Immediate pre-attack window",
      confidence: 2,
      ambiguityLevel: 4,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "drives_conflict" },
        { linkedType: "character_memory", linkedId: MEM_IDS.unease, linkRole: "represents_memory" },
        { linkedType: "character_profile", linkedId: profileMarie.id, linkRole: "informs_character" },
      ],
      insights: [{ insightType: "hidden-pattern", content: "Violence arrives first as social timing", confidence: 2 }],
    },
    {
      id: "seed-frag-gt-women-carry-names",
      fragmentType: FragmentType.ORAL_HISTORY,
      title: "Names and roles through women",
      text: "Titles slip across languages; what persists is who remembers your mother’s line when the paper does not.",
      summary: "Matrilineal continuity vs documentary erasure.",
      emotionalTone: "Defiant, soft",
      narrativeFunction: "Theme: memory vs empire",
      timeHint: "Oral frame",
      confidence: 3,
      ambiguityLevel: 4,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "character_profile", linkedId: profileMarie.id, linkRole: "informs_character" },
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "provides_symbolism" },
      ],
      insights: [{ insightType: "theme", content: "Assimilation pressures begin as naming and record", confidence: 3 }],
    },
    {
      id: "seed-frag-gt-peace-before-destruction",
      fragmentType: FragmentType.SYMBOLIC_NOTE,
      title: "Peace must be made real",
      text: "Peace is not the absence of noise — it is the agreement, renewed daily, that we will not turn on each other first.",
      summary: "Moral stake: peace as active creation.",
      emotionalTone: "Solemn warmth",
      narrativeFunction: "Thematic thesis for the anchor",
      timeHint: "Philosophical (scene-embeddable)",
      confidence: 3,
      ambiguityLevel: 3,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "informs_scene" },
        { linkedType: "setting_profile", linkedId: settingProfileId, linkRole: "provides_symbolism" },
      ],
      insights: [{ insightType: "symbol", content: "Smoke + rhythm + reciprocity = peace image system", confidence: 3 }],
    },
    {
      id: "seed-frag-gt-maternal-order",
      fragmentType: FragmentType.NARRATOR_VOICE,
      title: "Maternal order (narrator register)",
      text: "We begin where a mother’s hands still sort the world into knowable pieces — before history arrives with its louder tools.",
      summary: "Frame opening as maternal / communal order.",
      emotionalTone: "Lyrical, restrained",
      narrativeFunction: "Narrator stance for prologue-adjacent work",
      timeHint: "Meta",
      confidence: 3,
      ambiguityLevel: 3,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      links: [
        { linkedType: "character_profile", linkedId: profileMarie.id, linkRole: "informs_character" },
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "informs_scene" },
      ],
      insights: [{ insightType: "narrative-angle", content: "Book emotional foundation sentence", confidence: 3 }],
    },
    {
      id: "seed-frag-gt-francois-research-bridge",
      fragmentType: FragmentType.HISTORICAL_ANCHOR,
      title: "François Grappe — research bridge (not the opening emotional center)",
      text: "The Grappe name will arrive later with documentation and dispute — here, at Grande Terre, the world is still named by mothers, water, and smoke.",
      summary: "Explicit deferral of surname dominance; bridge to later generations.",
      emotionalTone: "Calm boundary",
      narrativeFunction: "Hold research line without hijacking origin scene",
      timeHint: "Meta / continuity",
      confidence: 3,
      ambiguityLevel: 3,
      placementStatus: "linked",
      reviewStatus: "reviewed",
      sourceId: SOURCE_ID,
      sourceTextId: sourceTextRow?.id ?? null,
      links: [
        { linkedType: "source", linkedId: SOURCE_ID, linkRole: "grounds" },
        {
          linkedType: "character_profile",
          linkedId: profileFrancois.id,
          linkRole: "informs_character",
          notes: "Genealogical / research bridge — not the opening emotional center",
        },
        { linkedType: "character_profile", linkedId: profileMarie.id, linkRole: "informs_character", notes: "Contrast: story begins before Grappe dominates emotionally" },
        { linkedType: "meta_scene", linkedId: META_SCENE_ID, linkRole: "informs_scene" },
      ],
      insights: [
        { insightType: "narrative-angle", content: "Genealogical bridge without collapsing timelines", confidence: 3 },
      ],
    },
  ];

  for (const def of fragDefs) {
    await prisma.fragment.upsert({
      where: { id: def.id },
      update: {
        title: def.title,
        fragmentType: def.fragmentType,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        text: def.text,
        summary: def.summary,
        emotionalTone: def.emotionalTone,
        narrativeFunction: def.narrativeFunction,
        timeHint: def.timeHint,
        confidence: def.confidence,
        ambiguityLevel: def.ambiguityLevel,
        placementStatus: def.placementStatus,
        reviewStatus: def.reviewStatus,
        sourceId: def.sourceId ?? null,
        sourceTextId: def.sourceTextId ?? null,
        decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
        sourceTraceNote: def.sourceId ? "Tied to François / Caddo research excerpt (private)" : null,
      },
      create: {
        id: def.id,
        title: def.title,
        fragmentType: def.fragmentType,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        text: def.text,
        summary: def.summary,
        emotionalTone: def.emotionalTone,
        narrativeFunction: def.narrativeFunction,
        timeHint: def.timeHint,
        confidence: def.confidence,
        ambiguityLevel: def.ambiguityLevel,
        placementStatus: def.placementStatus,
        reviewStatus: def.reviewStatus,
        sourceId: def.sourceId ?? null,
        sourceTextId: def.sourceTextId ?? null,
        decompositionVersion: FRAGMENT_DECOMPOSITION_VERSION,
        sourceTraceNote: def.sourceId ? "Tied to François / Caddo research excerpt (private)" : null,
      },
    });

    if (def.memoryFragmentFor) {
      await prisma.characterMemory.update({
        where: { id: MEM_IDS[def.memoryFragmentFor] },
        data: { fragmentId: def.id },
      });
    }

    for (const ins of def.insights) {
      await prisma.fragmentInsight.create({
        data: {
          fragmentId: def.id,
          insightType: ins.insightType,
          content: ins.content,
          confidence: ins.confidence,
        },
      });
    }

    for (const c of def.candidates ?? []) {
      await prisma.fragmentPlacementCandidate.create({
        data: {
          fragmentId: def.id,
          targetType: c.targetType,
          targetId: c.targetId ?? null,
          targetLabel: c.targetLabel ?? null,
          confidence: c.confidence,
          rationale: c.rationale,
          status: c.status,
        },
      });
    }

    for (const L of def.links) {
      await prisma.fragmentLink.create({
        data: {
          fragmentId: def.id,
          linkedType: L.linkedType,
          linkedId: L.linkedId,
          linkRole: L.linkRole,
          notes: L.notes ?? null,
        },
      });
    }
  }

  await prisma.characterMemory.update({
    where: { id: MEM_IDS.women },
    data: { fragmentId: "seed-frag-gt-elder-women-continuity" },
  });
  await prisma.characterMemory.update({
    where: { id: MEM_IDS.trade },
    data: { fragmentId: "seed-frag-gt-trade-artery" },
  });
  await prisma.characterMemory.update({
    where: { id: MEM_IDS.unease },
    data: { fragmentId: "seed-frag-gt-adult-unease" },
  });

  /* Phase 9B — light cluster + suggestion demo (idempotent) */
  const CLUSTER_SMOKE = "seed-cluster-gt-smoke-memory";
  const CLUSTER_PEACE = "seed-cluster-gt-pre-peace";
  const SUGGEST_A = "seed-suggestion-gt-symbolic";
  const SUGGEST_B = "seed-suggestion-gt-tension";

  await prisma.fragmentClusterLink.deleteMany({
    where: { clusterId: { in: [CLUSTER_SMOKE, CLUSTER_PEACE] } },
  });
  await prisma.fragmentCluster.deleteMany({
    where: { id: { in: [CLUSTER_SMOKE, CLUSTER_PEACE] } },
  });
  await prisma.sceneConstructionSuggestion.deleteMany({
    where: { id: { in: [SUGGEST_A, SUGGEST_B] } },
  });

  await prisma.fragmentCluster.create({
    data: {
      id: CLUSTER_SMOKE,
      title: "Smoke / memory / continuity",
      clusterType: "symbol",
      summary: "Sensory and moral images of smoke as continuity before rupture.",
      emotionalTone: "Warm, watchful",
      dominantFunction: "symbolic",
      confidence: 4,
      notes: "Demo cluster — edit freely.",
      metaSceneId: META_SCENE_ID,
      placeId: PLACE_GT,
      fragmentLinks: {
        create: [
          { fragmentId: "seed-frag-gt-smoke-morning", role: "central" },
          { fragmentId: "seed-frag-gt-peace-before-destruction", role: "echo" },
        ],
      },
    },
  });

  await prisma.fragmentCluster.create({
    data: {
      id: CLUSTER_PEACE,
      title: "Grande Terre — pre-loss calm",
      clusterType: "emotional_arc",
      summary: "Peace as rhythm: trade, women’s work, child certainty.",
      emotionalTone: "Grounded, fragile",
      dominantFunction: "emotional_arc",
      confidence: 3,
      notes: "Demo cluster — small by design.",
      metaSceneId: META_SCENE_ID,
      placeId: PLACE_GT,
      fragmentLinks: {
        create: [
          { fragmentId: "seed-frag-gt-child-certainty", role: "central" },
          { fragmentId: "seed-frag-gt-trade-artery", role: "supporting" },
        ],
      },
    },
  });

  await prisma.sceneConstructionSuggestion.createMany({
    data: [
      {
        id: SUGGEST_A,
        metaSceneId: META_SCENE_ID,
        title: "Let symbolism press on the named conflict",
        suggestionType: "symbolic_layer",
        summary:
          "Symbolic field is rich — ensure smoke/river/women images recur in action or dialogue, not only in notes.",
        confidence: 3,
        status: "suggested",
      },
      {
        id: SUGGEST_B,
        metaSceneId: META_SCENE_ID,
        title: "Keep adult unease in counterpoint to child POV",
        suggestionType: "tension_arc",
        summary: "Use fragments that carry premonition so the scene’s dread has a social timing, not only exposition.",
        confidence: 3,
        status: "suggested",
        supportingFragmentIds: ["seed-frag-gt-adult-unease"],
      },
    ],
  });

  await prisma.characterRelationship.upsert({
    where: {
      personAId_personBId: { personAId: PERSON_CHILD, personBId: PERSON_MARIE },
    },
    update: {
      relationshipType: "parent_child",
      relationshipSummary:
        "Child POV orbits Marie’s watchful calm; safety assumed until adult tension sharpens without full explanation.",
      emotionalPattern: "Secure attachment in scene; child reads mood through kinesthetic cues and rhythm.",
      enneagramDynamic:
        "SEVEN exploratory child + protective maternal field (author may type Marie separately — not prescribed here).",
      confidence: 3,
      notes: "Interpretive story aid; not a clinical assessment.",
    },
    create: {
      personAId: PERSON_CHILD,
      personBId: PERSON_MARIE,
      relationshipType: "parent_child",
      relationshipSummary:
        "Child POV orbits Marie’s watchful calm; safety assumed until adult tension sharpens without full explanation.",
      emotionalPattern: "Secure attachment in scene; child reads mood through kinesthetic cues and rhythm.",
      enneagramDynamic:
        "SEVEN exploratory child + protective maternal field (author may type Marie separately — not prescribed here).",
      confidence: 3,
      notes: "Interpretive story aid; not a clinical assessment.",
    },
  });

  await prisma.sceneSoulSuggestion.createMany({
    data: [
      {
        id: "seed-soul-gt-opening-impulse",
        metaSceneId: META_SCENE_ID,
        title: "Opening impulse — sensory before plot",
        suggestionType: "opening_impulse",
        summary:
          "Begin with smoke, river syllable, and children’s games — let dread arrive as a change in the rhythm of adults, not as a headline.",
        confidence: 3,
        status: "suggested",
      },
      {
        id: "seed-soul-gt-unspoken",
        metaSceneId: META_SCENE_ID,
        title: "Unspoken current — safety priced as vigilance",
        suggestionType: "unspoken_current",
        summary:
          "The POV cannot name geopolitics; they can feel when hospitality tightens. Keep the unspoken as bodily cue.",
        confidence: 3,
        status: "suggested",
      },
    ],
  });

  await prisma.metaSceneNarrativePass.upsert({
    where: { id: "seed-narrative-pass-gt-opening" },
    create: {
      id: "seed-narrative-pass-gt-opening",
      metaSceneId: META_SCENE_ID,
      passType: "opening",
      content: [
        "## Opening Perception",
        "Smoke on schedule; river sound as constant grammar; children inventing games that assume the world will hold.",
        "",
        "## Bodily Feeling",
        "Heat in skin; woodsmoke in hair; the small fatigue of play that still reads as safety.",
      ].join("\n"),
      summary: "Seed — Grande Terre anchor (not final prose)",
      confidence: 3,
      status: "generated",
      notes: "Phase 9D seed — marked as generated / reviewable.",
    },
    update: {
      metaSceneId: META_SCENE_ID,
      passType: "opening",
    },
  });

  await prisma.metaSceneNarrativePass.upsert({
    where: { id: "seed-narrative-pass-gt-embodied" },
    create: {
      id: "seed-narrative-pass-gt-embodied",
      metaSceneId: META_SCENE_ID,
      passType: "embodied",
      content: [
        "## Embodied perspective",
        "First attention: sensory bias toward motion and voices — adults as weather.",
        "Unspoken: the cost of vigilance without vocabulary for invasion.",
        "Memory pressure: river-crossing taught by repetition, not lecture.",
      ].join("\n\n"),
      summary: "Seed — embodied child POV",
      confidence: 3,
      status: "generated",
      notes: "Phase 9D seed",
    },
    update: {
      metaSceneId: META_SCENE_ID,
      passType: "embodied",
    },
  });
}
