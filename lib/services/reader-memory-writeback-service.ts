/**
 * P2-O — Update {@link CharacterReaderMemory} after a completed conversation turn.
 *
 * **Sources of truth for reader facts:** the reader’s own message text only (`readerTurnText`).
 * {@link CharacterResponse} is accepted for API symmetry and future auditing — it is **not** used to
 * infer facts about the reader (characters can be wrong or omniscient in fiction; we do not import that
 * into memory).
 *
 * Extraction is deliberately tiny: a few explicit self-disclosure regexes with tight length caps.
 * No NLP models, no sentiment, no profile synthesis. Familiarity uses existing P2-G
 * {@link updateMemoryAfterInteraction} rules.
 */

import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import type { CharacterReaderMemory } from "@/lib/domain/character-reader-memory";
import { updateMemoryAfterInteraction } from "@/lib/services/character-reader-memory-service";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";

/** Max length for any single stored disclosure value (characters). */
export const MAX_READER_DISCLOSURE_VALUE_LEN = 96;
const ALLOWED_READER_DISCLOSURE_KEYS = new Set([
  "disclosed_name",
  "disclosed_call_me",
  "disclosed_called",
]);

export type UpdateReaderMemoryFromTurnInput = {
  characterId: string;
  readerId: string;
  readerTurnText: string;
  characterResponse: CharacterResponse;
};

/**
 * Deterministic, conservative extraction of **explicit** first-person disclosures from the reader line.
 * Exported for unit tests; production callers should use {@link updateReaderMemoryFromTurn}.
 */
export function extractDirectReaderDisclosures(readerTurnText: string): Record<string, string> {
  const out: Record<string, string> = {};
  const t = readerTurnText.replace(/\s+/g, " ").trim();
  if (!t) return out;

  const push = (key: string, value: string) => {
    const v = value.trim().replace(/\s+/g, " ");
    if (v.length > 0) out[key] = v.slice(0, MAX_READER_DISCLOSURE_VALUE_LEN);
  };

  const nameIs = t.match(/\bmy name is\s+([^.!?\n]{1,56})/i);
  if (nameIs?.[1]) push("disclosed_name", nameIs[1]);

  const callMe = t.match(/\bcall me\s+([^.!?,;]{1,40})/i);
  if (callMe?.[1]) push("disclosed_call_me", callMe[1]);

  const imCalled = t.match(/\bi(?:'m| am) called\s+([^.!?\n]{1,48})/i);
  if (imCalled?.[1]) push("disclosed_called", imCalled[1]);

  return out;
}

export function assertAllowedReaderDisclosurePatch(patch: Record<string, unknown>): void {
  const disallowed = Object.keys(patch).filter((k) => !ALLOWED_READER_DISCLOSURE_KEYS.has(k));
  if (disallowed.length > 0) {
    throw new Error(
      `[reader-memory-writeback] Disallowed reader disclosure key(s): ${disallowed.join(", ")}`
    );
  }
}

/**
 * Merge writeback patch into relationship memory for this **single** (characterId, readerId) pair.
 * Increments interaction count and familiarity via P2-G; merges only {@link extractDirectReaderDisclosures}.
 */
export async function updateReaderMemoryFromTurn(
  input: UpdateReaderMemoryFromTurnInput
): Promise<CharacterReaderMemory> {
  const { characterId, readerId, readerTurnText, characterResponse } = input;
  void characterResponse;

  const knownFactsPatch = extractDirectReaderDisclosures(readerTurnText);
  assertAllowedReaderDisclosurePatch(knownFactsPatch);
  assertMemoryBoundary({
    source: "reader_interaction_memory",
    target: "reader_interaction_memory",
    payload: knownFactsPatch,
  });
  return updateMemoryAfterInteraction({
    characterId,
    readerId,
    knownFactsPatch: knownFactsPatch,
  });
}
