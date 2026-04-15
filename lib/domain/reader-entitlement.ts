/**
 * P4-A — Product/account entitlement envelope for usage and feature access.
 *
 * This domain is product truth only (plans, balances, feature toggles).
 * It must never mutate canonical story truth or character cognition.
 */
import type { Prisma } from "@prisma/client";

export const READER_ENTITLEMENT_PLAN_TYPES = [
  "free",
  "standard",
  "premium",
  "admin",
  "internal",
] as const;

export type ReaderEntitlementPlanType = (typeof READER_ENTITLEMENT_PLAN_TYPES)[number];

export type ReaderEntitlementFeatureFlags = Record<string, boolean>;

export type ReaderEntitlement = {
  id: string;
  readerId: string;
  planType: ReaderEntitlementPlanType;
  monthlyUnitAllowance: number;
  remainingUnitBalance: number;
  featureFlagsJson: Prisma.JsonValue | null;
  entitlementStartAt: Date;
  entitlementEndAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

