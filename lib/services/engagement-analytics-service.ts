/**
 * P4-F — Engagement analytics aggregation (in-memory deterministic rollups).
 */
import type {
  EngagementAnalyticsAggregate,
  EngagementDropOffPoint,
} from "@/lib/domain/engagement-analytics";

type SessionTracker = {
  readerId: string;
  characterId: string;
  startedAtMs: number;
  turns: number;
  voiceUsageCount: number;
};

type AggregateMutable = {
  sessionsStarted: number;
  sessionsEnded: number;
  turnsSubmitted: number;
  characterIds: Set<string>;
  voiceUsageCount: number;
  totalSessionLengthSeconds: number;
  dropOffCounts: Partial<Record<EngagementDropOffPoint, number>>;
};

const sessionTrackers = new Map<string, SessionTracker>();
const aggregateByDate = new Map<string, AggregateMutable>();

function dateKey(atIso: string): string {
  return atIso.slice(0, 10);
}

function ensureAggregate(key: string): AggregateMutable {
  const existing = aggregateByDate.get(key);
  if (existing) return existing;
  const created: AggregateMutable = {
    sessionsStarted: 0,
    sessionsEnded: 0,
    turnsSubmitted: 0,
    characterIds: new Set<string>(),
    voiceUsageCount: 0,
    totalSessionLengthSeconds: 0,
    dropOffCounts: {},
  };
  aggregateByDate.set(key, created);
  return created;
}

export function recordSessionStarted(params: {
  sessionId: string;
  readerId: string;
  characterId: string;
  atIso?: string;
}): void {
  const atIso = params.atIso ?? new Date().toISOString();
  const key = dateKey(atIso);
  const agg = ensureAggregate(key);
  agg.sessionsStarted += 1;
  agg.characterIds.add(params.characterId);
  sessionTrackers.set(params.sessionId, {
    readerId: params.readerId,
    characterId: params.characterId,
    startedAtMs: Date.parse(atIso),
    turns: 0,
    voiceUsageCount: 0,
  });
}

export function recordTurnSubmitted(params: {
  sessionId: string;
  atIso?: string;
}): void {
  const atIso = params.atIso ?? new Date().toISOString();
  const key = dateKey(atIso);
  const agg = ensureAggregate(key);
  agg.turnsSubmitted += 1;
  const tracker = sessionTrackers.get(params.sessionId);
  if (tracker) tracker.turns += 1;
}

export function recordVoiceUsage(params: { sessionId: string; atIso?: string }): void {
  const atIso = params.atIso ?? new Date().toISOString();
  const key = dateKey(atIso);
  const agg = ensureAggregate(key);
  agg.voiceUsageCount += 1;
  const tracker = sessionTrackers.get(params.sessionId);
  if (tracker) tracker.voiceUsageCount += 1;
}

export function recordSessionEnded(params: {
  sessionId: string;
  dropOffPoint: EngagementDropOffPoint;
  atIso?: string;
}): void {
  const atIso = params.atIso ?? new Date().toISOString();
  const key = dateKey(atIso);
  const agg = ensureAggregate(key);
  agg.sessionsEnded += 1;
  agg.dropOffCounts[params.dropOffPoint] = (agg.dropOffCounts[params.dropOffPoint] ?? 0) + 1;

  const tracker = sessionTrackers.get(params.sessionId);
  if (tracker) {
    const elapsedMs = Math.max(0, Date.parse(atIso) - tracker.startedAtMs);
    agg.totalSessionLengthSeconds += Math.floor(elapsedMs / 1000);
    sessionTrackers.delete(params.sessionId);
  }
}

export function getEngagementAggregateForDate(date: string): EngagementAnalyticsAggregate {
  const agg = ensureAggregate(date);
  return {
    dateKey: date,
    sessionsStarted: agg.sessionsStarted,
    sessionsEnded: agg.sessionsEnded,
    turnsSubmitted: agg.turnsSubmitted,
    uniqueCharactersInteracted: agg.characterIds.size,
    voiceUsageCount: agg.voiceUsageCount,
    averageSessionLengthSeconds:
      agg.sessionsEnded > 0 ? Math.floor(agg.totalSessionLengthSeconds / agg.sessionsEnded) : 0,
    dropOffCounts: { ...agg.dropOffCounts },
  };
}

export function resetEngagementAnalyticsForTests(): void {
  sessionTrackers.clear();
  aggregateByDate.clear();
}

