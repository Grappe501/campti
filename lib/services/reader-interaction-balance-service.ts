/**
 * P3-H — Reader interaction unit balance: generic units (not currency), enforced before paid turns.
 */

import { Prisma } from "@prisma/client";

import type { CharacterPresentationMode } from "@/lib/domain/translation-presentation";
import type { ReaderInteractionLedgerEntryKind } from "@/lib/domain/reader-interaction-ledger";
import { estimateVoiceRenderCostUnits } from "@/lib/services/interaction-cost-estimation-service";
import { refreshMonthlyAllowanceIfNeeded } from "@/lib/services/reader-entitlement-service";
import {
  evaluateProviderCostGovernance,
  recordProviderCostUsage,
} from "@/lib/services/provider-cost-governance-service";
import { prisma } from "@/lib/prisma";

export type ReaderInteractionBalanceUnavailableReason =
  | "schema_missing"
  | "provider_failure"
  | "unknown_runtime_unavailable";

function isPrismaKnownRequestError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return typeof error === "object" && error !== null && "code" in error;
}

function resolveBalanceUnavailableReason(
  error: unknown
): ReaderInteractionBalanceUnavailableReason | null {
  const msg = error instanceof Error ? error.message : String(error);
  if (/ReaderInteractionBalance|public\.ReaderInteractionBalance|does not exist/i.test(msg)) {
    return "schema_missing";
  }
  if (isPrismaKnownRequestError(error) && error.code === "P2021") {
    return "schema_missing";
  }
  return null;
}

function throwUnavailableBalanceError(
  reason: ReaderInteractionBalanceUnavailableReason,
  original: unknown
): never {
  const detail = original instanceof Error ? original.message : String(original);
  throw new Error(
    `[reader-interaction-balance:unavailable] reason=${reason}; detail=${detail}`
  );
}

export function isReaderInteractionBalanceUnavailableError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("[reader-interaction-balance:unavailable]")
  );
}

export function getReaderInteractionBalanceUnavailableReason(
  error: unknown
): ReaderInteractionBalanceUnavailableReason | null {
  if (!(error instanceof Error)) return null;
  const m = error.message.match(/reason=([a-z_]+)/i);
  if (!m?.[1]) return null;
  if (m[1] === "schema_missing" || m[1] === "unknown_runtime_unavailable") {
    return m[1];
  }
  if (m[1] === "provider_failure") {
    return m[1];
  }
  return null;
}
async function ensureBalanceEnvelope(readerId: string): Promise<{
  availableUnits: number;
  entitlementRemainingUnits: number;
}> {
  const refreshed = await refreshMonthlyAllowanceIfNeeded(readerId);
  const entitlementRemainingUnits = refreshed.entitlement.remainingUnitBalance;
  const row = await prisma.readerInteractionBalance.upsert({
    where: { readerId },
    create: { readerId, availableUnits: entitlementRemainingUnits },
    update: refreshed.didReset ? { availableUnits: entitlementRemainingUnits } : {},
  });
  return {
    availableUnits: row.availableUnits,
    entitlementRemainingUnits,
  };
}

export async function getOrCreateReaderBalance(readerId: string): Promise<{ availableUnits: number }> {
  const id = readerId.trim();
  if (!id) throw new Error("[reader-interaction-balance] readerId is required.");
  try {
    const envelope = await ensureBalanceEnvelope(id);
    return { availableUnits: envelope.availableUnits };
  } catch (error) {
    const reason = resolveBalanceUnavailableReason(error);
    if (reason) {
      throwUnavailableBalanceError(reason, error);
    }
    throw error;
  }
}

export type DebitReaderInteractionUnitsParams = {
  readerId: string;
  sessionId: string | null;
  entryType: ReaderInteractionLedgerEntryKind;
  /** Same scale as {@link ReaderInteractionLedgerEntry.estimatedCostUnits}. */
  estimatedCostUnits: number;
  unitCount: number;
  metadataJson?: Prisma.InputJsonValue | null;
};

/**
 * Atomically debits balance (when sufficient) and appends a ledger row. Throws when insufficient.
 */
