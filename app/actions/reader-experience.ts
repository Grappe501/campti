"use server";

import type { ReaderMode } from "@/lib/domain/reader-mode";
import type { ReaderContinuityCacheSnapshot } from "@/lib/domain/reader-continuity";
import { buildReaderExperienceBundle } from "@/lib/services/reader-experience-orchestrator-service";
import { assertCapabilitySurfaceOwnership } from "@/lib/services/ui-ownership-service";

export async function actionBuildReaderExperienceBundle(params: {
  sessionId: string;
  sceneId: string;
  readerId?: string | null;
  userId?: string | null;
  characterId?: string | null;
  requestedMode?: ReaderMode | null;
  cacheSnapshot?: ReaderContinuityCacheSnapshot | null;
}) {
  assertCapabilitySurfaceOwnership({
    capability: "reader_cockpit",
    requestedSurface: "reader",
  });
  return buildReaderExperienceBundle(params);
}
