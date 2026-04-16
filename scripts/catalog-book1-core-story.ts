import "./load-env";
import {
  EventType,
  FragmentType,
  PlaceType,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

const DEFAULT_SOURCE_ID = "book1-source-chunk-1";
const CATALOG_RUN_TAG = "book1-catalog-v1";
type CatalogProfile =
  | "chunk1-natchitoches"
  | "chunk2-material-culture"
  | "chunk3-geography-power"
  | "chunk4-conflict-web"
  | "chunk5-yatasi-difference"
  | "chunk6-ouachita-difference"
  | "chunk7-pressure-systems"
  | "chunk8-book1-story-design"
  | "chunk9-census-lineage"
  | "chunk10-mediation-scene"
  | "chunk11-succession-scene"
  | "chunk12-convergence-gathering"
  | "chunk13-domestic-system-training"
  | "chunk14-observation-stealth-council"
  | "chunk15-death-recognition-continuity"
  | "chunk16-assembly-spatial-governance"
  | "chunk17-pov-layering-system"
  | "chunk18-pattern-breakdown-pov"
  | "chunk19-multisystem-council-pov"
  | "chunk20-peer-performance-pov"
  | "chunk21-cross-cultural-observer-pov"
  | "chunk22-spanish-borderlands-timeline"
  | "chunk23-military-population-layer"
  | "chunk24-interpreter-frontier-power"
  | "generic";

type ClaimSpec = {
  id: string;
  description: string;
  quoteExcerpt: string;
  confidence: number;
  needsReview?: boolean;
  notes?: string;
  requiredPatterns: RegExp[];
};

type EventSpec = {
  id: string;
  title: string;
  eventType: EventType;
  description: string;
  startYear?: number;
  notes?: string;
  requiredPatterns: RegExp[];
};

type PlaceSpec = {
  id: string;
  name: string;
  description: string;
  placeType: PlaceType;
  sourceTraceNote: string;
  requiredPatterns: RegExp[];
};

type FragmentSpec = {
  id: string;
  title: string;
  text: string;
  summary: string;
  confidence: number;
  requiredPatterns: RegExp[];
};

type QuestionSpec = {
  id: string;
  title: string;
  description: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  let sourceId = DEFAULT_SOURCE_ID;
  let profile: CatalogProfile | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source-id" && args[i + 1]) {
      sourceId = args[++i];
    } else if (args[i] === "--profile" && args[i + 1]) {
      const p = args[++i] as CatalogProfile;
      if (
        p === "chunk1-natchitoches" ||
        p === "chunk2-material-culture" ||
        p === "chunk3-geography-power" ||
        p === "chunk4-conflict-web" ||
        p === "chunk5-yatasi-difference" ||
        p === "chunk6-ouachita-difference" ||
        p === "chunk7-pressure-systems" ||
        p === "chunk8-book1-story-design" ||
        p === "chunk9-census-lineage" ||
        p === "chunk10-mediation-scene" ||
        p === "chunk11-succession-scene" ||
        p === "chunk12-convergence-gathering" ||
        p === "chunk13-domestic-system-training" ||
        p === "chunk14-observation-stealth-council" ||
        p === "chunk15-death-recognition-continuity" ||
        p === "chunk16-assembly-spatial-governance" ||
        p === "chunk17-pov-layering-system" ||
        p === "chunk18-pattern-breakdown-pov" ||
        p === "chunk19-multisystem-council-pov" ||
        p === "chunk20-peer-performance-pov" ||
        p === "chunk21-cross-cultural-observer-pov" ||
        p === "chunk22-spanish-borderlands-timeline" ||
        p === "chunk23-military-population-layer" ||
        p === "chunk24-interpreter-frontier-power" ||
        p === "generic"
      )
        profile = p;
    }
  }
  return { sourceId, profile };
}

function allPatternsMatch(text: string, patterns: RegExp[]): boolean {
  return patterns.every((pattern) => pattern.test(text));
}

const CHUNK1_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book1-claim-caddoan-civilizational-context",
    description:
      "The Natchitoches are presented as part of a broader Caddoan civilizational network rather than an isolated tribal unit.",
    quoteExcerpt:
      "The Natchitoches were part of the broader Caddoan world, one branch of a large network of related peoples...",
    confidence: 4,
    notes: "Core framing claim for Book 1 story-world foundations.",
    requiredPatterns: [/natchitoches/i, /caddo(an)? world/i],
  },
  {
    id: "book1-claim-riverine-agricultural-settlement",
    description:
      "The source frames Natchitoches life as riverine, agricultural, and hamlet-based rather than nomadic.",
    quoteExcerpt:
      "Like other Caddoan peoples, the Natchitoches belonged to an agricultural society... a series of small hamlets...",
    confidence: 4,
    requiredPatterns: [/agricultural society/i, /series of small hamlets/i],
  },
  {
    id: "book1-claim-matrilineal-authority",
    description:
      "Matrilineal descent and women’s authority in fields and household spaces are treated as structural social facts.",
    quoteExcerpt:
      "Across the Caddo world, descent was traditionally matrilineal... elder women controlled... lodges... and fields.",
    confidence: 4,
    requiredPatterns: [/matrilineal/i, /elder women/i],
  },
  {
    id: "book1-claim-trade-node-prior-to-french-post",
    description:
      "The area later used for the French post is described as pre-existing Indigenous infrastructure in a trade geography.",
    quoteExcerpt:
      "They built there because the place was already native infrastructure: a node in an older trade geography.",
    confidence: 4,
    requiredPatterns: [/native infrastructure/i, /trade geography/i],
  },
];

const CHUNK1_EVENT_SPECS: EventSpec[] = [
  {
    id: "book1-event-ouachita-absorption-c1690",
    title: "Natchitoches absorption of Ouachita (c. 1690)",
    eventType: EventType.CULTURAL,
    startYear: 1690,
    description:
      "Source indicates the Natchitoches had absorbed the Ouachita by around 1690, signaling dynamic pre-contact political change.",
    requiredPatterns: [/absorbed the ouachita/i, /around 1690/i],
  },
  {
    id: "book1-event-tonti-contact-1690",
    title: "Henri de Tonti reaches a Natchitoches village (1690)",
    eventType: EventType.POLITICAL,
    startYear: 1690,
    description:
      "Source marks Henri de Tonti reaching a Natchitoches village while searching for La Salle’s lost expedition.",
    requiredPatterns: [/henri de tonti/i, /1690/i],
  },
  {
    id: "book1-event-french-post-1714",
    title: "St. Denis establishes French post at old Natchitoches village (1714)",
    eventType: EventType.POLITICAL,
    startYear: 1714,
    description:
      "Source states St. Denis established the French post in 1714 at an old Natchitoches village site.",
    requiredPatterns: [/st\.?\s*denis/i, /1714/i, /old natchitoches village/i],
  },
];

const CHUNK1_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book1-place-red-river-valley",
    name: "Red River Valley (Natchitoches homeland corridor)",
    description:
      "Floodplain, levees, cane breaks, and settlement ground framing agriculture, mobility, and strategic life.",
    placeType: PlaceType.RIVER,
    sourceTraceNote: "Derived from normalized book1 source text (Red River settlement framing).",
    requiredPatterns: [/red river valley/i, /floodplain/i],
  },
  {
    id: "book1-place-natchitoches-area",
    name: "Natchitoches Area (historic Indigenous node)",
    description:
      "Regional node described as a long-standing Indigenous trade and settlement center before colonial attachment.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Derived from normalized book1 source text (native infrastructure framing).",
    requiredPatterns: [/present-day natchitoches/i, /native infrastructure/i],
  },
];

const CHUNK1_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book1-frag-distributed-hamlet-governance",
    title: "Distributed Hamlet Governance",
    text:
      "Power appears distributed across linked hamlets, kinship, ritual authority, and local leadership rather than a single rigid center.",
    summary: "Governance pattern constraint for scene legitimacy.",
    confidence: 4,
    requiredPatterns: [/series of small hamlets/i, /less powerful and more egalitarian/i],
  },
  {
    id: "book1-frag-ceremony-place-ancestor-order",
    title: "Ceremony, Place, and Ancestor Order",
    text:
      "Temples, cemeteries, and ceremonial life bind social order to land, ancestors, and seasonal continuity.",
    summary: "Sacred-world continuity constraint.",
    confidence: 4,
    requiredPatterns: [/temple/i, /cemeter(y|ies)/i, /ceremonial/i],
  },
  {
    id: "book1-frag-river-trade-witness-density",
    title: "River Trade Witness Density",
    text:
      "River exchange nodes function as socially dense theaters where diplomacy, reputation, and risk circulate together.",
    summary: "Public-scene pressure constraint.",
    confidence: 3,
    requiredPatterns: [/trade/i, /red river was not a backwater/i],
  },
];

const CHUNK1_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book1-oq-natchitoches-leadership-granularity",
    title: "How exactly did leadership authority vary across Natchitoches hamlets?",
    description:
      "Need tighter differentiation between hereditary offices, consensus councils, and ritual authority in local governance.",
  },
  {
    id: "book1-oq-cosmology-source-granularity",
    title: "Which Natchitoches-specific ritual practices are directly sourced vs inferred from broader Caddo records?",
    description:
      "Clarify direct evidence boundaries before scene-level ritual detail enters the core story bible.",
  },
  {
    id: "book1-oq-neighbor-diplomacy-map",
    title: "What was the operating diplomatic map among Natchitoches, Adaes, Yatasi, Ouachita, and Hasinai at key dates?",
    description:
      "Needed for conflict architecture and alliance plausibility in chapter planning.",
  },
];

const CHUNK2_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book2-claim-material-culture-frozen-behavior",
    description:
      "Material culture is framed as preserved behavior carrying evidence of skill, belief, and social necessity.",
    quoteExcerpt: "Material culture isn’t just “objects.” It’s frozen behavior...",
    confidence: 4,
    notes: "Chunk2 framing claim for object-to-society interpretation.",
    requiredPatterns: [/material culture isn.t just/i, /frozen behavior/i],
  },
  {
    id: "book2-claim-caddoan-pottery-refinement",
    description:
      "Caddoan pottery in the Natchitoches world is represented as highly refined, thin-walled, and design-rich.",
    quoteExcerpt: "Caddoan pottery—used by the Natchitoches—was among the most refined in North America.",
    confidence: 3,
    requiredPatterns: [/caddoan pottery/i, /thin-walled/i, /intricate engraved designs/i],
  },
  {
    id: "book2-claim-pottery-generational-knowledge",
    description:
      "Pottery production is described as multigenerational technical knowledge, likely transmitted heavily through women’s labor systems.",
    quoteExcerpt: "This knowledge was passed down through generations... likely held primarily by women.",
    confidence: 3,
    requiredPatterns: [/passed down through generations/i, /held primarily by women/i],
  },
  {
    id: "book2-claim-local-efficient-tool-infrastructure",
    description:
      "Tool systems are presented as local, efficient, and category-diverse across food, hunting, craft, and woodworking.",
    quoteExcerpt: "The Natchitoches tool system was efficient, adaptable, and local.",
    confidence: 3,
    requiredPatterns: [/tool system was/i, /food processing tools/i, /hunting tools/i, /craft tools/i],
  },
  {
    id: "book2-claim-land-derived-housing-system",
    description:
      "Housing is framed as a land-derived material system integrating wood, cane/reed, thatch, and mud/clay.",
    quoteExcerpt: "The Natchitoches house was a material system, not just a structure.",
    confidence: 3,
    requiredPatterns: [/house was a material system/i, /wooden poles/i, /cane and reeds/i, /grass\/thatch|grass and thatch/i],
  },
];

const CHUNK2_EVENT_SPECS: EventSpec[] = [];

const CHUNK2_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book2-place-natchitoches-material-culture-zone",
    name: "Natchitoches Material-Culture Zone",
    description:
      "Research scope for production, use, and meaning of pottery, tools, and housing materials in the Natchitoches world.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk2 material-culture scope anchor.",
    requiredPatterns: [/material culture deep dive/i, /natchitoches world/i],
  },
];

const CHUNK2_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book2-frag-function-identity-object-logic",
    title: "Function and Identity Object Logic",
    text:
      "Objects carry functional and identity load at once; utility, beauty, and meaning are not separable in cultural analysis.",
    summary: "Interpretive rule for object-centered scenes.",
    confidence: 4,
    requiredPatterns: [/nothing was accidental/i, /function \+ identity/i],
  },
  {
    id: "book2-frag-pottery-knowledge-transmission",
    title: "Pottery as Knowledge Transmission",
    text:
      "Pottery craft reflects stored technical memory (materials, firing, design) transmitted through generational practice.",
    summary: "Craft continuity constraint.",
    confidence: 3,
    requiredPatterns: [/pottery as knowledge system/i, /clay sourcing knowledge/i, /temperature control/i],
  },
  {
    id: "book2-frag-local-material-housing-adaptation",
    title: "Local Material Housing Adaptation",
    text:
      "Housing form follows local ecological materials and maintenance logic, emphasizing adaptation and repairability.",
    summary: "Setting-construction constraint.",
    confidence: 3,
    requiredPatterns: [/built from the land/i, /core materials/i, /wooden poles/i, /mud\/clay/i],
  },
];

const CHUNK2_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book2-oq-pottery-design-taxonomy",
    title: "Which specific pottery design motifs can be tied to identifiable Natchitoches or related Caddoan communities?",
    description:
      "Need source-anchored motif taxonomy before assigning symbolic meanings to named lineages or locations.",
  },
  {
    id: "book2-oq-tool-diffusion-trade",
    title: "How much of the described tool kit reflects local production versus trade diffusion?",
    description:
      "Differentiate locally fabricated technologies from imported/adapted tools for scene-level material realism.",
  },
  {
    id: "book2-oq-housing-seasonal-variation",
    title: "What seasonal or status variation existed in housing materials and construction patterns?",
    description:
      "Needed to avoid over-uniform dwelling descriptions in chapter environments.",
  },
];

const CHUNK3_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book3-claim-river-system-not-scenery",
    description:
      "The Red River is framed as a governing system of movement, boundaries, exchange, and information flow rather than passive background.",
    quoteExcerpt: "The Red River is not scenery. It is: The road, the boundary, the marketplace, the messenger.",
    confidence: 4,
    requiredPatterns: [/red river is not scenery/i, /the road/i, /the boundary/i, /the marketplace/i],
  },
  {
    id: "book3-claim-oxbow-stability-settlement",
    description:
      "Oxbow lakes such as Cane River are described as settlement anchors due to stable water and reduced exposure relative to main channels.",
    quoteExcerpt:
      "Oxbow lakes... former river channels... stable water sources... ideal for settlement... safer than main river flow.",
    confidence: 4,
    requiredPatterns: [/oxbow lakes/i, /cane river/i, /ideal for settlement/i],
  },
  {
    id: "book3-claim-natural-levee-precision-placement",
    description:
      "Natural levees are presented as precision settlement zones balancing flood avoidance, water access, and fertile soils.",
    quoteExcerpt: "Not random placement—precision placement.",
    confidence: 4,
    requiredPatterns: [/natural levees/i, /precision placement/i, /villages are built/i],
  },
  {
    id: "book3-claim-cane-brake-defensive-infrastructure",
    description:
      "Cane brakes are treated as defensive and mobility infrastructure: barriers externally, pathways for those with local knowledge.",
    quoteExcerpt: "Cane brakes function as natural barriers, defensive shields, hidden pathways (if you know them).",
    confidence: 3,
    requiredPatterns: [/cane brakes function as/i, /natural barriers/i, /hidden pathways/i],
  },
  {
    id: "book3-claim-power-through-water-literacy",
    description:
      "Power durability is tied to ecological literacy: those who read water movement and site correctly outlast competitors.",
    quoteExcerpt: "Who understands where to build and where not to build survives longer than everyone else.",
    confidence: 3,
    requiredPatterns: [/where to build/i, /where not to build/i, /survives longer/i],
  },
];

const CHUNK3_EVENT_SPECS: EventSpec[] = [];

