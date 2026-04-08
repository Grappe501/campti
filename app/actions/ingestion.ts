"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { INSTRUCTIONS_VERSION, isNarrativeDnaIngestionEligible } from "@/lib/ingestion-constants";
import {
  buildIngestionPacket,
  estimateTokenCount,
} from "@/lib/ingestion-packet";
import { normalizeExtractionResult, splitDraftsIntoExtractedEntities } from "@/lib/extraction-normalizer";
import { buildMockExtractionResult } from "@/lib/mock-extraction";
import {
  ingestionRunCreateSchema,
  ingestionSourceIdSchema,
  mockExtractionResultSchema,
} from "@/lib/ingestion-validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateIngestion(sourceId: string) {
  revalidatePath("/admin/ingestion");
  revalidatePath(`/admin/ingestion/${sourceId}`);
  revalidatePath(`/admin/sources/${sourceId}`);
}

/** Create an ingestion run and persisted extraction packet from the current source + source text. */
export async function createIngestionPacketAction(formData: FormData) {
  const parsed = ingestionSourceIdSchema.safeParse({
    sourceId: formData.get("sourceId"),
  });
  if (!parsed.success) redirect("/admin/ingestion?error=validation");

  const sourceId = parsed.data.sourceId;
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { sourceText: true },
  });
  if (!source) redirect("/admin/ingestion?error=notfound");

  const packetInput = buildIngestionPacket(source, source.sourceText);
  const rawLen = packetInput.rawText.length;
  const tokenEst = estimateTokenCount(packetInput.rawText);

  const run = await prisma.$transaction(async (tx) => {
    const r = await tx.ingestionRun.create({
      data: {
        sourceId,
        status: "parsed",
        runType: "manual",
        rawTextLength: rawLen,
        tokenEstimate: tokenEst,
        promptVersion: INSTRUCTIONS_VERSION,
      },
    });

    await tx.extractionPacket.create({
      data: {
        ingestionRunId: r.id,
        sourceId,
        sourceTitle: packetInput.sourceTitle,
        sourceType: packetInput.sourceType ?? undefined,
        recordType: packetInput.recordType ?? undefined,
        visibility: packetInput.visibility ?? undefined,
        sourceSummary: packetInput.sourceSummary,
        sourceNotes: packetInput.sourceNotes,
        sourceDate: packetInput.sourceDate,
        sourceYear: packetInput.sourceYear,
        authorOrOrigin: packetInput.authorOrOrigin,
        rawText: packetInput.rawText,
        normalizedText: packetInput.normalizedText,
        instructionsVersion: packetInput.instructionsVersion,
        packetJson: (packetInput.packetJson ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        readyForAI: false,
      },
    });

    await tx.source.update({
      where: { id: sourceId },
      data: {
        lastIngestionRunId: r.id,
        ingestionStatus: "packet_ready",
        processingNotes: "Packet built from source metadata and Source text.",
      },
    });

    return r;
  });

  revalidateIngestion(sourceId);
  redirect(`/admin/ingestion/${sourceId}?run=${run.id}`);
}

export async function markPacketReadyAction(formData: FormData) {
  const parsed = mockExtractionResultSchema
    .pick({ sourceId: true, ingestionRunId: true })
    .safeParse({
      sourceId: formData.get("sourceId"),
      ingestionRunId: formData.get("ingestionRunId"),
    });
  if (!parsed.success) {
    redirect(`/admin/ingestion?error=validation`);
  }

  const { sourceId, ingestionRunId } = parsed.data;

  await prisma.extractionPacket.update({
    where: { ingestionRunId },
    data: { readyForAI: true },
  });

  await prisma.source.update({
    where: { id: sourceId },
    data: { ingestionStatus: "packet_ready" },
  });

  revalidateIngestion(sourceId);
  redirect(`/admin/ingestion/${sourceId}?saved=packet_ready`);
}

export async function createMockExtractionResultAction(formData: FormData) {
  const parsed = mockExtractionResultSchema.safeParse({
    sourceId: formData.get("sourceId"),
    ingestionRunId: formData.get("ingestionRunId"),
    status: formData.get("status") ?? "draft",
  });
  if (!parsed.success) redirect("/admin/ingestion?error=validation");

  const { sourceId, ingestionRunId, status } = parsed.data;
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) redirect("/admin/ingestion?error=notfound");

  const mock = buildMockExtractionResult(source);

  await prisma.extractionResult.upsert({
    where: { ingestionRunId },
    create: {
      ingestionRunId,
      sourceId,
      status,
      summaryDraft: mock.summaryDraft,
      peopleDraft: mock.peopleDraft,
      placesDraft: mock.placesDraft,
      eventsDraft: mock.eventsDraft,
      symbolsDraft: mock.symbolsDraft,
      claimsDraft: mock.claimsDraft,
      chaptersDraft: mock.chaptersDraft,
      scenesDraft: mock.scenesDraft,
      questionsDraft: mock.questionsDraft,
      continuityDraft: mock.continuityDraft,
      resultJson: { mock: true, version: INSTRUCTIONS_VERSION },
    },
    update: {
      status,
      summaryDraft: mock.summaryDraft,
      peopleDraft: mock.peopleDraft,
      placesDraft: mock.placesDraft,
      eventsDraft: mock.eventsDraft,
      symbolsDraft: mock.symbolsDraft,
      claimsDraft: mock.claimsDraft,
      chaptersDraft: mock.chaptersDraft,
      scenesDraft: mock.scenesDraft,
      questionsDraft: mock.questionsDraft,
      continuityDraft: mock.continuityDraft,
      resultJson: { mock: true, version: INSTRUCTIONS_VERSION },
    },
  });

  await prisma.ingestionRun.update({
    where: { id: ingestionRunId },
    data: {
      status: "extracted",
      extractedAt: new Date(),
    },
  });

  await prisma.source.update({
    where: { id: sourceId },
    data: {
      ingestionStatus: "extracted",
      extractedSummary: mock.summaryDraft,
    },
  });

  revalidateIngestion(sourceId);
  redirect(`/admin/ingestion/${sourceId}?saved=mock_result`);
}

