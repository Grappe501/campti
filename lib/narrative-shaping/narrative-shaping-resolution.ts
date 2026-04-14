import type {
  AuthorVoiceProfile,
  DetailSelectionProfile,
  HumanizationProfile,
  NarrativeWitnessMode,
  ProsePresenceProfile,
} from "@/lib/domain/author-voice-humanization";
import type {
  HierarchyShapingResolution,
  NarrativeShapingDefaults,
  NarrativeShapingDefaultsV1,
  NarrativeShapingFieldSourceMap,
  NarrativeShapingOverrideSet,
  NarrativeShapingSource,
  ProductionModeDefault,
} from "@/lib/domain/narrative-shaping-defaults";
import {
  NARRATIVE_SHAPING_CONTRACT_VERSION,
  NARRATIVE_SHAPING_METADATA_KEY,
} from "@/lib/domain/narrative-shaping-defaults";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Read `narrativeShapingDefaultsV1` from a JSON root object (metadata or structuredData). */
export function extractNarrativeShapingDefaultsFromContainer(
  root: unknown
): NarrativeShapingDefaults | null {
  if (!isRecord(root)) return null;
  const block = root[NARRATIVE_SHAPING_METADATA_KEY];
  if (!isRecord(block)) return null;
  if (block.contractVersion !== NARRATIVE_SHAPING_CONTRACT_VERSION) return null;
  const defaults = block.defaults;
  if (!isRecord(defaults)) return null;
  return normalizeNarrativeShapingDefaults(defaults);
}

export function normalizeNarrativeShapingDefaults(raw: Record<string, unknown>): NarrativeShapingDefaults {
  const out: NarrativeShapingDefaults = {};

  if (typeof raw.shapingNotes === "string") out.shapingNotes = raw.shapingNotes;
  if (raw.shapingNotes === null) out.shapingNotes = null;

  const wm = raw.narrativeWitnessMode;
  if (
    typeof wm === "string" &&
    [
      "immersive_present",
      "reflective_memory",
      "oral_history",
      "observed_distance",
      "inherited_story",
    ].includes(wm)
  ) {
    out.narrativeWitnessMode = wm as NarrativeWitnessMode;
  }

  if (isRecord(raw.productionMode)) {
    const pm = raw.productionMode as Record<string, unknown>;
    const prod: ProductionModeDefault = {};
    if (pm.generationMode === "draft" || pm.generationMode === "rewrite" || pm.generationMode === "repair" || pm.generationMode === "alternate") {
      prod.generationMode = pm.generationMode;
    }
    const purposes = ["author_draft", "continuity_repair", "alternate_branch", "prose_rewrite"] as const;
    if (typeof pm.generationPurpose === "string" && purposes.includes(pm.generationPurpose as (typeof purposes)[number])) {
      prod.generationPurpose = pm.generationPurpose as (typeof purposes)[number];
    }
    if (prod.generationMode || prod.generationPurpose) out.productionMode = prod;
  }

  if (isRecord(raw.authorVoiceProfile)) {
    const av: Partial<AuthorVoiceProfile> = {};
    const keys: (keyof AuthorVoiceProfile)[] = [
      "narrativeDensity",
      "descriptiveDensity",
      "emotionalDirectness",
      "toleranceForAmbiguity",
      "sentenceRhythmBias",
      "metaphorPreference",
      "silenceBias",
      "expositionTolerance",
      "historicalDetailBias",
      "interiorityBias",
      "dialogueIndirectnessBias",
    ];
    for (const k of keys) {
      const v = raw.authorVoiceProfile[k];
      if (typeof v === "number" && !Number.isNaN(v)) av[k] = clamp01(v);
    }
    if (Object.keys(av).length) out.authorVoiceProfile = av;
  }

  if (isRecord(raw.detailSelectionProfile)) {
    const d: Partial<DetailSelectionProfile> = {};
    const a = raw.detailSelectionProfile;
    if (typeof a.concreteDetailWeight === "number") d.concreteDetailWeight = clamp01(a.concreteDetailWeight);
    if (typeof a.sensorySpread === "number") d.sensorySpread = clamp01(a.sensorySpread);
    if (typeof a.maxNamedEntitiesSoft === "number") d.maxNamedEntitiesSoft = Math.round(a.maxNamedEntitiesSoft);
    if (Object.keys(d).length) out.detailSelectionProfile = d;
  }

  if (isRecord(raw.humanizationProfile)) {
    const h: Partial<HumanizationProfile> = {};
    const a = raw.humanizationProfile;
    for (const k of [
      "allowFragmentAndInterruption",
      "preferEmbodiedEmotion",
      "restraintOnExplanation",
      "allowContradictoryPerception",
    ] as const) {
      if (typeof a[k] === "number") h[k] = clamp01(a[k]);
    }
    if (Object.keys(h).length) out.humanizationProfile = h;
  }

  if (isRecord(raw.prosePresenceProfile)) {
    const p: Partial<ProsePresenceProfile> = {};
    const a = raw.prosePresenceProfile;
    if (typeof a.intimacy === "number") p.intimacy = clamp01(a.intimacy);
    if (typeof a.heat === "number") p.heat = clamp01(a.heat);
    if (Object.keys(p).length) out.prosePresenceProfile = p;
  }

  return out;
}

