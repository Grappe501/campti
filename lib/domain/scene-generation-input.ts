import type {
  CharacterVoiceProfile as PrismaCharacterVoiceProfile,
  NarrativeVoiceProfile,
} from "@prisma/client";

import type { CharacterMindProfile } from "@/lib/domain/character-mind";
import type { CharacterVoiceProfile as SimulationCharacterVoiceProfile } from "@/lib/domain/character-voice";
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
import type { StorylineGuidanceBundle } from "@/lib/domain/storyline-guidance-bundle";

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
   * Phase 3 / Chunk 6 — compact storyline guidance for scene planning influence.
   * This remains advisory-only and must never force structurally invalid outcomes.
   */
  storylineGuidanceSummary?: {
    storylineBundle: StorylineGuidanceBundle;
    allowedSceneTendencies: string[];
    discouragedSceneTendencies: string[];
    topTensionWeights: Array<{
      pressureCategory: string;
      weight: number;
    }>;
    reconvergenceRecommendation: string;
  } | null;

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
    PrismaCharacterVoiceProfile,
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
   * P2-E (certified shape — do not redesign): narrative sources allowed for this scene’s world state
   * and optional story year. Populated only via `getSourcesForWorldState` (P2-B truth firewall).
   * Temporal validity uses canonical world-state chronology (`WorldStateReference.chronologyIndex`);
   * it is not derived from lexicographic `WorldStateReference.id` order.
   */
  narrativeSourcesForScene?: NarrativeSource[];

  /**
   * P2-E (certified shape — do not redesign): observability ids for sources attached this run
   * (matches the filtered temporal set). Participates in `canonical-scene-generation-hash` (sorted there).
   */
  sourceIdsUsed: string[];

  /**
   * Cluster 4 — post–Cluster-3 narrative governance bundle (ENCS/EEGS/narrator merge + sequence validation).
   * Populated on DB production scene generation when canonical governance prep runs.
   */
  canonicalPreGeneration?: import("@/lib/domain/canonical-scene-generation-governance").CanonicalPreGenerationBundle | null;

  /**
   * Cluster 5 — prose realism shaping (prompt lines + pre-gen profile). Wired on the canonical scene path.
   */
  proseRealismLayer?: import("@/lib/domain/prose-realism").ProseRealismLayerArtifact | null;

  /**
   * Cluster 6 — attachment, relational stakes, consequence persistence, generational burden runtime governors.
   * Derived after Cluster 3/4 governance merge; included in canonical hash and model prompt when present.
   */
  humanGravityRuntime?: import("@/lib/domain/human-gravity-runtime").HumanGravityRuntimeProfile | null;

  /**
   * Cluster 8 — character simulation runtime (mind/voice/relationship pressure + emergence digest).
   * Populated on canonical scene generation after Cluster 6 human gravity when governance merge is active.
   */
  characterSimulationRuntime?: import("@/lib/domain/character-simulation-runtime").CharacterSimulationRuntimeArtifact | null;

  /** Optional author deltas for inspection runs / advanced callers (never overrides contract facts). */
  characterSimulationAuthorNudge?: import("@/lib/domain/character-simulation-runtime").CharacterSimulationAuthorNudge | null;

  /**
   * Cluster 9 — author-owned Cluster-8 mind/voice JSON merged on top of deterministic seeds before C8 derivation.
   * Populated by canonical loaders from `CharacterSimulationAuthorBundle` when rows exist.
   */
  persistedCharacterSimulationProfiles?: Record<
    string,
    { mindPartial?: Partial<CharacterMindProfile>; voicePartial?: Partial<SimulationCharacterVoiceProfile> }
  > | null;

  /**
   * RICRE — author-accepted research canon lines for grounding (never replaces P2-E narrative sources or contract facts).
   */
  ricreAcceptedCanonKnowledge?: import("@/lib/domain/canon-reconciliation").RicreAcceptedCanonKnowledgeBundle | null;
};
