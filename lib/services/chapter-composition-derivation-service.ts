import type { ChapterState } from "@/lib/domain/chapter-state";
import type { ChapterNarrativePsychology } from "@/lib/domain/narrative-psychology";
import {
  ChapterCompositionCockpitSummarySchema,
  ChapterCompositionPlanSchema,
  type ChapterCompositionCockpitSummary,
  type ChapterCompositionMode,
  type ChapterCompositionPlan,
  type ChapterClosureProfile,
  type DelayedConvergenceBinding,
  type SceneRole,
} from "@/lib/domain/chapter-composition";
import type { NarrativeThread } from "@/lib/domain/narrative-thread";
import { ChapterCallbackPlanningService } from "@/lib/services/chapter-callback-planning-service";
import { ChapterCompositionDensityService } from "@/lib/services/chapter-composition-density-service";
import { ChapterCompositionToScenePlanService } from "@/lib/services/chapter-composition-to-scene-plan-service";
import { ChapterReinterpretationAnchorService } from "@/lib/services/chapter-reinterpretation-anchor-service";
import { PhilosophyPropagationService } from "@/lib/services/philosophy-propagation-service";
import { RouteRecurrenceLedgerService } from "@/lib/services/route-recurrence-ledger-service";

function chooseCompositionMode(psychology: ChapterNarrativePsychology, chapterState: ChapterState): ChapterCompositionMode {
  if (chapterState.stateAxes.external_awareness.score >= 60 && chapterState.stateAxes.signal_integrity.score <= 55) return "route_braided";
  if (psychology.axisTargets.unresolved_pull >= 0.72) return "delayed_convergence";
  if (chapterState.stateAxes.relational_heat.score >= 60) return "relational_spread";
  if (chapterState.stateAxes.meaning_load.score >= 60) return "layered_pressure";
  return "braided_continuity";
}

function chooseClosureProfile(psychology: ChapterNarrativePsychology, chapterState: ChapterState): ChapterClosureProfile {
  if (chapterState.stateAxes.external_awareness.score >= 60) return "route_expansion";
  if (chapterState.stateAxes.relational_heat.score >= 58) return "relational_uncertainty";
  if (psychology.axisTargets.unresolved_pull >= 0.7) return "convergence_teased";
  return "active_unresolved";
}

function deriveSceneCount(psychology: ChapterNarrativePsychology, chapterState: ChapterState): number {
  let score = 3;
  if (psychology.axisTargets.place_immersion >= 0.65) score += 1;
  if (psychology.axisTargets.unresolved_pull >= 0.72) score += 1;
  if (chapterState.stateAxes.relational_heat.score >= 58) score += 1;
  return Math.max(2, Math.min(6, score));
}

function deriveRoleSequence(input: {
  sceneCountTarget: number;
  chapterState: ChapterState;
  activePhilosophyThreadIds: string[];
  hasRouteRequirementGap: boolean;
}): SceneRole[] {
  const roles: SceneRole[] = ["grounding_scene"];
  if (input.chapterState.stateAxes.relational_heat.score >= 55) roles.push("relational_scene");
  if (input.chapterState.stateAxes.external_awareness.score >= 52 || input.hasRouteRequirementGap) roles.push("route_signal_scene");
  if (input.activePhilosophyThreadIds.length > 0) roles.push("philosophy_echo_scene");
  roles.push("rumor_scene");
  while (roles.length < input.sceneCountTarget - 1) {
    roles.push(input.chapterState.stateAxes.memory_continuity.score >= 70 ? "memory_echo_scene" : "warning_scene");
  }
  roles.push("closure_scene");
  return roles.slice(0, input.sceneCountTarget);
}

export class ChapterCompositionDerivationService {
  private readonly routeLedgerService = new RouteRecurrenceLedgerService();
  private readonly scenePlanService = new ChapterCompositionToScenePlanService();
  private readonly callbackService = new ChapterCallbackPlanningService();
  private readonly reinterpretationService = new ChapterReinterpretationAnchorService();
  private readonly densityService = new ChapterCompositionDensityService();
  private readonly philosophyService = new PhilosophyPropagationService();

