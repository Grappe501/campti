/**
 * P4-C — Provider cost governance for text and voice usage.
 * Keeps deterministic ceilings and explicit fallback guidance.
 */
type CostCategory = "text" | "voice";

export type ProviderCostGovernanceDecision = {
  allowed: boolean;
  degradeToFallback: boolean;
  denyReason: string | null;
};

export type ProviderCostUsageSnapshot = {
  sessionCostUnits: number;
  readerDailyCostUnits: number;
  dayCostUnits: number;
  voiceCostUnits: number;
  textCostUnits: number;
};

const sessionCostMap = new Map<string, number>();
const readerDailyCostMap = new Map<string, number>();
const dayCostMap = new Map<string, number>();
const voiceDailyCostMap = new Map<string, number>();
const textDailyCostMap = new Map<string, number>();

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function parseLimit(raw: string | undefined, fallback: number): number {
  const n = raw ? parseInt(raw, 10) : fallback;
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

function limits() {
  return {
    maxSessionCostUnits: parseLimit(process.env.PROVIDER_COST_MAX_SESSION_UNITS, 45_000),
    maxReaderDailyCostUnits: parseLimit(process.env.PROVIDER_COST_MAX_READER_DAILY_UNITS, 120_000),
    maxDayCostUnits: parseLimit(process.env.PROVIDER_COST_MAX_DAY_UNITS, 800_000),
    maxVoiceDailyCostUnits: parseLimit(process.env.PROVIDER_COST_MAX_VOICE_DAILY_UNITS, 220_000),
    maxTextDailyCostUnits: parseLimit(process.env.PROVIDER_COST_MAX_TEXT_DAILY_UNITS, 700_000),
  };
}

function ensureKey(input: string | null | undefined): string | null {
  const v = input?.trim();
  return v ? v : null;
}

export function inspectProviderCostUsage(params: {
  readerId: string;
  sessionId?: string | null;
  now?: Date;
}): ProviderCostUsageSnapshot {
  const now = params.now ?? new Date();
  const d = dayKey(now);
  const readerKey = `${params.readerId.trim()}::${d}`;
  const sessionKey = ensureKey(params.sessionId);
  return {
    sessionCostUnits: sessionKey ? sessionCostMap.get(sessionKey) ?? 0 : 0,
    readerDailyCostUnits: readerDailyCostMap.get(readerKey) ?? 0,
    dayCostUnits: dayCostMap.get(d) ?? 0,
    voiceCostUnits: voiceDailyCostMap.get(d) ?? 0,
    textCostUnits: textDailyCostMap.get(d) ?? 0,
  };
}

export function evaluateProviderCostGovernance(params: {
  readerId: string;
  sessionId?: string | null;
  projectedTextCostUnits?: number;
  projectedVoiceCostUnits?: number;
  now?: Date;
}): ProviderCostGovernanceDecision {
  const readerId = params.readerId.trim();
  if (!readerId) {
    return { allowed: false, degradeToFallback: true, denyReason: "missing_reader_id" };
  }
  const now = params.now ?? new Date();
  const projectedText = Math.max(0, Math.floor(params.projectedTextCostUnits ?? 0));
  const projectedVoice = Math.max(0, Math.floor(params.projectedVoiceCostUnits ?? 0));
  const projectedTotal = projectedText + projectedVoice;
  const usage = inspectProviderCostUsage({
    readerId,
    sessionId: params.sessionId,
    now,
  });
  const cfg = limits();

  if (params.sessionId && usage.sessionCostUnits + projectedTotal > cfg.maxSessionCostUnits) {
    return { allowed: false, degradeToFallback: true, denyReason: "max_session_cost_exceeded" };
  }
  if (usage.readerDailyCostUnits + projectedTotal > cfg.maxReaderDailyCostUnits) {
    return { allowed: false, degradeToFallback: true, denyReason: "max_reader_daily_cost_exceeded" };
  }
  if (usage.dayCostUnits + projectedTotal > cfg.maxDayCostUnits) {
    return { allowed: false, degradeToFallback: true, denyReason: "max_day_cost_exceeded" };
  }
  if (usage.voiceCostUnits + projectedVoice > cfg.maxVoiceDailyCostUnits) {
    return { allowed: false, degradeToFallback: true, denyReason: "max_voice_daily_cost_exceeded" };
  }
  if (usage.textCostUnits + projectedText > cfg.maxTextDailyCostUnits) {
    return { allowed: false, degradeToFallback: true, denyReason: "max_text_daily_cost_exceeded" };
  }
  return { allowed: true, degradeToFallback: false, denyReason: null };
}

export function recordProviderCostUsage(params: {
  readerId: string;
  sessionId?: string | null;
  costUnits: number;
  category: CostCategory;
  now?: Date;
}): ProviderCostUsageSnapshot {
  const readerId = params.readerId.trim();
  if (!readerId) {
    throw new Error("[provider-cost-governance] readerId is required.");
  }
  const costUnits = Math.max(0, Math.floor(params.costUnits));
  const now = params.now ?? new Date();
  const d = dayKey(now);
  const readerKey = `${readerId}::${d}`;
  const sessionKey = ensureKey(params.sessionId);

  if (sessionKey) {
    sessionCostMap.set(sessionKey, (sessionCostMap.get(sessionKey) ?? 0) + costUnits);
  }
  readerDailyCostMap.set(readerKey, (readerDailyCostMap.get(readerKey) ?? 0) + costUnits);
  dayCostMap.set(d, (dayCostMap.get(d) ?? 0) + costUnits);
  if (params.category === "voice") {
    voiceDailyCostMap.set(d, (voiceDailyCostMap.get(d) ?? 0) + costUnits);
  } else {
    textDailyCostMap.set(d, (textDailyCostMap.get(d) ?? 0) + costUnits);
  }
  return inspectProviderCostUsage({ readerId, sessionId: params.sessionId, now });
}

export function resetProviderCostGovernanceStateForTests(): void {
  sessionCostMap.clear();
  readerDailyCostMap.clear();
  dayCostMap.clear();
  voiceDailyCostMap.clear();
  textDailyCostMap.clear();
}

