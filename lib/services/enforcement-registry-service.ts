/**
 * Cluster 2 — Enforcement registry: subsystem semantic truth + validation + readiness trust.
 *
 * Ground truth for “canonical path” is `buildRuntimeAuthorityRegistry` / `RUNTIME_ID_SCENE_CHAPTER_PRODUCTION`.
 */

import type {
  EnforcementRegistry,
  EnforcementSemanticViolation,
  ReadinessEvidenceTrustClass,
  ReadinessEvidenceTrustRecord,
  SubsystemEnforcementDeclaration,
} from "@/lib/domain/enforcement-contract";
import {
  ENFORCEMENT_REGISTRY_CONTRACT_VERSION,
  READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX,
} from "@/lib/domain/enforcement-contract";
import {
  RUNTIME_ID_BOOK1_OUTLINE_DRAFT,
  RUNTIME_ID_BOOK1_REGENERATION,
  RUNTIME_ID_COCKPIT_INSPECTION,
  RUNTIME_ID_DEPRECATED_CHAPTER_GENERATOR,
  RUNTIME_ID_DETERMINISTIC_PROOF,
  RUNTIME_ID_LEGACY_SCENE_ALIASES,
  RUNTIME_ID_REPORT_CERTIFICATION,
  RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
  RUNTIME_ID_TEST_HARNESS,
} from "@/lib/services/runtime-authority-registry-service";
import { buildRuntimeAuthorityRegistry } from "@/lib/services/runtime-authority-registry-service";

function d(params: SubsystemEnforcementDeclaration): SubsystemEnforcementDeclaration {
  return params;
}

