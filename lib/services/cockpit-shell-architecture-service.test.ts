import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import { assertCockpitShellArchitecture } from "@/lib/services/cockpit-shell-architecture-service";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";

describe("cockpit-shell-architecture-service", () => {
  it("enforces centered surface and populated rails", () => {
    const bundle = buildAuthorCommandCockpitBundle({
      context: resolveCockpitScopeContext({ scope: "scene", sceneId: "scene-1" }),
      labels: { sceneLabel: "Opening beat" },
      metrics: {
        emotionalIntensity: 0.6,
        unresolvedPressure: 0.4,
      },
    });
    assert.doesNotThrow(() => assertCockpitShellArchitecture(bundle));
  });
});
