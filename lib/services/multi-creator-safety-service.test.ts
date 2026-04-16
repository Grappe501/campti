import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createCollaborationBoundary,
  createCreatorIdentity,
  createWorkspaceModel,
  reassignCollaborationOwnership,
} from "@/lib/services/creator-publishing-layer-service";

describe("multi-creator-safety", () => {
  it("prevents unauthorized ownership reassignment", () => {
    const workspace = createWorkspaceModel({ workspaceId: "ws-1", ownerIdentityId: "owner-1", name: "Workspace" });
    const boundary = createCollaborationBoundary({
      boundaryId: "boundary-1",
      workspace,
      ownerships: [
        {
          ownershipId: "own-1",
          workspaceId: "ws-1",
          kind: "draft",
          resourceId: "draft-1",
          ownerIdentityId: "creator-1",
        },
      ],
    });

    const creator = createCreatorIdentity({
      identityId: "creator-2",
      workspaceId: "ws-1",
      role: "creator",
      displayName: "Creator Two",
    });

    assert.throws(() =>
      reassignCollaborationOwnership({
        boundary,
        resourceId: "draft-1",
        fromIdentityId: "creator-1",
        toIdentityId: "creator-2",
        requestedBy: creator,
      })
    );
  });
});