export function buildSubsystemEnforcementDeclarations(): SubsystemEnforcementDeclaration[] {
  return [
    d({
      subsystemId: "canonical_scene_chapter_pipeline",
      subsystemName: "Canonical scene/chapter production pipeline",
      enforcementClass: "hard_enforced_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: true,
      canBlockInvalidExecution: true,
      canAffectReadiness: true,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_safe",
      deterministicOrSampleSeeded: "neither",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "hard_gate_or_mutation",
      semanticTruthNotes:
        "Orchestrates DB-backed scene generation and chapter assembly; invalid world/scene input can abort before LLM.",
      validationFlags: ["cluster2_canonical_path"],
    }),
    d({
      subsystemId: "scene_generation_service",
      subsystemName: "Scene generation service (runSceneGeneration)",
      enforcementClass: "hard_enforced_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: true,
      canBlockInvalidExecution: true,
      canAffectReadiness: true,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_safe",
      deterministicOrSampleSeeded: "neither",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "hard_gate_or_mutation",
      semanticTruthNotes:
        "Production path uses LLM adapter + contract validation; dependency registration and world-state assertions can block.",
      validationFlags: ["cluster2_orchestration"],
    }),
    d({
      subsystemId: "scene_generation_llm_output_contract",
      subsystemName: "SceneGenerationOutput / LLM prose envelope",
      enforcementClass: "advisory_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: true,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "neither",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes:
        "Wire contract marks `advisoryOnly`; model prose is not treated as independent canonical truth — persistence is still a production effect.",
      validationFlags: ["advisory_only_prose", "cluster2_truth_split"],
    }),
    d({
      subsystemId: "scene_generation_social_pressure_qa",
      subsystemName: "Social-pressure QA (deterministic advisories)",
      enforcementClass: "advisory_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_safe",
      deterministicOrSampleSeeded: "deterministic",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "observability_only",
      semanticTruthNotes: "Appends warnings; does not gate generation by default.",
      validationFlags: ["advisory_deterministic"],
    }),
    d({
      subsystemId: "scene_generation_humanization_advisory",
      subsystemName: "Prose humanization advisory",
      enforcementClass: "advisory_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "deterministic",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "observability_only",
      semanticTruthNotes: "Advisory scoring appended to warnings; non-blocking.",
      validationFlags: ["advisory_deterministic"],
    }),
    d({
      subsystemId: "chapter_assembly_service",
      subsystemName: "Chapter assembly (reader-facing text composition)",
      enforcementClass: "hard_enforced_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: true,
      canBlockInvalidExecution: true,
      canAffectReadiness: true,
      visibleInCockpit: false,
      visibleInReports: true,
      demoSafeStatus: "demo_safe",
      deterministicOrSampleSeeded: "neither",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "hard_gate_or_mutation",
      semanticTruthNotes: "Assembles canonical chapter presentation from scene records.",
      validationFlags: ["cluster2_assembly"],
    }),
    d({
      subsystemId: "scene_generation_engine_bundle",
      subsystemName: "Scene generation engine service (structured scene bundle)",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes:
        "Used heavily by book1 regeneration loop; not wired into `runSceneGeneration` production path (see canonical-runtime-path-map).",
      validationFlags: ["non_production_path", "regeneration_centric"],
    }),
    d({
      subsystemId: "book1_regeneration_loop",
      subsystemName: "Book1 regeneration super-pipeline",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "non_demo_safe",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes:
        "Scripted, artifact-centric chain; explicitly non-canonical for publication/readiness gating.",
      validationFlags: ["advisory_only", "noncanonical_guarded"],
    }),
    d({
      subsystemId: "beat_assembly_chain",
      subsystemName: "Chapter state → beat assembly chain",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "soft_constraint",
      semanticTruthNotes: "Drives cockpit summaries and regeneration gating context; not production scene orchestration.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "chapter_state",
      subsystemName: "Chapter state derivation",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Integrated in regeneration/report surfaces; not a production generation gate.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "narrative_psychology",
      subsystemName: "Narrative psychology layer",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Cockpit/report-facing in book1 flows; not enforced in production scene-generation path.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "narrative_threads",
      subsystemName: "Narrative threads (derivation + density)",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Sample packs and regeneration integration; observational for production.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "chapter_composition",
      subsystemName: "Chapter composition analysis",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Cockpit/report layer for book1 regeneration; not production gate.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "sequence_architecture",
      subsystemName: "Narrative sequence architecture derivation",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Regeneration-centric; does not gate production scene generation.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "prose_generation_constraints",
      subsystemName: "Prose generation constraints (voice/density envelopes)",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "soft_constraint",
      semanticTruthNotes:
        "Shapes prompts and compliance scoring in regeneration; production path applies separate voice/QA layers.",
      validationFlags: ["soft_only_outside_regen"],
    }),
    d({
      subsystemId: "literary_device_controls",
      subsystemName: "Literary device control plane",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Device panels and warnings are observational in current book1 path.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "epic_narrative_continuity_encs",
      subsystemName: "Epic narrative continuity (ENCS pack)",
      enforcementClass: "soft_enforced_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: true,
      canBlockInvalidExecution: true,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "mixed",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "soft_constraint",
      semanticTruthNotes:
        "Cluster 3: downstream bias + cockpit signals merge into prose constraints and sequence validation on the book1 regeneration orchestration path tied to scene/chapter production.",
      validationFlags: ["cluster3_runtime_governance", "readiness_explicit_allow"],
    }),
    d({
      subsystemId: "epic_emotional_gravity_eegs",
      subsystemName: "Epic emotional gravity (EEGS)",
      enforcementClass: "soft_enforced_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: true,
      canBlockInvalidExecution: true,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "mixed",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "soft_constraint",
      semanticTruthNotes:
        "Cluster 3: emotional gravity biases attachment/relational prose targets and drift flags before scene generation engine in book1 regeneration bundle.",
      validationFlags: ["cluster3_runtime_governance", "readiness_explicit_allow"],
    }),
    d({
      subsystemId: "hcel_hook_layer",
      subsystemName: "HCEL / hook continuity (ENCS validation + sequence layer)",
      enforcementClass: "soft_enforced_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: true,
      canBlockInvalidExecution: true,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "mixed",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "soft_constraint",
      semanticTruthNotes:
        "Cluster 3: epic continuity validation risks (including ANTI-DROPOFF hook rules) propagate into sequence validation flags and prose tension carry-forward.",
      validationFlags: ["cluster3_runtime_governance", "alias_hcel", "readiness_explicit_allow"],
    }),
    d({
      subsystemId: "narrator_presence_convergence",
      subsystemName: "Narrator presence & convergence",
      enforcementClass: "soft_enforced_runtime",
      authorityClass: "canonical_production",
      participatesInCanonicalRuntime: true,
      affectsCanonicalOutput: true,
      canBlockInvalidExecution: true,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "mixed",
      primaryRuntimeId: RUNTIME_ID_SCENE_CHAPTER_PRODUCTION,
      canonicalOutputEffectClass: "soft_constraint",
      semanticTruthNotes:
        "Cluster 3: full narrator pack mode profile merges via narrator→prose adapter after ENCS/EEGS; validation hard failures surface in prose drift flags (first-person convergence still gated).",
      validationFlags: ["cluster3_runtime_governance", "readiness_explicit_allow"],
    }),
    d({
      subsystemId: "route_recurrence_controls",
      subsystemName: "Route / settings recurrence (echo controls)",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Literary/cockpit observational controls in book1 path.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "callback_reinterpretation_reentry",
      subsystemName: "Callback / reinterpretation / re-entry markers",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Thread/callback markers surfaced in cockpit; not production enforcement.",
      validationFlags: ["regeneration_centric"],
    }),
    d({
      subsystemId: "regeneration_beat_gating",
      subsystemName: "Regeneration beat gating (blocked vs ready)",
      enforcementClass: "advisory_runtime",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: true,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "non_demo_safe",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_REGENERATION,
      canonicalOutputEffectClass: "soft_constraint",
      semanticTruthNotes: "Blocks regeneration branch only; does not block production scene generation.",
      validationFlags: ["non_canonical_path_blocking"],
    }),
    d({
      subsystemId: "author_command_cockpit_bundle",
      subsystemName: "Author command cockpit bundle",
      enforcementClass: "cockpit_only",
      authorityClass: "advisory_runtime",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: true,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "neither",
      primaryRuntimeId: RUNTIME_ID_COCKPIT_INSPECTION,
      canonicalOutputEffectClass: "observability_only",
      semanticTruthNotes:
        "Aggregates governed indicators; `mutatesCanonicalTruth: false` — must not be mistaken for generation enforcement.",
      validationFlags: ["observational_aggregate"],
    }),
    d({
      subsystemId: "report_export_certification",
      subsystemName: "Report / export / certification scripts",
      enforcementClass: "report_only",
      authorityClass: "report_only",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: true,
      visibleInCockpit: false,
      visibleInReports: true,
      demoSafeStatus: "demo_safe",
      deterministicOrSampleSeeded: "neither",
      primaryRuntimeId: RUNTIME_ID_REPORT_CERTIFICATION,
      canonicalOutputEffectClass: "none",
      semanticTruthNotes:
        "Emits evidence artifacts; may gate readiness only because `canGateReadiness` on report runtime — not runtime governance of generation.",
      validationFlags: ["readiness_report_surface"],
    }),
    d({
      subsystemId: "verification_script_surface",
      subsystemName: "Repository verification scripts (tsx tests + harness)",
      enforcementClass: "validation_only",
      authorityClass: "test_only",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: true,
      visibleInCockpit: false,
      visibleInReports: true,
      demoSafeStatus: "demo_safe",
      deterministicOrSampleSeeded: "deterministic",
      primaryRuntimeId: RUNTIME_ID_TEST_HARNESS,
      canonicalOutputEffectClass: "none",
      semanticTruthNotes: "CI/local integrity checks; not production runtime enforcement.",
      validationFlags: ["ci_governance"],
    }),
    d({
      subsystemId: "book1_outline_draft_generator",
      subsystemName: "Book1 outline draft generator",
      enforcementClass: "advisory_runtime",
      authorityClass: "simulation_only",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: false,
      visibleInReports: true,
      demoSafeStatus: "non_demo_safe",
      deterministicOrSampleSeeded: "sample_seeded",
      primaryRuntimeId: RUNTIME_ID_BOOK1_OUTLINE_DRAFT,
      canonicalOutputEffectClass: "advisory_shaping",
      semanticTruthNotes: "Draft/simulation exports only.",
      validationFlags: ["simulation_only_runtime"],
    }),
    d({
      subsystemId: "deterministic_proof_harness",
      subsystemName: "Deterministic interaction proof harness",
      enforcementClass: "validation_only",
      authorityClass: "simulation_only",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: false,
      visibleInReports: true,
      demoSafeStatus: "demo_with_warnings",
      deterministicOrSampleSeeded: "deterministic",
      primaryRuntimeId: RUNTIME_ID_DETERMINISTIC_PROOF,
      canonicalOutputEffectClass: "none",
      semanticTruthNotes: "Proof harness; not canonical production evidence.",
      validationFlags: ["deterministic_proof_only"],
    }),
    d({
      subsystemId: "legacy_scene_generation_aliases",
      subsystemName: "Legacy scene generation entry aliases",
      enforcementClass: "deprecated",
      authorityClass: "legacy_or_duplicate",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: false,
      visibleInReports: true,
      demoSafeStatus: "non_demo_safe",
      deterministicOrSampleSeeded: "neither",
      primaryRuntimeId: RUNTIME_ID_LEGACY_SCENE_ALIASES,
      canonicalOutputEffectClass: "none",
      semanticTruthNotes: "Wrappers only; do not use for authority claims.",
      validationFlags: ["legacy_wrapper_only"],
    }),
    d({
      subsystemId: "deprecated_chapter_generator_script",
      subsystemName: "Deprecated chapter generator script surface",
      enforcementClass: "deprecated",
      authorityClass: "deprecated",
      participatesInCanonicalRuntime: false,
      affectsCanonicalOutput: false,
      canBlockInvalidExecution: false,
      canAffectReadiness: false,
      visibleInCockpit: false,
      visibleInReports: true,
      demoSafeStatus: "non_demo_safe",
      deterministicOrSampleSeeded: "neither",
      primaryRuntimeId: RUNTIME_ID_DEPRECATED_CHAPTER_GENERATOR,
      canonicalOutputEffectClass: "none",
      semanticTruthNotes: "Historical reference only.",
      validationFlags: ["deprecated_surface"],
    }),
  ];
}

