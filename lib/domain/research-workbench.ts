/**
 * RICRE Research Workbench — operator view contracts (read models + action payloads).
 * Aligned with `research-ingestion.ts`, `canon-reconciliation.ts`, and Prisma RICRE models.
 */

import type { AuthorCanonDecisionType } from "@/lib/domain/canon-reconciliation";
import type { ResearchTargetType } from "@/lib/domain/research-ingestion";

export const RESEARCH_WORKBENCH_CONTRACT_VERSION = "1" as const;

export type ResearchTargetSummary = {
  id: string;
  targetType: ResearchTargetType;
  targetName: string;
  researchIntent: string | null;
  updatedAtIso: string;
  linkedSceneCount: number;
  linkedPersonCount: number; // from linkedPersonIds JSON length
  linkedPlaceCount: number;
  openClaimCount: number;
};

export type ResearchSourceSummary = {
  id: string;
  researchTargetId: string;
  sourceTitle: string;
  sourceType: string;
  ingestMethod: string;
  sourceTrustTier: string;
  provenanceHash: string;
  accessDateIso: string;
  validationFlags: string[];
  excerptPreview: string | null;
  fetchHonestyLabel: "no_network" | "bounded_single_url" | "fetch_failed";
};

export type ResearchEvidenceViewModel = {
  evidenceId: string;
  summary: string;
  confidence: number;
  relevanceScore: number;
  validationFlags: string[];
};

export type CanonComparisonViewModel = {
  comparisonId: string;
  comparedAgainstType: string;
  comparedAgainstId: string;
  comparisonResult: string;
  contradictionType: string | null;
  impactScope: string | null;
  validationFlags: string[];
  honestyLabel: "heuristic_overlap" | "approximate_contradiction_shape";
};

export type ResearchClaimReviewItem = {
  claimId: string;
  researchTargetId: string;
  sourceId: string;
  sourceTitle: string;
  claimType: string;
  claimText: string;
  claimStatus: string;
  extractionMethod: string;
  extractionHonestyLabel: "heuristic_stub";
  confidence: number;
  evidence: ResearchEvidenceViewModel | null;
  comparisons: CanonComparisonViewModel[];
  contradictionFlags: string[];
};

export type ContradictionReviewItem = {
  claimId: string;
  claimTextPreview: string;
  sourceTitle: string;
  comparisonId: string;
  comparisonResult: string;
  contradictionType: string | null;
  impactScope: string | null;
  honestyLabel: "approximate_contradiction_shape";
};

export type AuthorDecisionSubmission = {
  claimId: string;
  /** Simplified operator intent mapped to `AuthorCanonDecisionType` in orchestration. */
  workbenchDecision: "accept" | "reject" | "uncertain" | "divergence";
  decisionReason: string;
  overrideNotes?: string | null;
  decidedBy?: string | null;
  canonTargetType: string;
  canonTargetId: string;
  knowledgeType: string;
  historicalRealityStatus: string;
  storyRealityStatus: string;
};

export type ResearchQueueSummary = {
  openClaimsTotal: number;
  contradictionQueueTotal: number;
  pendingReviewClaims: number;
  heuristicExtractionClaims: number;
};

export type ResearchWorkbenchAuditViewModel = {
  decisionId: string;
  createdAtIso: string;
  claimId: string;
  claimTextPreview: string;
  authorDecision: AuthorCanonDecisionType | string;
  decisionReasonPreview: string;
  resultingCanonAction: string;
  resultingCanonRecordId: string | null;
  targetName: string | null;
};

export type ResearchDownstreamImpactSummary = {
  contractVersion: typeof RESEARCH_WORKBENCH_CONTRACT_VERSION;
  acceptedActiveCanonTotal: number;
  sceneLinked: boolean;
  primarySceneId: string | null;
  ricrePromptBundleRecordCount: number | null;
  ricrePromptEligible: boolean;
  canonicalHashWouldIncludeRicre: boolean;
  honestyNotes: string[];
};

export type ResearchTargetCreateInput = {
  targetType: ResearchTargetType;
  targetName: string;
  researchIntent?: string | null;
  linkedSceneIds: string[];
  linkedChapterIds: string[];
  linkedBookIds: string[];
  /** Person ids (stored on `AuthorResearchTarget.linkedPersonIds`). */
  linkedCharacterIds: string[];
  /** Place ids (stored on `AuthorResearchTarget.linkedPlaceIds`). */
  linkedSettingIds: string[];
  linkedEraIds: string[];
  linkedThreadIds: string[];
};

export type ResearchIngestionFormInput =
  | {
      mode: "manual";
      researchTargetId: string;
      sourceTitle: string;
      manualText: string;
      sourceTrustTier?: string;
      publisher?: string | null;
      authorAttribution?: string | null;
    }
  | {
      mode: "url";
      researchTargetId: string;
      sourceTitle: string;
      sourceUrl: string;
      fetchRemote: boolean;
      publisher?: string | null;
      authorAttribution?: string | null;
      publicationDate?: string | null;
    };

export type ResearchWorkbenchNarrowContext = {
  /** Human-readable description of the active URL/query filter. */
  description: string;
  sceneId?: string;
  chapterId?: string;
  personId?: string;
  placeId?: string;
  queue?: string;
};

export type ResearchWorkbenchDashboardViewModel = {
  contractVersion: typeof RESEARCH_WORKBENCH_CONTRACT_VERSION;
  /** When set, lists and counts are scoped — governance path is unchanged. */
  narrowContext?: ResearchWorkbenchNarrowContext | null;
  summaryBar: {
    openClaimsTotal: number;
    contradictionQueueTotal: number;
    acceptedCanonActiveTotal: number;
    researchTargetsTotal: number;
    lastDecisionAtIso: string | null;
    advisoryLabels: string[];
  };
  queue: ResearchQueueSummary;
  recentTargets: ResearchTargetSummary[];
  recentSources: ResearchSourceSummary[];
  claimReviewQueue: ResearchClaimReviewItem[];
  contradictionQueue: ContradictionReviewItem[];
  recentDecisions: ResearchWorkbenchAuditViewModel[];
  honestyBanner: string;
};
