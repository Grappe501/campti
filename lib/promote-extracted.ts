import type { ExtractedEntity } from "@prisma/client";
import {
  EventType,
  PlaceType,
  RecordType,
  SymbolCategory,
  VisibilityStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type JsonObj = Record<string, unknown>;

function asObj(data: unknown): JsonObj {
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as JsonObj)
    : {};
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length ? v.trim() : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : undefined;
}

function parsePlaceType(s: string | undefined): PlaceType {
  const upper = s?.toUpperCase().replace(/[- ]/g, "_");
  const values = Object.values(PlaceType) as string[];
  return values.includes(upper ?? "") ? (upper as PlaceType) : PlaceType.OTHER;
}

function parseEventType(s: string | undefined): EventType {
  const upper = s?.toUpperCase().replace(/[- ]/g, "_");
  const values = Object.values(EventType) as string[];
  return values.includes(upper ?? "") ? (upper as EventType) : EventType.OTHER;
}

function parseSymbolCategory(s: string | undefined): SymbolCategory | null {
  const upper = s?.toUpperCase();
  const map: Record<string, SymbolCategory> = {
    ELEMENT: SymbolCategory.ELEMENTAL,
    ELEMENTAL: SymbolCategory.ELEMENTAL,
    FOOD: SymbolCategory.CULINARY,
    CULINARY: SymbolCategory.CULINARY,
    PLANT: SymbolCategory.LANDSCAPE,
    LANDSCAPE: SymbolCategory.LANDSCAPE,
    RELIGIOUS: SymbolCategory.RELIGIOUS,
    FAMILY: SymbolCategory.FAMILY,
    FAMILY_SYM: SymbolCategory.FAMILY,
    RITUAL: SymbolCategory.RITUAL,
    OTHER: SymbolCategory.OTHER,
    SYMBOL_OTHER: SymbolCategory.OTHER,
  };
  if (!upper) return null;
  return map[upper] ?? null;
}

export type PromoteResult =
  | { ok: true; recordId: string; recordType: string }
  | { ok: false; reason: string };

export async function promoteExtractedPerson(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const d = asObj(entity.proposedData);
  const name =
    str(d.name) ?? str(d.label) ?? entity.proposedName ?? entity.proposedTitle;
  if (!name) return { ok: false, reason: "Missing person name" };

  const visibility =
    (d.visibilitySuggestion as VisibilityStatus | undefined) ??
    VisibilityStatus.PRIVATE;
  const recordType =
    (d.recordTypeSuggestion as RecordType | undefined) ?? RecordType.HYBRID;

  const created = await prisma.person.create({
    data: {
      name,
      description: str(d.description) ?? str(d.summary) ?? null,
      birthYear: num(d.birthYear) ?? null,
      deathYear: num(d.deathYear) ?? null,
      visibility,
      recordType,
      sources: { connect: { id: entity.sourceId } },
    },
  });

  await prisma.extractedEntity.update({
    where: { id: entity.id },
    data: {
      reviewStatus: "merged",
      matchedRecordId: created.id,
      matchedRecordType: "person",
    },
  });

  return { ok: true, recordId: created.id, recordType: "person" };
}

export async function promoteExtractedPlace(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const d = asObj(entity.proposedData);
  const name =
    str(d.name) ?? str(d.label) ?? entity.proposedName ?? entity.proposedTitle;
  if (!name) return { ok: false, reason: "Missing place name" };

  const visibility =
    (d.visibilitySuggestion as VisibilityStatus | undefined) ??
    VisibilityStatus.PRIVATE;
  const recordType =
    (d.recordTypeSuggestion as RecordType | undefined) ?? RecordType.HISTORICAL;

  const created = await prisma.place.create({
    data: {
      name,
      description: str(d.description) ?? str(d.summary) ?? null,
      placeType: parsePlaceType(str(d.placeTypeSuggestion)),
      visibility,
      recordType,
      sources: { connect: { id: entity.sourceId } },
    },
  });

  await prisma.extractedEntity.update({
    where: { id: entity.id },
    data: {
      reviewStatus: "merged",
      matchedRecordId: created.id,
      matchedRecordType: "place",
    },
  });

  return { ok: true, recordId: created.id, recordType: "place" };
}

export async function promoteExtractedEvent(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const d = asObj(entity.proposedData);
  const title =
    str(d.title) ?? str(d.label) ?? entity.proposedTitle ?? entity.proposedName;
  if (!title) return { ok: false, reason: "Missing event title" };

  const visibility =
    (d.visibilitySuggestion as VisibilityStatus | undefined) ??
    VisibilityStatus.PRIVATE;
  const recordType =
    (d.recordTypeSuggestion as RecordType | undefined) ?? RecordType.HYBRID;

  const created = await prisma.event.create({
    data: {
      title,
      description: str(d.description) ?? str(d.summary) ?? null,
      startYear: num(d.startYear) ?? null,
      endYear: num(d.endYear) ?? null,
      eventType: parseEventType(str(d.eventTypeSuggestion)),
      visibility,
      recordType,
      sources: { connect: { id: entity.sourceId } },
    },
  });

  await prisma.extractedEntity.update({
    where: { id: entity.id },
    data: {
      reviewStatus: "merged",
      matchedRecordId: created.id,
      matchedRecordType: "event",
    },
  });

  return { ok: true, recordId: created.id, recordType: "event" };
}

