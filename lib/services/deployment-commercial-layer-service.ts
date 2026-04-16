import type {
  CommercialCatalog,
  CommercialOffer,
  CommercialOfferState,
  DeploymentCommercialIntelligence,
  DeploymentEnvironment,
  DeploymentEnvironmentType,
  EntitlementCommercialBridge,
  OperatorCommercialReleaseSurface,
  ReleaseHealth,
  ReleaseHealthSignal,
  RollbackControl,
  RolloutControl,
} from "@/lib/domain/deployment-commercial-layer";

function requireValue(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`[deployment-commercial-layer] ${fieldName} is required.`);
  }
  return normalized;
}

const ALLOWED_PROMOTION_PATH: Record<DeploymentEnvironmentType, DeploymentEnvironmentType[]> = {
  local: ["development"],
  development: ["staging"],
  staging: ["production"],
  production: [],
};

const PROTECTED_ENVIRONMENTS: DeploymentEnvironmentType[] = ["staging", "production"];

export function createDeploymentEnvironment(input: {
  environmentId: string;
  environmentType: DeploymentEnvironmentType;
}): DeploymentEnvironment {
  return {
    environmentId: requireValue(input.environmentId, "environmentId"),
    environmentType: input.environmentType,
    protected: PROTECTED_ENVIRONMENTS.includes(input.environmentType),
    promotionTargets: ALLOWED_PROMOTION_PATH[input.environmentType],
  };
}

export function assertEnvironmentPromotionAllowed(input: {
  fromEnvironment: DeploymentEnvironment;
  toEnvironment: DeploymentEnvironment;
}): void {
  if (!input.fromEnvironment.promotionTargets.includes(input.toEnvironment.environmentType)) {
    throw new Error(
      `[deployment-commercial-layer] promotion ${input.fromEnvironment.environmentType} -> ${input.toEnvironment.environmentType} is not allowed.`
    );
  }
}

export function createRolloutControl(input: {
  rolloutId: string;
  packageId: string;
  releaseVersion: string;
  currentEnvironment: DeploymentEnvironmentType;
}): RolloutControl {
  return {
    rolloutId: requireValue(input.rolloutId, "rolloutId"),
    packageId: requireValue(input.packageId, "packageId"),
    releaseVersion: requireValue(input.releaseVersion, "releaseVersion"),
    currentEnvironment: input.currentEnvironment,
    promoted: false,
  };
}

export function promoteRollout(input: {
  rollout: RolloutControl;
  fromEnvironment: DeploymentEnvironment;
  toEnvironment: DeploymentEnvironment;
}): RolloutControl {
  assertEnvironmentPromotionAllowed(input);
  if (input.rollout.currentEnvironment !== input.fromEnvironment.environmentType) {
    throw new Error("[deployment-commercial-layer] rollout environment does not match promotion source.");
  }
  return {
    ...input.rollout,
    currentEnvironment: input.toEnvironment.environmentType,
    promoted: true,
  };
}

export function buildRollbackControl(input: {
  rollbackId: string;
  rollout: RolloutControl;
  toVersion: string;
  reason: string;
}): RollbackControl {
  return {
    rollbackId: requireValue(input.rollbackId, "rollbackId"),
    rolloutId: input.rollout.rolloutId,
    fromVersion: input.rollout.releaseVersion,
    toVersion: requireValue(input.toVersion, "toVersion"),
    reason: requireValue(input.reason, "reason"),
  };
}

export function createCommercialCatalog(input: {
  catalogId: string;
  workspaceId: string;
}): CommercialCatalog {
  return {
    catalogId: requireValue(input.catalogId, "catalogId"),
    workspaceId: requireValue(input.workspaceId, "workspaceId"),
    offers: [],
    narrativeTruthMutable: false,
  };
}

export function addOfferToCatalog(input: {
  catalog: CommercialCatalog;
  offerId: string;
  packageId: string;
  state?: CommercialOfferState;
  membership?: boolean;
  bundleRefs?: string[];
  paidUnlock?: boolean;
}): CommercialCatalog {
  const offer: CommercialOffer = {
    offerId: requireValue(input.offerId, "offerId"),
    catalogId: input.catalog.catalogId,
    packageId: requireValue(input.packageId, "packageId"),
    state: input.state ?? "draft",
    membership: input.membership ?? false,
    bundleRefs: [...(input.bundleRefs ?? [])],
    paidUnlock: input.paidUnlock ?? false,
  };
  if (input.catalog.offers.some((entry) => entry.offerId === offer.offerId)) {
    throw new Error(`[deployment-commercial-layer] offer ${offer.offerId} already exists.`);
  }
  return {
    ...input.catalog,
    offers: [...input.catalog.offers, offer],
  };
}

