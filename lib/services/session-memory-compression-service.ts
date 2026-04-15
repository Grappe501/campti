/**
 * P3-M — Deterministic long-session memory compression service.
 *
 * The summary is conservative and bounded:
 * - no LLM summarization
 * - no transcript deletion
 * - no canonical truth rewrites
 */
import { createHash } from "crypto";

import type { Prisma } from "@prisma/client";

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import type { CharacterReaderMemory } from "@/lib/domain/character-reader-memory";
import type { SessionMemorySummary } from "@/lib/domain/session-memory-summary";
import { prisma } from "@/lib/prisma";
import { getCharacterReaderMemory } from "@/lib/services/character-reader-memory-service";
import { listSessionTurnsOrdered } from "@/lib/services/character-conversation-turn-service";
import { assertSessionMetadataPatchWriteBoundary } from "@/lib/services/interaction-truth-firewall-service";
import { extractDirectReaderDisclosures } from "@/lib/services/reader-memory-writeback-service";

const MAX_DISCLOSURES = 6;
const MAX_UNRESOLVED_TOPICS = 6;
const MAX_LINE_CHARS = 120;

function toSessionDomain(row: {
  id: string;
  characterId: string;
  readerId: string;
  sceneId: string | null;
  status: CharacterConversationSession["status"];
  interactionCount: number;
  startedAt: Date;
  lastInteractionAt: Date;
  endedAt: Date | null;
  metadataJson: Prisma.JsonValue | null;
}): CharacterConversationSession {
  return {
    id: row.id,
    characterId: row.characterId,
    readerId: row.readerId,
    sceneId: row.sceneId,
    status: row.status,
    interactionCount: row.interactionCount,
    startedAt: row.startedAt,
    lastInteractionAt: row.lastInteractionAt,
    endedAt: row.endedAt,
    metadataJson: row.metadataJson,
  };
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

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function clampLine(input: string): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_LINE_CHARS) return normalized;
  return `${normalized.slice(0, MAX_LINE_CHARS - 1)}…`;
}

function parseObject(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function collectReaderDisclosures(turns: CharacterConversationTurn[]): string[] {
  const out = new Set<string>();
  for (const turn of turns) {
    if (turn.speakerType !== "reader") continue;
    const o = parseObject(turn.payloadJson);
    const readerText = typeof o?.readerText === "string" ? o.readerText : "";
    const disclosures = extractDirectReaderDisclosures(readerText);
    for (const [k, v] of Object.entries(disclosures)) {
      out.add(clampLine(`${k}:${v}`));
      if (out.size >= MAX_DISCLOSURES) return [...out];
    }
  }
  return [...out];
}

function collectCharacterDisclosures(turns: CharacterConversationTurn[]): string[] {
  const out = new Set<string>();
  for (const turn of turns) {
    if (turn.speakerType !== "character") continue;
    const o = parseObject(turn.payloadJson);
    const spokenResponse = typeof o?.spokenResponse === "string" ? o.spokenResponse : "";
    if (!spokenResponse) continue;
    const lines = spokenResponse.split(/[.!?]/g);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/\b(i|my|me)\b/i.test(trimmed)) {
        out.add(clampLine(trimmed));
      }
      if (out.size >= MAX_DISCLOSURES) return [...out];
    }
  }
  return [...out];
}

function collectUnresolvedTopics(turns: CharacterConversationTurn[]): string[] {
  const out = new Set<string>();
  for (const turn of turns) {
    const o = parseObject(turn.payloadJson);
    const key = turn.speakerType === "reader" ? "readerText" : "spokenResponse";
    const line = typeof o?.[key] === "string" ? (o[key] as string) : "";
    if (!line.includes("?")) continue;
    const candidate = line
      .split("?")
      .map((v) => v.trim())
      .filter(Boolean)
      .at(-1);
    if (candidate) {
      out.add(clampLine(candidate));
    }
    if (out.size >= MAX_UNRESOLVED_TOPICS) return [...out];
  }
  return [...out];
}

function summarizeTrustMovement(session: CharacterConversationSession, readerMemory: CharacterReaderMemory | null): string {
  if (!readerMemory) {
    return "insufficient_dyadic_memory";
  }
  if (readerMemory.familiarityLevel >= 75) return "high_trust_stability";
  if (readerMemory.familiarityLevel >= 45) return "growing_familiarity";
  if (session.interactionCount <= 1) return "early_contact";
  return "cautious_building";
}

