/**
 * P3-K — Safe, observational bridges from bounded interaction telemetry to the narrative OS.
 *
 * **Non-negotiable:** reader↔character chat does not mutate canonical story text, genealogy, or locked
 * world history. This module emits summaries and stats for dashboards and author review only.
 */

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import {
  INTERACTION_OBSERVABILITY_SUMMARY_CONTRACT_VERSION,
  type InteractionObservabilitySummary,
} from "@/lib/domain/interaction-observability-summary";
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";

/**
 * Map a session row to a dashboard-friendly slice (no transcript blobs, no auto-writes to Scene/Book).
 */
export function buildInteractionObservabilitySummary(
  session: CharacterConversationSession
): InteractionObservabilitySummary {
  assertMemoryBoundary({
    source: "reader_interaction_memory",
    target: "reader_interaction_memory",
    payload: {
      sessionId: session.id,
      interactionCount: session.interactionCount,
    },
  });
  return validateRegisteredContractPayload("interactionObservabilitySummary", {
    contractVersion: INTERACTION_OBSERVABILITY_SUMMARY_CONTRACT_VERSION,
    sessionId: session.id,
    characterId: session.characterId,
    readerId: session.readerId,
    sceneId: session.sceneId,
    interactionCount: session.interactionCount,
    status: session.status,
    nonCanonical: true,
  }, "write");
}
