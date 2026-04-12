-- AlterTable
ALTER TABLE "SimulationRun" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SimulationRun" ADD COLUMN "inputHash" TEXT;

CREATE INDEX "SimulationRun_inputHash_idx" ON "SimulationRun"("inputHash");
