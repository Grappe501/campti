import { FragmentType } from "@prisma/client";

const LABELS: Record<FragmentType, string> = {
  CREATIVE_FRAGMENT: "Creative fragment",
  SCENE_SEED: "Scene seed",
  CHAPTER_SEED: "Chapter seed",
  MEMORY: "Memory",
  EMOTIONAL_BEAT: "Emotional beat",
  CHARACTER_INSIGHT: "Character insight",
  SYMBOLIC_NOTE: "Symbolic note",
  MOTIF_RULE: "Motif / rule",
  STRUCTURAL_OUTLINE: "Structural outline",
  HISTORICAL_ANCHOR: "Historical anchor",
  ORAL_HISTORY: "Oral history",
  RESEARCH_NOTE: "Research note",
  NARRATOR_VOICE: "Narrator voice",
  CONTINUITY_CONSTRAINT: "Continuity constraint",
  QUESTION_SEED: "Question seed",
  THEME_STATEMENT: "Theme statement",
  IMAGE_OR_SENSORY: "Image / sensory",
  DIALOGUE_SNIPPET: "Dialogue",
  OTHER: "Other",
};

export function fragmentTypeLabel(t: FragmentType): string {
  return LABELS[t] ?? t;
}

export function parseFragmentType(v: string): FragmentType | null {
  const vals = Object.values(FragmentType) as string[];
  return vals.includes(v) ? (v as FragmentType) : null;
}

export const PLACEMENT_STATUSES = [
  "unplaced",
  "candidate",
  "linked",
  "promoted",
  "archived",
] as const;

export const REVIEW_STATUSES = ["pending", "reviewed", "approved", "rejected"] as const;

export const CANDIDATE_PLACEMENT_STATUSES = [
  "suggested",
  "accepted",
  "rejected",
  "deferred",
] as const;

export const FRAGMENT_LINK_TARGET_TYPES = [
  "scene",
  "chapter",
  "person",
  "place",
  "event",
  "symbol",
  "question",
  "continuity",
  "source",
  "character_profile",
  "setting_profile",
  "meta_scene",
  "character_memory",
  "character_state",
] as const;

/** Subset used for “world model” coverage metrics on the Brain dashboard. */
export const FRAGMENT_WORLD_LINK_TARGET_TYPES = [
  "character_profile",
  "setting_profile",
  "meta_scene",
  "character_memory",
  "character_state",
] as const;

export const PLACEMENT_TARGET_TYPES = [
  "scene",
  "chapter",
  "symbol",
  "question",
  "continuity",
  "person",
  "place",
  "event",
  "source",
] as const;

export type FragmentLinkRole =
  | "supports"
  | "inspires"
  | "contradicts"
  | "symbolizes"
  | "voices"
  | "grounds"
  | "echoes"
  | "belongs_to_chapter"
  | "supports_chapter"
  | "symbolically_relates_chapter"
  | "raises_question"
  | "informs_character"
  | "informs_setting"
  | "informs_scene"
  | "represents_memory"
  | "drives_conflict"
  | "provides_symbolism";

export const FRAGMENT_LINK_ROLES: FragmentLinkRole[] = [
  "supports",
  "inspires",
  "contradicts",
  "symbolizes",
  "voices",
  "grounds",
  "echoes",
  "belongs_to_chapter",
  "supports_chapter",
  "symbolically_relates_chapter",
  "raises_question",
  "informs_character",
  "informs_setting",
  "informs_scene",
  "represents_memory",
  "drives_conflict",
  "provides_symbolism",
];
