/**
 * RICRE — Canon reconciliation domain (comparison, contradiction, author decision, stored canon).
 */

import { z } from "zod";

export const RICRE_CANON_RECONCILIATION_CONTRACT_VERSION = "1" as const;

export const HISTORICAL_AND_STORY_REALITY_STATUSES = [
  "historically_verified",
  "likely_historical",
  "disputed_historical",
  "accepted_story_canon",
  "alternate_story_canon",
  "uncertain_story_canon",
  "intentional_story_divergence",
] as const;
export type HistoricalAndStoryRealityStatus = (typeof HISTORICAL_AND_STORY_REALITY_STATUSES)[number];

export const COMPARISON_RESULTS = [
  "matches_canon",
  "extends_canon",
  "duplicates_existing",
  "contradicts_canon",
  "contradicts_runtime_assumption",
  "alternate_interpretation",
  "uncertain",
  "intentionally_divergent_possible",
] as const;
export type CanonComparisonResult = (typeof COMPARISON_RESULTS)[number];

export const COMPARED_AGAINST_TYPES = [
  "canon_knowledge",
  "continuity_note",
  "person_profile",
  "place_profile",
  "genealogical_assertion",
  "runtime_constraint",
  "prior_decision",
] as const;
export type ComparedAgainstType = (typeof COMPARED_AGAINST_TYPES)[number];

export const AUTHOR_DECISIONS = [
  "accept_as_canon",
  "reject",
  "merge_with_existing",
  "store_as_alternate",
  "mark_as_uncertain",
  "mark_as_historical_but_not_story_canon",
  "mark_as_intentional_story_divergence",
] as const;
export type AuthorCanonDecisionType = (typeof AUTHOR_DECISIONS)[number];

export const CANON_KNOWLEDGE_STATUSES = [
  "active",
  "alternate",
  "uncertain",
  "historical_non_story",
  "divergent_story",
  "superseded",
] as const;
export type CanonKnowledgeCanonicalStatus = (typeof CANON_KNOWLEDGE_STATUSES)[number];

export type CanonComparisonRecord = {
  contractVersion: typeof RICRE_CANON_RECONCILIATION_CONTRACT_VERSION;
  comparisonId: string;
  claimId: string;
  comparedAgainstType: ComparedAgainstType;
  comparedAgainstId: string;
  comparisonResult: CanonComparisonResult;
  contradictionType: string | null;
  impactScope: string | null;
  validationFlags: string[];
};

export type CanonDecisionRecord = {
  contractVersion: typeof RICRE_CANON_RECONCILIATION_CONTRACT_VERSION;
  decisionId: string;
  claimId: string;
  authorDecision: AuthorCanonDecisionType;
  decisionReason: string;
  resultingCanonAction: string;
  resultingCanonRecordId: string | null;
  intentionalDivergenceFlag: boolean;
  overrideNotes: string | null;
  decisionTimestamp: string;
  validationFlags: string[];
};

export type CanonKnowledgeRecord = {
  contractVersion: typeof RICRE_CANON_RECONCILIATION_CONTRACT_VERSION;
  canonRecordId: string;
  canonicalStatus: CanonKnowledgeCanonicalStatus;
  targetType: string;
  targetId: string;
  knowledgeType: string;
  content: string;
  structuredValue: Record<string, unknown> | null;
  sourceLinks: Array<{ sourceId: string; claimId: string }>;
  decisionHistory: string[];
  historicalRealityStatus: HistoricalAndStoryRealityStatus;
  storyRealityStatus: HistoricalAndStoryRealityStatus;
  originatingClaimId: string | null;
  impactSummary: string | null;
  validationFlags: string[];
};

/** Scene-generation–bound bundle for accepted author canon (prompt + audit). */
export type RicreAcceptedCanonKnowledgeBundle = {
  contractVersion: "1";
  promptInstructionLines: string[];
  recordCount: number;
  validationFlags: string[];
};

export const AuthorCanonDecisionInputSchema = z.object({
  claimId: z.string().min(1),
  authorDecision: z.enum(AUTHOR_DECISIONS),
  decisionReason: z.string().min(1),
  resultingCanonAction: z.string().min(1),
  intentionalDivergenceFlag: z.boolean().optional(),
  overrideNotes: z.string().nullable().optional(),
  decidedBy: z.string().nullable().optional(),
});
