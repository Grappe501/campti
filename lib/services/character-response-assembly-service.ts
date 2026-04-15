/**
 * P2-I.2 — Deterministic response assembly: {@link ConversationalIdentitySnapshot} → {@link CharacterResponse}.
 *
 * Bounded character mode only. Does not call LLMs; validates against the contract registry on write.
 */

import type { CharacterKnowledgeBoundary } from "@/lib/character-knowledge/knowledge-boundary";
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import {
  CHARACTER_RESPONSE_CONTRACT_VERSION,
  type CharacterResponse,
  type CharacterResponseKnowledgeSource,
} from "@/lib/domain/character-response-contract";
import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import { assessCharacterResponsePolicyViolations } from "@/lib/services/character-response-guardrail-service";
import { deriveConversationEmotionalContinuity } from "@/lib/services/conversation-emotional-continuity-service";

export type CharacterResponseIntent =
  | "question"
  | "reaction"
  | "statement"
  | "greeting"
  | "other"
  | "unspecified";

export type AssembleCharacterResponseParams = {
  conversationalIdentitySnapshot: ConversationalIdentitySnapshot;
  spokenResponseText: string;
  internalThoughtText: string;
  responseIntent?: CharacterResponseIntent;
};

/** Internal diagnostics (not part of {@link CharacterResponse} contract). */
export type CharacterResponseAssemblyDiagnostics = {
  classificationReason: string;
  policyDowngraded: boolean;
};

export type AssembleCharacterResponseResult = { response: CharacterResponse } & CharacterResponseAssemblyDiagnostics;

/** Stripped from output for TTS safety; full guardrail logic lives in {@link assessCharacterResponsePolicyViolations}. */
const ALL_POLICY_STRIPS: readonly string[] = [
  "as the narrator",
  "as narrator",
  "as the author",
  "fourth wall",
  "omniscient narrator",
  "god's-eye",
  "metafictional",
  "out-of-world lecture",
  "let me teach you real history",
  "according to wikipedia",
  "as your history teacher",
  "will happen next century",
  "years from now you will",
  "i already know your future",
  "quantum computing",
  "the internet will",
  "i know because this is a story",
  "from the future",
];

function combinedResponseText(spoken: string, internal: string): string {
  return `${spoken}\n${internal}`;
}

/** Minimum token length when scoring overlap (reduces noise from "in", "or", …). */
const KNOWLEDGE_CONTENT_TOKEN_MIN_LEN = 3;

/** Weak match: punctuation/whitespace-insensitive token overlap vs. full normalized fact lines. */
const KNOWLEDGE_WEAK_HIT_MIN_SHARED = 3;
const KNOWLEDGE_WEAK_HIT_RATIO = 0.34;

/** Stub spoken line: require strong overlap to claim known/belief (non-generated / placeholder lines). */
function spokenLooksLikePlaceholderStub(spokenTrimmed: string): boolean {
  const t = spokenTrimmed.trim();
  if (t.length === 0) return true;
  if (/lorem ipsum|placeholder|\[stub\]|\[placeholder\]/i.test(t)) return true;
  if (/^(hi|hello|hey|good morning|good day|good afternoon)\b[.!]?$/i.test(t)) return true;
  if (/^(ok|okay|sure|test|testing|thanks|thank you)\b[.!]?$/i.test(t)) return true;
  const wc = t.split(/\s+/).filter(Boolean).length;
  return t.length <= 22 && wc <= 4;
}

/**
 * Lowercase, strip punctuation to spaces, collapse whitespace — deterministic matching only.
 */
function normalizeForKnowledgeMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contentTokens(norm: string): string[] {
  return norm.split(" ").filter((w) => w.length >= KNOWLEDGE_CONTENT_TOKEN_MIN_LEN);
}

type FactLineMatch = {
  hit: boolean;
  ratio: number;
  shared: number;
  factTokenCount: number;
};

