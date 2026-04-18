/**
 * Durable run ↔ output linkage and bounded output delta (no prose-quality oracle).
 */

export type SceneRunOutputLinkageStatus =
  | "linked_output"
  | "unlinked_output"
  | "legacy_output_unknown"
  | "output_not_persisted_by_policy"
  | "linked_output_missing_artifact";

/** Row persisted in `SceneRunGenerationOutput`. */
export type SceneRunOutputArtifactRef = {
  artifactId: string;
  ledgerRunKey: string;
  sceneId: string;
  outputCompleteness: SceneRunOutputPersistCompleteness;
  sceneGenerationTextSynced: boolean;
  characterCount: number;
  paragraphCount: number;
  openingFingerprint: string;
  endingFingerprint: string;
  cluster7RunId: string | null;
  createdAtIso: string;
};

export type SceneRunOutputPersistCompleteness =
  | "persisted_to_scene"
  | "snapshot_only"
  | "blocked_save_realism"
  | "blocked_save_human_gravity";

export type SceneRunOutputStructureSummary = {
  paragraphCount: number;
  characterCount: number;
  /** Heuristic: true when beat/scene-section markers detected in text. */
  hasBeatLikeMarkers: boolean;
};

export type SceneRunOutputEntityMentionDelta = {
  entityId: string;
  kind: "person" | "place" | "canon_label";
  label: string;
  countA: number;
  countB: number;
  delta: number;
  kind_note: "fact";
};

export type SceneRunOutputOpeningEndingSignal = {
  changed: boolean;
  summary: string;
  kind: "fact" | "unavailable";
};

export type SceneRunOutputSignal = {
  code: string;
  label: string;
  description: string;
  derivation: "fact" | "heuristic";
};

/** Result of bounded A-vs-B output comparison (linked artifacts). */
export type SceneRunBoundedOutputDiff = {
  bothLinked: boolean;
  linkageNote: string;
  existence: {
    aPresent: boolean;
    bPresent: boolean;
    summary: string;
  };
  length: {
    charDelta: number | null;
    paragraphDelta: number | null;
    charDeltaLabel: string | null;
    kind: "fact" | "unavailable";
  };
  opening: SceneRunOutputOpeningEndingSignal;
  ending: SceneRunOutputOpeningEndingSignal;
  structure: {
    paragraphCountChanged: boolean;
    beatMarkersChanged: boolean;
    summary: string;
    kind: "fact" | "unavailable";
  };
  entityMentions: SceneRunOutputEntityMentionDelta[];
  signals: SceneRunOutputSignal[];
};

export type SceneRunOutputChurnHint = {
  code: string;
  text: string;
  derivation: "fact" | "heuristic";
};
