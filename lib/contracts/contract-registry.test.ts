/**
 * Contract registry certification tests (node:test).
 * Run: npx tsx --test lib/contracts/contract-registry.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyContractDefinitionsToMap,
  assertReadableContractVersion,
  assertWritableContractVersion,
  getCurrentContractVersion,
  isContractRegistryFinalized,
  listContracts,
  registerContract,
  validateContractDefinitionInvariants,
  validateRegisteredContractPayload,
  type ContractDefinition,
} from "@/lib/contracts/contract-registry";

describe("contract-registry invariants", () => {
  it("rejects currentVersion not in writableVersions", () => {
    const bad: ContractDefinition = {
      contractName: "_test_bad_current",
      currentVersion: "2",
      readableVersions: ["1", "2"],
      writableVersions: ["1"],
      owner: "test",
      readers: ["test"],
    };
    assert.throws(() => validateContractDefinitionInvariants(bad), /currentVersion/);
  });

  it("rejects writableVersions not subset of readableVersions", () => {
    const bad: ContractDefinition = {
      contractName: "_test_bad_subset",
      currentVersion: "1",
      readableVersions: ["1"],
      writableVersions: ["1", "2"],
      owner: "test",
      readers: ["test"],
    };
    assert.throws(() => validateContractDefinitionInvariants(bad), /subset/);
  });

  it("rejects schemaByVersion keys outside readableVersions", () => {
    const bad: ContractDefinition = {
      contractName: "_test_bad_schema_key",
      currentVersion: "1",
      readableVersions: ["1"],
      writableVersions: ["1"],
      owner: "test",
      readers: ["test"],
      schemaByVersion: { "9": {} as import("zod").ZodType<unknown> },
    };
    assert.throws(() => validateContractDefinitionInvariants(bad), /schemaByVersion/);
  });

  it("duplicate contractName in fresh map throws", () => {
    const ok: ContractDefinition = {
      contractName: "_dup",
      currentVersion: "1",
      readableVersions: ["1"],
      writableVersions: ["1"],
      owner: "test",
      readers: ["test"],
    };
    assert.throws(() => applyContractDefinitionsToMap([ok, ok]), /already registered/);
  });
});

describe("contract-registry bootstrap", () => {
  it("is finalized after load", () => {
    assert.equal(isContractRegistryFinalized(), true);
  });

  it("late registerContract throws", () => {
    const def: ContractDefinition = {
      contractName: "_late",
      currentVersion: "1",
      readableVersions: ["1"],
      writableVersions: ["1"],
      owner: "test",
      readers: ["test"],
    };
    assert.throws(() => registerContract(def), /finalized/);
  });

  it("listContracts is non-empty", () => {
    assert.ok(listContracts().length >= 10);
  });

  it("getCurrentContractVersion returns innerVoice 3", () => {
    assert.equal(getCurrentContractVersion("innerVoice"), "3");
  });

  it("all registered contracts expose a current-version schema parser", () => {
    for (const def of listContracts()) {
      const currentSchema = def.schemaByVersion?.[def.currentVersion];
      assert.ok(
        currentSchema,
        `contract "${def.contractName}" is missing schemaByVersion entry for currentVersion "${def.currentVersion}"`
      );
    }
  });
});

describe("readable vs writable", () => {
  it("accepts readable innerVoice v1", () => {
    assert.doesNotThrow(() => assertReadableContractVersion("innerVoice", "1"));
  });

  it("rejects writable innerVoice v1", () => {
    assert.throws(() => assertWritableContractVersion("innerVoice", "1"), /not writable/);
  });

  it("accepts writable innerVoice v3", () => {
    assert.doesNotThrow(() => assertWritableContractVersion("innerVoice", "3"));
  });
});

describe("validateRegisteredContractPayload", () => {
  it("throws when contractVersion missing", () => {
    assert.throws(
      () => validateRegisteredContractPayload("sceneGenerationOutput", {} as { contractVersion?: string }),
      /Missing contractVersion/
    );
  });

  it("runs schema for sceneGenerationOutput write", () => {
    const out = validateRegisteredContractPayload(
      "sceneGenerationOutput",
      {
        contractVersion: "1",
        generatedText: "x",
        generationNotes: "n",
        warnings: [],
        continuityFlags: [],
        advisoryOnly: true as const,
      },
      "write"
    );
    assert.equal(out.contractVersion, "1");
  });

  it("write mode rejects legacy readable-only version for decisionTrace", () => {
    assert.throws(
      () =>
        validateRegisteredContractPayload(
          "decisionTrace",
          { contractVersion: "1", characterId: "a", sceneId: "b", chosenAction: "c" },
          "write"
        ),
      /not writable/
    );
  });

  it("governs readerCockpitPayload v1 with strict top-level shape", () => {
    const valid = {
      contractVersion: "1",
      builtAtIso: "2026-04-15T00:00:00.000Z",
      readerId: "reader-1",
      characterId: "character-1",
      activeSession: null,
      sceneInteractionContext: null,
      conversationalIdentitySummary: null,
      latestTranscriptTurns: [],
      voicePresentationReadiness: {
        characterPresentationMode: {
          cognitionLanguageCode: null,
          readerPresentationLanguageCode: "en",
          translationApplied: false,
          nativeTongueAvailable: false,
        },
        hasTtsVoiceAssignment: false,
        readyForVoicePlayback: false,
        preferredAudioEnabled: false,
        preferredVoicePlaybackSpeed: 1,
      },
      costEstimateSummary: {
        narrationMode: "bounded_character_conversation",
        ledgerSessionSummary: null,
      },
      policySummary: null,
    };

    assert.doesNotThrow(() => validateRegisteredContractPayload("readerCockpitPayload", valid, "write"));
    assert.throws(() =>
      validateRegisteredContractPayload(
        "readerCockpitPayload",
        {
          ...valid,
          unexpectedTopLevel: true,
        } as typeof valid & { unexpectedTopLevel: boolean },
        "write"
      )
    );
  });

  it("governs authorInspectionPayload v1 with strict top-level shape", () => {
    const valid = {
      contractVersion: "1",
      mode: "authorial_scene_truth_audit",
      characterId: "character-1",
      sceneId: "scene-1",
      readerId: "reader-1",
      sessionId: "session-1",
      modeSeparation: {
        boundedReaderCharacterMode: "bounded_character_conversation",
        authorGodInspectionMode: "future_author_god_mode",
        separationEnforced: true as const,
      },
      characterKnowledgeBoundary: {
        knownFacts: ["f1"],
        believedFacts: [],
        unknownDomains: [],
      },
      canonicalTruthRelevantToCharacter: {
        relevantKnownFacts: ["f1"],
      },
      readerInteractionMemory: {
        familiarityLevel: 1,
        interactionCount: 2,
        knownFactsKeys: ["k1"],
      },
      currentEmotionalState: {
        baselineTone: "steady",
        latestCharacterEmotionalTone: null,
      },
      driftAnchorComparison: {
        anchorPresent: true,
        driftDetected: false,
        driftSignals: [],
      },
      internalThoughtVisibility: {
        allowed: false,
        latestInternalThought: null,
      },
      storylineExplainability: {
        arcState: {
          lifecycleState: "active",
          tensionLevel: 60,
          intensityLevel: 55,
          explanationSummaryCode: "arc_active",
          explanationReasonCodes: ["structural_score_high"],
        },
        chapterProgression: {
          chapterFunction: "deepening",
          progressionState: "in_progress",
          readinessScore: 62,
          transitionBlockers: [],
          explanationSummaryCode: "chapter_progressing",
          explanationReasonCodes: ["entry_conditions_satisfied"],
        },
        narrativePressure: {
          activePressureCount: 1,
          topPressureCategories: ["conflict"],
          blockedCategoryCodes: [],
          reinforcedCategoryCodes: ["conflict"],
          explanationReasonCodes: ["pressure_conflict_supported"],
        },
        branchGovernance: {
          legitimacyStatus: "allowed",
          riskRating: "moderate",
          reconvergenceRecommendation: "recommended_soon",
          arcCompatibilityWarnings: [],
          manageabilityWarnings: [],
          explanationSummaryCode: "branch_governed",
          explanationReasonCodes: ["within_limit"],
        },
        storylineGuidance: {
          allowedSceneTendencies: ["scene_candidate_weighting:conflict"],
          discouragedSceneTendencies: [],
          tensionEmphasisWeights: [{ pressureCategory: "conflict", weight: 72 }],
          reasonCodes: ["mode:interaction_mode"],
        },
        compactBundle: {
          contractVersion: "1",
          mode: "interaction_mode",
          channel: "reader_bond_dyad",
        },
      },
    };

    assert.doesNotThrow(() => validateRegisteredContractPayload("authorInspectionPayload", valid, "write"));
    assert.throws(() =>
      validateRegisteredContractPayload(
        "authorInspectionPayload",
        {
          ...valid,
          extraField: "drift",
        } as typeof valid & { extraField: string },
        "write"
      )
    );
  });

  it("governs conversationObservabilitySnapshot v1 with strict top-level shape", () => {
    const valid = {
      contractVersion: "1",
      builtAtIso: "2026-04-15T00:00:00.000Z",
      conversationalIdentityBuiltAtIso: "2026-04-15T00:00:00.000Z",
      session: {
        sessionId: "session-1",
        characterId: "character-1",
        readerId: "reader-1",
        sceneId: null,
        status: "ACTIVE",
        interactionCount: 0,
        startedAtIso: "2026-04-15T00:00:00.000Z",
        lastInteractionAtIso: "2026-04-15T00:00:00.000Z",
        endedAtIso: null,
      },
      identitySummary: {
        characterId: "character-1",
        readerId: "reader-1",
        sceneId: null,
        personName: "Person",
        personBirthYear: null,
        personDeathYear: null,
        roleArchetype: null,
        narrativeFunction: null,
      },
      readerMemorySummary: null,
      policySummary: null,
      recentTurns: [],
      latestGuardrailAssessment: null,
      conversationAnchorDrift: {
        anchorPresent: false,
        driftDetected: false,
        driftSignals: [],
      },
      sessionMemorySummaryHash: null,
      emotionalContinuity: null,
      degradedInteraction: null,
      storylineExplainability: null,
    };

    assert.doesNotThrow(() =>
      validateRegisteredContractPayload("conversationObservabilitySnapshot", valid, "write")
    );
    assert.throws(() =>
      validateRegisteredContractPayload(
        "conversationObservabilitySnapshot",
        {
          ...valid,
          unregistered: "field",
        } as typeof valid & { unregistered: string },
        "write"
      )
    );
  });

  it("governs interactionObservabilitySummary v1 and rejects contract mismatch", () => {
    const valid = {
      contractVersion: "1",
      sessionId: "session-1",
      characterId: "character-1",
      readerId: "reader-1",
      sceneId: null,
      interactionCount: 1,
      status: "ACTIVE",
      nonCanonical: true as const,
    };
    assert.doesNotThrow(() =>
      validateRegisteredContractPayload("interactionObservabilitySummary", valid, "write")
    );
    assert.throws(
      () =>
        validateRegisteredContractPayload(
          "interactionObservabilitySummary",
          { ...valid, contractVersion: "2" as const },
          "write"
        ),
      /not writable/
    );
  });
});

describe("newly governed payload contract versions", () => {
  it("exposes current versions in registry", () => {
    assert.equal(getCurrentContractVersion("readerCockpitPayload"), "1");
    assert.equal(getCurrentContractVersion("authorInspectionPayload"), "1");
    assert.equal(getCurrentContractVersion("conversationObservabilitySnapshot"), "1");
    assert.equal(getCurrentContractVersion("interactionObservabilitySummary"), "1");
  });
});