function matchFactLineAgainstHaystack(haystackNorm: string, factLineRaw: string): FactLineMatch {
  const trimmed = factLineRaw.trim();
  if (trimmed.length < 6) {
    return { hit: false, ratio: 0, shared: 0, factTokenCount: 0 };
  }

  const factNorm = normalizeForKnowledgeMatch(factLineRaw);
  const hayTokens = new Set(contentTokens(haystackNorm));
  const factTokens = contentTokens(factNorm);
  const factTokenCount = factTokens.length;

  if (factTokenCount === 0) {
    return { hit: false, ratio: 0, shared: 0, factTokenCount: 0 };
  }

  let shared = 0;
  for (const ft of factTokens) {
    if (hayTokens.has(ft)) shared += 1;
  }

  const ratio = shared / factTokenCount;
  const hit =
    shared >= KNOWLEDGE_WEAK_HIT_MIN_SHARED ||
    (shared >= 2 && ratio >= KNOWLEDGE_WEAK_HIT_RATIO && factTokenCount >= 2);

  return { hit, ratio, shared, factTokenCount };
}

/** Stricter overlap for stub spoken lines (avoids false "known" from coincidental tokens). */
function matchFactLineStrong(haystackNorm: string, factLineRaw: string): FactLineMatch {
  const base = matchFactLineAgainstHaystack(haystackNorm, factLineRaw);
  if (!base.hit) return base;
  const strong =
    base.shared >= 4 ||
    base.ratio >= 0.55 ||
    (base.shared >= 3 && base.factTokenCount <= 5);
  return { ...base, hit: strong };
}

function countBucketHits(
  haystackNorm: string,
  lines: string[],
  useStrong: boolean
): { hits: number; bestRatio: number } {
  let hits = 0;
  let bestRatio = 0;
  const matcher = useStrong ? matchFactLineStrong : matchFactLineAgainstHaystack;
  for (const line of lines) {
    const m = matcher(haystackNorm, line);
    if (m.ratio > bestRatio) bestRatio = m.ratio;
    if (m.hit) hits += 1;
  }
  return { hits, bestRatio };
}

type ClassifyKnowledgeSourceResult = {
  source: CharacterResponseKnowledgeSource;
  reason: string;
};

/**
 * Deterministic classification from {@link CharacterKnowledgeBoundary} buckets vs. response text.
 * Uses normalized token overlap (not fixed-prefix substrings). Stub-like spoken lines default to
 * uncertain unless overlap is strong.
 */
function classifyKnowledgeSource(
  text: string,
  boundary: CharacterKnowledgeBoundary,
  options: { stubSpoken: boolean }
): ClassifyKnowledgeSourceResult {
  const hayNorm = normalizeForKnowledgeMatch(text);
  const useStrong = options.stubSpoken;

  let { hits: knownHits, bestRatio: bestKnown } = countBucketHits(hayNorm, boundary.knownFacts, useStrong);
  let { hits: beliefHits, bestRatio: bestBelief } = countBucketHits(hayNorm, boundary.believedFacts, useStrong);

  if (useStrong && knownHits === 0 && beliefHits === 0) {
    const weakKnown = countBucketHits(hayNorm, boundary.knownFacts, false);
    const weakBelief = countBucketHits(hayNorm, boundary.believedFacts, false);
    return {
      source: "uncertain",
      reason: `placeholder_spoken:weak_only(knownWeak=${weakKnown.hits},beliefWeak=${weakBelief.hits},bestR=${Math.max(weakKnown.bestRatio, weakBelief.bestRatio).toFixed(2)})`,
    };
  }

  const gossipHint = /\b(gossip|rumor|heard tell|they say|word is)\b/i.test(text);

  let source: CharacterResponseKnowledgeSource;
  let reason: string;

  if (knownHits > beliefHits) {
    source = "known";
    reason = `overlap:known>belief:knownHits=${knownHits},beliefHits=${beliefHits},bestKnownR=${bestKnown.toFixed(2)}`;
  } else if (beliefHits > knownHits) {
    source = "belief";
    reason = `overlap:belief>known:knownHits=${knownHits},beliefHits=${beliefHits},bestBeliefR=${bestBelief.toFixed(2)}`;
  } else if (knownHits > 0 && beliefHits > 0) {
    source = "uncertain";
    reason = `overlap:tie_buckets:knownHits=${knownHits},beliefHits=${beliefHits}`;
  } else if (knownHits > 0) {
    source = "known";
    reason = `overlap:known_only:hits=${knownHits},r=${bestKnown.toFixed(2)}`;
  } else if (beliefHits > 0) {
    source = "belief";
    reason = `overlap:belief_only:hits=${beliefHits},r=${bestBelief.toFixed(2)}`;
  } else if (gossipHint) {
    source = "belief";
    reason = "diction:gossip_hint";
  } else {
    source = "uncertain";
    reason = "overlap:none";
  }

  return { source, reason };
}

