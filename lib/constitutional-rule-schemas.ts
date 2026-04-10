import {
  RecordType,
  RuleScope,
  RuleSeverity,
  RuleType,
  VisibilityStatus,
} from "@prisma/client";
import { z } from "zod";

const keyRegex = /^[a-z0-9][a-z0-9-]*$/;

export const constitutionalRuleKeySchema = z
  .string()
  .min(1)
  .max(160)
  .regex(keyRegex, "Use lowercase letters, digits, and hyphens only");

export const constitutionalRuleCreateSchema = z.object({
  key: constitutionalRuleKeySchema,
  name: z.string().min(1).max(500),
  description: z.string().min(1).max(20000),
  ruleType: z.nativeEnum(RuleType),
  scope: z.nativeEnum(RuleScope),
  severity: z.nativeEnum(RuleSeverity),
  isActive: z.boolean().optional().default(true),
  recordType: z.nativeEnum(RecordType),
  visibility: z.nativeEnum(VisibilityStatus),
  certainty: z.string().max(500).optional().nullable(),
  narrativePermission: z.string().max(200).optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
});

/** Full replace on edit (same as create + id). */
export const constitutionalRuleSaveSchema = constitutionalRuleCreateSchema.extend({
  id: z.string().cuid(),
});

export const constitutionalRuleIdSchema = z.object({
  id: z.string().cuid(),
});

export const getRulesByTypeInputSchema = z.object({
  ruleType: z.nativeEnum(RuleType),
});

export function parseConfigJson(raw: string | null | undefined): Record<string, unknown> | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const v = JSON.parse(raw) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  return undefined;
}
