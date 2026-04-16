export const CREATOR_PUBLISHING_CONTRACT_VERSION = "1" as const;

export const CREATOR_PLATFORM_ROLES = [
  "owner",
  "creator",
  "editor",
  "reviewer",
  "publisher",
  "operator",
  "admin",
] as const;
export type CreatorPlatformRole = (typeof CREATOR_PLATFORM_ROLES)[number];

export const CREATOR_PERMISSION_SCOPES = [
  "story_access",
  "draft_access",
  "review_authority",
  "publishing_authority",
  "release_authority",
] as const;
export type CreatorPermissionScope = (typeof CREATOR_PERMISSION_SCOPES)[number];

export type CreatorIdentity = {
  identityId: string;
  workspaceId: string;
  role: CreatorPlatformRole;
  displayName: string;
  active: boolean;
};

export type EditorialIdentity = {
  identityId: string;
  workspaceId: string;
  role: Extract<CreatorPlatformRole, "editor" | "reviewer" | "publisher" | "owner" | "admin">;
  canApprove: boolean;
  canRequestChanges: boolean;
};

export type Workspace = {
  workspaceId: string;
  ownerIdentityId: string;
  name: string;
  bookIds: string[];
  draftIds: string[];
  productionStateIds: string[];
  publishingStateIds: string[];
  assetIds: string[];
  metadataIds: string[];
};

export type Project = {
  projectId: string;
  workspaceId: string;
  ownerIdentityId: string;
  name: string;
  bookIds: string[];
};

export type CatalogOwnership = {
  workspaceId: string;
  projectId: string;
  bookId: string;
  ownerIdentityId: string;
};

export const EDITORIAL_REVIEW_STATES = [
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "release_candidate",
  "rejected",
] as const;
export type EditorialReviewState = (typeof EDITORIAL_REVIEW_STATES)[number];

export type ApprovalEvidence = {
  evidenceId: string;
  reviewerIdentityId: string;
  explanation: string;
  createdAtIso: string;
};

export type ApprovalStep = {
  role: Extract<CreatorPlatformRole, "editor" | "reviewer" | "publisher" | "owner" | "admin">;
  approvedByIdentityId?: string;
  approvedAtIso?: string;
};

export type EditorialWorkflow = {
  workflowId: string;
  workspaceId: string;
  projectId: string;
  draftId: string;
  state: EditorialReviewState;
  approvalChain: ApprovalStep[];
  evidence: ApprovalEvidence[];
};

export type PublishingPackage = {
  packageId: string;
  workspaceId: string;
  projectId: string;
  sourceWorkflowId: string;
  versionReference: string;
  metadataReferenceIds: string[];
  assetReferenceIds: string[];
  releaseNotes: string;
  eligibilityChecks: string[];
  approvedForPublication: boolean;
};

export type ReleaseAssembly = {
  releaseAssemblyId: string;
  packageId: string;
  versionReference: string;
  assembledAtIso: string;
  rollbackVersionReference?: string;
};

export type AssetGovernance = {
  assetId: string;
  workspaceId: string;
  ownerIdentityId: string;
  approved: boolean;
  lifecycleState: "draft" | "approved" | "retired";
};

export type MetadataGovernance = {
  metadataId: string;
  workspaceId: string;
  ownerIdentityId: string;
  title: string;
  description: string;
  summary: string;
  coverMediaRef: string;
  contentLabels: string[];
  publishingMetadata: Record<string, string>;
  approved: boolean;
  lifecycleState: "draft" | "approved" | "retired";
};

export type CollaborationOwnershipKind = "book" | "project" | "draft" | "review" | "release";

export type CollaborationOwnership = {
  ownershipId: string;
  workspaceId: string;
  kind: CollaborationOwnershipKind;
  resourceId: string;
  ownerIdentityId: string;
};

export type CollaborationBoundary = {
  boundaryId: string;
  workspaceId: string;
  ownerships: CollaborationOwnership[];
};

export type PublicPublicationSurface = {
  publicationId: string;
  workspaceId: string;
  bookId: string;
  packageId: string;
  versionReference: string;
  visibility: "public" | "limited";
  allowCandidateExposure: boolean;
};
