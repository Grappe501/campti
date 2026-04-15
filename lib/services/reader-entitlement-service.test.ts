/**
 * P4-A reader entitlement service tests.
 * Run: npx tsx --test lib/services/reader-entitlement-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import { classifyRuntimeDependencyFailure } from "@/lib/services/runtime-dependency-guard";
import {
  canUseFeature,
  getEffectiveUnitAllowance,
  getOrCreateReaderEntitlement,
  refreshMonthlyAllowanceIfNeeded,
} from "@/lib/services/reader-entitlement-service";

const READER = "p4a-reader-entitlement-test-reader";

describe("reader-entitlement-service plan limits", () => {
  it("returns deterministic allowance by plan", () => {
    assert.equal(getEffectiveUnitAllowance("free"), 3000);
    assert.equal(getEffectiveUnitAllowance("standard"), 12000);
    assert.equal(getEffectiveUnitAllowance("premium"), 60000);
    assert.equal(getEffectiveUnitAllowance("admin"), 150000);
    assert.equal(getEffectiveUnitAllowance("internal"), 250000);
  });
});

describe("reader-entitlement-service integration", () => {
  let enabled = false;
  let skipReason = "integration DB dependencies unavailable";

  before(async () => {
    enabled = false;
    skipReason = "integration DB dependencies unavailable";
    try {
      await prisma.$connect();
      await prisma.readerEntitlement.deleteMany({
        where: { readerId: READER },
      });
      await prisma.readerInteractionBalance.deleteMany({
        where: { readerId: READER },
      });
      enabled = true;
    } catch (error) {
      const classified = classifyRuntimeDependencyFailure(error);
      if (classified.kind !== "schema_dependency_missing") {
        throw error;
      }
      enabled = false;
      skipReason = classified.message;
    }
  });

  after(async () => {
    if (!enabled) return;
    try {
      await prisma.readerInteractionBalance.deleteMany({
        where: { readerId: READER },
      });
      await prisma.readerEntitlement.deleteMany({
        where: { readerId: READER },
      });
    } catch (error) {
      const classified = classifyRuntimeDependencyFailure(error);
      if (classified.kind !== "schema_dependency_missing") {
        throw error;
      }
    }
  });

  it("creates entitlement with deterministic defaults", async (t) => {
    if (!enabled) {
      t.skip(`skip: ${skipReason}`);
      return;
    }
    const priorPlan = process.env.READER_ENTITLEMENT_DEFAULT_PLAN;
    process.env.READER_ENTITLEMENT_DEFAULT_PLAN = "standard";
    try {
      const row = await getOrCreateReaderEntitlement(READER);
      assert.equal(row.readerId, READER);
      assert.equal(row.planType, "standard");
      assert.equal(row.monthlyUnitAllowance, 12000);
      assert.equal(row.remainingUnitBalance, 12000);
      assert.ok(row.entitlementEndAt instanceof Date);
    } finally {
      process.env.READER_ENTITLEMENT_DEFAULT_PLAN = priorPlan;
    }
  });

  it("refreshes monthly allowance when entitlement window has elapsed", async (t) => {
    if (!enabled) {
      t.skip(`skip: ${skipReason}`);
      return;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    await prisma.readerEntitlement.upsert({
      where: { readerId: READER },
      create: {
        readerId: READER,
        planType: "premium",
        monthlyUnitAllowance: 60000,
        remainingUnitBalance: 5,
        featureFlagsJson: { premium_voice: true },
        entitlementStartAt: windowStart,
        entitlementEndAt: windowEnd,
      },
      update: {
        planType: "premium",
        monthlyUnitAllowance: 60000,
        remainingUnitBalance: 5,
        entitlementStartAt: windowStart,
        entitlementEndAt: windowEnd,
      },
    });

    const refreshed = await refreshMonthlyAllowanceIfNeeded(READER);
    assert.equal(refreshed.didReset, true);
    assert.equal(refreshed.entitlement.remainingUnitBalance, 60000);
    assert.ok(refreshed.entitlement.entitlementEndAt instanceof Date);
    assert.ok(refreshed.entitlement.entitlementStartAt > windowStart);
  });

  it("resolves feature access by entitlement flags", async (t) => {
    if (!enabled) {
      t.skip(`skip: ${skipReason}`);
      return;
    }
    await prisma.readerEntitlement.update({
      where: { readerId: READER },
      data: {
        featureFlagsJson: {
          premium_voice: false,
          cockpit_access: true,
        },
      },
    });
    assert.equal(await canUseFeature(READER, "cockpit_access"), true);
    assert.equal(await canUseFeature(READER, "premium_voice"), false);
  });
});

