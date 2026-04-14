/**
 * Global directives — cross-cutting rules for all future Campti systems.
 *
 * Canonical prose: `docs/build/master-build-spine.md` §2a. Call {@link reportGlobalDirectiveViolation}
 * when a code path detects a breach so operators see **critical** signals instead of silent drift.
 */

export const GLOBAL_DIRECTIVE_IDS = [
  "TEMPORAL_TRUTH_BOUNDARIES",
  "CHARACTER_KNOWLEDGE_LIMITS",
  "NO_OMNISCIENT_RESPONSES",
  "READER_MEMORY_BOUNDED_PER_CHARACTER",
  "TRANSLATION_PRESENTATION_ONLY",
  "DETERMINISTIC_INPUTS_BEFORE_GENERATION",
  "HUMAN_VS_GENERATED_TEXT_SEPARATION",
] as const;

export type GlobalDirectiveId = (typeof GLOBAL_DIRECTIVE_IDS)[number];

export type GlobalDirectiveViolation = {
  directiveId: GlobalDirectiveId;
  /** Human-readable explanation of what went wrong. */
  message: string;
  /** Optional structured context (no PII by default — callers must scrub). */
  context?: Record<string, unknown>;
};

const PREFIX = "[GLOBAL_DIRECTIVE]";

function defaultLogCritical(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) {
    console.error(PREFIX, message, meta);
  } else {
    console.error(PREFIX, message);
  }
}

/**
 * Record a global-directive breach. By default logs a **critical** `console.error`.
 * Set `fatal: true` to throw (hard fail) — use at API boundaries where violation must block commit.
 */
export function reportGlobalDirectiveViolation(
  violation: GlobalDirectiveViolation,
  options?: {
    fatal?: boolean;
    /** Override default `console.error` (e.g. ship to observability). */
    log?: (message: string, meta?: Record<string, unknown>) => void;
  }
): void {
  const log = options?.log ?? defaultLogCritical;
  const meta = {
    directiveId: violation.directiveId,
    ...violation.context,
  };
  log(`${violation.directiveId}: ${violation.message}`, meta);
  if (options?.fatal) {
    throw new Error(`${PREFIX} ${violation.directiveId}: ${violation.message}`);
  }
}
