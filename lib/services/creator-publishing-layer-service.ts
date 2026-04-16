import type {
  AssetGovernance,
  CollaborationBoundary,
  CollaborationOwnership,
  CreatorIdentity,
  CreatorPermissionScope,
  CreatorPlatformRole,
  EditorialIdentity,
  EditorialReviewState,
  EditorialWorkflow,
  MetadataGovernance,
  Project,
  PublicPublicationSurface,
  PublishingPackage,
  ReleaseAssembly,
  Workspace,
} from "@/lib/domain/creator-publishing-layer";

const ROLE_PERMISSIONS: Record<CreatorPlatformRole, CreatorPermissionScope[]> = {
  owner: ["story_access", "draft_access", "review_authority", "publishing_authority", "release_authority"],
  creator: ["story_access", "draft_access"],
  editor: ["story_access", "draft_access", "review_authority"],
  reviewer: ["story_access", "review_authority"],
  publisher: ["story_access", "publishing_authority", "release_authority"],
  operator: ["release_authority"],
  admin: ["story_access", "draft_access", "review_authority", "publishing_authority", "release_authority"],
};

function normalizeId(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`[creator-publishing-layer] ${fieldName} is required.`);
  }
  return normalized;
}

export function createCreatorIdentity(input: {
  identityId: string;
  workspaceId: string;
  role: CreatorPlatformRole;
  displayName: string;
  active?: boolean;
}): CreatorIdentity {
  return {
    identityId: normalizeId(input.identityId, "identityId"),
    workspaceId: normalizeId(input.workspaceId, "workspaceId"),
    role: input.role,
    displayName: normalizeId(input.displayName, "displayName"),
    active: input.active ?? true,
  };
}

export function createEditorialIdentity(input: {
  identityId: string;
  workspaceId: string;
  role: EditorialIdentity["role"];
  canApprove?: boolean;
  canRequestChanges?: boolean;
}): EditorialIdentity {
  return {
    identityId: normalizeId(input.identityId, "identityId"),
    workspaceId: normalizeId(input.workspaceId, "workspaceId"),
    role: input.role,
    canApprove: input.canApprove ?? true,
    canRequestChanges: input.canRequestChanges ?? true,
  };
}

export function assertCreatorPermission(input: {
  identity: CreatorIdentity | EditorialIdentity;
  requiredPermission: CreatorPermissionScope;
}): void {
  const permissions = ROLE_PERMISSIONS[input.identity.role];
  if (!permissions.includes(input.requiredPermission)) {
    throw new Error(
      `[creator-publishing-layer] role ${input.identity.role} missing permission ${input.requiredPermission}.`
    );
  }
}

export function createWorkspaceModel(input: {
  workspaceId: string;
  ownerIdentityId: string;
  name: string;
}): Workspace {
  return {
    workspaceId: normalizeId(input.workspaceId, "workspaceId"),
    ownerIdentityId: normalizeId(input.ownerIdentityId, "ownerIdentityId"),
    name: normalizeId(input.name, "workspace.name"),
    bookIds: [],
    draftIds: [],
    productionStateIds: [],
    publishingStateIds: [],
    assetIds: [],
    metadataIds: [],
  };
}

export function createProjectModel(input: {
  projectId: string;
  workspace: Workspace;
  ownerIdentityId: string;
  name: string;
}): Project {
  return {
    projectId: normalizeId(input.projectId, "projectId"),
    workspaceId: input.workspace.workspaceId,
    ownerIdentityId: normalizeId(input.ownerIdentityId, "ownerIdentityId"),
    name: normalizeId(input.name, "project.name"),
    bookIds: [],
  };
}

export function assertWorkspaceIsolation(input: {
  workspace: Workspace;
  project: Project;
  identity: CreatorIdentity | EditorialIdentity;
}): void {
  if (input.project.workspaceId !== input.workspace.workspaceId) {
    throw new Error("[creator-publishing-layer] project workspace mismatch.");
  }
  if (input.identity.workspaceId !== input.workspace.workspaceId) {
    throw new Error("[creator-publishing-layer] cross-workspace access denied.");
  }
}

export function createEditorialWorkflow(input: {
  workflowId: string;
  workspace: Workspace;
  project: Project;
  draftId: string;
  approvalRoles: EditorialIdentity["role"][];
}): EditorialWorkflow {
  assertWorkspaceIsolation({
    workspace: input.workspace,
    project: input.project,
    identity: createEditorialIdentity({
      identityId: input.workspace.ownerIdentityId,
      workspaceId: input.workspace.workspaceId,
      role: "owner",
    }),
  });
  return {
    workflowId: normalizeId(input.workflowId, "workflowId"),
    workspaceId: input.workspace.workspaceId,
    projectId: input.project.projectId,
    draftId: normalizeId(input.draftId, "draftId"),
    state: "draft",
    approvalChain: input.approvalRoles.map((role) => ({ role })),
    evidence: [],
  };
}

