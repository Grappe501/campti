export const SCENE_SEQUENCE_PLAN_CONTRACT_VERSION = "1" as const;

export const SCENE_SLOT_ROLES = [
  "conflict",
  "reveal",
  "transition",
  "escalation",
  "aftermath",
] as const;
export type SceneSlotRole = (typeof SCENE_SLOT_ROLES)[number];

export type SceneSlot = {
  slotId: string;
  orderIndex: number;
  role: SceneSlotRole;
  dependsOnSlotIds: string[];
  continuityPressure: number;
};

export type SceneSequencePlan = {
  contractVersion: typeof SCENE_SEQUENCE_PLAN_CONTRACT_VERSION;
  chapterId: string;
  slots: SceneSlot[];
  unresolvedThreadCarryover: string[];
  revealPlacementIndexes: number[];
  escalationProgressionValid: boolean;
};
