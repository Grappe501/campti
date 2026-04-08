import type { EnneagramType } from "@prisma/client";

/** Canonical ordering for symmetric relationship rows: smaller id = personA. */
export function normalizePersonPair(a: string, b: string): { personAId: string; personBId: string } {
  return a < b ? { personAId: a, personBId: b } : { personAId: b, personBId: a };
}

type Wing = string | null | undefined;

export type EnneagramProfileDerived = {
  type: EnneagramType;
  wing: string | null;
  label: string;
  stressBehavior: string;
  growthBehavior: string;
  attentionBias: string;
  conflictStyle: string;
  relationalStyle: string;
  likelyPerceptionBias: string;
  likelySceneFocus: string;
  likelyBlindSpot: string;
  coreFear: string;
  coreLonging: string;
};

const LABELS: Record<EnneagramType, string> = {
  ONE: "Reformer / Perfectionist",
  TWO: "Helper / Giver",
  THREE: "Achiever / Performer",
  FOUR: "Individualist / Romantic",
  FIVE: "Investigator / Observer",
  SIX: "Loyalist / Sentinel",
  SEVEN: "Enthusiast / Epicure",
  EIGHT: "Challenger / Protector",
  NINE: "Peacemaker / Mediator",
};

const CORE: Record<
  EnneagramType,
  {
    fear: string;
    longing: string;
    stress: string;
    growth: string;
    attention: string;
    conflict: string;
    relational: string;
    perception: string;
    scene: string;
    blind: string;
  }
