/**
 * Cluster 2 — enforcement registry integrity. Run: npx tsx --test lib/services/enforcement-registry-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { subsystemEnforcementDeclarationSchema } from "@/lib/domain/enforcement-contract";
import { READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX } from "@/lib/domain/enforcement-contract";
import {
  analyzeSubsystemEnforcementSemantics,
  assertSubsystemDeclaration,
  buildEnforcementRegistry,
  buildSubsystemEnforcementDeclarations,
  classifyReadinessEvidenceTrust,
  evaluateReadinessEvidenceTrust,
  evaluateReadinessEvidenceTrustRecord,
  validateEnforcementRegistry,
} from "@/lib/services/enforcement-registry-service";
import { RUNTIME_ID_SCENE_CHAPTER_PRODUCTION } from "@/lib/services/runtime-authority-registry-service";

describe("enforcement-registry-service", () => {
  it("parses a sample subsystem declaration with zod", () => {
    const decl = buildSubsystemEnforcementDeclarations()[0];
    assert.ok(decl);
    subsystemEnforcementDeclarationSchema.parse(decl);
  });

  it("registry validates without semantic errors", () => {
    const r = validateEnforcementRegistry(buildEnforcementRegistry());
    assert.equal(r.canonicalRuntimeId, RUNTIME_ID_SCENE_CHAPTER_PRODUCTION);
    assert.ok(r.subsystemDeclarations.length >= 20);
    assert.equal(
      r.semanticViolations.filter((v) => v.severity === "error").length,
      0
    );
  });

  it("hard_enforced_runtime class-only map keeps loose proof but not authoritative production readiness", () => {
    const t = classifyReadinessEvidenceTrust("hard_enforced_runtime");
    assert.equal(t.trustClass, "authoritative_production");
    assert.equal(t.mayCountAsRuntimeReadinessProof, true);
    assert.equal(t.mayCountAsAuthoritativeProductionReadinessEvidence, false);
  });

  it("canonical hard_enforced subsystem is authoritative production readiness when truth fields hold", () => {
    const d = assertSubsystemDeclaration("scene_generation_service");
    const t = evaluateReadinessEvidenceTrustRecord(d);
    assert.equal(t.mayCountAsAuthoritativeProductionReadinessEvidence, true);
    assert.equal(t.readinessTrustAllowanceRuleId, null);
  });

  it("advisory_runtime is not authoritative production readiness without explicit allow rule", () => {
    const d = assertSubsystemDeclaration("scene_generation_engine_bundle");
    const t = evaluateReadinessEvidenceTrustRecord(d);
    assert.equal(t.mayCountAsAuthoritativeProductionReadinessEvidence, false);
    assert.equal(t.readinessTrustAllowanceRuleId, null);
  });

  it("readiness_authoritative_evidence_allow rule grants authoritative readiness for gated classes", () => {
    const base = assertSubsystemDeclaration("author_command_cockpit_bundle");
    const withAllow = {
      ...base,
      validationFlags: [...base.validationFlags, `${READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX}cert_demo_exception`],
    };
    const t = evaluateReadinessEvidenceTrustRecord(withAllow);
    assert.equal(t.mayCountAsAuthoritativeProductionReadinessEvidence, true);
    assert.equal(t.readinessTrustAllowanceRuleId, "cert_demo_exception");
  });

  it("advisory_runtime class-only is not admissible as runtime governance proof", () => {
    const t = evaluateReadinessEvidenceTrust("advisory_runtime");
    assert.equal(t.mayCountAsRuntimeReadinessProof, false);
    assert.equal(t.trustClass, "observational_only");
  });

  it("cockpit_only and report_only cannot prove runtime enforcement", () => {
    assert.equal(classifyReadinessEvidenceTrust("cockpit_only").trustClass, "observational_only");
    assert.equal(classifyReadinessEvidenceTrust("report_only").mayCountAsRuntimeReadinessProof, false);
  });

  it("assertSubsystemDeclaration resolves known id", () => {
    const d = assertSubsystemDeclaration("scene_generation_service");
    assert.equal(d.subsystemId, "scene_generation_service");
    assert.equal(d.enforcementClass, "hard_enforced_runtime");
  });

  it("ambiguous advisory readiness list is empty when declarations are clean", () => {
    const r = buildEnforcementRegistry();
    assert.equal(r.ambiguousSubsystems.length, 0);
  });

  it("detects hard_enforced without canonical output or blocking effect", () => {
    const decls = buildSubsystemEnforcementDeclarations();
    const broken = decls.map((d) =>
      d.subsystemId === "scene_generation_service"
        ? { ...d, affectsCanonicalOutput: false, canBlockInvalidExecution: false }
        : d
    );
    const { semanticViolations } = analyzeSubsystemEnforcementSemantics(
      broken,
      RUNTIME_ID_SCENE_CHAPTER_PRODUCTION
    );
    assert.ok(semanticViolations.some((v) => v.code === "invalid_production_enforced_label"));
  });
});
