import type {
  CharacterBiologicalState,
  CharacterDevelopmentProfile,
  CharacterIntelligenceProfile,
  WorldExpressionProfile,
  WorldKnowledgeProfile,
} from "@prisma/client";
import type { CognitiveEnvelope } from "@/lib/intelligence-types";

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 50;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** World-era affordances for what can be conceptualized (stub: surfaces profile fields). */
export function evaluateCharacterKnowledgeHorizon(
  world: WorldKnowledgeProfile | null,
): {
  abstractionCeiling: number;
  informationFlow: number;
  technologyReach: number;
  tabooLoad: number;
} {
  if (!world) {
    return { abstractionCeiling: 50, informationFlow: 50, technologyReach: 50, tabooLoad: 0 };
  }
  const tabooArr = world.tabooKnowledgeDomains;
  const tabooLoad =
    Array.isArray(tabooArr) ? Math.min(100, tabooArr.length * 12) : typeof tabooArr === "object" && tabooArr !== null ? 20 : 0;
  return {
    abstractionCeiling: world.abstractionCeiling,
    informationFlow: world.informationFlowSpeed,
    technologyReach: world.abstractionCeiling,
    tabooLoad,
  };
}

/** Development / age slice — regulation and responsibility vs expressive bandwidth (stub). */
export function evaluateCharacterMaturity(
  dev: CharacterDevelopmentProfile | null,
): {
  regulation: number;
  responsibilityDrag: number;
  protectedness: number;
} {
  if (!dev) {
    return { regulation: 50, responsibilityDrag: 0, protectedness: 50 };
  }
  const drag = clamp((dev.responsibilityLoad + dev.roleCompression) / 2 - 25, 0, 40);
  return {
    regulation: dev.regulationLevel,
    responsibilityDrag: drag,
    protectedness: dev.protectednessExposure,
  };
}

/** Raw inference capacity adjusted by biological load (fatigue, stress, pain). */
export function evaluateCharacterInferenceCapacity(
  intel: CharacterIntelligenceProfile | null,
  bio: CharacterBiologicalState | null,
): {
  workingCognition: number;
  metacognitionSustainable: number;
  planningSustainable: number;
} {
  const baseIntel = intel
    ? avg([
        intel.patternRecognition,
        intel.workingMemory,
        intel.abstractionCapacity,
        intel.socialInference,
        intel.environmentalInference,
      ])
    : 50;
  const stress = bio?.chronicStress ?? 50;
  const fatigue = bio?.fatigueLoad ?? 50;
  const pain = bio?.bodyPain ?? 50;
  const illness = bio?.illnessLoad ?? 50;
  const burden = avg([stress, fatigue, pain, illness]);
  const penalty = clamp((burden - 40) * 0.35, 0, 35);

  const meta = intel?.metacognition ?? 50;
  const plan = intel?.planningHorizon ?? 50;

  return {
    workingCognition: clamp(baseIntel - penalty),
    metacognitionSustainable: clamp(meta - penalty * 0.8),
    planningSustainable: clamp(plan - penalty * 0.6),
  };
}

/**
 * Merges world horizons, character cognition vectors, development, and biological state into prompt-facing ceilings.
 * OpenAI is the inference substrate; this envelope is the historically bounded mind wrapper.
 */
export function assembleCharacterCognitiveEnvelope(input: {
  worldKnowledge: WorldKnowledgeProfile | null;
  worldExpression: WorldExpressionProfile | null;
  intelligence: CharacterIntelligenceProfile | null;
  development: CharacterDevelopmentProfile | null;
  biological: CharacterBiologicalState | null;
}): CognitiveEnvelope {
  const wk = evaluateCharacterKnowledgeHorizon(input.worldKnowledge);
  const mat = evaluateCharacterMaturity(input.development);
  const inf = evaluateCharacterInferenceCapacity(input.intelligence, input.biological);

  const expr = input.worldExpression;
  const pubCeil = expr?.publicExpressionCeiling ?? 50;
  const intLang = expr?.internalLanguageComplexityNorm ?? 50;

  const intel = input.intelligence;
  const abstrChar = intel?.abstractionCapacity ?? 50;
  const exprChar = intel?.expressionComplexity ?? 50;

  const abstractionCeiling = clamp(Math.min(wk.abstractionCeiling, abstrChar) - mat.responsibilityDrag * 0.25);
  const expressionCeiling = clamp(Math.min(pubCeil, intLang, exprChar) - mat.responsibilityDrag * 0.15);
  const inferentialCeiling = clamp(Math.min(inf.workingCognition, wk.informationFlow) - wk.tabooLoad * 0.15);
  const planningHorizon = clamp(inf.planningSustainable);
  const impulse = intel?.impulseControl ?? 50;
  const maturityAdjustedDecisionSpace = clamp(
    inf.metacognitionSustainable * 0.35 + impulse * 0.25 + (100 - mat.responsibilityDrag) * 0.4,
  );

  const notes: string[] = [
    `World abstraction ceiling (era): ${wk.abstractionCeiling}; character abstraction: ${abstrChar} → blended ${Math.round(abstractionCeiling)}.`,
    `Inference substrate ceiling (working cognition): ${Math.round(inf.workingCognition)}; inferential blend ${Math.round(inferentialCeiling)}.`,
    `Expression ceiling (world × character): ${Math.round(expressionCeiling)}.`,
    `Development: regulation ${mat.regulation}, protectedness ${mat.protectedness}, responsibility drag ~${Math.round(mat.responsibilityDrag)}.`,
  ];

  return {
    inferentialCeiling,
    abstractionCeiling,
    expressionCeiling,
    planningHorizon,
    maturityAdjustedDecisionSpace,
    notes,
  };
}
