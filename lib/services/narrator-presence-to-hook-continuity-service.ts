import type { HookContinuityDeclaration } from "@/lib/domain/epic-narrative-continuity";
import {
  NarratorHookContinuityAdapterSchema,
  type NarratorConvergenceProfile,
  type NarratorHookContinuityAdapter,
  type NarratorModeProfile,
} from "@/lib/domain/narrator-presence";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

export class NarratorPresenceToHookContinuityService {
  deriveAdapter(input: {
    chapterId: string;
    modeProfile: NarratorModeProfile;
    convergence: NarratorConvergenceProfile;
  }): NarratorHookContinuityAdapter {
    const contribution = clamp01(
      0.32 +
        input.modeProfile.emotionalStakeLevel * 0.34 +
        input.convergence.convergenceProgressScore * 0.24 +
        (input.modeProfile.currentPresenceLevel === "invisible" ? -0.16 : 0),
    );

    return NarratorHookContinuityAdapterSchema.parse({
      artifact: "narrator_hook_continuity_adapter",
      chapterId: input.chapterId,
      emotionalAttachmentPreserved: contribution >= 0.45,
      structuralCuriosityPreserved: contribution >= 0.4,
      philosophicalEngagementPreserved: contribution >= 0.46,
      unresolvedContinuityPressurePreserved: contribution >= 0.43,
      anchorContinuityReinforced: input.modeProfile.hookContinuityRole.some((row) => row.includes("anchor")),
      narratorHookContinuityContribution: contribution,
      bridgeSignals: [
        `narrator-presence:${input.modeProfile.currentPresenceLevel}`,
        `convergence-stage:${input.convergence.currentStage}`,
        "narrator as continuity anchor and meaning carrier",
      ],
    });
  }

  augmentDeclaration(input: {
    declaration: HookContinuityDeclaration;
    adapter: NarratorHookContinuityAdapter;
  }): HookContinuityDeclaration {
    return {
      ...input.declaration,
      hookContinuityScore: clamp01(
        input.declaration.hookContinuityScore * 0.8 + input.adapter.narratorHookContinuityContribution * 0.2,
      ),
      emotionalAttachmentDrivers: input.declaration.emotionalAttachmentDrivers.concat(
        input.adapter.emotionalAttachmentPreserved ? ["narrator-carried attachment continuity"] : [],
      ),
      attachmentContinuitySignals: input.declaration.attachmentContinuitySignals.concat(input.adapter.bridgeSignals.slice(0, 1)),
      structuralCuriosityDrivers: input.declaration.structuralCuriosityDrivers.concat(
        input.adapter.structuralCuriosityPreserved ? ["narrator-guided unresolved structural curiosity"] : [],
      ),
      philosophicalEngagementDrivers: input.declaration.philosophicalEngagementDrivers.concat(
        input.adapter.philosophicalEngagementPreserved ? ["narrator reflective framing sustains philosophical engagement"] : [],
      ),
      unresolvedContinuityPressureCarryForward: input.declaration.unresolvedContinuityPressureCarryForward.concat(
        input.adapter.unresolvedContinuityPressurePreserved ? ["narrator preserves unresolved continuity pressure across transition"] : [],
      ),
      readerCarryDeclaration: {
        ...input.declaration.readerCarryDeclaration,
        continuityReassuranceSignals: input.declaration.readerCarryDeclaration.continuityReassuranceSignals.concat(
          input.adapter.bridgeSignals,
        ),
      },
    };
  }
}