const CHUNK3_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book3-place-red-river-mobility-corridor",
    name: "Red River Mobility Corridor",
    description:
      "Primary movement artery linking settlement logic, exchange, and strategic positioning in the chapter’s geography-of-power frame.",
    placeType: PlaceType.RIVER,
    sourceTraceNote: "Chunk3 geography-of-power anchor: main corridor system.",
    requiredPatterns: [/red river as artery|red river/i, /movement/i, /water/i],
  },
  {
    id: "book3-place-cane-river-oxbow-anchor",
    name: "Cane River Oxbow Anchor",
    description:
      "Stable off-channel settlement anchor balancing access to routes with lower direct exposure to main-flow volatility.",
    placeType: PlaceType.LAKE,
    sourceTraceNote: "Chunk3 geography-of-power anchor: oxbow settlement logic.",
    requiredPatterns: [/oxbow lakes/i, /cane river/i],
  },
  {
    id: "book3-place-natural-levee-settlement-band",
    name: "Natural Levee Settlement Band",
    description:
      "Slightly elevated alluvial ground used for durable village and field placement under recurring flood pressure.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk3 geography-of-power anchor: levee siting logic.",
    requiredPatterns: [/natural levees/i, /villages are built/i, /fields are planted/i],
  },
];

const CHUNK3_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book3-frag-main-channel-vs-oxbow-dual-logic",
    title: "Main Channel vs Oxbow Dual Logic",
    text:
      "Main river channels prioritize movement and exposure; oxbow zones prioritize continuity and control. Strong chapters stage tension between these two geographies.",
    summary: "Core spatial tension constraint for chapter architecture.",
    confidence: 4,
    requiredPatterns: [/main river = movement/i, /oxbow = stability/i],
  },
  {
    id: "book3-frag-hydrological-literacy-as-power",
    title: "Hydrological Literacy as Power",
    text:
      "Political survival follows hydrological literacy: reading bends, floods, narrows, and branches determines who can route people, goods, and risk.",
    summary: "Governance-through-geography constraint.",
    confidence: 3,
    requiredPatterns: [/where the river bends/i, /where it floods/i, /where it narrows/i, /where it branches/i],
  },
  {
    id: "book3-frag-cane-brake-visibility-control",
    title: "Cane Brake Visibility Control",
    text:
      "Cane brakes function as selective visibility infrastructure: concealment, defense, and controlled mobility for informed actors.",
    summary: "Scene-blocking and surveillance constraint.",
    confidence: 3,
    requiredPatterns: [/cane brakes/i, /defensive shields/i, /hidden pathways/i],
  },
];

const CHUNK3_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book3-oq-river-course-change-time-slices",
    title: "Which specific time slices show major Red River course shifts most relevant to Grappe-era settlement decisions?",
    description:
      "Need periodized river-change anchors to avoid flattening hydrological dynamics across generations.",
  },
  {
    id: "book3-oq-oxbow-main-channel-risk-deltas",
    title: "What measurable risk differences existed between main-channel and oxbow-adjacent settlement patterns?",
    description:
      "Helps calibrate scene stakes and migration/siting decisions beyond qualitative framing.",
  },
  {
    id: "book3-oq-cane-brake-route-knowledge-distribution",
    title: "Who held actionable knowledge of cane-brake routes and how was that knowledge controlled or transmitted?",
    description:
      "Needed for plausible power asymmetry in movement, defense, and secrecy scenes.",
  },
];

const CHUNK4_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book4-claim-conflict-inevitable-systemic",
    description:
      "Conflict is framed as an inevitable systemic condition in dense multi-party networks, not as an abnormal exception.",
    quoteExcerpt: "Conflict is not abnormal. It is inevitable.",
    confidence: 4,
    requiredPatterns: [/conflict is not abnormal/i, /inevitable/i],
  },
  {
    id: "book4-claim-conflict-management-over-elimination",
    description:
      "The stated governance goal is conflict management that preserves system integrity rather than conflict elimination.",
    quoteExcerpt: "The goal is not to eliminate conflict... manage it without breaking the system.",
    confidence: 4,
    requiredPatterns: [/goal is not to eliminate conflict/i, /without breaking the system/i],
  },
  {
    id: "book4-claim-resource-shock-drives-violence-risk",
    description:
      "Resource shocks (harvest failure, flooding, drought, overhunting) are treated as primary escalation triggers from tension to survival conflict.",
    quoteExcerpt: "People don’t fight because they want to... because they have to survive.",
    confidence: 4,
    requiredPatterns: [/poor harvest/i, /flooding/i, /drought/i, /overhunting/i],
  },
  {
    id: "book4-claim-trade-fairness-perception-critical",
    description:
      "Trade stability depends on perceived fairness and reciprocity; exploitation perception leads to refusal, distrust, and retaliation.",
    quoteExcerpt: "Trade must feel fair—even if it isn’t equal.",
    confidence: 4,
    requiredPatterns: [/trade must feel fair/i, /reciprocity is broken/i, /retaliation/i],
  },
  {
    id: "book4-claim-miscommunication-primary-spark",
    description:
      "Miscommunication (language, cultural assumptions, tone) is described as the most common proximate spark for escalation.",
    quoteExcerpt: "Most conflict doesn’t begin with intent. It begins with misunderstanding.",
    confidence: 4,
    requiredPatterns: [/most conflict doesn.t begin with intent/i, /misunderstanding/i],
  },
];

const CHUNK4_EVENT_SPECS: EventSpec[] = [];

const CHUNK4_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book4-place-conflict-pressure-web",
    name: "Conflict Pressure Web (Red River Network)",
    description:
      "System-level theater where resource, trade, language, and kinship tensions accumulate and are either managed or destabilized.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk4 pressure-point system anchor.",
    requiredPatterns: [/pillar 8/i, /pressure points/i],
  },
];

const CHUNK4_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book4-frag-preemptive-relief-before-violence",
    title: "Preemptive Relief Before Violence",
    text:
      "Legitimate power acts before scarcity-driven desperation converts into open violence; timing is the core trust mechanic.",
    summary: "Conflict-prevention timing constraint.",
    confidence: 4,
    requiredPatterns: [/bring relief before desperation turns into violence/i],
  },
  {
    id: "book4-frag-meaning-correction-before-emotion",
    title: "Meaning Correction Before Emotion",
    text:
      "De-escalation depends on correcting meaning early, before emotional momentum hardens misunderstanding into retaliation.",
    summary: "Mediation/translation constraint.",
    confidence: 4,
    requiredPatterns: [/correcting meaning before emotion takes over/i],
  },
  {
    id: "book4-frag-kinship-obligation-pressure",
    title: "Kinship Obligation Pressure",
    text:
      "Kinship strengthens cooperation while simultaneously increasing obligation strain; unmet expectations can destabilize alliances.",
    summary: "Kinship-risk constraint.",
    confidence: 3,
    requiredPatterns: [/kinship strengthens the system/i, /obligation pressure/i],
  },
];

const CHUNK4_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book4-oq-resource-shock-thresholds",
    title: "What concrete thresholds separate manageable scarcity from violence-prone desperation in this network?",
    description:
      "Needed to calibrate when mediation can still work versus when emergency intervention is required.",
  },
  {
    id: "book4-oq-trade-fairness-mechanics",
    title: "Which practical mechanisms made trade feel fair across culturally asymmetric parties?",
    description:
      "Needed for credible conflict-resolution scenes around reciprocity and value translation.",
  },
  {
    id: "book4-oq-kinship-obligation-adjudication",
    title: "How were competing kinship obligations adjudicated when resource or honor claims collided?",
    description:
      "Needed to model internal fractures without flattening kin networks into simple loyalty blocs.",
  },
];

const CHUNK5_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book5-claim-yatasi-close-variation-not-separate-world",
    description:
      "The Yatasi are framed as a close variation of the Natchitoches baseline rather than a completely separate system.",
    quoteExcerpt: "The Yatasi are not a completely different world. They are a close variation of the Natchitoches baseline.",
    confidence: 4,
    requiredPatterns: [/yatasi/i, /close variation of the natchitoches baseline/i],
  },
  {
    id: "book5-claim-yatasi-interior-positioning",
    description:
      "Yatasi geography is described as slightly more interior and less dependent on main river arteries than the Natchitoches baseline.",
    quoteExcerpt: "More interior positioning... slightly less dependent on main river arteries.",
    confidence: 4,
    requiredPatterns: [/more interior positioning/i, /less dependent on main river arteries/i],
  },
  {
    id: "book5-claim-yatasi-fragmented-settlement-vulnerability",
    description:
      "The profile emphasizes weakened or fragmented settlement continuity, with greater vulnerability to external pressure.",
    quoteExcerpt: "Historically weakened and reduced over time... more fragmented settlement identity.",
    confidence: 3,
    requiredPatterns: [/fragmented settlement identity/i, /weakened and reduced over time/i],
  },
  {
    id: "book5-claim-yatasi-dependent-trade-participation",
    description:
      "Yatasi trade behavior is framed as participatory and dependency-oriented rather than central node control.",
    quoteExcerpt: "They are not driving trade. They are participating within it.",
    confidence: 4,
    requiredPatterns: [/not driving trade/i, /participating within it/i],
  },
  {
    id: "book5-claim-yatasi-relational-diplomacy-priority",
    description:
      "Diplomacy is portrayed as personal-trust-first and relationship-driven rather than large-scale strategic positioning.",
    quoteExcerpt: "More intimate, relationship-driven diplomacy... less strategic positioning in large-scale alliances.",
    confidence: 4,
    requiredPatterns: [/relationship-driven diplomacy/i, /less strategic positioning/i],
  },
  {
    id: "book5-claim-yatasi-subtle-dialect-difference",
    description:
      "Language variation is framed as subtle and insider-legible (tone/expression/cadence) despite close dialect proximity.",
    quoteExcerpt: "Likely very close dialectically... subtle differences in tone, expression, cadence.",
    confidence: 3,
    requiredPatterns: [/very close dialectically/i, /tone/i, /cadence/i],
  },
];

const CHUNK5_EVENT_SPECS: EventSpec[] = [];

const CHUNK5_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book5-place-yatasi-interior-tributary-zone",
    name: "Yatasi Interior Tributary Zone",
    description:
      "Interior-facing habitation and movement space less exposed to main-artery traffic and visibility pressures.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk5 Yatasi geography-difference anchor.",
    requiredPatterns: [/interior positioning/i, /tributaries and woodland zones/i],
  },
];

const CHUNK5_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book5-frag-relationship-entry-over-traffic-entry",
    title: "Relationship Entry Over Traffic Entry",
    text:
      "Influence with the Yatasi begins through trusted relationships rather than route control or traffic dominance.",
    summary: "Access protocol constraint for Yatasi-facing scenes.",
    confidence: 4,
    requiredPatterns: [/enter through relationship, not traffic/i],
  },
  {
    id: "book5-frag-stabilize-access-not-dominate-trade",
    title: "Stabilize Access, Not Trade Domination",
    text:
      "Legitimate leverage comes from stabilizing Yatasi access and reciprocity, not from imposing intermediary control.",
    summary: "Trade-governance constraint for difference profile.",
    confidence: 4,
    requiredPatterns: [/supporting and stabilizing their access to trade/i],
  },
  {
    id: "book5-frag-personal-trust-before-negotiation",
    title: "Personal Trust Before Negotiation",
    text:
      "Formal negotiation follows personal trust formation; transactional entry without trust weakens long-horizon alignment.",
    summary: "Diplomatic sequencing constraint.",
    confidence: 4,
    requiredPatterns: [/cannot “negotiate” your way in/i, /become trusted at a personal level first/i],
  },
];

const CHUNK5_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book5-oq-yatasi-chronology-of-fragmentation",
    title: "What dated milestones best map Yatasi settlement weakening and merger dynamics with neighboring groups?",
    description:
      "Needed to avoid compressing multi-decade structural changes into a single narrative beat.",
  },
  {
    id: "book5-oq-yatasi-trade-dependency-mechanics",
    title: "Which concrete exchange dependencies defined Yatasi trade participation under Natchitoches-adjacent systems?",
    description:
      "Needed to model stabilization scenes with credible economic specifics.",
  },
  {
    id: "book5-oq-yatasi-dialect-markers",
    title: "What linguistic markers (tone, cadence, phrase choices) can be safely treated as Yatasi-distinct in dialogue?",
    description:
      "Needed for voice differentiation that avoids generic or over-assertive language claims.",
  },
];

const CHUNK6_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book6-claim-ouachita-environmental-variation",
    description:
      "Ouachita are framed as an environmental variation within the broader system rather than a dramatic civilizational break.",
    quoteExcerpt: "The Ouachita (Washita) ... an environmental variation of the system.",
    confidence: 4,
    requiredPatterns: [/ouachita \(washita\)/i, /environmental variation of the system/i],
  },
  {
    id: "book6-claim-ouachita-river-upland-mix",
    description:
      "Ouachita geography is characterized as a river-valley plus upland mix, producing less uniform terrain and slower movement.",
    quoteExcerpt: "River-valley + upland mix ... movement is more varied and slower.",
    confidence: 4,
    requiredPatterns: [/river-valley \+ upland mix/i, /upland forest and hills/i, /movement is more varied and slower/i],
  },
  {
    id: "book6-claim-ouachita-irregular-micro-community-settlement",
    description:
      "Settlement pattern is portrayed as terrain-shaped and irregular, requiring navigation across localized micro-communities.",
    quoteExcerpt: "More irregular distribution ... navigate multiple micro-communities.",
    confidence: 4,
    requiredPatterns: [/irregular distribution/i, /multiple micro-communities/i],
  },
  {
    id: "book6-claim-ouachita-regional-trade-connector",
    description:
      "Trade role is framed as important regional connector behavior without central-system dominance.",
    quoteExcerpt: "Regional connector, not central hub ... important-but not dominant.",
    confidence: 4,
    requiredPatterns: [/regional connector, not central hub/i, /important—but not dominant/i],
  },
  {
    id: "book6-claim-ouachita-reserved-diplomacy-slower-trust",
    description:
      "Diplomacy is described as measured and slightly reserved, with slower trust formation that yields stronger durability.",
    quoteExcerpt: "Trust builds slower—but holds stronger.",
    confidence: 4,
    requiredPatterns: [/reserved and measured/i, /trust builds slower—but holds stronger/i],
  },
  {
    id: "book6-claim-ouachita-regional-language-inflection",
    description:
      "Language is treated as closely related to the baseline but with subtle regional inflection discernible to careful listeners.",
    quoteExcerpt: "Very close linguistically ... slight regional inflection in speech patterns.",
    confidence: 3,
    requiredPatterns: [/very close linguistically/i, /regional inflection/i],
  },
];

const CHUNK6_EVENT_SPECS: EventSpec[] = [];

const CHUNK6_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book6-place-ouachita-river-upland-interface",
    name: "Ouachita River-Upland Interface",
    description:
      "Mixed-terrain contact zone combining river corridors with upland forest/hill movement constraints.",
    placeType: PlaceType.RIVER,
    sourceTraceNote: "Chunk6 Ouachita geography-variation anchor.",
    requiredPatterns: [/ouachita river system/i, /upland forest and hills/i],
  },
];

const CHUNK6_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book6-frag-terrain-dependent-mobility-logic",
    title: "Terrain-Dependent Mobility Logic",
    text:
      "Movement strategy shifts from route-first assumptions to terrain-conditioned pacing, pathing, and contact timing.",
    summary: "Mobility-planning constraint.",
    confidence: 4,
    requiredPatterns: [/terrain-dependent—not just route-based/i],
  },
  {
    id: "book6-frag-micro-community-navigation",
    title: "Micro-Community Navigation",
    text:
      "Effective engagement requires treating Ouachita spaces as multiple local clusters rather than a single negotiable unit.",
    summary: "Community-structure constraint.",
    confidence: 4,
    requiredPatterns: [/multiple micro-communities/i, /don.t treat the group as one unit/i],
  },
  {
    id: "book6-frag-slow-trust-strong-durability",
    title: "Slow Trust, Strong Durability",
    text:
      "Relationship timelines are slower and less performative; trust durability rises when pace and reserve are respected.",
    summary: "Diplomatic pacing constraint.",
    confidence: 4,
    requiredPatterns: [/trust builds slower—but holds stronger/i, /let them settle naturally over time/i],
  },
];

const CHUNK6_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book6-oq-ouachita-micro-community-mapping",
    title: "Which micro-community clusters are most relevant to Ouachita settlement and decision flow in the target period?",
    description:
      "Needed to convert terrain-shaped dispersion into concrete interaction maps for scenes and chapters.",
  },
  {
    id: "book6-oq-ouachita-regional-trade-specifics",
    title: "What goods and reciprocal obligations most strongly define Ouachita regional connector trade behavior?",
    description:
      "Needed for precise exchange scenes and realistic leverage dynamics.",
  },
  {
    id: "book6-oq-ouachita-language-inflection-cues",
    title: "What specific speech-pattern cues can safely signal Ouachita regional inflection without over-claiming divergence?",
    description:
      "Needed for dialogue differentiation grounded in nuanced linguistic proximity.",
  },
];

