/**
 * Contract registry — single source of truth for persisted / versioned JSON contracts (P1-A.2).
 *
 * Rules:
 * - Every wire or persisted blob that carries `contractVersion` should be registered here before
 *   production use (bootstrap list is authoritative; late registration is forbidden after finalize).
 * - `readableVersions`: consumers (loaders, validators, migrations) may accept any listed version.
 * - `writableVersions`: emitters must only produce versions in this set (subset of readable).
 *   New writes should target `currentVersion` unless a migration path explicitly says otherwise.
 * - `currentVersion` must appear in `writableVersions` and in `readableVersions`.
 * - `schemaByVersion` holds optional Zod parsers per version; missing entry = version allowed but no deep parse.
 *
 * Governance: add new versions here first, then implement code paths — drift checks flag literals
 * that are not covered by any registry readable set.
 */

import { z } from "zod";

import {
  characterInnerVoiceRequestSchemaV2,
  characterInnerVoiceRequestSchemaV3,
  decisionTraceRequestSchema,
  innerVoiceRequestSchema,
} from "@/lib/cognition/inner-voice-contract";
import { BOOK_COHERENCE_REPORT_VERSION } from "@/lib/domain/book-coherence";
import { CHAPTER_COHERENCE_REPORT_VERSION } from "@/lib/domain/chapter-coherence";
import { NARRATIVE_SHAPING_CONTRACT_VERSION } from "@/lib/domain/narrative-shaping-defaults";
import {
  WORLD_OBSERVER_CONTRACT_VERSION,
  CHAPTER_OBSERVER_CONTRACT_VERSION,
  BOOK_OBSERVER_CONTRACT_VERSION,
} from "@/lib/domain/world-observability";
import { CHARACTER_RESPONSE_CONTRACT_VERSION } from "@/lib/domain/character-response-contract";

export type ContractDefinition = {
  contractName: string;
  currentVersion: string;
  readableVersions: string[];
  writableVersions: string[];
  owner: string;
  readers: string[];
  notes?: string;
  /** Optional Zod schema per readable version (omit key = version tag-only validation). */
  schemaByVersion?: Partial<Record<string, z.ZodType<unknown>>>;
};

export type ContractValidationMode = "read" | "write";

const registry = new Map<string, ContractDefinition>();

let finalized = false;

/** Scene generation wire contract (`SceneGenerationContractV1`). */
const sceneGenerationContractSchema = z
  .object({
    contractVersion: z.literal("1"),
  })
  .passthrough();

/** Model output for scene generation (`SceneGenerationOutputV1`). */
const sceneGenerationOutputSchema = z.object({
  contractVersion: z.literal("1"),
  generatedText: z.string(),
  generationNotes: z.string(),
  warnings: z.array(z.string()),
  continuityFlags: z.array(z.string()),
  advisoryOnly: z.literal(true),
});

const cognitionFrameSchema = z
  .object({
    contractVersion: z.literal("cognition-frame-v6"),
  })
  .passthrough();

const decisionTraceRequestV2Schema = z
  .object({
    contractVersion: z.literal("2"),
  })
  .passthrough();

/** `SocialFieldContext` (population-social-field). */
const socialFieldContextSchema = z
  .object({
    contractVersion: z.literal("2"),
  })
  .passthrough();

const narrativeShapingDefaultsV1Schema = z.object({
  contractVersion: z.literal(NARRATIVE_SHAPING_CONTRACT_VERSION),
  defaults: z.any().optional(),
});

const worldObserverSnapshotSchemaV3 = z
  .object({
    contractVersion: z.literal("3"),
  })
  .passthrough();

const worldObserverSnapshotSchemaV4 = z
  .object({
    contractVersion: z.literal(WORLD_OBSERVER_CONTRACT_VERSION),
  })
  .passthrough();

const chapterObserverSnapshotSchemaV1 = z
  .object({
    contractVersion: z.literal("1"),
  })
  .passthrough();

