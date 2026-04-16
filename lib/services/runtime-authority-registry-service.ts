import type {
  RuntimeAuthorityClass,
  RuntimeAuthorityDeclaration,
  RuntimeAuthorityRegistry,
  RuntimeAuthorityStamp,
} from "@/lib/domain/runtime-authority";

export const RUNTIME_ID_SCENE_CHAPTER_PRODUCTION = "scene_chapter_production_runtime";
export const RUNTIME_ID_BOOK1_REGENERATION = "book1_regeneration_super_pipeline";
export const RUNTIME_ID_REPORT_CERTIFICATION = "certification_report_pipeline";
export const RUNTIME_ID_BOOK1_OUTLINE_DRAFT = "book1_outline_draft_generator";
export const RUNTIME_ID_DETERMINISTIC_PROOF = "deterministic_proof_harness";
export const RUNTIME_ID_COCKPIT_INSPECTION = "cockpit_inspection_helpers";
export const RUNTIME_ID_LEGACY_SCENE_ALIASES = "legacy_scene_generation_aliases";
export const RUNTIME_ID_TEST_HARNESS = "runtime_authority_test_harness";
export const RUNTIME_ID_DEPRECATED_CHAPTER_GENERATOR = "deprecated_chapter_generator";

function declaration(params: RuntimeAuthorityDeclaration): RuntimeAuthorityDeclaration {
  return params;
}

