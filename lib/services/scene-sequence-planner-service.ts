import {
  SCENE_SEQUENCE_PLAN_CONTRACT_VERSION,
  type SceneSequencePlan,
  type SceneSlotRole,
} from "@/lib/domain/scene-sequence-plan";

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function assertBoundRole(role: string): asserts role is SceneSlotRole {
  const valid: SceneSlotRole[] = ["conflict", "reveal", "transition", "escalation", "aftermath"];
  if (!valid.includes(role as SceneSlotRole)) {
    throw new Error(`[scene-sequence] unsupported scene role: ${role}`);
  }
}

export function createSceneSequencePlan(input: {
  chapterId: string;
  orderedRoles: string[];
  dependencyLinks: Record<number, number[]>;
  unresolvedThreadCarryover: string[];
}): SceneSequencePlan {
  if (input.orderedRoles.length === 0) {
    throw new Error("[scene-sequence] orderedRoles cannot be empty.");
  }

  const chapterId = input.chapterId.trim();
  if (!chapterId) throw new Error("[scene-sequence] chapterId is required.");

  const slots = input.orderedRoles.map((role, index) => {
    assertBoundRole(role);
    return {
      slotId: `${chapterId}:slot:${index + 1}`,
      orderIndex: index + 1,
      role,
      dependsOnSlotIds: (input.dependencyLinks[index] ?? []).map(
        (depIndex) => `${chapterId}:slot:${depIndex + 1}`
      ),
      continuityPressure: Math.min(100, 40 + index * 12 + (role === "escalation" ? 18 : 0)),
    };
  });

  const revealPlacementIndexes = slots.filter((slot) => slot.role === "reveal").map((slot) => slot.orderIndex);
  const escalationIndexes = slots
    .filter((slot) => slot.role === "escalation")
    .map((slot) => slot.orderIndex)
    .sort((a, b) => a - b);
  const escalationProgressionValid =
    escalationIndexes.length <= 1 || escalationIndexes.every((idx, i, arr) => i === 0 || idx > arr[i - 1]!);

  return {
    contractVersion: SCENE_SEQUENCE_PLAN_CONTRACT_VERSION,
    chapterId,
    slots,
    unresolvedThreadCarryover: uniqueNonEmpty(input.unresolvedThreadCarryover),
    revealPlacementIndexes,
    escalationProgressionValid,
  };
}