export async function debitReaderInteractionUnits(
  params: DebitReaderInteractionUnitsParams
): Promise<{ remainingUnits: number }> {
  const readerId = params.readerId.trim();
  if (!readerId) throw new Error("[reader-interaction-balance] readerId is required.");
  const cost = Math.floor(params.estimatedCostUnits);
  const units = Math.floor(params.unitCount);
  if (!Number.isFinite(cost) || cost < 0) throw new Error("[reader-interaction-balance] estimatedCostUnits invalid.");
  if (!Number.isFinite(units) || units < 0) throw new Error("[reader-interaction-balance] unitCount invalid.");

  const sid = params.sessionId?.trim() ? params.sessionId.trim() : null;
  const costDecision = evaluateProviderCostGovernance({
    readerId,
    sessionId: sid,
    projectedTextCostUnits: params.entryType === "voice_render" ? 0 : cost,
    projectedVoiceCostUnits: params.entryType === "voice_render" ? cost : 0,
  });
  if (!costDecision.allowed) {
    throw new Error(
      `[reader-interaction-balance] Provider cost governance denied debit (${costDecision.denyReason ?? "unknown"}).`
    );
  }

  try {
    await ensureBalanceEnvelope(readerId);
    return await prisma.$transaction(async (tx) => {
      await tx.readerInteractionBalance.upsert({
        where: { readerId },
        create: { readerId, availableUnits: 0 },
        update: {},
      });

      if (sid) {
        const session = await tx.characterConversationSession.findUnique({
          where: { id: sid },
          select: { id: true, readerId: true },
        });
        if (!session) {
          throw new Error(`[reader-interaction-balance] Session not found: ${sid}`);
        }
        if (session.readerId !== readerId) {
          throw new Error("[reader-interaction-balance] sessionId does not belong to this readerId.");
        }
      }

      const [row, entitlement] = await Promise.all([
        tx.readerInteractionBalance.findUniqueOrThrow({
          where: { readerId },
        }),
        tx.readerEntitlement.findUniqueOrThrow({
          where: { readerId },
          select: { remainingUnitBalance: true },
        }),
      ]);

      const effectiveAvailable = Math.min(row.availableUnits, entitlement.remainingUnitBalance);
      if (effectiveAvailable < cost) {
        throw new Error(
          `[reader-interaction-balance] Insufficient units (have ${effectiveAvailable}, need ${cost}).`
        );
      }

      const updated = await tx.readerInteractionBalance.update({
        where: { readerId },
        data: { availableUnits: { decrement: cost } },
      });
      await tx.readerEntitlement.update({
        where: { readerId },
        data: { remainingUnitBalance: { decrement: cost } },
      });

      await tx.readerInteractionLedgerEntry.create({
        data: {
          readerId,
          sessionId: sid,
          entryType: params.entryType,
          unitCount: units,
          estimatedCostUnits: cost,
          metadataJson: params.metadataJson ?? undefined,
        },
      });
      recordProviderCostUsage({
        readerId,
        sessionId: sid,
        costUnits: cost,
        category: params.entryType === "voice_render" ? "voice" : "text",
      });

      return { remainingUnits: updated.availableUnits };
    });
  } catch (error) {
    const reason = resolveBalanceUnavailableReason(error);
    if (reason) {
      throwUnavailableBalanceError(reason, error);
    }
    throw error;
  }
}

/** Voice render debit using the same unit scale as text turns (P3-H + P3-E). */
export async function debitVoiceRenderInteractionUnits(params: {
  readerId: string;
  sessionId: string | null;
  voicePresentationPayload: CharacterPresentationMode;
  metadataJson?: Prisma.InputJsonValue | null;
}): Promise<{ remainingUnits: number }> {
  const cost = estimateVoiceRenderCostUnits(params.voicePresentationPayload);
  return debitReaderInteractionUnits({
    readerId: params.readerId,
    sessionId: params.sessionId,
    entryType: "voice_render",
    estimatedCostUnits: cost,
    unitCount: cost,
    metadataJson: params.metadataJson ?? { kind: "voice_render" },
  });
}