const CHUNK7_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book7-claim-wichita-osage-comanche-pressure-systems",
    description:
      "Wichita, Osage, and Comanche are framed as pressure systems that test existing network stability rather than ordinary participants.",
    quoteExcerpt: "Wichita -> Osage -> Comanche ... They are pressure systems.",
    confidence: 4,
    requiredPatterns: [/wichita.*osage.*comanche/i, /pressure systems/i],
  },
  {
    id: "book7-claim-wichita-plains-river-connector-expansion",
    description:
      "Wichita are described as plains-river hybrids that expand system reach westward through mobile connector trade logic.",
    quoteExcerpt: "Wichita ... Plains-River Hybrid ... They expand the system westward.",
    confidence: 4,
    requiredPatterns: [/wichita/i, /plains-river hybrid/i, /expand the system westward/i],
  },
  {
    id: "book7-claim-osage-dominant-range-power-assertion",
    description:
      "Osage are represented as dominant range holders using trade and conflict assertively to reinforce territorial control.",
    quoteExcerpt: "Osage ... dominant range holders ... trade used to assert control and reinforce dominance.",
    confidence: 4,
    requiredPatterns: [/osage/i, /dominant range holders/i, /assert control/i, /reinforce dominance/i],
  },
  {
    id: "book7-claim-comanche-system-rewriting-disruption",
    description:
      "Comanche are framed as a disruptive force whose full-plains mobility can rewrite existing system assumptions.",
    quoteExcerpt: "Comanche ... disruptive force that rewrites the system ... full plains mobility.",
    confidence: 4,
    requiredPatterns: [/comanche/i, /rewrites the system/i, /full plains mobility/i],
  },
  {
    id: "book7-claim-shift-building-power-to-holding-under-stress",
    description:
      "Narrative phase shifts from building influence to sustaining authority under escalating external stress.",
    quoteExcerpt: "Story shifts from building power to holding power under stress.",
    confidence: 4,
    requiredPatterns: [/building power/i, /holding power under stress/i],
  },
];

const CHUNK7_EVENT_SPECS: EventSpec[] = [];

const CHUNK7_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book7-place-plains-caddoan-pressure-interface",
    name: "Plains-Caddoan Pressure Interface",
    description:
      "Strategic interface where mobile plains powers and established Caddoan-network actors generate sustained pressure on trust and control systems.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk7 pressure-system contact-zone anchor.",
    requiredPatterns: [/bridge between caddoan world and the plains/i, /pressure systems/i],
  },
];

const CHUNK7_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book7-frag-open-mobile-system-operating-logic",
    title: "Open Mobile System Operating Logic",
    text:
      "Sustainable influence in open systems depends on mobility fluency, exposure management, and distributed negotiation beyond fixed hubs.",
    summary: "Wichita-facing mobility constraint.",
    confidence: 4,
    requiredPatterns: [/operate across open, mobile systems/i],
  },
  {
    id: "book7-frag-engaging-self-sufficient-power",
    title: "Engaging Self-Sufficient Power",
    text:
      "When counterpart powers do not need your network, leverage shifts to boundary management, risk calculus, and selective reciprocity.",
    summary: "Osage-facing power asymmetry constraint.",
    confidence: 4,
    requiredPatterns: [/power that does not need you/i],
  },
  {
    id: "book7-frag-disruption-adaptation-cycle",
    title: "Disruption Adaptation Cycle",
    text:
      "System durability under Comanche-like disruption requires rapid adaptation loops that update movement, trade, and alliance assumptions in real time.",
    summary: "Comanche-facing adaptation constraint.",
    confidence: 3,
    requiredPatterns: [/disruptive force that rewrites the system/i],
  },
];

const CHUNK7_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book7-oq-wichita-connector-route-architecture",
    title: "Which route architectures made Wichita connector power structurally distinct from river-centric Caddoan nodes?",
    description:
      "Needed to model westward expansion with concrete movement/trade mechanics.",
  },
  {
    id: "book7-oq-osage-dominance-boundary-mechanisms",
    title: "What specific mechanisms did Osage use to enforce dominance across wide territorial ranges?",
    description:
      "Needed for realistic conflict and negotiation stakes under asymmetric power.",
  },
  {
    id: "book7-oq-comanche-disruption-thresholds",
    title: "At what thresholds did Comanche mobility patterns force structural changes in existing alliance and trade systems?",
    description:
      "Needed to mark the transition from stress to systemic rewrite in chapter arcs.",
  },
];

const CHUNK8_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book8-claim-two-generation-matriarch-origin",
    description:
      "Book 1 is explicitly framed as a two-generation matriarchal origin story centered on bridge-lineage formation.",
    quoteExcerpt: "A two-generation matriarchal origin story of the bridge lineage.",
    confidence: 5,
    requiredPatterns: [/two-generation matriarchal origin story/i, /bridge lineage/i],
  },
  {
    id: "book8-claim-core-theme-mothers-hold-river",
    description:
      "The working core theme is defined as maternal stewardship of power transfer within the Red River system.",
    quoteExcerpt: "Working Core Theme: The Mothers Who Hold the River.",
    confidence: 5,
    requiredPatterns: [/mothers who hold the river/i],
  },
  {
    id: "book8-claim-mother-daughter-dual-structure",
    description:
      "Primary structure is mother-first-matriarch and daughter-second-matriarch, with the relationship carrying system revelation.",
    quoteExcerpt: "The entire book is their relationship. The system is revealed through their lives.",
    confidence: 5,
    requiredPatterns: [/the mother \(first matriarch\)/i, /the daughter \(second matriarch\)/i, /entire book is their relationship/i],
  },
  {
    id: "book8-claim-timeline-mid-late-1600s-pre-french",
    description:
      "Chronology is set from the 1650s through late 1680s/early 1690s, ending before full French presence.",
    quoteExcerpt: "Opening: 1650s-1660s ... Ending: late 1680s/early 1690s (just before French presence becomes real).",
    confidence: 5,
    requiredPatterns: [/opening:\s*~?1650s/i, /ending:\s*late 1680s/i, /before french presence becomes real/i],
  },
  {
    id: "book8-claim-younger-daughter-leadership-arc",
    description:
      "Key design choice: daughter is not firstborn, creating observational leadership development rather than direct heir training.",
    quoteExcerpt: "The daughter is not the firstborn ... 3rd or 4th child ... more perceptive than everyone else.",
    confidence: 4,
    requiredPatterns: [/daughter is not the firstborn/i, /3rd or 4th child/i, /more perceptive/i],
  },
];

const CHUNK8_EVENT_SPECS: EventSpec[] = [
  {
    id: "book8-event-book1-opening-1650s-1660s",
    title: "Book 1 Opening Window (1650s-1660s)",
    eventType: EventType.CULTURAL,
    startYear: 1650,
    description: "Narrative opening frame during stable pre-disruption Red River system conditions.",
    requiredPatterns: [/opening:\s*~?1650s/i],
  },
  {
    id: "book8-event-book1-main-body-1660s-1680s",
    title: "Book 1 Main Body Window (1660s-1680s)",
    eventType: EventType.CULTURAL,
    startYear: 1660,
    description: "Primary developmental arc for mother-daughter matriarchal transfer and system learning.",
    requiredPatterns: [/main body:\s*~?1660s/i],
  },
  {
    id: "book8-event-book1-ending-pre-french-threshold",
    title: "Book 1 Ending Threshold (Late 1680s-Early 1690s)",
    eventType: EventType.POLITICAL,
    startYear: 1688,
    description: "Closing threshold where external colonial pressure becomes imminent but not yet dominant.",
    requiredPatterns: [/ending:\s*late 1680s/i, /early 1690s/i],
  },
];

const CHUNK8_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book8-place-red-river-matriarchal-origin-stage",
    name: "Red River Matriarchal Origin Stage",
    description:
      "Primary narrative stage for maternal governance, kinship transfer, and bridge-lineage emergence before major disruption.",
    placeType: PlaceType.RIVER,
    sourceTraceNote: "Chunk8 story-design stage anchor for Book 1.",
    requiredPatterns: [/fully alive red river system/i, /book 1/i],
  },
];

const CHUNK8_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book8-frag-balance-before-disruption-design-law",
    title: "Balance Before Disruption Design Law",
    text:
      "Book 1 must render a fully functioning world first so later disruption reads as consequential rather than cosmetic.",
    summary: "Macro-structure constraint for Book 1 pacing.",
    confidence: 5,
    requiredPatterns: [/before disruption/i, /makes everything later matter/i],
  },
  {
    id: "book8-frag-mother-to-daughter-power-transfer",
    title: "Mother-to-Daughter Power Transfer Arc",
    text:
      "Authority transfer should move from embodied system memory (mother) to adaptive system evolution (daughter) through relationship-driven scenes.",
    summary: "Character-arc transfer constraint.",
    confidence: 5,
    requiredPatterns: [/mother.*first matriarch/i, /daughter.*second matriarch/i, /relationship/i],
  },
  {
    id: "book8-frag-observer-child-perception-advantage",
    title: "Observer Child Perception Advantage",
    text:
      "Non-heir positioning creates observational bandwidth; leadership emergence is built from accumulated pattern-reading, not title inheritance.",
    summary: "Leadership-emergence constraint.",
    confidence: 4,
    requiredPatterns: [/not the firstborn/i, /watches instead of being trained directly/i],
  },
];

const CHUNK8_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book8-oq-mother-scenes-system-demonstration",
    title: "Which scene set best demonstrates the mother as system-in-human-form without reducing her to exposition?",
    description:
      "Needed to preserve cinematic character depth while establishing governance mechanics.",
  },
  {
    id: "book8-oq-daughter-transition-loss-markers",
    title: "What specific loss and responsibility markers trigger the daughter’s transition into second matriarch leadership?",
    description:
      "Needed to make the arc legible and earned across the 1660s-1680s timeline.",
  },
  {
    id: "book8-oq-pre-french-ending-threshold-design",
    title: "Which closing signals best indicate approaching French pressure without collapsing Book 1 into colonial-contact narrative too early?",
    description:
      "Needed to hit the designed threshold ending while preserving Book 1’s internal-world focus.",
  },
];

const CHUNK9_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book9-claim-three-generation-census-aligned-lineage",
    description:
      "The lineage is explicitly designed as a three-generation matriarchal line aligned to a 1653-1687 census world model.",
    quoteExcerpt: "Map your three-generation matriarchal line inside the 1653 -> 1687 census world.",
    confidence: 5,
    requiredPatterns: [/three-generation lineage/i, /1653.*1687 census world/i],
  },
  {
    id: "book9-claim-gen1-high-density-balance-world",
    description:
      "Generation 1 operates inside a dense, high-redundancy network where system stability precedes visible fracture.",
    quoteExcerpt: "She is born into a fully functioning, high-density network.",
    confidence: 4,
    requiredPatterns: [/generation 1/i, /fully functioning, high-density network/i],
  },
  {
    id: "book9-claim-gen2-thinning-network-active-maintenance",
    description:
      "Generation 2 lives through network thinning and must actively maintain ties that prior density once maintained automatically.",
    quoteExcerpt: "She grows up in a thinning but still functional network ... She must actively maintain connections.",
    confidence: 5,
    requiredPatterns: [/thinning but still functional network/i, /actively maintain connections/i],
  },
  {
    id: "book9-claim-matrilineal-relational-placement",
    description:
      "Marriage and alliance entry are framed as relational placement through matrilineal network logic rather than primarily romantic selection.",
    quoteExcerpt: "She is not chosen romantically first ... She is placed relationally.",
    confidence: 4,
    requiredPatterns: [/placed relationally/i, /matrilineal kin network/i],
  },
  {
    id: "book9-claim-pandemic-thinning-first-fracture",
    description:
      "The 1661-1662 pandemic thinning is treated as the first visible system fracture and a trigger for lineage transition.",
    quoteExcerpt: "Death (1661-1662 Pandemic Event) ... the first visible fracture in the system.",
    confidence: 4,
    requiredPatterns: [/1661.?1662 pandemic/i, /first visible fracture/i],
  },
];

const CHUNK9_EVENT_SPECS: EventSpec[] = [
  {
    id: "book9-event-gen1-activity-window-1653-1662",
    title: "Generation 1 Active Window (1653-1662)",
    eventType: EventType.FAMILY,
    startYear: 1653,
    description: "First matriarch active window in high-density network conditions.",
    requiredPatterns: [/born 1637/i, /active 1653.?1662/i],
  },
  {
    id: "book9-event-pandemic-fracture-1661-1662",
    title: "Pandemic Fracture Window (1661-1662)",
    eventType: EventType.CULTURAL,
    startYear: 1661,
    description: "Population thinning event that introduces the first visible structural fracture.",
    requiredPatterns: [/1661.?1662 pandemic/i, /population thinning/i],
  },
  {
    id: "book9-event-gen2-activity-window-1662-1687",
    title: "Generation 2 Active Window (1662-1687)",
    eventType: EventType.FAMILY,
    startYear: 1662,
    description: "Second matriarch transition arc through thinning but functional network conditions.",
    requiredPatterns: [/born 1656/i, /active 1662.?1687/i],
  },
];

const CHUNK9_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book9-place-census-aligned-red-river-lineage-grid",
    name: "Census-Aligned Red River Lineage Grid",
    description:
      "Narrative operating map tying lineage decisions to nearby populations, settlement density, and relationship exposure realities.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk9 census-aligned lineage stage anchor.",
    requiredPatterns: [/census-aligned/i, /where they are/i, /who is around them/i],
  },
];

const CHUNK9_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book9-frag-density-to-thinning-transition-law",
    title: "Density to Thinning Transition Law",
    text:
      "Book 1 lineage continuity must show structural shift from high-density redundancy to thinning-node dependence without abrupt world-model collapse.",
    summary: "Macro-continuity constraint for census-phase transitions.",
    confidence: 5,
    requiredPatterns: [/high-density network/i, /thinning but still functional network/i],
  },
  {
    id: "book9-frag-observer-middle-child-bridge-emergence",
    title: "Observer Middle-Child Bridge Emergence",
    text:
      "Leadership credibility emerges through observation-first development and distributed kin training, not direct primogeniture preparation.",
    summary: "Leadership-emergence constraint.",
    confidence: 4,
    requiredPatterns: [/middle child/i, /observer of everything/i, /not initially trained as leader/i],
  },
  {
    id: "book9-frag-relationship-value-under-thinning-pressure",
    title: "Relationship Value Under Thinning Pressure",
    text:
      "As nodes thin, each tie carries higher systemic weight; conflict and trade scenes should reflect increased relational stakes per connection.",
    summary: "Relational-pressure constraint.",
    confidence: 4,
    requiredPatterns: [/increased importance of each relationship/i, /fewer people in each node/i],
  },
];

const CHUNK9_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book9-oq-census-number-source-audit",
    title: "Which source chain supports each population figure used in the 1653-1687 census-aligned model?",
    description:
      "Needed to separate anchored historical estimates from interpretive narrative scaffolding.",
  },
  {
    id: "book9-oq-pandemic-impact-localization",
    title: "How did pandemic thinning impacts vary across Natchitoches, Yatasi, and Doustioni local clusters?",
    description:
      "Needed for non-uniform loss portrayal and realistic transition dynamics.",
  },
  {
    id: "book9-oq-gen2-bridge-training-scenes",
    title: "Which concrete scenes best show observer-to-bridge development across childhood, post-loss kin training, and early mediation?",
    description:
      "Needed to convert lineage architecture into emotionally legible cinematic progression.",
  },
];

const CHUNK10_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book10-claim-observer-position-learning",
    description:
      "The focal child’s observer positioning is framed as intentional edge-of-circle learning rather than formal inclusion.",
    quoteExcerpt: "Not close enough to be called. Not far enough to miss anything.",
    confidence: 5,
    requiredPatterns: [/not close enough to be called/i, /not far enough to miss anything/i],
  },
  {
    id: "book10-claim-mediator-positional-listening",
    description:
      "The mother’s mediating authority is conveyed through physical placement optimized for bilateral listening and non-dominating influence.",
    quoteExcerpt: "In the place where someone could hear both sides without turning.",
    confidence: 5,
    requiredPatterns: [/hear both sides without turning/i],
  },
  {
    id: "book10-claim-bundle-ritualized-claim-timing",
    description:
      "Shared bundle placement functions as a procedural object that delays individual claim until relational timing is collectively acceptable.",
    quoteExcerpt:
      "A bundle lay between them... placed where everyone could see it and no one could claim it until the moment was right.",
    confidence: 4,
    requiredPatterns: [/bundle lay between them/i, /no one could claim it until the moment was right/i],
  },
  {
    id: "book10-claim-soft-voice-space-widening-deescalation",
    description:
      "De-escalation occurs through reframing language that widens responsibility attribution instead of escalating direct blame.",
    quoteExcerpt:
      "The words moved through the group... not as a challenge. As a widening.",
    confidence: 4,
    requiredPatterns: [/not as a challenge/i, /as a widening/i],
  },
  {
    id: "book10-claim-micro-movement-conflict-shift",
    description:
      "A minimal embodied intervention by the mother changes interaction dynamics without overt command or volume increase.",
    quoteExcerpt:
      "She simply adjusted her position... and in that small movement, something changed.",
    confidence: 5,
    requiredPatterns: [/adjusted her position/i, /small movement.*something changed/i],
  },
];

