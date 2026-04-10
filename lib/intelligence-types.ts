import type {
  CharacterBiologicalState,
  CharacterDevelopmentProfile,
  CharacterIntelligenceProfile,
  WorldExpressionProfile,
  WorldKnowledgeProfile,
} from "@prisma/client";

/** Bundled character × world slice for Stage 5.5 admin and simulation. */
export type CharacterIntelligenceBundle = {
  intelligence: CharacterIntelligenceProfile | null;
  development: CharacterDevelopmentProfile | null;
  biological: CharacterBiologicalState | null;
  worldKnowledge: WorldKnowledgeProfile | null;
  worldExpression: WorldExpressionProfile | null;
};

/** Derived outputs from `assembleCharacterCognitiveEnvelope` (0–100 scales unless noted). */
export type CognitiveEnvelope = {
  inferentialCeiling: number;
  abstractionCeiling: number;
  expressionCeiling: number;
  planningHorizon: number;
  maturityAdjustedDecisionSpace: number;
  /** Short human-readable audit lines for prompts / inspection. */
  notes: string[];
};