/**
 * Machine-checkable semantic validation for arbitrary declaration lists (extensions, CI, or what-if analysis).
 */
export function analyzeSubsystemEnforcementSemantics(
  declarations: SubsystemEnforcementDeclaration[],
  canonicalRuntimeId: string
): { semanticViolations: EnforcementSemanticViolation[]; ambiguousSubsystems: string[] } {
  const { violations, ambiguous } = validateSubsystemDeclarationRows(declarations, canonicalRuntimeId);
  return { semanticViolations: violations, ambiguousSubsystems: ambiguous };
}

export function meetsProductionEnforcedTruth(sub: SubsystemEnforcementDeclaration): boolean {
  return (
    sub.participatesInCanonicalRuntime && (sub.affectsCanonicalOutput || sub.canBlockInvalidExecution)
  );
}

function isLabeledHardOrSoftEnforcement(sub: SubsystemEnforcementDeclaration): boolean {
  return sub.enforcementClass === "hard_enforced_runtime" || sub.enforcementClass === "soft_enforced_runtime";
}

export function extractReadinessAuthoritativeAllowRuleId(validationFlags: string[]): string | null {
  for (const flag of validationFlags) {
    if (flag.startsWith(READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX)) {
      const id = flag.slice(READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX.length).trim();
      return id.length > 0 ? id : null;
    }
  }
  return null;
}