const CHUNK10_EVENT_SPECS: EventSpec[] = [];

const CHUNK10_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book10-place-firelight-council-edge",
    name: "Firelight Council Edge",
    description:
      "Night mediation setting outside residential cluster where low-volume bilateral dispute handling and procedural object placement occur.",
    placeType: PlaceType.FIELD,
    sourceTraceNote: "Chunk10 scene anchor: edge-of-light council mediation space.",
    requiredPatterns: [/firelight/i, /far enough from the houses/i, /edge of the light/i],
  },
];

const CHUNK10_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book10-frag-nonforcing-mediation-technique",
    title: "Non-Forcing Mediation Technique",
    text:
      "Effective mediation can proceed through breath pacing, silence, and position rather than overt verbal dominance.",
    summary: "Mediation-method constraint for character-consistent scenes.",
    confidence: 5,
    requiredPatterns: [/she breathed/i, /slow\.?\s*even/i, /small movement/i],
  },
  {
    id: "book10-frag-face-reading-as-truth-channel",
    title: "Face Reading as Truth Channel",
    text:
      "In high-tension negotiation scenes, face response and body shift are primary truth channels when explicit speech is partial or strategic.",
    summary: "Perception-channel constraint.",
    confidence: 4,
    requiredPatterns: [/watched the faces/i, /truth lived/i],
  },
  {
    id: "book10-frag-observer-to-bridge-formation",
    title: "Observer-to-Bridge Formation",
    text:
      "Bridge leadership emerges from repeated edge-position observation of procedural, emotional, and relational dynamics before formal authority transfer.",
    summary: "Developmental-arc constraint.",
    confidence: 4,
    requiredPatterns: [/she was not meant to be there/i, /needed to/i, /shape of the moment/i],
  },
];

const CHUNK10_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book10-oq-mediation-procedure-sequence",
    title: "What procedural sequence governs who speaks, when objects are acknowledged, and when settlement terms become claimable?",
    description:
      "Needed to keep future mediation scenes legally and culturally coherent.",
  },
  {
    id: "book10-oq-child-observer-thresholds",
    title: "What social thresholds distinguish tolerated observer presence from prohibited participation for children in council-like settings?",
    description:
      "Needed to preserve realism in repeated observer-learning beats.",
  },
  {
    id: "book10-oq-silence-positional-cues-codification",
    title: "Which silence and positional cues are culturally legible as de-escalation signals across groups?",
    description:
      "Needed for consistent nonverbal conflict-resolution writing across chapters.",
  },
];

const CHUNK11_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book11-claim-held-house-transition-state",
    description:
      "The house is framed as held (not empty, not still) during transition, signaling collective containment rather than collapse.",
    quoteExcerpt: "Not empty. Not still. But quiet in a way that felt held.",
    confidence: 5,
    requiredPatterns: [/not empty/i, /not still/i, /felt held/i],
  },
  {
    id: "book11-claim-watching-as-identified-role",
    description:
      "The child’s role is explicitly identified as watcher, establishing observerhood as sanctioned succession preparation.",
    quoteExcerpt: "You are watching... Good.",
    confidence: 5,
    requiredPatterns: [/you are watching/i, /good\./i],
  },
  {
    id: "book11-claim-placement-over-instruction",
    description:
      "Transfer language is framed as relational placement rather than didactic instruction or warning.",
    quoteExcerpt: "Not instruction. Not warning. Placement.",
    confidence: 5,
    requiredPatterns: [/not instruction/i, /not warning/i, /placement/i],
  },
  {
    id: "book11-claim-aunt-co-witness-continuity",
    description:
      "An aunt functions as steady co-witness and continuity anchor through small necessary movements and nonverbal completion cues.",
    quoteExcerpt:
      "Her aunt knelt beside her... small movements... a look that passed between them... the aunt nodded once.",
    confidence: 4,
    requiredPatterns: [/her aunt knelt beside her/i, /small movements/i, /aunt nodded once/i],
  },
  {
    id: "book11-claim-river-constancy-during-loss",
    description:
      "River continuity is used as structural counterpoint to household mortality, reinforcing system persistence across personal rupture.",
    quoteExcerpt: "The river moved, the same as it always had, its presence steady beneath everything else.",
    confidence: 4,
    requiredPatterns: [/river moved, the same as it always had/i, /steady beneath everything else/i],
  },
];

const CHUNK11_EVENT_SPECS: EventSpec[] = [];

const CHUNK11_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book11-place-hearthside-succession-house",
    name: "Hearthside Succession House",
    description:
      "Interior hearth setting where final speech, witness positioning, and matriarchal transfer cues are enacted.",
    placeType: PlaceType.HOME,
    sourceTraceNote: "Chunk11 scene anchor: household succession interior.",
    requiredPatterns: [/she sat near the hearth/i, /inside the house/i],
  },
];

const CHUNK11_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book11-frag-receive-dont-force-threshold",
    title: "Receive-Do-Not-Force Threshold",
    text:
      "At succession thresholds, legitimacy comes from holding position and receiving transmission rather than acting to control the moment.",
    summary: "Succession-behavior constraint.",
    confidence: 5,
    requiredPatterns: [/this was not a moment to change/i, /only to receive/i],
  },
  {
    id: "book11-frag-succession-through-attention",
    title: "Succession Through Attention",
    text:
      "Attention discipline (breath, stillness, face reading, interval listening) functions as a training channel for emergent leadership.",
    summary: "Observer-discipline constraint.",
    confidence: 4,
    requiredPatterns: [/listening for it/i, /she held her place/i, /watched/i],
  },
  {
    id: "book11-frag-nonverbal-relational-completion",
    title: "Nonverbal Relational Completion",
    text:
      "Critical transfer steps may complete through eye contact and shared recognition rather than explicit declarative speech.",
    summary: "Subtext-transfer constraint.",
    confidence: 4,
    requiredPatterns: [/look that passed between them/i, /understood without needing to be spoken/i],
  },
];

const CHUNK11_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book11-oq-succession-ritual-protocol",
    title: "What formal or semi-formal succession protocol governs witness roles, final speech rights, and household participation order?",
    description:
      "Needed to align future transfer scenes with coherent ritual/legal expectations.",
  },
  {
    id: "book11-oq-aunt-authority-scope",
    title: "What authority scope does the aunt hold during and after matriarchal transition events?",
    description:
      "Needed to model continuity governance accurately across generations.",
  },
  {
    id: "book11-oq-observer-child-to-acting-bridge-timing",
    title: "When does observer role convert to active bridge authority, and what validates that shift?",
    description:
      "Needed for credible progression from witnessing to decision-bearing leadership.",
  },
];

const CHUNK12_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book12-claim-staggered-arrival-governance-signal",
    description:
      "The gathering is structured through staggered multi-directional arrivals, signaling distributed authority and negotiated entry rather than centralized summons.",
    quoteExcerpt: "They did not gather all at once. They arrived... from different directions, at different times.",
    confidence: 5,
    requiredPatterns: [/did not gather all at once/i, /from different directions/i, /different times/i],
  },
  {
    id: "book12-claim-known-unmarked-path-network",
    description:
      "Unmarked but mutually known paths indicate an embedded relational network infrastructure rather than formalized route signage.",
    quoteExcerpt: "None were marked. All were known.",
    confidence: 4,
    requiredPatterns: [/none were marked/i, /all were known/i],
  },
  {
    id: "book12-claim-second-matriarch-edge-position-authority",
    description:
      "The second matriarch exerts authority from edge-position steadiness, neither advancing nor retreating, while reading group-entry behavior.",
    quoteExcerpt: "She did not step forward. She did not retreat. She held her place.",
    confidence: 5,
    requiredPatterns: [/held her place/i, /did not step forward/i, /did not retreat/i],
  },
  {
    id: "book12-claim-weight-recognition-transition-capacity",
    description:
      "Naming collective 'weight' marks the second matriarch’s transition toward system-level perception and burden recognition.",
    quoteExcerpt: "\"What is it?\" ... \"Weight,\" she said.",
    confidence: 4,
    requiredPatterns: [/what is it/i, /weight/i],
  },
  {
    id: "book12-claim-attention-crosspoint-entry-power",
    description:
      "A new actor’s power is marked by taking position where attention lines cross, with others making space without explicit command.",
    quoteExcerpt: "making space without being asked ... where the lines of attention crossed.",
    confidence: 5,
    requiredPatterns: [/making space without being asked/i, /lines of attention crossed/i],
  },
];

const CHUNK12_EVENT_SPECS: EventSpec[] = [];

const CHUNK12_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book12-place-river-overlook-convergence-clearing",
    name: "River Overlook Convergence Clearing",
    description:
      "Semi-set-apart elevated clearing above river used for multi-group convergence, spacing negotiation, and relational signal reading.",
    placeType: PlaceType.FIELD,
    sourceTraceNote: "Chunk12 convergence setting anchor.",
    requiredPatterns: [/clearing sat above the river/i, /paths fed into it from all sides/i],
  },
];

const CHUNK12_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book12-frag-entry-pattern-reading-protocol",
    title: "Entry Pattern Reading Protocol",
    text:
      "Group spacing, speech volume, and arrival shape are treated as pre-verbal political signals that must be read before formal negotiation.",
    summary: "Convergence-scene interpretation constraint.",
    confidence: 5,
    requiredPatterns: [/each group entered differently/i, /some came close together/i, /others spread slightly/i],
  },
  {
    id: "book12-frag-balanced-not-crowded-assembly-law",
    title: "Balanced-Not-Crowded Assembly Law",
    text:
      "Legitimate assembly is conveyed through relational balance rather than density; spatial equilibrium indicates retained system order under stress.",
    summary: "Spatial-order constraint.",
    confidence: 4,
    requiredPatterns: [/not crowded/i, /balanced/i],
  },
  {
    id: "book12-frag-inward-shift-power-recognition",
    title: "Inward-Shift Power Recognition",
    text:
      "High-status entry is signaled by inward attention compression and voluntary accommodation rather than overt declaration.",
    summary: "Power-recognition cue constraint.",
    confidence: 4,
    requiredPatterns: [/it moved inward/i, /making space without being asked/i],
  },
];

const CHUNK12_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book12-oq-convergence-entry-order-rules",
    title: "What norms govern arrival order, spacing, and speaking thresholds in multi-group convergence gatherings?",
    description:
      "Needed for procedural consistency across future council-convergence scenes.",
  },
  {
    id: "book12-oq-attention-crosspoint-authority-legibility",
    title: "Which behavioral cues make crosspoint authority legible without formal title declaration?",
    description:
      "Needed to keep emergent-power scenes coherent and culturally grounded.",
  },
  {
    id: "book12-oq-second-matriarch-recognition-arc",
    title: "What sequence of moments validates the second matriarch’s shift from watcher to recognized system-holder in public gatherings?",
    description:
      "Needed to stage progression from interior perception to external legitimacy.",
  },
];

const CHUNK13_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book13-claim-house-as-thermal-memory-system",
    description:
      "The house is portrayed as a thermal-memory system that holds and redistributes heat, scent, and labor traces across time.",
    quoteExcerpt:
      "The house held heat differently ... it settled into the walls, into the ground, into the objects that lived there.",
    confidence: 5,
    requiredPatterns: [/house held heat differently/i, /settled into the walls/i],
  },
  {
    id: "book13-claim-hearth-maintenance-over-feeding",
    description:
      "Fire practice is framed as maintenance discipline, not fuel-maximizing intensity, with micro-adjustments rather than forceful intervention.",
    quoteExcerpt: "The fire was not something to feed. It was something to maintain.",
    confidence: 5,
    requiredPatterns: [/not something to feed/i, /something to maintain/i],
  },
  {
    id: "book13-claim-placement-not-random-arrangement",
    description:
      "Domestic order is described as intentional placement shaped by repeated use rather than decorative arrangement.",
    quoteExcerpt: "Nothing was arranged. Everything was placed.",
    confidence: 5,
    requiredPatterns: [/nothing was arranged/i, /everything was placed/i],
  },
  {
    id: "book13-claim-productive-motion-norm",
    description:
      "The household enforces a norm of productive motion where idle stillness is corrected and labor rhythm marks belonging.",
    quoteExcerpt: "\"Stir,\" she said ... The word was not instruction. It was correction.",
    confidence: 5,
    requiredPatterns: [/stir/i, /not instruction.*correction/i],
  },
  {
    id: "book13-claim-sensory-literacy-as-training-channel",
    description:
      "Training occurs through sensory literacy (texture, heat, smell, rhythm) and embodied repetition rather than abstract explanation.",
    quoteExcerpt:
      "Ground corn and water ... thick ... beginning to shift ... the clay was warm to the touch.",
    confidence: 4,
    requiredPatterns: [/ground corn and water/i, /warm to the touch/i, /beginning to shift/i],
  },
];

const CHUNK13_EVENT_SPECS: EventSpec[] = [];

const CHUNK13_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book13-place-hearth-centered-household-workspace",
    name: "Hearth-Centered Household Workspace",
    description:
      "Curved-pole, cane-clay domestic interior organized around a low central hearth and continuous productive rhythm.",
    placeType: PlaceType.HOME,
    sourceTraceNote: "Chunk13 domestic-system setting anchor.",
    requiredPatterns: [/hearth sat low at the center/i, /woven cane/i, /sealed.*clay/i],
  },
];

const CHUNK13_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book13-frag-maintenance-not-force-house-law",
    title: "Maintenance-Not-Force House Law",
    text:
      "Core household systems remain stable through small continuous adjustments rather than episodic force.",
    summary: "Domestic governance constraint.",
    confidence: 5,
    requiredPatterns: [/nothing here was forced/i, /just enough/i],
  },
  {
    id: "book13-frag-no-wasted-motion-sound-discipline",
    title: "No-Wasted-Motion Discipline",
    text:
      "Labor legitimacy is encoded in efficient motion and contained sound; waste marks misalignment with house order.",
    summary: "Embodied-discipline constraint.",
    confidence: 4,
    requiredPatterns: [/no wasted motion/i, /no wasted sound/i],
  },
  {
    id: "book13-frag-correction-as-placement",
    title: "Correction as Placement",
    text:
      "Corrective speech places the learner back into system rhythm; authority is enacted through alignment, not volume.",
    summary: "Training interaction constraint.",
    confidence: 4,
    requiredPatterns: [/word was not instruction/i, /it was correction/i, /did not belong here/i],
  },
];

const CHUNK13_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book13-oq-household-labor-rotation",
    title: "What labor rotation rules determine who tends fire, grain, sorting, and repair work across age and status?",
    description:
      "Needed for continuity in domestic scenes and role assignment realism.",
  },
  {
    id: "book13-oq-correction-thresholds-for-novices",
    title: "What thresholds trigger correction versus silent observation in novice household training?",
    description:
      "Needed to calibrate authority tone and learning progression.",
  },
  {
    id: "book13-oq-material-repair-cycle-seasonality",
    title: "How often are cane/clay wall repairs and hearth adjustments made across seasonal cycles?",
    description:
      "Needed to ground environmental wear-and-maintenance detail in recurring practice.",
  },
];

