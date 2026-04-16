export const AUTHOR_COMMAND_COCKPIT_CONTRACT_VERSION = "1" as const;

export const AUTHOR_COCKPIT_SCOPES = ["scene", "chapter", "book", "epic"] as const;
export type AuthorCockpitScope = (typeof AUTHOR_COCKPIT_SCOPES)[number];

export type CockpitScopeContext = {
  scope: AuthorCockpitScope;
  sceneId?: string;
  chapterId?: string;
  bookId?: string;
  epicId?: string;
};

export type IndicatorSeverity = "low" | "medium" | "high";

export type CockpitIndicator = {
  key: string;
  label: string;
  value: string | number;
  severity: IndicatorSeverity;
  source: "governed_state";
  explainable: true;
};

export type ScopeIndicatorBank = {
  scope: AuthorCockpitScope;
  indicators: CockpitIndicator[];
};

export type ToolRailSection = {
  id: string;
  label: string;
  tools: string[];
};

export type CockpitToolRailSystem = {
  topBand: ToolRailSection;
  leftRail: ToolRailSection;
  rightRail: ToolRailSection;
  lowerLayer?: ToolRailSection;
};

export type GuidedSignal = {
  signalId: string;
  summary: string;
  rationale: string;
  severity: IndicatorSeverity;
  bounded: true;
  explainable: true;
  advisoryOnly: true;
};

export const AUTHOR_COMMAND_ACTIONS = [
  "inspect",
  "revise",
  "rebalance",
  "resolve_blocker",
  "enter_review_mode",
  "compare_states",
  "escalate_scope",
] as const;
export type AuthorCommandAction = (typeof AUTHOR_COMMAND_ACTIONS)[number];

export type AuthorCommandCockpitBundle = {
  contractVersion: typeof AUTHOR_COMMAND_COCKPIT_CONTRACT_VERSION;
  sourceOfTruth: "governed_author_state";
  context: CockpitScopeContext;
  centeredSurface: {
    scope: AuthorCockpitScope;
    title: string;
    subtitle: string;
  };
  toolRails: CockpitToolRailSystem;
  indicatorBank: ScopeIndicatorBank;
  guidedSignals: GuidedSignal[];
  availableActions: AuthorCommandAction[];
  beatAssembly?: {
    chapter: 1;
    beatCount: number;
    validationPassed: boolean;
    highestPressureLoad: number;
    salienceCoverage: number;
    memoryLinkedBeats: number;
    socialFeedbackBeats: number;
    meaningTraceBeats: number;
    summaryLine: string;
  };
  chapterState?: {
    chapterId: string;
    chapterMode: string;
    dominantPressures: string[];
    suppressedPressures: string[];
    movementPressure: number;
    decisionPressure: number;
    meaningLoad: number;
    allowedMeaningIntensity: string;
    validationPassed: boolean;
    riskFlags: string[];
    summaryLine: string;
  };
  bounded: true;
  explainable: true;
  nonOmniscient: true;
  mutatesCanonicalTruth: false;
};
