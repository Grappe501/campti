export const AUTHOR_INTENT_CONTRACT_VERSION = "1" as const;

export type AuthorIntentSignal = {
  signalId: string;
  weightDelta: number;
};

export type AuthorIntent = {
  contractVersion: typeof AUTHOR_INTENT_CONTRACT_VERSION;
  emphasisSignals: AuthorIntentSignal[];
  suppressionSignals: AuthorIntentSignal[];
  pressureAdjustments: AuthorIntentSignal[];
  chapterLevelShaping: string[];
  bookLevelShaping: string[];
};

export type AuthorSteeringResult = {
  appliedWeightDeltas: Record<string, number>;
  rejectedSignals: string[];
  forceOverrideApplied: false;
};