export function buildRuntimeAuthorityRegistry(): RuntimeAuthorityRegistry {
  const declarations: RuntimeAuthorityDeclaration[] = [
    declaration({
      runtimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      runtimeName: "Scene/Chapter Production Runtime",
      authorityClass: "canonical_production",
      entrypoints: [
        "lib/services/scene-generation-service.ts::runSceneGeneration",
        "lib/scene-generation/scene-generation-llm-adapter.ts::generateSceneProseWithModel",
        "lib/services/chapter-assembly-service.ts::assembleChapterReaderText",
      ],
      downstreamConsumers: [
        "scene generation artifacts",
        "chapter assembly artifacts",
        "production readiness checks",
      ],
      allowedUseCases: [
        "authoritative demo execution",
        "production artifact generation",
        "canonical readiness evidence",
      ],
      forbiddenUseCases: ["none"],
      canDriveDemo: true,
      canDriveProductionArtifacts: true,
      canGateReadiness: true,
      canAffectCanonicalOutput: true,
      canBlockInvalidExecutionThroughCanonicalPath: true,
      labelingRequirements: {
        machineTag: "runtime:canonical_production",
        operatorLabel: "Canonical Production Runtime",
        warningPrefix: "CANONICAL",
      },
      deprecationStatus: "active",
      validationFlags: ["single_canonical_runtime", "chapter_scene_authority_lock"],
    }),
    declaration({
      runtimeId: RUNTIME_ID_BOOK1_REGENERATION,
      runtimeName: "Book1 Regeneration Super-Pipeline",
      authorityClass: "advisory_runtime",
      entrypoints: ["scripts/run-book1-chapter-01-regeneration-loop.ts::main"],
      downstreamConsumers: ["draft revision reports", "author cockpit advisory views"],
      allowedUseCases: ["advisory regeneration analysis", "operator what-if review"],
      forbiddenUseCases: ["canonical production publication", "authoritative readiness gating"],
      canDriveDemo: false,
      canDriveProductionArtifacts: false,
      canGateReadiness: false,
      canAffectCanonicalOutput: false,
      canBlockInvalidExecutionThroughCanonicalPath: false,
      labelingRequirements: {
        machineTag: "runtime:advisory_regeneration",
        operatorLabel: "Advisory Regeneration Runtime",
        warningPrefix: "ADVISORY",
      },
      deprecationStatus: "active",
      validationFlags: ["advisory_only", "noncanonical_guarded"],
    }),
    declaration({
      runtimeId: RUNTIME_ID_REPORT_CERTIFICATION,
      runtimeName: "Certification Report Pipeline",
      authorityClass: "report_only",
      entrypoints: [
        "scripts/run-production-certification.ts",
        "scripts/run-ecosystem-certification.ts",
        "scripts/run-author-cockpit-certification.ts",
      ],
      downstreamConsumers: ["build reports", "release audit artifacts"],
      allowedUseCases: ["report generation", "non-mutating readiness summary export"],
      forbiddenUseCases: ["scene/chapter generation", "canonical content mutation"],
      canDriveDemo: false,
      canDriveProductionArtifacts: false,
      canGateReadiness: true,
      canAffectCanonicalOutput: false,
      canBlockInvalidExecutionThroughCanonicalPath: false,
      labelingRequirements: {
        machineTag: "runtime:report_only_certification",
        operatorLabel: "Report-Only Certification Runtime",
        warningPrefix: "REPORT_ONLY",
      },
      deprecationStatus: "active",
      validationFlags: ["readiness_report_surface", "non_mutating"],
    }),
    declaration({
      runtimeId: RUNTIME_ID_BOOK1_OUTLINE_DRAFT,
      runtimeName: "Book1 Outline Draft Generator",
      authorityClass: "simulation_only",
      entrypoints: ["scripts/generate-book1-chapter.ts::main"],
      downstreamConsumers: ["draft json/txt exports"],
      allowedUseCases: ["draft simulation", "early composition probes"],
      forbiddenUseCases: ["canonical artifact claims", "readiness evidence gating"],
      canDriveDemo: false,
      canDriveProductionArtifacts: false,
      canGateReadiness: false,
      canAffectCanonicalOutput: false,
      canBlockInvalidExecutionThroughCanonicalPath: false,
      labelingRequirements: {
        machineTag: "runtime:simulation_outline_draft",
        operatorLabel: "Simulation Draft Runtime",
        warningPrefix: "SIMULATION",
      },
      deprecationStatus: "active",
      validationFlags: ["simulation_only_runtime"],
    }),
    declaration({
      runtimeId: RUNTIME_ID_DETERMINISTIC_PROOF,
      runtimeName: "Deterministic Proof Harness",
      authorityClass: "simulation_only",
      entrypoints: ["scripts/run-deterministic-interaction-harness.ts"],
      downstreamConsumers: ["proof harness reports"],
      allowedUseCases: ["deterministic proofing", "sample-pack validation"],
      forbiddenUseCases: ["production artifact publication", "canonical readiness gating"],
      canDriveDemo: false,
      canDriveProductionArtifacts: false,
      canGateReadiness: false,
      canAffectCanonicalOutput: false,
      canBlockInvalidExecutionThroughCanonicalPath: false,
      labelingRequirements: {
        machineTag: "runtime:simulation_proof_harness",
        operatorLabel: "Simulation Proof Runtime",
        warningPrefix: "SIMULATION",
      },
      deprecationStatus: "active",
      validationFlags: ["deterministic_proof_only"],
    }),
    declaration({
      runtimeId: RUNTIME_ID_COCKPIT_INSPECTION,
      runtimeName: "Cockpit Inspection Helpers",
      authorityClass: "advisory_runtime",
      entrypoints: [
        "scripts/verify-author-command-cockpit.ts",
        "scripts/verify-cockpit-shell-architecture.ts",
        "scripts/verify-cockpit-scope-model.ts",
      ],
      downstreamConsumers: ["cockpit diagnostics"],
      allowedUseCases: ["operator inspection"],
      forbiddenUseCases: ["canonical content mutation", "readiness gate claims"],
      canDriveDemo: false,
      canDriveProductionArtifacts: false,
      canGateReadiness: false,
      canAffectCanonicalOutput: false,
      canBlockInvalidExecutionThroughCanonicalPath: false,
      labelingRequirements: {
        machineTag: "runtime:advisory_cockpit",
        operatorLabel: "Advisory Cockpit Inspection Runtime",
        warningPrefix: "ADVISORY",
      },
      deprecationStatus: "active",
      validationFlags: ["cockpit_inspection_only"],
    }),
    declaration({
      runtimeId: RUNTIME_ID_LEGACY_SCENE_ALIASES,
      runtimeName: "Legacy Scene Generation Aliases",
      authorityClass: "legacy_or_duplicate",
      entrypoints: [
        "lib/services/scene-generation-service.ts::generateSceneDraft",
        "lib/services/scene-generation-service.ts::rewriteSceneDraft",
        "lib/services/scene-generation-service.ts::repairSceneContinuity",
      ],
      downstreamConsumers: ["legacy callers"],
      allowedUseCases: ["backward-compatibility wrapper calls"],
      forbiddenUseCases: ["canonical authority claims"],
      canDriveDemo: false,
      canDriveProductionArtifacts: false,
      canGateReadiness: false,
      canAffectCanonicalOutput: false,
      canBlockInvalidExecutionThroughCanonicalPath: false,
      labelingRequirements: {
        machineTag: "runtime:legacy_duplicate",
        operatorLabel: "Legacy or Duplicate Runtime",
        warningPrefix: "LEGACY",
      },
      deprecationStatus: "sunset_planned",
      validationFlags: ["legacy_wrapper_only"],
    }),
    declaration({
      runtimeId: RUNTIME_ID_TEST_HARNESS,
      runtimeName: "Runtime Authority Test Harness",
      authorityClass: "test_only",
      entrypoints: ["lib/services/runtime-authority-registry-service.test.ts"],
      downstreamConsumers: ["unit test assertions"],
      allowedUseCases: ["test verification"],
      forbiddenUseCases: ["demo usage", "production artifact claims", "readiness gating"],
      canDriveDemo: false,
      canDriveProductionArtifacts: false,
      canGateReadiness: false,
      canAffectCanonicalOutput: false,
      canBlockInvalidExecutionThroughCanonicalPath: false,
      labelingRequirements: {
        machineTag: "runtime:test_only",
        operatorLabel: "Test-Only Runtime",
        warningPrefix: "TEST_ONLY",
      },
      deprecationStatus: "active",
      validationFlags: ["test_surface"],
    }),
    declaration({
      runtimeId: RUNTIME_ID_DEPRECATED_CHAPTER_GENERATOR,
      runtimeName: "Deprecated Chapter Generator Surface",
      authorityClass: "deprecated",
      entrypoints: ["scripts/compose-book1-chapter-01.ts"],
      downstreamConsumers: ["legacy chapter exports"],
      allowedUseCases: ["historical reference only"],
      forbiddenUseCases: ["production runtime", "demo runtime", "readiness gating"],
      canDriveDemo: false,
      canDriveProductionArtifacts: false,
      canGateReadiness: false,
      canAffectCanonicalOutput: false,
      canBlockInvalidExecutionThroughCanonicalPath: false,
      labelingRequirements: {
        machineTag: "runtime:deprecated",
        operatorLabel: "Deprecated Runtime Surface",
        warningPrefix: "DEPRECATED",
      },
      deprecationStatus: "deprecated",
      validationFlags: ["deprecated_surface"],
    }),
  ];

  return {
    canonicalRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
    declarations,
    duplicateRisks: [
      "scene-generation-service aliases can be mistaken for independent runtimes without labels",
      "book1 regeneration outputs can be mistaken for canonical chapter outputs without authority stamps",
    ],
    ambiguousPaths: [
      "script-level chapter generation surfaces historically lacked authority labels",
      "cockpit bundle consumers previously had no machine-readable authority class",
    ],
    enforcementRules: [
      {
        ruleId: "single-canonical-runtime",
        description: "Exactly one declaration may have authorityClass=canonical_production.",
        enforcedBy: ["validateRuntimeAuthorityRegistry"],
      },
      {
        ruleId: "no-canonical-spoofing",
        description: "Non-canonical runtime cannot claim canonical labels or canonical artifact rights.",
        enforcedBy: ["assertClaimedAuthorityClass", "assertRuntimeCanDriveCanonicalArtifacts"],
      },
      {
        ruleId: "readiness-gate-authority",
        description: "Only runtimes explicitly marked canGateReadiness=true may emit readiness decisions.",
        enforcedBy: ["assertRuntimeCanGateReadiness"],
      },
      {
        ruleId: "cockpit-authority-visibility",
        description: "Cockpit bundles must include machine-readable runtime authority stamp.",
        enforcedBy: ["buildAuthorCommandCockpitBundle"],
      },
      {
        ruleId: "authority-truth-rule",
        description:
          "A runtime may be presented as production-enforced only when canonical and able to affect canonical output or block invalid canonical execution.",
        enforcedBy: ["isRuntimeProductionEnforced", "assertRuntimeCanBePresentedAsProductionEnforced"],
      },
      {
        ruleId: "demo-safety-rule",
        description:
          "Demo-safe runtimes are canonical production or explicitly demo-approved advisory with visible labeling.",
        enforcedBy: ["isRuntimeDemoSafe", "assertRuntimeDemoSafe", "getDemoSafetyWarningBanner"],
      },
    ],
    validationFlags: ["authority_lock_enabled", "cluster1_runtime_authority"],
  };
}

