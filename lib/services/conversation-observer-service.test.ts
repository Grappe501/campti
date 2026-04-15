/**
 * P2-R conversation observability (deterministic). Run: npx tsx --test lib/services/conversation-observer-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";
import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import type { CharacterConversationTurn } from "@/lib/domain/character-conversation-turn";
import { CONVERSATION_OBSERVABILITY_CONTRACT_VERSION } from "@/lib/domain/conversation-observability";
import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import { computeConversationAnchor } from "@/lib/services/conversation-anchor-service";
import { composeConversationObservabilitySnapshot } from "@/lib/services/conversation-observer-service";

function baseIdentity(
  knowledgeBoundary: ConversationalIdentitySnapshot["knowledgeBoundary"]
): ConversationalIdentitySnapshot {
  return {
    contractVersion: "1",
    builtAtIso: "2026-04-01T12:00:00.000Z",
    characterId: "char-obs",
    readerId: "reader-obs",
    sceneId: "scene-1",
    policy: BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
    identity: {
      person: { id: "char-obs", name: "Élodie", birthYear: 1810, deathYear: null },
      literaryProfile: {
        socialPosition: null,
        roleArchetype: "witness",
        educationLevel: null,
        narrativeFunction: "pressure valve",
        worldview: null,
        coreBeliefs: null,
        fears: null,
        desires: null,
      },
      coreHighlights: null,
    },
    knowledgeBoundary,
    relationships: [],
    readerMemory: null,
    readerRelationshipProgression: {
      relationshipState: "stranger",
      directnessLevel: "guarded",
      vulnerabilityAllowance: "minimal",
      disclosureComfortBand: "none",
      greetingStyleHint: "formal distance",
      familiarityLevel: 0,
      interactionCount: 0,
      keyDisclosureCount: 0,
    },
    emotionalState: {
      latestCognitionSnapshot: null,
      latestLegacyCharacterState: null,
    },
    sessionContext: null,
  };
}

function sessionRow(): CharacterConversationSession {
  const started = new Date("2026-04-01T10:00:00.000Z");
  const last = new Date("2026-04-01T11:30:00.000Z");
  return {
    id: "sess-obs-1",
    characterId: "char-obs",
    readerId: "reader-obs",
    sceneId: "scene-1",
    status: "ACTIVE",
    interactionCount: 2,
    startedAt: started,
    lastInteractionAt: last,
    endedAt: null,
    metadataJson: { test: true },
  };
}

function readerTurn(orderIndex: number, text: string, createdAt: Date): CharacterConversationTurn {
  return {
    id: `turn-r-${orderIndex}`,
    sessionId: "sess-obs-1",
    orderIndex,
    speakerType: "reader",
    payloadJson: {
      contractVersion: "1",
      characterId: "char-obs",
      readerId: "reader-obs",
      inputMode: "text",
      readerText: text,
    },
    createdAt,
  };
}

function characterTurn(
  orderIndex: number,
  spoken: string,
  createdAt: Date,
  knowledgeSource: "known" | "belief" | "uncertain" = "uncertain"
): CharacterConversationTurn {
  return {
    id: `turn-c-${orderIndex}`,
    sessionId: "sess-obs-1",
    orderIndex,
    speakerType: "character",
    payloadJson: {
      contractVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
      spokenResponse: spoken,
      internalThought: "",
      knowledgeSource,
      emotionalTone: "neutral",
    },
    createdAt,
  };
}

describe("composeConversationObservabilitySnapshot", () => {
  it("materializes session, identity, policy, and empty guardrail when there is no character turn", () => {
    const identity = baseIdentity({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const snap = composeConversationObservabilitySnapshot({
      session: sessionRow(),
      identitySnapshot: identity,
      orderedTurns: [
        readerTurn(0, "Hello.", new Date("2026-04-01T11:00:00.000Z")),
      ],
    });
    assert.equal(snap.contractVersion, CONVERSATION_OBSERVABILITY_CONTRACT_VERSION);
    assert.equal(snap.session.sessionId, "sess-obs-1");
    assert.equal(snap.identitySummary.personName, "Élodie");
    assert.equal(snap.identitySummary.roleArchetype, "witness");
    assert.equal(snap.readerMemorySummary, null);
    assert.equal(snap.policySummary.inWorldOnly, true);
    assert.equal(snap.latestGuardrailAssessment, null);
    assert.equal(snap.conversationAnchorDrift.anchorPresent, false);
    assert.equal(snap.conversationAnchorDrift.driftDetected, false);
    assert.equal(snap.recentTurns.length, 1);
    assert.equal(snap.recentTurns[0].summaryLine.includes("Hello"), true);
    assert.equal(snap.degradedInteraction.currentPolicy, null);
    assert.equal(snap.degradedInteraction.freeTurnCount, 0);
    assert.ok(snap.storylineExplainability);
    assert.ok(snap.storylineExplainability?.storylineGuidance.allowedSceneTendencies.length! <= 6);
    assert.ok(snap.storylineExplainability?.storylineGuidance.tensionEmphasisWeights.length! <= 4);
  });

  it("includes latest guardrail assessment for the last character turn", () => {
    const identity = baseIdentity({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: ["No knowledge of real-world events after ~1820 (story calendar); no anachronism."],
    });
    const orderedTurns = [
      readerTurn(0, "Hi.", new Date("2026-04-01T11:00:00.000Z")),
      characterTurn(1, "They said 1950 would matter.", new Date("2026-04-01T11:01:00.000Z")),
    ];
    const snap = composeConversationObservabilitySnapshot({
      session: sessionRow(),
      identitySnapshot: identity,
      orderedTurns,
    });
    assert.ok(snap.latestGuardrailAssessment);
    assert.equal(snap.latestGuardrailAssessment!.pass, false);
    assert.ok(snap.latestGuardrailAssessment!.violations.some((v) => v.code === "future_knowledge_vs_boundary"));
    assert.equal(snap.latestGuardrailAssessment!.suggestedDowngradeAction, "force_knowledge_uncertain");
    const charObs = snap.recentTurns.find((t) => t.orderIndex === 1);
    assert.equal(charObs?.characterKnowledgeSource, "uncertain");
  });

  it("caps recentTurns to maxRecentTurns", () => {
    const identity = baseIdentity({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const ordered: CharacterConversationTurn[] = [];
    for (let i = 0; i < 20; i++) {
      ordered.push(readerTurn(i, `Line ${i}`, new Date(`2026-04-01T11:${String(i).padStart(2, "0")}:00.000Z`)));
    }
    const snap = composeConversationObservabilitySnapshot({
      session: sessionRow(),
      identitySnapshot: identity,
      orderedTurns: ordered,
      maxRecentTurns: 5,
    });
    assert.equal(snap.recentTurns.length, 5);
    assert.ok(snap.recentTurns[snap.recentTurns.length - 1].summaryLine.includes("Line 19"));
  });

  it("surfaces anchor drift when metadata anchor no longer matches current identity snapshot", () => {
    const baseline = baseIdentity({
      knownFacts: ["Known line A"],
      believedFacts: [],
      unknownDomains: [],
    });
    const anchor = computeConversationAnchor(baseline);

    const drifted: ConversationalIdentitySnapshot = {
      ...baseline,
      identity: {
        ...baseline.identity,
        person: { ...baseline.identity.person, name: "Élodie Changed" },
      },
      knowledgeBoundary: {
        ...baseline.knowledgeBoundary,
        knownFacts: ["Known line A", "Known line B"],
      },
    };

    const session = { ...sessionRow(), metadataJson: { conversationAnchor: anchor } };
    const snap = composeConversationObservabilitySnapshot({
      session,
      identitySnapshot: drifted,
      orderedTurns: [readerTurn(0, "Hello", new Date("2026-04-01T11:00:00.000Z"))],
    });

    assert.equal(snap.conversationAnchorDrift.anchorPresent, true);
    assert.equal(snap.conversationAnchorDrift.driftDetected, true);
    assert.ok(snap.conversationAnchorDrift.driftSignals.includes("identity_hash_changed"));
    assert.ok(snap.conversationAnchorDrift.driftSignals.includes("knowledge_boundary_hash_changed"));
  });

  it("surfaces degraded interaction state in observability snapshots", () => {
    const identity = baseIdentity({
      knownFacts: [],
      believedFacts: [],
      unknownDomains: [],
    });
    const session = {
      ...sessionRow(),
      metadataJson: {
        degradedInteraction: {
          currentPolicy: "allow_read_only",
          unavailableReason: "schema_missing",
          freeTurnCount: 3,
          lastTurnUsedDegradedFallback: false,
        },
      },
    };
    const snap = composeConversationObservabilitySnapshot({
      session,
      identitySnapshot: identity,
      orderedTurns: [readerTurn(0, "Still here.", new Date("2026-04-01T11:15:00.000Z"))],
    });

    assert.equal(snap.degradedInteraction.currentPolicy, "allow_read_only");
    assert.equal(snap.degradedInteraction.unavailableReason, "schema_missing");
    assert.equal(snap.degradedInteraction.freeTurnCount, 3);
    assert.equal(snap.degradedInteraction.lastTurnUsedDegradedFallback, false);
  });
});
