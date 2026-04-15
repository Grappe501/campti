/**
 * P3-O — Deterministic emotional continuity payload for bounded conversation mode.
 */
import type { DyadicRelationshipPosture } from "@/lib/domain/dyadic-relationship";
import type { ConsequenceEngineChannel, ConsequenceEngineOutputSurface } from "@/lib/domain/consequence-engine";
import type { MemoryActivationChannel, MemoryActivationContext, MemoryActivationSummary } from "@/lib/domain/memory-activation";
import type {
  RelationshipProgressionChannel,
  RelationshipProgressionSignals,
} from "@/lib/domain/relationship-progression";

export type EmotionalContinuityChannel = "canonical_dyad" | "reader_bond_dyad";
export type EmotionalContinuityMode = "scene_mode" | "interaction_mode";

export type EmotionalContinuityStructuralInputs = {
  relationshipProgression?: {
    channel: RelationshipProgressionChannel;
    signals: RelationshipProgressionSignals;
    posture: DyadicRelationshipPosture | null;
    axes: {
      trust: number;
      fear: number;
      resentment: number;
      stability: number;
    };
  } | null;
  consequenceOutput?: {
    channel: ConsequenceEngineChannel;
    output: ConsequenceEngineOutputSurface;
  } | null;
  memoryActivation?: (MemoryActivationSummary & {
    context: MemoryActivationContext;
    channel: MemoryActivationChannel;
  }) | null;
};

export type EmotionalContinuityPressureState = {
  currentAffectPressure: number;
  volatilityPressure: number;
  guardednessPressure: number;
  opennessPressure: number;
  griefFearResentmentCarryover: {
    grief: number;
    fear: number;
    resentment: number;
  };
  conflictReadinessPressure: number;
  avoidancePressure: number;
  reasonCodes: string[];
};

export type ConversationEmotionalContinuity = {
  baselineTone: string;
  currentConversationTone: string;
  carryoverSignals: string[];
  continuityWarnings: string[];
  channel: EmotionalContinuityChannel;
  mode: EmotionalContinuityMode;
  pressureState: EmotionalContinuityPressureState;
};
