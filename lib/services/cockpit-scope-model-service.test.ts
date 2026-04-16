import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { listAvailableScopeEscalations, resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";

describe("cockpit-scope-model-service", () => {
  it("requires corresponding identifiers per scope", () => {
    assert.throws(() => resolveCockpitScopeContext({ scope: "scene" }));
    assert.throws(() => resolveCockpitScopeContext({ scope: "chapter" }));
    assert.throws(() => resolveCockpitScopeContext({ scope: "book" }));
    assert.throws(() => resolveCockpitScopeContext({ scope: "epic" }));
  });

  it("provides coherent escalation chain", () => {
    assert.deepEqual(listAvailableScopeEscalations("scene"), ["chapter", "book", "epic"]);
    assert.deepEqual(listAvailableScopeEscalations("chapter"), ["book", "epic"]);
  });
});
