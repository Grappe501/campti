import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { RuntimeAuthorityRegistry } from "@/lib/domain/runtime-authority";
import {
  RUNTIME_ID_BOOK1_REGENERATION,
  RUNTIME_ID_REPORT_CERTIFICATION,
  RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
  assertClaimedAuthorityClass,
  assertRuntimeCanBePresentedAsProductionEnforced,
  assertRuntimeCanDriveCanonicalArtifacts,
  assertRuntimeDemoSafe,
  assertRuntimeCanGateReadiness,
  buildRuntimeAuthorityRegistry,
  createRuntimeAuthorityStamp,
  getDemoSafetyWarningBanner,
  isRuntimeDemoSafe,
  isRuntimeProductionEnforced,
  validateRuntimeAuthorityRegistry,
} from "@/lib/services/runtime-authority-registry-service";

describe("runtime-authority-registry-service", () => {
  it("declares exactly one canonical runtime", () => {
    const registry = validateRuntimeAuthorityRegistry(buildRuntimeAuthorityRegistry());
    const canonicalCount = registry.declarations.filter((row) => row.authorityClass === "canonical_production").length;
    assert.equal(canonicalCount, 1);
    assert.equal(registry.canonicalRuntimeId, RUNTIME_ID_SCENE_CHAPTER_PRODUCTION);
  });

  it("detects duplicate canonical claims", () => {
    const registry = buildRuntimeAuthorityRegistry();
    const duplicate: RuntimeAuthorityRegistry = {
      ...registry,
      declarations: registry.declarations.map((row) =>
        row.runtimeId === RUNTIME_ID_BOOK1_REGENERATION
          ? {
              ...row,
              authorityClass: "canonical_production",
            }
          : row,
      ),
    };
    assert.throws(() => validateRuntimeAuthorityRegistry(duplicate), /expected exactly one canonical runtime declaration/i);
  });

  it("labels non-canonical paths and blocks canonical artifact claims", () => {
    const advisoryStamp = createRuntimeAuthorityStamp(RUNTIME_ID_BOOK1_REGENERATION);
    assert.equal(advisoryStamp.authorityClass, "advisory_runtime");
    assert.equal(advisoryStamp.isCanonicalProduction, false);
    assert.throws(
      () => assertRuntimeCanDriveCanonicalArtifacts(RUNTIME_ID_BOOK1_REGENERATION),
      /cannot produce canonical artifacts/i,
    );
  });

  it("allows canonical artifact labeling for canonical runtime", () => {
    const declaration = assertRuntimeCanDriveCanonicalArtifacts(RUNTIME_ID_SCENE_CHAPTER_PRODUCTION);
    assert.equal(declaration.authorityClass, "canonical_production");
    const stamp = createRuntimeAuthorityStamp(RUNTIME_ID_SCENE_CHAPTER_PRODUCTION);
    assert.equal(stamp.machineTag, "runtime:canonical_production");
    assert.equal(stamp.isProductionEnforced, true);
    assert.equal(stamp.isDemoSafe, true);
  });

  it("rejects readiness evidence from invalid authority class", () => {
    assert.throws(() => assertRuntimeCanGateReadiness(RUNTIME_ID_BOOK1_REGENERATION), /cannot gate readiness evidence/i);
    assert.doesNotThrow(() => assertRuntimeCanGateReadiness("certification_report_pipeline"));
  });

  it("enforces runtime class claim consistency", () => {
    assert.throws(
      () => assertClaimedAuthorityClass(RUNTIME_ID_BOOK1_REGENERATION, "canonical_production"),
      /cannot claim authorityClass/i,
    );
    assert.doesNotThrow(() => assertClaimedAuthorityClass(RUNTIME_ID_BOOK1_REGENERATION, "advisory_runtime"));
  });

  it("enforces authority truth for production-enforced presentation", () => {
    assert.equal(isRuntimeProductionEnforced(RUNTIME_ID_SCENE_CHAPTER_PRODUCTION), true);
    assert.equal(isRuntimeProductionEnforced(RUNTIME_ID_REPORT_CERTIFICATION), false);
    assert.throws(
      () => assertRuntimeCanBePresentedAsProductionEnforced(RUNTIME_ID_REPORT_CERTIFICATION),
      /cannot be presented as production-enforced/i,
    );
    assert.doesNotThrow(() => assertRuntimeCanBePresentedAsProductionEnforced(RUNTIME_ID_SCENE_CHAPTER_PRODUCTION));
  });

  it("enforces demo safety with non-canonical warning banners", () => {
    assert.equal(isRuntimeDemoSafe(RUNTIME_ID_SCENE_CHAPTER_PRODUCTION), true);
    assert.equal(isRuntimeDemoSafe(RUNTIME_ID_BOOK1_REGENERATION), false);
    assert.throws(() => assertRuntimeDemoSafe(RUNTIME_ID_BOOK1_REGENERATION), /not demo-safe/i);
    const advisoryBanner = getDemoSafetyWarningBanner(RUNTIME_ID_BOOK1_REGENERATION);
    assert.equal(advisoryBanner.includes("NON-CANONICAL DEMO WARNING"), true);
    const canonicalBanner = getDemoSafetyWarningBanner(RUNTIME_ID_SCENE_CHAPTER_PRODUCTION);
    assert.equal(canonicalBanner.includes("Demo-safe runtime"), true);
  });
});
