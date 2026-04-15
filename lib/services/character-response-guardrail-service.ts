/**
 * P2-Q — Deterministic policy guardrails for {@link CharacterResponse} under a {@link ConversationalIdentitySnapshot}.
 *
 * No model calls. Optional `originalCombinedText` lets callers scan pre-strip prose (e.g. meta voice)
 * while `response` carries the final spoken/internal lines.
 */

import type { CharacterKnowledgeBoundary } from "@/lib/character-knowledge/knowledge-boundary";
import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";

export type CharacterResponsePolicyViolationCode =
  | "policy_flags_not_bounded"
  | "future_knowledge_vs_boundary"
  | "out_of_world_teaching"
  | "omniscient_or_meta_voice"
  | "translation_cognition_confusion"
  | "reader_memory_claim_without_dyad";

export type CharacterResponsePolicyViolation = {
  code: CharacterResponsePolicyViolationCode;
  message: string;
};

export type CharacterResponsePolicyAssessment = {
  pass: boolean;
  violations: CharacterResponsePolicyViolation[];
  /** Minimal remediation aligned with P2-I assembly. */
  suggestedDowngradeAction: "none" | "force_knowledge_uncertain";
};

const OMNISCIENT_OR_META_SUBSTRINGS = [
  "as the narrator",
  "as the author",
  "fourth wall",
  "omniscient narrator",
  "god's-eye",
  "metafictional",
] as const;

const OUT_OF_WORLD_TEACHING_SUBSTRINGS = [
  "out-of-world lecture",
  "let me teach you real history",
  "according to wikipedia",
  "as your history teacher",
] as const;

const FUTURE_KNOWLEDGE_SUBSTRINGS = [
  "will happen next century",
  "years from now you will",
  "i already know your future",
  "quantum computing",
  "the internet will",
] as const;

/** Translation presented as if it were cognition / soul (presentation must stay separate). */
const TRANSLATION_COGNITION_CONFUSION = [
  "subtitle of my soul",
  "english translation of my thoughts",
  "dubbed my conscience",
  "google translated my heart",
] as const;

function combinedResponseText(response: CharacterResponse): string {
  return `${response.spokenResponse}\n${response.internalThought}`;
}

function policyFlagsSatisfied(snapshot: ConversationalIdentitySnapshot): boolean {
  const p = snapshot.policy;
  const b = BOUNDED_CHARACTER_CONVERSATIONAL_POLICY;
  return (
    p.inWorldOnly === b.inWorldOnly &&
    p.noFutureKnowledge === b.noFutureKnowledge &&
    p.noOutOfWorldTeaching === b.noOutOfWorldTeaching &&
    p.translationIsPresentationOnly === b.translationIsPresentationOnly &&
    p.authorOmniscienceExcluded === b.authorOmniscienceExcluded
  );
}

function containsAnySubstringCaseInsensitive(haystack: string, needles: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

function inferStoryYearCeilingFromBoundary(boundary: CharacterKnowledgeBoundary): number | null {
  const blob = boundary.unknownDomains.join(" ");
  const m = blob.match(/after\s*~\s*(1[6-9]\d{2}|20\d{2})/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

function textSuggestsFutureVersusBoundary(text: string, boundary: CharacterKnowledgeBoundary): boolean {
  const ceiling = inferStoryYearCeilingFromBoundary(boundary);
  if (ceiling == null) return false;
  const re = /\b(1[6-9]\d{2}|20[0-9]{2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const y = parseInt(m[1], 10);
    if (y > ceiling + 5) return true;
  }
  return false;
}

/**
 * Claims prior conversational memory when no P2-G dyad row exists (no relationship-earned facts).
 */
function readerMemoryLeakageAbsentDyad(snapshot: ConversationalIdentitySnapshot, scan: string): boolean {
  if (snapshot.readerMemory != null) return false;
  return /\b(you (once )?told me|when you said|last time we spoke|as we discussed before|you mentioned earlier)\b/i.test(
    scan
  );
}

export type AssessCharacterResponsePolicyViolationsInput = {
  snapshot: ConversationalIdentitySnapshot;
  response: CharacterResponse;
  /**
   * Optional: combined raw lines before normalization (e.g. author-voice phrases stripped for output).
   * When set, scans are applied to both this and {@link CharacterResponse} text.
   */
  originalCombinedText?: string;
};

/**
 * Deterministic policy assessment for a candidate {@link CharacterResponse}.
 */
export function assessCharacterResponsePolicyViolations(
  input: AssessCharacterResponsePolicyViolationsInput
): CharacterResponsePolicyAssessment {
  const { snapshot, response, originalCombinedText } = input;
  const violations: CharacterResponsePolicyViolation[] = [];

  const fromResponse = combinedResponseText(response);
  const scan = [originalCombinedText?.trim(), fromResponse].filter(Boolean).join("\n\n");

  if (!policyFlagsSatisfied(snapshot)) {
    violations.push({
      code: "policy_flags_not_bounded",
      message: "Snapshot policy does not match bounded conversational baseline.",
    });
  }

  if (textSuggestsFutureVersusBoundary(scan, snapshot.knowledgeBoundary)) {
    violations.push({
      code: "future_knowledge_vs_boundary",
      message: "Calendar years or implied foreknowledge exceed inferred story-era ceiling.",
    });
  }

  if (containsAnySubstringCaseInsensitive(scan, OUT_OF_WORLD_TEACHING_SUBSTRINGS)) {
    violations.push({
      code: "out_of_world_teaching",
      message: "Out-of-world teaching or modern lecture posture detected.",
    });
  }

  if (containsAnySubstringCaseInsensitive(scan, OMNISCIENT_OR_META_SUBSTRINGS)) {
    violations.push({
      code: "omniscient_or_meta_voice",
      message: "Narrator/author/omniscient meta voice markers detected.",
    });
  }

  if (containsAnySubstringCaseInsensitive(scan, FUTURE_KNOWLEDGE_SUBSTRINGS)) {
    violations.push({
      code: "future_knowledge_vs_boundary",
      message: "Explicit future/modern anachronism markers detected.",
    });
  }

  if (containsAnySubstringCaseInsensitive(scan, TRANSLATION_COGNITION_CONFUSION)) {
    violations.push({
      code: "translation_cognition_confusion",
      message: "Translation or dubbing framed as cognition (presentation vs cognition confusion).",
    });
  }

  if (readerMemoryLeakageAbsentDyad(snapshot, scan)) {
    violations.push({
      code: "reader_memory_claim_without_dyad",
      message: "References prior reader disclosures with no P2-G relationship row for this pair.",
    });
  }

  const pass = violations.length === 0;
  return {
    pass,
    violations,
    suggestedDowngradeAction: pass ? "none" : "force_knowledge_uncertain",
  };
}
