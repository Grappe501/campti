/**
 * Scene Detail Research Tab — scene-local read models (RICRE lens, not a second workbench).
 */

export const SCENE_RESEARCH_TAB_CONTRACT_VERSION = "1" as const;

export type SceneResearchRelevance =
  | "direct_scene_link"
  | "chapter_link"
  | "person_link"
  | "place_link"
  | "explicit_topic_link"
  | "accepted_scene_canon"
  | "accepted_entity_canon"
  | "accepted_chapter_canon";

export type SceneResearchContradictionSeverity = "blocking" | "warning" | "observational";

export type SceneResearchSummary = {
  acceptedCanonCount: number;
  openClaimsCount: number;
  contradictionShapedCount: number;
  linkedTargetsCount: number;
  lastRelevantDecisionAtIso: string | null;
  advisoryLabels: string[];
};

export type SceneAcceptedCanonItem = {
  canonRecordId: string;
  targetType: string;
  targetId: string;
  knowledgeType: string;
  contentPreview: string;
  canonicalStatus: string;
  historicalRealityStatus: string;
  storyRealityStatus: string;
  sourceLinkCount: number;
  updatedAtIso: string;
  /** Latest `AuthorCanonDecision` that materialized or updated this canon row, if any. */
  lastCanonDecisionAtIso: string | null;
  relevance: SceneResearchRelevance;
  relevanceExplanation: string;
  /** Human-readable provenance / trust line (not a fake tier on the row itself). */
  trustSummary: string;
};

export type SceneResearchTargetLink = {
  targetId: string;
  targetType: string;
  targetName: string;
  researchIntent: string | null;
  updatedAtIso: string;
  primaryRelevance: SceneResearchRelevance;
  relevanceExplanation: string;
  openClaimCount: number;
  sourceCount: number;
};

export type SceneResearchClaimItem = {
  claimId: string;
  researchTargetId: string;
  targetName: string;
  sourceId: string;
  sourceTitle: string;
  claimText: string;
  normalizedPreview: string | null;
  claimStatus: string;
  extractionMethod: string;
  extractionHonestyLabel: "heuristic_stub";
  comparisonStatus: string;
  contradictionFlag: boolean;
  /** Evidence summary when present (heuristic extraction). */
  evidenceSnippet: string | null;
  /** Prior author decisions on this claim (audit); open status can still be unresolved vs canon. */
  priorDecisionCount: number;
  relevance: SceneResearchRelevance;
  relevanceExplanation: string;
};

export type SceneResearchContradictionItem = {
  claimId: string;
  claimTextPreview: string;
  comparisonId: string;
  comparisonResult: string;
  contradictionType: string | null;
  impactScope: string | null;
  affectedTargetType: string | null;
  affectedTargetId: string | null;
  severity: SceneResearchContradictionSeverity;
  recommendedNextStep: string;
  honestyLabel: "approximate_contradiction_shape";
};

export type SceneResearchSourceItem = {
  sourceId: string;
  researchTargetId: string;
  targetName: string;
  sourceTitle: string;
  sourceTrustTier: string;
  ingestMethod: string;
  provenanceHash: string;
  fetchHonestyLabel: "no_network" | "bounded_single_url" | "fetch_failed";
  accessDateIso: string;
};

export type SceneResearchEntityImpact = {
  entityKind: "person" | "place";
  entityId: string;
  entityName: string;
  acceptedCanonCount: number;
  openClaimCount: number;
  contradictionCount: number;
  lastDecisionAtIso: string | null;
};

export type SceneResearchDecisionHistoryItem = {
  decisionId: string;
  createdAtIso: string;
  claimId: string;
  claimTextPreview: string;
  authorDecision: string;
  decisionReasonPreview: string;
  resultingCanonAction: string;
  resultingCanonRecordId: string | null;
  targetName: string | null;
  overrideNotesPreview: string | null;
};

export type SceneResearchPromptImpactSummary = {
  ricreAcceptedCanonBundleLoaded: boolean;
  activeAcceptedCanonRecordCount: number;
  ricrePromptBlockEligible: boolean;
  subordinationNote: string;
  honestyNotes: string[];
};

export type SceneResearchHashImpactSummary = {
  canonicalHashIncludesRicreBundle: boolean;
  explanation: string;
};

export type SceneResearchQuickActionState = {
  canCreateSceneTarget: boolean;
  canIngestForSceneTargets: boolean;
  hasSceneLinkedTargets: boolean;
  unresolvedClaimIds: string[];
};

export type SceneResearchTabViewModel = {
  contractVersion: typeof SCENE_RESEARCH_TAB_CONTRACT_VERSION;
  scene: {
    id: string;
    chapterId: string;
    title: string;
    chapterTitle: string;
  };
  summary: SceneResearchSummary;
  acceptedCanon: SceneAcceptedCanonItem[];
  /** Same rows as `acceptedCanon`, grouped for scanning by target type (scene / chapter / person / place). */
  acceptedCanonGrouped: { targetType: string; items: SceneAcceptedCanonItem[] }[];
  linkedTargets: SceneResearchTargetLink[];
  openClaims: SceneResearchClaimItem[];
  contradictions: SceneResearchContradictionItem[];
  sources: SceneResearchSourceItem[];
  entityImpacts: SceneResearchEntityImpact[];
  decisionHistory: SceneResearchDecisionHistoryItem[];
  promptImpact: SceneResearchPromptImpactSummary;
  hashImpact: SceneResearchHashImpactSummary;
  quickActions: SceneResearchQuickActionState;
  honestyBanner: string;
};
