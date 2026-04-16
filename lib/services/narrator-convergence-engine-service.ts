import {
  NarratorConvergenceProfileSchema,
  type ConvergenceStage,
  type IdentityNearnessBand,
  type NarratorConvergenceProfile,
  type NarratorConvergenceStageName,
  type NarratorPresenceLevel,
} from "@/lib/domain/narrator-presence";

const STAGE_ORDER: NarratorConvergenceStageName[] = [
  "distant_observer",
  "lineage_aware_guide",
  "emotionally_invested_interpreter",
  "family_near_witness",
  "inherited_memory_carrier",
  "threshold_of_self",
  "first_person_presence",
];

const STAGE_PRESENCE: Record<NarratorConvergenceStageName, NarratorPresenceLevel> = {
  distant_observer: "subtle",
  lineage_aware_guide: "guiding",
  emotionally_invested_interpreter: "reflective",
  family_near_witness: "personal",
  inherited_memory_carrier: "intimate",
  threshold_of_self: "intimate",
  first_person_presence: "first_person",
};

function resolveIdentityNearnessBand(eraId: string): IdentityNearnessBand {
  const normalized = eraId.toLowerCase();
  if (normalized.includes("2026") || normalized.includes("self")) return "lived_present";
  if (normalized.includes("father") || normalized.includes("198") || normalized.includes("199")) return "self_era_threshold";
  if (normalized.includes("1960") || normalized.includes("grandfather")) return "family_near";
  if (normalized.includes("189") || normalized.includes("lineage")) return "lineage_adjacent";
  return "distant_historical";
}

function stageFromChapterSequence(chapterSequence: number): NarratorConvergenceStageName {
  if (chapterSequence >= 18) return "first_person_presence";
  if (chapterSequence >= 15) return "threshold_of_self";
  if (chapterSequence >= 12) return "inherited_memory_carrier";
  if (chapterSequence >= 9) return "family_near_witness";
  if (chapterSequence >= 6) return "emotionally_invested_interpreter";
  if (chapterSequence >= 3) return "lineage_aware_guide";
  return "distant_observer";
}

function buildStages(): ConvergenceStage[] {
  const rows: Array<{
    stageName: NarratorConvergenceStageName;
    identityNearnessBand: IdentityNearnessBand;
    authorityShift: string;
    emotionalStakeFloor: number;
    distanceReduction: number;
  }> = [
    {
      stageName: "distant_observer",
      identityNearnessBand: "distant_historical",
      authorityShift: "archival witness posture with explicit humility.",
      emotionalStakeFloor: 0.2,
      distanceReduction: 0.1,
    },
    {
      stageName: "lineage_aware_guide",
      identityNearnessBand: "lineage_adjacent",
      authorityShift: "interpretive guide role introduces continuity-bearing lineage signals.",
      emotionalStakeFloor: 0.3,
      distanceReduction: 0.2,
    },
    {
      stageName: "emotionally_invested_interpreter",
      identityNearnessBand: "lineage_adjacent",
      authorityShift: "interpretive authority deepens through attachment and burden awareness.",
      emotionalStakeFloor: 0.45,
      distanceReduction: 0.35,
    },
    {
      stageName: "family_near_witness",
      identityNearnessBand: "family_near",
      authorityShift: "lineage-aware witness mode with explicit personal stake growth.",
      emotionalStakeFloor: 0.58,
      distanceReduction: 0.5,
    },
    {
      stageName: "inherited_memory_carrier",
      identityNearnessBand: "self_era_threshold",
      authorityShift: "memory-carrying narrator shifts from interpretation toward inherited witness.",
      emotionalStakeFloor: 0.68,
      distanceReduction: 0.65,
    },
    {
      stageName: "threshold_of_self",
      identityNearnessBand: "self_era_threshold",
      authorityShift: "narrator voice enters first-person threshold with strict continuity discipline.",
      emotionalStakeFloor: 0.8,
      distanceReduction: 0.78,
    },
    {
      stageName: "first_person_presence",
      identityNearnessBand: "lived_present",
      authorityShift: "lived-first-person authority becomes active and explicit.",
      emotionalStakeFloor: 0.9,
      distanceReduction: 0.95,
    },
  ];

  return rows.map((row, index) => ({
    stageId: `narrator-stage-${index + 1}`,
    stageOrder: index + 1,
    stageName: row.stageName,
    identityNearnessBand: row.identityNearnessBand,
    expectedPresenceFloor: STAGE_PRESENCE[row.stageName],
    expectedPresenceCeiling: row.stageName === "threshold_of_self" ? "first_person" : STAGE_PRESENCE[row.stageName],
    authorityShift: row.authorityShift,
    emotionalStakeFloor: row.emotionalStakeFloor,
    distanceReduction: row.distanceReduction,
  }));
}

