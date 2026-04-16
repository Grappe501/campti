import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createEditorialIdentity,
  createEditorialWorkflow,
  createProjectModel,
  createWorkspaceModel,
  recordEditorialApprovalEvidence,
  transitionEditorialWorkflowState,
} from "@/lib/services/creator-publishing-layer-service";

describe("editorial-workflow", () => {
  it("prevents release candidate transition without approval evidence", () => {
    const workspace = createWorkspaceModel({ workspaceId: "ws-1", ownerIdentityId: "owner-1", name: "Workspace" });
    const project = createProjectModel({ projectId: "proj-1", workspace, ownerIdentityId: "owner-1", name: "Project" });
    const workflow = createEditorialWorkflow({
      workflowId: "wf-1",
      workspace,
      project,
      draftId: "draft-1",
      approvalRoles: ["reviewer", "publisher"],
    });
    const inReview = transitionEditorialWorkflowState({ workflow, targetState: "in_review" });
    const approved = transitionEditorialWorkflowState({ workflow: inReview, targetState: "approved" });
    assert.throws(() => transitionEditorialWorkflowState({ workflow: approved, targetState: "release_candidate" }));
  });

  it("allows approved evidence chain to reach release candidate", () => {
    const workspace = createWorkspaceModel({ workspaceId: "ws-1", ownerIdentityId: "owner-1", name: "Workspace" });
    const project = createProjectModel({ projectId: "proj-1", workspace, ownerIdentityId: "owner-1", name: "Project" });
    const reviewer = createEditorialIdentity({ identityId: "rev-1", workspaceId: "ws-1", role: "reviewer" });
    const publisher = createEditorialIdentity({ identityId: "pub-1", workspaceId: "ws-1", role: "publisher" });

    let workflow = createEditorialWorkflow({
      workflowId: "wf-2",
      workspace,
      project,
      draftId: "draft-1",
      approvalRoles: ["reviewer", "publisher"],
    });
    workflow = transitionEditorialWorkflowState({ workflow, targetState: "in_review" });
    workflow = recordEditorialApprovalEvidence({ workflow, reviewer, explanation: "reviewed" });
    workflow = recordEditorialApprovalEvidence({ workflow, reviewer: publisher, explanation: "ready to publish" });
    workflow = transitionEditorialWorkflowState({ workflow, targetState: "approved" });
    workflow = transitionEditorialWorkflowState({ workflow, targetState: "release_candidate" });
    assert.equal(workflow.state, "release_candidate");
  });
});
