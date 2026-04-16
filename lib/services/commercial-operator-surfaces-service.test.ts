import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOperatorCommercialReleaseSurface } from "@/lib/services/deployment-commercial-layer-service";

describe("commercial-operator-surfaces", () => {
  it("blocks wrong audience access to operator surfaces", () => {
    assert.throws(() =>
      buildOperatorCommercialReleaseSurface({
        surfaceId: "surface-1",
        currentReleaseState: "published",
        rolloutStatus: "stable",
        rollbackStatus: "available",
        catalogStatus: "healthy",
        entitlementIntegrationStatus: "ok",
        requestedAudience: "reader",
      })
    );
  });
});
