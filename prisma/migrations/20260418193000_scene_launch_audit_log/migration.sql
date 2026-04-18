-- Scene launch guard audit — durable record of evaluate / block / confirm / run outcomes.

CREATE TABLE "SceneLaunchAuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sceneId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "launchAllowance" TEXT,
    "freshnessDigestPrefix" TEXT,
    "blockerCount" INTEGER,
    "riskCount" INTEGER,
    "advisoryCount" INTEGER,
    "confirmationRequired" BOOLEAN,
    "riskAcknowledged" BOOLEAN,
    "guardEvaluatedAtIso" TEXT,
    "inputHashPreview" TEXT,
    "finalAction" TEXT,
    "errorMessage" TEXT,
    "intent" TEXT,
    "meta" JSONB,

    CONSTRAINT "SceneLaunchAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SceneLaunchAuditLog_sceneId_createdAt_idx" ON "SceneLaunchAuditLog"("sceneId", "createdAt");

ALTER TABLE "SceneLaunchAuditLog" ADD CONSTRAINT "SceneLaunchAuditLog_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
