import type { CanonicalPreGenerationBundle } from "@/lib/domain/canonical-scene-generation-governance";
import type { SceneGenerationOutputV1 } from "@/lib/domain/scene-generation-output";
import type {
  InvariantResult,
  RuntimeSemanticInvariantReport,
} from "@/lib/domain/runtime-semantic-invariant";
import { RUNTIME_SEMANTIC_INVARIANT_CATALOG, RUNTIME_SEMANTIC_INVARIANT_CONTRACT_VERSION } from "@/lib/domain/runtime-semantic-invariant";
import type { HumanGravityRuntimeProfile, HumanGravityValidationBundle } from "@/lib/domain/human-gravity-runtime";
import type { ProseRealismValidationBundle } from "@/lib/domain/prose-realism";

export type SemanticInvariantEvaluationContext = {
  runId: string;
  sceneId: string;
  applyCanonicalNarrativeGovernance: boolean;
  canonicalPreGeneration: CanonicalPreGenerationBundle | null | undefined;
  output: SceneGenerationOutputV1;
  saveGenerationTextRequested: boolean;
  savedGenerationText: boolean;
  generationTextSaveBlockedByRealism: boolean;
  generationTextSaveBlockedByHumanGravity: boolean;
  proseRealism: ProseRealismValidationBundle | null | undefined;
  humanGravityValidation: HumanGravityValidationBundle | null | undefined;
  /** When present, enables human-gravity **coherence** checks against influence truth (Cluster 6). */
  humanGravityRuntime?: HumanGravityRuntimeProfile | null;
};

function byId(id: string) {
  const d = RUNTIME_SEMANTIC_INVARIANT_CATALOG.find((x) => x.invariantId === id);
  if (!d) throw new Error(`Unknown invariant ${id}`);
  return d;
}

export class RuntimeSemanticInvariantService {
  evaluate(ctx: SemanticInvariantEvaluationContext): RuntimeSemanticInvariantReport {
    const results: InvariantResult[] = [];

    results.push(this.evalCanonicalMerge(ctx));
    results.push(this.evalCluster3Packs(ctx));
    results.push(this.evalNarrator(ctx));
    results.push(this.evalProseRealism(ctx));
    results.push(this.evalNoReset(ctx));
    results.push(this.evalAdvisoryEnvelope(ctx));
    results.push(this.evalPersistence(ctx));
    results.push(this.evalHumanGravityCoherence(ctx));
    results.push(this.evalHookPressureContinuity(ctx));
    results.push(this.evalEnforcementTruthPlaceholder());
    results.push(this.evalReadinessEvidencePlaceholder());

    const hardViolations = results.filter((r) => !r.passed && r.severity === "hard");
    const softViolations = results.filter((r) => !r.passed && r.severity === "soft");
    const warnings = results.filter((r) => !r.passed && (r.severity === "warning" || r.severity === "info"));

    const suggestedRepairs: string[] = [];
    for (const r of results.filter((x) => !x.passed)) {
      if (r.message) suggestedRepairs.push(`${r.invariantId}: ${r.message}`);
    }

    return {
      contractVersion: RUNTIME_SEMANTIC_INVARIANT_CONTRACT_VERSION,
      runId: ctx.runId,
      sceneId: ctx.sceneId,
      invariantResults: results,
      hardViolations,
      softViolations,
      warnings,
      suggestedRepairs,
      validationFlags: ["cluster7_semantic_invariants"],
    };
  }