const CHUNK14_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book14-claim-low-signature-fire-design",
    description:
      "Fire configuration is intentionally low-signature (coal-heavy, low-flame) to minimize distant visibility while preserving close-range utility.",
    quoteExcerpt:
      "The fire was not meant to be seen from far away ... more coal than flame, more glow than brightness.",
    confidence: 5,
    requiredPatterns: [/not meant to be seen from far away/i, /more coal than flame/i],
  },
  {
    id: "book14-claim-observer-position-selection-discipline",
    description:
      "Observer intelligence depends on deliberate body-position and silhouette control to gather signal without drawing notice.",
    quoteExcerpt:
      "She had chosen this place carefully ... not forward ... forward would break her outline.",
    confidence: 5,
    requiredPatterns: [/chosen this place carefully/i, /break her outline/i],
  },
  {
    id: "book14-claim-listen-before-look-method",
    description:
      "Meaning extraction begins with listening (tone, spacing, breath) prior to visual confirmation.",
    quoteExcerpt: "She listened first. Before she looked. ... Tone. Spacing. Breath. That was where meaning lived.",
    confidence: 5,
    requiredPatterns: [/she listened first/i, /tone/i, /spacing/i, /breath/i],
  },
  {
    id: "book14-claim-movement-over-face-reading",
    description:
      "Under constrained light, movement-pattern reading substitutes for facial interpretation and remains decision-relevant.",
    quoteExcerpt: "Faces were harder ... But she did not need faces. She watched movement.",
    confidence: 4,
    requiredPatterns: [/faces were harder/i, /did not need faces/i, /watched movement/i],
  },
  {
    id: "book14-claim-preverbal-authority-control",
    description:
      "Authority is legible before speech through interruption suppression and group behavioral accommodation.",
    quoteExcerpt: "The woman did not speak immediately ... she controlled the space ... no one interrupted her.",
    confidence: 5,
    requiredPatterns: [/did not speak immediately/i, /controlled the space/i, /no one interrupted her/i],
  },
];

const CHUNK14_EVENT_SPECS: EventSpec[] = [];

const CHUNK14_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book14-place-low-signature-forest-clearing",
    name: "Low-Signature Forest Clearing",
    description:
      "Depressed fire pit council edge where acoustic containment, light discipline, and silhouette management shape conflict observation.",
    placeType: PlaceType.FIELD,
    sourceTraceNote: "Chunk14 stealth-observation setting anchor.",
    requiredPatterns: [/shallow depression/i, /just beyond that light/i, /trees/i],
  },
];

const CHUNK14_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book14-frag-signature-management-protocol",
    title: "Signature Management Protocol",
    text:
      "Councils under risk use heat/light/acoustic controls to reduce detectability while retaining enough signal for internal coordination.",
    summary: "Operational stealth constraint.",
    confidence: 5,
    requiredPatterns: [/voices did not travel/i, /not meant to be seen from far away/i],
  },
  {
    id: "book14-frag-edge-observer-intelligence-discipline",
    title: "Edge Observer Intelligence Discipline",
    text:
      "Edge-position observers prioritize auditory and kinetic cues, preserving concealment while extracting high-value relational signals.",
    summary: "Observer tradecraft constraint.",
    confidence: 4,
    requiredPatterns: [/just beyond that light/i, /she listened first/i, /watched movement/i],
  },
  {
    id: "book14-frag-preverbal-power-recognition",
    title: "Preverbal Power Recognition",
    text:
      "Power enters the scene before speech through interruption patterns, body stillness, and collective self-limitation.",
    summary: "Authority-legibility constraint.",
    confidence: 4,
    requiredPatterns: [/controlled the space/i, /no one interrupted her/i],
  },
];

const CHUNK14_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book14-oq-low-signature-council-standards",
    title: "What material and procedural standards define low-signature council setup across terrain types?",
    description:
      "Needed to keep stealth gathering scenes operationally consistent.",
  },
  {
    id: "book14-oq-observer-role-authorization-boundaries",
    title: "When is edge observation tolerated versus sanctioned in sensitive gatherings?",
    description:
      "Needed to govern watcher participation realism and risk consequences.",
  },
  {
    id: "book14-oq-preverbal-authority-cue-catalog",
    title: "Which nonverbal cues most reliably indicate authority before speech in this system?",
    description:
      "Needed for consistent power-legibility writing under low-visibility conditions.",
  },
];

const CHUNK15_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book15-claim-held-fire-state-for-transition",
    description:
      "The fire is managed in a held state (neither extinguished nor actively fed), signaling controlled transition conditions.",
    quoteExcerpt: "Not allowed to die. Not fed. Held.",
    confidence: 5,
    requiredPatterns: [/not allowed to die/i, /not fed/i, /held/i],
  },
  {
    id: "book15-claim-death-recognized-through-absence-pattern",
    description:
      "Death is recognized through patterned absence (no breath movement, no heat carry) rather than immediate declaration.",
    quoteExcerpt: "The breathing she had been measuring ... was no longer there.",
    confidence: 5,
    requiredPatterns: [/breathing.*no longer there/i, /knew before she turned/i],
  },
  {
    id: "book15-claim-environmental-cue-literacy-in-loss",
    description:
      "The second matriarch reads environmental micro-cues (air weight, scent shift, mat temperature) as part of transition awareness.",
    quoteExcerpt: "The air had changed ... lighter ... emptier ... The smell of the house had shifted.",
    confidence: 4,
    requiredPatterns: [/air had changed/i, /lighter/i, /emptier/i, /smell.*shifted/i],
  },
  {
    id: "book15-claim-presence-to-nonpresence-threshold",
    description:
      "Narrative marks a threshold from subtle living presence to inert existence via absence of movement and warmth transfer.",
    quoteExcerpt: "Before ... there had been movement ... Now ... Nothing.",
    confidence: 5,
    requiredPatterns: [/there had been movement/i, /now.*nothing/i],
  },
  {
    id: "book15-claim-grounded-steady-response-pattern",
    description:
      "Initial response behavior is grounded and procedural (listen, verify, move slowly), not performative panic.",
    quoteExcerpt: "She did not move at first. She listened.",
    confidence: 4,
    requiredPatterns: [/did not move at first/i, /she listened/i],
  },
];

const CHUNK15_EVENT_SPECS: EventSpec[] = [];

const CHUNK15_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book15-place-pre-dawn-hearth-transition-house",
    name: "Pre-Dawn Hearth Transition House",
    description:
      "Pre-dawn domestic interior where death recognition occurs through sensory continuity checks and controlled household rhythm.",
    placeType: PlaceType.HOME,
    sourceTraceNote: "Chunk15 death-recognition scene anchor.",
    requiredPatterns: [/woke before the light/i, /house held quiet/i, /coals sat close together/i],
  },
];

const CHUNK15_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book15-frag-absence-detection-protocol",
    title: "Absence Detection Protocol",
    text:
      "Critical transitions are detected by disciplined attention to missing rhythms (breath, warmth, micro-motion) before overt communal response.",
    summary: "Death-recognition constraint.",
    confidence: 5,
    requiredPatterns: [/measuring for days/i, /no longer there/i, /difference/i],
  },
  {
    id: "book15-frag-held-quiet-continuity-law",
    title: "Held Quiet Continuity Law",
    text:
      "Household continuity under loss is maintained by held quiet and controlled heat rather than abrupt symbolic rupture.",
    summary: "Continuity-under-loss constraint.",
    confidence: 4,
    requiredPatterns: [/house held quiet/i, /coals.*thin layer of ash/i],
  },
  {
    id: "book15-frag-slow-verification-before-action",
    title: "Slow Verification Before Action",
    text:
      "Legitimate authority response proceeds via slow verification and embodied confirmation before speech or broader coordination.",
    summary: "Response sequencing constraint.",
    confidence: 4,
    requiredPatterns: [/moved closer/i, /hand hovered/i, /lowered her fingers/i],
  },
];

const CHUNK15_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book15-oq-household-death-procedure-order",
    title: "What is the procedural order after first recognition of death in the household?",
    description:
      "Needed to stage next-scene actions (notification, preparation, witness order) coherently.",
  },
  {
    id: "book15-oq-fire-state-symbolism-vs-practice",
    title: "How does held-fire protocol function both practically and symbolically during transition periods?",
    description:
      "Needed to align material practice with ritual meaning without over-abstracting.",
  },
  {
    id: "book15-oq-second-matriarch-first-command-moment",
    title: "What moment marks the second matriarch’s first explicit command after recognition?",
    description:
      "Needed to define the shift from witness-recognition to active leadership authority.",
  },
];

const CHUNK16_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book16-claim-held-clearing-shared-stewardship",
    description:
      "The gathering site is framed as shared, held ground rather than proprietary territory, enabling multi-group coexistence.",
    quoteExcerpt: "The land did not belong to anyone. That was why it held them all.",
    confidence: 5,
    requiredPatterns: [/land did not belong to anyone/i, /held them all/i],
  },
  {
    id: "book16-claim-arranged-group-spacing-governance",
    description:
      "Group formation and inter-group distance operate as governance signals; spacing itself carries political meaning.",
    quoteExcerpt: "The spacing between groups mattered most ... The distance itself held meaning.",
    confidence: 5,
    requiredPatterns: [/spacing between groups mattered most/i, /distance itself held meaning/i],
  },
  {
    id: "book16-claim-multi-path-unmarked-network",
    description:
      "Multiple unmarked but visible paths indicate adaptive network memory across regular, occasional, and seasonal routes.",
    quoteExcerpt: "Paths entered from every direction ... Not marked ... But visible.",
    confidence: 4,
    requiredPatterns: [/paths entered from every direction/i, /not marked/i, /but visible/i],
  },
  {
    id: "book16-claim-distributed-low-fire-assembly-pattern",
    description:
      "Assembly uses multiple low controlled fires instead of a single center, distributing attention and reducing singular authority cues.",
    quoteExcerpt: "Not one central flame. Many. Each low. Each controlled.",
    confidence: 5,
    requiredPatterns: [/not one central flame/i, /each low/i, /each controlled/i],
  },
  {
    id: "book16-claim-clarity-delayed-as-procedure",
    description:
      "Environmental softening (smoke diffusion, layered sound) is treated as procedural delay, making immediate clarity intentionally unavailable.",
    quoteExcerpt: "Clarity was not meant to come quickly here.",
    confidence: 4,
    requiredPatterns: [/smoke drifted upward/i, /clarity was not meant to come quickly here/i],
  },
];

const CHUNK16_EVENT_SPECS: EventSpec[] = [];

const CHUNK16_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book16-place-held-multi-group-clearing",
    name: "Held Multi-Group Clearing",
    description:
      "Slightly raised convergence ground with distributed entry paths and layered fire/smoke conditions for negotiated assembly.",
    placeType: PlaceType.FIELD,
    sourceTraceNote: "Chunk16 spatial-governance assembly anchor.",
    requiredPatterns: [/clearing stretched wider/i, /ground rose slightly at the center/i],
  },
];

const CHUNK16_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book16-frag-spacing-as-diplomatic-language",
    title: "Spacing as Diplomatic Language",
    text:
      "Inter-group distance, intra-group formation, and entry posture function as pre-verbal diplomatic language in assembly spaces.",
    summary: "Spatial diplomacy constraint.",
    confidence: 5,
    requiredPatterns: [/arranged/i, /distance itself held meaning/i],
  },
  {
    id: "book16-frag-distributed-attention-management",
    title: "Distributed Attention Management",
    text:
      "Multiple low fires and non-dominant sound layering keep attention distributed, preventing premature center capture.",
    summary: "Attention-governance constraint.",
    confidence: 4,
    requiredPatterns: [/none dominated/i, /not one central flame/i],
  },
  {
    id: "book16-frag-entry-pause-awareness-protocol",
    title: "Entry Pause Awareness Protocol",
    text:
      "Legitimate entry requires pause-and-read behavior at the edge, prioritizing environmental and relational awareness over immediacy.",
    summary: "Entry-sequencing constraint.",
    confidence: 4,
    requiredPatterns: [/paused at the edge/i, /not from hesitation/i, /not a space to enter without awareness/i],
  },
];

const CHUNK16_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book16-oq-spacing-threshold-codes",
    title: "What spacing thresholds map to alliance, neutrality, and tension states in these assemblies?",
    description:
      "Needed for consistent spatial coding of political relations across scenes.",
  },
  {
    id: "book16-oq-distributed-fire-placement-rules",
    title: "What practical rules govern placement and count of low fires in multi-group gatherings?",
    description:
      "Needed to keep assembly staging materially coherent.",
  },
  {
    id: "book16-oq-path-use-seasonality-signals",
    title: "How do seasonal path changes alter who can arrive, when, and with what relational leverage?",
    description:
      "Needed to connect route ecology with gathering power dynamics.",
  },
];

const CHUNK17_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book17-claim-pov-layering-architecture",
    description:
      "The chunk defines a POV layering architecture with perception channel, decision filter, blind spot, and growth evolution as core scene design primitives.",
    quoteExcerpt:
      "POV LAYERING SYSTEM ... primary perception channel ... decision filter ... blind spot ... growth evolution.",
    confidence: 5,
    requiredPatterns: [/pov layering system/i, /primary perception channel/i, /decision filter/i, /blind spot/i],
  },
  {
    id: "book17-claim-first-matriarch-environmental-integration-mode",
    description:
      "Scene 1 first-matriarch mode is environmental integration: she feels pressure/rhythm/flow/alignment before analytical interpretation.",
    quoteExcerpt:
      "Environmental Integration (She Feels Before She Thinks) ... pressure, rhythm, flow, alignment.",
    confidence: 5,
    requiredPatterns: [/environmental integration/i, /she feels before she thinks/i, /pressure/i, /rhythm/i],
  },
  {
    id: "book17-claim-decision-filter-align-with-existing-rhythm",
    description:
      "Primary decision filter is rhythmic alignment (join vs force), with anti-patterns including disruption initiation and control-seeking.",
    quoteExcerpt:
      "\"Does this align with the existing rhythm?\" ... She enters systems correctly.",
    confidence: 5,
    requiredPatterns: [/align with the existing rhythm/i, /am i forcing, or am i joining/i, /enters systems correctly/i],
  },
  {
    id: "book17-claim-blind-spot-system-failure-invisibility",
    description:
      "Core blind spot is inability to perceive systemic failure or irreversible rupture in the current stage.",
    quoteExcerpt:
      "Cannot perceive system failure ... no framework for true rupture.",
    confidence: 5,
    requiredPatterns: [/cannot perceive system failure/i, /no framework for true rupture/i],
  },
  {
    id: "book17-claim-river-truth-alignment-symbol-lock",
    description:
      "Scene symbol lock ties river to truth/alignment, establishing future stress when systems become unreadable or non-river-like.",
    quoteExcerpt:
      "RIVER = TRUTH / ALIGNMENT ... she will struggle when the system becomes unstable or unreadable.",
    confidence: 4,
    requiredPatterns: [/river = truth/i, /alignment/i, /system becomes unstable/i],
  },
];

const CHUNK17_EVENT_SPECS: EventSpec[] = [];

const CHUNK17_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book17-place-scene1-threshold-alignment-space",
    name: "Scene 1 Threshold Alignment Space",
    description:
      "Perceptual threshold space where identity transition is read through pressure, air, stillness, and movement shifts.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk17 POV-design threshold anchor.",
    requiredPatterns: [/threshold awareness/i, /inside vs outside/i, /before vs after/i],
  },
];

const CHUNK17_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book17-frag-feel-before-think-pov-rule",
    title: "Feel-Before-Think POV Rule",
    text:
      "First-matriarch POV prioritizes body sensation and rhythm before visual detail or abstract interpretation.",
    summary: "Perception-order constraint.",
    confidence: 5,
    requiredPatterns: [/sensory priority stack/i, /body sensation/i, /visual detail.*last/i],
  },
  {
    id: "book17-frag-adjust-not-initiate-behavior-rule",
    title: "Adjust-Not-Initiate Behavior Rule",
    text:
      "Micro-behavior in early scenes must show pausing, mirroring, and adjustment rather than initiation or interpretation rush.",
    summary: "Behavioral POV constraint.",
    confidence: 4,
    requiredPatterns: [/micro-behavioral pov markers/i, /adjusts, not initiates/i, /does not rush to interpret/i],
  },
  {
    id: "book17-frag-internal-language-present-sensory-only",
    title: "Present-Sensory Internal Language",
    text:
      "Internal narration should avoid abstract projection and explanation, favoring present-sensory physical metaphor.",
    summary: "Voice-style constraint.",
    confidence: 4,
    requiredPatterns: [/language style \(internal pov\)/i, /avoid abstract thinking/i, /physical metaphors/i],
  },
];

const CHUNK17_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book17-oq-pov-transition-trigger-map",
    title: "Which specific scene triggers move the first matriarch from stable alignment confidence toward rupture-awareness?",
    description:
      "Needed to sequence blind-spot erosion coherently across later chapters.",
  },
  {
    id: "book17-oq-daughter-pov-layer-contrast-design",
    title: "How should daughter POV layering contrast with first-matriarch mode while preserving lineage continuity?",
    description:
      "Needed to build intergenerational voice distinction without breaking thematic cohesion.",
  },
  {
    id: "book17-oq-pov-marker-validation-checklist",
    title: "What measurable checklist verifies that Scene 1 POV markers are present in each drafted passage?",
    description:
      "Needed for consistent editorial QA of perception/voice mechanics.",
  },
];