/** Classes that never count as authoritative production readiness unless `readiness_authoritative_evidence_allow:*` is set. */
function requiresReadinessAuthoritativeAllowance(sub: SubsystemEnforcementDeclaration): boolean {
  const c = sub.enforcementClass;
  if (
    c === "validation_only" ||
    c === "cockpit_only" ||
    c === "report_only" ||
    c === "advisory_runtime" ||
    c === "test_only" ||
    c === "not_implemented" ||
    c === "docs_only" ||
    c === "code_exists_not_wired" ||
    c === "deprecated"
  ) {
    return true;
  }
  if (sub.deterministicOrSampleSeeded !== "neither") return true;
  return false;
}

function validateSubsystemDeclarationRows(
  declarations: SubsystemEnforcementDeclaration[],
  canonicalRuntimeId: string
): { violations: EnforcementSemanticViolation[]; ambiguous: string[] } {
  const violations: EnforcementSemanticViolation[] = [];
  const ambiguous: string[] = [];
  const ids = new Set<string>();

  for (const sub of declarations) {
    if (ids.has(sub.subsystemId)) {
      violations.push({
        code: "duplicate_subsystem_id",
        severity: "error",
        subsystemId: sub.subsystemId,
        message: `Duplicate subsystemId ${sub.subsystemId}`,
      });
    }
    ids.add(sub.subsystemId);

    /** Enforcement truth: hard/soft imply canonical participation + output or block on that path. */
    if (isLabeledHardOrSoftEnforcement(sub) && !meetsProductionEnforcedTruth(sub)) {
      violations.push({
        code: "invalid_production_enforced_label",
        severity: "error",
        subsystemId: sub.subsystemId,
        message:
          "Enforcement classes hard_enforced_runtime / soft_enforced_runtime require participatesInCanonicalRuntime and (affectsCanonicalOutput or canBlockInvalidExecution).",
      });
    }

    if (
      sub.enforcementClass === "hard_enforced_runtime" &&
      sub.deterministicOrSampleSeeded !== "neither" &&
      !sub.validationFlags.includes("deterministic_allowed_hard_enforced")
    ) {
      violations.push({
        code: "hard_enforced_with_deterministic_seed_without_waiver",
        severity: "warning",
        subsystemId: sub.subsystemId,
        message:
          "hard_enforced subsystem with deterministic/sample seeding should be exceptional; verify production classification.",
      });
    }

    if (sub.enforcementClass === "advisory_runtime" && sub.validationFlags.includes("must_not_claim_enforced")) {
      violations.push({
        code: "internal_flag_misuse",
        severity: "error",
        subsystemId: sub.subsystemId,
        message: "Declaration already advisory; remove must_not_claim_enforced flag.",
      });
    }

    if (
      sub.enforcementClass === "advisory_runtime" &&
      sub.canAffectReadiness &&
      !sub.validationFlags.includes("readiness_explicit_allow")
    ) {
      ambiguous.push(sub.subsystemId);
    }

    if (sub.participatesInCanonicalRuntime && sub.primaryRuntimeId !== canonicalRuntimeId) {
      violations.push({
        code: "canonical_participation_runtime_mismatch",
        severity: "error",
        subsystemId: sub.subsystemId,
        message: `participatesInCanonicalRuntime requires primaryRuntimeId=${canonicalRuntimeId}.`,
      });
    }

    if (!sub.participatesInCanonicalRuntime && sub.affectsCanonicalOutput && sub.primaryRuntimeId === canonicalRuntimeId) {
      violations.push({
        code: "non_participant_affects_canonical",
        severity: "warning",
        subsystemId: sub.subsystemId,
        message: "Subsystem claims canonical output effect but not canonical path participation — verify split (e.g. advisory prose).",
      });
    }
  }

  return { violations, ambiguous };
}

