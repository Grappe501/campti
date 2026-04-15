/**
 * Conversation drift anchor (deterministic, detection-only).
 *
 * Produces a compact per-session anchor from {@link ConversationalIdentitySnapshot} and compares
 * later snapshots for identity / knowledge drift signals. No correction logic and no model calls.
 */

import { createHash } from "crypto";

import type { Prisma } from "@prisma/client";

import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";

export type ConversationAnchor = {
  initialIdentityHash?: string;
  initialEmotionalBaseline?: string;
  initialKnowledgeSummaryHash?: string;
};

export type ConversationAnchorComparison = {
  driftDetected: boolean;
  driftSignals: string[];
};

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function stableJson(value: unknown): string {
  if (value == null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableJson(v)).join(",")}]`;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function deriveEmotionalBaseline(snapshot: ConversationalIdentitySnapshot): string {
  const cog = snapshot.emotionalState.latestCognitionSnapshot;
  const legacy = snapshot.emotionalState.latestLegacyCharacterState;
  if (cog?.currentArousal != null && cog.currentArousal >= 65) return "charged";
  if (cog?.currentHope?.trim()) return "hopeful";
  if (legacy?.fearLevel != null && legacy.fearLevel >= 65) return "anxious";
  if (legacy?.trustLevel != null && legacy.trustLevel <= 35) return "wary";
  if (legacy?.emotionalBaseline?.trim()) return legacy.emotionalBaseline.trim().toLowerCase();
  return "neutral";
}

function identityHashMaterial(snapshot: ConversationalIdentitySnapshot): unknown {
  return {
    policy: snapshot.policy,
    person: snapshot.identity.person,
    literaryProfile: snapshot.identity.literaryProfile,
    coreHighlights: snapshot.identity.coreHighlights,
    relationships: snapshot.relationships.map((r) => ({
      counterpartyId: r.counterpartyId,
      counterpartyName: r.counterpartyName,
      relationshipType: r.relationshipType,
      relationshipSummary: r.relationshipSummary,
    })),
  };
}

function knowledgeHashMaterial(snapshot: ConversationalIdentitySnapshot): unknown {
  return {
    knownFacts: [...snapshot.knowledgeBoundary.knownFacts],
    believedFacts: [...snapshot.knowledgeBoundary.believedFacts],
    unknownDomains: [...snapshot.knowledgeBoundary.unknownDomains],
  };
}

export function computeConversationAnchor(snapshot: ConversationalIdentitySnapshot): ConversationAnchor {
  return {
    initialIdentityHash: sha256(stableJson(identityHashMaterial(snapshot))),
    initialEmotionalBaseline: deriveEmotionalBaseline(snapshot),
    initialKnowledgeSummaryHash: sha256(stableJson(knowledgeHashMaterial(snapshot))),
  };
}

export function compareSnapshotToAnchor(
  snapshot: ConversationalIdentitySnapshot,
  anchor: ConversationAnchor
): ConversationAnchorComparison {
  const driftSignals: string[] = [];
  const current = computeConversationAnchor(snapshot);

  if (anchor.initialIdentityHash && current.initialIdentityHash !== anchor.initialIdentityHash) {
    driftSignals.push("identity_hash_changed");
  }
  if (anchor.initialKnowledgeSummaryHash && current.initialKnowledgeSummaryHash !== anchor.initialKnowledgeSummaryHash) {
    driftSignals.push("knowledge_boundary_hash_changed");
  }
  if (
    anchor.initialEmotionalBaseline &&
    current.initialEmotionalBaseline !== anchor.initialEmotionalBaseline
  ) {
    driftSignals.push("emotional_baseline_changed");
  }

  return {
    driftDetected: driftSignals.length > 0,
    driftSignals,
  };
}

function parseRootMetadata(json: Prisma.JsonValue | null): Record<string, unknown> {
  if (json != null && typeof json === "object" && !Array.isArray(json)) {
    return { ...(json as Record<string, unknown>) };
  }
  return {};
}

export function readConversationAnchorFromMetadata(metadataJson: Prisma.JsonValue | null): ConversationAnchor | null {
  const root = parseRootMetadata(metadataJson);
  const raw = root.conversationAnchor;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const a = raw as Record<string, unknown>;
  const out: ConversationAnchor = {};
  if (typeof a.initialIdentityHash === "string" && a.initialIdentityHash.trim()) {
    out.initialIdentityHash = a.initialIdentityHash;
  }
  if (typeof a.initialEmotionalBaseline === "string" && a.initialEmotionalBaseline.trim()) {
    out.initialEmotionalBaseline = a.initialEmotionalBaseline;
  }
  if (typeof a.initialKnowledgeSummaryHash === "string" && a.initialKnowledgeSummaryHash.trim()) {
    out.initialKnowledgeSummaryHash = a.initialKnowledgeSummaryHash;
  }
  return Object.keys(out).length ? out : null;
}