export async function generateExtractedEntitiesAction(formData: FormData) {
  const parsed = mockExtractionResultSchema
    .pick({ sourceId: true, ingestionRunId: true })
    .safeParse({
      sourceId: formData.get("sourceId"),
      ingestionRunId: formData.get("ingestionRunId"),
    });
  if (!parsed.success) redirect("/admin/ingestion?error=validation");

  const { sourceId, ingestionRunId } = parsed.data;

  const resultRow = await prisma.extractionResult.findUnique({
    where: { ingestionRunId },
  });
  if (!resultRow) redirect(`/admin/ingestion/${sourceId}?error=no_result`);

  const shape = normalizeExtractionResult({
    summaryDraft: resultRow.summaryDraft,
    peopleDraft: resultRow.peopleDraft,
    placesDraft: resultRow.placesDraft,
    eventsDraft: resultRow.eventsDraft,
    symbolsDraft: resultRow.symbolsDraft,
    claimsDraft: resultRow.claimsDraft,
    chaptersDraft: resultRow.chaptersDraft,
    scenesDraft: resultRow.scenesDraft,
    questionsDraft: resultRow.questionsDraft,
    continuityDraft: resultRow.continuityDraft,
  });

  const rows = splitDraftsIntoExtractedEntities(shape);

  await prisma.$transaction(async (tx) => {
    await tx.extractedEntity.deleteMany({ where: { ingestionRunId } });
    for (const r of rows) {
      await tx.extractedEntity.create({
        data: {
          ingestionRunId,
          sourceId,
          entityType: r.entityType,
          proposedName: r.proposedName,
          proposedTitle: r.proposedTitle,
          proposedData: r.proposedData as Prisma.InputJsonValue,
          confidence: r.confidence,
          reviewStatus: "pending",
        },
      });
    }
  });

  revalidatePath("/admin/extracted");
  revalidateIngestion(sourceId);
  redirect(`/admin/ingestion/${sourceId}?saved=entities`);
}

export async function markSourceReviewingAction(formData: FormData) {
  const parsed = ingestionSourceIdSchema.safeParse({
    sourceId: formData.get("sourceId"),
  });
  if (!parsed.success) redirect("/admin/ingestion?error=validation");

  await prisma.source.update({
    where: { id: parsed.data.sourceId },
    data: { ingestionStatus: "reviewing" },
  });

  revalidateIngestion(parsed.data.sourceId);
  redirect(`/admin/ingestion/${parsed.data.sourceId}?saved=reviewing`);
}

export async function markSourceLinkedAction(formData: FormData) {
  const parsed = ingestionSourceIdSchema.safeParse({
    sourceId: formData.get("sourceId"),
  });
  if (!parsed.success) redirect("/admin/ingestion?error=validation");

  await prisma.source.update({
    where: { id: parsed.data.sourceId },
    data: { ingestionStatus: "linked" },
  });

  revalidateIngestion(parsed.data.sourceId);
  redirect(`/admin/ingestion/${parsed.data.sourceId}?saved=linked`);
}

/** Optional: create a queued run without a packet (for testing). */
export async function createIngestionRunAction(formData: FormData) {
  const parsed = ingestionRunCreateSchema.safeParse({
    sourceId: formData.get("sourceId"),
    status: formData.get("status") ?? "queued",
    runType: formData.get("runType"),
    modelName: formData.get("modelName"),
    promptVersion: formData.get("promptVersion"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) redirect("/admin/ingestion?error=validation");

  const d = parsed.data;
  const run = await prisma.ingestionRun.create({
    data: {
      sourceId: d.sourceId,
      status: d.status,
      runType: d.runType ?? undefined,
      modelName: d.modelName ?? undefined,
      promptVersion: d.promptVersion ?? undefined,
      notes: d.notes ?? undefined,
    },
  });

  await prisma.source.update({
    where: { id: d.sourceId },
    data: { lastIngestionRunId: run.id },
  });

  revalidateIngestion(d.sourceId);
  redirect(`/admin/runs/${run.id}`);
}

/** Re-export for server code that branches ingestion (standard entity vs narrative DNA path). */
export { isNarrativeDnaIngestionEligible };
