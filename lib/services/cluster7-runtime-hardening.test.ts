import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationOutputV1 } from "@/lib/domain/scene-generation-output";
import { decidePersistenceGovernance } from "@/lib/services/persistence-governance-service";
import { RuntimeSemanticInvariantService } from "@/lib/services/runtime-semantic-invariant-service";
import { CrossSystemDriftDetectionService } from "@/lib/services/cross-system-drift-detection-service";
import { buildCluster7RuntimeTruthEnvelope, buildCockpitCertificationHardeningSummary } from "@/lib/services/cluster7-runtime-truth-service";
import { buildSceneGenerationCanonicalArtifactRecord } from "@/lib/services/canonical-artifact-record-service";
import { buildArtifactCanonicalizationReport } from "@/lib/services/canonical-artifact-governance-service";
import { evaluateArtifactTruthRule } from "@/lib/services/artifact-canonical-evidence-validation-service";
import { evaluateReadinessEvidenceInflationRisk } from "@/lib/services/readiness-evidence-semantic-service";
import { RealismTruthResultSchema } from "@/lib/domain/prose-realism";
import { HumanGravityTruthResultSchema } from "@/lib/domain/human-gravity-runtime";
import { RuntimeSemanticInvariantReportSchema } from "@/lib/domain/runtime-semantic-invariant";
import type { CanonicalPreGenerationBundle } from "@/lib/domain/canonical-scene-generation-governance";
import { NarratorPresenceValidationResultSchema } from "@/lib/domain/narrator-presence";

describe("Cluster 7 persistence governance", () => {
  it("does not describe persisted output as canonical-ready when nothing was saved", () => {
    const d = decidePersistenceGovernance({
      saveGenerationTextRequested: false,
      savedGenerationText: false,
      generationTextSaveBlockedByRealism: false,
      generationTextSaveBlockedByHumanGravity: false,
      allowSaveOnInvalidRealism: false,
      allowSaveOnInvalidHumanGravity: false,
      realismInvalid: false,
      humanGravityInvalid: false,
    });
    assert.equal(d.mayDescribeAsCanonicalReady, false);
  });

  it("blocks invalid realism without override", () => {
    const d = decidePersistenceGovernance({
      saveGenerationTextRequested: true,
      savedGenerationText: false,
      generationTextSaveBlockedByRealism: true,
      generationTextSaveBlockedByHumanGravity: false,
      allowSaveOnInvalidRealism: false,
      allowSaveOnInvalidHumanGravity: false,
      realismInvalid: true,
      humanGravityInvalid: false,
    });
    assert.equal(d.persistedTruthLabel, "blocked_invalid_realism");
    assert.equal(d.mayDescribeAsCanonicalReady, false);
  });

  it("allows explicit override while marking non-canonical-ready persistence", () => {
    const d = decidePersistenceGovernance({
      saveGenerationTextRequested: true,
      savedGenerationText: true,
      generationTextSaveBlockedByRealism: false,
      generationTextSaveBlockedByHumanGravity: false,
      allowSaveOnInvalidRealism: true,
      allowSaveOnInvalidHumanGravity: false,
      realismInvalid: true,
      humanGravityInvalid: false,
    });
    assert.equal(d.persistedTruthLabel, "save_overridden_despite_invalid_realism");
    assert.equal(d.mayDescribeAsCanonicalReady, false);
  });
});

describe("Cluster 7 semantic invariants", () => {
  it("flags persistence contradiction", () => {
    const baseOutput: SceneGenerationOutputV1 = {
      contractVersion: "1",
      generatedText: "x",
      generationNotes: "",
      warnings: [],
      continuityFlags: [],
      advisoryOnly: true,
    };
    const inv = new RuntimeSemanticInvariantService().evaluate({
      runId: "r1",
      sceneId: "s1",
      applyCanonicalNarrativeGovernance: false,
      canonicalPreGeneration: null,
      output: baseOutput,
      saveGenerationTextRequested: true,
      savedGenerationText: true,
      generationTextSaveBlockedByRealism: true,
      generationTextSaveBlockedByHumanGravity: false,
      proseRealism: null,
      humanGravityValidation: null,
    });
    assert.ok(inv.hardViolations.some((v) => v.invariantId === "inv.persistence_matches_block_flags"));
  });
});

