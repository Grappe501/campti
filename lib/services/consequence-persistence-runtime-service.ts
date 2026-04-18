import type { ConsequenceProfile } from "@/lib/domain/epic-emotional-gravity";

export type ConsequencePersistenceSceneBias = {
  activeConsequenceMarkers: string[];
  irreversibilityState: string;
  repairDifficultySignals: string[];
};

/**
 * Selects durable consequence signals that must persist past this scene/chapter window.
 */
export class ConsequencePersistenceRuntimeService {
  derive(input: {
    profile: ConsequenceProfile;
    chapterId: string;
    sceneId: string;
    participatingPeopleIds: string[];
  }): ConsequencePersistenceSceneBias {
    const people = new Set(input.participatingPeopleIds);
    const markers: string[] = [];

    for (const m of input.profile.irreversibilityMarkers) {
      const sameChapter = m.chapterId === input.chapterId || m.chapterId.includes(input.chapterId);
      const sameScene = m.sceneId === input.sceneId;
      if (sameChapter || sameScene || m.shadowStrength >= 0.75) {
        markers.push(
          `${m.markerId}:${m.irreversibilityClass}:shadow=${m.shadowStrength.toFixed(2)}:${m.consequenceShadow}`,
        );
      }
    }

    const fractures = input.profile.identityFractureEvents.filter(
      (e) => people.size === 0 || people.has(e.characterId),
    );
    for (const f of fractures) {
      markers.push(`identity_fracture:${f.characterId}:${f.newIdentityConstraint}`);
    }

    const relAlts = input.profile.relationshipAlterationEvents.map(
      (e) =>
        `relationship_shift:${e.relationshipId}:repairDifficulty=${e.repairDifficulty.toFixed(2)}:${e.newBondState}`,
    );

    const loss = input.profile.lossLedger
      .filter((l) => l.carriedBy.some((c) => people.size === 0 || people.has(c)))
      .map((l) => `loss:${l.lossType}:${l.lossStatement}`);

    const permanent = input.profile.permanentChangeRecords.map(
      (r) => `permanent:${r.targetKind}:${r.permanentChangeStatement}`,
    );

    const noReturn = input.profile.noReturnThresholds
      .filter(
        (n) =>
          n.chapterWindow === input.chapterId ||
          n.chapterWindow.includes(input.chapterId) ||
          input.chapterId.includes(n.chapterWindow),
      )
      .map((n) => `no_return:${n.thresholdId}:${n.thresholdLabel}`);

    const activeConsequenceMarkers = [
      ...markers,
      ...relAlts.slice(0, 3),
      ...loss.slice(0, 2),
      ...permanent.slice(0, 2),
      ...noReturn.slice(0, 3),
    ];

    const irrClasses = input.profile.irreversibilityMarkers.map((m) => m.irreversibilityClass);
    const heavy = irrClasses.filter((c) => c !== "reversible").length;
    const triggeredNoReturn = input.profile.noReturnThresholds.filter(
      (n) =>
        n.chapterWindow === input.chapterId ||
        n.chapterWindow.includes(input.chapterId) ||
        input.chapterId.includes(n.chapterWindow),
    ).length;
    const irreversibilityState = `Irreversibility mix: ${heavy} non-reversible markers in scope; ${input.profile.noReturnThresholds.length} no-return thresholds registered (${triggeredNoReturn} in/near this chapter window).`;

    const repairDifficultySignals = input.profile.relationshipAlterationEvents.map(
      (e) => `repair:${e.relationshipId}:${e.repairDifficulty.toFixed(2)}`,
    );

    return {
      activeConsequenceMarkers: activeConsequenceMarkers.slice(0, 14),
      irreversibilityState,
      repairDifficultySignals: repairDifficultySignals.slice(0, 8),
    };
  }
}
