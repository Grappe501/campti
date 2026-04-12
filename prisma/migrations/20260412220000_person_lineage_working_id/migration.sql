-- Grappe working lineage cross-reference (GRP-* ↔ Person).
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "lineage_working_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Person_lineage_working_id_key" ON "Person"("lineage_working_id");
