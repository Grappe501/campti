/**
 * P3-D reader cockpit command surface. Run: npx tsx --test lib/services/reader-cockpit-command-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import {
  cockpitFailure,
  cockpitStartConversationFromScene,
  cockpitSuccess,
  extractLatestCharacterResponseFromTurns,
  isDegradedFreeTurnLimitReached,
  mapFallbackCauseToUnavailableReason,
  shouldTerminateSessionFromModeration,
  shouldDebitInteractionUnitsForDegradedPolicy,
} from "@/lib/services/reader-cockpit-command-service";

describe("cockpit API envelopes", () => {
  it("cockpitSuccess wraps data", () => {
    const r = cockpitSuccess({ x: 1 });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.data.x, 1);
  });

  it("cockpitFailure carries code", () => {
    const r = cockpitFailure("validation_error", "bad");
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error.code, "validation_error");
      assert.equal(r.error.message, "bad");
    }
  });
});

describe("extractLatestCharacterResponseFromTurns", () => {
  it("returns the latest character payload", () => {
    const turns: CharacterConversationTurn[] = [
      {
        id: "a",
        sessionId: "s",
        orderIndex: 0,
        speakerType: "reader",
        payloadJson: { readerText: "Hi" },
        createdAt: new Date(),
      },
      {
        id: "b",
        sessionId: "s",
        orderIndex: 1,
        speakerType: "character",
        payloadJson: {
          contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
          spokenResponse: "Hello.",
          internalThought: "",
          knowledgeSource: "uncertain",
          emotionalTone: "neutral",
        },
        createdAt: new Date(),
      },
    ];
    const latest = extractLatestCharacterResponseFromTurns(turns);
    assert.ok(latest);
    assert.equal(latest!.spokenResponse, "Hello.");
  });
});

describe("cockpitStartConversationFromScene (validation only)", () => {
  it("returns validation_error when ids missing", async () => {
    const out = await cockpitStartConversationFromScene({
      readerId: "",
      characterId: "c",
      sceneId: "s",
    });
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.error.code, "validation_error");
  });
});

describe("degraded interaction debit policy", () => {
  it("never debits units in degraded free/fallback policies", () => {
    assert.equal(shouldDebitInteractionUnitsForDegradedPolicy(null), true);
    assert.equal(shouldDebitInteractionUnitsForDegradedPolicy("allow_system_fallback_only"), false);
    assert.equal(shouldDebitInteractionUnitsForDegradedPolicy("allow_limited_free_turns"), false);
    assert.equal(shouldDebitInteractionUnitsForDegradedPolicy("allow_read_only"), false);
    assert.equal(shouldDebitInteractionUnitsForDegradedPolicy("blocked_all"), false);
  });
});

describe("degraded fallback classification", () => {
  it("keeps provider resilience separate from moderation/cost fallback reasons", () => {
    assert.equal(mapFallbackCauseToUnavailableReason("provider_resilience"), "provider_failure");
    assert.equal(mapFallbackCauseToUnavailableReason("moderation"), "unknown_runtime_unavailable");
    assert.equal(mapFallbackCauseToUnavailableReason("cost_governance"), "unknown_runtime_unavailable");
  });

  it("detects free-turn cap consistently for degraded policies", () => {
    assert.equal(
      isDegradedFreeTurnLimitReached({
        policy: "allow_system_fallback_only",
        usedFreeTurns: 0,
      }),
      false
    );
    assert.equal(
      isDegradedFreeTurnLimitReached({
        policy: "allow_system_fallback_only",
        usedFreeTurns: 1,
      }),
      true
    );
  });
});

describe("moderation termination mapping", () => {
  it("terminates only when moderation marks end-session severity", () => {
    assert.equal(
      shouldTerminateSessionFromModeration({
        action: "block",
        reason: "policy_blocked_content",
        shouldEndSession: true,
      }),
      true
    );
    assert.equal(
      shouldTerminateSessionFromModeration({
        action: "block",
        reason: "empty_input",
        shouldEndSession: false,
      }),
      false
    );
  });
});