> = {
  ONE: {
    fear: "being corrupt, evil, or defective",
    longing: "integrity, goodness, and justified presence",
    stress: "Becomes more moody, self-critical, and fixated on what feels broken — nitpicking self and others.",
    growth: "Becomes more spontaneous, joyful, and accepting of human mess — allows pleasure and rest.",
    attention: "Error, impropriety, and moral slack — what should be corrected.",
    conflict: "Principled confrontation; can escalate into cold righteousness or suppressed resentment.",
    relational: "Helpful through standards and improvement; can feel like judgment disguised as care.",
    perception: "The world as a ledger of right/wrong; experiences land as verdicts first.",
    scene: "Rules, small failures, cleanliness, fairness, and who is allowed to break norms.",
    blind: "The cost of relentless correction — relationship warmth under critique.",
  },
  TWO: {
    fear: "being unwanted, dispensable, or unloved",
    longing: "to be loved for who they are, not only for what they give",
    stress: "Becomes more driven, competitive, and image-conscious — helping turns into proving worth.",
    growth: "Becomes more self-nurturing and emotionally honest — wants without bargaining.",
    attention: "Other people’s needs, moods, and openings to be needed.",
    conflict: "Indirect; guilt, martyrdom, or sudden sharpness when unappreciated.",
    relational: "Bonds through caretaking; can confuse intimacy with indispensability.",
    perception: "Social fields as need-maps — who is fragile, who can be helped, who might reject.",
    scene: "Who is hurting, who is indebted, who sees them, micro-slights of gratitude.",
    blind: "Their own limits and resentment until it leaks or bursts.",
  },
  THREE: {
    fear: "being worthless, a failure, or without value",
    longing: "to matter and be affirmed as genuinely admirable",
    stress: "Becomes more passive, numb, and avoidant — performance collapses into spacing out.",
    growth: "Becomes more cooperative, steady, and community-minded — success includes belonging.",
    attention: "Image, metrics, wins, optics, and who is impressed.",
    conflict: "Reframes, competes, or detaches; avoids shame at all costs until cornered.",
    relational: "Charm and usefulness; intimacy can feel like another stage.",
    perception: "Reality filtered for ‘what reads as success’ — feelings lag behind the scoreboard.",
    scene: "Applause cues, rivals, tasks, reputation stakes, and time pressure.",
    blind: "Authentic feeling and the unflattering truth that doesn’t ‘play.’",
  },
  FOUR: {
    fear: "having no identity or ordinary insignificance",
    longing: "to be fully seen in their specific inner weather",
    stress: "Becomes more clingy and people-pleasing — shame turns outward into merging and longing.",
    growth: "Becomes more objective, disciplined, and balanced — creates instead of only envying.",
    attention: "What’s missing, what hurts, what’s beautiful, and emotional nuance others skip.",
    conflict: "Withdrawal, dramatic truth-telling, or shame spirals; can torch bridges to feel real.",
    relational: "Intensity and mirroring; fears being ‘too much’ or ‘not special enough.’",
    perception: "Heightened symbolic reading — ordinary details feel personally weighted.",
    scene: "Atmosphere, longing, aesthetic charge, exclusion, and identity comparisons.",
    blind: "Shared mundane steadiness — the unromantic work of staying connected.",
  },
  FIVE: {
    fear: "being overwhelmed, invaded, or incompetent",
    longing: "to be capable, bounded, and permitted to exist without depletion",
    stress: "Becomes more scattered and escapist — thinking frays into anxious stimulation-seeking.",
    growth: "Becomes more engaged, bodily present, and assertive — acts from clarity, not only observation.",
    attention: "Threat to autonomy, unknown demands, and informational gaps.",
    conflict: "Withdrawal, intellectualizing, or sudden bluntness when reserves hit zero.",
    relational: "Distance as safety; generosity through knowledge or fixed roles.",
    perception: "The world as a set of systems and costs — experiences taxed in advance.",
    scene: "Crowding, noise, expectation, surveillance, and resource scarcity.",
    blind: "The emotional impact of their absence or coolness on others.",
  },
  SIX: {
    fear: "being without support, guidance, or security",
    longing: "safety, faith, and trustworthy belonging",
    stress: "Becomes more driven and image-focused — anxiety converts into proving and performing.",
    growth: "Becomes more relaxed, optimistic, and self-trusting — fear becomes proportionate.",
    attention: "Risk, loyalty signals, authority, and hidden agendas.",
    conflict: "Tests, suspicion, compliance explosions, or preemptive accusation under fear.",
    relational: "Seeks alliances; can bond through shared worry or shared enemies.",
    perception: "Reads for threat first — ambiguity feels like pending betrayal.",
    scene: "Who is in charge, what the rules are, exits, omens, and group temperature.",
    blind: "Their own aggression and how vigilance shapes the very threats they fear.",
  },
  SEVEN: {
    fear: "being trapped in pain, boredom, or limitation",
    longing: "freedom, variety, and a life spacious enough to stay hopeful",
    stress: "Becomes more critical and perfectionistic — scattered joy collapses into harsh control.",
    growth: "Becomes more focused, sorrow-capable, and grounded — stays with what hurts.",
    attention: "Possibilities, exits, fun, novelty, and anything that signals constriction.",
    conflict: "Jokes, reframes, flight, or manic escalation — avoids the shame of being ‘stuck.’",
    relational: "Enthusiasm and generosity; can fear deep dependency as a cage.",
    perception: "Opportunity-rich — pain is often rerouted into plans and silver linings.",
    scene: "Open doors, schedules, sensory variety, and any whiff of confinement or grief.",
    blind: "Grief and other people’s slower needs when momentum is the drug.",
  },
  EIGHT: {
    fear: "being controlled, harmed, or violated",
    longing: "to protect what matters and be self-authored in a blunt world",
    stress: "Becomes more secretive and withdrawn — force retreats into wary scanning.",
    growth: "Becomes more tender, cooperative, and mercy-aware — strength includes restraint.",
    attention: "Power moves, disrespect, weakness in protectors, and boundary violations.",
    conflict: "Direct escalation; can confuse honesty with impact; fights to feel real.",
    relational: "Protector energy; loyalty through shelter — intimacy can feel like vulnerability tax.",
    perception: "Strength-first — reads intention as challenge or alliance.",
    scene: "Injustice, humiliation, who is prey, who is shield, and who is lying.",
    blind: "Their own intimidation footprint and others’ need for softness without a duel.",
  },
  NINE: {
    fear: "loss of connection, inner fragmentation, or pointless conflict",
    longing: "inner peace, belonging, and coherent presence",
    stress: "Becomes more anxious and searching for reassurance — peace fractures into worry and doubt.",
    growth: "Becomes more self-possessed, initiating, and clear — shows up with agenda.",
    attention: "Friction, demands, other people’s agendas, and inner numbness.",
    conflict: "Stubborn passivity, merging, or sudden bursts when pushed too far.",
    relational: "Easy presence; avoids rocking boats until resentment stockpiles.",
    perception: "Blends with the room — notices comfort and disturbance late.",
    scene: "Harmony, pacing, shared space, and anything that forces a stance.",
    blind: "Their own wants and the cumulative cost of self-erasure.",
  },
};

