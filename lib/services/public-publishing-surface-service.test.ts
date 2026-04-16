import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createEditorialIdentity,
  createEditorialWorkflow,
  createProjectModel,
  createPublishingPackage,
  createWorkspaceModel,
  recordEditorialApprovalEvidence,
  resolvePublicPublication,
  transitionEditorialWorkflowState,
} from "@/lib/services/creator-publishing-layer-service";

describe("public-publishing-surfaces", () => {
  it("blocks draft and unauthorized candidate leakage", () => {
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
    const publicationSurface = {
      publicationId: "pub-1",
      workspaceId: "ws-1",
      bookId: "book-1",
      packageId: "pkg-1",
      versionReference: "v1",
      visibility: "public" as const,
      allowCandidateExposure: false,
    };

    assert.throws(() =>
      resolvePublicPublication({
        publicationSurface,
        publishingPackage,
        releaseState: "draft",
      })
    );
    assert.throws(() =>
      resolvePublicPublication({
        publicationSurface,
        publishingPackage,
        releaseState: "candidate",
      })
    );
  });
});
