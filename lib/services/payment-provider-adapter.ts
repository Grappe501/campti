/**
 * P4-B — Payment provider adapter boundary.
 * Provider-specific HTTP/webhook details stay outside domain services.
 */
import { Prisma } from "@prisma/client";

import type {
  CreatePurchaseIntentInput,
  PaymentEvent,
  PaymentWebhookResult,
  PurchaseIntent,
} from "@/lib/domain/payment-provider";
import { getDefaultFeatureFlagsForPlan, getEffectiveUnitAllowance } from "@/lib/services/reader-entitlement-service";
import { prisma } from "@/lib/prisma";

const handledEventIds = new Set<string>();

function requireNonEmpty(label: string, input: string): string {
  const out = input.trim();
  if (!out) throw new Error(`[payment-provider-adapter] ${label} is required.`);
  return out;
}

export function createPurchaseIntent(input: CreatePurchaseIntentInput): PurchaseIntent {
  const readerId = requireNonEmpty("readerId", input.readerId);
  const unitCount = Math.floor(input.unitCount);
  if (!Number.isFinite(unitCount) || unitCount <= 0) {
    throw new Error("[payment-provider-adapter] unitCount must be a positive integer.");
  }
  const provider = input.provider ?? "stub";
  return {
    intentId: `intent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    provider,
    readerId,
    unitCount,
    currencyCode: input.currencyCode?.trim().toUpperCase() || "USD",
    amountMinor: Math.max(0, Math.floor(input.amountMinor ?? unitCount)),
    status: "created",
    createdAtIso: new Date().toISOString(),
    metadataJson: input.metadataJson ?? null,
  };
}

export async function applyPaymentEventToEntitlement(event: PaymentEvent): Promise<boolean> {
  const readerId = requireNonEmpty("readerId", event.readerId);
  const existing = await prisma.readerEntitlement.findUnique({
    where: { readerId },
    select: {
      id: true,
      planType: true,
      monthlyUnitAllowance: true,
      remainingUnitBalance: true,
      featureFlagsJson: true,
    },
  });
  const now = new Date();
  const fallbackPlan = event.eventType === "subscription_canceled"
    ? "free"
    : event.eventType === "purchase_units"
      ? (existing?.planType ?? "free")
      : event.planType;
  const monthlyAllowance = existing?.monthlyUnitAllowance ?? getEffectiveUnitAllowance(fallbackPlan);
  const defaultFlags = getDefaultFeatureFlagsForPlan(fallbackPlan);

  if (!existing) {
    await prisma.readerEntitlement.create({
      data: {
        readerId,
        planType: fallbackPlan,
        monthlyUnitAllowance: monthlyAllowance,
        remainingUnitBalance:
          event.eventType === "purchase_units"
            ? monthlyAllowance + event.purchasedUnitCount
            : monthlyAllowance,
        featureFlagsJson: defaultFlags as Prisma.InputJsonValue,
        entitlementStartAt: now,
        entitlementEndAt: null,
      },
    });
    return true;
  }

  if (event.eventType === "purchase_units") {
    await prisma.readerEntitlement.update({
      where: { readerId },
      data: {
        remainingUnitBalance: {
          increment: Math.max(0, Math.floor(event.purchasedUnitCount)),
        },
      },
    });
    return true;
  }

  if (event.eventType === "subscription_canceled") {
    const freeAllowance = getEffectiveUnitAllowance("free");
    await prisma.readerEntitlement.update({
      where: { readerId },
      data: {
        planType: "free",
        monthlyUnitAllowance: freeAllowance,
        remainingUnitBalance: Math.min(existing.remainingUnitBalance, freeAllowance),
        featureFlagsJson: getDefaultFeatureFlagsForPlan("free") as Prisma.InputJsonValue,
        entitlementEndAt: now,
      },
    });
    return true;
  }

  const nextPlan = event.planType;
  const nextAllowance = getEffectiveUnitAllowance(nextPlan);
  await prisma.readerEntitlement.update({
    where: { readerId },
    data: {
      planType: nextPlan,
      monthlyUnitAllowance: nextAllowance,
      remainingUnitBalance: nextAllowance,
      featureFlagsJson: getDefaultFeatureFlagsForPlan(nextPlan) as Prisma.InputJsonValue,
      entitlementStartAt: now,
      entitlementEndAt: null,
    },
  });
  return true;
}

export async function handlePaymentWebhookEvent(event: PaymentEvent): Promise<PaymentWebhookResult> {
  const eventId = requireNonEmpty("eventId", event.eventId);
  if (handledEventIds.has(eventId)) {
    return {
      duplicate: true,
      entitlementUpdated: false,
      event,
    };
  }
  const entitlementUpdated = await applyPaymentEventToEntitlement(event);
  handledEventIds.add(eventId);
  return {
    duplicate: false,
    entitlementUpdated,
    event,
  };
}

export function resetPaymentWebhookEventMemoryForTests(): void {
  handledEventIds.clear();
}