const chapterObserverSnapshotSchemaV2 = z
  .object({
    contractVersion: z.literal(CHAPTER_OBSERVER_CONTRACT_VERSION),
  })
  .passthrough();

const bookObserverSnapshotSchemaV1 = z
  .object({
    contractVersion: z.literal("1"),
  })
  .passthrough();

const bookObserverSnapshotSchemaV2 = z
  .object({
    contractVersion: z.literal(BOOK_OBSERVER_CONTRACT_VERSION),
  })
  .passthrough();

const chapterCoherenceReportSchema = z
  .object({
    contractVersion: z.literal(CHAPTER_COHERENCE_REPORT_VERSION),
  })
  .passthrough();

const bookCoherenceReportSchema = z
  .object({
    contractVersion: z.literal(BOOK_COHERENCE_REPORT_VERSION),
  })
  .passthrough();

/** P2-I — structured character conversational turn (spoken + inner + epistemic tag). */
const characterResponseContractSchemaV1 = z.object({
  contractVersion: z.literal(CHARACTER_RESPONSE_CONTRACT_VERSION),
  spokenResponse: z.string(),
  internalThought: z.string(),
  knowledgeSource: z.enum(["known", "belief", "uncertain"]),
  emotionalTone: z.string(),
});

function sortedUnique(versions: string[]): string[] {
  return [...new Set(versions)].sort((a, b) => a.localeCompare(b));
}

/**
 * Validates structural invariants for a definition (used at registration and in tests).
 */
export function validateContractDefinitionInvariants(def: ContractDefinition): void {
  const readable = sortedUnique(def.readableVersions);
  const writable = sortedUnique(def.writableVersions);

  if (readable.length === 0) {
    throw new Error(`[contract-registry] "${def.contractName}": readableVersions must be non-empty`);
  }
  if (writable.length === 0) {
    throw new Error(`[contract-registry] "${def.contractName}": writableVersions must be non-empty`);
  }
  if (!writable.includes(def.currentVersion)) {
    throw new Error(
      `[contract-registry] "${def.contractName}": currentVersion "${def.currentVersion}" must be in writableVersions`
    );
  }
  if (!readable.includes(def.currentVersion)) {
    throw new Error(
      `[contract-registry] "${def.contractName}": currentVersion "${def.currentVersion}" must be in readableVersions`
    );
  }
  for (const w of writable) {
    if (!readable.includes(w)) {
      throw new Error(
        `[contract-registry] "${def.contractName}": writableVersions must be a subset of readableVersions (offender: "${w}")`
      );
    }
  }
  if (def.schemaByVersion) {
    for (const key of Object.keys(def.schemaByVersion)) {
      if (!readable.includes(key)) {
        throw new Error(
          `[contract-registry] "${def.contractName}": schemaByVersion key "${key}" is not in readableVersions`
        );
      }
    }
  }
}

function internalRegister(definition: ContractDefinition): void {
  validateContractDefinitionInvariants(definition);
  if (registry.has(definition.contractName)) {
    throw new Error(`[contract-registry] Contract already registered: ${definition.contractName}`);
  }
  registry.set(definition.contractName, definition);
}