  derive(input: {
    chapterId: string;
    parentBookId: string;
    parentNarrativePsychologyId: string;
    parentChapterStateId: string;
    chapterPsychology: ChapterNarrativePsychology;
    chapterState: ChapterState;
    narrativeThreads: NarrativeThread[];
    requiredLocations: Array<{ locationId: string; locationName: string }>;
    routePresenceEvents: Array<{
      locationId: string;
      locationName: string;
      chapterId: string;
      mode:
        | "direct_scene_setting"
        | "rumor_report"
        | "messenger_trader_origin"
        | "trade_goods_origin_destination"
        | "kinship_connection"
        | "remembered_place"
        | "expected_danger"
        | "ceremonial_tie"
        | "route_linkage"
        | "environmental_downstream_upstream_signal"
        | "warning_associated_with_place";
      associatedThreads: string[];
    }>;
  }): {
    plan: ChapterCompositionPlan;
    routeLedger: ReturnType<RouteRecurrenceLedgerService["buildLedger"]>;
    philosophyPlan: ReturnType<PhilosophyPropagationService["derivePlan"]>;
    cockpitSummary: ChapterCompositionCockpitSummary;
  } {
    const activeThreadIds = input.narrativeThreads
      .filter((thread) => ["active", "converging", "recalled"].includes(thread.currentStatus))
      .map((thread) => thread.threadId);
    const latentThreadIds = input.narrativeThreads
      .filter((thread) => ["latent", "suppressed", "redirected"].includes(thread.currentStatus))
      .map((thread) => thread.threadId);
    const callbackThreadIds = input.narrativeThreads.filter((thread) => thread.callbackPotential >= 0.6).map((thread) => thread.threadId);
    const activePhilosophyThreadIds = input.narrativeThreads
      .filter((thread) => thread.threadType === "philosophy_thread" || thread.threadType === "belief_worldview_thread")
      .map((thread) => thread.threadId);
    const routeLedger = this.routeLedgerService.buildLedger({
      currentBookId: input.parentBookId,
      requiredLocations: input.requiredLocations,
      events: input.routePresenceEvents,
    });
    const hasRouteRequirementGap = routeLedger.enforcementWarnings.length > 0;
    const compositionMode = chooseCompositionMode(input.chapterPsychology, input.chapterState);
    const sceneCountTarget = deriveSceneCount(input.chapterPsychology, input.chapterState);
    const roleSequence = deriveRoleSequence({
      sceneCountTarget,
      chapterState: input.chapterState,
      activePhilosophyThreadIds,
      hasRouteRequirementGap,
    });
    const delayedConvergenceKeys = [
      `${input.chapterId}:route-pressure-cluster`,
      `${input.chapterId}:warning-memory-cluster`,
    ];
    const sceneSequence = this.scenePlanService.buildScenePlans({
      chapterId: input.chapterId,
      sceneCountTarget,
      roleSequence,
      activeThreadIds,
      latentThreadIds,
      philosophyThreadIds: activePhilosophyThreadIds,
      requiredLocationIds: input.requiredLocations.map((location) => location.locationId),
      povCandidates: input.chapterState.povWeightingCandidates.map((candidate) => ({
        povId: candidate.characterId,
        weight: candidate.weight,
      })),
      delayedConvergenceKeys,
    });
    const callbackMarkers = this.callbackService.deriveCallbackMarkers(sceneSequence);
    const reinterpretationAnchors = this.reinterpretationService.deriveAnchors({
      chapterId: input.chapterId,
      sceneSequence,
      defaultOriginalPov: input.chapterState.povWeightingCandidates[0]?.characterId ?? "primary-pov",
      alternatePovCandidates: input.chapterState.povWeightingCandidates.slice(1).map((candidate) => candidate.characterId),
    });
    const delayedConvergenceBindings: DelayedConvergenceBinding[] = delayedConvergenceKeys.map((key) => {
      const boundScenes = sceneSequence.filter((scene) => scene.delayedConvergenceKeys.includes(key)).map((scene) => scene.scenePlanId);
      return {
        delayedConvergenceKey: key,
        hiddenConvergenceBinding: boundScenes.length > 0 ? boundScenes : [sceneSequence[0].scenePlanId],
        convergenceWindow: "chapter+2..book+1",
        convergencePayoffTarget: `${input.parentBookId}:later-convergence`,
        connectionVisibilityNow: "apparently_isolated",
        connectionVisibilityLater: "convergent_later",
      };
    });

    const philosophyPlan = this.philosophyService.derivePlan({
      chapterId: input.chapterId,
      activePhilosophyThreadIds,
      explicitnessCeiling: Math.min(0.45, 1 - input.chapterPsychology.axisTargets.meaning_depth * 0.35),
      sceneSequence,
    });

    const density = this.densityService.analyze({
      sceneSequence,
      activeThreadIds,
      latentThreadIds,
      callbackMarkersCount: callbackMarkers.length,
      hasRoutePresence: routeLedger.rows.some((row) => row.recurrenceSatisfied),
      hasUnresolvedCarryForward: true,
      hasDelayedConvergence: delayedConvergenceBindings.length > 0,
    });
    const chapterClosureProfile = chooseClosureProfile(input.chapterPsychology, input.chapterState);
    const plan = ChapterCompositionPlanSchema.parse({
      artifact: "chapter_composition_plan",
      schemaVersion: "1.0.0",
      compositionPlanId: `${input.chapterId}:composition-plan`,
      chapterId: input.chapterId,
      parentBookId: input.parentBookId,
      parentNarrativePsychologyId: input.parentNarrativePsychologyId,
      parentChapterStateId: input.parentChapterStateId,
      activeThreadIds,
      latentThreadIds,
      callbackThreadIds,
      routeRequirementStatus: {
        requiredLocationIds: input.requiredLocations.map((location) => location.locationId),
        missingLocationIds: routeLedger.rows.filter((row) => !row.recurrenceSatisfied).map((row) => row.locationId),
        recurrenceSatisfied: routeLedger.enforcementWarnings.length === 0,
        enforcementNotes: routeLedger.enforcementWarnings,
      },
      philosophyRequirementStatus: {
        activePhilosophyThreadIds,
        explicitnessCeiling: philosophyPlan.explicitnessCeiling,
        satisfied: activePhilosophyThreadIds.length === 0 || philosophyPlan.sceneLevelPlacementSuggestions.length > 0,
        warnings: activePhilosophyThreadIds.length === 0 ? [] : ["Use action and consequence carriers before direct declaration."],
      },
      compositionMode,
      sceneCountTarget,
      sceneSequence,
      sceneContrastProfile: {
        tonalContrast: 0.68,
        pressureContrast: 0.72,
        threadMixContrast: 0.71,
        settingContrast: 0.64,
        notes: ["Purposeful contrast between labor grounding, social signal, and delayed-convergence rumor scene."],
      },
      delayedConvergenceBindings,
      callbackMarkers,
      reinterpretationAnchors,
      densityScore: density.densityScore,
      densityWarnings: density.densityWarnings,
      routeCoverageNotes: routeLedger.enforcementWarnings.length > 0 ? routeLedger.enforcementWarnings : ["All major route locations have meaningful presence."],
      continuityCarryForwardPlan: [
        "Carry route-pressure signal into next chapter via rumor-to-confirmation shift.",
        "Preserve relational uncertainty through unresolved duty exchange.",
      ],
      unresolvedPressurePlan: [
        "Keep unresolved pull above settlement threshold at chapter close.",
        "Retain one hidden-linked scene element for delayed convergence.",
      ],
      chapterClosureProfile,
      validationFlags: density.hardThinChapterFlag ? ["hard_thin_chapter_flag"] : [],
    });

    const cockpitSummary = ChapterCompositionCockpitSummarySchema.parse({
      chapterId: input.chapterId,
      compositionMode: plan.compositionMode,
      sceneCount: plan.sceneSequence.length,
      sceneRoleSpread: plan.sceneSequence.map((scene) => scene.sceneRole),
      dominantThreadFamilies: plan.activeThreadIds,
      latentThreadFamilies: plan.latentThreadIds,
      delayedConvergenceMarkers: plan.delayedConvergenceBindings.map((binding) => binding.delayedConvergenceKey),
      callbackMarkers: plan.callbackMarkers.map((marker) => marker.callbackId),
      reinterpretationAnchorIds: plan.reinterpretationAnchors.map((anchor) => anchor.reinterpretationAnchorId),
      routeCoverageStatus: plan.routeRequirementStatus.recurrenceSatisfied ? "satisfied" : "missing_required_presence",
      philosophyPropagationStatus: plan.philosophyRequirementStatus.satisfied ? "active_non_preachy" : "insufficient_carriers",
      densityScore: plan.densityScore,
      thinnessWarnings: plan.densityWarnings,
      chapterClosureProfile: plan.chapterClosureProfile,
      carryForwardUnresolvedPressureSummary: plan.unresolvedPressurePlan,
    });

    return { plan, routeLedger, philosophyPlan, cockpitSummary };
  }
}