export class NarratorConvergenceEngineService {
  derive(input: {
    chapterId: string;
    chapterSequence: number;
    eraId: string;
    priorStage?: NarratorConvergenceStageName;
  }): NarratorConvergenceProfile {
    const stages = buildStages();
    const currentStage = stageFromChapterSequence(input.chapterSequence);
    const currentStageOrder = STAGE_ORDER.indexOf(currentStage) + 1;
    const identityNearnessBand = resolveIdentityNearnessBand(input.eraId);

    const activeTriggers = [
      {
        triggerId: "trigger-grandfather-line",
        triggerType: "approaching_grandfather_line" as const,
        triggerStrength: input.chapterSequence >= 8 ? 0.72 : 0.3,
        chapterWindow: "book1-ch08-to-ch10",
        triggerEvidence: ["lineage-name recurrence", "warning phrase inheritance"],
      },
      {
        triggerId: "trigger-father-line",
        triggerType: "approaching_father_line" as const,
        triggerStrength: input.chapterSequence >= 11 ? 0.76 : 0.28,
        chapterWindow: "book1-ch11-to-ch14",
        triggerEvidence: ["family burden carried into immediate line", "memory witness convergence"],
      },
      {
        triggerId: "trigger-self-threshold",
        triggerType: "approaching_self_line" as const,
        triggerStrength: input.chapterSequence >= 15 ? 0.86 : 0.2,
        chapterWindow: "book1-ch15-to-ch18",
        triggerEvidence: ["author-self timeline emergence", "direct identity recognition pressure"],
      },
    ];

    const readinessScore = Math.max(
      0,
      Math.min(1, Number(((currentStageOrder / STAGE_ORDER.length) * 0.7 + activeTriggers[2]!.triggerStrength * 0.3).toFixed(3))),
    );

    const blockers =
      currentStage === "first_person_presence" || readinessScore >= 0.82
        ? []
        : ["insufficient-direct-memory-evidence", "first-person threshold not yet crossed"];

    return NarratorConvergenceProfileSchema.parse({
      artifact: "narrator_convergence_profile",
      schemaVersion: "1.0.0",
      profileId: `${input.chapterId}:narrator-convergence`,
      chapterId: input.chapterId,
      eraId: input.eraId,
      currentStage,
      currentIdentityNearnessBand: identityNearnessBand,
      convergenceProgressScore: Number((currentStageOrder / STAGE_ORDER.length).toFixed(3)),
      stages,
      activeTriggers,
      upcomingTriggers: activeTriggers.filter((row) => row.triggerStrength < 0.8),
      voiceShiftMarkers: [
        {
          markerId: "marker-reflective-to-personal",
          fromPresenceLevel: "reflective",
          toPresenceLevel: "personal",
          shiftType: "distance",
          allowedAbruptness: 0.35,
          continuityRequirement: ["anchor recurrence before voice closeness increase", "retain era cognition boundaries"],
        },
        {
          markerId: "marker-personal-to-first-person",
          fromPresenceLevel: "intimate",
          toPresenceLevel: "first_person",
          shiftType: "first_person_threshold",
          allowedAbruptness: 0.2,
          continuityRequirement: ["direct witness threshold met", "lineage recognition threshold explicit"],
        },
      ],
      firstPersonReadiness: {
        ready: currentStage === "first_person_presence" || readinessScore >= 0.85,
        readinessScore,
        blockers,
      },
      validationFlags: input.priorStage && STAGE_ORDER.indexOf(input.priorStage) > STAGE_ORDER.indexOf(currentStage)
        ? ["stage-regression-detected"]
        : ["convergence-monotonic"],
    });
  }
}