function wingNote(type: EnneagramType, wing: Wing): string | null {
  if (!wing || !wing.trim()) return null;
  const w = wing.trim().toUpperCase();
  return `Wing accent (${w}): neighboring tone may tint ${LABELS[type]} — treat as flavor, not a second core type.`;
}

/** Deterministic merged profile from type + optional wing hint. */
export function getEnneagramProfile(type: EnneagramType, wing?: Wing): EnneagramProfileDerived {
  const c = CORE[type];
  const wingLine = wingNote(type, wing);
  return {
    type,
    wing: wing?.trim() ? wing.trim().toUpperCase() : null,
    label: LABELS[type],
    stressBehavior: c.stress + (wingLine ? ` ${wingLine}` : ""),
    growthBehavior: c.growth,
    attentionBias: c.attention,
    conflictStyle: c.conflict,
    relationalStyle: c.relational,
    likelyPerceptionBias: c.perception,
    likelySceneFocus: c.scene,
    likelyBlindSpot: c.blind,
    coreFear: c.fear,
    coreLonging: c.longing,
  };
}

export function deriveStressBehavior(type: EnneagramType): string {
  return CORE[type].stress;
}

export function deriveGrowthBehavior(type: EnneagramType): string {
  return CORE[type].growth;
}

export function deriveAttentionBias(type: EnneagramType): string {
  return CORE[type].attention;
}

export function deriveConflictStyle(type: EnneagramType): string {
  return CORE[type].conflict;
}

export function deriveRelationalStyle(type: EnneagramType): string {
  return CORE[type].relational;
}

export function deriveLikelyPerceptionBias(type: EnneagramType): string {
  return CORE[type].perception;
}

export function deriveLikelySceneFocus(type: EnneagramType): string {
  return CORE[type].scene;
}

export function deriveLikelyBlindSpot(type: EnneagramType): string {
  return CORE[type].blind;
}

const TRIAD: Record<EnneagramType, "gut" | "heart" | "head"> = {
  ONE: "gut",
  TWO: "heart",
  THREE: "heart",
  FOUR: "heart",
  FIVE: "head",
  SIX: "head",
  SEVEN: "head",
  EIGHT: "gut",
  NINE: "gut",
};

/**
 * Interpretive dyad read — heuristic, not predictive of real people.
 * Describes common friction and complementary moves between two patterns.
 */
export function deriveRelationshipDynamic(typeA: EnneagramType, typeB: EnneagramType): string {
  const a = CORE[typeA];
  const b = CORE[typeB];
  const ta = TRIAD[typeA];
  const tb = TRIAD[typeB];
  const triadNote =
    ta === tb
      ? `Shared ${ta} center — they may recognize each other’s “native dialect” of processing.`
      : `Different centers (${ta} vs ${tb}) — misreads often come from mismatched first questions (action vs image vs analysis).`;

  const friction = `A’s fear-gradient (“${a.fear.slice(0, 60)}…”) can collide with B’s (“${b.fear.slice(0, 60)}…”) when stress narrows generosity.`;
  const repair = `Repair often begins where A offers what B longs for (${b.longing.slice(0, 80)}…) without forcing B’s shame trigger, and B returns presence without demanding A perform worth.`;

  return [triadNote, friction, repair].join(" ");
}
