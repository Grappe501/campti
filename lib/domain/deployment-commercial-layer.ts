export const DEPLOYMENT_COMMERCIAL_CONTRACT_VERSION = "1" as const;

export const DEPLOYMENT_ENVIRONMENT_TYPES = ["local", "development", "staging", "production"] as const;
export type DeploymentEnvironmentType = (typeof DEPLOYMENT_ENVIRONMENT_TYPES)[number];

export type DeploymentEnvironment = {
  environmentId: string;
  environmentType: DeploymentEnvironmentType;
  protected: boolean;
  promotionTargets: DeploymentEnvironmentType[];
};

export type RolloutControl = {
  rolloutId: string;
  packageId: string;
  releaseVersion: string;
  currentEnvironment: DeploymentEnvironmentType;
  promoted: boolean;
};

export type RollbackControl = {
  rollbackId: string;
  rolloutId: string;
  fromVersion: string;
  toVersion: string;
  reason: string;
};

export const COMMERCIAL_OFFER_STATES = ["draft", "review", "active", "paused", "retired"] as const;
export type CommercialOfferState = (typeof COMMERCIAL_OFFER_STATES)[number];

export type CommercialOffer = {
  offerId: string;
  catalogId: string;
  packageId: string;
  state: CommercialOfferState;
  membership: boolean;
  bundleRefs: string[];
  paidUnlock: boolean;
};

export type CommercialCatalog = {
  catalogId: string;
  workspaceId: string;
  offers: CommercialOffer[];
  narrativeTruthMutable: false;
};

export type EntitlementCommercialBridge = {
  bridgeId: string;
  offerId: string;
  entitlementKey: string;
  resolutionMode: "membership" | "bundle" | "limited_access" | "paid_unlock";
};

export type ReleaseHealthSignal = {
  signalId: string;
  kind:
    | "version_mismatch"
    | "draft_leakage_risk"
    | "rollout_anomaly"
    | "entitlement_mismatch"
    | "public_surface_inconsistency";
  severity: "low" | "medium" | "high";
  details: string;
};

export type ReleaseHealth = {
  healthId: string;
  releaseVersion: string;
  deploymentEnvironment: DeploymentEnvironmentType;
  signals: ReleaseHealthSignal[];
  actionabilitySummary: string[];
};

export type OperatorCommercialReleaseSurface = {
  surfaceId: string;
  audience: "operator";
  currentReleaseState: string;
  rolloutStatus: string;
  rollbackStatus: string;
  catalogStatus: string;
  entitlementIntegrationStatus: string;
};

export type DeploymentCommercialIntelligence = {
  intelligenceId: string;
  explainable: true;
  bounded: true;
  actionHints: string[];
  rolloutCaution: string[];
  rollbackSuggestion: string[];
  catalogMismatch: string[];
  offerCleanup: string[];
  entitlementConflictWarnings: string[];
};
