import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertWorkspaceIsolation,
  createCreatorIdentity,
  createProjectModel,
  createWorkspaceModel,
} from "@/lib/services/creator-publishing-layer-service";

describe("workspace-project-model", () => {
  it("enforces workspace isolation for project access", () => {
    const workspace = createWorkspaceModel({
      workspaceId: "ws-1",
      ownerIdentityId: "owner-1",
      name: "Workspace One",
    });
    const project = createProjectModel({
      projectId: "proj-1",
      workspace,
      ownerIdentityId: "owner-1",
      name: "Project One",
    });
    const outsider = createCreatorIdentity({
      identityId: "creator-2",
      workspaceId: "ws-2",
      role: "creator",
      displayName: "Outsider",
    });
    assert.throws(() => assertWorkspaceIsolation({ workspace, project, identity: outsider }));
  });
});
