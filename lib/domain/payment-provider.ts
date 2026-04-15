/**
 * P4-B — Provider-agnostic payment and purchase boundary.
 */
import type { Prisma } from "@prisma/client";

import type { ReaderEntitlementPlanType } from "@/lib/domain/reader-entitlement";

export type PaymentProviderKind = "stub";

export type PaymentEventType =
  | "purchase_units"
  | "subscription_started"
  | "subscription_renewed"
  | "subscription_canceled";

export type PaymentEventBase = {
  eventId: string;
  eventType: PaymentEventType;
  readerId: string;
  provider: PaymentProviderKind;
  occurredAtIso: string;
  metadataJson?: Prisma.JsonValue | null;
};

export type PurchaseUnitsPaymentEvent = PaymentEventBase & {
  eventType: "purchase_units";
  purchasedUnitCount: number;
};

export type SubscriptionStartedPaymentEvent = PaymentEventBase & {
  eventType: "subscription_started";
  planType: ReaderEntitlementPlanType;
};

export type SubscriptionRenewedPaymentEvent = PaymentEventBase & {
  eventType: "subscription_renewed";
  planType: ReaderEntitlementPlanType;
};

export type SubscriptionCanceledPaymentEvent = PaymentEventBase & {
  eventType: "subscription_canceled";
  planType?: ReaderEntitlementPlanType;
};

export type PaymentEvent =
  | PurchaseUnitsPaymentEvent
  | SubscriptionStartedPaymentEvent
  | SubscriptionRenewedPaymentEvent
  | SubscriptionCanceledPaymentEvent;

export type CreatePurchaseIntentInput = {
  readerId: string;
  unitCount: number;
  currencyCode?: string;
  amountMinor?: number;
  provider?: PaymentProviderKind;
  metadataJson?: Prisma.JsonValue | null;
};

export type PurchaseIntent = {
  intentId: string;
  provider: PaymentProviderKind;
  readerId: string;
  unitCount: number;
  currencyCode: string;
  amountMinor: number;
  status: "created";
  createdAtIso: string;
  metadataJson?: Prisma.JsonValue | null;
};

export type PaymentWebhookResult = {
  duplicate: boolean;
  entitlementUpdated: boolean;
  event: PaymentEvent;
};