const ALLOWED_STATE_TRANSITIONS: Record<EditorialReviewState, EditorialReviewState[]> = {
  draft: ["in_review", "rejected"],
  in_review: ["changes_requested", "approved", "rejected"],
  changes_requested: ["in_review", "rejected"],
  approved: ["release_candidate", "rejected"],
  release_candidate: ["approved", "rejected"],
  rejected: [],
};

export function transitionEditorialWorkflowState(input: {
  workflow: EditorialWorkflow;
  targetState: EditorialReviewState;
}): EditorialWorkflow {
  const allowed = ALLOWED_STATE_TRANSITIONS[input.workflow.state];
  if (!allowed.includes(input.targetState)) {
    throw new Error(
      `[creator-publishing-layer] illegal editorial transition ${input.workflow.state} -> ${input.targetState}.`
    );
  }
  if (input.targetState === "release_candidate" && !input.workflow.approvalChain.every((step) => step.approvedByIdentityId)) {
    throw new Error("[creator-publishing-layer] release_candidate requires full approval chain.");
  }
  return {
    ...input.workflow,
    state: input.targetState,
  };
}

export function recordEditorialApprovalEvidence(input: {
  workflow: EditorialWorkflow;
  reviewer: EditorialIdentity;
  explanation: string;
  approvedAtIso?: string;
}): EditorialWorkflow {
  try {
    assertCreatorPermission({ identity: input.reviewer, requiredPermission: "review_authority" });
  } catch {
    assertCreatorPermission({ identity: input.reviewer, requiredPermission: "publishing_authority" });
  }
  const explanation = normalizeId(input.explanation, "approval.explanation");
  const approvalStepIndex = input.workflow.approvalChain.findIndex(
    (step) => step.role === input.reviewer.role && !step.approvedByIdentityId
  );
  if (approvalStepIndex < 0) {
    throw new Error("[creator-publishing-layer] reviewer role not found in pending approval chain.");
  }

  const approvalChain = [...input.workflow.approvalChain];
  approvalChain[approvalStepIndex] = {
    ...approvalChain[approvalStepIndex],
    approvedByIdentityId: input.reviewer.identityId,
    approvedAtIso: input.approvedAtIso ?? new Date().toISOString(),
  };

  return {
    ...input.workflow,
    approvalChain,
    evidence: [
      ...input.workflow.evidence,
      {
        evidenceId: `approval-${input.workflow.workflowId}-${input.workflow.evidence.length + 1}`,
        reviewerIdentityId: input.reviewer.identityId,
        explanation,
        createdAtIso: input.approvedAtIso ?? new Date().toISOString(),
      },
    ],
  };
}

export function createPublishingPackage(input: {
  packageId: string;
  workspace: Workspace;
  project: Project;
  workflow: EditorialWorkflow;
  versionReference: string;
  metadataReferenceIds: string[];
  assetReferenceIds: string[];
  releaseNotes: string;
  eligibilityChecks: string[];
}): PublishingPackage {
  assertWorkspaceIsolation({
    workspace: input.workspace,
    project: input.project,
    identity: createCreatorIdentity({
      identityId: input.workspace.ownerIdentityId,
      workspaceId: input.workspace.workspaceId,
      role: "owner",
      displayName: "workspace-owner",
    }),
  });
  if (!["approved", "release_candidate"].includes(input.workflow.state)) {
    throw new Error("[creator-publishing-layer] publishing package requires approved or release_candidate workflow.");
  }
  return {
    packageId: normalizeId(input.packageId, "packageId"),
    workspaceId: input.workspace.workspaceId,
    projectId: input.project.projectId,
    sourceWorkflowId: input.workflow.workflowId,
    versionReference: normalizeId(input.versionReference, "versionReference"),
    metadataReferenceIds: input.metadataReferenceIds.map((ref) => normalizeId(ref, "metadataReferenceId")),
    assetReferenceIds: input.assetReferenceIds.map((ref) => normalizeId(ref, "assetReferenceId")),
    releaseNotes: normalizeId(input.releaseNotes, "releaseNotes"),
    eligibilityChecks: input.eligibilityChecks.map((check) => normalizeId(check, "eligibilityCheck")),
    approvedForPublication: true,
  };
}

export function assembleRelease(input: {
  releaseAssemblyId: string;
  publishingPackage: PublishingPackage;
  rollbackVersionReference?: string;
  assembledAtIso?: string;
}): ReleaseAssembly {
  if (!input.publishingPackage.approvedForPublication) {
    throw new Error("[creator-publishing-layer] cannot assemble release from non-approved package.");
  }
  return {
    releaseAssemblyId: normalizeId(input.releaseAssemblyId, "releaseAssemblyId"),
    packageId: input.publishingPackage.packageId,
    versionReference: input.publishingPackage.versionReference,
    assembledAtIso: input.assembledAtIso ?? new Date().toISOString(),
    rollbackVersionReference: input.rollbackVersionReference?.trim() || undefined,
  };
}

