/**
 * P4-A — Deterministic entitlement service (no payment provider assumptions).
 */
import type { Prisma, ReaderEntitlement as ReaderEntitlementRow } from "@prisma/client";

import type {
  ReaderEntitlement,
  ReaderEntitlementFeatureFlags,
  ReaderEntitlementPlanType,
} from "@/lib/domain/reader-entitlement";
import { READER_ENTITLEMENT_PLAN_TYPES } from "@/lib/domain/reader-entitlement";
import { prisma } from "@/lib/prisma";

const DEFAULT_PLAN: ReaderEntitlementPlanType = "free";

const PLAN_MONTHLY_ALLOWANCE: Record<ReaderEntitlementPlanType, number> = {
  free: 3000,
  standard: 12000,
  premium: 60000,
  admin: 150000,
  internal: 250000,
};

const PLAN_FEATURE_FLAGS: Record<ReaderEntitlementPlanType, ReaderEntitlementFeatureFlags> = {
  free: {
    cockpit_access: true,
    voice_playback: false,
    premium_voice: false,
    author_mode: false,
    admin_tools: false,
  },
  standard: {
    cockpit_access: true,
    voice_playback: true,
    premium_voice: false,
    author_mode: false,
    admin_tools: false,
  },
  premium: {
    cockpit_access: true,
    voice_playback: true,
    premium_voice: true,
    author_mode: false,
    admin_tools: false,
  },
  admin: {
    cockpit_access: true,
    voice_playback: true,
    premium_voice: true,
    author_mode: true,
    admin_tools: true,
  },
  internal: {
    cockpit_access: true,
    voice_playback: true,
    premium_voice: true,
    author_mode: true,
    admin_tools: true,
    internal_debug_tools: true,
  },
};

function parsePlanType(raw: string | undefined): ReaderEntitlementPlanType {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return DEFAULT_PLAN;
  if (READER_ENTITLEMENT_PLAN_TYPES.includes(normalized as ReaderEntitlementPlanType)) {
    return normalized as ReaderEntitlementPlanType;
  }
  return DEFAULT_PLAN;
}

function requireReaderId(readerId: string): string {
  const id = readerId.trim();
  if (!id) throw new Error("[reader-entitlement] readerId is required.");
  return id;
}

function normalizeAllowance(input: number): number {
  const floor = Math.floor(input);
  if (!Number.isFinite(floor) || floor < 0) return 0;
  return floor;
}

function addMonthsUtc(input: Date, months: number): Date {
  return new Date(
    Date.UTC(
      input.getUTCFullYear(),
      input.getUTCMonth() + months,
      input.getUTCDate(),
      input.getUTCHours(),
      input.getUTCMinutes(),
      input.getUTCSeconds(),
      input.getUTCMilliseconds()
    )
  );
}

function normalizeFeatureFlags(json: Prisma.JsonValue | null): ReaderEntitlementFeatureFlags {
  const defaults = {} as ReaderEntitlementFeatureFlags;
  if (json == null || typeof json !== "object" || Array.isArray(json)) return defaults;
  const out: ReaderEntitlementFeatureFlags = {};
  for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
    if (!key.trim()) continue;
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

function toDomain(row: ReaderEntitlementRow): ReaderEntitlement {
  return {
    id: row.id,
    readerId: row.readerId,
    planType: row.planType as ReaderEntitlementPlanType,
    monthlyUnitAllowance: row.monthlyUnitAllowance,
    remainingUnitBalance: row.remainingUnitBalance,
    featureFlagsJson: row.featureFlagsJson,
    entitlementStartAt: row.entitlementStartAt,
    entitlementEndAt: row.entitlementEndAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getEffectiveUnitAllowance(planType: ReaderEntitlementPlanType): number {
  return PLAN_MONTHLY_ALLOWANCE[planType];
}

export function getDefaultFeatureFlagsForPlan(
  planType: ReaderEntitlementPlanType
): ReaderEntitlementFeatureFlags {
  return { ...PLAN_FEATURE_FLAGS[planType] };
}

function resolveDefaultPlanType(): ReaderEntitlementPlanType {
  return parsePlanType(process.env.READER_ENTITLEMENT_DEFAULT_PLAN);
}

type Cycle = { startAt: Date; endAt: Date };

function buildCycleFromStart(startAt: Date): Cycle {
  return { startAt, endAt: addMonthsUtc(startAt, 1) };
}

function computeCurrentCycle(row: ReaderEntitlement, now: Date): { cycle: Cycle; shouldReset: boolean } {
  const initialEnd = row.entitlementEndAt ?? buildCycleFromStart(row.entitlementStartAt).endAt;
  if (now < initialEnd) {
    return {
      cycle: {
        startAt: row.entitlementStartAt,
        endAt: initialEnd,
      },
      shouldReset: false,
    };
  }

  let nextStart = row.entitlementStartAt;
  let nextEnd = initialEnd;
  while (now >= nextEnd) {
    nextStart = nextEnd;
    nextEnd = addMonthsUtc(nextStart, 1);
  }
  return {
    cycle: {
      startAt: nextStart,
      endAt: nextEnd,
    },
    shouldReset: true,
  };
}

export async function getOrCreateReaderEntitlement(readerId: string): Promise<ReaderEntitlement> {
  const id = requireReaderId(readerId);
  const planType = resolveDefaultPlanType();
  const monthlyAllowance = getEffectiveUnitAllowance(planType);
  const now = new Date();
  const cycle = buildCycleFromStart(now);
  const row = await prisma.readerEntitlement.upsert({
    where: { readerId: id },
    create: {
      readerId: id,
      planType,
      monthlyUnitAllowance: monthlyAllowance,
      remainingUnitBalance: monthlyAllowance,
      featureFlagsJson: getDefaultFeatureFlagsForPlan(planType) as Prisma.InputJsonValue,
      entitlementStartAt: cycle.startAt,
      entitlementEndAt: cycle.endAt,
    },
    update: {},
  });
  return toDomain(row);
}

export async function refreshMonthlyAllowanceIfNeeded(
  readerId: string
): Promise<{ entitlement: ReaderEntitlement; didReset: boolean }> {
  const current = await getOrCreateReaderEntitlement(readerId);
  const now = new Date();
  const { cycle, shouldReset } = computeCurrentCycle(current, now);
  if (!shouldReset) return { entitlement: current, didReset: false };

  const allowance = normalizeAllowance(current.monthlyUnitAllowance);
  const row = await prisma.readerEntitlement.update({
    where: { readerId: current.readerId },
    data: {
      monthlyUnitAllowance: allowance,
      remainingUnitBalance: allowance,
      entitlementStartAt: cycle.startAt,
      entitlementEndAt: cycle.endAt,
    },
  });
  return { entitlement: toDomain(row), didReset: true };
}

export async function canUseFeature(readerId: string, featureKey: string): Promise<boolean> {
  const key = featureKey.trim();
  if (!key) throw new Error("[reader-entitlement] featureKey is required.");
  const { entitlement } = await refreshMonthlyAllowanceIfNeeded(readerId);
  const defaults = getDefaultFeatureFlagsForPlan(entitlement.planType);
  const explicit = normalizeFeatureFlags(entitlement.featureFlagsJson);
  if (key in explicit) return explicit[key] === true;
  return defaults[key] === true;
}

export function toDegradedInteractionTier(planType: ReaderEntitlementPlanType): "free" | "standard" | "premium" | "admin" {
  if (planType === "internal") return "admin";
  return planType;
}

