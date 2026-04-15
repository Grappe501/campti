/**
 * P3-N reader relationship progression. Run: npx tsx --test lib/services/reader-relationship-progression-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CharacterReaderMemory } from "@/lib/domain/character-reader-memory";
import { deriveReaderRelationshipProgression } from "@/lib/services/reader-relationship-progression-service";

function memory(overrides: Partial<CharacterReaderMemory>): CharacterReaderMemory {
  return {
    id: "crm",
    characterId: "char-1",
    readerId: "reader-1",
    familiarityLevel: 0,
    interactionCount: 0,
    knownFacts: {},
    relationshipNotes: null,
    firstInteractionAt: null,
    lastInteractionAt: new Date("2026-04-14T10:00:00.000Z"),
    metadataJson: null,
    ...overrides,
  };
}

describe("deriveReaderRelationshipProgression", () => {
  it("maps low familiarity to stranger", () => {
    const out = deriveReaderRelationshipProgression({ readerMemory: memory({ familiarityLevel: 2, interactionCount: 1 }) });
    assert.equal(out.relationshipState, "stranger");
    assert.equal(out.directnessLevel, "guarded");
  });

  it("progresses through familiar/trusted thresholds deterministically", () => {
    const familiar = deriveReaderRelationshipProgression({
      readerMemory: memory({ familiarityLevel: 40, interactionCount: 7, knownFacts: { disclosed_name: "Ari" } }),
    });
    const trusted = deriveReaderRelationshipProgression({
      readerMemory: memory({ familiarityLevel: 65, interactionCount: 12, knownFacts: { a: 1, b: 2, c: 3 } }),
    });
    assert.equal(familiar.relationshipState, "familiar");
    assert.equal(trusted.relationshipState, "trusted");
    assert.equal(trusted.vulnerabilityAllowance, "high");
  });

  it("uses disclosure and interaction density to reach confidant", () => {
    const out = deriveReaderRelationshipProgression({
      readerMemory: memory({
        familiarityLevel: 81,
        interactionCount: 20,
        knownFacts: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 },
      }),
    });
    assert.equal(out.relationshipState, "confidant");
    assert.equal(out.disclosureComfortBand, "intimate");
    assert.equal(out.greetingStyleHint.includes("confidence"), true);
  });
});
