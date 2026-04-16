import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Book1AuthorAction, Book1AuthorSimulationGovernancePolicy } from "@/lib/domain/book1-author-cockpit-simulation";
import {
  Book1AuthorCockpitSimulationService,
  type Chapter1CanonicalSourceState,
} from "@/lib/services/book1-author-cockpit-simulation-service";

function sampleSourceState(): Chapter1CanonicalSourceState {
  return {
    chapterEpicSimulation: {
      artifact: "chapter_epic_simulation",
      chapter: 1,
      hiddenTimeline: [
        {
          beatId: "H1",
          sequence: 1,
          latentEvent: "Anchor event one.",
          actors: ["Alexis", "Augustin"],
          pressureVectors: ["kinship_duty"],
          chapterSurfaceSignal: "Signal one.",
          futureArcConstraintLink: "Constraint one.",
        },
      ],
    },
    chapterLaw: {
      artifact: "chapter_law",
      chapter: 1,
      chronologyInvariants: [{ id: "CI-1", rule: "No year over 1680.", enforcement: "reject year token" }],
      futureArcConstraints: [
        {
          id: "FA-1",
          mustPreserve: "Future chapter hooks must remain available: 2:1680-1690, 3:1690-1714.",
          forbiddenResolution: "No final treaty.",
        },
      ],
    },
    chapterRelationshipPressureMap: {
      artifact: "chapter_relationship_pressure_map",
      chapter: 1,
      relationships: [
        {
          from: "Alexis",
          to: "Augustin",
          pressureType: "kinship_duty",
          intensity: 0.58,
          chapterSignal: "Signal",
          futureArcTrigger: "Trigger",
        },
      ],
    },
    chapterCharacterHiddenHistories: {
      artifact: "chapter_character_hidden_histories",
      chapter: 1,
      characters: [
        {
          character: "Alexis",
          publicRole: "household stabilizer",
          suppressedMotive: "preserve continuity",
          privateWound: "fear of erasure",
          hiddenHistoryBeats: ["H1"],
          futureArcHooks: ["hook-1"],
        },
      ],
    },
    chapterVoiceSpec: {
      artifact: "chapter_voice_spec",
      chapter: 1,
      voiceSpec: {
        tense: "past-leaning immediate",
        person: "third-person close rotating",
        narrativeDistance: "intimate social anthropology",
        dictionProfile: {
          prioritize: ["kinship", "river"],
          avoid: ["meta-outline"],
        },
        cadenceConstraints: ["alternate long and short sentence runs"],
      },
    },
    provenance: {
      sourceArtifacts: [
        "reports/book1-chapter-01-chapter_epic_simulation.json",
        "reports/book1-chapter-01-chapter_law.json",
      ],
      capturedAt: new Date().toISOString(),
    },
  };
}

function samplePolicy(overrides: Partial<Book1AuthorSimulationGovernancePolicy> = {}): Book1AuthorSimulationGovernancePolicy {
  return {
    allowAnchorMutation: false,
    allowChapterLawMutation: true,
    allowCharacterPsychologyTuning: true,
    allowForeshadowingRetune: true,
    allowTimelineMutation: true,
    allowRelationshipPressureRetune: true,
    allowVoiceSpecTuning: true,
    simulationMode: "counterfactual",
    ...overrides,
  };
}

function sampleActions(): Book1AuthorAction[] {
  const requestedAt = new Date().toISOString();
  return [
    {
      actionId: "A-law",
      chapter: 1,
      actionType: "update_chapter_law",
      targetKey: "FA-1",
      rationale: "Retune law phrasing.",
      patch: { mustPreserve: "Retuned law." },
      requestedBy: "test",
      requestedAt,
      provenanceRefs: [],
    },
    {
      actionId: "A-anchor",
      chapter: 1,
      actionType: "propose_anchor_mutation",
      targetKey: "H1",
      rationale: "Try changing locked anchor.",
      patch: { latentEvent: "Mutated event" },
      requestedBy: "test",
      requestedAt,
      provenanceRefs: [],
    },
  ];
}

describe("book1-author-cockpit-simulation-service", () => {
  it("blocks locked anchor mutation and reports violation", () => {
    const service = new Book1AuthorCockpitSimulationService();
    const result = service.run({
      sourceState: sampleSourceState(),
      governancePolicy: samplePolicy({ allowAnchorMutation: false, simulationMode: "counterfactual" }),
      actions: sampleActions(),
    });

    const anchorEval = result.simulation.evaluations.find((row) => row.actionId === "A-anchor");
    assert.ok(anchorEval);
    assert.equal(anchorEval.allowed, false);
    assert.equal(anchorEval.lockedAnchorViolation, true);
    assert.equal(result.impactReport.lockViolations.anchorViolations, 1);
    assert.equal(result.impactReport.branchIsolation.canonicalStateMutated, false);
  });

  it("allows branch mutation in unlocked branch mode while preserving canonical isolation", () => {
    const service = new Book1AuthorCockpitSimulationService();
    const result = service.run({
      sourceState: sampleSourceState(),
      governancePolicy: samplePolicy({ allowAnchorMutation: true, simulationMode: "unlocked_branch" }),
      actions: sampleActions(),
    });

    const anchorEval = result.simulation.evaluations.find((row) => row.actionId === "A-anchor");
    assert.ok(anchorEval);
    assert.equal(anchorEval.allowed, true);
    assert.equal(result.simulation.branchSandbox.mutatesCanonicalState, true);
    assert.equal(result.impactReport.branchIsolation.canonicalStateMutated, false);
    assert.equal(result.simulation.branchSandbox.patches.length, 2);
  });
});
