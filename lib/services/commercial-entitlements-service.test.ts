import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addOfferToCatalog,
  createCommercialCatalog,
  resolveCommercialEntitlement,
  transitionOfferState,
} from "@/lib/services/deployment-commercial-layer-service";

describe("commercial-entitlements", () => {
  it("does not grant entitlements for non-active offers", () => {
    let catalog = createCommercialCatalog({ catalogId: "catalog-1", workspaceId: "ws-1" });
    catalog = addOfferToCatalog({ catalog, offerId: "offer-1", packageId: "pkg-1", state: "draft" });
    const inactiveResolution = resolveCommercialEntitlement({
      catalog,
      offerId: "offer-1",
      bridge: {
        bridgeId: "bridge-1",
        offerId: "offer-1",
        entitlementKey: "story:book-1",
        resolutionMode: "paid_unlock",
      },
    });
    assert.equal(inactiveResolution.granted, false);

    catalog = transitionOfferState({ catalog, offerId: "offer-1", targetState: "review" });
    catalog = transitionOfferState({ catalog, offerId: "offer-1", targetState: "active" });
    const activeResolution = resolveCommercialEntitlement({
      catalog,
      offerId: "offer-1",
      bridge: {
        bridgeId: "bridge-1",
        offerId: "offer-1",
        entitlementKey: "story:book-1",
        resolutionMode: "paid_unlock",
      },
    });
    assert.equal(activeResolution.granted, true);
  });
});