export function validateRuntimeAuthorityRegistry(
  registry: RuntimeAuthorityRegistry = buildRuntimeAuthorityRegistry()
): RuntimeAuthorityRegistry {
  if (!registry.declarations.length) {
    throw new Error("[runtime-authority] registry declarations must not be empty.");
  }

  const canonicalDeclarations = registry.declarations.filter(
    (declaration) => declaration.authorityClass === "canonical_production"
  );
  if (canonicalDeclarations.length !== 1) {
    throw new Error(
      `[runtime-authority] expected exactly one canonical runtime declaration, got ${canonicalDeclarations.length}.`
    );
  }

  const canonicalDeclaration = canonicalDeclarations[0];
  if (!canonicalDeclaration || canonicalDeclaration.runtimeId !== registry.canonicalRuntimeId) {
    throw new Error("[runtime-authority] canonicalRuntimeId does not match canonical declaration.");
  }

  const ids = registry.declarations.map((declaration) => declaration.runtimeId);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error("[runtime-authority] duplicate runtimeId detected.");
  }

  for (const declaration of registry.declarations) {
    if (declaration.authorityClass !== "canonical_production" && declaration.canAffectCanonicalOutput) {
      throw new Error(
        `[runtime-authority] non-canonical runtime ${declaration.runtimeId} cannot affect canonical output.`
      );
    }
    if (declaration.authorityClass !== "canonical_production" && declaration.canDriveProductionArtifacts) {
      throw new Error(
        `[runtime-authority] non-canonical runtime ${declaration.runtimeId} cannot drive production artifacts.`
      );
    }
    if (
      declaration.authorityClass !== "canonical_production" &&
      declaration.canBlockInvalidExecutionThroughCanonicalPath
    ) {
      throw new Error(
        `[runtime-authority] non-canonical runtime ${declaration.runtimeId} cannot block canonical-path execution.`
      );
    }
    if (declaration.canDriveDemo && !["canonical_production", "advisory_runtime"].includes(declaration.authorityClass)) {
      throw new Error(
        `[runtime-authority] runtime ${declaration.runtimeId} violates demo safety rule: authorityClass=${declaration.authorityClass}.`
      );
    }
    if (declaration.authorityClass === "advisory_runtime" && declaration.canDriveDemo) {
      const bannerHint = declaration.labelingRequirements.warningPrefix.toUpperCase();
      if (!bannerHint.includes("ADVISORY") && !bannerHint.includes("NON_CANONICAL")) {
        throw new Error(
          `[runtime-authority] advisory demo runtime ${declaration.runtimeId} must have visible advisory/non-canonical warning prefix.`
        );
      }
    }
    if (!declaration.labelingRequirements.machineTag.trim()) {
      throw new Error(`[runtime-authority] runtime ${declaration.runtimeId} is missing machineTag.`);
    }
  }

  return registry;
}

