/**
 * Representative inputs for Stage 8 scene-class inference regression checks.
 * Extend as real scenes expose heuristic blind spots.
 */
import type {
  SceneReadinessClass,
  SceneReadinessClassInferenceInput,
  Stage8StructuredDataPatch,
} from "@/lib/scene-structured-data-patch";

export type Stage8ClassificationFixture = {
  id: string;
  note: string;
  input: SceneReadinessClassInferenceInput;
  expectedClass: SceneReadinessClass;
};

const basePatch = {} as Stage8StructuredDataPatch;

export const STAGE8_SCENE_CLASSIFICATION_FIXTURES: Stage8ClassificationFixture[] = [
  {
    id: "general-village",
    note: "Low-signal scene — no strong class cues.",
    input: {
      patch: basePatch,
      visibility: "REVIEW",
      personCount: 1,
      placeCount: 0,
      narrativeIntent: "Establish daily rhythm.",
      description: "Morning light on the porch.",
      historicalConfidence: 2,
      sourcesCount: 0,
    },
    expectedClass: "general",
  },
  {
    id: "historical-trial-records",
    note: "Document-forward trial beats public spectacle lexicon — historical should win.",
    input: {
      patch: basePatch,
      visibility: "PUBLIC",
      personCount: 4,
      placeCount: 1,
      narrativeIntent: "Witness testimony enters the record.",
      description: "Trial deposition and archive documents for the true event.",
      historicalConfidence: 5,
      sourcesCount: 2,
    },
    expectedClass: "historical_anchor",
  },
  {
    id: "intimate-carriage",
    note: "Private intimate beat should beat travel keywords (road, journey).",
    input: {
      patch: basePatch,
      visibility: "PRIVATE",
      personCount: 2,
      placeCount: 1,
      narrativeIntent: null,
      description: "Whispered confession alone together on the road south; intimate, secret.",
      historicalConfidence: null,
      sourcesCount: 0,
    },
    expectedClass: "intimate_disclosure",
  },
  {
    id: "travel-river-crossing",
    note: "Movement-forward with place anchor, no intimate downgrade.",
    input: {
      patch: basePatch,
      visibility: "PUBLIC",
      personCount: 2,
      placeCount: 1,
      narrativeIntent: "Reach the crossing before night.",
      description: "They march to the river crossing and depart at dawn.",
      historicalConfidence: 3,
      sourcesCount: 0,
    },
    expectedClass: "travel_movement",
  },
  {
    id: "public-market-confront",
    note: "Public + confrontation lexicon.",
    input: {
      patch: basePatch,
      visibility: "PUBLIC",
      personCount: 2,
      placeCount: 1,
      narrativeIntent: null,
      description: "Shame and argument in the market square before the crowd.",
      historicalConfidence: 2,
      sourcesCount: 0,
    },
    expectedClass: "public_confrontation",
  },
  {
    id: "ensemble-gathering",
    note: "Crowd / ensemble language with sufficient cast.",
    input: {
      patch: basePatch,
      visibility: "PUBLIC",
      personCount: 4,
      placeCount: 1,
      narrativeIntent: "Everyone reacts at once.",
      description: "The gathered group in the square — ensemble energy, crowd voices.",
      historicalConfidence: 2,
      sourcesCount: 0,
    },
    expectedClass: "ensemble_no_focal",
  },
];
