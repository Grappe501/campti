import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertCreatorPermission,
  createCreatorIdentity,
  createEditorialIdentity,
} from "@/lib/services/creator-publishing-layer-service";

describe("creator-identity-roles", () => {
  it("blocks implicit role elevation for creator review authority", () => {
    const creator = createCreatorIdentity({
      identityId: "creator-1",
      workspaceId: "ws-1",
      role: "creator",
      displayName: "Creator One",
    });
    assert.throws(() => assertCreatorPermission({ identity: creator, requiredPermission: "review_authority" }));
  });

  it("allows reviewer authority for editorial reviewer role", () => {
    const reviewer = createEditorialIdentity({
      identityId: "reviewer-1",
      workspaceId: "ws-1",
      role: "reviewer",
    });
    assert.doesNotThrow(() => assertCreatorPermission({ identity: reviewer, requiredPermission: "review_authority" }));
  });
});
