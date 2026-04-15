/**
 * P2-K conversational turn input contract. Run: npx tsx --test lib/domain/conversational-turn-input.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import {
  CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
  conversationalTurnInputSchemaV1,
  type ConversationalTurnInput,
} from "@/lib/domain/conversational-turn-input";

function validMinimal(): ConversationalTurnInput {
  return {
    contractVersion: CONVERSATIONAL_TURN_INPUT_CONTRACT_VERSION,
    characterId: "char-1",
    readerId: "reader-1",
    inputMode: "text",
    readerText: "Hello.",
  };
}

describe("conversationalTurnInputSchemaV1", () => {
  it("parses a minimal valid payload", () => {
    const out = conversationalTurnInputSchemaV1.parse(validMinimal());
    assert.equal(out.contractVersion, "1");
    assert.equal(out.readerText, "Hello.");
  });

  it("accepts optional fields", () => {
    const out = conversationalTurnInputSchemaV1.parse({
      ...validMinimal(),
      sceneId: "scene-a",
      sessionId: null,
      translatedToCharacterLanguage: true,
      metadataJson: { source: "test" },
    });
    assert.equal(out.sceneId, "scene-a");
    assert.equal(out.sessionId, null);
    assert.equal(out.translatedToCharacterLanguage, true);
    assert.equal((out.metadataJson as Record<string, unknown>).source, "test");
  });

  it("rejects invalid inputMode", () => {
    assert.throws(() =>
      conversationalTurnInputSchemaV1.parse({
        ...validMinimal(),
        inputMode: "audio",
      })
    );
  });

  it("rejects empty characterId", () => {
    assert.throws(() =>
      conversationalTurnInputSchemaV1.parse({
        ...validMinimal(),
        characterId: "",
      })
    );
  });
});

describe("conversationalTurnInput registry", () => {
  it("validates write payload through contract registry", () => {
    const payload = validMinimal();
    const v = validateRegisteredContractPayload("conversationalTurnInput", payload, "write");
    assert.deepEqual(v, payload);
  });
});