describe("Cluster 7 drift detection", () => {
  it("detects saved vs blocked contradiction", () => {
    const drift = new CrossSystemDriftDetectionService().detect({
      runId: "r1",
      sceneId: "s1",
      run: {
        output: {
          contractVersion: "1",
          generatedText: "",
          generationNotes: "",
          warnings: [],
          continuityFlags: [],
          advisoryOnly: true,
        },
        savedGenerationText: true,
        generationTextSaveBlockedByRealism: true,
        generationTextSaveBlockedByHumanGravity: false,
        registeredDependencyIds: [],
        realismTruth: RealismTruthResultSchema.parse({
          contractVersion: "1",
          canonicalSceneGenerationObserved: true,
          realismLayerAppliedToLivePrompt: true,
          sceneOutputValidUnderRealismRules: false,
          invalidationReasons: ["x"],
        }),
        proseRealism: null,
        humanGravityValidation: null,
        humanGravityTruth: null,
        humanGravityRuntime: null,
        canonicalPreGeneration: null,
      },
    });
    assert.ok(drift.hasError);
  });
});

describe("Cluster 7 envelope & cockpit summary", () => {
  it("builds artifact record and readiness depth", () => {
    const run = {
      output: {
        contractVersion: "1" as const,
        generatedText: "hello",
        generationNotes: "",
        warnings: [],
        continuityFlags: [] as string[],
        advisoryOnly: true as const,
      },
      savedGenerationText: false,
      registeredDependencyIds: [] as string[],
      proseRealism: null,
      realismTruth: null,
      humanGravityValidation: null,
      humanGravityTruth: null,
      humanGravityRuntime: null,
      canonicalPreGeneration: null,
    };
    const envelope = buildCluster7RuntimeTruthEnvelope({
      runId: "run_x",
      sceneId: "scene_x",
      sceneGenerationInputHash: "hash",
      applyCanonicalNarrativeGovernance: false,
      saveGenerationTextRequested: false,
      allowSaveOnInvalidRealism: false,
      allowSaveOnInvalidHumanGravity: false,
      run,
    });
    assert.equal(envelope.semanticInvariantReport.contractVersion, "1");
    assert.equal(envelope.readinessCertification.contractVersion, "2");
    assert.equal(envelope.readinessCertification.artifactTrustClass, "observational_only");
    assert.equal(envelope.readinessCertification.certificationTruthRuleSatisfied, false);
    assert.equal(envelope.readinessCertification.mayPresentAsProductionGrade, false);
    const cockpit = buildCockpitCertificationHardeningSummary(envelope);
    assert.equal(cockpit.contractVersion, "1");
    assert.ok(cockpit.canonicalArtifactId.includes("scene_gen"));
    assert.ok(Array.isArray(cockpit.semanticInvariantHardFailureIds));
    assert.equal(cockpit.certificationTruthRuleSatisfied, false);
    const art = buildSceneGenerationCanonicalArtifactRecord({
      runId: "run_x",
      sceneId: "scene_x",
      sceneGenerationInputHash: "hash",
      saveGenerationTextRequested: false,
      run: {
        ...run,
        humanGravityValidation: {
          contractVersion: "1",
          clusterTag: "cluster6_human_gravity_validation",
          sceneId: "scene_x",
          humanGravityCanonicalRuntimeActive: true,
          sceneOutputValidUnderNoResetRules: true,
          upstreamNoResetPressureActive: false,
          noResetViolations: [],
          weakAttachmentWarnings: [],
          weakRelationalStakesWarnings: [],
          consequenceResetWarnings: [],
          burdenSuppressionWarnings: [],
          suggestedHardeningActions: [],
          humanGravityScore: 0.5,
          validationFlags: [],
          driftReport: {
            sceneId: "scene_x",
            weakAttachmentWarnings: [],
            weakRelationalStakesWarnings: [],
            consequenceResetWarnings: [],
            burdenSuppressionWarnings: [],
            shallowClosureWarnings: [],
            suggestedHardeningActions: [],
            humanGravityScore: 0.5,
            hardWarnings: [],
            softWarnings: [],
          },
          sceneReadsShallowUnderProfile: false,
          humanGravityTruth: HumanGravityTruthResultSchema.parse({
            sceneOutputValidUnderNoResetRules: true,
            upstreamNoResetPressureActive: false,
            noResetViolations: [],
          }),
        },
      },
      persistence: envelope.persistenceGovernance,
    });
    assert.equal(art.artifactType, "scene_generation_run");
    const artRule = evaluateArtifactTruthRule(art, { proseRealismLayerRan: false, humanGravityLayerRan: true });
    assert.equal(artRule.satisfied, true);
    const canonReport = buildArtifactCanonicalizationReport({ runId: "run_x", records: [art] });
    assert.equal(canonReport.ambiguousArtifacts.length, 0);
  });
});

