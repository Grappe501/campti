import type {
  AuthorCockpitScope,
  CockpitIndicator,
  ScopeIndicatorBank,
} from "@/lib/domain/author-command-cockpit";

function levelFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

function indicator(key: string, label: string, value: number | string, severity: "low" | "medium" | "high"): CockpitIndicator {
  return {
    key,
    label,
    value,
    severity,
    source: "governed_state",
    explainable: true,
  };
}

export function buildIndicatorBank(input: {
  scope: AuthorCockpitScope;
  metrics: Record<string, number>;
}): ScopeIndicatorBank {
  const m = input.metrics;
  if (input.scope === "scene") {
    return {
      scope: "scene",
      indicators: [
        indicator("emotional_intensity", "Emotional intensity", m.emotionalIntensity ?? 0, levelFromScore(m.emotionalIntensity ?? 0)),
        indicator("unresolved_pressure", "Unresolved pressure", m.unresolvedPressure ?? 0, levelFromScore(m.unresolvedPressure ?? 0)),
        indicator("memory_activation_load", "Memory activation load", m.memoryActivationLoad ?? 0, levelFromScore(m.memoryActivationLoad ?? 0)),
        indicator("relationship_tension", "Relationship tension", m.relationshipTension ?? 0, levelFromScore(m.relationshipTension ?? 0)),
        indicator("continuity_risk", "Continuity risk", m.continuityRisk ?? 0, levelFromScore(m.continuityRisk ?? 0)),
        indicator("interaction_sensitivity", "Interaction sensitivity", m.interactionSensitivity ?? 0, levelFromScore(m.interactionSensitivity ?? 0)),
        indicator("voice_readiness", "Voice readiness", m.voiceReadiness ?? 0, levelFromScore(1 - (m.voiceReadiness ?? 0))),
        indicator("scene_function", "Scene function strength", m.sceneFunction ?? 0, levelFromScore(1 - (m.sceneFunction ?? 0))),
      ],
    };
  }
  if (input.scope === "chapter") {
    return {
      scope: "chapter",
      indicators: [
        indicator("chapter_progression_state", "Chapter progression state", m.chapterProgressionState ?? 0, levelFromScore(1 - (m.chapterProgressionState ?? 0))),
        indicator("transition_brittleness", "Transition brittleness", m.transitionBrittleness ?? 0, levelFromScore(m.transitionBrittleness ?? 0)),
        indicator("arc_density", "Arc density", m.arcDensity ?? 0, levelFromScore(1 - (m.arcDensity ?? 0))),
        indicator("pacing_pressure", "Pacing pressure", m.pacingPressure ?? 0, levelFromScore(m.pacingPressure ?? 0)),
        indicator("contradiction_risk", "Contradiction risk", m.contradictionRisk ?? 0, levelFromScore(m.contradictionRisk ?? 0)),
        indicator("unresolved_carryover", "Unresolved carryover", m.unresolvedCarryover ?? 0, levelFromScore(m.unresolvedCarryover ?? 0)),
        indicator("chapter_readiness", "Chapter readiness", m.chapterReadiness ?? 0, levelFromScore(1 - (m.chapterReadiness ?? 0))),
        indicator("coherence_score", "Coherence score", m.coherenceScore ?? 0, levelFromScore(1 - (m.coherenceScore ?? 0))),
      ],
    };
  }
  if (input.scope === "book") {
    return {
      scope: "book",
      indicators: [
        indicator("active_arc_health", "Active arc health", m.activeArcHealth ?? 0, levelFromScore(1 - (m.activeArcHealth ?? 0))),
        indicator("movement_balance", "Movement balance", m.movementBalance ?? 0, levelFromScore(m.movementBalance ?? 0)),
        indicator("pressure_distribution", "Pressure distribution", m.pressureDistribution ?? 0, levelFromScore(m.pressureDistribution ?? 0)),
        indicator("branch_risk", "Branch risk", m.branchRisk ?? 0, levelFromScore(m.branchRisk ?? 0)),
        indicator("book_coherence", "Book coherence", m.bookCoherence ?? 0, levelFromScore(1 - (m.bookCoherence ?? 0))),
        indicator("revision_state", "Revision state", m.revisionState ?? 0, levelFromScore(m.revisionState ?? 0)),
        indicator("release_readiness", "Release readiness", m.releaseReadiness ?? 0, levelFromScore(1 - (m.releaseReadiness ?? 0))),
        indicator("unresolved_blockers", "Unresolved blockers", m.unresolvedBlockers ?? 0, levelFromScore(m.unresolvedBlockers ?? 0)),
      ],
    };
  }
  return {
    scope: "epic",
    indicators: [
      indicator("world_state_distribution", "World-state distribution", m.worldStateDistribution ?? 0, levelFromScore(m.worldStateDistribution ?? 0)),
      indicator("multi_book_continuity", "Multi-book continuity", m.multiBookContinuity ?? 0, levelFromScore(m.multiBookContinuity ?? 0)),
      indicator("lineage_consistency", "Lineage consistency", m.lineageConsistency ?? 0, levelFromScore(m.lineageConsistency ?? 0)),
      indicator("global_arc_map", "Global arc map", m.globalArcMap ?? 0, levelFromScore(1 - (m.globalArcMap ?? 0))),
      indicator("thematic_recurrence", "Thematic recurrence", m.thematicRecurrence ?? 0, levelFromScore(1 - (m.thematicRecurrence ?? 0))),
      indicator("epic_coherence", "Epic coherence", m.epicCoherence ?? 0, levelFromScore(m.epicCoherence ?? 0)),
      indicator("production_progress", "Production progress", m.productionProgress ?? 0, levelFromScore(1 - (m.productionProgress ?? 0))),
    ],
  };
}