export function getRuntimeAuthorityDeclaration(
  runtimeId: string,
  registry: RuntimeAuthorityRegistry = buildRuntimeAuthorityRegistry()
): RuntimeAuthorityDeclaration {
  const validated = validateRuntimeAuthorityRegistry(registry);
  const declaration = validated.declarations.find((entry) => entry.runtimeId === runtimeId);
  if (!declaration) throw new Error(`[runtime-authority] unknown runtimeId: ${runtimeId}`);
  return declaration;
}

export function createRuntimeAuthorityStamp(
  runtimeId: string,
  registry: RuntimeAuthorityRegistry = buildRuntimeAuthorityRegistry()
): RuntimeAuthorityStamp {
  const validated = validateRuntimeAuthorityRegistry(registry);
  const declaration = getRuntimeAuthorityDeclaration(runtimeId, validated);
  const isProductionEnforced = isRuntimeProductionEnforced(runtimeId, validated);
  const isDemoSafe = isRuntimeDemoSafe(runtimeId, validated);
  return {
    runtimeId: declaration.runtimeId,
    runtimeName: declaration.runtimeName,
    authorityClass: declaration.authorityClass,
    isCanonicalProduction: declaration.runtimeId === validated.canonicalRuntimeId,
    machineTag: declaration.labelingRequirements.machineTag,
    operatorLabel: declaration.labelingRequirements.operatorLabel,
    warningPrefix: declaration.labelingRequirements.warningPrefix,
    canAffectCanonicalOutput: declaration.canAffectCanonicalOutput,
    canGateReadiness: declaration.canGateReadiness,
    canBlockInvalidExecutionThroughCanonicalPath:
      declaration.canBlockInvalidExecutionThroughCanonicalPath,
    isProductionEnforced,
    isDemoSafe,
    requiresNonCanonicalDemoWarningBanner: !isDemoSafe,
  };
}

