-- P2-D.2 — Canonical world-state chronology column name (`temporalOrder` → `chronologyIndex`).
-- Must run after `20260416140000_world_state_temporal_order_p2b2`.

DROP INDEX IF EXISTS "WorldStateReference_temporalOrder_key";

ALTER TABLE "WorldStateReference" RENAME COLUMN "temporalOrder" TO "chronologyIndex";

CREATE UNIQUE INDEX "WorldStateReference_chronologyIndex_key" ON "WorldStateReference"("chronologyIndex");
