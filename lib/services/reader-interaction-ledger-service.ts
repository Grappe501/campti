/**
 * P2-V — Persisted reader interaction ledger (metering / accounting structure only).
 * No billing providers, charges, or payment capture.
 */

import type { Prisma, ReaderInteractionLedgerEntry as ReaderInteractionLedgerRow } from "@prisma/client";

import type {
  ReaderInteractionLedgerEntry,
  ReaderInteractionLedgerEntryKind,
  ReaderInteractionLedgerSessionSummary,
} from "@/lib/domain/reader-interaction-ledger";
import { prisma } from "@/lib/prisma";

function toDomain(row: ReaderInteractionLedgerRow): ReaderInteractionLedgerEntry {
  return {
    id: row.id,
    readerId: row.readerId,
    sessionId: row.sessionId,
    entryType: row.entryType as ReaderInteractionLedgerEntryKind,
    unitCount: row.unitCount,
    estimatedCostUnits: row.estimatedCostUnits,
    metadataJson: row.metadataJson,
    createdAt: row.createdAt,
  };
}

export type CreateLedgerEntryParams = {
  readerId: string;
  sessionId?: string | null;
  entryType: ReaderInteractionLedgerEntryKind;
  unitCount: number;
  estimatedCostUnits: number;
  metadataJson?: Prisma.InputJsonValue | null;
};

/**
 * Append one ledger row. When `sessionId` is set, verifies the session exists and `readerId` matches.
 */
export async function createLedgerEntry(params: CreateLedgerEntryParams): Promise<ReaderInteractionLedgerEntry> {
  const readerId = params.readerId.trim();
  if (!readerId) throw new Error("[reader-interaction-ledger] readerId is required.");
  if (!Number.isFinite(params.unitCount) || params.unitCount < 0) {
    throw new Error("[reader-interaction-ledger] unitCount must be a non-negative finite number.");
  }
  if (!Number.isFinite(params.estimatedCostUnits) || params.estimatedCostUnits < 0) {
    throw new Error("[reader-interaction-ledger] estimatedCostUnits must be a non-negative finite number.");
  }

  const sid = params.sessionId?.trim() ? params.sessionId.trim() : null;
  if (sid) {
    const session = await prisma.characterConversationSession.findUnique({
      where: { id: sid },
      select: { id: true, readerId: true },
    });
    if (!session) {
      throw new Error(`[reader-interaction-ledger] Session not found: ${sid}`);
    }
    if (session.readerId !== readerId) {
      throw new Error("[reader-interaction-ledger] sessionId does not belong to this readerId.");
    }
  }

  const row = await prisma.readerInteractionLedgerEntry.create({
    data: {
      readerId,
      sessionId: sid,
      entryType: params.entryType,
      unitCount: Math.floor(params.unitCount),
      estimatedCostUnits: Math.floor(params.estimatedCostUnits),
      metadataJson: params.metadataJson ?? undefined,
    },
  });

  return toDomain(row);
}

export type ListLedgerEntriesForReaderParams = {
  readerId: string;
  /** Max rows (default 100, cap 500). */
  limit?: number;
  sessionId?: string | null;
};

/** Recent ledger rows for a reader, newest first. */
export async function listLedgerEntriesForReader(
  params: ListLedgerEntriesForReaderParams
): Promise<ReaderInteractionLedgerEntry[]> {
  const readerId = params.readerId.trim();
  if (!readerId) return [];

  const limit = Math.min(500, Math.max(1, params.limit ?? 100));

  const rows = await prisma.readerInteractionLedgerEntry.findMany({
    where: {
      readerId,
      ...(params.sessionId?.trim()
        ? { sessionId: params.sessionId.trim() }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(toDomain);
}

/**
 * Aggregate unit and cost totals for all ledger rows tied to a session.
 */
export async function summarizeLedgerForSession(
  sessionId: string
): Promise<ReaderInteractionLedgerSessionSummary | null> {
  const sid = sessionId.trim();
  if (!sid) return null;

  const session = await prisma.characterConversationSession.findUnique({
    where: { id: sid },
    select: { id: true },
  });
  if (!session) return null;

  const rows = await prisma.readerInteractionLedgerEntry.findMany({
    where: { sessionId: sid },
    select: {
      entryType: true,
      unitCount: true,
      estimatedCostUnits: true,
    },
  });

  if (rows.length === 0) {
    return {
      sessionId: sid,
      entryCount: 0,
      totalUnitCount: 0,
      totalEstimatedCostUnits: 0,
      byEntryType: {},
    };
  }

  const byEntryType: ReaderInteractionLedgerSessionSummary["byEntryType"] = {};
  let totalUnitCount = 0;
  let totalEstimatedCostUnits = 0;

  for (const r of rows) {
    const k = r.entryType as ReaderInteractionLedgerEntryKind;
    totalUnitCount += r.unitCount;
    totalEstimatedCostUnits += r.estimatedCostUnits;
    const prev = byEntryType[k] ?? { entryCount: 0, unitCount: 0, estimatedCostUnits: 0 };
    byEntryType[k] = {
      entryCount: prev.entryCount + 1,
      unitCount: prev.unitCount + r.unitCount,
      estimatedCostUnits: prev.estimatedCostUnits + r.estimatedCostUnits,
    };
  }

  return {
    sessionId: sid,
    entryCount: rows.length,
    totalUnitCount,
    totalEstimatedCostUnits,
    byEntryType,
  };
}
