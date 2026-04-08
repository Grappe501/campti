"use server";

import type { Prisma } from "@prisma/client";
import { SymbolCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBindingIfFresh } from "@/lib/narrative-binding";
import { prisma } from "@/lib/prisma";

function rev() {
  revalidatePath("/admin/sources");
  revalidatePath("/admin/narrative-rules");
  revalidatePath("/admin/themes");
  revalidatePath("/admin/symbols");
  revalidatePath("/admin/motifs");
  revalidatePath("/admin/literary-devices");
  revalidatePath("/admin/patterns");
  revalidatePath("/admin/bindings");
}

function parseLayers(raw: string | null | undefined): Prisma.InputJsonValue | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v)) {
      const s = v.filter((x) => typeof x === "string");
      return s.length ? (s as Prisma.InputJsonValue) : undefined;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export async function updateNarrativeRuleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/narrative-rules?error=validation");
  await prisma.narrativeRule.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").slice(0, 500),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? "structure").slice(0, 120),
      strength: formData.get("strength") ? Number(formData.get("strength")) : null,
      scope: String(formData.get("scope") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      layers: parseLayers(String(formData.get("layersJson") ?? "")),
    },
  });
  rev();
  redirect(`/admin/narrative-rules/${id}?saved=1`);
}

export async function updateThemeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/themes?error=validation");
  await prisma.theme.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").slice(0, 500),
      description: String(formData.get("description") ?? ""),
      intensity: formData.get("intensity") ? Number(formData.get("intensity")) : null,
      category: String(formData.get("category") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      layers: parseLayers(String(formData.get("layersJson") ?? "")),
    },
  });
  rev();
  redirect(`/admin/themes/${id}?saved=1`);
}

export async function updateMotifAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/motifs?error=validation");
  await prisma.motif.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").slice(0, 500),
      description: String(formData.get("description") ?? ""),
      usagePattern: String(formData.get("usagePattern") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      layers: parseLayers(String(formData.get("layersJson") ?? "")),
    },
  });
  rev();
  redirect(`/admin/motifs/${id}?saved=1`);
}

export async function updateLiteraryDeviceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/literary-devices?error=validation");
  await prisma.literaryDevice.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").slice(0, 500),
      description: String(formData.get("description") ?? ""),
      systemEffect: String(formData.get("systemEffect") ?? ""),
      notes: String(formData.get("notes") ?? "").trim() || null,
      layers: parseLayers(String(formData.get("layersJson") ?? "")),
    },
  });
  rev();
  redirect(`/admin/literary-devices/${id}?saved=1`);
}

export async function updateNarrativePatternAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/patterns?error=validation");
  await prisma.narrativePattern.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").slice(0, 500),
      description: String(formData.get("description") ?? ""),
      patternType: String(formData.get("patternType") ?? "emotional").slice(0, 120),
      strength: formData.get("strength") ? Number(formData.get("strength")) : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      layers: parseLayers(String(formData.get("layersJson") ?? "")),
    },
  });
  rev();
  redirect(`/admin/patterns/${id}?saved=1`);
}

function parseSymbolCategory(v: string): SymbolCategory | null {
  if (!v) return null;
  const vals = Object.values(SymbolCategory) as string[];
  return vals.includes(v) ? (v as SymbolCategory) : null;
}

export async function updateSymbolAdminAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/symbols?error=validation");
  const catRaw = String(formData.get("category") ?? "").trim();
  await prisma.symbol.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").slice(0, 500),
      meaning: String(formData.get("meaning") ?? "").trim() || null,
      meaningPrimary: String(formData.get("meaningPrimary") ?? "").trim() || null,
      meaningSecondary: String(formData.get("meaningSecondary") ?? "").trim() || null,
      emotionalTone: String(formData.get("emotionalTone") ?? "").trim() || null,
      usageContext: String(formData.get("usageContext") ?? "").trim() || null,
      certainty: String(formData.get("certainty") ?? "").trim() || null,
      category: catRaw ? parseSymbolCategory(catRaw) : null,
      sourceTraceNote: String(formData.get("sourceTraceNote") ?? "").trim() || null,
      layers: parseLayers(String(formData.get("layersJson") ?? "")),
    },
  });
  rev();
  redirect(`/admin/symbols/${id}?saved=1`);
}

export async function createNarrativeBindingAction(formData: FormData) {
  const sourceType = String(formData.get("sourceType") ?? "").trim();
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const targetType = String(formData.get("targetType") ?? "").trim();
  const targetId = String(formData.get("targetId") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "influences").trim();
  const strengthRaw = formData.get("strength");
  const strength =
    strengthRaw && String(strengthRaw).trim() ? Number(strengthRaw) : undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  await createBindingIfFresh({
    sourceType,
    sourceId,
    targetType,
    targetId,
    relationship,
    strength,
    notes,
  });
  rev();
  redirect("/admin/bindings?saved=1");
}

export async function deleteNarrativeBindingAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/bindings?error=validation");
  await prisma.narrativeBinding.delete({ where: { id } });
  rev();
  redirect("/admin/bindings?saved=deleted");
}
