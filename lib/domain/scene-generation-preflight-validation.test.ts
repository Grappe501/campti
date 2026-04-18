/**
 * Preflight action input validation (node:test).
 * Run: npx tsx --test lib/domain/scene-generation-preflight-validation.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SceneGenerationPreflightSceneIdSchema } from "@/lib/domain/scene-generation-preflight-validation";

describe("SceneGenerationPreflightSceneIdSchema", () => {
  it("rejects empty sceneId", () => {
    const r = SceneGenerationPreflightSceneIdSchema.safeParse({ sceneId: "   " });
    assert.equal(r.success, false);
  });

  it("accepts trimmed id", () => {
    const r = SceneGenerationPreflightSceneIdSchema.safeParse({ sceneId: "  sc_1  " });
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data.sceneId, "sc_1");
  });
});
