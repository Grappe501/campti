-- P2-B.2 — Explicit world-state chronology for the narrative truth firewall (not lexicographic id order).

ALTER TABLE "WorldStateReference" ADD COLUMN "temporalOrder" INTEGER;

UPDATE "WorldStateReference" AS w
SET "temporalOrder" = sub.rn
FROM (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) - 1) AS rn
  FROM "WorldStateReference"
) AS sub
WHERE w.id = sub.id;

ALTER TABLE "WorldStateReference" ALTER COLUMN "temporalOrder" SET NOT NULL;

CREATE UNIQUE INDEX "WorldStateReference_temporalOrder_key" ON "WorldStateReference"("temporalOrder");

ALTER TABLE "NarrativeSource" ADD CONSTRAINT "NarrativeSource_effectiveStartWorldStateId_fkey" FOREIGN KEY ("effectiveStartWorldStateId") REFERENCES "WorldStateReference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NarrativeSource" ADD CONSTRAINT "NarrativeSource_effectiveEndWorldStateId_fkey" FOREIGN KEY ("effectiveEndWorldStateId") REFERENCES "WorldStateReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;
