import type { SceneConstraintSummary } from "@/lib/brain-assembly-types";
import { parseSceneConstraintSummaryJson } from "@/lib/character-brain-bundle";
import type { Prisma } from "@prisma/client";

/** Author-declared scene class for readiness policy (also inferable). */
export const SCENE_READINESS_CLASSES = [
  "general",
  "public_confrontation",
  "intimate_disclosure",
  "travel_movement",
  "historical_anchor",
  "ensemble_no_focal",
] as const;

export type SceneReadinessClass = (typeof SCENE_READINESS_CLASSES)[number];

function isSceneReadinessClass(s: string): s is SceneReadinessClass {
  return (SCENE_READINESS_CLASSES as readonly string[]).includes(s);
}

/**
 * Hybrid patch surface on `Scene.structuredDataJson` — overlaps Stage 7.5 constraint fields
 * plus Stage 8 legality overrides (one truth surface).
 */
export type Stage8StructuredDataPatch = Partial<SceneConstraintSummary> & {
  visibilityLegibility?: string;
  /** When true, readiness treats missing sources as blocking when policy applies. */
  historicalSupportRequired?: boolean;
  /** Replaces derived focal perception hints when set (use newlines for multiple lines). */
  focalPerceptionOverride?: string;
  /** Replaces derived dominant interpretation line when set. */
  dominantInterpretationOverride?: string;
  /**
   * Author override for `inferSceneReadinessClass` heuristics.
   * When set, it **fully replaces** the inferred class for readiness policy (not a soft nudge).
   */
  sceneClass?: SceneReadinessClass;
};

export function parseStage8StructuredDataPatch(json: Prisma.JsonValue | null | undefined): Stage8StructuredDataPatch {
  const base = parseSceneConstraintSummaryJson(json);
  if (json === null || json === undefined || typeof json !== "object" || Array.isArray(json)) {
    return { ...base };
  }
  const o = json as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim() : undefined);
  const bool = (k: string) => (typeof o[k] === "boolean" ? o[k] : undefined);

  const out: Stage8StructuredDataPatch = { ...base };
  const vl = str("visibilityLegibility");
  if (vl) out.visibilityLegibility = vl;
  const hsr = bool("historicalSupportRequired");
  if (hsr !== undefined) out.historicalSupportRequired = hsr;
  const fpo = str("focalPerceptionOverride");
  if (fpo) out.focalPerceptionOverride = fpo;
  const dio = str("dominantInterpretationOverride");
  if (dio) out.dominantInterpretationOverride = dio;
  const sc = str("sceneClass");
  if (sc && isSceneReadinessClass(sc)) out.sceneClass = sc;

  return out;
}

export type SceneReadinessClassInferenceInput = {
  patch: Stage8StructuredDataPatch;
  visibility: string;
  personCount: number;
  placeCount: number;
  narrativeIntent: string | null;
  description: string;
  historicalConfidence: number | null;
  sourcesCount: number;
};

/** When multiple keyword buckets match, prefer this order (first wins at equal score). */
const READINESS_CLASS_TIE_BREAK: readonly SceneReadinessClass[] = [
  "historical_anchor",
  "public_confrontation",
  "intimate_disclosure",
  "travel_movement",
  "ensemble_no_focal",
  "general",
];

function tieBreakIndex(cls: SceneReadinessClass): number {
  const i = READINESS_CLASS_TIE_BREAK.indexOf(cls);
  return i === -1 ? READINESS_CLASS_TIE_BREAK.length : i;
}

/**
 * Keyword-only inference (ignores `patch.sceneClass`). Used for author-vs-inference provenance
 * and for tests.
 */
export function inferSceneReadinessClassFromSignals(input: SceneReadinessClassInferenceInput): SceneReadinessClass {
  const text = `${input.narrativeIntent ?? ""} ${input.description}`.toLowerCase();

  type Cand = { cls: SceneReadinessClass; score: number };
  const cands: Cand[] = [];

  if (input.personCount >= 3 && /\b(ensemble|everyone|group|gathered|crowd)\b/i.test(text)) {
    cands.push({ cls: "ensemble_no_focal", score: 80 });
  }

  if (
    input.historicalConfidence != null &&
    input.historicalConfidence >= 4 &&
    input.sourcesCount >= 1 &&
    /\b(witness|record|document|trial|deposition|archive|true event)\b/i.test(text)
  ) {
    cands.push({ cls: "historical_anchor", score: 92 });
  }

  if (
    input.visibility === "PRIVATE" &&
    input.personCount <= 2 &&
    /\b(secret|whisper|confess|intimate|alone together|bedroom|touch)\b/i.test(text)
  ) {
    cands.push({ cls: "intimate_disclosure", score: 78 });
  }

  if (
    input.visibility === "PUBLIC" &&
    /\b(confront|argument|shame|trial|church|crowd|market|square|debate)\b/i.test(text)
  ) {
    cands.push({ cls: "public_confrontation", score: 72 });
  }

  if (input.placeCount >= 1 && /\b(road|travel|journey|ride|walk|flee|march|wagon|river|crossing|mile|route|depart|arrive)\b/i.test(text)) {
    let score = 64;
    if (
      input.visibility === "PRIVATE" &&
      input.personCount <= 2 &&
      /\b(secret|intimate|whisper|confess|alone together)\b/i.test(text)
    ) {
      score -= 28;
    }
    if (score >= 40) {
      cands.push({ cls: "travel_movement", score });
    }
  }

  if (cands.length === 0) {
    return "general";
  }

  cands.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return tieBreakIndex(a.cls) - tieBreakIndex(b.cls);
  });

  return cands[0]!.cls;
}

export type SceneReadinessClassResolution = {
  sceneClass: SceneReadinessClass;
  source: "author" | "inferred";
  /** What keyword inference chose without reading `patch.sceneClass`. */
  inferredWithoutAuthorClass: SceneReadinessClass;
  /** True when author set `sceneClass` and it differs from inference-without-author. */
  authorClassOverridesInference: boolean;
};

export function inferSceneReadinessClass(input: SceneReadinessClassInferenceInput): SceneReadinessClassResolution {
  const patchSansAuthorClass: Stage8StructuredDataPatch = { ...input.patch };
  delete patchSansAuthorClass.sceneClass;

  const inferredWithoutAuthorClass = inferSceneReadinessClassFromSignals({
    ...input,
    patch: patchSansAuthorClass,
  });

  if (input.patch.sceneClass) {
    return {
      sceneClass: input.patch.sceneClass,
      source: "author",
      inferredWithoutAuthorClass,
      authorClassOverridesInference: input.patch.sceneClass !== inferredWithoutAuthorClass,
    };
  }

  return {
    sceneClass: inferredWithoutAuthorClass,
    source: "inferred",
    inferredWithoutAuthorClass,
    authorClassOverridesInference: false,
  };
}

/** Apply Stage 8 author overrides on top of derived perception (after assembly). */
export function applyStage8PerceptionStructuredOverrides<P extends {
  visibilityLegibility: string;
  focalDominantInterpretation: string | null;
  focalBrainPerceptionHints: string[];
}>(perception: P, patch: Stage8StructuredDataPatch): P {
  const next = { ...perception } as P;
  if (patch.visibilityLegibility?.trim()) {
    next.visibilityLegibility = patch.visibilityLegibility.trim();
  }
  if (patch.dominantInterpretationOverride?.trim()) {
    next.focalDominantInterpretation = patch.dominantInterpretationOverride.trim();
  }
  if (patch.focalPerceptionOverride?.trim()) {
    next.focalBrainPerceptionHints = patch.focalPerceptionOverride
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return next;
}