  private evalCanonicalMerge(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.canonical_governance_merge");
    if (ctx.applyCanonicalNarrativeGovernance === false) {
      return {
        invariantId: def.invariantId,
        invariantClass: def.invariantClass,
        passed: true,
        severity: def.severity,
        enforcementMode: def.enforcementMode,
        message: null,
        validationFlags: ["skipped_no_canonical_prep_requested"],
      };
    }
    const ok = Boolean(ctx.canonicalPreGeneration?.governanceMergeApplied);
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: ok,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: ok ? null : "Canonical narrative governance merge did not apply — bundle not canonical-equivalent.",
      validationFlags: def.validationFlags,
    };
  }

  private evalCluster3Packs(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.cluster3_pack_integrity");
    const p = ctx.canonicalPreGeneration?.packValidations;
    if (!p) {
      return {
        invariantId: def.invariantId,
        invariantClass: def.invariantClass,
        passed: true,
        severity: def.severity,
        enforcementMode: def.enforcementMode,
        message: null,
        validationFlags: ["skipped_no_pack_snapshot"],
      };
    }
    const c3 = ctx.canonicalPreGeneration?.cluster3RuntimeActivationTruth;
    const continuityBad = !p.epicContinuity.valid && (c3?.encsMaterialInfluences.length ?? 0) > 0;
    const emotionalBad = !p.epicEmotionalGravity.valid && (c3?.eegsMaterialInfluences.length ?? 0) > 0;
    const ok = !continuityBad && !emotionalBad;
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: ok,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: ok
        ? null
        : "Epic continuity or emotional gravity pack invalid while marked material — semantic drift risk.",
      validationFlags: def.validationFlags,
    };
  }

  private evalNarrator(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.narrator_presence_valid");
    const p = ctx.canonicalPreGeneration?.packValidations;
    const c3 = ctx.canonicalPreGeneration?.cluster3RuntimeActivationTruth;
    if (!p || !c3) {
      return {
        invariantId: def.invariantId,
        invariantClass: def.invariantClass,
        passed: true,
        severity: def.severity,
        enforcementMode: def.enforcementMode,
        message: null,
        validationFlags: ["skipped_no_narrator_snapshot"],
      };
    }
    const narratorBad = !p.narratorPresence.valid && (c3.narratorMaterialInfluences.length ?? 0) > 0;
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: !narratorBad,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: narratorBad ? "Narrator presence invalid while narrator influences are material (advisory)." : null,
      validationFlags: def.validationFlags,
    };
  }

  private evalProseRealism(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.prose_realism_critical");
    if (!ctx.proseRealism) {
      return {
        invariantId: def.invariantId,
        invariantClass: def.invariantClass,
        passed: true,
        severity: def.severity,
        enforcementMode: def.enforcementMode,
        message: null,
        validationFlags: ["skipped_no_prose_realism_layer"],
      };
    }
    const ok = ctx.proseRealism.realismTruth.sceneOutputValidUnderRealismRules;
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: ok,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: ok ? null : "Prose realism truth reports invalid scene output under realism rules.",
      validationFlags: def.validationFlags,
    };
  }

  private evalNoReset(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.no_reset_when_pressured");
    if (!ctx.humanGravityValidation) {
      return {
        invariantId: def.invariantId,
        invariantClass: def.invariantClass,
        passed: true,
        severity: def.severity,
        enforcementMode: def.enforcementMode,
        message: null,
        validationFlags: ["skipped_no_human_gravity_validation"],
      };
    }
    const ok = ctx.humanGravityValidation.humanGravityTruth.sceneOutputValidUnderNoResetRules;
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: ok,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: ok ? null : "No-reset human-gravity rules failed — not valid for canonical promotion.",
      validationFlags: def.validationFlags,
    };
  }

  private evalAdvisoryEnvelope(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.scene_output_advisory_envelope");
    const ok = ctx.output.advisoryOnly === true;
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: ok,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: ok ? null : "Scene generation output must remain advisoryOnly at the contract boundary.",
      validationFlags: def.validationFlags,
    };
  }

  private evalPersistence(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.persistence_matches_block_flags");
    const contradictory =
      ctx.savedGenerationText && (ctx.generationTextSaveBlockedByRealism || ctx.generationTextSaveBlockedByHumanGravity);
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: !contradictory,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: contradictory
        ? "Persisted generation text contradicts save-block flags — persistence governance drift."
        : null,
      validationFlags: def.validationFlags,
    };
  }

  private evalEnforcementTruthPlaceholder(): InvariantResult {
    const def = byId("inv.enforcement_truth_scene_scope");
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: true,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: null,
      validationFlags: ["deferred_attach_enforcement_registry_to_scene_run"],
    };
  }

  private evalReadinessEvidencePlaceholder(): InvariantResult {
    const def = byId("inv.readiness_evidence_not_inflated");
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: true,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: null,
      validationFlags: ["evaluated_at_readiness_or_cockpit_scope_only"],
    };
  }

  private evalHumanGravityCoherence(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.human_gravity_runtime_coherent");
    if (!ctx.canonicalPreGeneration?.governanceMergeApplied) {
      return {
        invariantId: def.invariantId,
        invariantClass: def.invariantClass,
        passed: true,
        severity: def.severity,
        enforcementMode: def.enforcementMode,
        message: null,
        validationFlags: ["skipped_no_governance_merge"],
      };
    }
    const hg = ctx.humanGravityRuntime;
    if (!hg) {
      return {
        invariantId: def.invariantId,
        invariantClass: def.invariantClass,
        passed: true,
        severity: def.severity,
        enforcementMode: def.enforcementMode,
        message: null,
        validationFlags: ["skipped_no_human_gravity_runtime_profile"],
      };
    }
    const substantiveLines = hg.promptInstructionLines.filter(
      (l) =>
        l.trim().length > 0 &&
        !l.trim().startsWith("CLUSTER6_HUMAN_GRAVITY") &&
        !l.startsWith("— Prefer implication"),
    );
    const promptThin = substantiveLines.length < 3 && hg.humanGravityScore >= 0.45;
    const influenceInactive =
      !hg.runtimeInfluenceTruth.humanGravityCanonicalRuntimeActive &&
      !hg.runtimeInfluenceTruth.noResetValidationParticipatesInCanonicalValidity &&
      hg.humanGravityScore >= 0.35;
    const ok = !promptThin && !influenceInactive;
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: ok,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: ok
        ? null
        : promptThin
          ? "Human-gravity score is high but CLUSTER6 substantive prompt lines are thin — generation path may not carry gravity."
          : "Human-gravity profile is substantive but influence truth reports inactive without no-reset gate — labeling drift risk.",
      validationFlags: def.validationFlags,
    };
  }

  private evalHookPressureContinuity(ctx: SemanticInvariantEvaluationContext): InvariantResult {
    const def = byId("inv.hook_pressure_consistent_with_continuity");
    const pre = ctx.canonicalPreGeneration;
    const c3 = pre?.cluster3RuntimeActivationTruth;
    const cont = pre?.packValidations?.epicContinuity;
    if (!pre?.governanceMergeApplied || !c3 || !cont) {
      return {
        invariantId: def.invariantId,
        invariantClass: def.invariantClass,
        passed: true,
        severity: def.severity,
        enforcementMode: def.enforcementMode,
        message: null,
        validationFlags: ["skipped_no_hook_continuity_snapshot"],
      };
    }
    const bad = Boolean(c3.hcelHookHardSignalsActive && !cont.valid);
    return {
      invariantId: def.invariantId,
      invariantClass: def.invariantClass,
      passed: !bad,
      severity: def.severity,
      enforcementMode: def.enforcementMode,
      message: bad
        ? "Hard hook signals active while epic continuity pack is invalid — treat hook pressure as advisory until continuity recovers."
        : null,
      validationFlags: def.validationFlags,
    };
  }
}
