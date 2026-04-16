import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assembleRelease,
  createEditorialIdentity,
  createEditorialWorkflow,
  createProjectModel,
  createPublishingPackage,
  createWorkspaceModel,
  recordEditorialApprovalEvidence,
  transitionEditorialWorkflowState,
} from "@/lib/services/creator-publishing-layer-service";

describe("publishing-package", () => {
  it("requires approved editorial path before package creation", () => {
    const workspace = createWorkspaceModel({ workspaceId: "ws-1", ownerIdentityId: "owner-1", name: "Workspace" });
    const project = createProjectModel({ projectId: "proj-1", workspace, ownerIdentityId: "owner-1", name: "Project" });
    const workflow = createEditorialWorkflow({
      workflowId: "wf-1",
      workspace,
      project,
      draftId: "draft-1",
      approvalRoles: ["reviewer"],
    });
    assert.throws(() =>
      createPublishingPackage({
        packageId: "pkg-1",
        workspace,
        project,
        workflow,
        versionReference: "v1",
        metadataReferenceIds: ["meta-1"],
        assetReferenceIds: ["asset-1"],
        releaseNotes: "notes",
        eligibilityChecks: ["contract_ok"],
      })
    );
  });

  it("assembles release from approved package only", () => {
    const workspace = createWorkspaceModel({ workspaceId: "ws-1", ownerIdentityId: "owner-1", name: "Workspace" });
    const project = createProjectModel({ projectId: "proj-1", workspace, ownerIdentityId: "owner-1", name: "Project" });
    const reviewer = createEditorialIdentity({ identityId: "rev-1", workspaceId: "ws-1", role: "reviewer" });
    let workflow = createEditorialWorkflow({
      workflowId: "wf-2",
      workspace,
      project,
      draftId: "draft-2",
      approvalRoles: ["reviewer"],
    });
    workflow = transitionEditorialWorkflowState({ workflow, targetState: "in_review" });
    workflow = recordEditorialApprovalEvidence({ workflow, reviewer, explanation: "reviewed" });
    workflow = transitionEditorialWorkflowState({ workflow, targetState: "approved" });

    const publishingPackage = createPublishingPackage({
      packageId: "pkg-2",
      workspace,
      project,
      workflow,
      versionReference: "v2",
      metadataReferenceIds: ["meta-1"],
      assetReferenceIds: ["asset-1"],
      releaseNotes: "notes",
      eligibilityChecks: ["contract_ok"],
    });
    const assembly = assembleRelease({ releaseAssemblyId: "rel-1", publishingPackage });
    assert.equal(assembly.packageId, "pkg-2");
  });
});
