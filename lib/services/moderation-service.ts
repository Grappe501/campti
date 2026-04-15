/**
 * P4-G — Input moderation and abuse handling.
 * Keeps moderation internals out of character response payloads.
 */
export type ModerationAction = "allow" | "warn" | "degrade" | "block" | "end_session";

export type ModerationEvaluation = {
  action: ModerationAction;
  reason: string | null;
  shouldEndSession: boolean;
};

const BLOCK_PATTERNS = [
  /kill yourself/i,
  /bomb\s+instructions/i,
  /how\s+to\s+make\s+a\s+bomb/i,
  /child\s+sexual/i,
];

const DEGRADE_PATTERNS = [
  /ignore\s+all\s+previous\s+instructions/i,
  /reveal\s+your\s+system\s+prompt/i,
  /show\s+internal\s+thought/i,
  /break\s+character/i,
];

const WARN_PATTERNS = [
  /hate\s+you/i,
  /stupid\s+system/i,
];

export function evaluateReaderModeration(text: string): ModerationEvaluation {
  const input = text.trim();
  if (!input) {
    return {
      action: "block",
      reason: "empty_input",
      shouldEndSession: false,
    };
  }
  if (BLOCK_PATTERNS.some((rx) => rx.test(input))) {
    return {
      action: "block",
      reason: "policy_blocked_content",
      shouldEndSession: true,
    };
  }
  if (DEGRADE_PATTERNS.some((rx) => rx.test(input))) {
    return {
      action: "degrade",
      reason: "prompt_attack_detected",
      shouldEndSession: false,
    };
  }
  if (WARN_PATTERNS.some((rx) => rx.test(input))) {
    return {
      action: "warn",
      reason: "abusive_language_warning",
      shouldEndSession: false,
    };
  }
  return {
    action: "allow",
    reason: null,
    shouldEndSession: false,
  };
}

