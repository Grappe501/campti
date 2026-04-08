import type { Prisma } from "@prisma/client";
import type { ExtractionPacket, Source, SourceText } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildPromptVersionLabel,
  INSTRUCTIONS_VERSION,
  MAX_CHUNK_CHARS,
  MAX_EXTRACTION_CHARS,
} from "@/lib/ingestion-constants";
import type { ExtractionResultShape, IngestionPacketInput } from "@/lib/ingestion-contracts";
import { deriveExtractionWarnings } from "@/lib/extraction-warnings";
import {
  normalizeExtractionResult,
  splitDraftsIntoExtractedEntities,
  validateExtractionResultShape,
} from "@/lib/extraction-normalizer";
import {
  buildExtractionSystemPrompt,
  buildChunkExtractionUserPrompt,
  buildExtractionUserPrompt,
} from "@/lib/extraction-prompt";
import { buildIngestionPacket, estimateTokenCount } from "@/lib/ingestion-packet";
import { aggregateChunkResults } from "@/lib/chunk-aggregation";
import { getConfiguredModelName, getOpenAIClient } from "@/lib/openai";
import { splitSourceTextIntoChunks } from "@/lib/source-chunking";

export type OpenAIExtractionSuccess = {
  ok: true;
  runId: string;
  sourceId: string;
  entityCount: number;
  warnings: string[];
};

export type OpenAIExtractionFailure = {
  ok: false;
  code: string;
  message: string;
  runId?: string;
  sourceId?: string;
};

export type OpenAIExtractionOutcome = OpenAIExtractionSuccess | OpenAIExtractionFailure;

function isPlaceholderSourceText(rawText: string, sourceTitle: string): boolean {
  return rawText.includes(`[No source text yet for "${sourceTitle}"`);
}

export function hasUsableSourceTextForExtraction(
  source: Source,
  sourceText: SourceText | null,
): boolean {
  const raw = sourceText?.rawText?.trim();
  if (!raw?.length) return false;
  return !isPlaceholderSourceText(raw, source.title);
}

/**
 * Prefer normalized body when present; enforce MAX_EXTRACTION_CHARS on the text sent to the model.
 */
export function preparePacketForExtraction(packet: IngestionPacketInput): {
  packet: IngestionPacketInput;
  truncated: boolean;
  originalChars: number;
  sentChars: number;
} {
  const body =
    packet.normalizedText && packet.normalizedText.trim().length > 0
      ? packet.normalizedText
      : packet.rawText;
  const originalChars = body.length;
  let sent = body;
  let truncated = false;
  if (sent.length > MAX_EXTRACTION_CHARS) {
    sent = sent.slice(0, MAX_EXTRACTION_CHARS);
    truncated = true;
  }

  const baseJson =
    packet.packetJson && typeof packet.packetJson === "object"
      ? (packet.packetJson as Record<string, unknown>)
      : {};

  const packetJson: Record<string, unknown> = {
    ...baseJson,
    truncation: {
      truncated,
      originalChars,
      sentChars: sent.length,
      maxChars: MAX_EXTRACTION_CHARS,
    },
  };

  const next: IngestionPacketInput = {
    ...packet,
    rawText: sent,
    normalizedText: truncated ? null : packet.normalizedText,
    packetJson,
  };

  return {
    packet: next,
    truncated,
    originalChars,
    sentChars: sent.length,
  };
}

function packetRowToInput(row: ExtractionPacket): IngestionPacketInput {
  return {
    sourceId: row.sourceId,
    sourceTitle: row.sourceTitle,
    sourceType: row.sourceType,
    recordType: row.recordType,
    visibility: row.visibility,
    sourceSummary: row.sourceSummary,
    sourceNotes: row.sourceNotes,
    sourceDate: row.sourceDate,
    sourceYear: row.sourceYear,
    authorOrOrigin: row.authorOrOrigin,
    rawText: row.rawText,
    normalizedText: row.normalizedText,
    instructionsVersion: row.instructionsVersion ?? INSTRUCTIONS_VERSION,
    packetJson:
      row.packetJson && typeof row.packetJson === "object"
        ? (row.packetJson as Record<string, unknown>)
        : null,
  };
}

function parseModelJsonContent(content: string | null | undefined): unknown {
  if (!content?.trim()) {
    throw new Error("Model returned empty content.");
  }
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/u, "")
      .trim();
  }
  return JSON.parse(text) as unknown;
}