/** Built-in contracts (single bootstrap path). Order does not matter. */
function builtinDefinitions(): ContractDefinition[] {
  return [
    {
      contractName: "sceneGenerationOutput",
      currentVersion: "1",
      readableVersions: ["1"],
      writableVersions: ["1"],
      owner: "lib/domain/scene-generation-output.ts",
      readers: [
        "lib/scene-generation/scene-generation-llm-adapter.ts",
        "lib/services/scene-generation-service.ts",
      ],
      notes: "AI scene generation JSON object; advisory-only prose.",
      schemaByVersion: { "1": sceneGenerationOutputSchema },
    },
    {
      contractName: "sceneGenerationInput",
      currentVersion: "1",
      readableVersions: ["1"],
      writableVersions: ["1"],
      owner: "lib/domain/scene-generation-contract.ts",
      readers: [
        "lib/services/scene-generation-input-loader.ts",
        "lib/services/scene-generation-contract-loader.ts",
        "lib/scene-generation/scene-generation-llm-adapter.ts",
      ],
      notes: "Embedded as `SceneGenerationInput.contract` (`SceneGenerationContractV1`).",
      schemaByVersion: { "1": sceneGenerationContractSchema },
    },
    {
      contractName: "cognitionFrame",
      currentVersion: "cognition-frame-v6",
      readableVersions: ["cognition-frame-v6"],
      writableVersions: ["cognition-frame-v6"],
      owner: "lib/services/character-cognition-resolver.ts",
      readers: ["lib/inner-voice/build-character-inner-voice-request.ts", "lib/domain/scene-generation-input.ts"],
      notes: "POV cognition frame for prompts and inner voice.",
      schemaByVersion: { "cognition-frame-v6": cognitionFrameSchema },
    },
    {
      contractName: "innerVoice",
      currentVersion: "3",
      readableVersions: ["1", "2", "3"],
      writableVersions: ["3"],
      owner: "lib/cognition/inner-voice-contract.ts",
      readers: ["lib/inner-voice/inner-voice-llm-adapter.ts", "lib/thought-language/apply-inner-voice-request.ts"],
      notes: "New writes use Phase 5B v3 only; v1/v2 remain readable for legacy sessions.",
      schemaByVersion: {
        "1": innerVoiceRequestSchema,
        "2": characterInnerVoiceRequestSchemaV2,
        "3": characterInnerVoiceRequestSchemaV3,
      },
    },
    {
      contractName: "decisionTrace",
      currentVersion: "2",
      readableVersions: ["1", "2"],
      writableVersions: ["2"],
      owner: "lib/domain/decision-trace.ts",
      readers: ["lib/decision-trace/build-decision-trace-request.ts", "lib/services/decision-trace-service.ts"],
      notes: "Canonical request is v2; v1 zod schema for legacy reads.",
      schemaByVersion: {
        "1": decisionTraceRequestSchema,
        "2": decisionTraceRequestV2Schema,
      },
    },
    {
      contractName: "socialFieldContext",
      currentVersion: "2",
      readableVersions: ["2"],
      writableVersions: ["2"],
      owner: "lib/domain/population-social-field.ts",
      readers: ["lib/services/social-field-context-service.ts", "lib/social-field/social-field-engine.ts"],
      schemaByVersion: { "2": socialFieldContextSchema },
    },
    {
      contractName: "narrativeShapingDefaults",
      currentVersion: NARRATIVE_SHAPING_CONTRACT_VERSION,
      readableVersions: [NARRATIVE_SHAPING_CONTRACT_VERSION],
      writableVersions: [NARRATIVE_SHAPING_CONTRACT_VERSION],
      owner: "lib/domain/narrative-shaping-defaults.ts",
      readers: ["lib/services/narrative-shaping-defaults-service.ts"],
      notes: "Stored under metadata key `narrativeShapingDefaultsV1`.",
      schemaByVersion: { [NARRATIVE_SHAPING_CONTRACT_VERSION]: narrativeShapingDefaultsV1Schema },
    },
    {
      contractName: "worldObserverSnapshot",
      currentVersion: WORLD_OBSERVER_CONTRACT_VERSION,
      readableVersions: ["3", WORLD_OBSERVER_CONTRACT_VERSION],
      writableVersions: [WORLD_OBSERVER_CONTRACT_VERSION],
      owner: "lib/domain/world-observability.ts",
      readers: ["lib/services/world-observer-service.ts"],
      notes: "World / character / simulation snapshots; new writes emit current WORLD_OBSERVER_CONTRACT_VERSION only.",
      schemaByVersion: {
        "3": worldObserverSnapshotSchemaV3,
        [WORLD_OBSERVER_CONTRACT_VERSION]: worldObserverSnapshotSchemaV4,
      },
    },
    {
      contractName: "chapterObserverSnapshot",
      currentVersion: CHAPTER_OBSERVER_CONTRACT_VERSION,
      readableVersions: ["1", CHAPTER_OBSERVER_CONTRACT_VERSION],
      writableVersions: [CHAPTER_OBSERVER_CONTRACT_VERSION],
      owner: "lib/domain/world-observability.ts",
      readers: ["lib/services/world-observer-service.ts"],
      schemaByVersion: {
        "1": chapterObserverSnapshotSchemaV1,
        [CHAPTER_OBSERVER_CONTRACT_VERSION]: chapterObserverSnapshotSchemaV2,
      },
    },
    {
      contractName: "bookObserverSnapshot",
      currentVersion: BOOK_OBSERVER_CONTRACT_VERSION,
      readableVersions: ["1", BOOK_OBSERVER_CONTRACT_VERSION],
      writableVersions: [BOOK_OBSERVER_CONTRACT_VERSION],
      owner: "lib/domain/world-observability.ts",
      readers: ["lib/services/world-observer-service.ts"],
      schemaByVersion: {
        "1": bookObserverSnapshotSchemaV1,
        [BOOK_OBSERVER_CONTRACT_VERSION]: bookObserverSnapshotSchemaV2,
      },
    },
    {
      contractName: "chapterCoherenceReport",
      currentVersion: CHAPTER_COHERENCE_REPORT_VERSION,
      readableVersions: [CHAPTER_COHERENCE_REPORT_VERSION],
      writableVersions: [CHAPTER_COHERENCE_REPORT_VERSION],
      owner: "lib/domain/chapter-coherence.ts",
      readers: ["lib/chapter-coherence/chapter-coherence-deterministic.ts", "lib/services/chapter-coherence-refinement-service.ts"],
      schemaByVersion: { [CHAPTER_COHERENCE_REPORT_VERSION]: chapterCoherenceReportSchema },
    },
    {
      contractName: "bookCoherenceReport",
      currentVersion: BOOK_COHERENCE_REPORT_VERSION,
      readableVersions: [BOOK_COHERENCE_REPORT_VERSION],
      writableVersions: [BOOK_COHERENCE_REPORT_VERSION],
      owner: "lib/domain/book-coherence.ts",
      readers: ["lib/book-coherence/book-coherence-deterministic.ts", "lib/services/book-coherence-refinement-service.ts"],
      schemaByVersion: { [BOOK_COHERENCE_REPORT_VERSION]: bookCoherenceReportSchema },
    },
    {
      contractName: "characterResponse",
      currentVersion: CHARACTER_RESPONSE_CONTRACT_VERSION,
      readableVersions: [CHARACTER_RESPONSE_CONTRACT_VERSION],
      writableVersions: [CHARACTER_RESPONSE_CONTRACT_VERSION],
      owner: "lib/domain/character-response-contract.ts",
      readers: [],
      notes: "P2-I interactive turn: spoken line, inner thought, knowledgeSource, emotionalTone.",
      schemaByVersion: { [CHARACTER_RESPONSE_CONTRACT_VERSION]: characterResponseContractSchemaV1 },
    },
  ];
}

