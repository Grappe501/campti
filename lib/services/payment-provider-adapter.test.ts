/**
 * P4-B payment provider adapter tests.
 * Run: npx tsx --test lib/services/payment-provider-adapter.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import type { PaymentEvent } from "@/lib/domain/payment-provider";
import { prisma } from "@/lib/prisma";
import {
  applyPaymentEventToEntitlement,
  createPurchaseIntent,
  handlePaymentWebhookEvent,
  resetPaymentWebhookEventMemoryForTests,
} from "@/lib/services/payment-provider-adapter";

const READER = "p4b-payment-adapter-test-reader";

describe("payment-provider-adapter", () => {
  let enabled = false;

  before(async () => {
    enabled = false;
    resetPaymentWebhookEventMemoryForTests();
    try {
      await prisma.$connect();
      await prisma.readerEntitlement.deleteMany({ where: { readerId: READER } });
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  after(async () => {
    resetPaymentWebhookEventMemoryForTests();
    if (!enabled) return;
    try {
      await prisma.readerEntitlement.deleteMany({ where: { readerId: READER } });
    } catch {
      /* best-effort */
    }
  });

  it("creates deterministic purchase intents in stub mode", () => {
    const out = createPurchaseIntent({
      readerId: READER,
      unitCount: 3000,
    });
    assert.equal(out.readerId, READER);
    assert.equal(out.provider, "stub");
    assert.equal(out.status, "created");
    assert.equal(out.unitCount, 3000);
    assert.ok(out.intentId.startsWith("intent_"));
  });

  it("applies purchase_units events to entitlement balances", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and migrated schema");
      return;
    }
    const event: PaymentEvent = {
      eventId: "evt_purchase_units_001",
      eventType: "purchase_units",
      readerId: READER,
      provider: "stub",
      occurredAtIso: new Date().toISOString(),
      purchasedUnitCount: 1500,
    };
    const updated = await applyPaymentEventToEntitlement(event);
    assert.equal(updated, true);
    const row = await prisma.readerEntitlement.findUnique({
      where: { readerId: READER },
      select: { remainingUnitBalance: true },
    });
    assert.ok(row);
    assert.ok((row?.remainingUnitBalance ?? 0) >= 1500);
  });

  it("updates plan allowances for subscription events", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and migrated schema");
      return;
    }
    const event: PaymentEvent = {
      eventId: "evt_subscription_started_001",
      eventType: "subscription_started",
      readerId: READER,
      provider: "stub",
      occurredAtIso: new Date().toISOString(),
      planType: "premium",
    };
    await applyPaymentEventToEntitlement(event);
    const row = await prisma.readerEntitlement.findUnique({
      where: { readerId: READER },
      select: {
        planType: true,
        monthlyUnitAllowance: true,
      },
    });
    assert.equal(row?.planType, "premium");
    assert.equal(row?.monthlyUnitAllowance, 60000);
  });

  it("deduplicates repeated webhook event IDs", async () => {
    if (!enabled) {
      assert.ok(true, "skip: need DATABASE_URL and migrated schema");
      return;
    }
    const event: PaymentEvent = {
      eventId: "evt_duplicate_001",
      eventType: "subscription_renewed",
      readerId: READER,
      provider: "stub",
      occurredAtIso: new Date().toISOString(),
      planType: "standard",
    };
    const first = await handlePaymentWebhookEvent(event);
    const second = await handlePaymentWebhookEvent(event);
    assert.equal(first.duplicate, false);
    assert.equal(second.duplicate, true);
  });
});