/**
 * Remove known policy-violating phrases; collapse whitespace. Deterministic, conservative.
 */
function normalizePolicySensitivePhrases(text: string): { normalized: string; altered: boolean } {
  let out = text;
  let altered = false;
  for (const s of ALL_POLICY_STRIPS) {
    const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const next = out.replace(re, " ");
    if (next !== out) altered = true;
    out = next;
  }
  return { normalized: out.replace(/\s+/g, " ").trim(), altered };
}

function deriveEmotionalTone(snapshot: ConversationalIdentitySnapshot): string {
  return deriveConversationEmotionalContinuity({ snapshot }).currentConversationTone;
}

/**
 * Assemble a {@link CharacterResponse} from a conversational identity snapshot and candidate lines.
 * Strips obvious policy-violating phrases conservatively; runs {@link assessCharacterResponsePolicyViolations}
 * (including optional original line scan) before registry write.
 * Returns internal classification / policy flags for tests and instrumentation.
 */
export function assembleCharacterResponseWithDiagnostics(
  params: AssembleCharacterResponseParams
): AssembleCharacterResponseResult {
  const { conversationalIdentitySnapshot: snap, spokenResponseText, internalThoughtText, responseIntent } =
    params;

  void responseIntent;

  const spoken0 = spokenResponseText.trim();
  const internal0 = internalThoughtText.trim();
  const combinedOriginal = combinedResponseText(spoken0, internal0);

  const nSpoken = normalizePolicySensitivePhrases(spoken0);
  const nInternal = normalizePolicySensitivePhrases(internal0);
  const spoken = nSpoken.normalized;
  const internal = nInternal.normalized;
  const combined = combinedResponseText(spoken, internal);

  const stubSpoken = spokenLooksLikePlaceholderStub(spoken0);
  const classified = classifyKnowledgeSource(combined, snap.knowledgeBoundary, { stubSpoken });
  let classificationReason = `${classified.reason};relationship=${snap.readerRelationshipProgression.relationshipState}`;
  let knowledgeSource = classified.source;

  const emotionalTone = deriveEmotionalTone(snap);

  let payload: CharacterResponse = {
    contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
    spokenResponse: spoken,
    internalThought: internal,
    knowledgeSource,
    emotionalTone,
  };

  const assessment = assessCharacterResponsePolicyViolations({
    snapshot: snap,
    response: payload,
    originalCombinedText: combinedOriginal,
  });

  let policyDowngraded = false;
  if (!assessment.pass && assessment.suggestedDowngradeAction === "force_knowledge_uncertain") {
    if (payload.knowledgeSource !== "uncertain") {
      policyDowngraded = true;
      classificationReason = `${classificationReason};policy_downgrade_guardrail`;
    }
    payload = { ...payload, knowledgeSource: "uncertain" };
  }

  const response = validateRegisteredContractPayload("characterResponse", payload, "write");

  return {
    response,
    classificationReason,
    policyDowngraded,
  };
}

export function assembleCharacterResponse(params: AssembleCharacterResponseParams): CharacterResponse {
  return assembleCharacterResponseWithDiagnostics(params).response;
}
