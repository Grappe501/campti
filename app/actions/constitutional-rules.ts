"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type RuleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  constitutionalRuleCreateSchema,
  constitutionalRuleIdSchema,
  constitutionalRuleSaveSchema,
  parseConfigJson,
} from "@/lib/constitutional-rule-schemas";
import { getActiveRules, getRulesByType, validateAgainstRules } from "@/lib/constitution";
import type { ConstitutionalValidationContext } from "@/lib/constitutional-rule-types";

function rev() {
  revalidatePath("/admin/narrative-rules");
  revalidatePath("/admin/narrative-rules/constitutional");
}

export async function getRules() {
  return getActiveRules();
}

export async function getRulesByTypeAction(ruleType: RuleType) {
  return getRulesByType(ruleType);
}

export async function validateAgainstRulesAction(
  input: unknown,
  context: ConstitutionalValidationContext,
) {
  return validateAgainstRules(input, context);
}

export async function createRule(formData: FormData) {
  const rawConfig = String(formData.get("configJson") ?? "");
  const parsed = constitutionalRuleCreateSchema.safeParse({
    key: String(formData.get("key") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    ruleType: String(formData.get("ruleType") ?? ""),
    scope: String(formData.get("scope") ?? ""),
    severity: String(formData.get("severity") ?? ""),
    isActive: String(formData.get("isActive") ?? "true") === "true",
    recordType: String(formData.get("recordType") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    certainty: String(formData.get("certainty") ?? "").trim() || null,
    narrativePermission: String(formData.get("narrativePermission") ?? "").trim() || null,
    config: parseConfigJson(rawConfig) ?? null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (!parsed.success) {
    redirect(`/admin/narrative-rules/constitutional/new?error=validation`);
  }

  const data = parsed.data;
  try {
    await prisma.constitutionalRule.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        ruleType: data.ruleType,
        scope: data.scope,
        severity: data.severity,
        isActive: data.isActive,
        recordType: data.recordType,
        visibility: data.visibility,
        certainty: data.certainty,
        narrativePermission: data.narrativePermission,
        config:
          data.config === undefined || data.config === null
            ? undefined
            : (data.config as Prisma.InputJsonValue),
        notes: data.notes,
      },
    });
  } catch {
    redirect(`/admin/narrative-rules/constitutional/new?error=db`);
  }
  rev();
  redirect("/admin/narrative-rules?saved=constitutional");
}

export async function updateRule(formData: FormData) {
  const rawConfig = String(formData.get("configJson") ?? "");
  const parsed = constitutionalRuleSaveSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    key: String(formData.get("key") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? ""),
    ruleType: String(formData.get("ruleType") ?? ""),
    scope: String(formData.get("scope") ?? ""),
    severity: String(formData.get("severity") ?? ""),
    isActive: String(formData.get("isActive") ?? "false") === "true",
    recordType: String(formData.get("recordType") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    certainty: String(formData.get("certainty") ?? "").trim() || null,
    narrativePermission: String(formData.get("narrativePermission") ?? "").trim() || null,
    config: rawConfig.trim() ? parseConfigJson(rawConfig) ?? null : null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/narrative-rules/constitutional/${id}?error=validation`);
  }

  const data = parsed.data;
  const { id, config, ...rest } = data;

  try {
    await prisma.constitutionalRule.update({
      where: { id },
      data: {
        ...rest,
        config: config === null || config === undefined ? Prisma.JsonNull : (config as Prisma.InputJsonValue),
      },
    });
  } catch {
    redirect(`/admin/narrative-rules/constitutional/${id}?error=db`);
  }
  rev();
  redirect(`/admin/narrative-rules/constitutional/${id}?saved=1`);
}

export async function deleteRule(formData: FormData) {
  const parsed = constitutionalRuleIdSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) redirect("/admin/narrative-rules?error=validation");

  try {
    await prisma.constitutionalRule.delete({ where: { id: parsed.data.id } });
  } catch {
    redirect("/admin/narrative-rules?error=db");
  }
  rev();
  redirect("/admin/narrative-rules?deleted=constitutional");
}

export async function toggleRuleActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = constitutionalRuleIdSchema.safeParse({ id });
  if (!parsed.success) redirect("/admin/narrative-rules?error=validation");

  try {
    const row = await prisma.constitutionalRule.findUnique({ where: { id: parsed.data.id } });
    if (!row) redirect("/admin/narrative-rules?error=notfound");
    await prisma.constitutionalRule.update({
      where: { id: row.id },
      data: { isActive: !row.isActive },
    });
  } catch {
    redirect("/admin/narrative-rules?error=db");
  }
  rev();
  redirect("/admin/narrative-rules");
}
