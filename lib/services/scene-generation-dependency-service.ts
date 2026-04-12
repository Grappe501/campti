import { createHash } from "node:crypto";

import {
  DependencyStrength,
  NarrativeDependencyConsumerKind,
  NarrativeDependencyProducerKind,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Everything the scene consumer should depend on after a generation pass (invalidation graph).
 */
export type SceneGenerationDependencyPlan = {
  sceneId: string;
  assertionIds: string[];
  personIds: string[];
  worldStateId: string | null;
  placeId: string | null;
  epicId: string;
  bookId: string;
  chapterId: string;
  simulationScenarioIds: string[];
  cognitionSessionIds: string[];
};

export function hashDependencyPlan(plan: SceneGenerationDependencyPlan): string {
  return createHash("sha256").update(JSON.stringify(plan)).digest("hex");
}

async function ensureEdge(input: {
  consumerId: string;
  producerKind: NarrativeDependencyProducerKind;
  producerId: string;
  strength: DependencyStrength;
  inputSnapshotHash: string | null;
}): Promise<string | null> {
  const existing = await prisma.narrativeDependencyEdge.findFirst({
    where: {
      consumerKind: NarrativeDependencyConsumerKind.SCENE,
      consumerId: input.consumerId,
      producerKind: input.producerKind,
      producerId: input.producerId,
    },
  });
  if (existing) {
    return null;
  }
  const row = await prisma.narrativeDependencyEdge.create({
    data: {
      consumerKind: NarrativeDependencyConsumerKind.SCENE,
      consumerId: input.consumerId,
      producerKind: input.producerKind,
      producerId: input.producerId,
      strength: input.strength,
      inputSnapshotHash: input.inputSnapshotHash ?? undefined,
    },
  });
  return row.id;
}

/**
 * Idempotent registration: skips edges that already exist for this consumer+producer pair.
 */
export async function registerSceneGenerationDependencies(
  plan: SceneGenerationDependencyPlan,
  inputSnapshotHash?: string | null
): Promise<string[]> {
  const hash = inputSnapshotHash ?? hashDependencyPlan(plan);
  const createdIds: string[] = [];

  const push = (id: string | null) => {
    if (id) createdIds.push(id);
  };

  push(
    await ensureEdge({
      consumerId: plan.sceneId,
      producerKind: NarrativeDependencyProducerKind.EPIC,
      producerId: plan.epicId,
      strength: DependencyStrength.HARD,
      inputSnapshotHash: hash,
    })
  );
  push(
    await ensureEdge({
      consumerId: plan.sceneId,
      producerKind: NarrativeDependencyProducerKind.BOOK,
      producerId: plan.bookId,
      strength: DependencyStrength.HARD,
      inputSnapshotHash: hash,
    })
  );
  push(
    await ensureEdge({
      consumerId: plan.sceneId,
      producerKind: NarrativeDependencyProducerKind.CHAPTER,
      producerId: plan.chapterId,
      strength: DependencyStrength.HARD,
      inputSnapshotHash: hash,
    })
  );

  if (plan.worldStateId) {
    push(
      await ensureEdge({
        consumerId: plan.sceneId,
        producerKind: NarrativeDependencyProducerKind.WORLD_STATE_REFERENCE,
        producerId: plan.worldStateId,
        strength: DependencyStrength.HARD,
        inputSnapshotHash: hash,
      })
    );
  }

  if (plan.placeId) {
    push(
      await ensureEdge({
        consumerId: plan.sceneId,
        producerKind: NarrativeDependencyProducerKind.PLACE,
        producerId: plan.placeId,
        strength: DependencyStrength.HARD,
        inputSnapshotHash: hash,
      })
    );
  }

  for (const id of plan.assertionIds) {
    push(
      await ensureEdge({
        consumerId: plan.sceneId,
        producerKind: NarrativeDependencyProducerKind.GENEALOGICAL_ASSERTION,
        producerId: id,
        strength: DependencyStrength.HARD,
        inputSnapshotHash: hash,
      })
    );
  }

  for (const id of plan.personIds) {
    push(
      await ensureEdge({
        consumerId: plan.sceneId,
        producerKind: NarrativeDependencyProducerKind.PERSON,
        producerId: id,
        strength: DependencyStrength.HARD,
        inputSnapshotHash: hash,
      })
    );
  }

  for (const id of plan.simulationScenarioIds) {
    push(
      await ensureEdge({
        consumerId: plan.sceneId,
        producerKind: NarrativeDependencyProducerKind.SIMULATION_SCENARIO,
        producerId: id,
        strength: DependencyStrength.SOFT,
        inputSnapshotHash: hash,
      })
    );
  }

  for (const id of plan.cognitionSessionIds) {
    push(
      await ensureEdge({
        consumerId: plan.sceneId,
        producerKind: NarrativeDependencyProducerKind.COGNITION_SESSION,
        producerId: id,
        strength: DependencyStrength.SOFT,
        inputSnapshotHash: hash,
      })
    );
  }

  return createdIds;
}
