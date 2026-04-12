"use server";

import { prisma } from "@/lib/prisma";
import {
  sceneCreateSchema,
  sceneEntityLinkSchema,
  sceneGenerateSummarySchema,
  sceneReorderSchema,
  sceneScaffoldSchema,
  sceneUpdateSchema,
  sceneWorkspaceUpdateSchema,
} from "@/lib/validation";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseRecordType(v: string): RecordType {
  const allowed = Object.values(RecordType) as string[];
  return allowed.includes(v) ? (v as RecordType) : RecordType.FICTIONAL;
}

function parseVisibility(v: string): VisibilityStatus {
  const allowed = Object.values(VisibilityStatus) as string[];
  return allowed.includes(v) ? (v as VisibilityStatus) : VisibilityStatus.PRIVATE;
}

export async function createScene(formData: FormData) {
  const parsed = sceneCreateSchema.safeParse({
    description: formData.get("description"),
    chapterId: formData.get("chapterId"),
    historicalAnchor: formData.get("historicalAnchor"),
    sceneNumber: formData.get("sceneNumber"),
    locationNote: formData.get("locationNote"),
    pov: formData.get("pov"),
    summary: formData.get("summary"),
    privateNotes: formData.get("privateNotes"),
    orderInChapter: formData.get("orderInChapter"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    redirect("/admin/scenes?error=validation");
  }

  const d = parsed.data;
  await prisma.scene.create({
    data: {
      description: d.description,
      chapterId: d.chapterId,
      historicalAnchor: d.historicalAnchor?.length ? d.historicalAnchor : null,
      sceneNumber: d.sceneNumber ?? null,
      locationNote: d.locationNote?.length ? d.locationNote : null,
      pov: d.pov?.length ? d.pov : null,
      summary: d.summary?.length ? d.summary : null,
      privateNotes: d.privateNotes?.length ? d.privateNotes : null,
      orderInChapter: d.orderInChapter ?? null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/scenes");
  revalidatePath(`/admin/chapters/${d.chapterId}`);
  redirect("/admin/scenes");
}

export async function updateScene(formData: FormData) {
  const parsed = sceneUpdateSchema.safeParse({
    id: formData.get("id"),
    description: formData.get("description"),
    chapterId: formData.get("chapterId"),
    historicalAnchor: formData.get("historicalAnchor"),
    sceneNumber: formData.get("sceneNumber"),
    locationNote: formData.get("locationNote"),
    pov: formData.get("pov"),
    summary: formData.get("summary"),
    privateNotes: formData.get("privateNotes"),
    orderInChapter: formData.get("orderInChapter"),
    visibility: parseVisibility(String(formData.get("visibility") ?? "")),
    recordType: parseRecordType(String(formData.get("recordType") ?? "")),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    redirect(`/admin/scenes/${id}?error=validation`);
  }

  const d = parsed.data;
  await prisma.scene.update({
    where: { id: d.id },
    data: {
      description: d.description,
      chapterId: d.chapterId,
      historicalAnchor: d.historicalAnchor?.length ? d.historicalAnchor : null,
      sceneNumber: d.sceneNumber ?? null,
      locationNote: d.locationNote?.length ? d.locationNote : null,
      pov: d.pov?.length ? d.pov : null,
      summary: d.summary?.length ? d.summary : null,
      privateNotes: d.privateNotes?.length ? d.privateNotes : null,
      orderInChapter: d.orderInChapter ?? null,
      visibility: d.visibility,
      recordType: d.recordType,
    },
  });

  revalidatePath("/admin/scenes");
  revalidatePath(`/admin/scenes/${d.id}`);
  revalidatePath(`/admin/chapters/${d.chapterId}`);
  redirect(`/admin/scenes/${d.id}`);
}

function ensureNotLocked(sceneStatus: string | null | undefined) {
  if ((sceneStatus ?? "").toLowerCase() === "locked") {
    redirect(`/admin/scenes?error=${encodeURIComponent("scene_locked")}`);
  }
}

/** Preserve `?ws=&focal=&debug=1` after workspace POST redirects. */
function redirectSceneWorkspace(sceneId: string, formData: FormData, flags: { saved?: string; error?: string }) {
  const p = new URLSearchParams();
  if (flags.saved) p.set("saved", flags.saved);
  if (flags.error) p.set("error", flags.error);
  if (String(formData.get("workspaceDebug") ?? "").trim() === "1") p.set("debug", "1");
  const ws = String(formData.get("workspaceWs") ?? "").trim();
  if (ws) p.set("ws", ws);
  const focal = String(formData.get("workspaceFocal") ?? "").trim();
  if (focal) p.set("focal", focal);
  const qs = p.toString();
  redirect(qs ? `/admin/scenes/${sceneId}/workspace?${qs}` : `/admin/scenes/${sceneId}/workspace`);
}

export async function updateSceneWorkspace(formData: FormData) {
  const parsed = sceneWorkspaceUpdateSchema.safeParse({
    id: formData.get("id"),
    writingMode: formData.get("writingMode"),
    draftText: formData.get("draftText"),
    narrativeIntent: formData.get("narrativeIntent"),
    emotionalTone: formData.get("emotionalTone"),
    historicalConfidence: formData.get("historicalConfidence"),
    sourceTraceSummary: formData.get("sourceTraceSummary"),
    continuitySummary: formData.get("continuitySummary"),
    sceneStatus: formData.get("sceneStatus"),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");
    if (id) redirectSceneWorkspace(id, formData, { error: "validation" });
    redirect("/admin/scenes?error=validation");
  }

  const d = parsed.data;
  const existing = await prisma.scene.findUnique({
    where: { id: d.id },
    select: { id: true, chapterId: true, sceneStatus: true },
  });
  if (!existing) redirect("/admin/scenes?error=not_found");
  ensureNotLocked(existing.sceneStatus);

  await prisma.scene.update({
    where: { id: d.id },
    data: {
      ...(d.writingMode ? { writingMode: d.writingMode } : {}),
      ...(d.draftText !== undefined ? { draftText: d.draftText.length ? d.draftText : null } : {}),
      ...(d.narrativeIntent !== undefined ? { narrativeIntent: d.narrativeIntent?.length ? d.narrativeIntent : null } : {}),
      ...(d.emotionalTone !== undefined ? { emotionalTone: d.emotionalTone?.length ? d.emotionalTone : null } : {}),
      ...(d.historicalConfidence !== undefined ? { historicalConfidence: d.historicalConfidence ?? null } : {}),
      ...(d.sourceTraceSummary !== undefined ? { sourceTraceSummary: d.sourceTraceSummary?.length ? d.sourceTraceSummary : null } : {}),
      ...(d.continuitySummary !== undefined ? { continuitySummary: d.continuitySummary?.length ? d.continuitySummary : null } : {}),
      ...(d.sceneStatus !== undefined ? { sceneStatus: d.sceneStatus?.length ? d.sceneStatus : null } : {}),
    },
  });

  revalidatePath(`/admin/scenes/${d.id}/workspace`);
  revalidatePath(`/admin/scenes/${d.id}`);
  revalidatePath(`/admin/chapters/${existing.chapterId}`);
  redirectSceneWorkspace(d.id, formData, { saved: "1" });
}

export async function linkEntityToScene(formData: FormData) {
  const parsed = sceneEntityLinkSchema.safeParse({
    sceneId: formData.get("sceneId"),
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
  });
  if (!parsed.success) redirect("/admin/scenes?error=validation");

  const { sceneId, entityType, entityId } = parsed.data;
  const existing = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, chapterId: true, sceneStatus: true },
  });
  if (!existing) redirect("/admin/scenes?error=not_found");
  ensureNotLocked(existing.sceneStatus);

  const connect = { connect: { id: entityId } };
  await prisma.scene.update({
    where: { id: sceneId },
    data:
      entityType === "person"
        ? { persons: connect }
        : entityType === "place"
          ? { places: connect }
          : entityType === "event"
            ? { events: connect }
            : entityType === "symbol"
              ? { symbols: connect }
              : entityType === "source"
                ? { sources: connect }
                : { openQuestions: connect },
  });

  revalidatePath(`/admin/scenes/${sceneId}/workspace`);
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath(`/admin/chapters/${existing.chapterId}`);
  redirectSceneWorkspace(sceneId, formData, { saved: "linked" });
}

export async function unlinkEntityFromScene(formData: FormData) {
  const parsed = sceneEntityLinkSchema.safeParse({
    sceneId: formData.get("sceneId"),
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
  });
  if (!parsed.success) redirect("/admin/scenes?error=validation");

  const { sceneId, entityType, entityId } = parsed.data;
  const existing = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, chapterId: true, sceneStatus: true },
  });
  if (!existing) redirect("/admin/scenes?error=not_found");
  ensureNotLocked(existing.sceneStatus);

  const disconnect = { disconnect: { id: entityId } };
  await prisma.scene.update({
    where: { id: sceneId },
    data:
      entityType === "person"
        ? { persons: disconnect }
        : entityType === "place"
          ? { places: disconnect }
          : entityType === "event"
            ? { events: disconnect }
            : entityType === "symbol"
              ? { symbols: disconnect }
              : entityType === "source"
                ? { sources: disconnect }
                : { openQuestions: disconnect },
  });

  revalidatePath(`/admin/scenes/${sceneId}/workspace`);
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath(`/admin/chapters/${existing.chapterId}`);
  redirectSceneWorkspace(sceneId, formData, { saved: "unlinked" });
}

export async function generateSceneScaffold(formData: FormData) {
  const parsed = sceneScaffoldSchema.safeParse({
    sceneId: formData.get("sceneId"),
  });
  if (!parsed.success) redirect("/admin/scenes?error=validation");

  const sceneId = parsed.data.sceneId;
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: {
      id: true,
      chapterId: true,
      sceneStatus: true,
      persons: { select: { id: true, name: true, description: true, birthYear: true, deathYear: true } },
      places: { select: { id: true, name: true, description: true, placeType: true, latitude: true, longitude: true } },
      events: { select: { id: true, title: true, description: true, startYear: true, endYear: true, eventType: true } },
      symbols: { select: { id: true, name: true, meaning: true, category: true } },
      sources: { select: { id: true, title: true, recordType: true, sourceType: true, sourceYear: true, authorOrOrigin: true } },
      openQuestions: { select: { id: true, title: true, description: true, status: true, priority: true } },
    },
  });
  if (!scene) redirect("/admin/scenes?error=not_found");
  ensureNotLocked(scene.sceneStatus);

  const claims = await prisma.claim.findMany({
    where: { sourceId: { in: scene.sources.map((s) => s.id) } },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: { id: true, description: true, confidence: true, needsReview: true, sourceId: true },
  });

  const verifiedFacts = claims
    .filter((c) => !c.needsReview || c.confidence >= 4)
    .map((c) => ({
      id: c.id,
      description: c.description,
      confidence: c.confidence,
      sourceId: c.sourceId,
    }));

  const continuityRisks = [
    ...(scene.places.length === 0 ? ["No place linked"] : []),
    ...(scene.persons.length === 0 ? ["No people linked"] : []),
    ...(scene.events.length === 0 ? ["No events linked"] : []),
    ...(scene.sources.length === 0 ? ["No sources linked"] : []),
  ];

  const scaffold = {
    people: scene.persons,
    places: scene.places,
    events: scene.events,
    symbols: scene.symbols,
    verifiedFacts,
    openQuestions: scene.openQuestions,
    continuityRisks,
  };

  await prisma.scene.update({
    where: { id: sceneId },
    data: { structuredDataJson: scaffold },
  });

  revalidatePath(`/admin/scenes/${sceneId}/workspace`);
  redirectSceneWorkspace(sceneId, formData, { saved: "scaffold" });
}