export function validateAssetMetadataGovernance(input: {
  workspace: Workspace;
  publishingPackage: PublishingPackage;
  assets: AssetGovernance[];
  metadata: MetadataGovernance[];
}): void {
  const assetMap = new Map(input.assets.map((asset) => [asset.assetId, asset]));
  const metadataMap = new Map(input.metadata.map((entry) => [entry.metadataId, entry]));

  for (const ref of input.publishingPackage.assetReferenceIds) {
    const asset = assetMap.get(ref);
    if (!asset) {
      throw new Error(`[creator-publishing-layer] orphan asset reference ${ref}.`);
    }
    if (asset.workspaceId !== input.workspace.workspaceId || !asset.approved || asset.lifecycleState !== "approved") {
      throw new Error(`[creator-publishing-layer] asset ${ref} is not workspace-safe and approved.`);
    }
  }

  for (const ref of input.publishingPackage.metadataReferenceIds) {
    const entry = metadataMap.get(ref);
    if (!entry) {
      throw new Error(`[creator-publishing-layer] orphan metadata reference ${ref}.`);
    }
    if (
      entry.workspaceId !== input.workspace.workspaceId ||
      !entry.approved ||
      entry.lifecycleState !== "approved" ||
      !entry.title.trim() ||
      !entry.description.trim() ||
      !entry.summary.trim() ||
      !entry.coverMediaRef.trim()
    ) {
      throw new Error(`[creator-publishing-layer] metadata ${ref} is invalid or non-approved.`);
    }
  }
}

export function createCollaborationBoundary(input: {
  boundaryId: string;
  workspace: Workspace;
  ownerships: CollaborationOwnership[];
}): CollaborationBoundary {
  for (const ownership of input.ownerships) {
    if (ownership.workspaceId !== input.workspace.workspaceId) {
      throw new Error("[creator-publishing-layer] collaboration ownership crosses workspace boundary.");
    }
  }
  return {
    boundaryId: normalizeId(input.boundaryId, "boundaryId"),
    workspaceId: input.workspace.workspaceId,
    ownerships: [...input.ownerships],
  };
}

export function reassignCollaborationOwnership(input: {
  boundary: CollaborationBoundary;
  resourceId: string;
  fromIdentityId: string;
  toIdentityId: string;
  requestedBy: CreatorIdentity | EditorialIdentity;
}): CollaborationBoundary {
  assertCreatorPermission({ identity: input.requestedBy, requiredPermission: "release_authority" });
  const resourceId = normalizeId(input.resourceId, "resourceId");
  const fromIdentityId = normalizeId(input.fromIdentityId, "fromIdentityId");
  const toIdentityId = normalizeId(input.toIdentityId, "toIdentityId");

  let found = false;
  const ownerships = input.boundary.ownerships.map((ownership) => {
    if (ownership.resourceId !== resourceId) {
      return ownership;
    }
    if (ownership.ownerIdentityId !== fromIdentityId) {
      throw new Error(`[creator-publishing-layer] ownership mismatch for ${resourceId}.`);
    }
    found = true;
    return {
      ...ownership,
      ownerIdentityId: toIdentityId,
    };
  });

  if (!found) {
    throw new Error(`[creator-publishing-layer] resource ${resourceId} not found in collaboration boundary.`);
  }

  return {
    ...input.boundary,
    ownerships,
  };
}

export function resolvePublicPublication(input: {
  publicationSurface: PublicPublicationSurface;
  publishingPackage: PublishingPackage;
  releaseState: "draft" | "candidate" | "published" | "archived";
}): {
  publicationId: string;
  bookId: string;
  versionReference: string;
  metadataReferenceIds: string[];
  assetReferenceIds: string[];
} {
  if (input.publicationSurface.workspaceId !== input.publishingPackage.workspaceId) {
    throw new Error("[creator-publishing-layer] public publication workspace mismatch.");
  }
  if (!input.publishingPackage.approvedForPublication) {
    throw new Error("[creator-publishing-layer] public publication requires approved package.");
  }
  if (input.releaseState === "draft") {
    throw new Error("[creator-publishing-layer] draft leakage blocked.");
  }
  if (input.releaseState === "candidate" && !input.publicationSurface.allowCandidateExposure) {
    throw new Error("[creator-publishing-layer] candidate leakage blocked.");
  }
  if (input.releaseState === "archived") {
    throw new Error("[creator-publishing-layer] archived release is not publicly resolvable.");
  }
  return {
    publicationId: input.publicationSurface.publicationId,
    bookId: input.publicationSurface.bookId,
    versionReference: input.publishingPackage.versionReference,
    metadataReferenceIds: [...input.publishingPackage.metadataReferenceIds],
    assetReferenceIds: [...input.publishingPackage.assetReferenceIds],
  };
}