export function classifyReadinessEvidenceTrust(
  enforcementClass: SubsystemEnforcementDeclaration["enforcementClass"]
): ReadinessEvidenceTrustRecord {
  const base = classifyReadinessEvidenceTrustBase(enforcementClass);
  return {
    ...base,
    mayCountAsAuthoritativeProductionReadinessEvidence: false,
    readinessTrustAllowanceRuleId: null,
  };
}

function classifyReadinessEvidenceTrustBase(
  enforcementClass: SubsystemEnforcementDeclaration["enforcementClass"]
): Omit<ReadinessEvidenceTrustRecord, "mayCountAsAuthoritativeProductionReadinessEvidence" | "readinessTrustAllowanceRuleId"> {
  switch (enforcementClass) {
    case "hard_enforced_runtime":
      return {
        enforcementClass,
        trustClass: "authoritative_production",
        mayCountAsRuntimeReadinessProof: true,
        requiresExplicitQualifier: false,
        notes:
          "Use evaluateReadinessEvidenceTrustRecord(subsystem) for authoritative production readiness; class-only view cannot prove canonical participation.",
      };
    case "soft_enforced_runtime":
      return {
        enforcementClass,
        trustClass: "qualified_production",
        mayCountAsRuntimeReadinessProof: true,
        requiresExplicitQualifier: true,
        notes:
          "Use evaluateReadinessEvidenceTrustRecord(subsystem) for authoritative production readiness; soft enforcement requires qualification.",
      };
    case "advisory_runtime":
      return {
        enforcementClass,
        trustClass: "observational_only",
        mayCountAsRuntimeReadinessProof: false,
        requiresExplicitQualifier: true,
        notes: "Does not prove production enforcement; may inform narrative quality only.",
      };
    case "validation_only":
    case "test_only":
      return {
        enforcementClass,
        trustClass: "inadmissible_for_runtime_governance",
        mayCountAsRuntimeReadinessProof: false,
        requiresExplicitQualifier: false,
        notes: "Tests/validation prove build integrity, not runtime narrative governance.",
      };
    case "cockpit_only":
    case "report_only":
      return {
        enforcementClass,
        trustClass: "observational_only",
        mayCountAsRuntimeReadinessProof: false,
        requiresExplicitQualifier: true,
        notes: "Reports/cockpit are not runtime enforcement; report pipeline may still emit readiness summaries.",
      };
    case "code_exists_not_wired":
    case "not_implemented":
    case "docs_only":
      return {
        enforcementClass,
        trustClass: "disallowed_non_production",
        mayCountAsRuntimeReadinessProof: false,
        requiresExplicitQualifier: false,
        notes: "No runtime governance claim.",
      };
    case "deprecated":
      return {
        enforcementClass,
        trustClass: "disallowed_non_production",
        mayCountAsRuntimeReadinessProof: false,
        requiresExplicitQualifier: false,
        notes: "Deprecated — do not use for new readiness claims.",
      };
  }
}