function summarizeEmotionalBeats(turns: CharacterConversationTurn[]): string {
  const tones: string[] = [];
  for (const turn of turns) {
    if (turn.speakerType !== "character") continue;
    const o = parseObject(turn.payloadJson);
    const tone = typeof o?.emotionalTone === "string" ? o.emotionalTone.trim() : "";
    if (!tone) continue;
    if (tones.length === 0 || tones[tones.length - 1] !== tone) {
      tones.push(clampLine(tone));
    }
    if (tones.length >= 4) break;
  }
  if (tones.length === 0) return "no_character_tone_detected";
  return tones.join(" -> ");
}

export function buildSessionMemorySummary(input: {
  turns: CharacterConversationTurn[];
  readerMemory: CharacterReaderMemory | null;
  session: CharacterConversationSession;
  builtAtIso?: string;
}): SessionMemorySummary {
  const keyReaderDisclosures = collectReaderDisclosures(input.turns);
  const keyCharacterDisclosures = collectCharacterDisclosures(input.turns);
  const unresolvedTopics = collectUnresolvedTopics(input.turns);
  const trustMovementSummary = summarizeTrustMovement(input.session, input.readerMemory);
  const emotionalBeatSummary = summarizeEmotionalBeats(input.turns);
  const builtAtIso = input.builtAtIso ?? new Date().toISOString();

  const hashMaterial = {
    keyReaderDisclosures,
    keyCharacterDisclosures,
    unresolvedTopics,
    trustMovementSummary,
    emotionalBeatSummary,
    sessionId: input.session.id,
    interactionCount: input.session.interactionCount,
  };

  return {
    keyReaderDisclosures,
    keyCharacterDisclosures,
    unresolvedTopics,
    trustMovementSummary,
    emotionalBeatSummary,
    latestSessionSummaryHash: sha256(stableJson(hashMaterial)),
    builtAtIso,
  };
}

function parseRootMetadata(json: Prisma.JsonValue | null): Record<string, unknown> {
  if (json != null && typeof json === "object" && !Array.isArray(json)) {
    return { ...(json as Record<string, unknown>) };
  }
  return {};
}

export function readSessionMemorySummaryFromMetadata(
  metadataJson: Prisma.JsonValue | null
): SessionMemorySummary | null {
  const root = parseRootMetadata(metadataJson);
  const raw = root.sessionMemorySummary;
  const o = parseObject(raw);
  if (!o) return null;

  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, MAX_DISCLOSURES) : [];
  const unresolved = Array.isArray(o.unresolvedTopics)
    ? o.unresolvedTopics.filter((x): x is string => typeof x === "string").slice(0, MAX_UNRESOLVED_TOPICS)
    : [];

  if (
    typeof o.trustMovementSummary !== "string" ||
    typeof o.emotionalBeatSummary !== "string" ||
    typeof o.latestSessionSummaryHash !== "string" ||
    typeof o.builtAtIso !== "string"
  ) {
    return null;
  }

  return {
    keyReaderDisclosures: asStringArray(o.keyReaderDisclosures),
    keyCharacterDisclosures: asStringArray(o.keyCharacterDisclosures),
    unresolvedTopics: unresolved,
    trustMovementSummary: clampLine(o.trustMovementSummary),
    emotionalBeatSummary: clampLine(o.emotionalBeatSummary),
    latestSessionSummaryHash: o.latestSessionSummaryHash,
    builtAtIso: o.builtAtIso,
  };
}

export async function buildAndPersistSessionMemorySummary(
  sessionId: string
): Promise<SessionMemorySummary> {
  const sid = sessionId.trim();
  if (!sid) {
    throw new Error("[session-memory-compression] sessionId is required.");
  }
  const row = await prisma.characterConversationSession.findUnique({
    where: { id: sid },
  });
  if (!row) {
    throw new Error(`[session-memory-compression] Session not found: ${sid}`);
  }

  const session = toSessionDomain(row);
  const [turns, readerMemory] = await Promise.all([
    listSessionTurnsOrdered(sid),
    getCharacterReaderMemory(session.characterId, session.readerId),
  ]);
  const summary = buildSessionMemorySummary({ turns, readerMemory, session });

  const root = parseRootMetadata(row.metadataJson);
  assertSessionMetadataPatchWriteBoundary({
    source: "interaction_summary",
    patch: { sessionMemorySummary: summary },
  });
  root.sessionMemorySummary = summary;
  await prisma.characterConversationSession.update({
    where: { id: sid },
    data: {
      metadataJson: root as Prisma.InputJsonValue,
      lastInteractionAt: new Date(),
    },
  });

  return summary;
}
