import type {
  CharacterVoiceProfile,
  NarrativeVoiceProfile,
} from "@prisma/client";

import type { AuthorSceneGoals, AnalyzeProseContext } from "@/lib/prose-quality";

import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";
import type { SceneGenerationPurpose } from "@/lib/domain/scene-generation-output";
import type {
  AuthorVoiceShapingV1,
  NarrativeWitnessMode,
} from "@/lib/domain/author-voice-humanization";
import type {
  HierarchyShapingResolution,
  NarrativeShapingObserverSummary,
} from "@/lib/domain/narrative-shaping-defaults";
import type { SceneGenerationSocialQaScalars } from "@/lib/domain/scene-generation-social";
import type { NarrativeSource } from "@/lib/domain/narrative-source";

/** How the model should treat this request (prompt routing only). */
export type SceneGenerationMode = "draft" | "rewrite" | "repair" | "alternate";

/**
 * Canonical boundary for scene generators (OpenAI later): contract + voice + QA context.
 * `contract` stays JSON-serializable; profiles embed author intent for prompts.
 */
export type SceneGenerationInput = {
  contract: SceneGenerationContractV1;

  /** Phase 6 routing. */
  generationMode: SceneGenerationMode;
  generationPurpose: SceneGenerationPurpose;

  /**
   * Optional POV / focus cognition JSON (`cognition-frame-v6` payload slice) for grounding.
   * When present, generation must respect stacks / embodiment / desire summaries here.
   */
  cognitionFramePayload?: Record<string, unknown> | null;

  /**
   * Optional compact decision-trace summary for the focus character+scene (PINNED session or last run).
   */
  pinnedDecisionTracePayload?: Record<string, unknown> | null;

  /**
   * Phase 6.1 — Compact social-field lines (mirrors `contract.socialFieldGeneration`; for prompts/debug without parsing JSON).
   * No full `SocialFieldContext` here.
   */
  socialFieldSummaryForGeneration?: string | null;
  invisiblePressureSummary?: string | null;
  authorityAtmosphereSummary?: string | null;
  kinVisibilitySummary?: string | null;
  populationDensityHint?: string | null;

  /** Deterministic scalars for post-gen advisory only (not narrated to the model as numbers). */
  socialFieldQaScalars?: SceneGenerationSocialQaScalars | null;

  /**
   * When rewriting/repairing, which stored column to treat as baseline if `basisProseOverride` is absent.
   */
  proseBasis?: "generation_text" | "authoring_text";

  /** Explicit prose baseline for repair/rewrite (e.g. clipboard); does not read DB when set. */
  basisProseOverride?: string | null;

  /** Loaded narrative voice (narrator / book-level) when scoped in DB */
  narrativeVoiceProfile?: Pick<
    NarrativeVoiceProfile,
    | "id"
    | "name"
    | "sentenceRhythm"
    | "dictionStyle"
    | "sensoryBias"
    | "silenceStyle"
    | "memoryStyle"
    | "interiorityStyle"
    | "notes"
  > | null;

  /** POV / character voice when `personId` matches */
  characterVoiceProfile?: Pick<
    CharacterVoiceProfile,
    | "id"
    | "dictionLevel"
    | "rhythmStyle"
    | "metaphorStyle"
    | "dialectNotes"
    | "silencePatterns"
    | "emotionalExpressionStyle"
    | "notes"
  > | null;

  authorSceneGoals?: AuthorSceneGoals;

  /** Era/place anchor terms for historical-specificity heuristics */
  historicalAnchorTerms: string[];

  /** Same structure as `actionAnalyzeSceneProse` context for parity */
  proseQaContext: AnalyzeProseContext;

  /**
   * Phase 7 — Canonical bundle (mirrors `contract.authorVoiceShaping` when set).
   * Loader fills from voice rows + optional overrides.
   */
  authorVoiceShaping?: AuthorVoiceShapingV1 | null;

  /** Optional override for witness mode without rebuilding full shaping. */
  narrativeWitnessMode?: NarrativeWitnessMode;

  /** Flattened prompt lines (deterministic); also derivable from `authorVoiceShaping`. */
  humanizationHints?: string[];
  prosePresenceHints?: string[];
  witnessFrameLines?: string[];
  /** Deterministic axis summary for prompts. */
  voiceSummaryLines?: string[];

  /** Phase 7.1 — resolved hierarchy defaults + field source map (optional full trace). */
  narrativeShapingResolution?: HierarchyShapingResolution | null;
  /** Phase 7.1 — slim shaping summary for observers and tooling. */
  narrativeShapingSummary?: NarrativeShapingObserverSummary | null;

  /**
   * P2-E — Narrative sources allowed for this scene’s world state and optional story year.
   * Populated only via `getSourcesForWorldState` (temporal truth firewall); enforces temporal truth integrity.
   */
  narrativeSourcesForScene?: NarrativeSource[];

  /** Observability: ids of sources attached for this generation run (matches filtered temporal set). */
  sourceIdsUsed: string[];
};