const CHUNK18_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book18-claim-scene10-system-bypass-threshold",
    description:
      "Scene 10 is framed as a threshold where system stress escalates from partial failure to apparent bypass of normal response logic.",
    quoteExcerpt:
      "Scene 9: systems can fail. Scene 10: the system itself can be bypassed entirely.",
    confidence: 5,
    requiredPatterns: [/scene 9.*systems can fail/i, /scene 10.*bypassed entirely/i],
  },
  {
    id: "book18-claim-primary-mode-pattern-breakdown-awareness",
    description:
      "Second matriarch child POV mode shifts to pattern-breakdown awareness marked by inability to find stable sequence or response.",
    quoteExcerpt:
      "Pattern Breakdown Awareness ... something that has no pattern at all.",
    confidence: 5,
    requiredPatterns: [/pattern breakdown awareness/i, /no pattern at all/i],
  },
  {
    id: "book18-claim-missing-signals-dominant-perception",
    description:
      "Perception prioritizes absence and distortion of expected signals over overtly visible anomalies.",
    quoteExcerpt: "She reads what is missing more than what is present.",
    confidence: 5,
    requiredPatterns: [/what is missing more than what is present/i],
  },
  {
    id: "book18-claim-authority-limit-recognition",
    description:
      "A core developmental break occurs when authority is seen as uncertain and attempting without full understanding.",
    quoteExcerpt: "Authority = trying, but not knowing.",
    confidence: 5,
    requiredPatterns: [/authority = trying, but not knowing/i, /limits to knowledge/i],
  },
  {
    id: "book18-claim-blindspot-causality-insistence",
    description:
      "Blind spot persists as insistence that a discoverable cause exists, delaying acceptance of invisible or uncontrollable forces.",
    quoteExcerpt: "Still believes there must be a cause ... does not yet accept some forces are invisible and uncontrollable.",
    confidence: 4,
    requiredPatterns: [/there must be a cause/i, /invisible and uncontrollable/i],
  },
];

const CHUNK18_EVENT_SPECS: EventSpec[] = [];

const CHUNK18_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book18-place-scene10-contaminated-space-field",
    name: "Scene 10 Contaminated-Space Field",
    description:
      "Perceptual field where space is experienced as heavy, muted, and behaviorally constrained without clear visible trigger.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk18 illness-arrival POV field anchor.",
    requiredPatterns: [/space = contaminated \/ unreliable/i, /air is heavy/i, /sound doesn.t carry correctly/i],
  },
];

const CHUNK18_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book18-frag-where-is-the-pattern-filter",
    title: "Where-Is-the-Pattern Filter",
    text:
      "Scene cognition repeatedly seeks sequence and origin even when evidence stream is discontinuous, producing structured unease.",
    summary: "Decision-filter constraint for Scene 10 POV.",
    confidence: 5,
    requiredPatterns: [/where is the pattern/i, /find structure/i, /detect sequence/i],
  },
  {
    id: "book18-frag-quiet-fear-without-direction",
    title: "Quiet Fear Without Direction",
    text:
      "Emotional register should remain low-amplitude and persistent, avoiding panic while signaling unresolved systemic threat.",
    summary: "Affective-tone constraint.",
    confidence: 4,
    requiredPatterns: [/quiet fear without direction/i, /not panic/i],
  },
  {
    id: "book18-frag-observation-method-failure",
    title: "Observation Method Failure",
    text:
      "Character arc requires explicit encounter with limits of observation as a universal explanatory method.",
    summary: "Epistemic-break constraint.",
    confidence: 4,
    requiredPatterns: [/usual method does not work/i, /not all things can be understood through observation/i],
  },
];

const CHUNK18_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book18-oq-scene10-signal-loss-markers",
    title: "Which recurring missing-signal markers best track the transition from unease to confirmed systemic threat?",
    description:
      "Needed for consistent escalation logic across illness-linked scenes.",
  },
  {
    id: "book18-oq-authority-uncertainty-display-thresholds",
    title: "How much visible authority uncertainty can be shown before social trust destabilizes too early?",
    description:
      "Needed to balance realism with continuity of communal order.",
  },
  {
    id: "book18-oq-blindspot-release-moment",
    title: "What scene event finally breaks the causality-insistence blind spot and forces acceptance of uncontrollable forces?",
    description:
      "Needed to define a clear developmental hinge in the second matriarch arc.",
  },
];

const CHUNK19_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book19-claim-scene15-cognitive-scale-expansion",
    description:
      "Scene 15 is framed as a major cognitive expansion in how the second matriarch understands power, systems, and truth at scale.",
    quoteExcerpt:
      "Scene 15 ... fundamentally changes how she understands power, systems, and truth.",
    confidence: 5,
    requiredPatterns: [/scene 15/i, /changes how she understands power, systems, and truth/i],
  },
  {
    id: "book19-claim-primary-mode-multi-system-awareness",
    description:
      "Primary perception mode shifts to simultaneous multi-system awareness across group style, spacing, and authority expression.",
    quoteExcerpt: "Multi-System Awareness ... many systems interacting simultaneously.",
    confidence: 5,
    requiredPatterns: [/multi-system awareness/i, /many systems interacting simultaneously/i],
  },
  {
    id: "book19-claim-decision-filter-space-cohesion",
    description:
      "Decision filter evolves toward identifying what keeps the whole space from breaking, emphasizing stabilizers over incidents.",
    quoteExcerpt: "What holds this entire space together? ... what keeps all of this from breaking?",
    confidence: 5,
    requiredPatterns: [/what holds this entire space together/i, /what keeps all of this from breaking/i],
  },
  {
    id: "book19-claim-authority-as-organizing-alignment",
    description:
      "Authority is reframed as alignment-organizing force rather than position, dominance, or command volume.",
    quoteExcerpt: "True power does not force-it organizes.",
    confidence: 5,
    requiredPatterns: [/true power does not force/i, /organizes/i],
  },
  {
    id: "book19-claim-blindspot-scale-failure-underestimation",
    description:
      "Blind spot becomes overconfidence that large systems can always stabilize, without yet grasping scale-amplified failure.",
    quoteExcerpt: "Believes large systems can always stabilize ... does NOT yet understand: scale can amplify failure.",
    confidence: 4,
    requiredPatterns: [/large systems can always stabilize/i, /scale can amplify failure/i],
  },
];

const CHUNK19_EVENT_SPECS: EventSpec[] = [];

const CHUNK19_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book19-place-great-council-multisystem-container",
    name: "Great Council Multi-System Container",
    description:
      "Council-scale spatial container where multiple systems coexist without merging and where distance itself carries structural function.",
    placeType: PlaceType.FIELD,
    sourceTraceNote: "Chunk19 Scene 15 council-scale container anchor.",
    requiredPatterns: [/great council/i, /space can hold many systems without merging them/i],
  },
];

const CHUNK19_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book19-frag-systems-interacting-with-systems",
    title: "Systems Interacting With Systems",
    text:
      "Scene cognition should prioritize system-to-system interactions rather than isolated individual motives at council scale.",
    summary: "Scale-perception constraint.",
    confidence: 5,
    requiredPatterns: [/systems interacting with systems/i, /focuses on the whole, not parts/i],
  },
  {
    id: "book19-frag-stillness-center-power-detection",
    title: "Stillness-Center Power Detection",
    text:
      "Power recognition emerges by tracking where stillness gathers and attention stabilizes across competing group motions.",
    summary: "Power-legibility constraint at scale.",
    confidence: 4,
    requiredPatterns: [/stillness centers/i, /notices where stillness gathers/i],
  },
  {
    id: "book19-frag-awe-to-focus-regulation",
    title: "Awe-to-Focus Regulation",
    text:
      "Emotional response to scale should convert awe into controlled focus rather than fear or confusion.",
    summary: "Affective-regulation constraint.",
    confidence: 4,
    requiredPatterns: [/awe \+ controlled focus/i, /not fear/i, /not confusion/i],
  },
];

const CHUNK19_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book19-oq-multisystem-readability-markers",
    title: "Which concrete markers best signal multi-system readability versus overload in council-scale scenes?",
    description:
      "Needed to keep Scene 15 complexity legible while preserving depth.",
  },
  {
    id: "book19-oq-organizing-power-vs-command",
    title: "How can organizing power be shown consistently without reverting to command-and-dominance tropes?",
    description:
      "Needed for continuity with Campti-alignment authority model.",
  },
  {
    id: "book19-oq-scale-failure-foreshadow-seeds",
    title: "What subtle Scene 15 seeds best foreshadow later scale-amplified failure without collapsing current coherence?",
    description:
      "Needed to set up Scene 17 while preserving present-stage confidence.",
  },
];

const CHUNK20_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book20-claim-scene3-peer-level-pressure-model",
    description:
      "Scene 3 introduces peer-level pressure distinct from elder authority, focused on comparative work performance inside shared evaluation systems.",
    quoteExcerpt: "Scene 3 is about performance ... peer-level pressure ... someone being evaluated by the same system.",
    confidence: 5,
    requiredPatterns: [/scene 3 is about performance/i, /peer-level pressure/i, /evaluated by the same system/i],
  },
  {
    id: "book20-claim-peer-pov-performance-against-performance",
    description:
      "Secondary POV frame is comparative: measuring speed, precision, efficiency, and motion smoothness against one’s own benchmark.",
    quoteExcerpt: "She is measuring: performance against performance.",
    confidence: 5,
    requiredPatterns: [/performance against performance/i, /speed/i, /precision/i, /efficiency/i],
  },
  {
    id: "book20-claim-repetition-mastery-assumption",
    description:
      "Peer assumes skill is repetition-earned and expects visible learning/hesitation from newcomers.",
    quoteExcerpt: "Skill comes from repetition ... she expects visible learning.",
    confidence: 4,
    requiredPatterns: [/skill comes from repetition/i, /expects visible learning/i],
  },
  {
    id: "book20-claim-intuitive-mastery-misread",
    description:
      "First matriarch’s rapid intuitive correctness is misread as luck or temporary coincidence due to peer’s learned-mastery model.",
    quoteExcerpt: "She misreads this as luck, coincidence, or temporary correctness.",
    confidence: 5,
    requiredPatterns: [/misreads this as/i, /luck/i, /coincidence/i, /temporary correctness/i],
  },
  {
    id: "book20-claim-hierarchy-disruption-awareness",
    description:
      "Affective state is competitive unsettledness: not overt jealousy, but awareness that expected hierarchy may be shifting.",
    quoteExcerpt: "Not jealousy yet ... awareness of disruption in expected hierarchy.",
    confidence: 4,
    requiredPatterns: [/not jealousy yet/i, /disruption in expected hierarchy/i],
  },
];

const CHUNK20_EVENT_SPECS: EventSpec[] = [];

const CHUNK20_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book20-place-shared-household-work-circle",
    name: "Shared Household Work Circle",
    description:
      "Household workflow space where peer comparison, correctness norms, and earned-standing evaluation are continuously enacted.",
    placeType: PlaceType.HOME,
    sourceTraceNote: "Chunk20 Scene 3 peer-performance setting anchor.",
    requiredPatterns: [/peer woman in the household/i, /same work circle/i, /workflow system/i],
  },
];

const CHUNK20_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book20-frag-learned-vs-intuitive-mastery-tension",
    title: "Learned vs Intuitive Mastery Tension",
    text:
      "Conflict pressure emerges when repetition-earned competence confronts immediate intuitive alignment that bypasses expected learning arcs.",
    summary: "Core comparative-tension constraint.",
    confidence: 5,
    requiredPatterns: [/intuitive mastery/i, /learned mastery/i, /immediate alignment/i, /gradual improvement/i],
  },
  {
    id: "book20-frag-quiet-peer-evaluation-loop",
    title: "Quiet Peer Evaluation Loop",
    text:
      "Peer evaluation runs silently through micro-comparisons of movement quality, correction frequency, and workflow interference.",
    summary: "Secondary POV cognition constraint.",
    confidence: 4,
    requiredPatterns: [/quietly evaluates/i, /how does she perform compared to me/i],
  },
  {
    id: "book20-frag-earned-standing-gatekeeping",
    title: "Earned Standing Gatekeeping",
    text:
      "Equal standing is granted through perceived correctness legitimacy, not solely elder endorsement.",
    summary: "Status-allocation constraint.",
    confidence: 4,
    requiredPatterns: [/earned her place/i, /deserves equal standing/i],
  },
];

const CHUNK20_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book20-oq-peer-evaluation-signals",
    title: "Which concrete micro-signals indicate peer acceptance versus provisional tolerance in the work circle?",
    description:
      "Needed to track status shifts without explicit dialogue declaration.",
  },
  {
    id: "book20-oq-intuitive-mastery-proof-threshold",
    title: "What threshold of repeated correct execution converts perceived luck into recognized mastery?",
    description:
      "Needed for believable progression from skepticism to acknowledgment.",
  },
  {
    id: "book20-oq-hierarchy-shift-management",
    title: "How is expected hierarchy disruption managed to avoid overt peer fracture while standards remain intact?",
    description:
      "Needed to maintain social coherence in performance-competitive scenes.",
  },
];

const CHUNK21_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book21-claim-scene8-outside-looking-in-frame",
    description:
      "Scene 8 is explicitly designed to show the same social reality through an external cultural lens rather than internal system fluency.",
    quoteExcerpt: "Scene 8 ... from the outside looking in.",
    confidence: 5,
    requiredPatterns: [/scene 8/i, /outside looking in/i],
  },
  {
    id: "book21-claim-host-elder-difference-not-hostility",
    description:
      "Host elder perspective is respectful and cautious, interpreting differences as custom variation without immediate hostility.",
    quoteExcerpt: "There is no hostility ... But there is distance.",
    confidence: 4,
    requiredPatterns: [/no hostility/i, /distance/i, /works for them/i],
  },
  {
    id: "book21-claim-misreads-alignment-as-custom-variation",
    description:
      "He observes coordination and low conflict but misclassifies systemic alignment as merely group-specific custom.",
    quoteExcerpt: "He notices subtle coordination ... But ... sees difference in custom.",
    confidence: 5,
    requiredPatterns: [/subtle coordination/i, /difference in custom/i],
  },
  {
    id: "book21-claim-underestimates-system-adaptiveness",
    description:
      "Core misunderstanding is underestimating integrative sophistication, responsiveness, and scalability of the observed system.",
    quoteExcerpt: "He does NOT recognize how integrated and adaptive their system is.",
    confidence: 5,
    requiredPatterns: [/does not recognize/i, /integrated.*adaptive/i, /more scalable/i],
  },
  {
    id: "book21-claim-authority-legibility-gap",
    description:
      "Authority legibility gap arises because he expects dominance markers and misses alignment-based power expression.",
    quoteExcerpt: "He sees no obvious dominance ... no clear command.",
    confidence: 4,
    requiredPatterns: [/no obvious dominance/i, /no clear command/i],
  },
];

const CHUNK21_EVENT_SPECS: EventSpec[] = [];

const CHUNK21_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book21-place-host-community-observation-field",
    name: "Host-Community Observation Field",
    description:
      "Intertribal contact space where external observers parse unfamiliar spatial and authority signals through home-culture filters.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk21 cross-cultural observer setting anchor.",
    requiredPatterns: [/host community/i, /neighboring tribe/i, /observing theirs/i],
  },
];

const CHUNK21_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book21-frag-custom-vs-system-inference-gap",
    title: "Custom-vs-System Inference Gap",
    text:
      "Cross-cultural observers may reduce high-functioning systemic order to mere custom difference when lacking internal model access.",
    summary: "Cross-cultural interpretation constraint.",
    confidence: 5,
    requiredPatterns: [/difference in custom/i, /not aligned with the visiting group.s system/i],
  },
  {
    id: "book21-frag-respectful-distance-observer-mode",
    title: "Respectful Distance Observer Mode",
    text:
      "Non-hostile distance can preserve diplomatic safety while still producing major interpretive blind spots.",
    summary: "Diplomatic affect constraint.",
    confidence: 4,
    requiredPatterns: [/respectful/i, /cautious/i, /distance/i],
  },
  {
    id: "book21-frag-authority-readability-cross-culture",
    title: "Authority Readability Cross-Culture",
    text:
      "Authority models based on dominance cues fail to read alignment-based leadership in unfamiliar systems.",
    summary: "Power-legibility mismatch constraint.",
    confidence: 4,
    requiredPatterns: [/does not fully interpret/i, /who holds power/i, /how it is expressed/i],
  },
];

