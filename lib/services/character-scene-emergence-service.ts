import type { ChapterCompositionPlan } from "@/lib/domain/chapter-composition";
import type { CharacterCognitiveState, CharacterMindProfile } from "@/lib/domain/character-mind";
import type { RelationshipState } from "@/lib/domain/character-relationship";
import {
  CHARACTER_SCENE_EMERGENCE_CONTRACT_VERSION,
  CharacterSceneEmergenceChapterPlanSchema,
  CharacterSceneEmergenceDigestSchema,
  type CharacterSceneEmergenceChapterPlan,
  type CharacterSceneEmergenceDigest,
} from "@/lib/domain/character-scene-emergence";
import type { CamptiEpicContinuityPack } from "@/lib/domain/epic-narrative-continuity";
import type { CamptiEpicEmotionalGravityPack } from "@/lib/domain/epic-emotional-gravity";
import type { HumanGravityRuntimeProfile } from "@/lib/domain/human-gravity-runtime";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}

/**
 * Cluster 8 — scenes must justify themselves through character pressure (desire/fear/obligation collision).
 */
export class CharacterSceneEmergenceService {
  deriveChapterPlan(input: {
    chapterId: string;
    bookId: string;
    chapterCompositionPlan: ChapterCompositionPlan;
    epicContinuityPack: CamptiEpicContinuityPack;
    epicEmotionalGravityPack: CamptiEpicEmotionalGravityPack;
  }): CharacterSceneEmergenceChapterPlan {
    const byId: Record<string, CharacterSceneEmergenceDigest> = {};
    const anchors = input.epicContinuityPack.cockpitSummary.activeAnchorIds.slice(0, 6);
    const eegsLines = input.epicEmotionalGravityPack.cockpitSummary.activeFearDesireVulnerabilityLines.slice(0, 5);

    for (const row of input.chapterCompositionPlan.sceneSequence) {
      const sceneId = row.scenePlanId;
      const eegsScene = input.epicEmotionalGravityPack.sceneEmotionalGravityPlans.find((s) => s.sceneId === sceneId);
      const povCandidates = row.povCandidateWeights.map((p) => ({
        personId: p.povId,
        weight: clamp01(p.weight),
        rationale: `POV weight from composition (${row.sceneRole}) — pressure must justify why this witness is credible now.`,
      }));

      const necessity: string[] = [
        `Scene role "${row.sceneRole}" creates narrative obligation only if a character pays a cost to inhabit it.`,
        `Carry-forward strategy "${row.carryForwardPressureType}" must be felt as desire/fear, not as outline.`,
      ];
      if (eegsScene) {
        necessity.push(
          `Dominant emotional function "${eegsScene.dominantEmotionalFunction}" pressures a character to act while ${eegsScene.attachmentFunction}.`,
        );
        necessity.push(
          `Relational risk ${eegsScene.relationalRiskLevel.toFixed(2)} and consequence exposure ${eegsScene.consequenceExposureLevel.toFixed(2)} force scene-active stakes.`,
        );
      }
      if (anchors.length) {
        necessity.push(`Continuity anchors ${anchors.join(", ")} constrain what can be safely hidden in dialogue.`);
      }

      const conflicts: string[] = [
        "Want (surface) vs fear (primary activation) collision for the weighted POV character.",
        "Household obligation vs public face under observer risk.",
      ];
      if (eegsScene?.fearLinePresence.length) {
        conflicts.push(`Named fear lines present: ${eegsScene.fearLinePresence.slice(0, 3).join(" | ")}`);
      }
      if (eegsLines.length) {
        conflicts.push(`EEGS vulnerability lines: ${eegsLines.join(" | ")}`);
      }

      const purpose =
        eegsScene != null
          ? `Scene exists so a character must negotiate ${eegsScene.dominantEmotionalFunction} while ${eegsScene.attachmentFunction} without resetting prior consequence pressure.`
          : "Scene exists because weighted POV desire/fear cannot remain static after prior chapter carry — pressure must move through behavior.";

      const dominantPressureIds = [
        `role:${row.sceneRole}`,
        `transition:${row.transitionStrategy}`,
        ...(eegsScene ? [`eegs:${eegsScene.dominantEmotionalFunction}`] : []),
      ];

      byId[sceneId] = CharacterSceneEmergenceDigestSchema.parse({
        sceneId,
        sceneNecessityReasons: necessity,
        conflictSources: conflicts,
        povCandidates: povCandidates.length ? povCandidates : [{ personId: "unknown_pov", weight: 1, rationale: "fallback_pov" }],
        scenePurposeFromPressure: purpose,
        dominantPressureIds,
        validationFlags: ["cluster8_scene_emergence_digest", "character_pressure_required"],
      });
    }

    const chapterPressureSummary = `Chapter ${input.chapterId}: ${Object.keys(byId).length} scene pressure maps — emergence is character-justified; system sequence is enforcement-only.`;

    return CharacterSceneEmergenceChapterPlanSchema.parse({
      contractVersion: CHARACTER_SCENE_EMERGENCE_CONTRACT_VERSION,
      clusterTag: "cluster8_character_scene_emergence_chapter",
      chapterId: input.chapterId,
      bookId: input.bookId,
      sceneEmergenceBySceneId: byId,
      chapterPressureSummary,
      validationFlags: ["cluster8_chapter_emergence_plan"],
    });
  }

