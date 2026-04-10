import {
  OntologyFamily,
  RecordType,
  RegistryFamily,
  VisibilityStatus,
} from "@prisma/client";
import { z } from "zod";

const slugKey = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9][a-z0-9_-]*$/, "Use lowercase letters, digits, underscores, and hyphens");

export const ontologyTypeCreateSchema = z.object({
  key: slugKey,
  name: z.string().min(1).max(500),
  description: z.string().min(1).max(20000),
  family: z.nativeEnum(OntologyFamily),
  isActive: z.boolean().optional().default(true),
  recordType: z.nativeEnum(RecordType),
  visibility: z.nativeEnum(VisibilityStatus),
  appliesTo: z.record(z.string(), z.unknown()).optional().nullable(),
  sourceTraceNote: z.string().max(2000).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
});

export const ontologyTypeSaveSchema = ontologyTypeCreateSchema.extend({
  id: z.string().cuid(),
});

export const registryValueCreateSchema = z.object({
  key: slugKey,
  label: z.string().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  registryType: z.string().min(1).max(120).default("default"),
  family: z.nativeEnum(RegistryFamily),
  sortOrder: z.coerce.number().int().min(0).max(1_000_000).optional().default(0),
  isActive: z.boolean().optional().default(true),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  appliesTo: z.record(z.string(), z.unknown()).optional().nullable(),
  sourceTraceNote: z.string().max(2000).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
});

export const registryValueSaveSchema = registryValueCreateSchema.extend({
  id: z.string().cuid(),
});

function optionalNativeEnum<T extends Record<string, string | number>>(e: T) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.nativeEnum(e).optional(),
  );
}

export const narrativePermissionCreateSchema = z.object({
  key: slugKey,
  name: z.string().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  allowsDirectNarrativeUse: z.boolean().optional().default(false),
  allowsSceneSupport: z.boolean().optional().default(false),
  allowsAtmosphereSupport: z.boolean().optional().default(false),
  allowsCanonicalReveal: z.boolean().optional().default(false),
  recordType: optionalNativeEnum(RecordType),
  visibility: optionalNativeEnum(VisibilityStatus),
  notes: z.string().max(20000).optional().nullable(),
});

export const narrativePermissionSaveSchema = narrativePermissionCreateSchema.extend({
  id: z.string().cuid(),
});

export const confidenceProfileCreateSchema = z.object({
  key: slugKey,
  label: z.string().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  numericValue: z.coerce.number().int().min(0).max(100),
  isActive: z.boolean().optional().default(true),
  recordType: optionalNativeEnum(RecordType),
  visibility: optionalNativeEnum(VisibilityStatus),
  notes: z.string().max(20000).optional().nullable(),
});

export const confidenceProfileSaveSchema = confidenceProfileCreateSchema.extend({
  id: z.string().cuid(),
});

export const sceneReadinessCreateSchema = z.object({
  key: slugKey,
  label: z.string().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  isDraftable: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  recordType: optionalNativeEnum(RecordType),
  visibility: optionalNativeEnum(VisibilityStatus),
  notes: z.string().max(20000).optional().nullable(),
});

export const sceneReadinessSaveSchema = sceneReadinessCreateSchema.extend({
  id: z.string().cuid(),
});

export const idOnlySchema = z.object({ id: z.string().cuid() });

/** Empty → undefined; invalid JSON or non-object → null (caller should treat as validation error). */
export function parseJsonObjectField(raw: string | null | undefined): Record<string, unknown> | null | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const v = JSON.parse(raw) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    return null;
  }
  return null;
}
