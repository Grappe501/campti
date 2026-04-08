import { FragmentType } from "@prisma/client";
import { z } from "zod";
import { DECOMPOSITION_PRESSURES } from "@/lib/fragment-constants";

export const CLUSTER_TYPES = [
  "theme",
  "symbol",
  "emotional_arc",
  "character",
  "place",
  "conflict",
  "voice",
  "world_anchor",
  "other",
] as const;

export const SUGGESTION_STATUSES = ["suggested", "accepted", "rejected", "deferred"] as const;

export const SUGGESTION_TYPES = [
  "fragment_group",
  "missing_element",
  "tension_arc",
  "symbolic_layer",
  "pov_strengthening",
  "environment_strengthening",
  "conflict_boost",
  "chronology_note",
] as const;

const secondaryTypesSchema = z.preprocess((v) => {
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

export const fragmentRefinementUpdateSchema = z.object({
  id: z.string().min(1),
  primaryFragmentType: z.nativeEnum(FragmentType).optional(),
  secondaryFragmentTypes: secondaryTypesSchema,
  surfaceMeaning: z.string().optional(),
  hiddenMeaning: z.string().optional(),
  symbolicUse: z.string().optional(),
  emotionalUse: z.string().optional(),
  narrativeUse: z.string().optional(),
  decompositionPressure: z.enum(DECOMPOSITION_PRESSURES as unknown as [string, ...string[]]).optional(),
  sceneReadinessScore: z.coerce.number().int().min(1).max(5).optional().nullable(),
  clusterHint: z.string().optional(),
});

export const refinedChildUnitSchema = z.object({
  text: z.string().min(1),
  suggestedType: z.nativeEnum(FragmentType),
});

export const saveRefinedChildrenSchema = z.object({
  parentFragmentId: z.string().min(1),
  units: z.array(refinedChildUnitSchema).min(1).max(40),
  force: z.coerce.boolean().optional(),
});

export const clusterCreateSchema = z.object({
  title: z.string().min(1).max(500),
  clusterType: z.enum(CLUSTER_TYPES as unknown as [string, ...string[]]),
  summary: z.string().optional(),
  emotionalTone: z.string().optional(),
  dominantFunction: z.string().optional(),
  confidence: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  chapterId: z.string().optional(),
  sceneId: z.string().optional(),
  metaSceneId: z.string().optional(),
  personId: z.string().optional(),
  placeId: z.string().optional(),
  symbolId: z.string().optional(),
  fragmentIds: z.array(z.string().min(1)).min(1).max(24),
  roles: z.record(z.string(), z.string()).optional(),
});

export const clusterUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  clusterType: z.enum(CLUSTER_TYPES as unknown as [string, ...string[]]).optional(),
  summary: z.string().optional(),
  emotionalTone: z.string().optional(),
  dominantFunction: z.string().optional(),
  confidence: z.coerce.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional(),
});

export const suggestionStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(SUGGESTION_STATUSES as unknown as [string, ...string[]]),
  notes: z.string().optional(),
});

export const refreshSceneIntelligenceSchema = z.object({
  metaSceneId: z.string().min(1),
});

export const linkFragmentToClusterSchema = z.object({
  clusterId: z.string().min(1),
  fragmentId: z.string().min(1),
  role: z.string().optional(),
  notes: z.string().optional(),
});
