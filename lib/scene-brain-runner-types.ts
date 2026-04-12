import type {
  CharacterBrainBundle,
  CharacterBrainState,
  CounterpartResolutionSource,
  ScalarBand,
} from "@/lib/brain-assembly-types";

export type SceneSpeechWindow = {
  canSpeak: boolean;
  style: "silent" | "guarded" | "selective" | "open";
  safeTopics: string[];
  unsafeTopics: string[];
  blockers: string[];
};

export type RankedActionTension = {
  safestAction: string | null;
  mostLikelyAction: string | null;
  highestRiskTemptingAction: string | null;
  tensionNotes: string[];
};

export type SceneActionWindow = {
  available: string[];
  blocked: string[];
  costly: string[];
  ranked: RankedActionTension;
};

export type RunnerTraceCoreLabel =
  | "salience"
  | "interpretation"
  | "regulation"
  | "speech"
  | "action"
  | "tension";

export type RunnerTraceCounterpartLabel =
  | "watched_by_counterpart"
  | "safety_from_counterpart"
  | "judgment_from_counterpart"
  | "disclose_pull_counterpart"
  | "mask_from_counterpart";

export type RunnerTraceLine = {
  label: RunnerTraceCoreLabel | RunnerTraceCounterpartLabel;
  summary: string;
  drivers: string[];
};

export type SceneTimeBrainCounterpartSummary = {
  counterpartPersonId: string;
  displayName: string;
  dyadLoaded: boolean;
  resolutionSource?: CounterpartResolutionSource;
};

export type SceneTimeBrainRunnerInput = {
  personId: string;
  worldStateId: string;
  sceneId?: string | null;
  /** Optional; must match bundle loader for counterpartContext to apply. */
  counterpartPersonId?: string | null;
  bundle: CharacterBrainBundle;
  brain: CharacterBrainState;
  sceneConstraints?: {
    revealBudget?: ScalarBand;
    pressureTags?: string[];
    blockedActions?: string[];
    forcedStillness?: boolean;
    immediateSignals?: string[];
    objective?: string | null;
    socialExposure?: ScalarBand;
    violenceProximity?: ScalarBand;
  } | null;
};

export type SceneTimeBrainRunnerOutput = {
  personId: string;
  worldStateId: string;
  sceneId?: string | null;
  counterpartSummary: SceneTimeBrainCounterpartSummary | null;
  salientSignals: string[];
  dominantInterpretation: string;
  regulationMode: "stable" | "guarded" | "overloaded" | "frozen" | "flooded";
  speechWindow: SceneSpeechWindow;
  actionWindow: SceneActionWindow;
  mostLikelyMove: string | null;
  primaryFear: string;
  runnerTrace: RunnerTraceLine[];
  runnerNotes: string[];
};
