"use server";

import {
  buildConversationObservabilitySnapshot,
  type BuildConversationObservabilitySnapshotParams,
} from "@/lib/services/conversation-observer-service";
import { assertCapabilitySurfaceOwnership } from "@/lib/services/ui-ownership-service";

/** P2-R — Structured conversation session inspection (debug / tooling; no UI). */
export async function actionBuildConversationObservabilitySnapshot(
  params: BuildConversationObservabilitySnapshotParams
) {
  assertCapabilitySurfaceOwnership({
    capability: "conversation_observer",
    requestedSurface: "author",
  });
  return buildConversationObservabilitySnapshot(params);
}
