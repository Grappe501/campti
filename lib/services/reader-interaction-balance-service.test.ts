/**
 * P3-H/P3-L operational hardening: explicit balance unavailable detection.
 * Run: npx tsx --test lib/services/reader-interaction-balance-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getReaderInteractionBalanceUnavailableReason,
  isReaderInteractionBalanceUnavailableError,
} from "@/lib/services/reader-interaction-balance-service";

describe("reader-interaction-balance unavailable detection", () => {
  it("detects unavailable error marker", () => {
    const error = new Error(
      "[reader-interaction-balance:unavailable] reason=schema_missing; detail=table missing"
    );
    assert.equal(isReaderInteractionBalanceUnavailableError(error), true);
    assert.equal(getReaderInteractionBalanceUnavailableReason(error), "schema_missing");
  });

  it("returns null reason for unrelated errors", () => {
    const error = new Error("other failure");
    assert.equal(isReaderInteractionBalanceUnavailableError(error), false);
    assert.equal(getReaderInteractionBalanceUnavailableReason(error), null);
  });
});
