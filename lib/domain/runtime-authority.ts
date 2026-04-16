export const RUNTIME_AUTHORITY_CLASSES = [
  "canonical_production",
  "advisory_runtime",
  "simulation_only",
  "report_only",
  "test_only",
  "legacy_or_duplicate",
  "deprecated",
] as const;

export type RuntimeAuthorityClass = (typeof RUNTIME_AUTHORITY_CLASSES)[number];

export type RuntimeAuthorityLabelingRequirements = {
  machineTag: string;
  operatorLabel: string;
  warningPrefix: string;
};

export type RuntimeAuthorityDeclaration = {
  runtimeId: string;
  runtimeName: string;
  authorityClass: RuntimeAuthorityClass;
  entrypoints: string[];
  downstreamConsumers: string[];
  allowedUseCases: string[];
  forbiddenUseCases: string[];
  canDriveDemo: boolean;
  canDriveProductionArtifacts: boolean;
  canGateReadiness: boolean;
  canAffectCanonicalOutput: boolean;
  canBlockInvalidExecutionThroughCanonicalPath: boolean;
  labelingRequirements: RuntimeAuthorityLabelingRequirements;
  deprecationStatus: "active" | "sunset_planned" | "deprecated";
  validationFlags: string[];
};

export type RuntimeAuthorityEnforcementRule = {
  ruleId: string;
  description: string;
  enforcedBy: string[];
};

export type RuntimeAuthorityRegistry = {
  canonicalRuntimeId: string;
  declarations: RuntimeAuthorityDeclaration[];
  duplicateRisks: string[];
  ambiguousPaths: string[];
  enforcementRules: RuntimeAuthorityEnforcementRule[];
  validationFlags: string[];
};

export type RuntimeAuthorityStamp = {
  runtimeId: string;
  runtimeName: string;
  authorityClass: RuntimeAuthorityClass;
  isCanonicalProduction: boolean;
  machineTag: string;
  operatorLabel: string;
  warningPrefix: string;
  canAffectCanonicalOutput: boolean;
  canGateReadiness: boolean;
  canBlockInvalidExecutionThroughCanonicalPath: boolean;
  isProductionEnforced: boolean;
  isDemoSafe: boolean;
  requiresNonCanonicalDemoWarningBanner: boolean;
};
