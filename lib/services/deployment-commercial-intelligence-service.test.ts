import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addOfferToCatalog,
  buildDeploymentCommercialIntelligence,
  buildReleaseHealth,
  createCommercialCatalog,
} from "@/lib/services/deployment-commercial-layer-service";

describe("deployment-commercial-intelligence", () => {
  it("keeps intelligence explainable and bounded", () => {
    let catalog = createCommercialCatalog({ catalogId: "catalog-1", workspaceId: "ws-1" });
    catalog = addOfferToCatalog({
      catalog,
      offerId: "offer-1",
      packageId: "pkg-1",
      state: "retired",
      bundleRefs: ["bundle-1"],
    });
    const health = buildReleaseHealth({
      healthId: "health-1",
      releaseVersion: "v1",
      deploymentEnvironment: "staging",
      signals: [
        {
          signalId: "signal-1",
          kind: "draft_leakage_risk",
          severity: "high",
          details: "candidate content visible",
        },
      ],
    });
    const intelligence = buildDeploymentCommercialIntelligence({
      intelligenceId: "intel-1",
      releaseHealth: health,
      catalog,
    });
    assert.equal(intelligence.explainable, true);
    assert.equal(intelligence.bounded, true);
    assert.equal(intelligence.rollbackSuggestion.length > 0, true);
  });
});
