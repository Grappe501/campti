"use server";

import {
  buildStoryReentryContinuityPayload,
  type StoryReentryContinuityPayload,
} from "@/lib/services/story-reentry-continuity-service";
import { assertCapabilitySurfaceOwnership } from "@/lib/services/ui-ownership-service";

export async function actionBuildStoryReentryContinuity(params: {
  readerId: string;
  characterId: string;
  preferredSceneId?: string | null;
}): Promise<StoryReentryContinuityPayload> {
  assertCapabilitySurfaceOwnership({
    capability: "story_reentry",
    requestedSurface: "reader",
  });
  return buildStoryReentryContinuityPayload(params);
}