export function isRuntimeProductionEnforced(
  runtimeId: string,
  registry: RuntimeAuthorityRegistry = buildRuntimeAuthorityRegistry()
): boolean {
  const validated = validateRuntimeAuthorityRegistry(registry);
  const declaration = getRuntimeAuthorityDeclaration(runtimeId, validated);
  const participatesInCanonicalPath = declaration.runtimeId === validated.canonicalRuntimeId;
  const canEnforceCanonicalTruth =
    declaration.canAffectCanonicalOutput || declaration.canBlockInvalidExecutionThroughCanonicalPath;
  return participatesInCanonicalPath && canEnforceCanonicalTruth;
}

export function assertRuntimeCanBePresentedAsProductionEnforced(runtimeId: string): RuntimeAuthorityDeclaration {
  const declaration = getRuntimeAuthorityDeclaration(runtimeId);
  if (!isRuntimeProductionEnforced(runtimeId)) {
    throw new Error(
      `[runtime-authority] runtime ${runtimeId} cannot be presented as production-enforced; class=${declaration.authorityClass}.`
    );
  }
  return declaration;
}

export function isRuntimeDemoSafe(
  runtimeId: string,
  registry: RuntimeAuthorityRegistry = buildRuntimeAuthorityRegistry()
): boolean {
  const declaration = getRuntimeAuthorityDeclaration(runtimeId, registry);
  if (declaration.authorityClass === "canonical_production") return true;
  if (declaration.authorityClass === "advisory_runtime" && declaration.canDriveDemo) return true;
  return false;
}

export function assertRuntimeDemoSafe(runtimeId: string): RuntimeAuthorityDeclaration {
  const declaration = getRuntimeAuthorityDeclaration(runtimeId);
  if (!isRuntimeDemoSafe(runtimeId)) {
    throw new Error(
      `[runtime-authority] runtime ${runtimeId} is not demo-safe; class=${declaration.authorityClass}.`
    );
  }
  return declaration;
}

export function getDemoSafetyWarningBanner(runtimeId: string): string {
  const declaration = getRuntimeAuthorityDeclaration(runtimeId);
  const stamp = createRuntimeAuthorityStamp(runtimeId);
  if (stamp.isDemoSafe) {
    return `[${stamp.warningPrefix}] Demo-safe runtime: ${stamp.operatorLabel}.`;
  }
  return `[${stamp.warningPrefix}] NON-CANONICAL DEMO WARNING: ${stamp.operatorLabel} is not demo-safe. Any demonstration must show non-canonical artifact labels and explicit warning banners.`;
}

export function assertRuntimeCanDriveCanonicalArtifacts(runtimeId: string): RuntimeAuthorityDeclaration {
  const declaration = getRuntimeAuthorityDeclaration(runtimeId);
  if (!declaration.canDriveProductionArtifacts) {
    throw new Error(
      `[runtime-authority] runtime ${runtimeId} cannot produce canonical artifacts; class=${declaration.authorityClass}.`
    );
  }
  return declaration;
}

export function assertRuntimeCanGateReadiness(runtimeId: string): RuntimeAuthorityDeclaration {
  const declaration = getRuntimeAuthorityDeclaration(runtimeId);
  if (!declaration.canGateReadiness) {
    throw new Error(
      `[runtime-authority] runtime ${runtimeId} cannot gate readiness evidence; class=${declaration.authorityClass}.`
    );
  }
  return declaration;
}

export function assertClaimedAuthorityClass(runtimeId: string, claimed: RuntimeAuthorityClass): void {
  const declaration = getRuntimeAuthorityDeclaration(runtimeId);
  if (declaration.authorityClass !== claimed) {
    throw new Error(
      `[runtime-authority] runtime ${runtimeId} cannot claim authorityClass=${claimed}; expected=${declaration.authorityClass}.`
    );
  }
}