async function failRun(
  runId: string,
  message: string,
): Promise<void> {
  await prisma.ingestionRun.update({
    where: { id: runId },
    data: {
      status: "failed",
      errorMessage: message,
    },
  });
}

/**
 * Persist normalized extraction, replace entities for this run, update source and run.
 */
export async function persistExtractionOutcome(params: {
  ingestionRunId: string;
  sourceId: string;
  normalized: ExtractionResultShape;
  rawModelOutput: Prisma.InputJsonValue;
  resultStatus: string;
  runStatus: string;
  warningsText: string | null;
  aggregatedFromChunks?: boolean;
  aggregationNotes?: string | null;
}): Promise<{ entityCount: number }> {
  const {
    ingestionRunId,
    sourceId,
    normalized,
    rawModelOutput,
    resultStatus,
    runStatus,
    warningsText,
    aggregatedFromChunks,
    aggregationNotes,
  } = params;
  const rows = splitDraftsIntoExtractedEntities(normalized);

  await prisma.$transaction(async (tx) => {
    await tx.extractionResult.upsert({
      where: { ingestionRunId },
      create: {
        ingestionRunId,
        sourceId,
        status: resultStatus,
        summaryDraft: normalized.summaryDraft,
        peopleDraft: normalized.peopleDraft,
        placesDraft: normalized.placesDraft,
        eventsDraft: normalized.eventsDraft,
        symbolsDraft: normalized.symbolsDraft,
        claimsDraft: normalized.claimsDraft,
        chaptersDraft: normalized.chaptersDraft,
        scenesDraft: normalized.scenesDraft,
        questionsDraft: normalized.questionsDraft,
        continuityDraft: normalized.continuityDraft,
        resultJson: {
          pipeline: "openai",
          promptVersion: buildPromptVersionLabel(),
        },
        rawModelOutput,
      },
      update: {
        status: resultStatus,
        summaryDraft: normalized.summaryDraft,
        peopleDraft: normalized.peopleDraft,
        placesDraft: normalized.placesDraft,
        eventsDraft: normalized.eventsDraft,
        symbolsDraft: normalized.symbolsDraft,
        claimsDraft: normalized.claimsDraft,
        chaptersDraft: normalized.chaptersDraft,
        scenesDraft: normalized.scenesDraft,
        questionsDraft: normalized.questionsDraft,
        continuityDraft: normalized.continuityDraft,
        resultJson: {
          pipeline: "openai",
          promptVersion: buildPromptVersionLabel(),
        },
        rawModelOutput,
      },
    });

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

    await tx.ingestionRun.update({
      where: { id: ingestionRunId },
      data: {
        status: runStatus,
        extractedAt: new Date(),
        errorMessage: null,
        notes: warningsText ?? undefined,
        aggregatedFromChunks: aggregatedFromChunks ?? undefined,
        aggregationNotes: aggregationNotes ?? undefined,
      },
    });

    await tx.source.update({
      where: { id: sourceId },
      data: {
        lastIngestionRunId: ingestionRunId,
        ingestionStatus: "extracted",
        extractedSummary: normalized.summaryDraft ?? undefined,
      },
    });
  });

  return { entityCount: rows.length };
}

async function createOpenAIRunAndPacket(
  sourceId: string,
  packetInput: IngestionPacketInput,
  opts: { truncated: boolean; originalChars: number; sentChars: number },
): Promise<{ runId: string }> {
  const modelName = getConfiguredModelName();
  const tokenEstimate = estimateTokenCount(packetInput.rawText);
  const truncationNote = opts.truncated
    ? `Source text truncated for extraction: ${opts.sentChars} of ${opts.originalChars} characters sent (limit ${MAX_EXTRACTION_CHARS}).`
    : null;

  const createdRun = await prisma.$transaction(async (tx) => {
    const r = await tx.ingestionRun.create({
      data: {
        sourceId,
        status: "processing",
        runType: "openai",
        modelName,
        promptVersion: buildPromptVersionLabel(),
        rawTextLength: opts.originalChars,
        tokenEstimate,
        notes: truncationNote ?? undefined,
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
        readyForAI: true,
      },
    });

    await tx.source.update({
      where: { id: sourceId },
      data: {
        lastIngestionRunId: r.id,
        ingestionStatus: "processing",
        processingNotes: "OpenAI extraction in progress.",
      },
    });

    return r;
  });

  return { runId: createdRun.id };
}