export function wrapNarrativeShapingDefaultsV1(defaults: NarrativeShapingDefaults): NarrativeShapingDefaultsV1 {
  return {
    contractVersion: NARRATIVE_SHAPING_CONTRACT_VERSION,
    defaults,
  };
}

function mergeAuthorVoiceLayer(
  prev: Partial<AuthorVoiceProfile> | undefined,
  layer: Partial<AuthorVoiceProfile> | undefined,
  source: NarrativeShapingSource,
  sources: NarrativeShapingFieldSourceMap
): Partial<AuthorVoiceProfile> | undefined {
  if (!layer || Object.keys(layer).length === 0) return prev;
  const out: Partial<AuthorVoiceProfile> = { ...prev };
  for (const k of Object.keys(layer) as (keyof AuthorVoiceProfile)[]) {
    const v = layer[k];
    if (v !== undefined) {
      out[k] = v;
      sources[`authorVoiceProfile.${String(k)}`] = source;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function mergeRecordLayer<T extends Record<string, number | undefined>>(
  prev: Partial<T> | undefined,
  layer: Partial<T> | undefined,
  prefix: string,
  source: NarrativeShapingSource,
  sources: NarrativeShapingFieldSourceMap
): Partial<T> | undefined {
  if (!layer || Object.keys(layer).length === 0) return prev;
  const out = { ...(prev ?? {}) } as Partial<T>;
  for (const k of Object.keys(layer) as (keyof T)[]) {
    const v = layer[k];
    if (v !== undefined) {
      (out as Record<string, unknown>)[k as string] = v;
      sources[`${prefix}.${String(k)}`] = source;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Merge ordered layers (epic → book → chapter → scene → runtime). Later wins per field. */
export function mergeNarrativeShapingOverrides(
  layers: Array<{ source: NarrativeShapingSource; defaults: NarrativeShapingDefaults | null }>
): { merged: NarrativeShapingDefaults; fieldSources: NarrativeShapingFieldSourceMap } {
  const fieldSources: NarrativeShapingFieldSourceMap = {};
  const merged: NarrativeShapingDefaults = {};

  for (const { source, defaults } of layers) {
    if (!defaults) continue;

    if (defaults.shapingNotes !== undefined) {
      merged.shapingNotes = defaults.shapingNotes;
      fieldSources.shapingNotes = source;
    }
    if (defaults.narrativeWitnessMode !== undefined) {
      merged.narrativeWitnessMode = defaults.narrativeWitnessMode;
      fieldSources.narrativeWitnessMode = source;
    }
    if (defaults.productionMode && Object.keys(defaults.productionMode).length > 0) {
      merged.productionMode = { ...merged.productionMode, ...defaults.productionMode };
      if (defaults.productionMode.generationMode !== undefined) {
        fieldSources["productionMode.generationMode"] = source;
      }
      if (defaults.productionMode.generationPurpose !== undefined) {
        fieldSources["productionMode.generationPurpose"] = source;
      }
    }

    merged.authorVoiceProfile = mergeAuthorVoiceLayer(
      merged.authorVoiceProfile,
      defaults.authorVoiceProfile,
      source,
      fieldSources
    );

    merged.detailSelectionProfile = mergeRecordLayer(
      merged.detailSelectionProfile,
      defaults.detailSelectionProfile,
      "detailSelectionProfile",
      source,
      fieldSources
    ) as NarrativeShapingDefaults["detailSelectionProfile"];

    merged.humanizationProfile = mergeRecordLayer(
      merged.humanizationProfile,
      defaults.humanizationProfile,
      "humanizationProfile",
      source,
      fieldSources
    ) as NarrativeShapingDefaults["humanizationProfile"];

    merged.prosePresenceProfile = mergeRecordLayer(
      merged.prosePresenceProfile,
      defaults.prosePresenceProfile,
      "prosePresenceProfile",
      source,
      fieldSources
    ) as NarrativeShapingDefaults["prosePresenceProfile"];
  }

  return { merged, fieldSources };
}

export function buildHierarchyResolution(input: {
  sceneId: string;
  epicId: string;
  bookId: string;
  chapterId: string;
  epicDefaults: NarrativeShapingDefaults | null;
  bookDefaults: NarrativeShapingDefaults | null;
  chapterDefaults: NarrativeShapingDefaults | null;
  sceneDefaults: NarrativeShapingDefaults | null;
  runtimeOverride?: NarrativeShapingOverrideSet | null;
}): HierarchyShapingResolution {
  const layers: Array<{ source: NarrativeShapingSource; defaults: NarrativeShapingDefaults | null }> = [
    { source: "epic", defaults: input.epicDefaults },
    { source: "book", defaults: input.bookDefaults },
    { source: "chapter", defaults: input.chapterDefaults },
    { source: "scene", defaults: input.sceneDefaults },
  ];
  if (input.runtimeOverride?.defaults && Object.keys(input.runtimeOverride.defaults).length > 0) {
    layers.push({ source: "runtime", defaults: input.runtimeOverride.defaults });
  }
  const { merged, fieldSources } = mergeNarrativeShapingOverrides(layers);
  return {
    contractVersion: "1",
    sceneId: input.sceneId,
    epicId: input.epicId,
    bookId: input.bookId,
    chapterId: input.chapterId,
    merged,
    fieldSources,
    layers: {
      epic: input.epicDefaults,
      book: input.bookDefaults,
      chapter: input.chapterDefaults,
      scene: input.sceneDefaults,
    },
    resolvedAtIso: new Date().toISOString(),
  };
}
