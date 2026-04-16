import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Book1LawConsoleAction, Book1LawConsoleGovernancePolicy } from "@/lib/domain/book1-law-console";
import { Book1LawConsoleService, type Book1LawConsoleSourceState } from "@/lib/services/book1-law-console-service";

function sampleSourceState(): Book1LawConsoleSourceState {
  return {
    chapterLaw: {
      artifact: "chapter_law",
      chapter: 1,
      chronologyInvariants: [{ id: "CI-1", rule: "No year over 1680.", enforcement: "reject year token" }],
      futureArcConstraints: [{ id: "FA-1", mustPreserve: "Keep pressure unresolved.", forbiddenResolution: "No treaty." }],
    },
    chapterVoiceSpec: {
      artifact: "chapter_voice_spec",
      chapter: 1,
      voiceSpec: {
        tense: "past-leaning immediate",
        person: "third-person close rotating",
        narrativeDistance: "intimate",
        dictionProfile: { prioritize: ["kinship"], avoid: ["meta-outline"] },
        cadenceConstraints: ["alternate sentence length"],
      },
    },
    chapterEpicSimulation: {
      artifact: "chapter_epic_simulation",
      chapter: 1,
      hiddenTimeline: [
        {
          beatId: "H1",
          sequence: 1,
          latentEvent: "Anchor event.",
          actors: ["Alexis", "Augustin"],
          pressureVectors: ["kinship_duty"],
          chapterSurfaceSignal: "Stable surface.",
          futureArcConstraintLink: "Constraint link",
        },
      ],
    },
    chapterOutline: {
      chapter: 1,
      timeline: [
        {
          segment: 1,
          sceneFocus: "Opening terrain",
          setting: "river",
          characters: ["Alexis", "Augustin"],
          psychology: "fear vs duty",
          narrativePurpose: "set stakes",
          readerExperience: "latent pressure",
          foreshadowing: "future authority conflict",
          historicalContext: "context",
          transitionToNext: "anomaly appears",
        },
      ],
    },
    chapterDraft: {
      artifact: "chapter_draft",
      chapter: 1,
      segments: [{ segment: 1, objective: "surface pressure", text: "text", evidenceRefs: ["KN-1"] }],
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
    provenance: {
      sourceArtifacts: ["reports/book1-chapter-01-chapter_law.json"],
      capturedAt: new Date().toISOString(),
    },
  };
}

function samplePolicy(overrides: Partial<Book1LawConsoleGovernancePolicy> = {}): Book1LawConsoleGovernancePolicy {
  return {
    allowChapterLawMutation: true,
    allowForeshadowingRetune: true,
    allowVoiceSpecTuning: true,
    allowAnchorMutation: false,
    simulationMode: "counterfactual",
    ...overrides,
  };
}

function sampleActions(now: string): Book1LawConsoleAction[] {
  return [
    {
      actionId: "L-1",
      chapter: 1,
      actionType: "adjust_foreshadowing_intensity",
      targetKey: "FA-1",
      rationale: "Increase long arc pressure visibility.",
      patch: { intensityDelta: 0.15 },
      requestedBy: "test",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_law.json#futureArcConstraints[0]"],
    },
    {
      actionId: "L-2",
      chapter: 1,
      actionType: "propose_anchor_mutation",
      targetKey: "H1",
      rationale: "Attempt to mutate locked anchor.",
      patch: { latentEvent: "Mutated event" },
      requestedBy: "test",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_epic_simulation.json#hiddenTimeline[0]"],
    },
  ];
}

describe("book1-law-console-service", () => {
  it("simulates allowed law actions in sandbox", () => {
    const service = new Book1LawConsoleService();
    const result = service.runSession({
      sourceState: sampleSourceState(),
      governancePolicy: samplePolicy(),
      actions: sampleActions(new Date().toISOString()).slice(0, 1),
    });

    assert.equal(result.session.branchSandbox.simulatedPatches.length, 1);
    assert.equal(result.session.branchSandbox.canonicalMutations.length, 0);
    assert.equal(result.impactReport.actionTotals.allowed, 1);
    assert.equal(result.impactReport.actionTotals.canonicalApplied, 0);
  });

  it("flags locked anchor violations when anchor mutation is disallowed", () => {
    const service = new Book1LawConsoleService();
    const result = service.runSession({
      sourceState: sampleSourceState(),
      governancePolicy: samplePolicy({ allowAnchorMutation: false, simulationMode: "counterfactual" }),
      actions: sampleActions(new Date().toISOString()),
    });

    const anchorEval = result.session.evaluations.find((row) => row.actionId === "L-2");
    assert.ok(anchorEval);
    assert.equal(anchorEval.allowed, false);
    assert.equal(anchorEval.lockedAnchorViolation, true);
    assert.equal(result.impactReport.lockViolations.anchorViolations, 1);
  });

  it("applies canonical mutation only with explicit approval", () => {
    const service = new Book1LawConsoleService();
    const result = service.runSession({
      sourceState: sampleSourceState(),
      governancePolicy: samplePolicy({ allowAnchorMutation: true, simulationMode: "unlocked_branch" }),
      actions: sampleActions(new Date().toISOString()),
      approvedActionIds: ["L-2"],
    });

    const anchorEval = result.session.evaluations.find((row) => row.actionId === "L-2");
    assert.ok(anchorEval);
    assert.equal(anchorEval.allowed, true);
    assert.equal(anchorEval.canonicalApplied, true);
    assert.equal(result.session.branchSandbox.canonicalMutations.length, 1);
    assert.equal(result.impactReport.branchIsolation.canonicalStateMutated, true);
  });
});
