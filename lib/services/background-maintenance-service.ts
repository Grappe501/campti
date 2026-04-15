/**
 * P4-H — Lightweight background maintenance tasks.
 */
import { prisma } from "@/lib/prisma";
import { getEngagementAggregateForDate } from "@/lib/services/engagement-analytics-service";

function daysAgo(days: number): Date {
  const ms = Math.max(0, Math.floor(days)) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}

export async function cleanupEndedSessions(params?: { olderThanDays?: number }): Promise<number> {
  const olderThanDays = params?.olderThanDays ?? 30;
  const threshold = daysAgo(olderThanDays);
  const out = await prisma.characterConversationSession.deleteMany({
    where: {
      status: "ENDED",
      endedAt: { lt: threshold },
    },
  });
  return out.count;
}

export async function compactLedgerEntries(params?: {
  olderThanDays?: number;
  readerId?: string;
}): Promise<{ deletedCount: number; retainedCount: number }> {
  const olderThanDays = params?.olderThanDays ?? 14;
  const threshold = daysAgo(olderThanDays);
  const deleted = await prisma.readerInteractionLedgerEntry.deleteMany({
    where: {
      createdAt: { lt: threshold },
      ...(params?.readerId?.trim() ? { readerId: params.readerId.trim() } : {}),
    },
  });
  const retainedCount = await prisma.readerInteractionLedgerEntry.count({
    where: {
      ...(params?.readerId?.trim() ? { readerId: params.readerId.trim() } : {}),
    },
  });
  return {
    deletedCount: deleted.count,
    retainedCount,
  };
}

export async function aggregateEngagementForDate(date: string): Promise<{
  date: string;
  sessionsStarted: number;
  sessionsEnded: number;
  turnsSubmitted: number;
}> {
  const aggregate = getEngagementAggregateForDate(date);
  return {
    date,
    sessionsStarted: aggregate.sessionsStarted,
    sessionsEnded: aggregate.sessionsEnded,
    turnsSubmitted: aggregate.turnsSubmitted,
  };
}

