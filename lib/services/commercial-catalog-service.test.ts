import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addOfferToCatalog,
  createCommercialCatalog,
  transitionOfferState,
} from "@/lib/services/deployment-commercial-layer-service";

describe("commercial-catalog", () => {
  it("keeps narrative truth immutable and controls offer transitions", () => {
    let catalog = createCommercialCatalog({
      catalogId: "catalog-1",
      workspaceId: "ws-1",
    });
    assert.equal(catalog.narrativeTruthMutable, false);
    catalog = addOfferToCatalog({
      catalog,
      offerId: "offer-1",
      packageId: "pkg-1",
      state: "draft",
    });
    assert.throws(() => transitionOfferState({ catalog, offerId: "offer-1", targetState: "active" }));
  });
});
