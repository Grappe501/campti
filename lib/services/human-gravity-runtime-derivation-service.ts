import {
  HumanGravityRuntimeProfileSchema,
  type HumanGravityRuntimeProfile,
} from "@/lib/domain/human-gravity-runtime";
import type { CamptiEpicEmotionalGravityPack } from "@/lib/domain/epic-emotional-gravity";
import type { AuthorCommandCockpitBundle } from "@/lib/domain/author-command-cockpit";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import { AttachmentRuntimeBiasService } from "@/lib/services/attachment-runtime-bias-service";
import { ConsequencePersistenceRuntimeService } from "@/lib/services/consequence-persistence-runtime-service";
import { GenerationalBurdenRuntimeService } from "@/lib/services/generational-burden-runtime-service";
import { computeHumanGravityRuntimeInfluenceTruth } from "@/lib/services/human-gravity-runtime-influence-truth";
import { RelationalStakesRuntimeBiasService } from "@/lib/services/relational-stakes-runtime-bias-service";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}

function maxRecord(rec: Record<string, number>): number {
  const vals = Object.values(rec);
  if (!vals.length) return 0;
  return Math.max(...vals);
}

export class HumanGravityRuntimeDerivationService {
  private readonly attachment = new AttachmentRuntimeBiasService();

  private readonly relational = new RelationalStakesRuntimeBiasService();

  private readonly consequence = new ConsequencePersistenceRuntimeService();

  private readonly burden = new GenerationalBurdenRuntimeService();

  /**
   * Canonical scene-generation entry: requires Cluster 3/4 `canonicalPreGeneration` with EEGS pack.
   */
  deriveFromSceneGenerationInput(input: SceneGenerationInput): HumanGravityRuntimeProfile | null {
    const pre = input.canonicalPreGeneration;
    if (!pre?.governanceMergeApplied) return null;
    const pack = pre.epicEmotionalGravityPack;
    return this.deriveFromPackContext({
      pack,
      chapterId: input.contract.chapter.id,
      sceneId: input.contract.scene.id,
      chapterSequence: Math.max(1, input.contract.chapter.sequenceInBook),
      participatingPeopleIds: input.contract.participatingPeople.map((p) => p.id),
    });
  }

