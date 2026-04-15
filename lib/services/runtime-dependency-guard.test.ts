/**
 * Runtime dependency guard classification tests.
 * Run: npx tsx --test lib/services/runtime-dependency-guard.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { classifyRuntimeDependencyFailure } from "@/lib/services/runtime-dependency-guard";

describe("classifyRuntimeDependencyFailure", () => {
  it("classifies schema dependency failures", () => {
    const out = classifyRuntimeDependencyFailure(
      new Error('[runtime-dependency:interaction-harness] missing tables: CharacterConversationSession')
    );
    assert.equal(out.kind, "schema_dependency_missing");
  });

  it("classifies seed-data failures", () => {
    const out = classifyRuntimeDependencyFailure(
      new Error("Need at least one scene and one person before running deterministic harness.")
    );
    assert.equal(out.kind, "seed_data_missing");
  });

  it("classifies unknown failures as runtime_failure", () => {
    const out = classifyRuntimeDependencyFailure(new Error("unexpected timeout while evaluating operation"));
    assert.equal(out.kind, "runtime_failure");
  });
});
