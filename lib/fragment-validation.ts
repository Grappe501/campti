import { FragmentType, RecordType, VisibilityStatus } from "@prisma/client";
import { z } from "zod";
import { DECOMPOSITION_PRESSURES } from "@/lib/fragment-constants";
import {
  CANDIDATE_PLACEMENT_STATUSES,
  FRAGMENT_LINK_ROLES,
  FRAGMENT_LINK_TARGET_TYPES,
  PLACEMENT_STATUSES,
  PLACEMENT_TARGET_TYPES,
  REVIEW_STATUSES,
} from "@/lib/fragment-types";

const fragmentTypeSchema = z.nativeEnum(FragmentType);

const optionalRecordType = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.nativeEnum(RecordType).optional(),
);

export const optionalConfidence1to5 = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  },
  z.number().int().min(1).max(5).optional(),
);

export const optionalAmbiguity1to5 = optionalConfidence1to5;

export const placementStatusSchema = z
  .string()
  .refine((s) => (PLACEMENT_STATUSES as readonly string[]).includes(s), "Invalid placement status");

export const reviewStatusSchema = z
  .string()
  .refine((s) => (REVIEW_STATUSES as readonly string[]).includes(s), "Invalid review status");

export const candidatePlacementStatusSchema = z
  .string()
  .refine(
    (s) => (CANDIDATE_PLACEMENT_STATUSES as readonly string[]).includes(s),
    "Invalid candidate status",
  );

export const fragmentLinkTargetSchema = z
  .string()
  .refine((s) => (FRAGMENT_LINK_TARGET_TYPES as readonly string[]).includes(s), "Invalid link target");

export const placementTargetSchema = z
  .string()
  .refine((s) => (PLACEMENT_TARGET_TYPES as readonly string[]).includes(s), "Invalid placement target");

export const fragmentLinkRoleSchema = z
  .string()
  .refine((s) => (FRAGMENT_LINK_ROLES as readonly string[]).includes(s), "Invalid link role");

const secondaryFragmentTypesSchema = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      return Array.isArray(p) ? p : undefined;
    } catch {
      return undefined;
    }
  }
  return v;
}, z.array(z.nativeEnum(FragmentType)).optional());

export const fragmentCreateSchema = z.object({
  title: z.string().trim().optional(),
  fragmentType: fragmentTypeSchema,
  primaryFragmentType: z.nativeEnum(FragmentType).optional().nullable(),
  secondaryFragmentTypes: secondaryFragmentTypesSchema,
  surfaceMeaning: z.string().trim().optional(),
  hiddenMeaning: z.string().trim().optional(),
  symbolicUse: z.string().trim().optional(),
  emotionalUse: z.string().trim().optional(),
  narrativeUse: z.string().trim().optional(),
  decompositionPressure: z.enum(DECOMPOSITION_PRESSURES as unknown as [string, ...string[]]).optional().nullable(),
  sceneReadinessScore: z.coerce.number().int().min(1).max(5).optional().nullable(),
  clusterHint: z.string().trim().optional(),
  visibility: z.nativeEnum(VisibilityStatus).optional(),
  recordType: optionalRecordType,
  sourceId: z.string().trim().optional(),
  sourceChunkId: z.string().trim().optional(),
  sourceTextId: z.string().trim().optional(),
  parentFragmentId: z.string().trim().optional(),
  text: z.string().min(1, "Text is required"),
  excerpt: z.string().optional(),
  summary: z.string().trim().optional(),
  emotionalTone: z.string().trim().optional(),
  narrativeFunction: z.string().trim().optional(),
  timeHint: z.string().trim().optional(),
  confidence: optionalConfidence1to5,
  ambiguityLevel: optionalAmbiguity1to5,
  placementStatus: z.string().trim().optional(),
  reviewStatus: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  decompositionVersion: z.string().trim().optional(),
  aiGenerated: z.boolean().optional(),
  generatedByRunId: z.string().trim().optional(),
  sourceTraceNote: z.string().trim().optional(),
});

export const fragmentUpdateSchema = fragmentCreateSchema.partial().extend({
  id: z.string().min(1),
});

export const fragmentDecomposePreviewSchema = z.object({
  text: z.string().min(1),
});

export const fragmentDecomposeSaveSchema = z.object({
  sourceId: z.string().min(1),
  mode: z.enum(["full", "chunks"]),
  force: z.coerce.boolean().optional(),
});

export const fragmentDecomposeChildSchema = z.object({
  parentFragmentId: z.string().min(1),
  /** Optional: split this text into children instead of re-splitting the parent body. */
  text: z.string().optional(),
  force: z.coerce.boolean().optional(),
});

export const fragmentReviewSchema = z.object({
  id: z.string().min(1),
  reviewStatus: reviewStatusSchema,
  placementStatus: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const placementCandidateDecisionSchema = z.object({
  candidateId: z.string().min(1),
  status: candidatePlacementStatusSchema,
  notes: z.string().trim().optional(),
});

export const fragmentLinkCreateSchema = z.object({
  fragmentId: z.string().min(1),
  linkedType: fragmentLinkTargetSchema,
  linkedId: z.string().min(1),
  linkRole: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    fragmentLinkRoleSchema.optional(),
  ),
  notes: z.string().trim().optional(),
});

export const fragmentLinkDeleteSchema = z.object({
  linkId: z.string().min(1),
  fragmentId: z.string().min(1),
});

export const fragmentInsightCreateSchema = z.object({
  fragmentId: z.string().min(1),
  insightType: z.string().trim().min(1),
  content: z.string().min(1),
  confidence: optionalConfidence1to5,
  notes: z.string().trim().optional(),
});
