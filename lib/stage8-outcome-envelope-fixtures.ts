/**
 * Representative inputs for Stage 8.5 outcome envelope regression checks.
 * Extend as real scenes expose heuristic blind spots (blocked vs costly vs unstable vs too-generous allowed).
 */
import type { CharacterBrainState } from "@/lib/brain-assembly-types";
import type { BuildSceneOutcomeEnvelopeInput } from "@/lib/scene-outcome-envelope-engine";
import type {
  SceneObjectiveMap,
  ScenePerceptionMap,
  ScenePressureMap,
  SceneRevealBudget,
} from "@/lib/scene-constraint-types";
import type { SceneTimeBrainRunnerOutput } from "@/lib/scene-brain-runner-types";

export type Stage85OutcomeExpect = {
  /** Every string must appear as a substring of some entry's `text` in that bucket. */
  blockedTextIncludes?: string[];
  costlyTextIncludes?: string[];
  unstableTextIncludes?: string[];
  allowedTextIncludes?: string[];
  /** No `text` in this bucket may contain the substring (separation / false-block checks). */
  blockedTextExcludes?: string[];
  costlyTextExcludes?: string[];
  unstableTextExcludes?: string[];
  /** At least one entry in the bucket has `reason` containing this substring. */
  anyBlockedReasonIncludes?: string[];
  anyCostlyReasonIncludes?: string[];
  anyUnstableReasonIncludes?: string[];
};

export type Stage85OutcomeFixture = {
  id: string;
  note: string;
  input: BuildSceneOutcomeEnvelopeInput;
  expect: Stage85OutcomeExpect;
};

const basePressure = (): ScenePressureMap => ({
  items: [],
  tagSummary: [],
  sceneVisibility: "PRIVATE",
  visibilityPressureNote: "",
  placeNotes: [],
  focalBrainHints: [],
  placeRiskFlags: [],
});

const basePerception = (): ScenePerceptionMap => ({
  visibleAnchors: ["Test anchor"],
  hiddenOrUnknown: [],
  ambiguousZones: [],
  misreadRisks: [],
  visibilityLegibility: "",
  placeEnvironmentCues: [],
  focalBrainPerceptionHints: [],
  focalDominantInterpretation: null,
});

const baseObjectives = (): SceneObjectiveMap => ({
  focal: {
    personId: "p1",
    displayName: "Focal",
    sceneObjective: "Resolve the immediate tension.",
    characterMotivation: null,
  },
  byPerson: [],
});

const baseReveal = (): SceneRevealBudget => ({
  score0to100: 50,
  band: "open",
  factors: [],
});

/** Minimal brain state; only relational fields are read by the envelope engine. */
function mockBrain(partial: Partial<CharacterBrainState> & Pick<CharacterBrainState, "relationalSafety">): CharacterBrainState {
  return {
    personId: "p1",
    worldStateId: "w1",
    sceneId: null,
    perception: {
      noticeBandwidth: "low",
      likelyMisses: [],
      likelyMisreads: [],
      sensoryBiases: [],
      reactionSpeed: "low",
    },
    meaning: { explanatoryFrame: [], idiomPressure: [], dangerFrame: [], shameFrame: [], hopeFrame: [] },
    regulation: {
      baselineRegulation: "low",
      overloadRisk: "low",
      freezeRisk: "low",
      floodRisk: "low",
      likelySelfManagement: [],
    },
    decision: {
      availableActions: [],
      forbiddenActions: [],
      speechBandwidth: "low",
      defianceCost: "low",
      mostLikelyMove: null,
    },
    assemblyNotes: [],
    ...partial,
  };
}

function minimalFocalEval(over: Partial<SceneTimeBrainRunnerOutput> = {}): SceneTimeBrainRunnerOutput {
  return {
    personId: "p1",
    worldStateId: "w1",
    sceneId: null,
    counterpartSummary: null,
    salientSignals: [],
    dominantInterpretation: "",
    regulationMode: "stable",
    speechWindow: { canSpeak: true, style: "open", safeTopics: [], unsafeTopics: [], blockers: [] },
    actionWindow: {
      available: [],
      blocked: [],
      costly: [],
      ranked: {
        safestAction: null,
        mostLikelyAction: null,
        highestRiskTemptingAction: null,
        tensionNotes: [],
      },
    },
    mostLikelyMove: null,
    primaryFear: "",
    runnerTrace: [],
    runnerNotes: [],
    ...over,
  };
}

