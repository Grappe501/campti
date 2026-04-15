-- P4-A entitlement foundation: product/account usage + feature gating.
CREATE TYPE "ReaderEntitlementPlanType" AS ENUM ('free', 'standard', 'premium', 'admin', 'internal');

CREATE TABLE "ReaderEntitlement" (
    "id" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "planType" "ReaderEntitlementPlanType" NOT NULL DEFAULT 'free',
    "monthlyUnitAllowance" INTEGER NOT NULL,
    "remainingUnitBalance" INTEGER NOT NULL,
    "featureFlagsJson" JSONB,
    "entitlementStartAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entitlementEndAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReaderEntitlement_readerId_key" ON "ReaderEntitlement"("readerId");
CREATE INDEX "ReaderEntitlement_planType_idx" ON "ReaderEntitlement"("planType");
CREATE INDEX "ReaderEntitlement_entitlementEndAt_idx" ON "ReaderEntitlement"("entitlementEndAt");