const CHUNK21_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book21-oq-cross-cultural-misread-correction-points",
    title: "Which moments can plausibly shift the elder from custom-only interpretation toward recognizing systemic sophistication?",
    description:
      "Needed for believable progression in intertribal understanding arcs.",
  },
  {
    id: "book21-oq-authority-cue-translation",
    title: "How can alignment-based authority cues be translated to observers trained on dominance-based hierarchies?",
    description:
      "Needed to write legible cross-cultural power scenes without flattening either model.",
  },
  {
    id: "book21-oq-distance-without-hostility-staging",
    title: "What staging signals best preserve respectful distance without implying hostility or indifference?",
    description:
      "Needed for nuanced diplomatic tone control.",
  },
];

const CHUNK22_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book22-claim-opening-1682-haunting-contrast",
    description:
      "The proposed 1682 opening is framed as contrast between European legal claim and a Native world still living by its own rhythms.",
    quoteExcerpt:
      "A haunting contrast: a European legal act on paper versus a Native world still living by its own rhythms.",
    confidence: 5,
    requiredPatterns: [/1682/i, /european legal act/i, /native world still living by its own rhythms/i],
  },
  {
    id: "book22-claim-spanish-present-as-background-pressure",
    description:
      "Spanish presence is modeled as background pressure from the beginning rather than late-stage surprise.",
    quoteExcerpt:
      "Spanish story ... present from the beginning as a pressure in the background.",
    confidence: 5,
    requiredPatterns: [/pressure in the background/i, /spanish/i],
  },
  {
    id: "book22-claim-los-adaes-frontier-counterweight",
    description:
      "Los Adaes is treated as key Spanish counterweight node to French Natchitoches and central borderland hinge.",
    quoteExcerpt:
      "Los Adaes ... mission-presidio complex specifically to counter the nearby French presence at Natchitoches.",
    confidence: 5,
    requiredPatterns: [/los adaes/i, /counter.*french presence at natchitoches/i],
  },
  {
    id: "book22-claim-frontier-never-clean-lived-border",
    description:
      "Borderland is framed as lived, mixed, and negotiated rather than cleanly divided by imperial lines.",
    quoteExcerpt: "The border was never clean. It was a lived frontier.",
    confidence: 4,
    requiredPatterns: [/border was never clean/i, /lived frontier/i],
  },
  {
    id: "book22-claim-native-experience-sequence-of-empires",
    description:
      "Native experience sequence is framed as contact shocks, then competing empires, then paper transfers not matching lived reality.",
    quoteExcerpt:
      "First feels Europeans as disease/rumor/... then competing empires ... then one empire replacing another on paper.",
    confidence: 4,
    requiredPatterns: [/competing empires/i, /on paper while daily life remains negotiated/i],
  },
];

const CHUNK22_EVENT_SPECS: EventSpec[] = [
  {
    id: "book22-event-spanish-first-echo-1542",
    title: "First Spanish Echo in Caddo World (1542)",
    eventType: EventType.POLITICAL,
    startYear: 1542,
    description: "Early recorded Spanish contact memory in Caddo-region narratives.",
    requiredPatterns: [/1542/i, /first recorded spanish/i],
  },
  {
    id: "book22-event-opening-claim-1682",
    title: "French Claim Date Anchor (1682)",
    eventType: EventType.POLITICAL,
    startYear: 1682,
    description: "Symbolic opening threshold for imperial claim versus lived local continuity.",
    requiredPatterns: [/1682/i, /opening chapter/i],
  },
  {
    id: "book22-event-natchitoches-founded-1714",
    title: "Natchitoches Founded (1714)",
    eventType: EventType.POLITICAL,
    startYear: 1714,
    description: "French trade-post foundation in Native Red River landscape.",
    requiredPatterns: [/1714/i, /natchitoches is founded/i],
  },
  {
    id: "book22-event-los-adaes-capital-1729",
    title: "Los Adaes as Capital of Spanish Texas (1729)",
    eventType: EventType.POLITICAL,
    startYear: 1729,
    description: "Spanish frontier governance consolidation near French borderland.",
    requiredPatterns: [/1729/i, /capital of spanish texas/i],
  },
];

const CHUNK22_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book22-place-natchitoches-los-adaes-borderland-corridor",
    name: "Natchitoches-Los Adaes Borderland Corridor",
    description:
      "Core French-Spanish-Native interaction corridor linking missions, presidios, trade, and diplomacy.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk22 Spanish borderlands corridor anchor.",
    requiredPatterns: [/natchitoches/i, /los adaes/i, /el camino real/i],
  },
];

const CHUNK22_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book22-frag-background-pressure-reveal-structure",
    title: "Background Pressure Reveal Structure",
    text:
      "Spanish pressure should be seeded as ambient force early, then progressively clarified as frontier institutions tighten.",
    summary: "Narrative-pressure pacing constraint.",
    confidence: 5,
    requiredPatterns: [/pressure in the background/i, /gradually come into focus/i],
  },
  {
    id: "book22-frag-native-viewpoint-over-imperial-paper",
    title: "Native Viewpoint Over Imperial Paper",
    text:
      "Chapter framing should privilege lived Native impacts over formal imperial claims when sequencing historical turns.",
    summary: "Perspective-priority constraint.",
    confidence: 4,
    requiredPatterns: [/native viewpoint/i, /on paper/i],
  },
  {
    id: "book22-frag-master-timeline-engine-five-column",
    title: "Master Timeline Engine (Five-Column Model)",
    text:
      "Story planning should map date/action/affected groups/lived impact/story use for each turning point in the borderland sequence.",
    summary: "Research-to-story engine constraint.",
    confidence: 4,
    requiredPatterns: [/master timeline/i, /five columns/i, /story use/i],
  },
];

const CHUNK22_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book22-oq-spanish-census-source-chain",
    title: "Which Spanish/French census and census-substitute sources are strongest for Natchitoches-Los Adaes family-level reconstruction?",
    description:
      "Needed to harden population and household claims used in chapter scaffolding.",
  },
  {
    id: "book22-oq-native-knowledge-by-decade",
    title: "What would local Red River communities plausibly know in each decade about Spanish and French movements?",
    description:
      "Needed to prevent anachronistic awareness in character dialogue and decisions.",
  },
  {
    id: "book22-oq-borderland-smuggling-diplomacy-balance",
    title: "How should legal trade, illicit exchange, and diplomatic necessity be balanced scene-by-scene in the corridor?",
    description:
      "Needed to keep frontier realism without flattening political complexity.",
  },
];

const CHUNK23_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book23-claim-1722-layer-is-military-not-civil",
    description:
      "The 1722 page is explicitly modeled as a military population layer rather than a civilian census baseline.",
    quoteExcerpt: "This is NOT a Civilian Census ... Military population layer (French troops).",
    confidence: 5,
    requiredPatterns: [/1722 population layer/i, /not a civilian census/i, /military population layer/i],
  },
  {
    id: "book23-claim-spelling-fluid-identity-pattern-match",
    description:
      "Identity resolution must use pattern-based matching because spelling variation and duplicate forms are expected.",
    quoteExcerpt: "Spelling is fluid -> identity must be matched by pattern, not exact name.",
    confidence: 5,
    requiredPatterns: [/spelling is fluid/i, /pattern, not exact name/i],
  },
  {
    id: "book23-claim-frontier-military-turnover-high",
    description:
      "High turnover (discharged, deserted, died) indicates unstable military churn and low long-horizon persistence for many individuals.",
    quoteExcerpt: "Most of these men will NOT persist into long-term population.",
    confidence: 5,
    requiredPatterns: [/discharged/i, /deserted/i, /died/i, /not persist into long-term population/i],
  },
  {
    id: "book23-claim-priority-triage-for-records",
    description:
      "Records are triaged into transient, potential settlers, and high-value reappearing individuals for downstream modeling depth.",
    quoteExcerpt:
      "Classify into 3 groups: Transient, Potential Settlers, High-Value Individuals.",
    confidence: 5,
    requiredPatterns: [/3 groups/i, /transient/i, /potential settlers/i, /high-value individuals/i],
  },
  {
    id: "book23-claim-military-layer-crucial-for-power-map",
    description:
      "Even with low genealogical persistence, this layer is critical for power structure, movement patterns, and frontier instability mapping.",
    quoteExcerpt:
      "This page is STILL critical ... power structure ... movement patterns ... instability level.",
    confidence: 4,
    requiredPatterns: [/still critical/i, /power structure/i, /movement patterns/i, /instability level/i],
  },
];

const CHUNK23_EVENT_SPECS: EventSpec[] = [];

const CHUNK23_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book23-place-1722-military-population-frontier-layer",
    name: "1722 Military Population Frontier Layer",
    description:
      "French military personnel layer for frontier power/turnover analysis, distinct from civilian/parish/land persistence datasets.",
    placeType: PlaceType.REGION,
    sourceTraceNote: "Chunk23 data-ingestion military layer anchor.",
    requiredPatterns: [/population layer: military/i, /1720.?1770/i],
  },
];

const CHUNK23_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book23-frag-name-normalization-and-variant-linking",
    title: "Name Normalization and Variant Linking",
    text:
      "Ingestion must preserve raw spellings while linking likely variants and duplicates to shared identity candidates.",
    summary: "Entity-resolution constraint.",
    confidence: 5,
    requiredPatterns: [/raw -> standardized/i, /possible duplicate|duplicate/i, /variant/i],
  },
  {
    id: "book23-frag-persistence-priority-profiling",
    title: "Persistence-Priority Profiling",
    text:
      "Profile depth should scale with persistence likelihood and cross-record recurrence, minimizing investment in low-retention transient rows.",
    summary: "Modeling-priority constraint.",
    confidence: 4,
    requiredPatterns: [/do not build deep profiles/i, /track closely/i, /reappearing in later records/i],
  },
  {
    id: "book23-frag-military-layer-to-civil-layer-bridge",
    title: "Military-to-Civil Layer Bridge",
    text:
      "Military records should feed civil/parish/land linkage hypotheses rather than be treated as standalone population truth.",
    summary: "Cross-layer integration constraint.",
    confidence: 4,
    requiredPatterns: [/real population lives/i, /civil censuses/i, /parish records/i, /land records/i],
  },
];

const CHUNK23_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book23-oq-entity-resolution-confidence-rules",
    title: "What confidence rules should govern when spelling variants are merged versus kept separate?",
    description:
      "Needed to reduce false merges while preserving deduplication value.",
  },
  {
    id: "book23-oq-military-to-settler-conversion-rate",
    title: "What proportion of discharged/pensioned soldiers become long-term settlers in this corridor?",
    description:
      "Needed to calibrate population transition assumptions.",
  },
  {
    id: "book23-oq-desertion-destination-model",
    title: "How should likely desertion destinations (Spanish/Native zones) be modeled in movement and risk maps?",
    description:
      "Needed to connect military churn with cross-border pressure dynamics.",
  },
];

const CHUNK24_CLAIM_SPECS: ClaimSpec[] = [
  {
    id: "book24-claim-louis-grappe-anchor-interpreter-class",
    description:
      "Louis Grappe is framed as an anchor figure for an interpreter/broker class operating between Native, Spanish, and French systems.",
    quoteExcerpt:
      "Louis Grappe ... interpreter in Indian affairs ... a cultural intermediary.",
    confidence: 5,
    requiredPatterns: [/louis grappe/i, /interpreter in indian affairs/i, /cultural intermediary/i],
  },
  {
    id: "book24-claim-interpreter-role-is-power-position",
    description:
      "Interpreter function is modeled as a central power position controlling conflict prevention, trade continuity, and multi-group trust.",
    quoteExcerpt:
      "This is a power position, not a marginal one.",
    confidence: 5,
    requiredPatterns: [/power position/i, /prevent conflict/i, /trusted by multiple groups/i],
  },
  {
    id: "book24-claim-campti-strategic-frontier-hub",
    description:
      "Campti is reframed as a strategic frontier hub for brokered movement, trade, and influence consolidation.",
    quoteExcerpt:
      "Campti ... strategic frontier hub ... where frontier power consolidates.",
    confidence: 5,
    requiredPatterns: [/campti/i, /strategic frontier hub/i, /frontier power consolidates/i],
  },
  {
    id: "book24-claim-hybrid-power-society-intersection",
    description:
      "Coincoin-descendant land base and Grappe diplomatic-linguistic networks are framed as intersecting to produce hybrid multi-system power.",
    quoteExcerpt:
      "When these intersect ... a hybrid society with power in multiple systems.",
    confidence: 4,
    requiredPatterns: [/coincoin line/i, /grappe line/i, /hybrid society with power in multiple systems/i],
  },
  {
    id: "book24-claim-population-model-adds-broker-layer",
    description:
      "Population architecture explicitly adds an interpreter/broker layer alongside Native, colonial, enslaved/creole, and military layers.",
    quoteExcerpt: "We now add a fourth population layer: interpreter / broker class.",
    confidence: 4,
    requiredPatterns: [/interpreter \/ broker class/i, /population layer/i],
  },
];

const CHUNK24_EVENT_SPECS: EventSpec[] = [];

const CHUNK24_PLACE_SPECS: PlaceSpec[] = [
  {
    id: "book24-place-campti-interpreter-corridor-node",
    name: "Campti Interpreter Corridor Node",
    description:
      "Upper Natchitoches corridor node positioned for brokered diplomacy, landholding, and intersystem translation work.",
    placeType: PlaceType.TOWN,
    sourceTraceNote: "Chunk24 Campti strategic-node anchor.",
    requiredPatterns: [/campti/i, /15 miles above natchitoches/i, /interpreter/i],
  },
];

const CHUNK24_FRAGMENT_SPECS: FragmentSpec[] = [
  {
    id: "book24-frag-broker-class-controls-information-flows",
    title: "Broker Class Controls Information Flows",
    text:
      "Interpreter-broker actors exert leverage through information, relationship routing, and movement permissions rather than direct command.",
    summary: "Broker-power mechanism constraint.",
    confidence: 5,
    requiredPatterns: [/control.*information/i, /relationships/i, /movement/i],
  },
  {
    id: "book24-frag-frontier-survival-through-translation",
    title: "Frontier Survival Through Translation",
    text:
      "In high-friction borderlands, translation and trust brokerage are survival infrastructure for all sides.",
    summary: "Conflict-prevention infrastructure constraint.",
    confidence: 4,
    requiredPatterns: [/prevented more than once/i, /trusted by both sides/i],
  },
  {
    id: "book24-frag-five-pillar-timeline-integration",
    title: "Five-Pillar Timeline Integration",
    text:
      "Story architecture should integrate native world, colonial power shifts, creole lineage, military layer, and broker/interpreter layer as concurrent forces.",
    summary: "Macro-structure integration constraint.",
    confidence: 4,
    requiredPatterns: [/full timeline/i, /5 pillars/i, /native world/i, /colonial power/i],
  },
];

const CHUNK24_QUESTION_SPECS: QuestionSpec[] = [
  {
    id: "book24-oq-broker-lineage-record-chain",
    title: "Which archival chain best links Louis Grappe and related broker figures across Spanish, French, and Native records?",
    description:
      "Needed to strengthen documentary continuity for interpreter-class claims.",
  },
  {
    id: "book24-oq-campti-node-function-by-decade",
    title: "How does Campti’s strategic function change decade-by-decade across trade, diplomacy, and landholding pressures?",
    description:
      "Needed for time-accurate frontier hub portrayal.",
  },
  {
    id: "book24-oq-broker-power-limits-and-failure-modes",
    title: "What are the limits and failure modes of broker-class influence when trust collapses or imperial demands harden?",
    description:
      "Needed to avoid over-centralizing intermediary power in later conflict arcs.",
  },
];

