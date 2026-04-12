import {
  DependencyStrength,
  NarrativeDependencyConsumerKind,
  NarrativeDependencyProducerKind,
} from "@prisma/client";

import { registerDependencyEdge } from "@/lib/services/narrative-revision-service";

/** Soft edges so hierarchy moves invalidate downstream consumers. */
export async function registerSceneParentEdges(sceneId: string, ctx: {
  chapterId: string;
  bookId: string;
  epicId: string;
}) {
  await Promise.all([
    registerDependencyEdge({
      consumerKind: NarrativeDependencyConsumerKind.SCENE,
      consumerId: sceneId,
      producerKind: NarrativeDependencyProducerKind.CHAPTER,
      producerId: ctx.chapterId,
      strength: DependencyStrength.SOFT,
    }),
    registerDependencyEdge({
      consumerKind: NarrativeDependencyConsumerKind.SCENE,
      consumerId: sceneId,
      producerKind: NarrativeDependencyProducerKind.BOOK,
      producerId: ctx.bookId,
      strength: DependencyStrength.SOFT,
    }),
    registerDependencyEdge({
      consumerKind: NarrativeDependencyConsumerKind.SCENE,
      consumerId: sceneId,
      producerKind: NarrativeDependencyProducerKind.EPIC,
      producerId: ctx.epicId,
      strength: DependencyStrength.SOFT,
    }),
  ]);
}
