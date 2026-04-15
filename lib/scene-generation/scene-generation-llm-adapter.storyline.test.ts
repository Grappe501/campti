import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import { compactStorylineGuidanceLines } from "@/lib/scene-generation/scene-generation-llm-adapter";

function minimalInput(overrides: Partial<SceneGenerationInput> = {}): SceneGenerationInput {
  return {
    contract: {
      contractVersion: "1",
      epic: { id: "e1", title: "Epic", summary: null, metadataJson: {} },
      book: { id: "b1", movementIndex: 1, title: "Book", readerFacingTitle: null, summary: null },
      chapter: { id: "ch1", title: "Chapter", summary: null, sequenceInBook: 1, chapterNumber: 1 },
      scene: {
        id: "s1",
        description: "desc",
        summary: null,
        narrativeIntent: null,
        emotionalTone: null,
        orderInChapter: 1,
        writingMode: "draft",
        historicalAnchor: null,
        locationNote: null,
        pov: null,
        structuredDataJson: {},
      },
      effectiveWorldState: { worldStateId: null, eraId: null, label: null },
      place: null,
      participatingPeople: [],
      genealogicalAssertions: [],
      worldStateReference: null,
      beatPlan: [],
      continuityNotes: [],
      privateNotes: null,
    },
    generationMode: "draft",
    generationPurpose: "author_draft",
    historicalAnchorTerms: [],
    proseQaContext: {},
    sourceIdsUsed: [],
    storylineGuidanceSummary: null,
    ...overrides,
  };
}

describe("compactStorylineGuidanceLines", () => {
  it("returns null when storyline guidance is absent", () => {
    const out = compactStorylineGuidanceLines(minimalInput());
    assert.equal(out, null);
  });

  it("returns bounded advisory-only storyline lines", () => {
    const out = compactStorylineGuidanceLines(
      minimalInput({
        storylineGuidanceSummary: {
          storylineBundle: {
            contractVersion: "1",
            mode: "scene_mode",
            channel: "canonical_dyad",
            activeArcPriorities: [],
            chapterProgressionSummary: {
              chapterFunction: "deepening",
              progressionState: "in_progress",
              readinessScore: 64,
              unresolvedCarryoverCount: 1,
            },
            currentNarrativeQuestions: ["q1"],
            sceneTendencyGuidance: {
              allowedSceneTendencies: ["scene_candidate_weighting:disclosure"],
              discouragedSceneTendencies: ["scene_candidate_weighting:implausible_jump"],
            },
            branchConstraints: {
              legalityStatus: "allowed",
              canonicalityStatus: "canonical_candidate",
              depthStatus: "within_limit",
              reconvergenceRecommendation: "not_needed",
              divergenceWarnings: [],
            },
            tensionEmphasisWeights: [{ pressureCategory: "conflict", weight: 72 }],
            explainability: {
              reasonCodes: ["mode:scene_mode"],
              subsystemSummaries: ["arc_states=1"],
            },
          },
          allowedSceneTendencies: ["scene_candidate_weighting:disclosure"],
          discouragedSceneTendencies: ["scene_candidate_weighting:implausible_jump"],
          topTensionWeights: [{ pressureCategory: "conflict", weight: 72 }],
          reconvergenceRecommendation: "not_needed",
        },
      })
    );
    assert.ok(out);
    assert.ok(out?.includes("Prefer (weighted, never forced)"));
    assert.ok(out?.includes("Safety: storyline guidance is advisory-only"));
  });
});
