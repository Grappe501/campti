import type { EnneagramArchetype, EnneagramInnerVoicePattern } from "@/lib/domain/enneagram";

/**
 * Deterministic Enneagram knowledge for narrative cognition (not clinical diagnosis).
 * Each row is machine-usable: strings feed prompts; targets drive stress/growth shaping.
 */
export type NineTypeKnowledgeRow = {
  type: EnneagramArchetype;
  coreFearDefault: string;
  coreDesireDefault: string;
  viceDefault: string;
  virtueDefault: string;
  /** Classical ego-fixation label (narrative cognition; not clinical). */
  egoFixationDefault: string;
  stressTarget: EnneagramArchetype;
  growthTarget: EnneagramArchetype;
  stressMovementNotes: string;
  growthMovementNotes: string;
  innerVoiceToneDefaults: string;
  selfJustificationDefaults: string;
  contradictionDefaults: string;
  tabooHandlingPattern: string;
  voicePattern: EnneagramInnerVoicePattern;
};

const VP = (
  partial: EnneagramInnerVoicePattern
): EnneagramInnerVoicePattern => partial;

export const NINE_TYPE_KNOWLEDGE: Record<EnneagramArchetype, NineTypeKnowledgeRow> = {
  ONE: {
    type: "ONE",
    coreFearDefault:
      "being corrupt, evil, defective, or morally failing in a way that cannot be corrected",
    coreDesireDefault: "integrity, balance, right action, and a world that matches a good standard",
    viceDefault: "resentment and suppressed anger framed as principled correction",
    virtueDefault: "serenity",
    egoFixationDefault: "resentment",
    stressTarget: "FOUR",
    growthTarget: "SEVEN",
    stressMovementNotes:
      "Under sustained pressure, attention collapses into brooding comparison and personal defectiveness; ideals feel unreachable.",
    growthMovementNotes:
      "Under relief, mind opens to spontaneous joy, curiosity, and acceptance without constant correction.",
    innerVoiceToneDefaults: "prosecutor-and-jury; should-statements; measured moral inventory",
    selfJustificationDefaults: "duty, standards, responsibility to what is right",
    contradictionDefaults: "demands perfection yet envies those who break rules without consequence",
    tabooHandlingPattern:
      "splits experience into clean vs corrupt; forbidden impulses routed through harsh self-judgment before admission",
    voicePattern: VP({
      selfNarrationStyle: "inspector reporting on self and others",
      primaryDeflectionStyle: "reframe impulse as ethical problem",
      shameStyle: "cold, cataloguing shame; lists failures",
      fearStyle: "fear of hidden stain or irreversible wrongness",
      desireStyle: "desire framed as duty to be good",
      controlStyle: "control through rules, schedules, correction",
      conflictStyle: "argument as principle; escalation via standards",
      selfDeceptionStyle: "moral certainty masking resentment",
      tabooProcessingStyle: "sanitize by reframing; if too hot, moralize it",
    }),
  },
  TWO: {
    type: "TWO",
    coreFearDefault: "being unwanted, unloved, dispensable, or without place in the human weave",
    coreDesireDefault: "to be loved, needed, and indispensable to someone who matters",
    viceDefault: "pride expressed as helpful indispensability and hidden ledgers of debt",
    virtueDefault: "humility",
    egoFixationDefault: "flattery",
    stressTarget: "EIGHT",
    growthTarget: "FOUR",
    stressMovementNotes:
      "Pressure triggers blunt control, territorial anger, and open demands—helpfulness drops for dominance.",
    growthMovementNotes:
      "Safety allows authentic feeling, boundaries, and desire named without bargaining.",
    innerVoiceToneDefaults: "warm, solicitous, then sharp if unthanked",
    selfJustificationDefaults: "care, loyalty, what others truly need (as I see it)",
    contradictionDefaults: "insists selflessness while tracking who owes whom",
    tabooHandlingPattern:
      "desire routed through caretaking; forbidden selfishness becomes ‘for your good’",
    voicePattern: VP({
      selfNarrationStyle: "caretaker diary; who hurts, who needs me",
      primaryDeflectionStyle: "move attention to others’ pain",
      shameStyle: "hot shame when rejected; ‘too much’ shame",
      fearStyle: "fear of abandonment or replacement",
      desireStyle: "desire as closeness and being chosen",
      controlStyle: "control through obligation, charm, helpful leverage",
      conflictStyle: "hurt accusation or sudden cold withdrawal",
      selfDeceptionStyle: "denies neediness by over-giving",
      tabooProcessingStyle: "convert taboo want into moral service",
    }),
  },
  THREE: {
    type: "THREE",
    coreFearDefault: "being worthless, exposed as a fraud, or failing publicly in what counts",
    coreDesireDefault: "to feel valuable, admirable, and successful in the eyes that matter",
    viceDefault: "deceit of image—performance, selective truth, charm as armor",
    virtueDefault: "authenticity",
    egoFixationDefault: "vanity",
    stressTarget: "NINE",
    growthTarget: "SIX",
    stressMovementNotes:
      "Pressure produces numbness, procrastination, merging, and quiet resentment—momentum hides.",
    growthMovementNotes:
      "Growth brings loyalty tests, sober risk assessment, and willingness to depend on others.",
    innerVoiceToneDefaults: "resume voice; metrics; winning and optics",
    selfJustificationDefaults: "results, responsibility, what the role requires",
    contradictionDefaults: "needs admiration yet despises the mask required to earn it",
    tabooHandlingPattern:
      "reframes vulnerability as brand risk; taboo failure is edited out of story",
    voicePattern: VP({
      selfNarrationStyle: "performance review inside the skull",
      primaryDeflectionStyle: "pivot to tasks and image repair",
      shameStyle: "shame as humiliation and exposure",
      fearStyle: "fear of being seen empty or ordinary",
      desireStyle: "desire as rank, proof, being chosen as best",
      controlStyle: "control through narrative, charm, workload",
      conflictStyle: "competitive framing; reframes loss",
      selfDeceptionStyle: "confuses feeling with optics",
      tabooProcessingStyle: "repackage taboo as ambition or strategy",
    }),
  },
  FOUR: {
    type: "FOUR",
    coreFearDefault: "having no identity or significance—being ordinary, abandoned, or emotionally cut off",
    coreDesireDefault: "to find self and be deeply understood in one’s particularity",
    viceDefault: "envy—longing framed as taste, wound, and distance from the ‘simple happy’",
    virtueDefault: "equanimity",
    egoFixationDefault: "melancholy",
    stressTarget: "TWO",
    growthTarget: "ONE",
    stressMovementNotes:
      "Stress collapses into people-pleasing, cling, and resentment when love is conditional.",
    growthMovementNotes:
      "Growth steadies into principle, craft, and disciplined creation instead of endless mood.",
    innerVoiceToneDefaults: "lyric, mournful, identity archaeology",
    selfJustificationDefaults: "truth of feeling; authenticity over convenience",
    contradictionDefaults: "wants uniqueness yet aches to be normal when alone",
    tabooHandlingPattern:
      "romanticizes taboo; turns shame into aesthetic and story; can fetishize wound",
    voicePattern: VP({
      selfNarrationStyle: "poet-witness to inner weather",
      primaryDeflectionStyle: "intensify feeling to claim realness",
      shameStyle: "melting shame; defective self",
      fearStyle: "fear of being unseen or replaced",
      desireStyle: "desire as fusion and being special",
      controlStyle: "control through mood, withdrawal, aesthetic",
      conflictStyle: "dramatic truth-telling; tests of loyalty",
      selfDeceptionStyle: "story of uniqueness masks ordinary needs",
      tabooProcessingStyle: "absorb taboo into identity myth",
    }),
  },
  FIVE: {
    type: "FIVE",
    coreFearDefault: "being overwhelmed, invaded, emptied, or incompetent in a world that demands too much",
    coreDesireDefault: "mastery, self-sufficiency, and enough inner space to think clearly",
    viceDefault: "avarice of energy—hoarding time, knowledge, privacy",
    virtueDefault: "non-attachment",
    egoFixationDefault: "stinginess",
    stressTarget: "SEVEN",
    growthTarget: "EIGHT",
    stressMovementNotes:
      "Stress scatters into distraction, manic options, and brittle cheer—boundaries blur oddly.",
    growthMovementNotes:
      "Growth moves into directness, bodily presence, and protective action without over-analysis.",
    innerVoiceToneDefaults: "analyst; sparse; observational",
    selfJustificationDefaults: "accuracy, preparation, conservation of strength",
    contradictionDefaults: "needs closeness yet experiences closeness as drain",
    tabooHandlingPattern:
      "intellectualize taboo; study it; keep it at distance until safe",
    voicePattern: VP({
      selfNarrationStyle: "lab notes on social threat and bandwidth",
      primaryDeflectionStyle: "withdraw and model",
      shameStyle: "shame of ignorance or incompetence",
      fearStyle: "fear of invasion and depletion",
      desireStyle: "desire as competence and sanctuary",
      controlStyle: "control through limits, doors, information",
      conflictStyle: "detached critique; sudden bluntness when cornered",
      selfDeceptionStyle: "believes distance is neutral",
      tabooProcessingStyle: "classify taboo as data; delay embodiment",
    }),
  },
  SIX: {
    type: "SIX",
    coreFearDefault: "being without support, guidance, or security—abandoned to chaos or hostile force",
    coreDesireDefault: "safety, certainty, and trustworthy belonging",
    viceDefault: "fear run as loyalty tests, suspicion, and hypervigilance",
    virtueDefault: "courage",
    egoFixationDefault: "cowardice",
    stressTarget: "THREE",
    growthTarget: "NINE",
    stressMovementNotes:
      "Stress drives performance panic, image management, and ruthless practicality.",
    growthMovementNotes:
      "Growth softens into steadiness, tolerance, and less catastrophic forecasting.",
    innerVoiceToneDefaults: "risk ledger; scanning; contingency",
    selfJustificationDefaults: "prudence, duty to the group, realism",
    contradictionDefaults: "seeks authority yet resents authority when it fails",
    tabooHandlingPattern:
      "taboo mapped to threat categories; confession feels like security risk",
    voicePattern: VP({
      selfNarrationStyle: "briefing on threats and alliances",
      primaryDeflectionStyle: "seek counsel, rules, precedent",
      shameStyle: "shame of cowardice or betrayal",
      fearStyle: "fear of surprise attack or exile",
      desireStyle: "desire as pact and protection",
      controlStyle: "control through alliances, rules, vigilance",
      conflictStyle: "challenge loyalty; split factions",
      selfDeceptionStyle: "calls anxiety realism",
      tabooProcessingStyle: "report upward or hide; rarely casual",
    }),
  },
  SEVEN: {
    type: "SEVEN",
    coreFearDefault: "being trapped in pain, boredom, limitation, or emotional confinement",
    coreDesireDefault: "freedom, variety, and future possibility—life kept open",
    viceDefault: "gluttony for stimulation—escape through plan, story, and new frontiers",
    virtueDefault: "sobriety",
    egoFixationDefault: "planning",
    stressTarget: "ONE",
    growthTarget: "FIVE",
    stressMovementNotes:
      "Stress tightens into criticism, rules, and bitter judgment—fun curdles into fault-finding.",
    growthMovementNotes:
      "Growth slows into focus, depth, and tolerating limitation without panic.",
    innerVoiceToneDefaults: "fast, associative, possibility chatter",
    selfJustificationDefaults: "hope, opportunity, refusing needless suffering",
    contradictionDefaults: "flees pain yet creates chaos that returns pain",
    tabooHandlingPattern:
      "reframes taboo as adventure or joke; flees shame with new plan",
    voicePattern: VP({
      selfNarrationStyle: "travelogue of escapes and bright ideas",
      primaryDeflectionStyle: "change topic, add option, add humor",
      shameStyle: "brief hot shame then pivot",
      fearStyle: "fear of being caged or bored",
      desireStyle: "desire as more, newer, freer",
      controlStyle: "control through reframing and agenda",
      conflictStyle: "charm or exit; rarely stays still in guilt",
      selfDeceptionStyle: "optimism as denial",
      tabooProcessingStyle: "minimize, joke, or upgrade to new thrill",
    }),
  },
  EIGHT: {
    type: "EIGHT",
    coreFearDefault: "being harmed, controlled, humiliated, or at another’s mercy",
    coreDesireDefault: "self-protection and autonomy—life on one’s own terms",
    viceDefault: "lust for intensity—force, confrontation, appetite",
    virtueDefault: "innocence",
    egoFixationDefault: "vengefulness",
    stressTarget: "FIVE",
    growthTarget: "TWO",
    stressMovementNotes:
      "Stress withdraws into secret hoarding, suspicion, and minimalist retreat—force goes underground.",
    growthMovementNotes:
      "Growth opens into tenderness, chosen vulnerability, and protective care without domination.",
    innerVoiceToneDefaults: "command; territory; blunt force truth",
    selfJustificationDefaults: "justice as strength; protect the weak; refuse exploitation",
    contradictionDefaults: "demands honesty yet punishes vulnerability in others",
    tabooHandlingPattern:
      "taboo framed as weakness to destroy or weakness to secretly fear",
    voicePattern: VP({
      selfNarrationStyle: "war council; allies and enemies",
      primaryDeflectionStyle: "meet threat with counterforce",
      shameStyle: "shame masked as rage; rarely admits soft shame",
      fearStyle: "fear of submission or betrayal",
      desireStyle: "desire as power, loyalty, respect",
      controlStyle: "control through dominance, resources, presence",
      conflictStyle: "direct confrontation; tests",
      selfDeceptionStyle: "calls control protection",
      tabooProcessingStyle: "own it loudly or banish it",
    }),
  },
  NINE: {
    type: "NINE",
    coreFearDefault: "loss of connection, inner peace, or cohesion—being disturbed into nonbeing",
    coreDesireDefault: "inner stability, belonging, and gentle continuity",
    viceDefault: "sloth of soul—numbing, merging, postponing decisive selfhood",
    virtueDefault: "right action",
    egoFixationDefault: "indolence",
    stressTarget: "SIX",
    growthTarget: "THREE",
    stressMovementNotes:
      "Stress amplifies worry, suspicion, and anxious scanning—peace shatters into vigilance.",
    growthMovementNotes:
      "Growth awakens initiative, visibility, and accountable action without self-erasure.",
    innerVoiceToneDefaults: "soft, drifting, consensus-seeking",
    selfJustificationDefaults: "peace, patience, seeing all sides",
    contradictionDefaults: "wants agency yet avoids claiming want",
    tabooHandlingPattern:
      "taboo flattened or slept on; surfaces as passive resistance or sudden stubborn snap",
    voicePattern: VP({
      selfNarrationStyle: "background hum; everyone’s voice louder than mine",
      primaryDeflectionStyle: "go vague; agree; postpone",
      shameStyle: "diffuse shame; ‘not mattering’ shame",
      fearStyle: "fear of conflict and permanent rupture",
      desireStyle: "desire as comfort and belonging",
      controlStyle: "control through inertia, accommodation, stubborn passivity",
      conflictStyle: "avoid; passive-aggression when cornered",
      selfDeceptionStyle: "confuses peace with absence of self",
      tabooProcessingStyle: "minimize; swallow; rare explosion",
    }),
  },
};

export function getNineTypeKnowledge(
  type: EnneagramArchetype | null | undefined
): NineTypeKnowledgeRow | null {
  if (!type) return null;
  return NINE_TYPE_KNOWLEDGE[type] ?? null;
}

export function stressLineTarget(type: EnneagramArchetype): EnneagramArchetype {
  return NINE_TYPE_KNOWLEDGE[type].stressTarget;
}

export function growthLineTarget(type: EnneagramArchetype): EnneagramArchetype {
  return NINE_TYPE_KNOWLEDGE[type].growthTarget;
}
