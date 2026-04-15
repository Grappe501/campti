/**
 * P2-V — Reader interaction ledger (cost accounting envelope).
 *
 * Rows are **not** invoices or payment records — they aggregate usage for metering dashboards and future
 * billing adapters. `readerId` is an opaque key (not a `Person` row).
 */

import type { Prisma } from "@prisma/client";

/** Matches Prisma {@link ReaderInteractionLedgerEntryType}. */
export type ReaderInteractionLedgerEntryKind = "text_turn" | "voice_render" | "other";

export type ReaderInteractionLedgerEntry = {
  id: string;
  readerId: string;
  sessionId: string | null;
  entryType: ReaderInteractionLedgerEntryKind;
  unitCount: number;
  estimatedCostUnits: number;
  metadataJson: Prisma.JsonValue | null;
  createdAt: Date;
};

/** Aggregates for a single conversation session’s ledger slice. */
export type ReaderInteractionLedgerSessionSummary = {
  sessionId: string;
  entryCount: number;
  totalUnitCount: number;
  totalEstimatedCostUnits: number;
  byEntryType: Partial<
    Record<
      ReaderInteractionLedgerEntryKind,
      { entryCount: number; unitCount: number; estimatedCostUnits: number }
    >
  >;
};
