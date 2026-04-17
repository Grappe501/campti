import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  Book1CharacterConsoleGovernancePolicy,
  Book1CharacterConsoleTurn,
} from "@/lib/domain/book1-character-console";
import { BOOK1_CONSOLE_ENFORCEMENT } from "@/lib/domain/book1-console-law-constraint";
import {
  Book1CharacterConsoleService,
  type Book1CharacterConsoleSourceState,
} from "@/lib/services/book1-character-console-service";

function sampleSourceState(): Book1CharacterConsoleSourceState {
  return {
    chapterCharacterHiddenHistories: {
      artifact: "chapter_character_hidden_histories",
      chapter: 1,
      characters: [
        {
          character: "Alexis",
          publicRole: "household stabilizer",
          suppressedMotive: "preserve continuity",
          privateWound: "fear of erasure",
          hiddenHistoryBeats: ["H1", "H2"],
          futureArcHooks: ["hook-1"],
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
          intensity: 0.7,
          chapterSignal: "trust costs increase",
          futureArcTrigger: "threshold later",
        },
      ],
    },
    chapterLaw: {
      artifact: "chapter_law",
      chapter: 1,
      chronologyInvariants: [{ id: "CI-1", rule: "No year over 1680.", enforcement: "reject year token" }],
      futureArcConstraints: [{ id: "FA-1", mustPreserve: "Keep pressure unresolved.", forbiddenResolution: "No treaty." }],
    },
    chapterEpicSimulation: {
      artifact: "chapter_epic_simulation",
      chapter: 1,
      hiddenTimeline: [
        {
          beatId: "H1",
          sequence: 1,
          latentEvent: "Hidden event one.",
          actors: ["Alexis", "Augustin"],
          pressureVectors: ["kinship_duty"],
          chapterSurfaceSignal: "Signal one",
          futureArcConstraintLink: "Link one",
        },
      ],
    },
    chapterOutline: {
      chapter: 1,
      timeline: [
        {
          segment: 1,
          sceneFocus: "Opening rhythm before rupture.",
          setting: "river",
          characters: ["Alexis", "Augustin"],
          psychology: "fear vs duty",
          narrativePurpose: "set stakes",
          readerExperience: "latent pressure",
          foreshadowing: "future authority conflict",
          historicalContext: "caddoan continuity",
          transitionToNext: "small anomaly appears",
        },
      ],
    },
    chapterDraft: {
      artifact: "chapter_draft",
      chapter: 1,
      segments: [
        {
          segment: 1,
          objective: "surface latent pressure",
          text: "Scene text",
          evidenceRefs: ["KN-1"],
        },
      ],
    },
    chapterEnneagramOperatingLayer: {
      artifact: "chapter_enneagram_operating_layer",
      chapter: 1,
      characters: [
        {
          character: "Alexis",
          enneagramType: "6",
          coreFear: "betrayal inside trusted structures",
          coreDesire: "reliable alliance safety",
          defenseMechanism: "suspicion as certainty",
          attentionFixation: "loyalty seams",
          stressPattern: "doubt loop under pressure",
          securityPattern: "grounded cooperative trust",
          selfAwarenessLevel: "developing",
          selfNarrationAccuracy: 0.56,
          whatTheyCannotAdmit: ["dependence on uncertain alliances"],
          howTheyMisreadOthers: "reads delay as concealment",
        },
      ],
    },
    chapterEnneagramConsciousnessEngine: {
      artifact: "chapter_enneagram_consciousness_engine",
      chapter: 1,
      characters: [
        {
          character: "Alexis",
          attentionEngine: {
            noticesFirst: "witness-order disruptions",
            ignores: "comfort cues",
            overFocusesOn: "threat seams",
          },
          distortionEngine: {
            misinterpretsRealityAs: "hesitation as strategic concealment",
            coreNarrativeBias: "rupture expectancy",
          },
          relationshipFieldBehavior: {
            intimateBehavior: "selective disclosure",
            kinshipRole: "guardian of continuity",
            powerWorkBehavior: "tests authority reliability",
            socialGroupBehavior: "slow trust gating",
          },
          languageImpact: {
            sentenceStructure: "short observational clauses",
            silenceVsSpeech: "silence as control gate",
            emotionalExpression: "contained affect",
            abstractionVsEmbodiment: "body and object before thesis",
          },
        },
      ],
    },
    chapterEnneagramMediationLayer: {
      artifact: "chapter_enneagram_mediation_layer",
      chapter: 1,
      characters: [
        {
          character: "Alexis",
          perceptionBiasOutputs: ["notices loyalty seams first"],
          omissionPatterns: ["withholds dependence language"],
          misreadingPatterns: ["reads delay as concealment"],
          bodilyStressConversions: ["stress routes into breath tightening"],
          silencePatterns: ["silence delays admission until evidence lands"],
          conflictResponsePatterns: ["conflict response favors preemptive guarding"],
          intimacyDistancePatterns: ["intimacy arrives through selective disclosure"],
          authorityResponsePatterns: ["tests authority before compliance"],
          ritualMeaningPatterns: ["ritual cadence is treated as trust telemetry"],
        },
      ],
    },
    provenance: {
      sourceArtifacts: ["reports/book1-chapter-01-chapter_law.json"],
      capturedAt: new Date().toISOString(),
    },
  };
}

function samplePolicy(overrides: Partial<Book1CharacterConsoleGovernancePolicy> = {}): Book1CharacterConsoleGovernancePolicy {
  return {
    allowCharacterStateMutation: true,
    allowDialogueMutation: true,
    allowActionPathMutation: true,
    allowAnchorMutation: false,
    simulationMode: "god",
    ...overrides,
  };
}

