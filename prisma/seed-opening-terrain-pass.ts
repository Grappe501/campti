import type { PrismaClient } from "@prisma/client";
import { PlaceType, RecordType, VisibilityStatus } from "@prisma/client";

/**
 * Opening terrain / Chapter One ground-up population pass.
 * Simulation-ready narrative objects for the innocence layer before the canonical Alexis chapter.
 * Idempotent: safe to re-run (upserts by fixed IDs).
 */
export async function seedOpeningTerrainChapterOnePass(prisma: PrismaClient) {
  const PLACE_GT = "seed-place-grande-terre-homeland";
  const PERSON_CHILD = "seed-person-child-grande-terre-pov";
  const PERSON_MARIE = "seed-person-marie-anne-grande-terre";

  const PERSON_PROTECT = "seed-person-gt-protector-imprint";
  const PERSON_ELDER = "seed-person-gt-elder-ritual-keeper";
  const PERSON_HUNTER = "seed-person-gt-hunter-sentinel";
  const PERSON_AUNT = "seed-person-gt-aunt-kin";
  const PERSON_CHILDREN_CLUSTER = "seed-person-gt-community-children";
  const PERSON_TRADER = "seed-person-gt-trade-visitor";

  const PLACE_VILLAGE_CORE = "seed-place-gt-village-core";
  const PLACE_SMOKE_CENTER = "seed-place-gt-smoke-fire-center";
  const PLACE_RIVER_EDGE = "seed-place-gt-river-edge";
  const PLACE_TRADE_CORRIDOR = "seed-place-gt-trade-corridor";
  const PLACE_FOOD_PREP = "seed-place-gt-food-prep";
  const PLACE_SLEEPING = "seed-place-gt-sleeping-cluster";
  const PLACE_TREE_LINE = "seed-place-gt-tree-line-threshold";
  const PLACE_LOOKOUT = "seed-place-gt-lookout-warning";

  const META = {
    morningSmoke: "seed-meta-gt-morning-smoke-waking",
    childWorld: "seed-meta-gt-child-known-world",
    tradeAware: "seed-meta-gt-trade-route-awareness",
    foodLabor: "seed-meta-gt-food-labor-kinship",
    elderTeach: "seed-meta-gt-elder-teaching",
    firstWarning: "seed-meta-gt-first-subtle-warning",
    silenceBefore: "seed-meta-gt-silence-before-rupture",
  } as const;

  /* —— People: cast for opening terrain —— */
  await prisma.person.upsert({
    where: { id: PERSON_PROTECT },
    update: {
      name: "Young kin — protector imprint (opening)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
      description:
        "Composite older boy or young man the child associates with strength and future pairing — not a documented individual; no formal title.",
      sourceTraceNote: "Fictional relational imprint; optional future-husband echo for symbolic continuity only.",
    },
    create: {
      id: PERSON_PROTECT,
      name: "Young kin — protector imprint (opening)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
      description:
        "Composite older boy or young man the child associates with strength and future pairing — not a documented individual; no formal title.",
      sourceTraceNote: "Fictional relational imprint; optional future-husband echo for symbolic continuity only.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_ELDER },
    update: {
      name: "Elder woman — ritual / memory keeper (opening)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description:
        "Composite elder: oral law, seasonal memory, correction without humiliation — historically plausible role; specific identity not asserted.",
      sourceTraceNote: "Inferential community role; not a claim of named office in documentary record.",
    },
    create: {
      id: PERSON_ELDER,
      name: "Elder woman — ritual / memory keeper (opening)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description:
        "Composite elder: oral law, seasonal memory, correction without humiliation — historically plausible role; specific identity not asserted.",
      sourceTraceNote: "Inferential community role; not a claim of named office in documentary record.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_HUNTER },
    update: {
      name: "Hunter / sentinel (opening)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description:
        "Male figure: subsistence, perimeter awareness, trail literacy — watchfulness without speechifying.",
      sourceTraceNote: "Composite; avoid undocumented tribal titles.",
    },
    create: {
      id: PERSON_HUNTER,
      name: "Hunter / sentinel (opening)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description:
        "Male figure: subsistence, perimeter awareness, trail literacy — watchfulness without speechifying.",
      sourceTraceNote: "Composite; avoid undocumented tribal titles.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_AUNT },
    update: {
      name: "Aunt / kin woman (opening cluster)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
      description:
        "Mother-adjacent kin in the labor and childcare web — shares vigilance with Marie; distinct voice optional in draft.",
      sourceTraceNote: "Fictional kin node; relationship to Marie left flexible for author.",
    },
    create: {
      id: PERSON_AUNT,
      name: "Aunt / kin woman (opening cluster)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
      description:
        "Mother-adjacent kin in the labor and childcare web — shares vigilance with Marie; distinct voice optional in draft.",
      sourceTraceNote: "Fictional kin node; relationship to Marie left flexible for author.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_CHILDREN_CLUSTER },
    update: {
      name: "Community children cluster (opening aggregate)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
      description:
        "Aggregate narrative object for peer play, noise, and shared horizon — not one historical child.",
      sourceTraceNote: "Use for simulation links; POV remains the named child lens.",
    },
    create: {
      id: PERSON_CHILDREN_CLUSTER,
      name: "Community children cluster (opening aggregate)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.FICTIONAL,
      description:
        "Aggregate narrative object for peer play, noise, and shared horizon — not one historical child.",
      sourceTraceNote: "Use for simulation links; POV remains the named child lens.",
    },
  });

  await prisma.person.upsert({
    where: { id: PERSON_TRADER },
    update: {
      name: "Visiting trade presence (composite)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description:
        "Travelers along the trade corridor — may read as kin, ally, or ambiguous; keeps exchange civility visible.",
      sourceTraceNote: "Composite; do not fix ethnicity or empire of origin without archival support.",
    },
    create: {
      id: PERSON_TRADER,
      name: "Visiting trade presence (composite)",
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      description:
        "Travelers along the trade corridor — may read as kin, ally, or ambiguous; keeps exchange civility visible.",
      sourceTraceNote: "Composite; do not fix ethnicity or empire of origin without archival support.",
    },
  });

  /* —— Character profiles —— */
  await prisma.characterProfile.upsert({
    where: { personId: PERSON_PROTECT },
    update: {
      worldview: "Strength is shown by carrying weight and keeping watch — words are secondary.",
      coreBeliefs: "The edge of the camp is real; the center must stay soft for children.",
      desires: "Recognition as reliable; future building (family, hunt, standing) without hurry.",
      fears: "Failing someone smaller; being caught unprepared.",
      internalConflicts: "Pride vs. patience; showing competence without drawing danger’s eye.",
      emotionalBaseline: "Steady, occasionally showy in safe company.",
      behavioralPatterns: "Teaches by demonstration; stands between children and the tree line when tone shifts.",
      speechPatterns: "Short clauses; joking as cover for assessment.",
      sensoryBias: "Listens for hoof rhythm, broken twig, bird silence.",
      moralFramework: "Protection as practice, not speech.",
      socialPosition: "Emerging adult male labor / defense orbit — exact kin tie left open.",
      religiousContext: "Participates in communal time as action (hunt, respect) rather than abstraction.",
      notes: "Uncertainty: exact relation to POV child — sibling cohort, cousin, or future-spouse echo is author choice.",
    },
    create: {
      personId: PERSON_PROTECT,
      worldview: "Strength is shown by carrying weight and keeping watch — words are secondary.",
      coreBeliefs: "The edge of the camp is real; the center must stay soft for children.",
      desires: "Recognition as reliable; future building without hurry.",
      fears: "Failing someone smaller; being caught unprepared.",
      internalConflicts: "Pride vs. patience; competence without spectacle.",
      emotionalBaseline: "Steady, occasionally showy in safe company.",
      behavioralPatterns: "Teaches by demonstration; shields play space when tone shifts.",
      speechPatterns: "Short clauses; joking as cover for assessment.",
      sensoryBias: "Hoof rhythm, broken twig, bird silence.",
      moralFramework: "Protection as practice.",
      socialPosition: "Emerging adult male labor / defense orbit — kin tie open.",
      religiousContext: "Communal obligation through action.",
      notes: "Future-spouse imprint is symbolic option only.",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: PERSON_ELDER },
    update: {
      worldview: "Time is layered — seasons, stories, and debt to those not present.",
      coreBeliefs: "Correction is medicine; shame is a last resort. Memory must stay usable.",
      desires: "That young hands learn the right sequence before urgency teaches the wrong one.",
      fears: "Knowledge lost between generations; children learning speed without judgment.",
      internalConflicts: "Gentleness vs. firmness when the world hardens.",
      emotionalBaseline: "Unhurried; warmth with an edge of standard.",
      behavioralPatterns: "Stops work to teach; uses objects and repetition more than lecture.",
      speechPatterns: "Proverb pace; concrete images; silence as punctuation.",
      sensoryBias: "Hands, smoke color, wind shift, how children hold tools.",
      moralFramework: "Continuity over ego; the camp’s tomorrow weighs more than one mood.",
      socialPosition: "Elder knowledge keeper — formal title unspecified intentionally.",
      religiousContext: "Ceremony embedded in task and season; not abstract doctrine.",
      notes: "Uncertainty: which rituals are shown on page vs. implied — author gates visibility.",
    },
    create: {
      personId: PERSON_ELDER,
      worldview: "Time is layered — seasons, stories, debt to absent kin.",
      coreBeliefs: "Correction is medicine; memory must stay usable.",
      desires: "Right sequence learned before urgency teaches wrong habits.",
      fears: "Lost transmission; speed without judgment.",
      internalConflicts: "Gentleness vs. firmness as pressure rises.",
      emotionalBaseline: "Unhurried; warmth with standard.",
      behavioralPatterns: "Teaches through objects and repetition.",
      speechPatterns: "Proverb pace; concrete images.",
      sensoryBias: "Hands, smoke, wind, how children hold tools.",
      moralFramework: "Continuity over ego.",
      socialPosition: "Elder keeper — title unspecified.",
      religiousContext: "Ceremony in task and season.",
      notes: "Ritual visibility is author decision.",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: PERSON_HUNTER },
    update: {
      worldview: "The trail tells truth before anyone speaks.",
      coreBeliefs: "Meat and warning are both gifts — ignore neither.",
      desires: "Clean kills, safe returns, clear signals to the village.",
      fears: "Misreading an edge; fire where it should not be; silence in the wrong place.",
      internalConflicts: "Lone work vs. need to report without alarming children.",
      emotionalBaseline: "Contained alertness; rare laughter.",
      behavioralPatterns: "Circles wide; returns through agreed approaches; limits stories at the fire.",
      speechPatterns: "Sparse; place-names and conditions more than opinion.",
      sensoryBias: "Wind, mud, bird behavior, distant smoke columns.",
      moralFramework: "Camp safety outweighs personal comfort.",
      socialPosition: "Male subsistence / perimeter role — not a war chief narrative.",
      religiousContext: "Respect frames harvest and land; details author-gated.",
      notes: "Uncertainty: how much of his read of danger surfaces to women’s council — keep plausible.",
    },
    create: {
      personId: PERSON_HUNTER,
      worldview: "The trail tells truth before speech.",
      coreBeliefs: "Meat and warning are both gifts.",
      desires: "Clean kills, safe returns, clear village signals.",
      fears: "Misreading an edge; wrong silence.",
      internalConflicts: "Lone work vs. reporting without child-level alarm.",
      emotionalBaseline: "Contained alertness.",
      behavioralPatterns: "Wide circuits; controlled returns; spare fire talk.",
      speechPatterns: "Sparse; conditions over opinion.",
      sensoryBias: "Wind, mud, birds, smoke columns.",
      moralFramework: "Camp safety first.",
      socialPosition: "Subsistence / perimeter — not war-chief trope.",
      notes: "Council visibility author-gated.",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: PERSON_AUNT },
    update: {
      worldview: "Children are held by many hands — kinship is workload shared.",
      coreBeliefs: "If my sister’s child is hungry, that is my table too.",
      desires: "Smooth days; laughter in labor; no one singled out.",
      fears: "Illness; discord in the women’s line; being unable to cover for Marie.",
      internalConflicts: "Softness toward POV child vs. teaching hardness for survival.",
      emotionalBaseline: "Warm, busy, quick to tease, quick to shield.",
      behavioralPatterns: "Redirects mischief; trades tasks; backs Marie’s signals without explanation to kids.",
      speechPatterns: "Riddles and nicknames; work songs fragments.",
      sensoryBias: "Smell of food stages; tired feet; overheard tone between women.",
      moralFramework: "Kin first; hospitality second; danger handled adult-to-adult.",
      socialPosition: "Mother-cluster labor and childcare — parallel to Marie, not duplicate.",
      religiousContext: "Same communal-spiritual embedding as other women; not priestess claim.",
      notes: "Uncertainty: can merge with another kin voice in short drafts if cast count must shrink.",
    },
    create: {
      personId: PERSON_AUNT,
      worldview: "Many hands hold children; kinship is shared workload.",
      coreBeliefs: "My sister’s child is my table.",
      desires: "Smooth days; laughter in labor.",
      fears: "Illness; women’s-line discord; failing to cover Marie.",
      internalConflicts: "Softness vs. survival lessons.",
      emotionalBaseline: "Warm, busy, teasing, shielding.",
      behavioralPatterns: "Redirects mischief; backs Marie’s adult signals.",
      speechPatterns: "Nicknames; song fragments.",
      sensoryBias: "Food stages; women’s tone.",
      moralFramework: "Kin first; danger stays adult.",
      socialPosition: "Mother-cluster — parallel to Marie.",
      notes: "Mergeable character if cast trims.",
    },
  });

  await prisma.characterProfile.upsert({
    where: { personId: PERSON_TRADER },
    update: {
      worldview: "Exchange is relationship speed — goods are the grammar.",
      coreBeliefs: "A bad trade insults kin; a good trade renews peace.",
      desires: "Fair margin, safe night’s fire, credible introductions.",
      fears: "Being misread as scout for violence; goods spoiled en route.",
      internalConflicts: "Curiosity vs. discretion when asked about the outside world.",
      emotionalBaseline: "Performative openness with private calculation.",
      behavioralPatterns: "Signals approach early; accepts women’s negotiation as primary at the edge.",
      speechPatterns: "Trade multilingual fragments; compliments as probe.",
      sensoryBias: "Animal packs, metal sound, sweat vs. river-cooled skin.",
      moralFramework: "Reciprocity under watchful eyes.",
      socialPosition: "Visitor — power is temporary and granted.",
      religiousContext: "May carry foreign prayer habits; not centered in this terrain.",
      notes: "Uncertainty: one figure or several — composite allows branching.",
    },
    create: {
      personId: PERSON_TRADER,
      worldview: "Exchange is relationship speed.",
      coreBeliefs: "Goods are grammar; insult or renew kin.",
      desires: "Fair trade, safe fire, credible intro.",
      fears: "Misread as violence’ scout; spoilage.",
      internalConflicts: "Curiosity vs. discretion.",
      emotionalBaseline: "Open face; private math.",
      behavioralPatterns: "Early signals; defers to women at edge.",
      speechPatterns: "Multilingual fragments; compliments as probe.",
      sensoryBias: "Pack straps, metal, sweat.",
      moralFramework: "Reciprocity under eyes.",
      socialPosition: "Visitor power is temporary.",
      notes: "Composite allows one or many travelers.",
    },
  });

  /* Aggregate: minimal profile for linking */
  await prisma.characterProfile.upsert({
    where: { personId: PERSON_CHILDREN_CLUSTER },
    update: {
      worldview: "N/A — aggregate simulation node.",
      notes:
        "Not a consciousness model. Use for peer noise, game rules, and collective permission in meta-scenes. POV stays child lens.",
      emotionalBaseline: "Play-forward; conflict usually low-stakes among peers.",
    },
    create: {
      personId: PERSON_CHILDREN_CLUSTER,
      worldview: "N/A — aggregate simulation node.",
      notes: "Peer field only; POV remains named child.",
      emotionalBaseline: "Play-forward.",
    },
  });

  /* Child POV: expand without psychologized prose — reinforce sensory author note */
  await prisma.characterProfile.update({
    where: { personId: PERSON_CHILD },
    data: {
      desires: "More room to run; adults in a good mood; interesting visitors who bring smell and sound.",
      fears: "Sudden stillness in adults; being made to sit too long; loud unknown dogs.",
      internalConflicts: "Wanting both freedom and the warmth of a known lap.",
      behavioralPatterns: "Loops between play and checking adult faces; learns rules through imitation not lecture.",
      speechPatterns: "Concrete questions; sound-words; interrupting when excited.",
      moralFramework: "Fairness as turn-taking and who gets the first bowl — not abstract ethics.",
      socialPosition: "Child under collective supervision — small but legitimate freedom ring.",
      notesOnTypeUse:
        "Enneagram (if present) is drafting aid only. Generated prose must stay sensory, relational, concrete — not therapeutic interior monologue.",
      notes:
        "Opening terrain: loved-before-threat. Uncertainty: later formal identity (Marie Anne Thérèse) vs. this POV label — preserve separate Person rows if needed.",
    },
  });

  /* Marie: light expansion */
  await prisma.characterProfile.update({
    where: { personId: PERSON_MARIE },
    data: {
      desires:
        "That the child’s body remembers safety; that vigilance never has to become speech at the wrong volume.",
      behavioralPatterns:
        "Touches hair or shoulder when reassurance must stay silent; codes warnings into tasks and placement.",
      notes:
        "Mother/aunt cluster simulation: Marie + aunt figure share vigilance; Marie remains primary moral weight.",
    },
  });

  /* —— Character states (opening terrain, scene-unbound) —— */
  const state = async (
    id: string,
    personId: string,
    data: {
      emotionalState: string;
      motivation: string;
      fearState: string;
      knowledgeState: string;
      physicalState: string;
      socialConstraint: string;
      notes: string;
    },
  ) => {
    await prisma.characterState.upsert({
      where: { id },
      update: { personId, sceneId: null, ...data },
      create: { id, personId, sceneId: null, ...data },
    });
  };

  await state("seed-cs-gt-child-opening", PERSON_CHILD, {
    emotionalState: "Bright, porous — takes emotional temperature from bodies more than words.",
    motivation: "Stay in motion; stay inside the tolerated ring of play.",
    fearState: "Low explicit fear; unease when adult rhythm skips a beat.",
    knowledgeState: "Knows paths, names of kin, rules of fire and water; does not know geopolitics.",
    physicalState: "Late-summer vitality; skin marked by sun and scrapes.",
    socialConstraint: "Must answer women’s calls; must not cross hunter warnings without escort.",
    notes: "Fixed: child cannot authoritatively name incoming violence — only register cues.",
  });

  await state("seed-cs-gt-marie-opening", PERSON_MARIE, {
    emotionalState: "Calm surface; listening past the conversation.",
    motivation: "Keep children soft while adults stay sharp.",
    fearState: "Contained — names itself only in trusted council, not to POV.",
    knowledgeState: "Reads trade and visitor behavior; may sense rumor pressure — degree left open.",
    physicalState: "Labor-strong; sleep debt optional color.",
    socialConstraint: "Hospitality law vs. rising suspicion — must not collapse into panic in public.",
    notes: "Fixed: she acts within protective matriarch personality — not arbitrary flip to exposition.",
  });

  await state("seed-cs-gt-elder-opening", PERSON_ELDER, {
    emotionalState: "Patient; sharp when teaching.",
    motivation: "Align young bodies to right sequence.",
    fearState: "Long-cycle — loss of memory chain.",
    knowledgeState: "High local / ceremonial knowledge — expressed as task, not lecture series.",
    physicalState: "Age-marked; authority in hands.",
    socialConstraint: "Cannot override Marie on child safety calls — complementary power.",
    notes: "Fixed: teaching moments land as correction-with-care.",
  });

  await state("seed-cs-gt-hunter-opening", PERSON_HUNTER, {
    emotionalState: "Quietly keyed.",
    motivation: "Return signal; keep perimeter truth current.",
    fearState: "Misread trail; late warning.",
    knowledgeState: "Knows ground; may withhold detail from children.",
    physicalState: "Lean, trail-conditioned.",
    socialConstraint: "Must not seed camp-wide panic from uncertain signs.",
    notes: "Fixed: sentinel role — personality is watchful, not melodramatic.",
  });

  await state("seed-cs-gt-protect-opening", PERSON_PROTECT, {
    emotionalState: "Pride mixed with watchfulness when POV is near.",
    motivation: "Be seen as dependable; keep play space safe.",
    fearState: "Loss of face; harm to smaller kin.",
    knowledgeState: "Partial — more than child, less than Marie.",
    physicalState: "Youth strength; endurance.",
    socialConstraint: "Must defer to elders and Marie on camp decisions.",
    notes: "Fixed: acts within young-protector arc — micro-actions vary, spine does not.",
  });

  /* —— Sub-places —— */
  const placeUpsert = async (
    id: string,
    name: string,
    placeType: PlaceType,
    description: string,
    trace: string,
  ) => {
    await prisma.place.upsert({
      where: { id },
      update: {
        name,
        placeType,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        description,
        sourceTraceNote: trace,
      },
      create: {
        id,
        name,
        placeType,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        description,
        sourceTraceNote: trace,
      },
    });
  };

  await placeUpsert(
    PLACE_VILLAGE_CORE,
    "Grande Terre — village core",
    PlaceType.HOME,
    "Lodges, packed earth, daily congregation — social gravity center. Historical: inferential settlement cluster, not surveyed plat.",
    "Sub-zone of homeland composite; boundaries narrative.",
  );
  await placeUpsert(
    PLACE_SMOKE_CENTER,
    "Grande Terre — smoke / fire center",
    PlaceType.FIELD,
    "Cooking and drying fires; smoke as timekeeper. Sensory spine for waking order and shared meals.",
    "Inferential; tied to SettingProfile rhythm.",
  );
  await placeUpsert(
    PLACE_RIVER_EDGE,
    "Grande Terre — river edge",
    PlaceType.RIVER,
    "Ford, washing, cooling, sound-masking. Child movement and women’s labor overlap; danger when current shifts.",
    "Riverine ecology plausible; exact ford fictional.",
  );
  await placeUpsert(
    PLACE_TRADE_CORRIDOR,
    "Grande Terre — trade corridor / trail approach",
    PlaceType.FIELD,
    "Packed approach where visitors signal — visibility vs. vulnerability. Time-of-day: morning arrivals, evening stories.",
    "Trade-route civilization plausible; not a named imperial road.",
  );
  await placeUpsert(
    PLACE_FOOD_PREP,
    "Grande Terre — food preparation area",
    PlaceType.FIELD,
    "Grinding, drying, smoking — women’s labor density; kinship rhythm audible. Mid-morning through afternoon peak.",
    "Inferential layout.",
  );
  await placeUpsert(
    PLACE_SLEEPING,
    "Grande Terre — sleeping cluster",
    PlaceType.HOME,
    "Night quiet zone; lowered voices; proximity of kin. Dawn re-starts at smoke, not clock.",
    "Fictional cluster spacing.",
  );
  await placeUpsert(
    PLACE_TREE_LINE,
    "Grande Terre — tree line / threshold",
    PlaceType.FIELD,
    "Visual and psychological edge — play runs toward it; hunters read it. Symbolic: world beyond known names.",
    "Threshold symbolism; not a reservation line.",
  );
  await placeUpsert(
    PLACE_LOOKOUT,
    "Grande Terre — lookout / warning zone",
    PlaceType.FIELD,
    "Elevated or open sightline — environmental pressure first. Who uses: hunter, sometimes youth sent with message.",
    "Inferential; avoid military fortification cliché.",
  );

  const settingProfileBody = (
    physical: string,
    sounds: string,
    smells: string,
    socialRules: string,
    notes: string,
  ) => ({
    physicalDescription: physical,
    environmentType: "Opening terrain sub-zone (Grande Terre composite)",
    sounds,
    smells,
    textures: "Varies by sub-zone — packed earth, bark, water-slick stone, woven mat.",
    lightingConditions: "Dawn through dusk: smoke-haze mornings; high white midday; copper tree line evenings.",
    dominantActivities: notes,
    socialRules,
    notes:
      "Parent place: Grande Terre Homeland Zone. Historical grounding: plausible Indigenous riverine/trade life; specifics fictional or inferential.",
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_VILLAGE_CORE },
    update: settingProfileBody(
      "Central cluster: lodges, racks, visible paths; heart of waking order.",
      "Voices layered; children; dogs; distant mortar.",
      "Woodsmoke, food oil, sun on dry earth.",
      "Children answer to any adult eye; disputes handled before they echo.",
      "Village cohesion; who controls: women’s line + elder counsel in daily rhythm.",
    ),
    create: {
      placeId: PLACE_VILLAGE_CORE,
      ...settingProfileBody(
        "Central cluster: lodges, racks, visible paths; heart of waking order.",
        "Voices layered; children; dogs; distant mortar.",
        "Woodsmoke, food oil, sun on dry earth.",
        "Children answer to any adult eye; disputes handled before they echo.",
        "Village cohesion; who controls: women’s line + elder counsel in daily rhythm.",
      ),
    },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_SMOKE_CENTER },
    update: settingProfileBody(
      "Fire rings, drying, kettle logic — smoke as schedule.",
      "Crackle, hiss, stirred coals, laughter crossing smoke.",
      "Smoke (multiple kinds), char, parched herbs.",
      "Fire discipline; children taught distance through repetition.",
      "Morning smoke / waking order; elders and cooks set tempo.",
    ),
    create: {
      placeId: PLACE_SMOKE_CENTER,
      ...settingProfileBody(
        "Fire rings, drying, kettle logic — smoke as schedule.",
        "Crackle, hiss, stirred coals, laughter crossing smoke.",
        "Smoke (multiple kinds), char, parched herbs.",
        "Fire discipline; children taught distance through repetition.",
        "Morning smoke / waking order; elders and cooks set tempo.",
      ),
    },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_RIVER_EDGE },
    update: {
      ...settingProfileBody(
        "Bank, ford, washing stones — constant syllable of water.",
        "Water over stone, splashing, sometimes silence when someone listens.",
        "Wet stone, algae, clean linen half-dried.",
        "Sexual modesty and task boundaries as community habit — author specifics.",
        "Cooling; washing; children under eye; hunter crossing paths.",
      ),
      racialDynamics:
        "Trade-route diversity may appear at the ford — familiarity and caution both plausible.",
    },
    create: {
      placeId: PLACE_RIVER_EDGE,
      ...settingProfileBody(
        "Bank, ford, washing stones — constant syllable of water.",
        "Water over stone, splashing, sometimes silence when someone listens.",
        "Wet stone, algae, clean linen half-dried.",
        "Task and modesty boundaries — author specifics.",
        "Cooling; washing; children supervised; crossings signal arrivals.",
      ),
      racialDynamics:
        "Trade-route diversity at ford — familiarity mixed with watchfulness.",
    },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_TRADE_CORRIDOR },
    update: settingProfileBody(
      "Dust or mud pack; sightlines down-trail; greeting etiquette space.",
      "Hoofbeats, pack creak, trade languages, dogs answering.",
      "Dust, animal sweat, oiled leather, foreign spice maybe.",
      "Visitors halt for women’s read; gifts are relationship, not bribe shorthand.",
      "Trade-route awareness; pressure rises when approach is unfamiliar.",
    ),
    create: {
      placeId: PLACE_TRADE_CORRIDOR,
      ...settingProfileBody(
        "Dust or mud pack; sightlines down-trail; greeting etiquette space.",
        "Hoofbeats, pack creak, trade languages, dogs answering.",
        "Dust, animal sweat, oiled leather, foreign spice maybe.",
        "Visitors halt for women’s read; gifts are relationship.",
        "Trade awareness; pressure when approach is unfamiliar.",
      ),
    },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_FOOD_PREP },
    update: settingProfileBody(
      "Mortars, racks, cutting stones — labor visible and shared.",
      "Rhythmic grind, chop, call-and-response, children drafted to small tasks.",
      "Corn, oil, smoke, herbs, human sweat sweet and sharp.",
      "Kinship rhythm: teaching while working; correction without breaking dignity.",
      "Food, labor, kinship beat; Marie/aunt/elder density.",
    ),
    create: {
      placeId: PLACE_FOOD_PREP,
      ...settingProfileBody(
        "Mortars, racks, cutting stones — labor visible and shared.",
        "Rhythmic grind, chop, call-and-response, small tasks for children.",
        "Corn, oil, smoke, herbs, sweat.",
        "Teaching through labor; dignity-preserving correction.",
        "Kinship rhythm; women-cluster social control of tempo.",
      ),
    },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_SLEEPING },
    update: settingProfileBody(
      "Mats, low light, proximity breathing — night rules differ from day.",
      "Snoring, whisper, fabric rustle, night insects.",
      "Smoke cling on hair, warm bodies, cooled earth.",
      "Quiet after dark; fear spoken low; children nested.",
      "Sleeping cluster — emotional decompression; pre-dawn smoke restart.",
    ),
    create: {
      placeId: PLACE_SLEEPING,
      ...settingProfileBody(
        "Mats, low light, proximity breathing — night rules differ.",
        "Snoring, whisper, fabric rustle, insects.",
        "Smoke cling, warm bodies, cooled earth.",
        "Quiet after dark; children nested.",
        "Night rest; dawn belongs to smoke again.",
      ),
    },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_TREE_LINE },
    update: settingProfileBody(
      "Light changes; play flees here first; hunters read silhouette.",
      "Birdcall gaps, leaf hiss, sudden quiet.",
      "Leaf mold, pine or oak depending on author ecology choice.",
      "Children allowed to edge but not disappear; stories about what lies beyond.",
      "Threshold zone; symbolic edge; first subtle warnings may register visually.",
    ),
    create: {
      placeId: PLACE_TREE_LINE,
      ...settingProfileBody(
        "Light changes; play boundary; silhouette literacy.",
        "Birdcall, leaf noise, quiet gaps.",
        "Leaf mold, bark, sun-warmed resin.",
        "Play boundary; stories of beyond; elder warnings embedded in play rules.",
        "Threshold; subtle warning register.",
      ),
    },
  });

  await prisma.settingProfile.upsert({
    where: { placeId: PLACE_LOOKOUT },
    update: settingProfileBody(
      "Open sight; heat shimmer; long view of trail smoke.",
      "Wind forward; sometimes nothing — which is information.",
      "Sun-baked grass, sweat, metal if arms present.",
      "Information discipline: what is said coming down matters.",
      "Warning zone; environmental pressure highest before social story catches up.",
    ),
    create: {
      placeId: PLACE_LOOKOUT,
      ...settingProfileBody(
        "Sightline priority; heat shimmer; distant smoke.",
        "Wind; intentional silence.",
        "Grass, sweat, metal optional.",
        "Controlled reporting — no performative alarm.",
        "Lookout / warning; pressure without chapter draft.",
      ),
    },
  });

  /* —— Meta-scenes: simulation units (notes hold pressure model) —— */
  const pressureBlock = (p: {
    env: string;
    social: string;
    existential: string;
    marie: string;
    elder: string;
    hunter: string;
    aunt: string;
    protector: string;
    trader: string;
    childSurface: string;
    childBlind: string;
    fixed: string;
    downstream: string;
  }) =>
    [
      "PRESSURE MODEL",
      `Environmental: ${p.env}`,
      `Social: ${p.social}`,
      `Existential: ${p.existential}`,
      "CHARACTER NOTICES",
      `Marie: ${p.marie}`,
      `Elder: ${p.elder}`,
      `Hunter/sentinel: ${p.hunter}`,
      `Aunt/kin: ${p.aunt}`,
      `Protector imprint: ${p.protector}`,
      `Trade visitor: ${p.trader}`,
      "CHILD POV",
      `Surface: ${p.childSurface}`,
      `Registers but cannot interpret: ${p.childBlind}`,
      `Fixed across draft paths: ${p.fixed}`,
      "DOWNSTREAM",
      p.downstream,
    ].join("\n");

  const metaUpsert = async (
    id: string,
    title: string,
    placeId: string,
    participants: string[],
    fields: {
      environmentDescription: string;
      sensoryField: string;
      historicalConstraints: string;
      socialConstraints: string;
      characterStatesSummary: string;
      emotionalVoltage: string;
      centralConflict: string;
      symbolicElements: string;
      narrativePurpose: string;
      continuityDependencies: string;
      notes: string;
    },
  ) => {
    await prisma.metaScene.upsert({
      where: { id },
      update: {
        title,
        placeId,
        povPersonId: PERSON_CHILD,
        sceneId: null,
        timePeriod: "Early 1700s — opening innocence layer (approximate)",
        dateEstimate: "Untimed relative to raid — author anchors duration",
        participants,
        sourceSupportLevel: "moderate-to-inferential",
        ...fields,
      },
      create: {
        id,
        title,
        placeId,
        povPersonId: PERSON_CHILD,
        sceneId: null,
        timePeriod: "Early 1700s — opening innocence layer (approximate)",
        dateEstimate: "Untimed relative to raid — author anchors duration",
        participants,
        sourceSupportLevel: "moderate-to-inferential",
        ...fields,
      },
    });
  };

  await metaUpsert(
    META.morningSmoke,
    "Opening terrain — morning smoke / waking order",
    PLACE_SMOKE_CENTER,
    [
      PERSON_MARIE,
      PERSON_ELDER,
      PERSON_AUNT,
      PERSON_CHILDREN_CLUSTER,
      PERSON_CHILD,
    ],
    {
      environmentDescription:
        "Smoke rises on schedule; bodies gather without needing a reason announced. The day names itself through heat and task.",
      sensoryField: "Woodsmoke, first oil, mortar rhythm, bare feet on packed ground, adults’ unhurried voices.",
      historicalConstraints:
        "Inferential Indigenous riverine morning order — not a documented schedule for this village.",
      socialConstraints:
        "Children fold into task without bureaucracy; elders set moral temperature at the fire.",
      characterStatesSummary:
        "Child: hungry for motion. Marie/aunt: calm orchestration. Elder: small corrections embedded in greeting.",
      emotionalVoltage: "Love and continuity — threat not yet in frame.",
      centralConflict: "Order vs. child impatience — low stakes, high warmth.",
      symbolicElements: "Smoke as covenant of continuity; fire as shared clock.",
      narrativePurpose:
        "Simulation unit: establish loved rhythm before rupture. Possible uses: prologue beat, Terrain I, prelude to Ch.1.",
      continuityDependencies: "Requires smoke/fire place model and women-cluster vigilance.",
      notes: pressureBlock({
        env: "Heat building; smoke column as predictable comfort.",
        social: "Who speaks first at fire; who assigns small tasks to children.",
        existential: "Belonging without argument — world feels self-evident.",
        marie: "Who is missing from the circle; who needs an extra glance.",
        elder: "Whether yesterday’s lesson held overnight.",
        hunter: "Not central here — may appear at edge with night news later.",
        aunt: "Workload balance; teasing to soften morning.",
        protector: "Optional — carrying wood or showing off strength safely.",
        trader: "Absent or asleep — not the morning’s story unless author branches.",
        childSurface: "Smoke means day; adults mean permission patterns.",
        childBlind: "Why a late fire would be political, not just lazy.",
        fixed: "Morning love — adults competent; child safe.",
        downstream: "Echo in later scenes when smoke means alarm, not breakfast.",
      }),
    },
  );

  await metaUpsert(
    META.childWorld,
    "Opening terrain — child movement through known world",
    PLACE_VILLAGE_CORE,
    [PERSON_CHILD, PERSON_MARIE, PERSON_CHILDREN_CLUSTER, PERSON_PROTECT, PERSON_ELDER],
    {
      environmentDescription:
        "Short loops: fire to river edge to play dust — geography learned by foot, not map.",
      sensoryField: "Sun angle, foot-sore joy, peer noise, adult eyes that clock you without words.",
      historicalConstraints: "Child-scale geography plausible; no claim of measured distances.",
      socialConstraints: "Play freedoms negotiated by proximity to labor and water.",
      characterStatesSummary:
        "Child: exploratory. Protector: quietly territorial about edges. Elder: watches technique not just behavior.",
      emotionalVoltage: "Freedom within love — bounded exploration.",
      centralConflict: "Curiosity vs. adult perimeter rules.",
      symbolicElements: "Circle of known names; trail as extension of kin body.",
      narrativePurpose: "Map innocence as kinesthetic knowledge — simulation for Terrain I / subchapter.",
      continuityDependencies: "Village core + river edge models; peer cluster aggregate.",
      notes: pressureBlock({
        env: "Heat; thirst; distance feels longer when adults tighten.",
        social: "Which adult overrides another when child tests boundary.",
        existential: "Trust that the world’s edge is still friendly.",
        marie: "How far is too far today.",
        elder: "Whether child repeats a skill correctly near fire.",
        hunter: "If someone should be fetched back from tree line.",
        aunt: "If child is avoiding a chore.",
        protector: "Showing off safe leadership vs. recklessness.",
        trader: "Peripheral — distant hoofbeat as curiosity.",
        childSurface: "Where play is allowed; who calls you home.",
        childBlind: "Why an adult might forbid a path that was fine yesterday.",
        fixed: "World feels navigable; kinship is spatial.",
        downstream: "Later exile / removal hits harder when geography was once love-mapped.",
      }),
    },
  );

  await metaUpsert(
    META.tradeAware,
    "Opening terrain — trade-route awareness",
    PLACE_TRADE_CORRIDOR,
    [PERSON_CHILD, PERSON_MARIE, PERSON_TRADER, PERSON_HUNTER, PERSON_PROTECT],
    {
      environmentDescription:
        "Arrival grammar: pause, signal, women step forward — trade as civilization, not background noise.",
      sensoryField: "Hoof rhythm, pack leather, foreign syllables, dogs negotiating hierarchy.",
      historicalConstraints:
        "Early-contact trade pluralism plausible; specific goods and empires not fixed without sources.",
      socialConstraints: "Hospitality with eyes open — child observes tone, not policy.",
      characterStatesSummary:
        "Marie: assessing. Hunter: trail-minded scan. Trader: performance + calculation. Child: novelty hunger.",
      emotionalVoltage: "Excitement with a thin wire of adult assessment.",
      centralConflict: "Openness vs. protective suspicion — still civil.",
      symbolicElements: "Trail as artery; gift as relationship; dust as rumor.",
      narrativePurpose: "Simulate trade-route life before raid — possible prologue or Terrain I.",
      continuityDependencies: "Trade corridor place; visitor composite; Marie vigilance.",
      notes: pressureBlock({
        env: "Dust or mud; heat around waiting bodies.",
        social: "Who speaks first; whether visitor is welcomed inside core or held at edge.",
        existential: "Dependence on strangers who may also precede armies.",
        marie: "Eyes, hands, gift logic, children’s placement.",
        elder: "May be present as memory authority — optional.",
        hunter: "Tracks, time-on-trail, tells that do not need translation.",
        aunt: "Labor redirect — children given tasks to keep them in sight.",
        protector: "Impress vs. behave; edge posturing.",
        trader: "Margin, safety, reading women’s council.",
        childSurface: "New smells; funny words; pretty metal.",
        childBlind: "Subtext of silence after a polite answer.",
        fixed: "Trade is social order — not abstract economy.",
        downstream: "Raid can arrive as betrayal of trade civility norms.",
      }),
    },
  );

  await metaUpsert(
    META.foodLabor,
    "Opening terrain — food, labor, and kinship rhythm",
    PLACE_FOOD_PREP,
    [PERSON_CHILD, PERSON_MARIE, PERSON_AUNT, PERSON_ELDER, PERSON_CHILDREN_CLUSTER],
    {
      environmentDescription:
        "Work is chorus — bodies timed together; children learn belonging through small contributions.",
      sensoryField: "Grind rhythm, steam, oil, overlapping instructions, laughter as stress valve.",
      historicalConstraints: "Agricultural/labor details inferential — avoid false specificity.",
      socialConstraints: "Kinship corrections; dignity-preserving teaching.",
      characterStatesSummary: "Women-cluster drives tempo; child moves between play and micro-task.",
      emotionalVoltage: "Warm competence — competence as love language.",
      centralConflict: "Task focus vs. child distraction — gentle, not cruel.",
      symbolicElements: "Mortar as heartbeat; shared bowl as moral fact.",
      narrativePurpose: "Simulate kinship order under labor — prelude beat or Terrain I interior.",
      continuityDependencies: "Food prep place; aunt + Marie + elder roles.",
      notes: pressureBlock({
        env: "Heat; steam; wet hands; flies optional.",
        social: "Who leads song; who corrects whom in kin hierarchy.",
        existential: "Continuity through repeated acts — world renewed daily.",
        marie: "Child’s attention and fairness between children.",
        elder: "Technique and memory while working.",
        hunter: "May enter with game — shifts tone to gratitude/thanks.",
        aunt: "Teasing + shielding; workload equity.",
        protector: "May haul or fetch — proving role.",
        trader: "Absent or background — unless goods traded into kitchen logic.",
        childSurface: "Turns, tasks, who gets praised.",
        childBlind: "Adult worry folded into recipe timing.",
        fixed: "Labor is love — not punishment narrative.",
        downstream: "Later hunger / loss lands against this competence memory.",
      }),
    },
  );

  await metaUpsert(
    META.elderTeach,
    "Opening terrain — elder correction / teaching moment",
    PLACE_VILLAGE_CORE,
    [PERSON_CHILD, PERSON_ELDER, PERSON_MARIE, PERSON_AUNT],
    {
      environmentDescription:
        "A mistake small to adults, large in sequence — teaching lands as adjustment, not humiliation.",
      sensoryField: "Hands guided; repetition; smell of earth or plant matter; lowered voice.",
      historicalConstraints: "Specific plant/ritual detail author-gated — label inferential if invented.",
      socialConstraints: "Elder speaks; Marie supports without undermining.",
      characterStatesSummary:
        "Child: flushed; elder: steady; Marie: watchful love; aunt: quiet reinforcement.",
      emotionalVoltage: "Shame risk redirected into belonging — still tender.",
      centralConflict: "Standard vs. child impulse — resolved in relationship.",
      symbolicElements: "Hands as lineage; correction as inclusion.",
      narrativePurpose: "Simulation for moral framework without sermon — subchapter or Terrain I.",
      continuityDependencies: "Elder profile; kin women cluster.",
      notes: pressureBlock({
        env: "Still air vs. busy edge — teaching pulls focus.",
        social: "Who may correct whom; child’s face-saving.",
        existential: "Rules as care, not arbitrary power.",
        marie: "Whether correction lands clean emotionally.",
        elder: "Whether lesson stuck; what must repeat tomorrow.",
        hunter: "Peripheral unless lesson is trail-related.",
        aunt: "Softening joke timing.",
        protector: "Watching child’s face — empathy without interference.",
        trader: "N/A unless lesson is exchange-related.",
        childSurface: "Adult disappointed vs. angry; hands helping vs. grabbing.",
        childBlind: "Long arc reasons — child gets sequence, not history lecture.",
        fixed: "Elder acts within keeper personality — bounded correction.",
        downstream: "Later rupture may weaponize what was taught as care.",
      }),
    },
  );

  await metaUpsert(
    META.firstWarning,
    "Opening terrain — first subtle warning",
    PLACE_TREE_LINE,
    [PERSON_CHILD, PERSON_HUNTER, PERSON_MARIE, PERSON_PROTECT, PERSON_ELDER],
    {
      environmentDescription:
        "Something at the edge fails to match the usual grammar — not alarm yet, but a missed beat.",
      sensoryField: "Bird silence; wrong dust timing; hunter’s body language tightening first.",
      historicalConstraints: "Ambiguous sign — not a factual raid timestamp.",
      socialConstraints: "Adults suppress panic vocabulary around children; information discipline.",
      characterStatesSummary:
        "Hunter: keyed. Marie: still face, faster eyes. Child: thinks adults are in a strange mood.",
      emotionalVoltage: "Dread as undertow — love still present, unease leaked.",
      centralConflict: "Interpretation vs. premature speech — vigilance without proof.",
      symbolicElements: "Threshold; listening; unfinished sound.",
      narrativePurpose: "Turn innocence toward pressure without naming raid — bridge to pre-rupture.",
      continuityDependencies: "Tree line + hunter state; Marie unease memory seeds.",
      notes: pressureBlock({
        env: "Wrong quiet; heat without release; storm smell maybe.",
        social: "Who is told what; children sent inward.",
        existential: "Safety imagined as permanent begins to crack — only for adults at first.",
        marie: "Time cost of disbelief — hope vs. read.",
        elder: "Pattern recognition from old stories — not prophecy, experience.",
        hunter: "Evidence vs. noise; duty to report without stampede.",
        aunt: "Busy hands as cover for fear.",
        protector: "Wanting a task; being told to stay.",
        trader: "If present — misread or innocent catalyst — author branch.",
        childSurface: "Adults stiff; play stops sooner than usual.",
        childBlind: "Geopolitics; what a raid is; names of enemies.",
        fixed: "No full explanation to child yet — personality-bound restraint.",
        downstream: "Silence shift scene completes the arc toward rupture.",
      }),
    },
  );

  await metaUpsert(
    META.silenceBefore,
    "Opening terrain — silence shift before rupture",
    PLACE_RIVER_EDGE,
    [PERSON_CHILD, PERSON_MARIE, PERSON_AUNT, PERSON_ELDER, PERSON_HUNTER, PERSON_CHILDREN_CLUSTER],
    {
      environmentDescription:
        "The river still sounds; the village quiets around it — attention moves inward while the world pretends normal.",
      sensoryField:
        "Water syllable; fewer jokes; longer pauses; hands finishing tasks without chatter; children told to stay close.",
      historicalConstraints: "Emotional timing prior to violence — not dated to a specific raid hour here.",
      socialConstraints: "Adults shield children from story until story is actionable; love as perimeter tightening.",
      characterStatesSummary:
        "Collective hush — child feels the day’s shape change without a name for it.",
      emotionalVoltage: "Grief-before-loss — innocence still intact but fragile.",
      centralConflict: "Normalcy performance vs. rising knowledge — unbearable politeness.",
      symbolicElements: "Water as constant; human sound as fragile overlay.",
      narrativePurpose: "Final innocence-layer simulation cell before canonical Alexis or raid-adjacent draft.",
      continuityDependencies: "Pre-attack setting state; adult unease fragments; Marie vigilance.",
      notes: pressureBlock({
        env: "Same river sound — now heard harder. Weather may mock with calm.",
        social: "Who is allowed to speak fear; who must work anyway.",
        existential: "End of taken-for-granted tomorrow — adults feel it first.",
        marie: "Where to put children if the edge confirms.",
        elder: "Which stories become instructions.",
        hunter: "What he will say when proof arrives.",
        aunt: "Busy tenderness — touch instead of talk.",
        protector: "Denied hero moment — must wait.",
        trader: "Gone or silent — space changes when outsider departs.",
        childSurface: "Shorter leash; more touches; fewer smiles from tired faces.",
        childBlind: "Invasion timelines; maps; names of powers.",
        fixed: "Child still loved — threat has not yet replaced care in gesture.",
        downstream: "Prologue / Terrain I can end here; Chapter 1 Alexis picks up after narrative jump as planned.",
      }),
    },
  );

  /* —— Relationships —— */
  const rel = async (
    a: string,
    b: string,
    data: {
      relationshipType: string;
      relationshipSummary: string;
      emotionalPattern?: string;
      powerDynamic?: string;
      notes?: string;
    },
  ) => {
    await prisma.characterRelationship.upsert({
      where: { personAId_personBId: { personAId: a, personBId: b } },
      update: data,
      create: { personAId: a, personBId: b, ...data },
    });
  };

  await rel(PERSON_AUNT, PERSON_MARIE, {
    relationshipType: "kin_parallel",
    relationshipSummary:
      "Sister-line or close cousin-line — shared childcare and vigilance; Marie leads final calls.",
    emotionalPattern: "Warm coordination; occasional friction under stress — stays private.",
    powerDynamic: "Marie slightly higher in child-safety veto — not competitive.",
    notes: "Exact genealogy author-defined; simulation tolerates ambiguity.",
  });

  await rel(PERSON_CHILD, PERSON_ELDER, {
    relationshipType: "grandparental_teaching",
    relationshipSummary: "Elder corrects and blesses in same gesture — child feels both shy and held.",
    emotionalPattern: "Respect mixed with itch to run — elder tolerates pulse.",
    notes: "Fictional tie — not fixed as blood grandparent.",
  });

  await rel(PERSON_CHILD, PERSON_HUNTER, {
    relationshipType: "peripheral_authority",
    relationshipSummary:
      "Adult male watchfulness without intimacy of women’s line — child obeys short commands.",
    emotionalPattern: "Awe and slight distance — not fear cult.",
    notes: "Keeps sentinel non-mystical; concrete trail knowledge.",
  });

  await rel(PERSON_CHILD, PERSON_PROTECT, {
    relationshipType: "sibling_cohort_protector",
    relationshipSummary:
      "Playmate + future protector imprint — tenderness without romance vocabulary for POV age.",
    emotionalPattern: "Safety in parallel motion; competition softened by kin obligation.",
    notes: "Optional downstream pairing — symbolic only in opening terrain.",
  });

  await rel(PERSON_CHILD, PERSON_TRADER, {
    relationshipType: "novelty_contact",
    relationshipSummary: "Child experiences visitor as sensory novelty — adults experience as social risk.",
    emotionalPattern: "Excitement vs. leash — Marie/aunt shorten radius.",
    notes: "Composite visitor — relationship not individualized unless draft expands.",
  });

  await rel(PERSON_CHILD, PERSON_CHILDREN_CLUSTER, {
    relationshipType: "peer_field",
    relationshipSummary: "Aggregate peers — games, noise, status micro-shifts.",
    emotionalPattern: "Joy and small rivalries; kinship buffering.",
    notes: "Link object for simulation; not a dyadic bond.",
  });

  await rel(PERSON_ELDER, PERSON_MARIE, {
    relationshipType: "intergenerational_alliance",
    relationshipSummary: "Elder carries time; Marie carries immediate child stakes — mutual reinforcement.",
    emotionalPattern: "Calm deference patterns in public; private counsel possible.",
    powerDynamic: "Elder moral authority; Marie operational authority in child danger moments.",
    notes: "No false queen-vs-queen — shared aim.",
  });

  await rel(PERSON_HUNTER, PERSON_MARIE, {
    relationshipType: "intel_counsel",
    relationshipSummary: "He brings edge facts; she integrates with women’s council and child placement.",
    emotionalPattern: "Sparse speech; high trust when stakes rise.",
    notes: "Plausible gendered info flow — author may adjust.",
  });

  /* —— Narrative rules (Constrained Free Will — author-facing) —— */
  const rule = async (id: string, title: string, description: string, category: string, strength: number, scope: string, notes: string) => {
    await prisma.narrativeRule.upsert({
      where: { id },
      update: { title, description, category, strength, scope, notes },
      create: { id, title, description, category, strength, scope, notes },
    });
  };

  await rule(
    "seed-nr-cfw-1",
    "Fixed endpoints, variable micro-paths",
    "Certain outcomes (e.g., rupture, displacement, documented lineage pressures) may be treated as narratively fixed once canonized. How characters walk toward those endpoints — small choices, sensory emphasis, which day a teaching lands — may vary without breaking continuity.",
    "structure",
    5,
    "global",
    "Constrained Free Will: bounded choice sets inside historically plausible corridors.",
  );

  await rule(
    "seed-nr-cfw-2",
    "Personality-bounded action",
    "No character may act outside their authored personality spine to service a twist. Pressure may increase choices; it does not rewrite core beliefs without arc support.",
    "character",
    5,
    "global",
    "Simulation drafts must respect CharacterProfile constraints.",
  );

  await rule(
    "seed-nr-cfw-3",
    "Symbolic laws",
    "Recurring symbols (smoke, river, trail, mortar) carry moral meaning once established. Drafts cannot invert them without a labeled frame shift (dream, unreliable memory, deliberate counter-myth).",
    "symbolism",
    4,
    "scene",
    "Protects emotional architecture across prologue / Terrain / Chapter 1 bridges.",
  );

  await rule(
    "seed-nr-cfw-4",
    "Historical plausibility gate",
    "Where recordType is historical or hybrid, draft generation must not invent ceremonial titles, political offices, or treaty specifics without archival support — use inference labels and OpenQuestion hooks instead.",
    "structure",
    5,
    "global",
    "Keeps DNA-aware story from collapsing into false documentary tone.",
  );

  await rule(
    "seed-nr-cfw-5",
    "Temporally anchored fields",
    "Opening terrain meta-scenes are untimed relative to raid duration — but once a timeline is chosen, downstream chapters must reconcile travel, season, and age tracks.",
    "structure",
    3,
    "scene",
    "Author-facing: pick anchoring explicitly when leaving simulation into prose.",
  );

  /* —— Continuity notes —— */
  await prisma.continuityNote.upsert({
    where: { id: "seed-cn-opening-innocence" },
    update: {
      title: "Opening innocence arc must complete emotional foundation before raid prose",
      description:
        "Reader affection for Grande Terre simulation must land before rupture scenes. Meta-scenes 1–7 are ordering tools — final prose may merge or split.",
      severity: "high",
      status: "open",
      sourceTraceNote: "Simulation pass 2026 — opening terrain.",
    },
    create: {
      id: "seed-cn-opening-innocence",
      title: "Opening innocence arc must complete emotional foundation before raid prose",
      description:
        "Reader affection for Grande Terre simulation must land before rupture scenes. Meta-scenes 1–7 are ordering tools — final prose may merge or split.",
      severity: "high",
      status: "open",
      sourceTraceNote: "Simulation pass 2026 — opening terrain.",
    },
  });

  await prisma.continuityNote.upsert({
    where: { id: "seed-cn-child-pov-voice" },
    update: {
      title: "Child POV: sensory and relational — not therapeutic interior",
      description:
        "Draft tools may reference personality models, but published prose for opening terrain stays concrete. Modern psychologizing is out of bounds.",
      severity: "medium",
      status: "open",
      linkedPersonId: PERSON_CHILD,
    },
    create: {
      id: "seed-cn-child-pov-voice",
      title: "Child POV: sensory and relational — not therapeutic interior",
      description:
        "Draft tools may reference personality models, but published prose for opening terrain stays concrete. Modern psychologizing is out of bounds.",
      severity: "medium",
      status: "open",
      linkedPersonId: PERSON_CHILD,
    },
  });

  await prisma.continuityNote.upsert({
    where: { id: "seed-cn-raid-timing" },
    update: {
      title: "Raid timing relative to opening meta-scenes is author-anchored",
      description:
        "Simulation holds pressure without a fixed hour. When prose draft fixes the raid, update SettingState, MetaScene dateEstimate, and related ContinuityNotes.",
      severity: "medium",
      status: "open",
    },
    create: {
      id: "seed-cn-raid-timing",
      title: "Raid timing relative to opening meta-scenes is author-anchored",
      description:
        "Simulation holds pressure without a fixed hour. When prose draft fixes the raid, update SettingState, MetaScene dateEstimate, and ContinuityNotes.",
      severity: "medium",
      status: "open",
    },
  });

  /* —— Open questions —— */
  const oq = async (
    id: string,
    title: string,
    description: string,
    priority: number,
    personId?: string,
    placeId?: string,
  ) => {
    await prisma.openQuestion.upsert({
      where: { id },
      update: { title, description, status: "open", priority, linkedPersonId: personId ?? null, linkedPlaceId: placeId ?? null },
      create: { id, title, description, status: "open", priority, linkedPersonId: personId ?? null, linkedPlaceId: placeId ?? null },
    });
  };

  await oq(
    "seed-oq-child-formal-identity",
    "How do we label opening child POV vs later formal identity (Marie Anne Thérèse) in admin and prose?",
    "Keep separate Person rows if voices diverge; use Alias or notes if they are the same historical subject — author decision pending.",
    1,
    PERSON_CHILD,
  );

  await oq(
    "seed-oq-opening-grounding",
    "What in the pre-contact opening terrain is historically grounded vs. inferential vs. fictional?",
    "Maintain RecordType per object; flag new claims when archival support is added.",
    2,
    undefined,
    PLACE_GT,
  );

  await oq(
    "seed-oq-raid-timing",
    "How is the raid timed relative to the innocence arc (same day, season, off-page gap)?",
    "Affects SettingState, MetaScene dateEstimate, and Chapter 1 handoff — decide before canon prose.",
    1,
  );

  await oq(
    "seed-oq-symbolic-laws",
    "Which symbolic laws are fixed for opening terrain (smoke, river, mortar) across branch drafts?",
    "List in NarrativeRule + Symbol records; changes require explicit author note.",
    2,
  );

  await oq(
    "seed-oq-archival-support",
    "Which opening details require later archival or tribal consultation before public-facing copy?",
    "Track per Claim or Source; keep PRIVATE visibility until reviewed.",
    3,
    undefined,
    PLACE_VILLAGE_CORE,
  );

  /* NarrativeBinding: link rules to opening meta-scenes conceptually - optional */
  await prisma.narrativeBinding.deleteMany({
    where: { id: { in: ["seed-nb-rule-opening-1", "seed-nb-rule-opening-2"] } },
  });
  await prisma.narrativeBinding.createMany({
    data: [
      {
        id: "seed-nb-rule-opening-1",
        sourceType: "narrative_rule",
        sourceId: "seed-nr-cfw-1",
        targetType: "meta_scene",
        targetId: META.silenceBefore,
        relationship: "influences",
        strength: 4,
        notes: "Endpoint pressure vs. micro-variation in approach scenes.",
      },
      {
        id: "seed-nb-rule-opening-2",
        sourceType: "narrative_rule",
        sourceId: "seed-nr-cfw-3",
        targetType: "meta_scene",
        targetId: META.morningSmoke,
        relationship: "expresses",
        strength: 4,
        notes: "Smoke symbolism established early.",
      },
    ],
  });
}