/**
 * Machine-readable readiness trust for a full subsystem declaration (canonical path + seeding + explicit allow rules).
 */
export function evaluateReadinessEvidenceTrustRecord(sub: SubsystemEnforcementDeclaration): ReadinessEvidenceTrustRecord {
  const base = classifyReadinessEvidenceTrustBase(sub.enforcementClass);
  const ruleId = extractReadinessAuthoritativeAllowRuleId(sub.validationFlags);
  const needsAllow = requiresReadinessAuthoritativeAllowance(sub);
  const meetsTruth = meetsProductionEnforcedTruth(sub);
  const hardOrSoft = isLabeledHardOrSoftEnforcement(sub);

  let mayCountAsAuthoritativeProductionReadinessEvidence: boolean;
  if (ruleId) {
    mayCountAsAuthoritativeProductionReadinessEvidence = true;
  } else if (needsAllow) {
    mayCountAsAuthoritativeProductionReadinessEvidence = false;
  } else {
    mayCountAsAuthoritativeProductionReadinessEvidence = hardOrSoft && meetsTruth;
  }

  const requiresExplicitQualifier =
    base.requiresExplicitQualifier ||
    Boolean(ruleId) ||
    (mayCountAsAuthoritativeProductionReadinessEvidence && sub.enforcementClass === "soft_enforced_runtime");

  return {
    ...base,
    mayCountAsAuthoritativeProductionReadinessEvidence,
    readinessTrustAllowanceRuleId: ruleId,
    requiresExplicitQualifier,
    notes: ruleId
      ? `${base.notes} Authoritative readiness exception: ${READINESS_AUTHORITATIVE_EVIDENCE_ALLOW_PREFIX}${ruleId}.`
      : base.notes,
  };
}

/** @deprecated Prefer {@link evaluateReadinessEvidenceTrustRecord} with a full subsystem declaration. */
export const evaluateReadinessEvidenceTrust = classifyReadinessEvidenceTrust;

export function buildEnforcementRegistry(now: Date = new Date()): EnforcementRegistry {
  const ra = buildRuntimeAuthorityRegistry();
  const canonicalRuntimeId = ra.canonicalRuntimeId;
  const declarations = buildSubsystemEnforcementDeclarations();
  const { violations, ambiguous } = validateSubsystemDeclarationRows(declarations, canonicalRuntimeId);

  return {
    contractVersion: ENFORCEMENT_REGISTRY_CONTRACT_VERSION,
    canonicalRuntimeId,
    generatedAtIso: now.toISOString(),
    subsystemDeclarations: declarations,
    semanticViolations: violations,
    ambiguousSubsystems: ambiguous,
    validationFlags: [
      "cluster2_enforcement_registry",
      "paired_with_runtime_authority_lock",
      "enforcement_truth_production_path_v1",
      "readiness_evidence_authoritative_rule_v1",
    ],
  };
}

export function validateEnforcementRegistry(registry: EnforcementRegistry = buildEnforcementRegistry()): EnforcementRegistry {
  const errors = registry.semanticViolations.filter((v) => v.severity === "error");
  if (errors.length > 0) {
    const first = errors[0];
    throw new Error(
      `[enforcement-registry] semantic violations: ${errors.length} error(s). First: [${first?.code}] ${first?.message}`
    );
  }
  return registry;
}

export function assertSubsystemDeclaration(
  subsystemId: string,
  registry: EnforcementRegistry = validateEnforcementRegistry(buildEnforcementRegistry())
): SubsystemEnforcementDeclaration {
  const found = registry.subsystemDeclarations.find((s) => s.subsystemId === subsystemId);
  if (!found) throw new Error(`[enforcement-registry] unknown subsystemId: ${subsystemId}`);
  return found;
}
