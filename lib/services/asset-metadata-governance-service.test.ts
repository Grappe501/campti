import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createEditorialIdentity,
  createEditorialWorkflow,
  createProjectModel,
  createPublishingPackage,
  createWorkspaceModel,
  recordEditorialApprovalEvidence,
  transitionEditorialWorkflowState,
  validateAssetMetadataGovernance,
} from "@/lib/services/creator-publishing-layer-service";

describe("asset-metadata-governance", () => {
  it("blocks orphan and non-approved asset/metadata references", () => {
    const workspace = createWorkspaceModel({ workspaceId: "ws-1", ownerIdentityId: "owner-1", name: "Workspace" });
    const project = createProjectModel({ projectId: "proj-1", workspace, ownerIdentityId: "owner-1", name: "Project" });
    const reviewer = createEditorialIdentity({ identityId: "rev-1", workspaceId: "ws-1", role: "reviewer" });
    let workflow = createEditorialWorkflow({
      workflowId: "wf-1",
      workspace,
      project,
      draftId: "draft-1",
      approvalRoles: ["reviewer"],
    });
    workflow = transitionEditorialWorkflowState({ workflow, targetState: "in_review" });
    workflow = recordEditorialApprovalEvidence({ workflow, reviewer, explanation: "reviewed" });
    workflow = transitionEditorialWorkflowState({ workflow, targetState: "approved" });
    const publishingPackage = createPublishingPackage({
      packageId: "pkg-1",
      workspace,
      project,
      workflow,
      versionReference: "v1",
      metadataReferenceIds: ["meta-1"],
      assetReferenceIds: ["asset-1"],
      releaseNotes: "notes",
      eligibilityChecks: ["contract_ok"],
    });

    assert.throws(() =>
      validateAssetMetadataGovernance({
        workspace,
        publishingPackage,
        assets: [],
        metadata: [],
      })
    );
  });
});
