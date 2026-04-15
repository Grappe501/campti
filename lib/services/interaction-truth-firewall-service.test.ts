/**
 * P3-S interaction truth firewall. Run: npx tsx --test lib/services/interaction-truth-firewall-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessMemoryBoundaryContamination,
  assertMemoryBoundary,
  assertSessionMetadataPatchWriteBoundary,
} from "@/lib/services/interaction-truth-firewall-service";

describe("interaction truth firewall", () => {
  it("blocks reader interaction memory mutating canonical truth", () => {
    const violations = assessMemoryBoundaryContamination({
      source: "reader_interaction_memory",
      target: "canonical_truth",
      payload: { disclosed_name: "Ari" },
    });
    assert.ok(violations.some((v) => v.code === "interaction_memory_to_canon_blocked"));
  });

  it("blocks author inspection notes mutating reader memory", () => {
    assert.throws(
      () =>
        assertMemoryBoundary({
          source: "author_inspection_notes",
          target: "reader_interaction_memory",
          payload: { internalThoughtVisibility: true },
        }),
      /author_notes_to_reader_memory_blocked/
    );
  });

  it("blocks interaction summaries being treated as historical truth", () => {
    const violations = assessMemoryBoundaryContamination({
      source: "interaction_summary",
      target: "canonical_truth",
      payload: { summaryLine: "Reader asked about the gate." },
    });
    assert.ok(violations.some((v) => v.code === "interaction_summary_to_canon_blocked"));
  });

  it("detects conversation artifacts injected into world-state truth sources", () => {
    const violations = assessMemoryBoundaryContamination({
      source: "reader_interaction_memory",
      target: "canonical_truth",
      payload: { worldStateTruth: "from chat transcript", canonicalFact: "..." },
    });
    assert.ok(violations.some((v) => v.code === "conversation_artifact_injected_into_canon"));
  });

  it("blocks product/account fields from reader interaction memory writes", () => {
    const violations = assessMemoryBoundaryContamination({
      source: "reader_interaction_memory",
      target: "reader_interaction_memory",
      payload: { entitlementPlan: "premium", remainingUnitBalance: 42 },
    });
    assert.ok(violations.some((v) => v.code === "product_account_field_in_reader_memory"));
  });

  it("blocks product/account source mutating canonical truth", () => {
    assert.throws(
      () =>
        assertMemoryBoundary({
          source: "product_account_truth",
          target: "canonical_truth",
          payload: { any: "value" },
        }),
      /product_truth_to_canon_blocked/
    );
  });

  it("rejects disallowed session metadata patch keys", () => {
    assert.throws(
      () =>
        assertSessionMetadataPatchWriteBoundary({
          source: "reader_interaction_memory",
          patch: { entitlement: { planType: "premium" } },
        }),
      /session_metadata_key_disallowed|product_account_field_in_reader_memory/
    );
  });
});
