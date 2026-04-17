/**
 * Canonical scene generation input hashing (P1-C reproducibility).
 *
 * **Why this exists**
 * Authors and tooling need to answer: “What inputs produced this prose?” A partial hash
 * (mode + a few booleans) breaks trust when voice, social field, cognition, or hierarchy
 * shaping changes without changing the digest.
 *
 * **What must be included**
 * Everything that materially affects the **pre-truncation** user prompt assembled in
 * `scene-generation-llm-adapter` `buildUserPrompt`: full generation contract JSON, cognition
 * and decision-trace payloads, social bundle + guidance line sources, narrative shaping
 * **merged** defaults, flattened witness/voice/humanization lines, `authorVoiceShaping`,
 * P2-E temporally filtered narrative source ids (`sourceIdsUsed`, sorted in the hash payload; ids are
 * already filtered upstream by canonical world-state chronology via `getSourcesForWorldState`),
 * `proseQaContext`, routing (`generationMode` / `purpose`), prose basis selection, and a digest
 * of baseline prose when rewrite/repair uses it.
 *
 * **What must be excluded**
 * Observability-only payloads: full `narrativeShapingResolution` trace (`fieldSources`, `layers`,
 * `resolvedAtIso`), `narrativeShapingSummary`, and `socialFieldQaScalars` (post-gen advisory only;
 * not sent as model prompt content in the adapter). Truncation ellipses in the prompt are **not**
 * hashed — we hash full semantic inputs the loader produced, not the truncated prompt string.
 *
 * **Purpose**
 * Author-trust reproducibility and dependency invalidation — not HTTP cache keys alone.
 *
 * **Imperfections (TODO)**
 * - `proseQaContext` is hashed in full; if callers ever embed unstable identifiers, tighten the
 *   pick list. Currently `AnalyzeProseContext` is voice/goal/anchor only.
 * - `SceneGenerationContractV1` includes large JSON blobs (`valueJson`, beat plans); if DB order
 *   of arrays ever becomes non-deterministic, stabilize at the loader (not here).
 * - OpenAI `model` name and `temperature` (and other API knobs) are **not** in this hash — they
 *   change outputs without changing inputs. Extend the scheme if you need run-level reproducibility.
 */

import { createHash } from "node:crypto";

import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";

/** Scheme tag for migration when the canonical payload shape changes. */
export const SCENE_GENERATION_HASH_SCHEME_V1 = "scene-generation-hash-v1" as const;

/** Version of the `CanonicalSceneGenerationHashInputV1` structure (not `SceneGenerationContractV1`). */
export const CANONICAL_HASH_PAYLOAD_VERSION = "1" as const;

/**
 * Versioned, explicit snapshot of everything that feeds `generateSceneProseWithModel` inputs.
 * All nested values should be JSON-serializable after `stableDeepSort`.
 */
export type CanonicalSceneGenerationHashInputV1 = {
  sceneGenerationHashScheme: typeof SCENE_GENERATION_HASH_SCHEME_V1;
  hashPayloadContractVersion: typeof CANONICAL_HASH_PAYLOAD_VERSION;
  sceneId: string;
  sceneGenerationContractVersion: string;
  generationMode: SceneGenerationInput["generationMode"];
  generationPurpose: SceneGenerationInput["generationPurpose"];
  proseBasis: SceneGenerationInput["proseBasis"] | null;
  /** SHA-256 hex of UTF-8 baseline prose when non-draft paths supply basis (matches `basisProse` passed to the model). */
  basisProseSha256: string | null;
  /** Full wire contract embedded in CONTRACT_JSON (sorted keys at serialize time). */
  sceneGenerationContract: unknown;
  /** Full cognition frame JSON (sorted); null when absent. */
  cognitionFramePayload: unknown | null;
  cognitionFrameContractVersion: string | null;
  pinnedDecisionTracePayload: unknown | null;
  /**
   * Top-level fields that feed `compactSocialGuidanceLines` (not all live on `contract`).
   * `contract.socialFieldGeneration` is inside `sceneGenerationContract`.
   */
  socialGuidanceSources: {
    socialFieldSummaryForGeneration: string | null;
    invisiblePressureSummary: string | null;
    authorityAtmosphereSummary: string | null;
    kinVisibilitySummary: string | null;
    populationDensityHint: string | null;
  };
  /** Effective hierarchy defaults only (excludes fieldSources / layers / timestamps). */
  narrativeShapingMerged: unknown | null;
  /** Order is semantically meaningful — preserved (arrays are not sorted). */
  promptLineArrays: {
    witnessFrameLines: string[];
    voiceSummaryLines: string[];
    humanizationHints: string[];
    prosePresenceHints: string[];
  };
  authorVoiceShaping: unknown | null;
  narrativeWitnessMode: string | null;
  proseQaContext: unknown;
  narrativeVoiceProfileId: string | null;
  characterVoiceProfileId: string | null;
  /** P2-E — sorted unique ids of narrative sources allowed for this scene (temporal truth firewall). */
  narrativeSourceIdsForHash: string[];
  /** Cluster 4 — canonical governance bundle when prep ran (stable-sorted JSON). */
  canonicalPreGeneration: unknown | null;
};