export const STAGE85_OUTCOME_ENVELOPE_FIXTURES: Stage85OutcomeFixture[] = [
  {
    id: "forced-stillness-blocks-exit",
    note: "Physical exit is blocked, not merely costly.",
    input: {
      summary: { forcedStillness: true },
      pressure: basePressure(),
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: baseReveal(),
      sceneReadinessClass: "general",
      focalEvaluation: null,
      brainState: null,
    },
    expect: {
      blockedTextIncludes: ["Unilateral physical exit"],
      anyBlockedReasonIncludes: ["forced stillness"],
    },
  },
  {
    id: "high-social-exposure-is-costly-not-blocked",
    note: "Reputation / audience outcomes are priced, not hard-blocked by score alone.",
    input: {
      summary: { socialExposureScore: 62 },
      pressure: basePressure(),
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: baseReveal(),
      sceneReadinessClass: "general",
      focalEvaluation: null,
      brainState: null,
    },
    expect: {
      costlyTextIncludes: ["Reputational"],
      anyCostlyReasonIncludes: ["social exposure"],
      blockedTextExcludes: ["Reputational"],
    },
  },
  {
    id: "intimate-class-public-visibility-blocks-spectacle",
    note: "Intimate disclosure × PUBLIC blocks crowd-facing spectacle logic.",
    input: {
      summary: {},
      pressure: { ...basePressure(), sceneVisibility: "PUBLIC" },
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: baseReveal(),
      sceneReadinessClass: "intimate_disclosure",
      focalEvaluation: null,
      brainState: null,
    },
    expect: {
      blockedTextIncludes: ["Public spectacle"],
      anyBlockedReasonIncludes: ["intimate disclosure"],
      costlyTextIncludes: ["Direct revelation or full naming under audience scrutiny"],
      allowedTextIncludes: ["Implication-only or withheld"],
    },
  },
  {
    id: "intimate-disclosure-public-review-separates-spectacle-cost-implication-regulation",
    note:
      "Realistic slice: intimate_disclosure × REVIEW, focal runner frozen, moderate reveal + relational pressure — spectacle blocked; partial disclosure costly; implication allowed; fluent confession unstable (not the moderate-relational costly line).",
    input: {
      summary: { socialExposureScore: 58 },
      pressure: {
        ...basePressure(),
        sceneVisibility: "REVIEW",
        items: [
          {
            id: "p1",
            code: "disclosure",
            label: "Secret truth pressing toward the surface",
            strength: "high",
            source: "scene_copy",
          },
        ],
      },
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: { score0to100: 50, band: "moderate", factors: ["Stage 7.5 reveal budget score: 50"] },
      sceneReadinessClass: "intimate_disclosure",
      focalEvaluation: minimalFocalEval({ regulationMode: "frozen" }),
      brainState: mockBrain({
        relationalSafety: {
          safePeople: [],
          unsafePeople: [],
          disclosureCost: "mixed",
          intimacyPermission: "low",
          likelyMaskingNeed: "mixed",
        },
      }),
    },
    expect: {
      blockedTextIncludes: ["Public spectacle"],
      costlyTextIncludes: ["Partial disclosure or calibrated naming", "Reputational"],
      allowedTextIncludes: ["Implication-only or withheld"],
      unstableTextIncludes: ["Open confession, emotional lay-down", "Fluent, instrumentally rational collaboration"],
      anyUnstableReasonIncludes: ["strained focal regulation"],
      costlyTextExcludes: ["Open confession or full emotional lay-down beats"],
      blockedTextExcludes: ["Open confession", "Fluent vulnerable"],
    },
  },
  {
    id: "campti-ingestion-packet-01-seeded-scene-ws06",
    note:
      "DB-linked reference: same separation target as `intimate-disclosure-public-review-separates-*` for scene `ing-pkt-01-scene-intimate-review` (WS-06 × Alexis × intimate_disclosure × REVIEW). Keeps tuning tied to a real admin route.",
    input: {
      summary: { socialExposureScore: 58 },
      pressure: {
        ...basePressure(),
        sceneVisibility: "REVIEW",
        items: [
          {
            id: "p1",
            code: "disclosure",
            label: "Secret truth pressing toward the surface",
            strength: "high",
            source: "scene_copy",
          },
        ],
      },
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: { score0to100: 50, band: "moderate", factors: ["Stage 7.5 reveal budget score: 50"] },
      sceneReadinessClass: "intimate_disclosure",
      focalEvaluation: minimalFocalEval({ regulationMode: "frozen" }),
      brainState: mockBrain({
        relationalSafety: {
          safePeople: [],
          unsafePeople: [],
          disclosureCost: "mixed",
          intimacyPermission: "low",
          likelyMaskingNeed: "mixed",
        },
      }),
    },
    expect: {
      blockedTextIncludes: ["Public spectacle"],
      costlyTextIncludes: ["Partial disclosure or calibrated naming", "Reputational"],
      allowedTextIncludes: ["Implication-only or withheld"],
      unstableTextIncludes: ["Open confession, emotional lay-down", "Fluent, instrumentally rational collaboration"],
      anyUnstableReasonIncludes: ["strained focal regulation"],
      costlyTextExcludes: ["Open confession or full emotional lay-down beats"],
      blockedTextExcludes: ["Open confession", "Fluent vulnerable"],
    },
  },
  {
    id: "frozen-regulation-unstable-collaboration",
    note: "Frozen focal regulation makes fluent cooperation unstable, not blocked.",
    input: {
      summary: {},
      pressure: basePressure(),
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: baseReveal(),
      sceneReadinessClass: "general",
      focalEvaluation: minimalFocalEval({ regulationMode: "frozen" }),
      brainState: null,
    },
    expect: {
      unstableTextIncludes: ["Fluent, instrumentally rational collaboration"],
      anyUnstableReasonIncludes: ["focal regulation"],
      blockedTextExcludes: ["Fluent, instrumentally rational collaboration"],
    },
  },
  {
    id: "public-confrontation-prices-visible-heat",
    note: "Escalation remains legal in public confrontation but is explicitly costly.",
    input: {
      summary: {},
      pressure: { ...basePressure(), sceneVisibility: "PUBLIC" },
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: baseReveal(),
      sceneReadinessClass: "public_confrontation",
      focalEvaluation: null,
      brainState: null,
    },
    expect: {
      costlyTextIncludes: ["Audience-visible escalation"],
      anyCostlyReasonIncludes: ["public confrontation"],
    },
  },
  {
    id: "ensemble-strains-private-dyad-fluency",
    note: "Ensemble class flags one-to-one fluent disclosure as unstable.",
    input: {
      summary: {},
      pressure: basePressure(),
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: baseReveal(),
      sceneReadinessClass: "ensemble_no_focal",
      focalEvaluation: null,
      brainState: null,
    },
    expect: {
      unstableTextIncludes: ["Fluent intimate one-to-one"],
      anyUnstableReasonIncludes: ["ensemble"],
    },
  },
  {
    id: "acute-disclosure-cost-not-unstable-by-default",
    note: "High relational disclosure cost is costly bucket, distinct from regulation-unstable.",
    input: {
      summary: {},
      pressure: basePressure(),
      perception: basePerception(),
      objectives: baseObjectives(),
      revealBudget: baseReveal(),
      sceneReadinessClass: "general",
      focalEvaluation: minimalFocalEval({ regulationMode: "stable" }),
      brainState: mockBrain({
        relationalSafety: {
          safePeople: [],
          unsafePeople: [],
          disclosureCost: "acute",
          intimacyPermission: "low",
          likelyMaskingNeed: "low",
        },
      }),
    },
    expect: {
      costlyTextIncludes: ["Frank vulnerability"],
      anyCostlyReasonIncludes: ["disclosure"],
      unstableTextExcludes: ["Frank vulnerability"],
    },
  },
  {
    id: "campti-red-river-riverbank-disclosure-ws09-public",
    note:
      "DB-aligned slice: scene `ing-rr-scene-riverbank-disclosure` — intimate_disclosure × PUBLIC, moderate-low reveal (42), guarded focal, mixed disclosure cost. Spectacle blocked; partial naming costly; implication allowed; fluent vulnerable disclosure unstable under strain.",
    input: {
      summary: { socialExposureScore: 62 },
      pressure: {
        ...basePressure(),
        sceneVisibility: "PUBLIC",
        items: [
          {
            id: "rr-p1",
            code: "disclosure",
            label: "Emotional truth pressing under riverbank visibility",
            strength: "high",
            source: "scene_copy",
          },
        ],
      },
      perception: basePerception(),
      objectives: {
        focal: {
          personId: "seed-person-asha",
          displayName: "Asha",
          sceneObjective: "Clarify emotional truth without causing public shame",
          characterMotivation: null,
        },
        byPerson: [],
      },
      revealBudget: {
        score0to100: 42,
        band: "moderate",
        factors: ["Stage 7.5 reveal budget score: 42"],
      },
      sceneReadinessClass: "intimate_disclosure",
      focalEvaluation: minimalFocalEval({ regulationMode: "guarded" }),
      brainState: mockBrain({
        relationalSafety: {
          safePeople: [],
          unsafePeople: [],
          disclosureCost: "mixed",
          intimacyPermission: "low",
          likelyMaskingNeed: "high",
        },
      }),
    },
    expect: {
      blockedTextIncludes: ["Public spectacle"],
      anyBlockedReasonIncludes: ["intimate disclosure"],
      costlyTextIncludes: ["Partial disclosure or calibrated naming", "Reputational"],
      anyCostlyReasonIncludes: ["social exposure"],
      allowedTextIncludes: ["Implication-only or withheld", "Clarify emotional truth without causing public shame"],
      unstableTextIncludes: ["Open confession, emotional lay-down", "Open, unguarded spontaneity"],
      anyUnstableReasonIncludes: ["strained focal regulation"],
    },
  },
];
