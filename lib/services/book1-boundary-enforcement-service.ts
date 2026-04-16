import type { Book1ProvisionalSegment } from "@/lib/services/book1-ingestion-scaffold";

export type ConfidenceBand = "high" | "medium" | "low";

export type BoundaryEvaluation = {
  inferredCategory: Book1ProvisionalSegment["category"];
  confidenceScore: number;
  confidenceBand: ConfidenceBand;
  sceneSignals: {
    sensory: boolean;
    movementOrPositioning: boolean;
    embodiedPerception: boolean;
  };
  interpretiveSignals: {
    meaningExplanation: boolean;
    abstractSystemBehavior: boolean;
    comparisonOrEvaluation: boolean;
  };
  lineageSignals: {
    namedIndividuals: boolean;
    explicitKinship: boolean;
    generationalSequence: boolean;
    lifeEventStructure: boolean;
    multiPersonRelationalStructure: boolean;
  };
  rejectedLineageCandidate: boolean;
  actions: string[];
};

const SENSORY_PATTERN = /\b(light|mist|sound|smell|taste|touch|texture|heat|cold|wind|river|rain|dawn)\b/i;
const MOVEMENT_OR_POSITION_PATTERN =
  /\b(stood|stands|stand|walked|walks|moved|moves|leaned|sat|sits|crossed|turned|near|beside|across|under)\b/i;
const EMBODIED_PERCEPTION_PATTERN =
  /\b(i |she |he |they |we )\b|\b(feels|felt|sees|saw|hears|heard|breath|body|inside|within|awareness)\b/i;

const INTERPRETIVE_MEANING_PATTERN = /\b(means|signifies|suggests|implies|indicates|therefore|reveals)\b/i;
const INTERPRETIVE_SYSTEM_PATTERN = /\b(system|structure|mechanism|behavior|pattern|governance|framework)\b/i;
const INTERPRETIVE_COMPARE_PATTERN = /\b(compared|contrast|better|worse|more than|less than|evaluate|assessment)\b/i;

const KINSHIP_PATTERN = /\b(mother|father|daughter|son|sister|brother|wife|husband|parent|child)\b/i;
const GENERATIONAL_PATTERN = /\b(generation|firstborn|second generation|elder|younger|descendant|ancestor)\b/i;
const LIFE_EVENT_PATTERN = /\b(born|birth|died|death|married|marriage|widowed)\b/i;
const RELATIONAL_STRUCTURE_PATTERN =
  /\b(son of|daughter of|child of|married to|parent of|line of|house of|between [A-Z][a-z]+ and [A-Z][a-z]+)\b/;

function confidenceBand(score: number): ConfidenceBand {
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

function detectNamedIndividuals(text: string): boolean {
  const matches = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g) ?? [];
  return new Set(matches).size >= 2;
}

function countTrue(values: boolean[]): number {
  return values.filter(Boolean).length;
}

function inferNonBoundaryFallback(text: string): Book1ProvisionalSegment["category"] {
  if (/\b(\d{3,4}|before|after|during|era|century|timeline|sequence)\b/i.test(text)) return "timeline_fact";
  if (/\b(symbol|motif|ritual|echo|metaphor|totem|mythic)\b/i.test(text)) return "symbolic_motif";
  if (/\b(observer|witness|noticed|watched|overheard|learning|learned|awareness)\b/i.test(text)) return "observer_passage";
  if (/\b(river|bank|forest|terrain|house|village|settlement|route|weather|mist)\b/i.test(text)) return "setting_passage";
  if (/\b(scene|moment|stood|walked|moved|spoke|looked|dawn)\b/i.test(text)) return "scene_fragment";
  return "atomic_claim";
}

export function evaluateBoundary(text: string): BoundaryEvaluation {
  const actions: string[] = [];
  const normalized = text.trim();

  const sceneSignals = {
    sensory: SENSORY_PATTERN.test(normalized),
    movementOrPositioning: MOVEMENT_OR_POSITION_PATTERN.test(normalized),
    embodiedPerception: EMBODIED_PERCEPTION_PATTERN.test(normalized),
  };
  const sceneSignalCount = countTrue(Object.values(sceneSignals));

  const interpretiveSignals = {
    meaningExplanation: INTERPRETIVE_MEANING_PATTERN.test(normalized),
    abstractSystemBehavior: INTERPRETIVE_SYSTEM_PATTERN.test(normalized),
    comparisonOrEvaluation: INTERPRETIVE_COMPARE_PATTERN.test(normalized),
  };
  const interpretiveSignalCount = countTrue(Object.values(interpretiveSignals));

  const lineageSignals = {
    namedIndividuals: detectNamedIndividuals(normalized),
    explicitKinship: KINSHIP_PATTERN.test(normalized),
    generationalSequence: GENERATIONAL_PATTERN.test(normalized),
    lifeEventStructure: LIFE_EVENT_PATTERN.test(normalized),
    multiPersonRelationalStructure: RELATIONAL_STRUCTURE_PATTERN.test(normalized),
  };
  const lineageSignalCount = countTrue(Object.values(lineageSignals));
  const lineageKeywordCandidate = /\b(lineage|genealogy|ancestor|descendant|clan|family|tribe|people)\b/i.test(normalized);
  const rejectedLineageCandidate = lineageKeywordCandidate && lineageSignalCount < 2;

  if (rejectedLineageCandidate) {
    actions.push("rejected_lineage_candidate_insufficient_structure");
  }

  const isScene = sceneSignalCount >= 3;
  const isInterpretive = interpretiveSignalCount >= 2;
  const isLineage = lineageSignalCount >= 2;

  let inferredCategory: Book1ProvisionalSegment["category"];
  let score = 0.52;

  if (isInterpretive) {
    inferredCategory = "interpretive_passage";
    score = 0.62 + interpretiveSignalCount * 0.11;
    if (isScene) {
      actions.push("boundary_enforcement_scene_overridden_by_interpretive");
    }
  } else if (isLineage) {
    inferredCategory = "lineage_fact";
    score = 0.6 + lineageSignalCount * 0.09;
  } else if (isScene) {
    inferredCategory = "scene_fragment";
    score = 0.64 + sceneSignalCount * 0.1;
  } else {
    inferredCategory = inferNonBoundaryFallback(normalized);
    score = inferredCategory === "atomic_claim" ? 0.48 : 0.57;
  }

  score = Math.max(0, Math.min(0.98, score));
  return {
    inferredCategory,
    confidenceScore: score,
    confidenceBand: confidenceBand(score),
    sceneSignals,
    interpretiveSignals,
    lineageSignals,
    rejectedLineageCandidate,
    actions,
  };
}