export async function promoteExtractedSymbol(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const d = asObj(entity.proposedData);
  const name =
    str(d.name) ?? str(d.label) ?? entity.proposedName ?? entity.proposedTitle;
  if (!name) return { ok: false, reason: "Missing symbol name" };

  const visibility =
    (d.visibilitySuggestion as VisibilityStatus | undefined) ??
    VisibilityStatus.PRIVATE;
  const recordType =
    (d.recordTypeSuggestion as RecordType | undefined) ?? RecordType.FICTIONAL;

  const cat =
    parseSymbolCategory(str(d.categorySuggestion)) ?? SymbolCategory.OTHER;

  const created = await prisma.symbol.create({
    data: {
      name,
      meaning: str(d.description) ?? str(d.summary) ?? null,
      category: cat,
      visibility,
      recordType,
    },
  });

  await prisma.extractedEntity.update({
    where: { id: entity.id },
    data: {
      reviewStatus: "merged",
      matchedRecordId: created.id,
      matchedRecordType: "symbol",
    },
  });

  return { ok: true, recordId: created.id, recordType: "symbol" };
}

export async function promoteExtractedClaim(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const d = asObj(entity.proposedData);
  const description =
    str(d.description) ??
    str(d.summary) ??
    entity.proposedName ??
    entity.proposedTitle;
  if (!description) return { ok: false, reason: "Missing claim text" };

  const visibility =
    (d.visibilitySuggestion as VisibilityStatus | undefined) ??
    VisibilityStatus.PRIVATE;
  const recordType =
    (d.recordTypeSuggestion as RecordType | undefined) ?? RecordType.HYBRID;
  const confidence = num(d.confidence) ?? entity.confidence ?? 3;

  const created = await prisma.claim.create({
    data: {
      description,
      confidence: Math.min(5, Math.max(1, confidence)),
      quoteExcerpt: str(d.quoteExcerpt) ?? str(d.sourceExcerpt) ?? null,
      notes: str(d.notes) ?? null,
      visibility,
      recordType,
      sourceId: entity.sourceId,
      needsReview: true,
    },
  });

  await prisma.extractedEntity.update({
    where: { id: entity.id },
    data: {
      reviewStatus: "merged",
      matchedRecordId: created.id,
      matchedRecordType: "claim",
    },
  });

  return { ok: true, recordId: created.id, recordType: "claim" };
}

export async function promoteExtractedQuestion(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const d = asObj(entity.proposedData);
  const title =
    str(d.title) ?? str(d.label) ?? entity.proposedTitle ?? entity.proposedName;
  if (!title) return { ok: false, reason: "Missing question title" };

  const created = await prisma.openQuestion.create({
    data: {
      title,
      description: str(d.description) ?? str(d.summary) ?? null,
      status: "open",
      priority: num(d.priority) ?? null,
      linkedSourceId: entity.sourceId,
    },
  });

  await prisma.extractedEntity.update({
    where: { id: entity.id },
    data: {
      reviewStatus: "merged",
      matchedRecordId: created.id,
      matchedRecordType: "openQuestion",
    },
  });

  return { ok: true, recordId: created.id, recordType: "openQuestion" };
}

export async function promoteExtractedContinuity(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const d = asObj(entity.proposedData);
  const title =
    str(d.title) ?? str(d.label) ?? entity.proposedTitle ?? entity.proposedName;
  if (!title) return { ok: false, reason: "Missing continuity title" };

  const severity = str(d.severitySuggestion) ?? "medium";
  const status = str(d.statusSuggestion) ?? "open";

  const created = await prisma.continuityNote.create({
    data: {
      title,
      description: str(d.description) ?? str(d.summary) ?? null,
      severity,
      status,
    },
  });

  await prisma.extractedEntity.update({
    where: { id: entity.id },
    data: {
      reviewStatus: "merged",
      matchedRecordId: created.id,
      matchedRecordType: "continuityNote",
    },
  });

  return { ok: true, recordId: created.id, recordType: "continuityNote" };
}

export async function promoteExtractedChapter(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const d = asObj(entity.proposedData);
  const title =
    str(d.title) ?? str(d.label) ?? entity.proposedTitle ?? entity.proposedName;
  if (!title) return { ok: false, reason: "Missing chapter title" };

  const visibility =
    (d.visibilitySuggestion as VisibilityStatus | undefined) ??
    VisibilityStatus.PRIVATE;
  const recordType =
    (d.recordTypeSuggestion as RecordType | undefined) ?? RecordType.FICTIONAL;

  const created = await prisma.chapter.create({
    data: {
      title,
      summary: str(d.summary) ?? str(d.description) ?? null,
      chapterNumber: num(d.chapterNumber) ?? null,
      visibility,
      recordType,
      sources: { connect: { id: entity.sourceId } },
    },
  });

  await prisma.extractedEntity.update({
    where: { id: entity.id },
    data: {
      reviewStatus: "merged",
      matchedRecordId: created.id,
      matchedRecordType: "chapter",
    },
  });

  return { ok: true, recordId: created.id, recordType: "chapter" };
}

const promoteMap: Record<
  string,
  (e: ExtractedEntity) => Promise<PromoteResult>
> = {
  person: promoteExtractedPerson,
  place: promoteExtractedPlace,
  event: promoteExtractedEvent,
  symbol: promoteExtractedSymbol,
  claim: promoteExtractedClaim,
  question: promoteExtractedQuestion,
  continuity: promoteExtractedContinuity,
  chapter: promoteExtractedChapter,
};

export async function promoteExtractedByType(
  entity: ExtractedEntity,
): Promise<PromoteResult> {
  const fn = promoteMap[entity.entityType];
  if (!fn) {
    return { ok: false, reason: `Promotion not implemented for ${entity.entityType}` };
  }
  return fn(entity);
}