  deriveSceneDigestForRuntimeScene(input: {
    sceneId: string;
    minds: CharacterMindProfile[];
    cognitiveStates: CharacterCognitiveState[];
    relationshipStates: RelationshipState[];
    epicContinuityPack: CamptiEpicContinuityPack;
    humanGravityRuntime: HumanGravityRuntimeProfile | null;
    fallbackPovPersonId: string | null;
  }): CharacterSceneEmergenceDigest {
    const necessity: string[] = [];
    const conflicts: string[] = [];
    const povCandidates: CharacterSceneEmergenceDigest["povCandidates"] = [];

    for (const m of input.minds) {
      const cog = input.cognitiveStates.find((c) => c.characterId === m.characterId);
      necessity.push(
        `${m.characterId}: surface desire "${m.surfaceDesire}" is active while fear "${m.fearProfile.primaryFearId}" is at ${(cog?.currentFearActivation ?? 0).toFixed(2)}.`,
      );
      conflicts.push(`${m.characterId}: internal conflict "${cog?.currentInternalConflict ?? m.coreDesire + " vs " + m.survivalStrategy}".`);
    }

    for (const rs of input.relationshipStates) {
      conflicts.push(
        `${rs.relationshipId}: tension ${rs.currentTensionLevel.toFixed(2)} mode ${rs.currentConflictMode} — behavior and silence must track this.`,
      );
    }

    necessity.push(
      `Continuity question pressure: ${input.epicContinuityPack.cockpitSummary.currentQuestionExpression}`,
    );

    if (input.humanGravityRuntime) {
      necessity.push(`Human-gravity scene focus: ${input.humanGravityRuntime.sceneFocusSummary}`);
      conflicts.push(`No-reset carry: ${input.humanGravityRuntime.carryForwardResidue.slice(0, 2).join(" | ")}`);
    }

    const weightPrimary = 0.62;
    const pid = input.fallbackPovPersonId ?? input.minds[0]?.characterId ?? "pov_unknown";
    povCandidates.push({
      personId: pid,
      weight: weightPrimary,
      rationale: "Primary POV / focus character carries highest decision pressure for this scene pass.",
    });
    for (const m of input.minds.filter((x) => x.characterId !== pid)) {
      povCandidates.push({
        personId: m.characterId,
        weight: 0.22,
        rationale: "Secondary participant — dialogue and perception must remain distinct; no flattening.",
      });
    }

    return CharacterSceneEmergenceDigestSchema.parse({
      sceneId: input.sceneId,
      sceneNecessityReasons: necessity.length ? necessity : ["character_pressure_required"],
      conflictSources: conflicts.length ? conflicts : ["desire_fear_obligation_triad"],
      povCandidates,
      scenePurposeFromPressure:
        "The scene advances because interpersonal tension and private cost cannot remain suspended after prior obligation.",
      dominantPressureIds: ["cluster8_runtime_scene_digest", `pov:${pid}`],
      validationFlags: ["cluster8_runtime_emergence"],
    });
  }
}
