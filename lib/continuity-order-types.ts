import type {
  CharacterConsequenceMemoryProfile,
  CharacterEducationProfile,
  CharacterEmotionalHealthProfile,
  CharacterHealthEnvelope,
  CharacterLearningEnvelope,
  CharacterMentalHealthProfile,
  CharacterPhysicalHealthProfile,
  CharacterRumorReputationProfile,
  CharacterTraumaProfile,
  WorldEducationNormProfile,
  WorldHealthNormProfile,
} from "@prisma/client";
import type { CharacterIntelligenceBundle } from "@/lib/intelligence-types";
import type { CharacterPressureBundle } from "@/lib/pressure-order-types";
import type { CharacterRelationshipBundle } from "@/lib/relationship-order-types";

/** Full Stage 6.5 slice for admin + future simulation envelopes. */
export type CharacterContinuityBundle = {
  trauma: CharacterTraumaProfile | null;
  consequenceMemory: CharacterConsequenceMemoryProfile | null;
  rumorReputation: CharacterRumorReputationProfile | null;
  education: CharacterEducationProfile | null;
  learningEnvelope: CharacterLearningEnvelope | null;
  worldEducationNorm: WorldEducationNormProfile | null;
  worldHealthNorm: WorldHealthNormProfile | null;
  physicalHealth: CharacterPhysicalHealthProfile | null;
  mentalHealth: CharacterMentalHealthProfile | null;
  emotionalHealth: CharacterEmotionalHealthProfile | null;
  healthEnvelope: CharacterHealthEnvelope | null;
  /** Stage 5.5 — cognitive capacity vs knowledge horizon (when present). */
  intelligenceRef: CharacterIntelligenceBundle | null;
  /** Stage 5 — governance / socio-economic / family pressure (when present). */
  pressureRef: CharacterPressureBundle | null;
  /** Stage 6 — masking, desire, dyads (when present). */
  relationshipRef: CharacterRelationshipBundle | null;
};