function bootstrapRegistry(): void {
  for (const def of builtinDefinitions()) {
    internalRegister(def);
  }
}

/**
 * Registers a contract. Throws after {@link finalizeContractRegistry} has run.
 */
export function registerContract(definition: ContractDefinition): void {
  if (finalized) {
    throw new Error(`[contract-registry] Registry finalized; cannot register "${definition.contractName}"`);
  }
  internalRegister(definition);
}

/**
 * Freezes the registry (idempotent). After this, {@link registerContract} throws.
 */
export function finalizeContractRegistry(): void {
  finalized = true;
}

export function isContractRegistryFinalized(): boolean {
  return finalized;
}

bootstrapRegistry();
finalizeContractRegistry();

export function getContractDefinition(name: string): ContractDefinition | undefined {
  return registry.get(name);
}

export function getCurrentContractVersion(contractName: string): string {
  const def = registry.get(contractName);
  if (!def) {
    throw new Error(`[contract-registry] Unknown contract: ${contractName}`);
  }
  return def.currentVersion;
}

export function assertReadableContractVersion(contractName: string, version: string): void {
  const def = registry.get(contractName);
  if (!def) {
    throw new Error(`[contract-registry] Unknown contract: ${contractName}`);
  }
  if (!def.readableVersions.includes(version)) {
    throw new Error(
      `[contract-registry] Version "${version}" is not readable for "${contractName}". Readable: ${def.readableVersions.join(", ")}`
    );
  }
}

