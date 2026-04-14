import { createHash } from "node:crypto";

import {
  NarrativeAssemblyStatus,
  NarrativeContinuityState,
  NarrativeDependencyProducerKind,
} from "@prisma/client";

import type {
  RepairEligibilitySummary,
  RepairPolicyDecision,
  RevisionTriggerSource,
  SceneRepairMode,
  SceneRepairPlan,
  SceneStalenessReason,
} from "@/lib/domain/scene-repair";
import {
  SCENE_REPAIR_PROSE_POLICY,
} from "@/lib/domain/scene-repair";

const UPSTREAM_TRUTH_REASONS: ReadonlySet<SceneStalenessReason> = new Set([
  "genealogical_assertion_changed",
  "fact_stale",
  "world_state_changed",
  "pinned_cognition_changed",
  "promoted_simulation_changed",
  "social_field_changed",
  "dependency_graph_changed",
]);

export type SceneRepairPlanHints = {
  /** Last-run warnings from generation (e.g. social-pressure strings). */
  lastGenerationWarnings?: string[];
  /** Latest prose QA summary when available. */
  proseQuality?: { criticalIssueCount: number; warningIssueCount: number } | null;
  /** When true, treat social-field as a reason even without a matching edge. */
  socialFieldPossiblyChanged?: boolean;
  triggerSource?: RevisionTriggerSource;
};

export type SceneRepairClassificationContext = {
  scene: {
    id: string;
    chapterId: string;
    narrativeAssemblyStatus: NarrativeAssemblyStatus;
    continuityState: NarrativeContinuityState;
    generationText: string | null;
    authoringText: string | null;
  };
  chapter: {
    id: string;
    narrativeAssemblyStatus: NarrativeAssemblyStatus;
  } | null;
  dependencyEdges: { producerKind: NarrativeDependencyProducerKind }[];
  hints?: SceneRepairPlanHints;
};

function producerKindToReason(kind: NarrativeDependencyProducerKind): SceneStalenessReason {
  switch (kind) {
    case NarrativeDependencyProducerKind.GENEALOGICAL_ASSERTION:
      return "genealogical_assertion_changed";
    case NarrativeDependencyProducerKind.PERSON:
      return "fact_stale";
    case NarrativeDependencyProducerKind.WORLD_STATE_REFERENCE:
    case NarrativeDependencyProducerKind.PLACE:
    case NarrativeDependencyProducerKind.HISTORICAL_EVENT:
      return "world_state_changed";
    case NarrativeDependencyProducerKind.SIMULATION_SCENARIO:
      return "promoted_simulation_changed";
    case NarrativeDependencyProducerKind.COGNITION_SESSION:
      return "pinned_cognition_changed";
    case NarrativeDependencyProducerKind.EPIC:
    case NarrativeDependencyProducerKind.BOOK:
    case NarrativeDependencyProducerKind.CHAPTER:
      return "chapter_context_changed";
    case NarrativeDependencyProducerKind.LEGACY_CLAIM:
      return "dependency_graph_changed";
    default:
      return "dependency_graph_changed";
  }
}

function hashPlanInput(ctx: SceneRepairClassificationContext): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        sceneId: ctx.scene.id,
        assembly: ctx.scene.narrativeAssemblyStatus,
        continuity: ctx.scene.continuityState,
        chapterAssembly: ctx.chapter?.narrativeAssemblyStatus ?? null,
        edges: ctx.dependencyEdges.map((e) => e.producerKind).sort(),
        hints: ctx.hints ?? null,
      })
    )
    .digest("hex");
}

/**
 * Deterministic reasons from scene/chapter flags, dependency edges, and optional QA hints.
 */
export function classifySceneStaleness(ctx: SceneRepairClassificationContext): SceneStalenessReason[] {
  const reasons = new Set<SceneStalenessReason>();

  if (ctx.scene.narrativeAssemblyStatus === NarrativeAssemblyStatus.STALE) {
    if (ctx.dependencyEdges.length === 0) {
      reasons.add("dependency_graph_changed");
    } else {
      for (const e of ctx.dependencyEdges) {
        reasons.add(producerKindToReason(e.producerKind));
      }
    }
  }

  if (ctx.chapter?.narrativeAssemblyStatus === NarrativeAssemblyStatus.STALE) {
    reasons.add("chapter_context_changed");
  }

  if (
    ctx.scene.continuityState === NarrativeContinuityState.WARNING ||
    ctx.scene.continuityState === NarrativeContinuityState.BLOCKING
  ) {
    reasons.add("continuity_mismatch");
  }

  const pq = ctx.hints?.proseQuality;
  if (pq && pq.criticalIssueCount >= SCENE_REPAIR_PROSE_POLICY.suggestRepairMinCritical) {
    reasons.add("prose_quality_under_threshold");
  }

  const warns = ctx.hints?.lastGenerationWarnings ?? [];
  const socialHint = warns.some(
    (w) =>
      /social|pressure|field/i.test(w) &&
      /under|weak|low|missing/i.test(w)
  );
  if (socialHint || ctx.hints?.socialFieldPossiblyChanged) {
    if (ctx.hints?.socialFieldPossiblyChanged && !reasons.has("social_field_changed")) {
      reasons.add("social_field_changed");
    }
    if (socialHint) {
      reasons.add("social_pressure_underexpressed");
    }
  }

  return [...reasons];
}

