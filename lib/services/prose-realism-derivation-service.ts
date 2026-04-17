import type { AuthorCommandCockpitBundle } from "@/lib/domain/author-command-cockpit";
import type { CamptiEpicEmotionalGravityPack } from "@/lib/domain/epic-emotional-gravity";
import type { CamptiNarratorPresencePack } from "@/lib/domain/narrator-presence";
import {
  ProseRealismLayerArtifactSchema,
  ProseRealismProfileSchema,
  type ProseRealismLayerArtifact,
  type ProseRealismProfile,
} from "@/lib/domain/prose-realism";
import type { ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import { EmotionalResidueProseService } from "@/lib/services/emotional-residue-prose-service";
import { EraCognitionRealismService } from "@/lib/services/era-cognition-realism-service";
import { LiteraryNaturalizationService } from "@/lib/services/literary-naturalization-service";
import { SceneVoiceDifferentiationService } from "@/lib/services/scene-voice-differentiation-service";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function buildNarratorBoundaryPromptLines(pack: CamptiNarratorPresencePack | null | undefined): string[] {
  if (!pack) {
    return [
      "NARRATOR_VS_CHARACTER: no narrator pack merged — keep third-person witness inference; no omniscient moral summary.",
    ];
  }
  const m = pack.chapterPresencePlan.modeProfile;
  const lines: string[] = [
    "NARRATOR_BOUNDARY (Cluster 5):",
    `— Presence level: ${m.currentPresenceLevel}; knowledge mode: ${m.knowledgeMode}.`,
    "— Character interiority owns lived inference; narrator may frame, not psychoanalyze across eras.",
    `— First-person readiness: ${pack.cockpitSummary.firstPersonReadinessStatus} (honor convergence; do not force first person).`,
  ];
  if (pack.cockpitSummary.narratorCharacterBoundaryWarnings.length) {
    lines.push(
      `— Boundary advisories: ${pack.cockpitSummary.narratorCharacterBoundaryWarnings.slice(0, 5).join(" | ")}`,
    );
  }
  if (pack.cockpitSummary.voiceShiftRisks.length) {
    lines.push(`— Voice shift risks: ${pack.cockpitSummary.voiceShiftRisks.slice(0, 4).join(" | ")}`);
  }
  return lines;
}

function sequenceCarryLines(input: SceneGenerationInput): string[] {
  const seq = input.canonicalPreGeneration?.sequenceValidation;
  if (!seq) {
    return [
      "SEQUENCE_CARRY: no sequence validation bundle — still preserve thread/callback pressure from contract beats and notes.",
    ];
  }
  const hooks = seq.structuralWeaknessFlags ?? [];
  return [
    "SEQUENCE_AND_HOOK_PRESSURE:",
    `— Structural flags (texture, not exposition): ${hooks.length ? hooks.slice(0, 8).join(" | ") : "none listed"}`,
  ];
}

function buildProfileSeed(input: SceneGenerationInput, realismId: string): ProseRealismProfile {
  const sceneId = input.contract.scene.id;
  const c = input.canonicalPreGeneration?.proseConstraints;
  const np = input.canonicalPreGeneration?.narratorPresencePack;
  const eegs = input.canonicalPreGeneration?.epicEmotionalGravityPack;

  const eraTruthScore = c
    ? clamp01(0.42 + c.placeImmersionTarget * 0.28 + c.continuityEmphasis * 0.22 + (input.contract.effectiveWorldState.label ? 0.08 : 0))
    : 0.52;

  const cognitionTruthScore = c
    ? clamp01(0.48 + (1 - c.emotionalLabelAllowance) * 0.22 + (1 - c.interpretationAllowance) * 0.12)
    : 0.52;

  let narratorBoundaryScore = np
    ? clamp01(
        0.55 +
          np.diagnostics.narratorContinuityStrength * 0.25 -
          Math.min(0.25, np.cockpitSummary.narratorCharacterBoundaryWarnings.length * 0.04),
      )
    : 0.55;

  if (np?.chapterPresencePlan.modeProfile.currentPresenceLevel === "first_person") {
    narratorBoundaryScore = clamp01(narratorBoundaryScore - 0.05);
  }

  const emotionalCredibilityScore = eegs
    ? clamp01(0.45 + eegs.cockpitSummary.epicEmotionalGravityScore * 0.4 - eegs.cockpitSummary.resetHeavyWarnings.length * 0.03)
    : 0.5;

  const sensoryEmbodimentScore = c
    ? clamp01(0.4 + (c.sensoryDensityProfile.requiredDensity === "high" ? 0.28 : 0.18) + c.environmentalGroundingFloor * 0.22)
    : 0.5;

  const voiceDistinctnessScore = c
    ? clamp01(0.45 + c.ambiguityAllowance * 0.15 + (c.driftFlags.length ? 0.05 : 0.08))
    : 0.5;

  let consequenceResidueScore = eegs
    ? clamp01(
        0.42 +
          Math.min(0.22, eegs.cockpitSummary.emotionalCarryForwardSummary.length * 0.04) +
          eegs.cockpitSummary.epicEmotionalGravityScore * 0.22,
      )
    : 0.48;

  const hg = input.humanGravityRuntime;
  if (hg?.runtimeInfluenceTruth.proseRealismSeedInfluencedByHumanGravity) {
    consequenceResidueScore = clamp01(consequenceResidueScore + hg.humanGravityScore * 0.08);
  }

  const literaryNaturalnessScore = c
    ? clamp01(0.46 + (c.literaryDeviceConstraints.soundPatternAllowance === "minimal" ? 0.12 : 0.06))
    : 0.5;

  const antiMechanicalScore = 0.72;

  const realismScore = clamp01(
    (eraTruthScore +
      cognitionTruthScore +
      narratorBoundaryScore +
      emotionalCredibilityScore +
      sensoryEmbodimentScore +
      voiceDistinctnessScore +
      consequenceResidueScore +
      literaryNaturalnessScore +
      antiMechanicalScore) /
      9,
  );

  const validationFlags = [
    "cluster5_prose_realism_seed",
    input.canonicalPreGeneration?.governanceMergeApplied ? "governance_merge_present" : "governance_merge_absent",
  ];

  return ProseRealismProfileSchema.parse({
    artifact: "prose_realism_profile",
    contractVersion: "1",
    realismId,
    sceneId,
    chapterId: input.contract.chapter.id,
    realismScore,
    eraTruthScore,
    cognitionTruthScore,
    narratorBoundaryScore,
    emotionalCredibilityScore,
    sensoryEmbodimentScore,
    voiceDistinctnessScore,
    consequenceResidueScore,
    literaryNaturalnessScore,
    antiMechanicalScore,
    validationFlags,
  });
}

export class ProseRealismDerivationService {
  private readonly voiceDiff = new SceneVoiceDifferentiationService();

  private readonly eraCog = new EraCognitionRealismService();

  private readonly residue = new EmotionalResidueProseService();

  private readonly literary = new LiteraryNaturalizationService();

  /**
   * Builds the canonical prose-realism layer for scene generation (prompt lines + pre-gen profile).
   */
  derive(input: SceneGenerationInput): ProseRealismLayerArtifact {
    const sceneId = input.contract.scene.id;
    const realismId = `${sceneId}:cluster5:${input.contract.chapter.id}`;
    const promptInstructionLines: string[] = [
      "PROSE_REALISM_CLUSTER5 — obey all truth firewalls and governance blocks above; this block shapes craft only.",
      ...this.voiceDiff.derivePromptLines({
        contract: input.contract,
        chapterFunctionHint: input.contract.chapter.summary ?? null,
      }),
      ...this.eraCog.derivePromptLines(input),
      ...buildNarratorBoundaryPromptLines(input.canonicalPreGeneration?.narratorPresencePack),
      ...this.residue.derivePromptLines(input.canonicalPreGeneration?.epicEmotionalGravityPack),
      ...this.literary.derivePromptLines(input.canonicalPreGeneration?.proseConstraints),
      ...sequenceCarryLines(input),
    ];

    const profileSeed = buildProfileSeed(input, realismId);
    return ProseRealismLayerArtifactSchema.parse({
      contractVersion: "1",
      clusterTag: "cluster5_prose_realism",
      sceneId,
      promptInstructionLines,
      profileSeed,
    });
  }
}

/**
 * Chapter-level cockpit panel from governance packs (no generated prose required).
 */
export function buildProseRealismCockpitPanelFromGovernance(input: {
  chapterId: string;
  proseConstraints: ProseGenerationConstraints | null;
  narratorPresencePack: CamptiNarratorPresencePack | null;
  epicEmotionalGravityPack: CamptiEpicEmotionalGravityPack | null;
}): NonNullable<AuthorCommandCockpitBundle["proseRealism"]> {
  const c = input.proseConstraints;
  const np = input.narratorPresencePack;
  const e = input.epicEmotionalGravityPack;

  const eraTruth = c
    ? clamp01(0.42 + c.placeImmersionTarget * 0.28 + c.continuityEmphasis * 0.22)
    : null;
  const narratorBoundary = np
    ? clamp01(0.55 + np.diagnostics.narratorContinuityStrength * 0.25 - np.cockpitSummary.narratorCharacterBoundaryWarnings.length * 0.04)
    : null;
  const emotionalCred = e ? clamp01(0.45 + e.cockpitSummary.epicEmotionalGravityScore * 0.4) : null;

  return {
    chapterId: input.chapterId,
    governanceLinked: true,
    eraTruthScore: eraTruth,
    cognitionTruthScore: c ? clamp01(0.48 + (1 - c.emotionalLabelAllowance) * 0.22) : null,
    narratorBoundaryIntegrity: narratorBoundary,
    emotionalCredibility: emotionalCred,
    sensoryEmbodiment: c
      ? clamp01(0.4 + (c.sensoryDensityProfile.requiredDensity === "high" ? 0.28 : 0.18))
      : null,
    voiceDistinctness: c ? clamp01(0.45 + c.ambiguityAllowance * 0.15) : null,
    consequenceResidue: e
      ? clamp01(0.42 + Math.min(0.35, e.cockpitSummary.emotionalCarryForwardSummary.length * 0.04))
      : null,
    literaryNaturalness: c ? clamp01(0.46 + (c.literaryDeviceConstraints.soundPatternAllowance === "minimal" ? 0.12 : 0.06)) : null,
    antiMechanicalWarnings: e?.cockpitSummary.resetHeavyWarnings.slice(0, 6) ?? [],
    recommendedRefinementTargets: [
      "vary sentence entry across scenes",
      "keep devices bound to place/thread",
      "prefer behavioral residue over emotion labels",
    ],
  };
}