export function transitionOfferState(input: {
  catalog: CommercialCatalog;
  offerId: string;
  targetState: CommercialOfferState;
}): CommercialCatalog {
  const offerId = requireValue(input.offerId, "offerId");
  const validTransitions: Record<CommercialOfferState, CommercialOfferState[]> = {
    draft: ["review", "retired"],
    review: ["active", "paused", "retired"],
    active: ["paused", "retired"],
    paused: ["active", "retired"],
    retired: [],
  };

  let found = false;
  const offers = input.catalog.offers.map((offer) => {
    if (offer.offerId !== offerId) {
      return offer;
    }
    found = true;
    if (!validTransitions[offer.state].includes(input.targetState)) {
      throw new Error(`[deployment-commercial-layer] invalid offer transition ${offer.state} -> ${input.targetState}.`);
    }
    return {
      ...offer,
      state: input.targetState,
    };
  });
  if (!found) {
    throw new Error(`[deployment-commercial-layer] offer ${offerId} not found.`);
  }
  return {
    ...input.catalog,
    offers,
  };
}

export function resolveCommercialEntitlement(input: {
  catalog: CommercialCatalog;
  bridge: EntitlementCommercialBridge;
  offerId: string;
}): {
  offerId: string;
  entitlementKey: string;
  resolutionMode: EntitlementCommercialBridge["resolutionMode"];
  granted: boolean;
} {
  const offer = input.catalog.offers.find((entry) => entry.offerId === input.offerId);
  if (!offer) {
    throw new Error(`[deployment-commercial-layer] offer ${input.offerId} not found for entitlement resolution.`);
  }
  if (offer.state !== "active") {
    return {
      offerId: offer.offerId,
      entitlementKey: input.bridge.entitlementKey,
      resolutionMode: input.bridge.resolutionMode,
      granted: false,
    };
  }
  return {
    offerId: offer.offerId,
    entitlementKey: input.bridge.entitlementKey,
    resolutionMode: input.bridge.resolutionMode,
    granted: true,
  };
}

export function buildReleaseHealth(input: {
  healthId: string;
  releaseVersion: string;
  deploymentEnvironment: DeploymentEnvironmentType;
  signals: ReleaseHealthSignal[];
}): ReleaseHealth {
  return {
    healthId: requireValue(input.healthId, "healthId"),
    releaseVersion: requireValue(input.releaseVersion, "releaseVersion"),
    deploymentEnvironment: input.deploymentEnvironment,
    signals: [...input.signals],
    actionabilitySummary: input.signals.map((signal) => `[${signal.severity}] ${signal.kind}: ${signal.details}`),
  };
}

export function buildOperatorCommercialReleaseSurface(input: {
  surfaceId: string;
  currentReleaseState: string;
  rolloutStatus: string;
  rollbackStatus: string;
  catalogStatus: string;
  entitlementIntegrationStatus: string;
  requestedAudience: "operator" | "reader" | "author";
}): OperatorCommercialReleaseSurface {
  if (input.requestedAudience !== "operator") {
    throw new Error("[deployment-commercial-layer] operator surface cannot be exposed to non-operator audiences.");
  }
  return {
    surfaceId: requireValue(input.surfaceId, "surfaceId"),
    audience: "operator",
    currentReleaseState: requireValue(input.currentReleaseState, "currentReleaseState"),
    rolloutStatus: requireValue(input.rolloutStatus, "rolloutStatus"),
    rollbackStatus: requireValue(input.rollbackStatus, "rollbackStatus"),
    catalogStatus: requireValue(input.catalogStatus, "catalogStatus"),
    entitlementIntegrationStatus: requireValue(input.entitlementIntegrationStatus, "entitlementIntegrationStatus"),
  };
}

export function buildDeploymentCommercialIntelligence(input: {
  intelligenceId: string;
  releaseHealth: ReleaseHealth;
  catalog: CommercialCatalog;
}): DeploymentCommercialIntelligence {
  const rolloutCaution = input.releaseHealth.signals
    .filter((signal) => signal.kind === "rollout_anomaly" || signal.kind === "version_mismatch")
    .map((signal) => signal.details);
  const rollbackSuggestion = input.releaseHealth.signals
    .filter((signal) => signal.kind === "draft_leakage_risk" || signal.kind === "public_surface_inconsistency")
    .map((signal) => `consider rollback: ${signal.details}`);
  const catalogMismatch = input.releaseHealth.signals
    .filter((signal) => signal.kind === "public_surface_inconsistency")
    .map((signal) => signal.details);
  const offerCleanup = input.catalog.offers
    .filter((offer) => offer.state === "retired" && offer.bundleRefs.length > 0)
    .map((offer) => `retired offer ${offer.offerId} keeps ${offer.bundleRefs.length} bundle refs`);
  const entitlementConflictWarnings = input.releaseHealth.signals
    .filter((signal) => signal.kind === "entitlement_mismatch")
    .map((signal) => signal.details);

  return {
    intelligenceId: requireValue(input.intelligenceId, "intelligenceId"),
    explainable: true,
    bounded: true,
    actionHints: [...input.releaseHealth.actionabilitySummary].slice(0, 12),
    rolloutCaution,
    rollbackSuggestion,
    catalogMismatch,
    offerCleanup,
    entitlementConflictWarnings,
  };
}