export function sha256Utf8Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Deterministic JSON-like value: sorted object keys recursively; arrays keep order; undefined omitted;
 * `Date` → ISO string; `null` preserved.
 */
export function stableDeepSort(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((x) => stableDeepSort(x));
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined) continue;
    out[k] = stableDeepSort(v);
  }
  return out;
}

function extractCognitionFrameContractVersion(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const v = (payload as { contractVersion?: unknown }).contractVersion;
  return typeof v === "string" ? v : null;
}

/**
 * Build the v1 canonical hash payload from the **final** `SceneGenerationInput` passed to the model
 * and the **same** `basisProse` string passed to `generateSceneProseWithModel`.
 */
export function buildCanonicalSceneGenerationHashInputV1(
  input: SceneGenerationInput,
  basisProse: string | null
): CanonicalSceneGenerationHashInputV1 {
  const basis =
    basisProse && basisProse.length > 0 ? sha256Utf8Hex(basisProse) : null;

  const mergedDefaults = input.narrativeShapingResolution?.merged ?? null;

  const narrativeSourceIdsForHash = [...new Set(input.sourceIdsUsed ?? [])].sort((a, b) =>
    a.localeCompare(b)
  );

  return {
    sceneGenerationHashScheme: SCENE_GENERATION_HASH_SCHEME_V1,
    hashPayloadContractVersion: CANONICAL_HASH_PAYLOAD_VERSION,
    sceneId: input.contract.scene.id,
    sceneGenerationContractVersion: input.contract.contractVersion,
    generationMode: input.generationMode,
    generationPurpose: input.generationPurpose,
    proseBasis: input.proseBasis ?? null,
    basisProseSha256: basis,
    sceneGenerationContract: input.contract as unknown,
    cognitionFramePayload: input.cognitionFramePayload ?? null,
    cognitionFrameContractVersion: extractCognitionFrameContractVersion(input.cognitionFramePayload ?? null),
    pinnedDecisionTracePayload: input.pinnedDecisionTracePayload ?? null,
    socialGuidanceSources: {
      socialFieldSummaryForGeneration: input.socialFieldSummaryForGeneration ?? null,
      invisiblePressureSummary: input.invisiblePressureSummary ?? null,
      authorityAtmosphereSummary: input.authorityAtmosphereSummary ?? null,
      kinVisibilitySummary: input.kinVisibilitySummary ?? null,
      populationDensityHint: input.populationDensityHint ?? null,
    },
    narrativeShapingMerged: mergedDefaults,
    promptLineArrays: {
      witnessFrameLines: [...(input.witnessFrameLines ?? [])],
      voiceSummaryLines: [...(input.voiceSummaryLines ?? [])],
      humanizationHints: [...(input.humanizationHints ?? [])],
      prosePresenceHints: [...(input.prosePresenceHints ?? [])],
    },
    authorVoiceShaping: input.authorVoiceShaping ?? null,
    narrativeWitnessMode: input.narrativeWitnessMode ?? null,
    proseQaContext: input.proseQaContext as unknown,
    narrativeVoiceProfileId: input.narrativeVoiceProfile?.id ?? null,
    characterVoiceProfileId: input.characterVoiceProfile?.id ?? null,
    narrativeSourceIdsForHash,
    canonicalPreGeneration: input.canonicalPreGeneration ?? null,
  };
}

export function serializeCanonicalSceneGenerationHashInput(
  payload: CanonicalSceneGenerationHashInputV1
): string {
  return JSON.stringify(stableDeepSort(payload));
}

export function hashCanonicalSceneGenerationHashInput(payload: CanonicalSceneGenerationHashInputV1): string {
  return sha256Utf8Hex(serializeCanonicalSceneGenerationHashInput(payload));
}

/** Convenience: full pipeline for dependency edges and auditing. */
export function computeSceneGenerationInputHash(input: SceneGenerationInput, basisProse: string | null): string {
  return hashCanonicalSceneGenerationHashInput(buildCanonicalSceneGenerationHashInputV1(input, basisProse));
}
