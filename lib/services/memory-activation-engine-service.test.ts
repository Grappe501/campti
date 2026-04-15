/**
 * Phase 2 / Chunk 4 — Memory Activation Engine verification.
 * Run: npx tsx --test lib/services/memory-activation-engine-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  activateBoundedMemories,
  buildActivationCandidatesFromSources,
} from "@/lib/services/memory-activation-engine-service";

describe("memory-activation-engine-service", () => {
  it("enforces source restrictions by context/channel", () => {
    const candidates = buildActivationCandidatesFromSources({
      readerInteractionMemoryItems: [
        {
          memoryRefId: "reader-1",
          summaryToken: "reader disclosure about family debt",
          relevance: 88,
          emotionalIntensity: 67,
          recency: 76,
          unresolved: 64,
          relationshipLinkage: 72,
          shameFearSalience: 70,
          repetition: 28,
          suppressionPressure: 18,
        },
      ],
      canonicalLivedEvents: [
        {
          memoryRefId: "canon-1",
          summaryToken: "witnessed betrayal at market",
          relevance: 84,
          emotionalIntensity: 74,
          recency: 58,
          unresolved: 82,
          relationshipLinkage: 66,
          shameFearSalience: 63,
          repetition: 44,
          suppressionPressure: 20,
        },
      ],
    });

    const canonicalScene = activateBoundedMemories({
      context: "scene_mode",
      channel: "canonical_dyad",
      candidates,
    });
    assert.ok(canonicalScene.blockedSourceRefs.includes("reader-1"));
    assert.ok(canonicalScene.activatedMemories.every((m) => m.memoryRefId !== "reader-1"));
    assert.ok(canonicalScene.activatedMemories.some((m) => m.memoryRefId === "canon-1"));
  });

  it("is deterministic for identical inputs", () => {
    const candidates = buildActivationCandidatesFromSources({
      canonicalLivedEvents: [
        {
          memoryRefId: "canon-ev",
          summaryToken: "failed oath before witnesses",
          relevance: 73,
          emotionalIntensity: 78,
          recency: 64,
          unresolved: 80,
          relationshipLinkage: 71,
          shameFearSalience: 77,
          repetition: 35,
          suppressionPressure: 19,
        },
      ],
      emotionalContinuityAnchors: [
        {
          memoryRefId: "tone-anchor",
          summaryToken: "baseline remains wary and guarded",
          relevance: 66,
          emotionalIntensity: 55,
          recency: 80,
          unresolved: 45,
          relationshipLinkage: 60,
          shameFearSalience: 46,
          repetition: 52,
          suppressionPressure: 22,
        },
      ],
    });

    const outA = activateBoundedMemories({
      context: "interaction_mode",
      channel: "canonical_dyad",
      candidates,
    });
    const outB = activateBoundedMemories({
      context: "interaction_mode",
      channel: "canonical_dyad",
      candidates,
    });
    assert.deepEqual(outA, outB);
  });

  it("returns bounded activation modes including defensive and distorted outcomes", () => {
    const candidates = buildActivationCandidatesFromSources({
      characterBoundedRememberedEvents: [
        {
          memoryRefId: "avoid-1",
          summaryToken: "painful oath memory under social pressure",
          relevance: 84,
          emotionalIntensity: 75,
          recency: 68,
          unresolved: 79,
          relationshipLinkage: 74,
          shameFearSalience: 83,
          repetition: 32,
          suppressionPressure: 91,
        },
        {
          memoryRefId: "misattr-1",
          summaryToken: "fragmented association with uncertain source",
          relevance: 62,
          emotionalIntensity: 59,
          recency: 10,
          unresolved: 61,
          relationshipLinkage: 42,
          shameFearSalience: 86,
          repetition: 50,
          suppressionPressure: 73,
        },
      ],
    });

    const out = activateBoundedMemories({
      context: "interaction_mode",
      channel: "reader_bond_dyad",
      candidates,
    });

    const byRef = new Map(out.activatedMemories.map((m) => [m.memoryRefId, m]));
    assert.equal(byRef.get("avoid-1")?.activationMode, "defensive_avoidance");
    assert.equal(byRef.get("misattr-1")?.activationMode, "misattributed_association");
  });

  it("rejects prohibited truth-plane crossing into character cognition", () => {
    assert.throws(() =>
      activateBoundedMemories({
        context: "interaction_mode",
        channel: "reader_bond_dyad",
        candidates: [
          {
            memoryRefId: "product-leak",
            sourceType: "character_bounded_remembered_event",
            sourcePlane: "product_account_truth",
            summaryToken: "billing plan and entitlement state",
            contextualRelevance: 90,
            emotionalIntensity: 20,
            unresolvedStatus: 20,
            relationshipLinkage: 10,
            recency: 95,
            shameFearSalience: 5,
            repetition: 10,
            suppressionPressure: 1,
            socialRiskProxy: 15,
          },
        ],
      })
    );
  });

  it("caps activation output and avoids large memory payload dumping", () => {
    const longToken = "x".repeat(180);
    const candidates = Array.from({ length: 9 }).map((_, idx) => ({
      memoryRefId: `m-${idx + 1}`,
      sourceType: "canonical_lived_event" as const,
      sourcePlane: "canonical_truth" as const,
      summaryToken: `${longToken}-${idx}`,
      contextualRelevance: 90 - idx,
      emotionalIntensity: 80,
      unresolvedStatus: 72,
      relationshipLinkage: 69,
      recency: 67,
      shameFearSalience: 58,
      repetition: 36,
      suppressionPressure: 18,
      socialRiskProxy: 40,
    }));
    const out = activateBoundedMemories({
      context: "scene_mode",
      channel: "canonical_dyad",
      candidates,
    });

    assert.equal(out.activatedMemories.length, 6);
    assert.equal(out.memorySalienceCapApplied, true);
    assert.ok(out.activatedMemories.every((m) => m.summaryToken.length <= 80));
    assert.ok(out.activatedMemories.every((m) => !("rawPayload" in (m as unknown as Record<string, unknown>))));
  });
});
