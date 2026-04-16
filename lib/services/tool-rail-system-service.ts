import type { AuthorCockpitScope, CockpitToolRailSystem } from "@/lib/domain/author-command-cockpit";

const TOOLS_BY_SCOPE: Record<AuthorCockpitScope, CockpitToolRailSystem> = {
  scene: {
    topBand: {
      id: "top-scope-status",
      label: "Scope + status",
      tools: ["scope_switcher", "scene_status", "writing_mode", "continuity_gate"],
    },
    leftRail: {
      id: "left-context",
      label: "Scene context",
      tools: ["scene_navigation", "linked_entities", "source_anchors", "continuity_notes"],
    },
    rightRail: {
      id: "right-actions",
      label: "Scene actions",
      tools: ["readiness_panel", "revise_actions", "review_mode_toggle", "compare_states"],
    },
    lowerLayer: {
      id: "lower-secondary",
      label: "Secondary notes",
      tools: ["timeline_notes", "discussion_scratchpad"],
    },
  },
  chapter: {
    topBand: {
      id: "top-scope-status",
      label: "Scope + chapter status",
      tools: ["scope_switcher", "chapter_status", "assembly_status", "readiness_state"],
    },
    leftRail: {
      id: "left-context",
      label: "Chapter structure",
      tools: ["scene_sequence", "transition_map", "carryover_tracker"],
    },
    rightRail: {
      id: "right-actions",
      label: "Chapter actions",
      tools: ["assembly_preview", "coherence_inspection", "rebalance_actions"],
    },
  },
  book: {
    topBand: {
      id: "top-scope-status",
      label: "Scope + book status",
      tools: ["scope_switcher", "book_state", "release_readiness", "revision_state"],
    },
    leftRail: {
      id: "left-context",
      label: "Book structure",
      tools: ["chapter_grid", "arc_map", "pressure_distribution_view"],
    },
    rightRail: {
      id: "right-actions",
      label: "Book actions",
      tools: ["book_coherence_view", "release_blockers", "escalate_scope"],
    },
  },
  epic: {
    topBand: {
      id: "top-scope-status",
      label: "Scope + epic status",
      tools: ["scope_switcher", "epic_progress", "global_coherence", "production_progress"],
    },
    leftRail: {
      id: "left-context",
      label: "Epic distribution",
      tools: ["book_constellation", "world_state_map", "lineage_consistency_view"],
    },
    rightRail: {
      id: "right-actions",
      label: "Epic actions",
      tools: ["global_arc_actions", "cross_book_conflict_scan", "release_alignment"],
    },
  },
};

export function buildToolRailSystem(scope: AuthorCockpitScope): CockpitToolRailSystem {
  return TOOLS_BY_SCOPE[scope];
}