export function decideProseRepairPolicy(criticalIssueCount: number): RepairPolicyDecision {
  if (criticalIssueCount <= SCENE_REPAIR_PROSE_POLICY.warnOnlyMaxCritical) {
    return "warn_only";
  }
  if (criticalIssueCount >= SCENE_REPAIR_PROSE_POLICY.autoRewriteMinCritical) {
    return "auto_run_generation_text";
  }
  return "enqueue_suggestion";
}

export function determineRepairEligibility(
  reasons: SceneStalenessReason[],
  scene: { authoringText: string | null; generationText: string | null },
  proseCritical: number
): RepairEligibilitySummary {
  const hasAuthoring = Boolean(scene.authoringText?.trim());
  const prosePolicy = decideProseRepairPolicy(proseCritical);

  const blockReasons: string[] = [];
  if (reasons.length === 0) {
    blockReasons.push("no_staleness_signals");
  }

  const requiresHumanReview =
    hasAuthoring && (reasons.some((r) => UPSTREAM_TRUTH_REASONS.has(r)) || prosePolicy !== "warn_only");

  const safeToAutoRepairGenerationTextOnly =
    reasons.length > 0 &&
    !hasAuthoring &&
    prosePolicy === "auto_run_generation_text";

  return {
    safeToAutoRepairGenerationTextOnly,
    requiresHumanReview,
    blockReasons,
    prosePolicy,
  };
}

/**
 * Priority: upstream truth → continuity → prose/social-only → chapter-only reassembly.
 */
export function chooseSceneRepairMode(
  reasons: SceneStalenessReason[],
  ctx: SceneRepairClassificationContext
): SceneRepairMode {
  if (reasons.length === 0) return "NO_AUTOMATIC_REPAIR";

  const sceneStale = ctx.scene.narrativeAssemblyStatus === NarrativeAssemblyStatus.STALE;
  const chapterStale = ctx.chapter?.narrativeAssemblyStatus === NarrativeAssemblyStatus.STALE;
  const onlyChapter =
    reasons.length === 1 && reasons[0] === "chapter_context_changed";
  const upstream = reasons.some((r) => UPSTREAM_TRUTH_REASONS.has(r));

  if (!sceneStale && chapterStale && (onlyChapter || (reasons.every((r) => r === "chapter_context_changed")))) {
    return "REASSEMBLE_CHAPTER_ONLY";
  }

  if (upstream && sceneStale) {
    return "REGENERATE_DRAFT";
  }

  if (reasons.includes("continuity_mismatch")) {
    if (ctx.scene.generationText?.trim()) {
      return "REPAIR_CONTINUITY";
    }
    return "REGENERATE_DRAFT";
  }

  if (
    reasons.includes("prose_quality_under_threshold") ||
    reasons.includes("social_pressure_underexpressed")
  ) {
    if (ctx.scene.generationText?.trim()) {
      return "REWRITE_EXISTING_DRAFT";
    }
    return "REGENERATE_DRAFT";
  }

  if (chapterStale && !sceneStale) {
    return "REASSEMBLE_CHAPTER_ONLY";
  }

  if (sceneStale) {
    return "REGENERATE_DRAFT";
  }

  return "NO_AUTOMATIC_REPAIR";
}

function modeToGeneration(
  mode: SceneRepairMode
): { generationMode: SceneRepairPlan["generationMode"]; generationPurpose: SceneRepairPlan["generationPurpose"] } {
  switch (mode) {
    case "REGENERATE_DRAFT":
      return { generationMode: "draft", generationPurpose: "author_draft" };
    case "REWRITE_EXISTING_DRAFT":
      return { generationMode: "rewrite", generationPurpose: "prose_rewrite" };
    case "REPAIR_CONTINUITY":
      return { generationMode: "repair", generationPurpose: "continuity_repair" };
    default:
      return { generationMode: null, generationPurpose: null };
  }
}

export function buildSceneRepairPlan(ctx: SceneRepairClassificationContext): SceneRepairPlan {
  const reasons = classifySceneStaleness(ctx);
  const triggerSource = ctx.hints?.triggerSource ?? "unknown";
  const proseCritical = ctx.hints?.proseQuality?.criticalIssueCount ?? 0;
  const eligibility = determineRepairEligibility(reasons, ctx.scene, proseCritical);
  const repairMode = chooseSceneRepairMode(reasons, ctx);
  const gen = modeToGeneration(repairMode);
  const notes: string[] = [];
  if (eligibility.requiresHumanReview) {
    notes.push("authoring_text_present_or_upstream_change: prefer human review before publish.");
  }

  return {
    contractVersion: "1",
    sceneId: ctx.scene.id,
    chapterId: ctx.chapter?.id ?? ctx.scene.chapterId ?? null,
    reasons,
    repairMode,
    generationMode: gen.generationMode,
    generationPurpose: gen.generationPurpose,
    inputSnapshotHash: hashPlanInput(ctx),
    triggerSource,
    eligibility,
    notes,
  };
}