describe("Cluster 7 semantic invariant report schema", () => {
  it("parses invariant report shape", () => {
    const parsed = RuntimeSemanticInvariantReportSchema.parse({
      contractVersion: "1",
      runId: "r",
      sceneId: "s",
      invariantResults: [],
      hardViolations: [],
      softViolations: [],
      warnings: [],
      suggestedRepairs: [],
      validationFlags: [],
    });
    assert.equal(parsed.runId, "r");
  });
});

describe("Cluster 7 hook / drift / readiness helpers", () => {
  it("flags hook pressure with invalid continuity as soft invariant concern", () => {
    const baseOutput: SceneGenerationOutputV1 = {
      contractVersion: "1",
      generatedText: "x",
      generationNotes: "",
      warnings: [],
      continuityFlags: [],
      advisoryOnly: true,
    };
    const narratorOk = NarratorPresenceValidationResultSchema.parse({
      artifact: "narrator_presence_validation_result",
      valid: true,
      hardFailures: [],
      softWarnings: [],
      narratorConvergenceScore: 0.5,
      suggestedRepairs: ["monitor"],
    });
    const pre = {
      governanceMergeApplied: true,
      packValidations: {
        epicContinuity: { valid: false, score: 0.2, warnings: [], risks: [] },
        epicEmotionalGravity: { valid: true, score: 0.8, warnings: [], risks: [] },
        narratorPresence: narratorOk,
      },
      cluster3RuntimeActivationTruth: {
        contractVersion: "1",
        governanceMergeApplied: true,
        proseConstraintCluster3Flags: [],
        sequenceStructuralHookPressureActive: true,
        epicContinuityPackValidated: false,
        epicEmotionalGravityPackValidated: true,
        narratorPresenceValidated: true,
        encsMaterialInfluences: [],
        eegsMaterialInfluences: [],
        narratorMaterialInfluences: [],
        hcelHookHardSignalsActive: true,
        advisoryRemainderNote: "test-bundle",
      },
    } as unknown as CanonicalPreGenerationBundle;
    const inv = new RuntimeSemanticInvariantService().evaluate({
      runId: "r1",
      sceneId: "s1",
      applyCanonicalNarrativeGovernance: true,
      canonicalPreGeneration: pre,
      output: baseOutput,
      saveGenerationTextRequested: false,
      savedGenerationText: false,
      generationTextSaveBlockedByRealism: false,
      generationTextSaveBlockedByHumanGravity: false,
      proseRealism: null,
      humanGravityValidation: null,
    });
    assert.ok(inv.softViolations.some((v) => v.invariantId === "inv.hook_pressure_consistent_with_continuity"));
  });

  it("detects human-gravity invalidity missing continuity flag", () => {
    const drift = new CrossSystemDriftDetectionService().detect({
      runId: "r1",
      sceneId: "s1",
      run: {
        output: {
          contractVersion: "1",
          generatedText: "",
          generationNotes: "",
          warnings: [],
          continuityFlags: [],
          advisoryOnly: true,
        },
        savedGenerationText: false,
        humanGravityTruth: HumanGravityTruthResultSchema.parse({
          sceneOutputValidUnderNoResetRules: false,
          upstreamNoResetPressureActive: true,
          noResetViolations: ["x"],
        }),
        registeredDependencyIds: [],
        canonicalPreGeneration: null,
      },
    });
    assert.ok(drift.findings.some((f) => f.code === "human_gravity_invalid_without_cluster6_flag"));
  });

  it("readiness inflation risk when cockpit claims production on non-canonical authority", () => {
    const r = evaluateReadinessEvidenceInflationRisk({
      cockpitMayPresentAsProductionGrade: true,
      artifactAuthorityClass: "advisory_runtime",
      certificationTruthRuleSatisfied: true,
    });
    assert.equal(r.inflated, true);
    assert.ok(r.reasons.some((x) => x.includes("artifact_authority")));
  });
});