function resolveProfile(sourceId: string, requested: CatalogProfile | null): CatalogProfile {
  if (requested) return requested;
  if (sourceId === DEFAULT_SOURCE_ID) return "chunk1-natchitoches";
  if (sourceId === "book1-source-chunk-2") return "chunk2-material-culture";
  if (sourceId === "book1-source-chunk-3") return "chunk3-geography-power";
  if (sourceId === "book1-source-chunk-4") return "chunk4-conflict-web";
  if (sourceId === "book1-source-chunk-5") return "chunk5-yatasi-difference";
  if (sourceId === "book1-source-chunk-6") return "chunk6-ouachita-difference";
  if (sourceId === "book1-source-chunk-7") return "chunk7-pressure-systems";
  if (sourceId === "book1-source-chunk-8") return "chunk8-book1-story-design";
  if (sourceId === "book1-source-chunk-9") return "chunk9-census-lineage";
  if (sourceId === "book1-source-chunk-10") return "chunk10-mediation-scene";
  if (sourceId === "book1-source-chunk-11") return "chunk11-succession-scene";
  if (sourceId === "book1-source-chunk-12") return "chunk12-convergence-gathering";
  if (sourceId === "book1-source-chunk-13") return "chunk13-domestic-system-training";
  if (sourceId === "book1-source-chunk-14") return "chunk14-observation-stealth-council";
  if (sourceId === "book1-source-chunk-15") return "chunk15-death-recognition-continuity";
  if (sourceId === "book1-source-chunk-16") return "chunk16-assembly-spatial-governance";
  if (sourceId === "book1-source-chunk-17") return "chunk17-pov-layering-system";
  if (sourceId === "book1-source-chunk-18") return "chunk18-pattern-breakdown-pov";
  if (sourceId === "book1-source-chunk-19") return "chunk19-multisystem-council-pov";
  if (sourceId === "book1-source-chunk-20") return "chunk20-peer-performance-pov";
  if (sourceId === "book1-source-chunk-21") return "chunk21-cross-cultural-observer-pov";
  if (sourceId === "book1-source-chunk-22") return "chunk22-spanish-borderlands-timeline";
  if (sourceId === "book1-source-chunk-23") return "chunk23-military-population-layer";
  if (sourceId === "book1-source-chunk-24") return "chunk24-interpreter-frontier-power";
  return "generic";
}

function getProfileSpecs(profile: CatalogProfile, sourceId: string): {
  claims: ClaimSpec[];
  events: EventSpec[];
  places: PlaceSpec[];
  fragments: FragmentSpec[];
  questions: QuestionSpec[];
} {
  if (profile === "chunk1-natchitoches") {
    return {
      claims: CHUNK1_CLAIM_SPECS,
      events: CHUNK1_EVENT_SPECS,
      places: CHUNK1_PLACE_SPECS,
      fragments: CHUNK1_FRAGMENT_SPECS,
      questions: CHUNK1_QUESTION_SPECS,
    };
  }

  if (profile === "chunk2-material-culture") {
    return {
      claims: CHUNK2_CLAIM_SPECS,
      events: CHUNK2_EVENT_SPECS,
      places: CHUNK2_PLACE_SPECS,
      fragments: CHUNK2_FRAGMENT_SPECS,
      questions: CHUNK2_QUESTION_SPECS,
    };
  }

  if (profile === "chunk3-geography-power") {
    return {
      claims: CHUNK3_CLAIM_SPECS,
      events: CHUNK3_EVENT_SPECS,
      places: CHUNK3_PLACE_SPECS,
      fragments: CHUNK3_FRAGMENT_SPECS,
      questions: CHUNK3_QUESTION_SPECS,
    };
  }

  if (profile === "chunk4-conflict-web") {
    return {
      claims: CHUNK4_CLAIM_SPECS,
      events: CHUNK4_EVENT_SPECS,
      places: CHUNK4_PLACE_SPECS,
      fragments: CHUNK4_FRAGMENT_SPECS,
      questions: CHUNK4_QUESTION_SPECS,
    };
  }

  if (profile === "chunk5-yatasi-difference") {
    return {
      claims: CHUNK5_CLAIM_SPECS,
      events: CHUNK5_EVENT_SPECS,
      places: CHUNK5_PLACE_SPECS,
      fragments: CHUNK5_FRAGMENT_SPECS,
      questions: CHUNK5_QUESTION_SPECS,
    };
  }

  if (profile === "chunk6-ouachita-difference") {
    return {
      claims: CHUNK6_CLAIM_SPECS,
      events: CHUNK6_EVENT_SPECS,
      places: CHUNK6_PLACE_SPECS,
      fragments: CHUNK6_FRAGMENT_SPECS,
      questions: CHUNK6_QUESTION_SPECS,
    };
  }

  if (profile === "chunk7-pressure-systems") {
    return {
      claims: CHUNK7_CLAIM_SPECS,
      events: CHUNK7_EVENT_SPECS,
      places: CHUNK7_PLACE_SPECS,
      fragments: CHUNK7_FRAGMENT_SPECS,
      questions: CHUNK7_QUESTION_SPECS,
    };
  }

  if (profile === "chunk8-book1-story-design") {
    return {
      claims: CHUNK8_CLAIM_SPECS,
      events: CHUNK8_EVENT_SPECS,
      places: CHUNK8_PLACE_SPECS,
      fragments: CHUNK8_FRAGMENT_SPECS,
      questions: CHUNK8_QUESTION_SPECS,
    };
  }

  if (profile === "chunk9-census-lineage") {
    return {
      claims: CHUNK9_CLAIM_SPECS,
      events: CHUNK9_EVENT_SPECS,
      places: CHUNK9_PLACE_SPECS,
      fragments: CHUNK9_FRAGMENT_SPECS,
      questions: CHUNK9_QUESTION_SPECS,
    };
  }

  if (profile === "chunk10-mediation-scene") {
    return {
      claims: CHUNK10_CLAIM_SPECS,
      events: CHUNK10_EVENT_SPECS,
      places: CHUNK10_PLACE_SPECS,
      fragments: CHUNK10_FRAGMENT_SPECS,
      questions: CHUNK10_QUESTION_SPECS,
    };
  }

  if (profile === "chunk11-succession-scene") {
    return {
      claims: CHUNK11_CLAIM_SPECS,
      events: CHUNK11_EVENT_SPECS,
      places: CHUNK11_PLACE_SPECS,
      fragments: CHUNK11_FRAGMENT_SPECS,
      questions: CHUNK11_QUESTION_SPECS,
    };
  }

  if (profile === "chunk12-convergence-gathering") {
    return {
      claims: CHUNK12_CLAIM_SPECS,
      events: CHUNK12_EVENT_SPECS,
      places: CHUNK12_PLACE_SPECS,
      fragments: CHUNK12_FRAGMENT_SPECS,
      questions: CHUNK12_QUESTION_SPECS,
    };
  }

  if (profile === "chunk13-domestic-system-training") {
    return {
      claims: CHUNK13_CLAIM_SPECS,
      events: CHUNK13_EVENT_SPECS,
      places: CHUNK13_PLACE_SPECS,
      fragments: CHUNK13_FRAGMENT_SPECS,
      questions: CHUNK13_QUESTION_SPECS,
    };
  }

  if (profile === "chunk14-observation-stealth-council") {
    return {
      claims: CHUNK14_CLAIM_SPECS,
      events: CHUNK14_EVENT_SPECS,
      places: CHUNK14_PLACE_SPECS,
      fragments: CHUNK14_FRAGMENT_SPECS,
      questions: CHUNK14_QUESTION_SPECS,
    };
  }

  if (profile === "chunk15-death-recognition-continuity") {
    return {
      claims: CHUNK15_CLAIM_SPECS,
      events: CHUNK15_EVENT_SPECS,
      places: CHUNK15_PLACE_SPECS,
      fragments: CHUNK15_FRAGMENT_SPECS,
      questions: CHUNK15_QUESTION_SPECS,
    };
  }

  if (profile === "chunk16-assembly-spatial-governance") {
    return {
      claims: CHUNK16_CLAIM_SPECS,
      events: CHUNK16_EVENT_SPECS,
      places: CHUNK16_PLACE_SPECS,
      fragments: CHUNK16_FRAGMENT_SPECS,
      questions: CHUNK16_QUESTION_SPECS,
    };
  }

  if (profile === "chunk17-pov-layering-system") {
    return {
      claims: CHUNK17_CLAIM_SPECS,
      events: CHUNK17_EVENT_SPECS,
      places: CHUNK17_PLACE_SPECS,
      fragments: CHUNK17_FRAGMENT_SPECS,
      questions: CHUNK17_QUESTION_SPECS,
    };
  }

  if (profile === "chunk18-pattern-breakdown-pov") {
    return {
      claims: CHUNK18_CLAIM_SPECS,
      events: CHUNK18_EVENT_SPECS,
      places: CHUNK18_PLACE_SPECS,
      fragments: CHUNK18_FRAGMENT_SPECS,
      questions: CHUNK18_QUESTION_SPECS,
    };
  }

  if (profile === "chunk19-multisystem-council-pov") {
    return {
      claims: CHUNK19_CLAIM_SPECS,
      events: CHUNK19_EVENT_SPECS,
      places: CHUNK19_PLACE_SPECS,
      fragments: CHUNK19_FRAGMENT_SPECS,
      questions: CHUNK19_QUESTION_SPECS,
    };
  }

  if (profile === "chunk20-peer-performance-pov") {
    return {
      claims: CHUNK20_CLAIM_SPECS,
      events: CHUNK20_EVENT_SPECS,
      places: CHUNK20_PLACE_SPECS,
      fragments: CHUNK20_FRAGMENT_SPECS,
      questions: CHUNK20_QUESTION_SPECS,
    };
  }

  if (profile === "chunk21-cross-cultural-observer-pov") {
    return {
      claims: CHUNK21_CLAIM_SPECS,
      events: CHUNK21_EVENT_SPECS,
      places: CHUNK21_PLACE_SPECS,
      fragments: CHUNK21_FRAGMENT_SPECS,
      questions: CHUNK21_QUESTION_SPECS,
    };
  }

  if (profile === "chunk22-spanish-borderlands-timeline") {
    return {
      claims: CHUNK22_CLAIM_SPECS,
      events: CHUNK22_EVENT_SPECS,
      places: CHUNK22_PLACE_SPECS,
      fragments: CHUNK22_FRAGMENT_SPECS,
      questions: CHUNK22_QUESTION_SPECS,
    };
  }

  if (profile === "chunk23-military-population-layer") {
    return {
      claims: CHUNK23_CLAIM_SPECS,
      events: CHUNK23_EVENT_SPECS,
      places: CHUNK23_PLACE_SPECS,
      fragments: CHUNK23_FRAGMENT_SPECS,
      questions: CHUNK23_QUESTION_SPECS,
    };
  }

  if (profile === "chunk24-interpreter-frontier-power") {
    return {
      claims: CHUNK24_CLAIM_SPECS,
      events: CHUNK24_EVENT_SPECS,
      places: CHUNK24_PLACE_SPECS,
      fragments: CHUNK24_FRAGMENT_SPECS,
      questions: CHUNK24_QUESTION_SPECS,
    };
  }

  return {
    claims: [],
    events: [],
    places: [],
    fragments: [],
    questions: [
      {
        id: `${sourceId}-oq-catalog-profile-generic`,
        title: "No deterministic catalog profile configured for this source",
        description:
          "This source was cataloged with the generic profile. Add source-specific claim/event/place/fragment specs before relying on automated core-story extraction.",
      },
    ],
  };
}

async function main() {
  const { sourceId, profile: requestedProfile } = parseArgs();
  const profile = resolveProfile(sourceId, requestedProfile);
  const specs = getProfileSpecs(profile, sourceId);

  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: { id: true, title: true, sourceText: { select: { normalizedText: true, rawText: true } } },
  });

  if (!source) {
    throw new Error(`Source ${sourceId} not found. Run scripts/normalize-book1-research.ts first.`);
  }

  const corpus = (source.sourceText?.normalizedText || source.sourceText?.rawText || "").trim();

  const claimsToCreate = specs.claims.filter((spec) => allPatternsMatch(corpus, spec.requiredPatterns));
  const eventsToCreate = specs.events.filter((spec) => allPatternsMatch(corpus, spec.requiredPatterns));
  const placesToCreate = specs.places.filter((spec) => allPatternsMatch(corpus, spec.requiredPatterns));
  const fragmentsToCreate = specs.fragments.filter((spec) => allPatternsMatch(corpus, spec.requiredPatterns));

  await prisma.$transaction(async (tx) => {
    for (const claim of claimsToCreate) {
      await tx.claim.upsert({
        where: { id: claim.id },
        update: {
          visibility: VisibilityStatus.REVIEW,
          recordType: RecordType.HISTORICAL,
          description: claim.description,
          confidence: claim.confidence,
          quoteExcerpt: claim.quoteExcerpt,
          needsReview: claim.needsReview ?? true,
          notes: `${claim.notes ?? "Book 1 catalog claim."} [${CATALOG_RUN_TAG}]`,
          sourceId,
        },
        create: {
          id: claim.id,
          visibility: VisibilityStatus.REVIEW,
          recordType: RecordType.HISTORICAL,
          description: claim.description,
          confidence: claim.confidence,
          quoteExcerpt: claim.quoteExcerpt,
          needsReview: claim.needsReview ?? true,
          notes: `${claim.notes ?? "Book 1 catalog claim."} [${CATALOG_RUN_TAG}]`,
          sourceId,
        },
      });
    }

    for (const event of eventsToCreate) {
      await tx.event.upsert({
        where: { id: event.id },
        update: {
          visibility: VisibilityStatus.REVIEW,
          recordType: RecordType.HISTORICAL,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          startYear: event.startYear ?? null,
          sourceTraceNote: `${event.notes ?? "Cataloged from Book 1 normalized source."} [${CATALOG_RUN_TAG}]`,
          sources: { connect: { id: sourceId } },
        },
        create: {
          id: event.id,
          visibility: VisibilityStatus.REVIEW,
          recordType: RecordType.HISTORICAL,
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          startYear: event.startYear ?? null,
          sourceTraceNote: `${event.notes ?? "Cataloged from Book 1 normalized source."} [${CATALOG_RUN_TAG}]`,
          sources: { connect: { id: sourceId } },
        },
      });
    }

    for (const place of placesToCreate) {
      await tx.place.upsert({
        where: { id: place.id },
        update: {
          visibility: VisibilityStatus.REVIEW,
          recordType: RecordType.HISTORICAL,
          name: place.name,
          description: place.description,
          placeType: place.placeType,
          sourceTraceNote: `${place.sourceTraceNote} [${CATALOG_RUN_TAG}]`,
          sources: { connect: { id: sourceId } },
        },
        create: {
          id: place.id,
          visibility: VisibilityStatus.REVIEW,
          recordType: RecordType.HISTORICAL,
          name: place.name,
          description: place.description,
          placeType: place.placeType,
          sourceTraceNote: `${place.sourceTraceNote} [${CATALOG_RUN_TAG}]`,
          sources: { connect: { id: sourceId } },
        },
      });
    }

    for (const fragment of fragmentsToCreate) {
      await tx.fragment.upsert({
        where: { id: fragment.id },
        update: {
          sourceId,
          visibility: VisibilityStatus.REVIEW,
          recordType: RecordType.HISTORICAL,
          fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
          title: fragment.title,
          text: fragment.text,
          summary: fragment.summary,
          confidence: fragment.confidence,
          placementStatus: "cataloged",
          reviewStatus: "pending",
          notes: `Cataloged from normalized Book 1 source. [${CATALOG_RUN_TAG}]`,
        },
        create: {
          id: fragment.id,
          sourceId,
          visibility: VisibilityStatus.REVIEW,
          recordType: RecordType.HISTORICAL,
          fragmentType: FragmentType.CONTINUITY_CONSTRAINT,
          title: fragment.title,
          text: fragment.text,
          summary: fragment.summary,
          confidence: fragment.confidence,
          placementStatus: "cataloged",
          reviewStatus: "pending",
          notes: `Cataloged from normalized Book 1 source. [${CATALOG_RUN_TAG}]`,
        },
      });
    }

    for (const question of specs.questions) {
      await tx.openQuestion.upsert({
        where: { id: question.id },
        update: {
          title: question.title,
          description: question.description,
          status: "open",
          priority: 2,
          linkedSourceId: sourceId,
          sourceTraceNote: `Catalog gap generated from ${source.title}. [${CATALOG_RUN_TAG}]`,
        },
        create: {
          id: question.id,
          title: question.title,
          description: question.description,
          status: "open",
          priority: 2,
          linkedSourceId: sourceId,
          sourceTraceNote: `Catalog gap generated from ${source.title}. [${CATALOG_RUN_TAG}]`,
        },
      });
    }
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        sourceId,
        profile,
        corpusChars: corpus.length,
        claims: claimsToCreate.length,
        events: eventsToCreate.length,
        places: placesToCreate.length,
        fragments: fragmentsToCreate.length,
        openQuestions: specs.questions.length,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
