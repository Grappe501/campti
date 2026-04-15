/**
 * P3-I — Lightweight bounded-mode conversation quality review (deterministic; no LLM eval framework).
 */

import type { CharacterResponse } from "@/lib/domain/character-response-contract";
import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import { assessCharacterResponsePolicyViolations } from "@/lib/services/character-response-guardrail-service";

export type ConversationQualitySeverity = "info" | "warn" | "fail";

export type ConversationQualityIssue = {
  code: string;
  severity: ConversationQualitySeverity;
  message: string;
  suggestedRemediation: string;
};

export type ConversationQualityReport = {
  pass: boolean;
  scoreBand: "green" | "amber" | "red";
  issues: ConversationQualityIssue[];
};

function pushIssue(
  issues: ConversationQualityIssue[],
  code: string,
  severity: ConversationQualitySeverity,
  message: string,
  suggestedRemediation: string
): void {
  issues.push({ code, severity, message, suggestedRemediation });
}

/**
 * Deterministic review of one bounded character turn vs snapshot policy + light coherence checks.
 */
export function reviewBoundedConversationTurn(input: {
  snapshot: ConversationalIdentitySnapshot;
  response: CharacterResponse;
  /** Short transcript lines for drift hints (bounded summaries, not canon). */
  recentTranscriptExcerpts: string[];
}): ConversationQualityReport {
  const issues: ConversationQualityIssue[] = [];

  const guard = assessCharacterResponsePolicyViolations({
    snapshot: input.snapshot,
    response: input.response,
    originalCombinedText: `${input.response.spokenResponse}\n${input.response.internalThought}`,
  });

  if (!guard.pass) {
    for (const v of guard.violations) {
      pushIssue(
        issues,
        v.code,
        "fail",
        v.message,
        "Regenerate with conservative bounded reply or force knowledge uncertain / strip meta voice."
      );
    }
  }

  const scan = `${input.response.spokenResponse}\n${input.response.internalThought}`.toLowerCase();
  if (/\b(author|god mode|debug panel|llm)\b/i.test(scan)) {
    pushIssue(
      issues,
      "modern_meta_surface",
      "warn",
      "Possible modern/meta tooling vocabulary in bounded voice.",
      "Prefer era-appropriate diction; keep author/debug vocabulary out of bounded dialogue."
    );
  }

  const mem = input.snapshot.readerMemory;
  if (
    mem == null &&
    /\b(you told me before|last time we spoke|as you said earlier)\b/i.test(input.response.spokenResponse)
  ) {
    pushIssue(
      issues,
      "relationship_memory_without_dyad",
      "fail",
      "Spoken line claims prior dyadic memory but no P2-G row exists.",
      "Remove implied continuity or establish relationship memory through policy-bound earn first."
    );
  }

  const excerptBlob = input.recentTranscriptExcerpts.join("\n").toLowerCase();
  if (excerptBlob.length > 20 && !excerptBlob.includes("reader") && input.recentTranscriptExcerpts.length >= 4) {
    pushIssue(
      issues,
      "transcript_context_thin",
      "info",
      "Transcript context is short or generic — emotional arc may be hard to verify.",
      "Optional: ensure session snapshot includes recent bounded summaries."
    );
  }

  const fail = issues.some((i) => i.severity === "fail");
  const warn = issues.some((i) => i.severity === "warn");
  const scoreBand: ConversationQualityReport["scoreBand"] = fail ? "red" : warn ? "amber" : "green";

  return {
    pass: !fail,
    scoreBand,
    issues,
  };
}
