import type {
  CharacterVoiceProfile,
  NarrativeVoiceProfile,
} from "@prisma/client";

import type { AuthorSceneGoals, AnalyzeProseContext } from "@/lib/prose-quality";

import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";
import type { SceneGenerationPurpose } from "@/lib/domain/scene-generation-output";

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
};
