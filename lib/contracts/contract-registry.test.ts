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
});
