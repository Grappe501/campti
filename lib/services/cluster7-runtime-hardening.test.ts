import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationOutputV1 } from "@/lib/domain/scene-generation-output";
import { decidePersistenceGovernance } from "@/lib/services/persistence-governance-service";
import { RuntimeSemanticInvariantService } from "@/lib/services/runtime-semantic-invariant-service";
import { CrossSystemDriftDetectionService } from "@/lib/services/cross-system-drift-detection-service";
import { buildCluster7RuntimeTruthEnvelope, buildCockpitCertificationHardeningSummary } from "@/lib/services/cluster7-runtime-truth-service";
import { buildSceneGenerationCanonicalArtifactRecord } from "@/lib/services/canonical-artifact-record-service";
import { RealismTruthResultSchema } from "@/lib/domain/prose-realism";
import { HumanGravityTruthResultSchema } from "@/lib/domain/human-gravity-runtime";

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
  });
});
