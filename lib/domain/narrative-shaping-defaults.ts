/**
 * Phase 7.1 — Metadata-driven narrative shaping defaults (hierarchy + inheritance).
 * Stored under `narrativeShapingDefaultsV1` inside Epic/Book metadataJson, Chapter generationMetadataJson,
 * Scene structuredDataJson (Scene has no metadataJson column).
 */

import type {
  AuthorVoiceProfile,
  DetailSelectionProfile,
  HumanizationProfile,
  NarrativeWitnessMode,
  ProsePresenceProfile,
} from "@/lib/domain/author-voice-humanization";
import type { SceneGenerationMode } from "@/lib/domain/scene-generation-input";
import type { SceneGenerationPurpose } from "@/lib/domain/scene-generation-output";

export const NARRATIVE_SHAPING_METADATA_KEY = "narrativeShapingDefaultsV1" as const;
export const NARRATIVE_SHAPING_CONTRACT_VERSION = "1" as const;

/** Optional production routing defaults (loader may still override via options). */
export type ProductionModeDefault = {
  generationMode?: SceneGenerationMode;
  generationPurpose?: SceneGenerationPurpose;
};

/**
 * Partial shaping payload — merged deepest-first; unspecified keys inherit from parent / DB voice heuristics.
 */
export type NarrativeShapingDefaults = {
  authorVoiceProfile?: Partial<AuthorVoiceProfile>;
  narrativeWitnessMode?: NarrativeWitnessMode;
  detailSelectionProfile?: Partial<DetailSelectionProfile>;
  humanizationProfile?: Partial<HumanizationProfile>;
  prosePresenceProfile?: Partial<ProsePresenceProfile>;
  productionMode?: ProductionModeDefault;
  /** Author-facing notes (prompt context only; not reader text). */
  shapingNotes?: string | null;
};

export type NarrativeShapingDefaultsV1 = {
  contractVersion: typeof NARRATIVE_SHAPING_CONTRACT_VERSION;
  defaults: NarrativeShapingDefaults;
};

export type NarrativeShapingSource =
  | "epic"
  | "book"
  | "chapter"
  | "scene"
  /** Derived from NarrativeVoiceProfile / CharacterVoiceProfile rows, not metadata. */
  | "voice_db"
  /** Explicit loader / orchestration options. */
  | "runtime";

/** Dot-path keys, e.g. `authorVoiceProfile.narrativeDensity`, `narrativeWitnessMode`. */
export type NarrativeShapingFieldSourceMap = Record<string, NarrativeShapingSource>;

export type NarrativeShapingOverrideSet = {
  /** Runtime partial; applied last in resolution. */
  defaults: NarrativeShapingDefaults;
  label?: string;
};

export type HierarchyShapingResolution = {
  contractVersion: "1";
  sceneId: string;
  epicId: string;
  bookId: string;
  chapterId: string;
  merged: NarrativeShapingDefaults;
  /** Where each merged field last won. */
  fieldSources: NarrativeShapingFieldSourceMap;
  layers: {
    epic: NarrativeShapingDefaults | null;
    book: NarrativeShapingDefaults | null;
    chapter: NarrativeShapingDefaults | null;
    scene: NarrativeShapingDefaults | null;
  };
  resolvedAtIso: string;
};

/** Slim observer payload (no full profile dump). */
export type NarrativeShapingObserverSummary = {
  narrativeWitnessMode: NarrativeWitnessMode | null;
  productionMode: ProductionModeDefault | null;
  shapingNotes: string | null;
  fieldSources: NarrativeShapingFieldSourceMap;
  layersPresent: {
    epic: boolean;
    book: boolean;
    chapter: boolean;
    scene: boolean;
  };
};
