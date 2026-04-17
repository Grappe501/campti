import type {
  CamptiEpicEmotionalGravityPack,
  SceneEmotionalGravityPlan,
} from "@/lib/domain/epic-emotional-gravity";

export type AttachmentSceneBias = {
  attachmentWeightMap: Record<string, number>;
  activeCharacterAttachmentIds: string[];
  povBiasSummary: string;
  sceneFocusSummary: string;
  activeFearDesireVulnerabilityIds: string[];
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n.toFixed(4))));
}

/**
 * Scene-level attachment weighting from EEGS character profiles + scene emotional plan.
 */
export class AttachmentRuntimeBiasService {
  derive(input: {
    pack: CamptiEpicEmotionalGravityPack;
    sceneId: string;
    chapterId: string;
    participatingPeopleIds: string[];
    scenePlan: SceneEmotionalGravityPlan | null;
  }): AttachmentSceneBias {
    const profiles = input.pack.characterAttachmentProfiles;
    const scenePlan = input.scenePlan;
    const people = new Set(input.participatingPeopleIds);

    const attachmentWeightMap: Record<string, number> = {};
    const activeFearDesireVulnerabilityIds: string[] = [];

    for (const p of profiles) {
      const lastIntensity = p.bondVector.attachmentIntensityOverTime.at(-1)?.intensity ?? 0.5;
      let w = clamp01(
        lastIntensity * 0.45 +
          p.bondVector.vulnerabilityExposure * 0.2 +
          p.bondVector.fearPresence * 0.18 +
          p.bondVector.desireClarity * 0.17,
      );
      if (people.size > 0 && !people.has(p.characterId)) {
        w = clamp01(w * 0.35);
      }

      const inSceneWindows = p.vulnerabilityExposures.some((e) => e.sceneWindows.includes(input.sceneId));
      const chapterScopedFear = p.fearLines.some((f) => f.chapterWindows.some((c) => c.includes(input.chapterId)));
      if (inSceneWindows || chapterScopedFear) {
        w = clamp01(w + 0.12);
      }

      attachmentWeightMap[p.characterId] = w;

      for (const e of p.vulnerabilityExposures) {
        if (e.sceneWindows.includes(input.sceneId)) activeFearDesireVulnerabilityIds.push(e.exposureId);
      }
      for (const f of p.fearLines) {
        if (f.chapterWindows.some((c) => c.includes(input.chapterId) || c === input.chapterId)) {
          activeFearDesireVulnerabilityIds.push(f.fearLineId);
        }
      }
      for (const d of p.desireLines) {
        if (d.chapterWindows.some((c) => c.includes(input.chapterId) || c === input.chapterId)) {
          activeFearDesireVulnerabilityIds.push(d.desireLineId);
        }
      }
    }

    const sorted = Object.entries(attachmentWeightMap).sort((a, b) => b[1] - a[1]);
    const activeCharacterAttachmentIds = sorted.filter(([, wt]) => wt >= 0.22).map(([id]) => id);
    const top = sorted[0];
    const topId = top?.[0] ?? "none";
    const topW = top?.[1] ?? 0;

    const closeness =
      scenePlan && scenePlan.carryForwardWeight > 0.75
        ? "tight interior access and observational closeness"
        : scenePlan && scenePlan.relationalRiskLevel > 0.65
          ? "close witness with relational risk texture"
          : "moderate observational distance; prefer gesture and work over interior summary";

    const povBiasSummary = `POV bias: weight toward ${topId} (score ${topW.toFixed(2)}); bond modes favor embodied duty and inherited ache; ${closeness}.`;

    const sceneFocusSummary = scenePlan
      ? `Scene focus: ${scenePlan.dominantEmotionalFunction}; attachment function: ${scenePlan.attachmentFunction}; carry-forward weight ${scenePlan.carryForwardWeight.toFixed(2)}.`
      : "Scene focus: derive attachment beats from contract intent; preserve vulnerability before explanation.";

    return {
      attachmentWeightMap,
      activeCharacterAttachmentIds,
      povBiasSummary,
      sceneFocusSummary,
      activeFearDesireVulnerabilityIds: [...new Set(activeFearDesireVulnerabilityIds)],
    };
  }
}