export function assertWritableContractVersion(contractName: string, version: string): void {
  const def = registry.get(contractName);
  if (!def) {
    throw new Error(`[contract-registry] Unknown contract: ${contractName}`);
  }
  if (!def.writableVersions.includes(version)) {
    throw new Error(
      `[contract-registry] Version "${version}" is not writable for "${contractName}". Writable: ${def.writableVersions.join(", ")}`
    );
  }
}

/** @deprecated Use {@link assertReadableContractVersion} */
export function assertValidContractVersion(contractName: string, version: string): void {
  assertReadableContractVersion(contractName, version);
}

/** @deprecated Use {@link assertReadableContractVersion} */
export function assertContractVersionOrThrow(contractName: string, version: string): void {
  assertReadableContractVersion(contractName, version);
}

function logContractValidated(name: string, version: string, mode: ContractValidationMode): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[contract-registry] validated ${name}@${version} (${mode})`);
  }
}

function getSchemaForVersion(def: ContractDefinition, version: string): z.ZodType<unknown> | undefined {
  return def.schemaByVersion?.[version];
}

/**
 * Validates envelope version (read or write) and runs `schemaByVersion[version]` when present.
 */
export function validateRegisteredContractPayload<T extends { contractVersion?: string }>(
  contractName: string,
  payload: T,
  mode: ContractValidationMode = "read"
): T {
  const v = payload.contractVersion;
  if (v === undefined || v === "") {
    throw new Error(`[contract-registry] Missing contractVersion on payload for "${contractName}"`);
  }
  if (mode === "write") {
    assertWritableContractVersion(contractName, v);
  } else {
    assertReadableContractVersion(contractName, v);
  }
  const def = registry.get(contractName);
  const schema = def ? getSchemaForVersion(def, v) : undefined;
  if (schema) {
    schema.parse(payload);
  }
  logContractValidated(contractName, v, mode);
  return payload;
}

export function listContracts(): ContractDefinition[] {
  return [...registry.values()].sort((a, b) => a.contractName.localeCompare(b.contractName));
}

/** Authoritative read-only view (mutations blocked by finalize + no public setter). */
export const contractRegistry: ReadonlyMap<string, ContractDefinition> = registry;

/** Union of all readable version tokens (for drift / tooling). */
export function getAllReadableVersionTokens(): Set<string> {
  const s = new Set<string>();
  for (const def of registry.values()) {
    for (const v of def.readableVersions) {
      s.add(v);
    }
  }
  return s;
}

/**
 * Test helper: register definitions into a fresh map (same rules as production registry).
 */
export function applyContractDefinitionsToMap(definitions: ContractDefinition[]): Map<string, ContractDefinition> {
  const m = new Map<string, ContractDefinition>();
  for (const def of definitions) {
    validateContractDefinitionInvariants(def);
    if (m.has(def.contractName)) {
      throw new Error(`[contract-registry] Contract already registered: ${def.contractName}`);
    }
    m.set(def.contractName, def);
  }
  return m;
}