function sampleTurns(now: string): Book1CharacterConsoleTurn[] {
  return [
    {
      turnId: "T-1",
      chapter: 1,
      scene: 1,
      character: "Alexis",
      actionType: "probe",
      content: "What pressure is Alexis masking right now?",
      requestedBy: "test",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_character_hidden_histories.json#characters[0]"],
    },
    {
      turnId: "T-2",
      chapter: 1,
      scene: 1,
      character: "Alexis",
      actionType: "intervene",
      content: "Increase urgency in Alexis internal pressure response.",
      proposedMutation: {
        mutationId: "M-1",
        mutationKind: "character_state",
        targetKey: "alexis.state.fearWeight",
        patch: { fearWeight: 0.81 },
        rationale: "Surface chapter pressure earlier.",
        provenanceRefs: ["reports/book1-chapter-01-chapter_relationship_pressure_map.json#relationships[0]"],
      },
      requestedBy: "test",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_draft.json#segments[0]"],
    },
  ];
}

describe("book1-character-console-service", () => {
  it("builds a chapter1 simulation packet with required character fields", () => {
    const service = new Book1CharacterConsoleService();
    const now = new Date().toISOString();
    const result = service.runSession({
      sourceState: sampleSourceState(),
      selection: { chapter: 1, scene: 1, character: "Alexis" },
      governancePolicy: samplePolicy({ simulationMode: "observer" }),
      turns: sampleTurns(now).slice(0, 1),
    });

    assert.equal(result.session.simulationPacket.canonicalIdentity.character, "Alexis");
    assert.equal(result.session.simulationPacket.currentSceneLawConstraints.length > 0, true);
    assert.equal(result.session.simulationPacket.currentChapterLawConstraints.length > 0, true);
    for (const row of result.session.simulationPacket.currentChapterLawConstraints) {
      assert.equal(typeof row.enforcement, "string");
      assert.ok(row.enforcement.length > 0);
    }
    for (const row of result.session.simulationPacket.currentSceneLawConstraints) {
      assert.equal(row.enforcement, BOOK1_CONSOLE_ENFORCEMENT.sceneLawConstraint);
    }
    const fa = result.session.simulationPacket.currentChapterLawConstraints.find((row) => row.id === "FA-1");
    assert.ok(fa);
    assert.equal(fa.enforcement, BOOK1_CONSOLE_ENFORCEMENT.futureArcConstraint);
    assert.equal(result.session.simulationPacket.falseBeliefs.length > 0, true);
    assert.equal(result.session.simulationPacket.rawEnneagramOperatingLayer?.enneagramType, "6");
    assert.equal(
      result.session.simulationPacket.mediatedBehavioralLayer?.silencePatterns.includes(
        "silence delays admission until evidence lands",
      ),
      true,
    );
  });

  it("derives chronology_invariant in packet when chapter_law omits chronology enforcement", () => {
    const service = new Book1CharacterConsoleService();
    const now = new Date().toISOString();
    const base = sampleSourceState();
    const sourceState: Book1CharacterConsoleSourceState = {
      ...base,
      chapterLaw: {
        ...base.chapterLaw,
        chronologyInvariants: [{ id: "CI-OMIT", rule: "Temporal rule without artifact enforcement field." }],
      },
    };
    const result = service.runSession({
      sourceState,
      selection: { chapter: 1, scene: 1, character: "Alexis" },
      governancePolicy: samplePolicy({ simulationMode: "observer" }),
      turns: sampleTurns(now).slice(0, 1),
    });
    const row = result.session.simulationPacket.currentChapterLawConstraints.find((r) => r.id === "CI-OMIT");
    assert.ok(row);
    assert.equal(row.enforcement, BOOK1_CONSOLE_ENFORCEMENT.chronologyInvariant);
  });

  it("blocks interventions in observer mode", () => {
    const service = new Book1CharacterConsoleService();
    const now = new Date().toISOString();
    const result = service.runSession({
      sourceState: sampleSourceState(),
      selection: { chapter: 1, scene: 1, character: "Alexis" },
      governancePolicy: samplePolicy({ simulationMode: "observer" }),
      turns: sampleTurns(now),
    });

    const intervention = result.session.evaluations.find((row) => row.turnId === "T-2");
    assert.ok(intervention);
    assert.equal(intervention.accepted, false);
    assert.equal(result.impactReport.interventionTotals.submitted, 0);
    assert.equal(result.session.branchSandbox.simulatedMutations.length, 0);
  });

  it("applies governed god-mode interventions to sandbox and only mutates canon on approval", () => {
    const service = new Book1CharacterConsoleService();
    const now = new Date().toISOString();
    const result = service.runSession({
      sourceState: sampleSourceState(),
      selection: { chapter: 1, scene: 1, character: "Alexis" },
      governancePolicy: samplePolicy({ simulationMode: "god" }),
      turns: sampleTurns(now),
      approvedMutationIds: ["M-1"],
    });

    const intervention = result.session.evaluations.find((row) => row.turnId === "T-2");
    assert.ok(intervention?.mutationEvaluation);
    assert.equal(intervention.mutationEvaluation.allowed, true);
    assert.equal(intervention.mutationEvaluation.sandboxApplied, true);
    assert.equal(intervention.mutationEvaluation.canonicalApplied, true);
    assert.equal(result.session.branchSandbox.simulatedMutations.length, 1);
    assert.equal(result.session.branchSandbox.canonicalMutations.length, 1);
    assert.equal(result.impactReport.interventionTotals.allowed, 1);
    assert.equal(result.impactReport.branchIsolation.canonicalStateMutated, true);
  });
});
