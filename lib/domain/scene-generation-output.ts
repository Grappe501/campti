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
  /** Cluster 4 — governance bundle applied before model call (when enabled). */
  canonicalPreGeneration?: import("@/lib/domain/canonical-scene-generation-governance").CanonicalPreGenerationBundle | null;
  /** Cluster 5 — prose realism validation bundle (post-gen profile + drift). */
  proseRealism?: import("@/lib/domain/prose-realism").ProseRealismValidationBundle | null;
  /**
   * Cluster 5 — quick access to realism truth (mirrors `proseRealism.realismTruth` when present).
   * Null when realism layer was off or validation skipped.
   */
  realismTruth?: import("@/lib/domain/prose-realism").RealismTruthResult | null;
  /** True when invalid realism output blocked DB save of generation text (see `allowSaveOnInvalidRealism`). */
  generationTextSaveBlockedByRealism?: boolean;
  /** Cluster 6 — human-gravity runtime profile applied to this run (when governance + layer enabled). */
  humanGravityRuntime?: import("@/lib/domain/human-gravity-runtime").HumanGravityRuntimeProfile | null;
  /** Cluster 6 — deterministic validation + no-reset truth. */
  humanGravityValidation?: import("@/lib/domain/human-gravity-runtime").HumanGravityValidationBundle | null;
  /**
   * Cluster 6 — quick access to no-reset truth (mirrors `humanGravityValidation.humanGravityTruth` when present).
   */
  humanGravityTruth?: import("@/lib/domain/human-gravity-runtime").HumanGravityTruthResult | null;
  /** True when no-reset invalidity blocked DB save (see `allowSaveOnInvalidHumanGravity`). */
  generationTextSaveBlockedByHumanGravity?: boolean;
  /**
   * Cluster 7 — semantic invariants, artifact truth stamp, persistence audit, readiness depth, drift detection.
   * Present when the canonical scene generation path assembles runtime truth (see `cluster7-runtime-truth-service`).
   */
  cluster7RuntimeTruth?: import("@/lib/domain/cluster7-runtime-truth").Cluster7RuntimeTruthEnvelope | null;
};