async function callOpenAIAndPersist(
  runId: string,
  sourceId: string,
  packetInput: IngestionPacketInput,
  opts: { truncated: boolean; originalChars: number },
): Promise<OpenAIExtractionOutcome> {
  let content: string | null | undefined;
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: getConfiguredModelName(),
      messages: [
        { role: "system", content: buildExtractionSystemPrompt() },
        { role: "user", content: buildExtractionUserPrompt(packetInput) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    content = completion.choices[0]?.message?.content;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OpenAI request failed.";
    await failRun(runId, msg);
    return {
      ok: false,
      code: "openai_failed",
      message: msg,
      runId,
      sourceId,
    };
  }

  let parsedRoot: unknown;
  try {
    parsedRoot = parseModelJsonContent(content);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Model response was not valid JSON.";
    await failRun(runId, `Invalid JSON: ${msg}`);
    return {
      ok: false,
      code: "invalid_json",
      message: msg,
      runId,
      sourceId,
    };
  }

  const validated = validateExtractionResultShape(parsedRoot);
  const normalized = validated ?? normalizeExtractionResult(parsedRoot);
  const schemaNote =
    validated === null
      ? "Model JSON did not fully match the expected top-level shape; applied best-effort normalization."
      : null;

  const warnings = deriveExtractionWarnings(normalized);
  const notesParts: string[] = [];
  if (opts.truncated) {
    notesParts.push(
      `Truncation: only first ${MAX_EXTRACTION_CHARS} characters of ${opts.originalChars} were sent.`,
    );
  }
  if (schemaNote) {
    notesParts.push(schemaNote);
  }
  if (warnings.length) {
    notesParts.push("Warnings:\n- " + warnings.join("\n- "));
  }
  const warningsText = notesParts.length ? notesParts.join("\n\n") : null;

  const rawOut = {
    parsedRoot,
    model: getConfiguredModelName(),
    promptVersion: buildPromptVersionLabel(),
    validated: validated !== null,
  } as Prisma.InputJsonValue;

  try {
    const { entityCount } = await persistExtractionOutcome({
      ingestionRunId: runId,
      sourceId,
      normalized,
      rawModelOutput: rawOut,
      resultStatus: "draft",
      runStatus: "extracted",
      warningsText,
    });
    return {
      ok: true,
      runId,
      sourceId,
      entityCount,
      warnings,
    };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Failed to persist extraction outcome.";
    await failRun(runId, msg);
    return {
      ok: false,
      code: "db_failed",
      message: msg,
      runId,
      sourceId,
    };
  }
}

export async function runOpenAIExtractionForSource(
  sourceId: string,
): Promise<OpenAIExtractionOutcome> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      ok: false,
      code: "no_key",
      message:
        "OPENAI_API_KEY is not configured. Set it in the environment to run real extraction.",
      sourceId,
    };
  }

  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { sourceText: true },
  });
  if (!source) {
    return { ok: false, code: "not_found", message: "Source not found.", sourceId };
  }

  if (!hasUsableSourceTextForExtraction(source, source.sourceText)) {
    return {
      ok: false,
      code: "no_text",
      message:
        "No source text to extract. Paste text on the source detail page (Source text) first.",
      sourceId,
    };
  }

  const basePacket = buildIngestionPacket(source, source.sourceText);
  const normalizedBody =
    basePacket.normalizedText && basePacket.normalizedText.trim().length > 0
      ? basePacket.normalizedText
      : basePacket.rawText;

  if (!normalizedBody.trim().length) {
    return {
      ok: false,
      code: "empty_packet",
      message: "Packet text is empty after preparation.",
      sourceId,
    };
  }

  if (normalizedBody.length <= MAX_EXTRACTION_CHARS) {
    const { packet, truncated, originalChars, sentChars } =
      preparePacketForExtraction(basePacket);

    const { runId } = await createOpenAIRunAndPacket(sourceId, packet, {
      truncated,
      originalChars,
      sentChars,
    });

    return callOpenAIAndPersist(runId, sourceId, packet, { truncated, originalChars });
  }

  const { normalizedFullText, chunks } = splitSourceTextIntoChunks({
    rawText: normalizedBody,
    maxChunkChars: MAX_CHUNK_CHARS,
  });

  if (!chunks.length) {
    return {
      ok: false,
      code: "empty_packet",
      message: "Chunk splitter produced no chunks.",
      sourceId,
    };
  }

  const modelName = getConfiguredModelName();
  const parentTokenEstimate = estimateTokenCount(normalizedFullText);

  const parentRun = await prisma.$transaction(async (tx) => {
    const r = await tx.ingestionRun.create({
      data: {
        sourceId,
        status: "processing",
        runType: "openai",
        modelName,
        promptVersion: buildPromptVersionLabel(),
        rawTextLength: normalizedFullText.length,
        tokenEstimate: parentTokenEstimate,
        chunkingMode: "chunked",
        chunkCount: chunks.length,
      },
    });

    await tx.extractionPacket.create({
      data: {
        ingestionRunId: r.id,
        sourceId,
        sourceTitle: basePacket.sourceTitle,
        sourceType: basePacket.sourceType ?? undefined,
        recordType: basePacket.recordType ?? undefined,
        visibility: basePacket.visibility ?? undefined,
        sourceSummary: basePacket.sourceSummary,
        sourceNotes: basePacket.sourceNotes,
        sourceDate: basePacket.sourceDate,
        sourceYear: basePacket.sourceYear,
        authorOrOrigin: basePacket.authorOrOrigin,
        rawText: normalizedFullText,
        normalizedText: normalizedFullText,
        instructionsVersion: basePacket.instructionsVersion,
        packetJson: {
          ...(basePacket.packetJson ?? {}),
          modeDecision: {
            normalizedLength: normalizedFullText.length,
            tokenEstimate: parentTokenEstimate,
            selectedMode: "chunked",
            reason: `above MAX_EXTRACTION_CHARS (${MAX_EXTRACTION_CHARS})`,
          },
        } as Prisma.InputJsonValue,
        readyForAI: true,
      },
    });

    const sourceTextId = source.sourceText?.id ?? null;
    await tx.sourceChunk.deleteMany({ where: { sourceId } });
    for (const c of chunks) {
      await tx.sourceChunk.create({
        data: {
          sourceId,
          sourceTextId: sourceTextId ?? undefined,
          chunkIndex: c.chunkIndex,
          startOffset: c.startOffset,
          endOffset: c.endOffset,
          charCount: c.charCount,
          tokenEstimate: c.tokenEstimate,
          headingHint: c.headingHint,
          chunkLabel: c.chunkLabel,
          rawText: c.rawText,
          normalizedText: c.normalizedText,
          textStatus: "chunked",
        },
      });
    }

    await tx.source.update({
      where: { id: sourceId },
      data: {
        lastIngestionRunId: r.id,
        ingestionStatus: "processing",
        processingNotes: `OpenAI extraction in progress (chunked: ${chunks.length} chunks).`,
      },
    });

    return r;
  });

  const openai = getOpenAIClient();
  const successful: ExtractionResultShape[] = [];
  const chunkWarnings: string[] = [];
  let failedCount = 0;

  const sourceChunks = await prisma.sourceChunk.findMany({
    where: { sourceId },
    orderBy: { chunkIndex: "asc" },
  });

  for (const row of sourceChunks) {
    const chunkRun = await prisma.chunkExtractionRun.create({
      data: {
        ingestionRunId: parentRun.id,
        sourceChunkId: row.id,
        status: "processing",
        modelName,
        promptVersion: buildPromptVersionLabel(),
        rawTextLength: row.normalizedText?.length ?? row.rawText?.length ?? null,
        tokenEstimate: row.normalizedText ? estimateTokenCount(row.normalizedText) : null,
        notes: row.chunkLabel ? `Chunk label: ${row.chunkLabel}` : undefined,
      },
    });

    try {
      const chunkPacket: IngestionPacketInput = {
        ...basePacket,
        rawText: row.normalizedText ?? row.rawText ?? "",
        normalizedText: row.normalizedText ?? null,
        packetJson: basePacket.packetJson ?? null,
      };

      const completion = await openai.chat.completions.create({
        model: getConfiguredModelName(),
        messages: [
          { role: "system", content: buildExtractionSystemPrompt() },
          {
            role: "user",
            content: buildChunkExtractionUserPrompt({
              packet: chunkPacket,
              chunk: {
                chunkIndex: row.chunkIndex,
                startOffset: row.startOffset ?? 0,
                endOffset:
                  row.endOffset ??
                  (row.normalizedText ?? row.rawText ?? "").length,
                charCount:
                  row.charCount ?? (row.normalizedText ?? row.rawText ?? "").length,
                tokenEstimate:
                  row.tokenEstimate ??
                  estimateTokenCount(row.normalizedText ?? row.rawText ?? ""),
                headingHint: row.headingHint ?? undefined,
                chunkLabel:
                  row.chunkLabel ??
                  `Chunk ${String(row.chunkIndex + 1).padStart(2, "0")}`,
                rawText: row.rawText ?? "",
                normalizedText: row.normalizedText ?? row.rawText ?? "",
              },
              totalChunks: chunks.length,
            }),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      const parsedRoot = parseModelJsonContent(content);
      const validated = validateExtractionResultShape(parsedRoot);
      const normalized = validated ?? normalizeExtractionResult(parsedRoot);
      successful.push(normalized);

      await prisma.chunkExtractionRun.update({
        where: { id: chunkRun.id },
        data: {
          status: "extracted",
          extractedAt: new Date(),
          errorMessage: null,
          chunkResultJson: normalized as unknown as Prisma.InputJsonValue,
          rawModelOutput: {
            parsedRoot,
            model: getConfiguredModelName(),
            promptVersion: buildPromptVersionLabel(),
            validated: validated !== null,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      failedCount += 1;
      const msg = e instanceof Error ? e.message : "Chunk extraction failed.";
      chunkWarnings.push(
        `Chunk ${String(row.chunkIndex + 1).padStart(2, "0")} failed: ${msg}`,
      );
      await prisma.chunkExtractionRun.update({
        where: { id: chunkRun.id },
        data: { status: "failed", errorMessage: msg },
      });
    }
  }

  if (successful.length === 0) {
    const msg = `All ${chunks.length} chunks failed extraction; no aggregated result produced.`;
    await failRun(parentRun.id, msg);
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        ingestionStatus: "failed",
        processingNotes: msg,
        lastIngestionRunId: parentRun.id,
      },
    });
    return {
      ok: false,
      code: "all_chunks_failed",
      message: msg,
      runId: parentRun.id,
      sourceId,
    };
  }

  const { aggregated, warnings: aggWarnings } = aggregateChunkResults({
    chunkResults: successful,
    failedChunkCount: failedCount,
  });

  const derived = deriveExtractionWarnings(aggregated);
  const allWarnings = [
    ...derived,
    ...chunkWarnings,
    ...aggWarnings.map((w) => w.message),
  ];

  const partial = failedCount > 0;
  const runStatus = partial ? "extracted_with_warnings" : "extracted";
  const aggregationNotes =
    allWarnings.length > 0 ? "Warnings:\n- " + allWarnings.join("\n- ") : null;

  const rawOut = {
    aggregatedFromChunks: true,
    chunkCount: chunks.length,
    successfulChunkCount: successful.length,
    failedChunkCount: failedCount,
    warnings: aggWarnings,
  } as Prisma.InputJsonValue;

  try {
    const { entityCount } = await persistExtractionOutcome({
      ingestionRunId: parentRun.id,
      sourceId,
      normalized: aggregated,
      rawModelOutput: rawOut,
      resultStatus: "draft",
      runStatus,
      warningsText: aggregationNotes,
      aggregatedFromChunks: true,
      aggregationNotes,
    });

    return {
      ok: true,
      runId: parentRun.id,
      sourceId,
      entityCount,
      warnings: allWarnings,
    };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Failed to persist aggregated extraction outcome.";
    await failRun(parentRun.id, msg);
    return {
      ok: false,
      code: "db_failed",
      message: msg,
      runId: parentRun.id,
      sourceId,
    };
  }
}

export async function runOpenAIExtractionFromPacket(
  packetId: string,
): Promise<OpenAIExtractionOutcome> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      ok: false,
      code: "no_key",
      message:
        "OPENAI_API_KEY is not configured. Set it in the environment to run real extraction.",
    };
  }

  const row = await prisma.extractionPacket.findUnique({
    where: { id: packetId },
    include: { source: { include: { sourceText: true } } },
  });
  if (!row) {
    return { ok: false, code: "not_found", message: "Extraction packet not found." };
  }

  const base = packetRowToInput(row);
  const { packet, truncated, originalChars, sentChars } =
    preparePacketForExtraction(base);

  if (!packet.rawText.trim().length) {
    return {
      ok: false,
      code: "empty_packet",
      message: "Packet text is empty after preparation.",
      sourceId: row.sourceId,
    };
  }

  const { runId } = await createOpenAIRunAndPacket(row.sourceId, packet, {
    truncated,
    originalChars,
    sentChars,
  });

  return callOpenAIAndPersist(runId, row.sourceId, packet, {
    truncated,
    originalChars,
  });
}
