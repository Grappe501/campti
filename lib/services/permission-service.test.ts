/**
 * P4-E permission service tests.
 * Run: npx tsx --test lib/services/permission-service.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/prisma";
import {
  canAccessAdminTools,
  canAccessAuthorMode,
  canUsePremiumFeatures,
  resolveReaderRole,
} from "@/lib/services/permission-service";

const READER = "p4e-permission-test-reader";

describe("permission-service static role gates", () => {
  it("enforces role boundaries deterministically", () => {
    assert.equal(canAccessAuthorMode("reader"), false);
    assert.equal(canAccessAuthorMode("author"), true);
    assert.equal(canAccessAdminTools("author"), false);
    assert.equal(canAccessAdminTools("admin"), true);
    assert.equal(canUsePremiumFeatures("subscriber"), true);
    assert.equal(canUsePremiumFeatures("reader"), false);
  });
});

describe("permission-service entitlement mapping", () => {
  let enabled = false;

  before(async () => {
    enabled = false;
    try {
      await prisma.$connect();
      await prisma.readerEntitlement.deleteMany({ where: { readerId: READER } });
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    if (!enabled) return;
    try {
      await prisma.readerEntitlement.deleteMany({ where: { readerId: READER } });
    } catch {
      /* best-effort */
    }
  });

  it("maps entitlement plan to runtime role", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and migrated schema");
      return;
    }
    await prisma.readerEntitlement.create({
      data: {
        readerId: READER,
        planType: "admin",
        monthlyUnitAllowance: 150000,
        remainingUnitBalance: 150000,
      },
    });
    const role = await resolveReaderRole(READER);
    assert.equal(role, "admin");
  });
});