  deriveFromPackContext(input: {
    pack: CamptiEpicEmotionalGravityPack;
    chapterId: string;
    sceneId: string;
    chapterSequence: number;
    participatingPeopleIds: string[];
  }): HumanGravityRuntimeProfile {
    const scenePlan =
      input.pack.sceneEmotionalGravityPlans.find((s) => s.sceneId === input.sceneId) ?? null;

    const att = this.attachment.derive({
      pack: input.pack,
      sceneId: input.sceneId,
      chapterId: input.chapterId,
      participatingPeopleIds: input.participatingPeopleIds,
      scenePlan,
    });

    const rel = this.relational.derive({
      profile: input.pack.relationalStakesProfile,
      participatingPeopleIds: input.participatingPeopleIds,
    });

    const cons = this.consequence.derive({
      profile: input.pack.consequenceProfile,
      chapterId: input.chapterId,
      sceneId: input.sceneId,
      participatingPeopleIds: input.participatingPeopleIds,
    });

    const bur = this.burden.derive({ profile: input.pack.generationalBurdenProfile });

    const carry = input.pack.emotionalCarryForwardProfile.chapterToChapterCarry
      .filter((c) => c.chapterId === input.chapterId)
      .map((c) => c.residueSummary)
      .concat(
        input.pack.emotionalCarryForwardProfile.unfinishedNeeds.map(
          (n) => `unfinished_need:${n.needStatement}`,
        ),
      );

    const closureWeightSummary = scenePlan
      ? `Closure pressure: carryForwardWeight=${scenePlan.carryForwardWeight.toFixed(2)}; irreversibilityPotential=${scenePlan.irreversibilityPotential.toFixed(2)}; dominant function=${scenePlan.dominantEmotionalFunction}.`
      : "Closure pressure: follow EEGS downstream bias — end with braided dread/hope and unfinished relational need.";

    const maxAtt = maxRecord(att.attachmentWeightMap);
    const maxRel = maxRecord(rel.relationalThreatMap);
    const consScore = clamp01(Math.min(1, cons.activeConsequenceMarkers.length / 6));
    const burdenScore = bur.activeBurdenLines.length ? 0.72 : 0.38;
    const carryScore = clamp01(carry.length / 5);
    const sceneBoost = scenePlan ? clamp01(scenePlan.carryForwardWeight * 0.5 + scenePlan.relationalRiskLevel * 0.5) : 0.45;

    const humanGravityScore = clamp01(
      (maxAtt * 0.28 +
        maxRel * 0.22 +
        consScore * 0.18 +
        burdenScore * 0.12 +
        carryScore * 0.1 +
        sceneBoost * 0.1) /
        1,
    );

    const promptInstructionLines: string[] = [
      "CLUSTER6_HUMAN_GRAVITY (runtime governor — subordinate to contract facts, P2-E sources, and governance blocks):",
      "— Prefer implication, residue, and behavioral cost over emotional naming.",
      att.povBiasSummary,
      att.sceneFocusSummary,
      `Bond-mode reader gravity: ${att.bondModeSummary}`,
      rel.foregroundSummary,
      cons.irreversibilityState,
      `Consequence shadows to keep behaviorally present: ${cons.activeConsequenceMarkers.slice(0, 4).join(" | ") || "none listed"}`,
      `Repair difficulty signals: ${cons.repairDifficultySignals.slice(0, 4).join(" | ") || "none listed"}`,
      bur.burdenPressureSummary,
      `Carry-forward residue: ${carry.slice(0, 4).join(" | ") || "preserve unfinished need + bodily/relational remainder"}`,
      closureWeightSummary,
    ];

    const validationFlags: string[] = ["cluster6_runtime_derived"];
    if (maxAtt < 0.3) validationFlags.push("cluster6_low_attachment_weight");
    if (maxRel < 0.35) validationFlags.push("cluster6_low_relational_threat_signal");
    if (!cons.activeConsequenceMarkers.length) validationFlags.push("cluster6_no_scoped_consequence_marker");

    const runtimeInfluenceTruth = computeHumanGravityRuntimeInfluenceTruth({
      promptInstructionLines,
      humanGravityScore,
      attachment: {
        povBiasSummary: att.povBiasSummary,
        activeFearDesireVulnerabilityIds: att.activeFearDesireVulnerabilityIds,
      },
      relational: {
        foregroundSummary: rel.foregroundSummary,
        relationalThreatMap: rel.relationalThreatMap,
      },
      consequence: { activeConsequenceMarkers: cons.activeConsequenceMarkers },
      burden: {
        activeBurdenLines: bur.activeBurdenLines,
        inheritedWarningLines: bur.inheritedWarningLines,
      },
    });

    return HumanGravityRuntimeProfileSchema.parse({
      contractVersion: "1",
      clusterTag: "cluster6_human_gravity_runtime",
      chapterId: input.chapterId,
      sceneId: input.sceneId,
      chapterSequence: input.chapterSequence,
      activeCharacterAttachmentIds: att.activeCharacterAttachmentIds,
      attachmentWeightMap: att.attachmentWeightMap,
      activeRelationalStakeIds: rel.activeRelationalStakeIds,
      relationalThreatMap: rel.relationalThreatMap,
      activeConsequenceMarkers: cons.activeConsequenceMarkers,
      irreversibilityState: cons.irreversibilityState,
      activeBurdenLines: bur.activeBurdenLines,
      inheritedWarningLines: bur.inheritedWarningLines,
      repairDifficultySignals: cons.repairDifficultySignals,
      carryForwardResidue: carry.slice(0, 12),
      povBiasSummary: att.povBiasSummary,
      sceneFocusSummary: att.sceneFocusSummary,
      closureWeightSummary,
      relationalForegroundSummary: rel.foregroundSummary,
      bondModeSummary: att.bondModeSummary,
      activeFearDesireVulnerabilityIds: att.activeFearDesireVulnerabilityIds,
      validationFlags,
      humanGravityScore,
      runtimeInfluenceTruth,
      promptInstructionLines,
    });
  }
}

export function buildHumanGravityRuntimeCockpitPanelFromProfile(
  profile: HumanGravityRuntimeProfile,
): NonNullable<AuthorCommandCockpitBundle["humanGravityRuntime"]> {
  return {
    chapterId: profile.chapterId,
    sceneId: profile.sceneId,
    humanGravityScore: profile.humanGravityScore,
    humanGravityCanonicalRuntimeActive: profile.runtimeInfluenceTruth.humanGravityCanonicalRuntimeActive,
    povBiasSummary: profile.povBiasSummary,
    bondModeSummary: profile.bondModeSummary,
    relationalForegroundSummary: profile.relationalForegroundSummary,
    activeFearDesireVulnerabilityLines: profile.activeFearDesireVulnerabilityIds,
    relationalThreatTop: profile.activeRelationalStakeIds,
    activeConsequenceMarkers: profile.activeConsequenceMarkers,
    burdenAndInheritanceLines: [...profile.activeBurdenLines, ...profile.inheritedWarningLines].slice(0, 12),
    carryForwardResidue: profile.carryForwardResidue,
    repairDifficultySignals: profile.repairDifficultySignals,
    shallowOrResetWarnings: profile.validationFlags.filter((f) => f.includes("low_") || f.includes("no_scoped")),
    refinementTargets: [
      "raise behavioral cost when repair difficulty is high",
      "let silence and obligation show before dialogue resolves tension",
      "keep inherited warnings in gesture and habit, not exposition",
    ],
    runtimePromptLinesMaterialized:
      profile.promptInstructionLines.filter(
        (l) =>
          l.trim().length > 0 &&
          !l.trim().startsWith("CLUSTER6_HUMAN_GRAVITY") &&
          !l.startsWith("— Prefer implication"),
      ).length >= 3,
    noResetValidationParticipatesInCanonicalValidity:
      profile.runtimeInfluenceTruth.noResetValidationParticipatesInCanonicalValidity,
  };
}
