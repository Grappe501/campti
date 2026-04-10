import {
  EnvironmentRiskCategory,
  NodeConnectionType,
  PlaceMemoryType,
  Prisma,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";
import { z } from "zod";

const optRt = z
  .union([z.nativeEnum(RecordType), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
const optVis = z
  .union([z.nativeEnum(VisibilityStatus), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? undefined : v));
const optText = (max: number) => z.string().max(max).optional().nullable();

const emptyToUndefInt = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), schema);

const int0_100 = z.coerce.number().int().min(0).max(100);

export function parseEnvJson(raw: string | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (raw === null || raw === undefined || raw.trim() === "") return Prisma.JsonNull;
  try {
    return JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    return raw as unknown as Prisma.InputJsonValue;
  }
}

/** When updating from FormData, only touch JSON columns if the field was present (avoids wiping on partial submits). */
export function patchEnvJsonFromForm(
  raw: Record<string, string>,
  key: string,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (!Object.prototype.hasOwnProperty.call(raw, key)) return undefined;
  return parseEnvJson(raw[key]);
}

export const placeEnvironmentProfileUpsertSchema = z.object({
  placeId: z.string().cuid(),
  terrainType: optText(500),
  hydrologyType: optText(500),
  fertilityProfile: optText(20000),
  floodRiskLevel: emptyToUndefInt(int0_100.optional()),
  droughtRiskLevel: emptyToUndefInt(int0_100.optional()),
  mobilityProfile: optText(20000),
  sensoryProfileJson: z.string().max(200000).optional().nullable(),
  resourceProfileJson: z.string().max(200000).optional().nullable(),
  sacredProfileJson: z.string().max(200000).optional().nullable(),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const placeStateCreateSchema = z.object({
  placeId: z.string().cuid(),
  label: z.string().min(1).max(500),
  worldStateId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().cuid().nullable().optional(),
  ),
  settlementPattern: optText(2000),
  strategicValue: emptyToUndefInt(int0_100.optional()),
  riskLevel: emptyToUndefInt(int0_100.optional()),
  controlProfileJson: z.string().max(200000).optional().nullable(),
  accessProfileJson: z.string().max(200000).optional().nullable(),
  transportProfileJson: z.string().max(200000).optional().nullable(),
  economicProfileJson: z.string().max(200000).optional().nullable(),
  pressureProfileJson: z.string().max(200000).optional().nullable(),
  memoryLoadJson: z.string().max(200000).optional().nullable(),
  activePopulationEstimate: emptyToUndefInt(z.coerce.number().int().min(0).optional()),
  notes: optText(50000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const placeStateUpdateSchema = placeStateCreateSchema.extend({
  id: z.string().cuid(),
});

export const environmentNodeCreateSchema = z.object({
  placeId: z.string().cuid(),
  key: z.string().min(1).max(200),
  label: z.string().min(1).max(500),
  nodeType: optText(200),
  isCoreNode: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v !== "false"),
  regionLabel: optText(500),
  summary: optText(20000),
  notes: optText(20000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const environmentNodeUpdateSchema = environmentNodeCreateSchema.extend({
  id: z.string().cuid(),
});

export const nodeConnectionCreateSchema = z.object({
  fromNodeId: z.string().cuid(),
  toNodeId: z.string().cuid(),
  connectionType: z.nativeEnum(NodeConnectionType),
  bidirectional: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v !== "false"),
  travelRisk: emptyToUndefInt(int0_100.optional()),
  travelDifficulty: emptyToUndefInt(int0_100.optional()),
  seasonalModifierJson: z.string().max(200000).optional().nullable(),
  worldStateId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().cuid().nullable().optional(),
  ),
  notes: optText(20000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const nodeConnectionUpdateSchema = nodeConnectionCreateSchema.extend({
  id: z.string().cuid(),
});

export const riskRegimeCreateSchema = z.object({
  key: z.string().min(1).max(200),
  label: z.string().min(1).max(500),
  description: optText(20000),
  category: z.nativeEnum(EnvironmentRiskCategory),
  baseSeverity: emptyToUndefInt(int0_100.optional()),
  notes: optText(20000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const riskRegimeUpdateSchema = riskRegimeCreateSchema.extend({
  id: z.string().cuid(),
});

export const placeMemoryProfileCreateSchema = z.object({
  placeId: z.string().cuid(),
  memoryType: z.nativeEnum(PlaceMemoryType),
  label: z.string().min(1).max(500),
  description: optText(20000),
  worldStateId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().cuid().nullable().optional(),
  ),
  notes: optText(20000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});

export const placeMemoryProfileUpdateSchema = placeMemoryProfileCreateSchema.extend({
  id: z.string().cuid(),
});

export const deletePlaceStateSchema = z.object({
  id: z.string().cuid(),
  placeId: z.string().cuid(),
});

export const deletePlaceMemoryProfileSchema = z.object({
  id: z.string().cuid(),
  placeId: z.string().cuid(),
});

export const deleteEnvironmentNodeSchema = z.object({
  id: z.string().cuid(),
});

export const deleteNodeConnectionSchema = z.object({
  id: z.string().cuid(),
});

export const deleteRiskRegimeSchema = z.object({
  id: z.string().cuid(),
});

export const worldStateReferenceUpsertSchema = z.object({
  id: z.string().cuid().optional(),
  eraId: z.string().min(1).max(200),
  label: z.string().min(1).max(500),
  description: optText(20000),
  recordType: optRt,
  visibility: optVis,
  certainty: optText(500),
});
