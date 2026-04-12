import type { CognitionCanonicalStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { PersistedSimulationRunStub } from "@/lib/domain/cognition";
import { cognitionPrisma } from "@/lib/prisma-cognition-access";

export async function createSimulationScenario(input: {
  sceneId: string;
  title: string;
  baseSnapshotId?: string | null;
  variableOverridesJson: Prisma.InputJsonValue;
  createdBy?: string | null;
}) {
  return cognitionPrisma.simulationScenario.create({
    data: {
      sceneId: input.sceneId,
      title: input.title,
      baseSnapshotId: input.baseSnapshotId ?? undefined,
      variableOverridesJson: input.variableOverridesJson,
      createdBy: input.createdBy ?? undefined,
    },
  });
}

export async function recordSimulationRun(input: {
  scenarioId: string;
  personId?: string | null;
  inputJson: Prisma.InputJsonValue;
  outputJson: Prisma.InputJsonValue;
  prosePreview?: string | null;
  diffFromBaseJson?: Prisma.InputJsonValue | null;
  inputHash?: string | null;
  canonicalStatus?: CognitionCanonicalStatus;
}): Promise<PersistedSimulationRunStub> {
  const run = await cognitionPrisma.simulationRun.create({
    data: {
      scenarioId: input.scenarioId,
      personId: input.personId ?? undefined,
      inputJson: input.inputJson,
      outputJson: input.outputJson,
      prosePreview: input.prosePreview ?? undefined,
      diffFromBaseJson: input.diffFromBaseJson ?? undefined,
      inputHash: input.inputHash ?? undefined,
      canonicalStatus: input.canonicalStatus ?? undefined,
    },
  });
  return {
    runId: run.id,
    scenarioId: run.scenarioId,
    output: run.outputJson as Record<string, unknown>,
    prosePreview: run.prosePreview,
    diffFromBase: run.diffFromBaseJson as Record<string, unknown> | null,
  };
}

/** Phase 5E — persist full structured `SimulationRunResult` (minus `retainedFrames`). */
export async function persistSimulationRunRecord(input: {
  scenarioId: string;
  personId: string | null;
  inputHash: string;
  inputJson: Prisma.InputJsonValue;
  outputJson: Prisma.InputJsonValue;
  diffFromBaseJson: Prisma.InputJsonValue;
  canonicalStatus: CognitionCanonicalStatus;
}) {
  return cognitionPrisma.simulationRun.create({
    data: {
      scenarioId: input.scenarioId,
      personId: input.personId ?? undefined,
      inputHash: input.inputHash,
      inputJson: input.inputJson,
      outputJson: input.outputJson,
      diffFromBaseJson: input.diffFromBaseJson,
      canonicalStatus: input.canonicalStatus,
    },
  });
}