export async function generateSceneSummaryFromDraft(formData: FormData) {
  const parsed = sceneGenerateSummarySchema.safeParse({
    sceneId: formData.get("sceneId"),
  });
  if (!parsed.success) redirect("/admin/scenes?error=validation");

  const sceneId = parsed.data.sceneId;
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, chapterId: true, sceneStatus: true, draftText: true },
  });
  if (!scene) redirect("/admin/scenes?error=not_found");
  ensureNotLocked(scene.sceneStatus);

  const text = (scene.draftText ?? "").trim();
  const firstPara = text.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p.length) ?? "";
  const summary = firstPara.length > 400 ? firstPara.slice(0, 400).trimEnd() + "…" : firstPara;

  await prisma.scene.update({
    where: { id: sceneId },
    data: { summary: summary.length ? summary : null },
  });

  revalidatePath(`/admin/scenes/${sceneId}/workspace`);
  revalidatePath(`/admin/scenes/${sceneId}`);
  revalidatePath(`/admin/chapters/${scene.chapterId}`);
  redirectSceneWorkspace(sceneId, formData, { saved: "summary" });
}

export async function updateSceneOrderInChapter(formData: FormData) {
  const parsed = sceneReorderSchema.safeParse({
    sceneId: formData.get("sceneId"),
    orderInChapter: formData.get("orderInChapter"),
  });
  if (!parsed.success) redirect("/admin/chapters?error=validation");

  const { sceneId, orderInChapter } = parsed.data;
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { id: true, chapterId: true, sceneStatus: true },
  });
  if (!scene) redirect("/admin/chapters?error=not_found");

  // allow reordering even when locked (optional), but keep it conservative:
  await prisma.scene.update({
    where: { id: sceneId },
    data: { orderInChapter: orderInChapter ?? null },
  });

  revalidatePath(`/admin/chapters/${scene.chapterId}`);
  revalidatePath("/admin/scenes");
  redirect(`/admin/chapters/${scene.chapterId}?saved=reordered`);
}
