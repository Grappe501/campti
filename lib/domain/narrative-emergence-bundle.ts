import type { ConsequenceEngineOutputSurface } from "@/lib/domain/consequence-engine";
import type { ConversationEmotionalContinuity } from "@/lib/domain/conversation-emotional-continuity";
import type { MemoryActivationSummary } from "@/lib/domain/memory-activation";
import type {
  StorylineGuidanceBundle,
  StorylineOrchestrationInputs,
} from "@/lib/domain/storyline-guidance-bundle";
import type { TemporalEvolutionSummary } from "@/lib/domain/temporal-evolution";

export const NARRATIVE_EMERGENCE_BUNDLE_CONTRACT_VERSION = "1" as const;

export type EmergenceMode = "scene_mode" | "interaction_mode";
export type EmergenceChannel = "canonical_dyad" | "reader_bond_dyad";

export type NarrativeEmergenceInputSurface = {
  consequenceOutput?: ConsequenceEngineOutputSurface | null;
  memoryActivation?: MemoryActivationSummary | null;
  emotionalContinuity?: ConversationEmotionalContinuity | null;
  temporalEvolution?: TemporalEvolutionSummary | null;
  relationshipTensionSignals?: string[] | null;
  storylineOrchestration?: StorylineOrchestrationInputs | null;
};

export type NarrativeEmergenceBundle = {
  contractVersion: typeof NARRATIVE_EMERGENCE_BUNDLE_CONTRACT_VERSION;
  mode: EmergenceMode;
  channel: EmergenceChannel;
  relationshipPressures: Array<{
    pressureCode: string;
    weight: number;
  }>;
  activeConsequenceSummaries: Array<{
    consequenceId: string;
    category: string;
    severity: string;
    lifecycleState: string;
  }>;
  activatedMemorySummaries: Array<{
    memoryRefId: string;
    activationMode: string;
    activationWeight: number;
    disclosureRisk: string;
    distortionLikelihood: string;
  }>;
  temporalModifiers: {
    applied: boolean;
    elapsedIntervalHours: number;
    griefDurationStage: string;
    roleShift: string;
    relationshipBaselineDeltaMagnitude: number;
    memorySalienceDeltaMagnitude: number;
  } | null;
  emotionalContinuityModifiers: {
    currentAffectPressure: number;
    volatilityPressure: number;
    guardednessPressure: number;
    opennessPressure: number;
    avoidancePressure: number;
  } | null;
  behavioralConstraints: string[];
  disclosureTendencies: {
    tendency: "withhold" | "guarded_disclose" | "open_disclose";
    pressure: number;
  };
  conflictReconciliationPressures: {
    conflictPressure: number;
    reconciliationPressure: number;
    avoidancePressure: number;
  };
  explainability: {
    reasonCodes: string[];
  };
  storylineGuidance?: StorylineGuidanceBundle;
  debugExplanation?: {
    engineInputsUsed: string[];
    factorContributions: string[];
  };
};
