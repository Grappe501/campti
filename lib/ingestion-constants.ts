/** Bump when extraction instructions or packet shape change meaningfully. */
export const INSTRUCTIONS_VERSION = "campti-ingest-v1";

/** Bump when the OpenAI system/user extraction prompts change meaningfully. */
export const EXTRACTION_PROMPT_VERSION = "campti-extract-prompt-v1";

/** Default model when OPENAI_MODEL is unset (structured JSON extraction). */
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

/** Bump when the scene assist prompt shapes/guardrails change meaningfully. */
export const SCENE_ASSIST_PROMPT_VERSION = "campti-scene-assist-v1";

/**
 * Default model for scene assist when OPENAI_MODEL is unset.
 * Kept separate from ingestion to allow future tuning without changing extraction.
 */
export const DEFAULT_SCENE_ASSIST_MODEL = "gpt-4o-mini";

/** Safety cap for a single extraction request (no chunking in this phase). */
export const MAX_EXTRACTION_CHARS = 100_000;

/**
 * Chunking constants for long sources.
 * Conservative defaults: deterministic, paragraph-biased splits, sequential processing.
 */
export const TARGET_CHUNK_CHARS = 40_000;
export const MAX_CHUNK_CHARS = 55_000;
export const MAX_CHUNK_TOKEN_ESTIMATE = 14_000;

/** Combined trace string stored on IngestionRun.promptVersion for real runs. */
export function buildPromptVersionLabel(): string {
  return `${INSTRUCTIONS_VERSION}+${EXTRACTION_PROMPT_VERSION}`;
}

/**
 * Narrative DNA extraction path: reviewed archive, explicitly not standard-ingestion-ready.
 * Matches admin workflow: archiveStatus "reviewed" + ingestionReady false.
 */
export function isNarrativeDnaIngestionEligible(source: {
  archiveStatus: string | null | undefined;
  ingestionReady: boolean;
}): boolean {
  const a = source.archiveStatus?.trim().toLowerCase();
  return a === "reviewed" && source.ingestionReady === false;
}
