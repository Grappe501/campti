import type { HumanizationAdvisoryReport } from "@/lib/domain/author-voice-humanization";
import type {
  SceneGenerationSocialBundleV1,
  SceneGenerationSocialQaScalars,
} from "@/lib/domain/scene-generation-social";

/**
 * Phase 6 — AI scene generation output (structured; never overwrites authoring/published reader text).
 */
export const SCENE_GENERATION_OUTPUT_VERSION = "1" as const;

export type SceneGenerationPurpose =
  | "author_draft"
  | "continuity_repair"
  | "alternate_branch"
  | "prose_rewrite";

export type SceneGenerationOutputV1 = {
  contractVersion: typeof SCENE_GENERATION_OUTPUT_VERSION;
  generatedText: string;
  /** Short author-facing notes (craft intent, omissions, risks). */
  generationNotes: string;
  warnings: string[];
  /** Non-blocking continuity hints (e.g. “kin term unresolved”). */
  continuityFlags: string[];
  /** True until explicitly promoted to authoring/published paths elsewhere. */
  advisoryOnly: true;
};

export type SceneGenerationRunResult = {
  output: SceneGenerationOutputV1;
  /** Present when `runProseQuality` was requested. */
  proseQuality?: import("@/lib/prose-quality/types").ProseQualityReportV1;
  /** Whether `Scene.generationText` was updated. */
  savedGenerationText: boolean;
  /** Ids of dependency edges created this pass (best-effort). */
  registeredDependencyIds: string[];
  /** Phase 6.1 — copy of the bundle fed to the model (null if social field could not resolve). */
  socialFieldGeneration?: SceneGenerationSocialBundleV1 | null;
  /** QA scalars from the live field (debug / advisory; not shown to readers). */
  socialFieldQaScalars?: SceneGenerationSocialQaScalars | null;
  /** Phase 7 — deterministic humanization advisory (optional). */
  humanizationAdvisory?: HumanizationAdvisoryReport | null;
};
