import type { Book1ConfidenceType, Book1SceneComponentType, Book1SourceKind, PrismaClient } from "@prisma/client";

type TargetLayer = "primary_pov" | "environmental_layer" | "setting_layer" | "observer_layer";
type AutofillMode = "legacy-targets" | "missing-required" | "dynamic-validator";

type AutofillTarget = {
  sceneNumber: number;
  layer: TargetLayer;
};

type CandidateRow = {
  componentId: string;
  componentKey: string;
  componentType: string;
  textContent: string;
  summary: string | null;
  canonStatus: string;
  confidenceType: string;
  sourceKey: string | null;
  sourceKind: string;
  sourceTitle: string;
  sourceFileName: string | null;
  sourceChunkNumber: number | null;
  lexicalSimilarityToSceneCanon: number;
  score: number;
  scoreBreakdown: {
    confidence: number;
    canon: number;
    similarity: number;
    provenance: number;
  };
  reasonSummary: string;
  requiresRetype: boolean;
};

export type AutofillSuggestion = {
  sceneNumber: number;
  layer: TargetLayer;
  sceneKey: string;
  sceneTitle: string;
  suggestedPreferredComponentKey: string | null;
  backupCandidateComponentKeys: string[];
  candidates: CandidateRow[];
};

export type Book1ManualReviewAutofill = {
  generatedAt: string;
  mode: AutofillMode;
  outputPathHint: string;
  instructions: string;
  targets: AutofillTarget[];
  suggestions: AutofillSuggestion[];
  resolutions: Array<{
    action: "set_preferred" | "set_preferred_with_retype";
    sceneNumber: number;
    layer: TargetLayer;
    preferredComponentKey: string;
    demoteOthersTo: "CANDIDATE";
    note: string;
  }>;
};

const LEGACY_TARGETS: AutofillTarget[] = [
  { sceneNumber: 4, layer: "observer_layer" },
  { sceneNumber: 11, layer: "environmental_layer" },
];
const REQUIRED_LAYERS: TargetLayer[] = ["primary_pov", "environmental_layer", "setting_layer", "observer_layer"];

function toComponentType(layer: TargetLayer): Book1SceneComponentType {
  if (layer === "primary_pov") return "PRIMARY_POV";
  if (layer === "environmental_layer") return "ENVIRONMENTAL_LAYER";
  if (layer === "setting_layer") return "SETTING_LAYER";
  return "OBSERVER_LAYER";
}

function requiredLayerFromComponentType(type: Book1SceneComponentType): TargetLayer | null {
  if (type === "PRIMARY_POV") return "primary_pov";
  if (type === "ENVIRONMENTAL_LAYER") return "environmental_layer";
  if (type === "SETTING_LAYER") return "setting_layer";
  if (type === "OBSERVER_LAYER") return "observer_layer";
  return null;
}

function confidenceScore(confidenceType: Book1ConfidenceType): number {
  if (confidenceType === "HISTORICAL") return 1;
  if (confidenceType === "INFERRED_HISTORICAL") return 0.85;
  if (confidenceType === "NARRATIVE_DESIGN") return 0.75;
  if (confidenceType === "INTERPRETIVE") return 0.62;
  return 0.4;
}

function canonScore(canonStatus: string): number {
  const normalized = canonStatus.toUpperCase();
  if (normalized === "CANON") return 1;
  if (normalized === "CANDIDATE") return 0.8;
  if (normalized === "OPTIONAL") return 0.55;
  if (normalized === "DEPRECATED") return 0.1;
  return 0.45;
}

function provenanceScore(sourceKind: Book1SourceKind | string, sourceChunkNumber: number | null): number {
  let score = 0.5;
  if (sourceKind === "UPLOADED_CHUNK") score += 0.35;
  else if (sourceKind === "SCENE_DRAFT") score += 0.3;
  else if (sourceKind === "SYNTHESIS_NOTE") score += 0.2;
  else if (sourceKind === "RESEARCH_NOTE") score += 0.18;
  if (sourceChunkNumber !== null) score += 0.05;
  return Math.min(1, score);
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  );
}

function similarity(a: string, b: string): number {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }
  const unionSize = new Set([...aTokens, ...bTokens]).size;
  return unionSize === 0 ? 0 : overlap / unionSize;
}

function excerpt(text: string, maxLength = 150): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1)}…`;
}

function reasonSummary(input: {
  confidenceType: string;
  canonStatus: string;
  lexicalSimilarityToSceneCanon: number;
  sourceKind: string;
  sourceChunkNumber: number | null;
}): string {
  const bits = [
    `confidence=${input.confidenceType.toLowerCase()}`,
    `status=${input.canonStatus.toLowerCase()}`,
    `similarity=${input.lexicalSimilarityToSceneCanon.toFixed(3)}`,
    `sourceKind=${input.sourceKind.toLowerCase()}`,
  ];
  if (input.sourceChunkNumber !== null) bits.push(`chunk=${input.sourceChunkNumber}`);
  return bits.join("; ");
}

function pickBackups(orderedKeys: string[]): string[] {
  if (orderedKeys.length <= 1) return [];
  const backupPool = orderedKeys.slice(1, 6);
  if (backupPool.length >= 2) return backupPool;
  return backupPool;
}

function layerAffinityScore(targetLayer: TargetLayer, candidateType: Book1SceneComponentType): number {
  if (targetLayer === "primary_pov") {
    if (candidateType === "PRIMARY_POV") return 1;
    if (candidateType === "OBSERVER_LAYER") return 0.78;
    if (candidateType === "SETTING_LAYER") return 0.6;
    if (candidateType === "ENVIRONMENTAL_LAYER") return 0.58;
    if (candidateType === "SYMBOLIC_LAYER") return 0.42;
    return 0.36;
  }
  if (targetLayer === "observer_layer") {
    if (candidateType === "OBSERVER_LAYER") return 1;
    if (candidateType === "PRIMARY_POV") return 0.82;
    if (candidateType === "INTERPRETIVE_LAYER") return 0.68;
    if (candidateType === "SETTING_LAYER") return 0.55;
    if (candidateType === "SYMBOLIC_LAYER") return 0.47;
    return 0.42;
  }
  if (targetLayer === "setting_layer") {
    if (candidateType === "SETTING_LAYER") return 1;
    if (candidateType === "ENVIRONMENTAL_LAYER") return 0.83;
    if (candidateType === "PRIMARY_POV") return 0.58;
    if (candidateType === "OBSERVER_LAYER") return 0.54;
    if (candidateType === "SYMBOLIC_LAYER") return 0.42;
    return 0.38;
  }
  if (candidateType === "ENVIRONMENTAL_LAYER") return 1;
  if (candidateType === "SETTING_LAYER") return 0.83;
  if (candidateType === "PRIMARY_POV") return 0.6;
  if (candidateType === "OBSERVER_LAYER") return 0.56;
  if (candidateType === "SYMBOLIC_LAYER") return 0.42;
  return 0.4;
}

function isRequiredLayer(type: Book1SceneComponentType): boolean {
  return (
    type === "PRIMARY_POV" ||
    type === "ENVIRONMENTAL_LAYER" ||
    type === "SETTING_LAYER" ||
    type === "OBSERVER_LAYER"
  );
}

export class Book1ManualReviewAutofillService {
  constructor(private readonly db: PrismaClient) {}

  private normalizeTargets(targets: AutofillTarget[]): AutofillTarget[] {
    const seen = new Set<string>();
    const normalized: AutofillTarget[] = [];
    for (const target of targets) {
      const key = `${target.sceneNumber}|${target.layer}`;
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push(target);
    }
    return normalized.sort((a, b) => a.sceneNumber - b.sceneNumber || a.layer.localeCompare(b.layer));
  }

  private async resolveTargets(mode: AutofillMode, overrideTargets?: AutofillTarget[]): Promise<AutofillTarget[]> {
    if (overrideTargets && overrideTargets.length > 0) return this.normalizeTargets(overrideTargets);
    if (mode === "legacy-targets") return LEGACY_TARGETS;

    const anchors = await this.db.book1SceneAnchor.findMany({
      where: { sceneNumber: { gte: 1, lte: 17 } },
      select: { id: true, sceneNumber: true },
      orderBy: [{ sceneNumber: "asc" }],
    });
    if (anchors.length === 0) return [];

    const components = await this.db.book1SceneComponent.findMany({
      where: { sceneAnchorId: { in: anchors.map((anchor) => anchor.id) }, canonStatus: "CANON" },
      select: { sceneAnchorId: true, componentType: true },
    });
    const layerByAnchorId = new Map<string, Set<TargetLayer>>();
    for (const row of components) {
      const layer = requiredLayerFromComponentType(row.componentType);
      if (!layer) continue;
      const set = layerByAnchorId.get(row.sceneAnchorId) ?? new Set<TargetLayer>();
      set.add(layer);
      layerByAnchorId.set(row.sceneAnchorId, set);
    }

    const missingTargets: AutofillTarget[] = [];
    for (const anchor of anchors) {
      const present = layerByAnchorId.get(anchor.id) ?? new Set<TargetLayer>();
      for (const layer of REQUIRED_LAYERS) {
        if (!present.has(layer)) missingTargets.push({ sceneNumber: anchor.sceneNumber, layer });
      }
    }
    return this.normalizeTargets(missingTargets);
  }

  async build(input?: { mode?: AutofillMode; targetsOverride?: AutofillTarget[] }): Promise<Book1ManualReviewAutofill> {
    const mode = input?.mode ?? "legacy-targets";
    const suggestions: AutofillSuggestion[] = [];
    const resolutions: Book1ManualReviewAutofill["resolutions"] = [];
    const targets = await this.resolveTargets(mode, input?.targetsOverride);

    for (const target of targets) {
      const anchor = await this.db.book1SceneAnchor.findUnique({
        where: { sceneNumber: target.sceneNumber },
        select: { id: true, sceneNumber: true, sceneKey: true, title: true },
      });
      if (!anchor) {
        suggestions.push({
          sceneNumber: target.sceneNumber,
          layer: target.layer,
          sceneKey: `scene_${target.sceneNumber}`,
          sceneTitle: "missing anchor",
          suggestedPreferredComponentKey: null,
          backupCandidateComponentKeys: [],
          candidates: [],
        });
        continue;
      }

      const componentType = toComponentType(target.layer);
      const sceneComponents = await this.db.book1SceneComponent.findMany({
        where: { sceneAnchorId: anchor.id },
        select: {
          id: true,
          componentKey: true,
          componentType: true,
          canonStatus: true,
          confidenceType: true,
          textContent: true,
          summary: true,
          source: {
            select: {
              sourceKey: true,
              sourceKind: true,
              title: true,
              fileName: true,
              chunkNumber: true,
            },
          },
        },
      });

      const canonReferenceText = sceneComponents
        .filter((row) => row.componentType !== componentType && row.canonStatus === "CANON")
        .map((row) => row.summary ?? row.textContent)
        .join("\n");

      const strictLayerPool = sceneComponents.filter((row) => row.componentType === componentType && row.componentKey);
      const fallbackPool = sceneComponents.filter(
        (row) =>
          !!row.componentKey &&
          row.componentType !== "SECONDARY_POV" &&
          row.canonStatus !== "DEPRECATED" &&
          row.componentType !== "INTERPRETIVE_LAYER" &&
          row.componentType !== componentType,
      );
      const seenKeys = new Set<string>();
      const candidatePool = [...strictLayerPool, ...fallbackPool].filter((row) => {
        const key = row.componentKey ?? row.id;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });
      const ranked = candidatePool
        .map((row) => {
          const lexical = similarity(row.summary ?? row.textContent, canonReferenceText);
          const affinity = layerAffinityScore(target.layer, row.componentType);
          const scoreBreakdown = {
            confidence: confidenceScore(row.confidenceType),
            canon: canonScore(row.canonStatus),
            similarity: lexical,
            provenance: provenanceScore(row.source.sourceKind, row.source.chunkNumber),
          };
          const score =
            scoreBreakdown.confidence * 0.32 +
            scoreBreakdown.canon * 0.24 +
            scoreBreakdown.similarity * 0.2 +
            scoreBreakdown.provenance * 0.1 +
            affinity * 0.14;
          const cannibalizationPenalty =
            row.canonStatus === "CANON" && row.componentType !== componentType && isRequiredLayer(row.componentType) ? 0.22 : 0;
          const candidate: CandidateRow = {
            componentId: row.id,
            componentKey: row.componentKey ?? row.id,
            componentType: row.componentType,
            textContent: excerpt(row.summary ?? row.textContent),
            summary: row.summary ? excerpt(row.summary) : null,
            canonStatus: row.canonStatus,
            confidenceType: row.confidenceType,
            sourceKey: row.source.sourceKey,
            sourceKind: row.source.sourceKind,
            sourceTitle: row.source.title,
            sourceFileName: row.source.fileName,
            sourceChunkNumber: row.source.chunkNumber,
            lexicalSimilarityToSceneCanon: lexical,
            score: Math.max(0, score - cannibalizationPenalty),
            scoreBreakdown,
            reasonSummary: reasonSummary({
              confidenceType: row.confidenceType,
              canonStatus: row.canonStatus,
              lexicalSimilarityToSceneCanon: lexical,
              sourceKind: row.source.sourceKind,
              sourceChunkNumber: row.source.chunkNumber,
            }),
            requiresRetype: row.componentType !== componentType,
          };
          return candidate;
        })
        .sort((a, b) => b.score - a.score);

      const suggestedPreferred = ranked[0]?.componentKey ?? null;
      const backups = pickBackups(ranked.map((row) => row.componentKey));
      suggestions.push({
        sceneNumber: anchor.sceneNumber,
        layer: target.layer,
        sceneKey: anchor.sceneKey,
        sceneTitle: anchor.title,
        suggestedPreferredComponentKey: suggestedPreferred,
        backupCandidateComponentKeys: backups,
        candidates: ranked.slice(0, 6),
      });

      if (suggestedPreferred) {
        const top = ranked[0];
        resolutions.push({
          action: top?.requiresRetype ? "set_preferred_with_retype" : "set_preferred",
          sceneNumber: target.sceneNumber,
          layer: target.layer,
          preferredComponentKey: suggestedPreferred,
          demoteOthersTo: "CANDIDATE",
          note: `Autofilled by ranking confidence/canon/similarity/provenance for scene ${target.sceneNumber} ${target.layer}${top?.requiresRetype ? "; selected cross-layer candidate to retype." : ""}.`,
        });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      mode,
      outputPathHint:
        mode === "dynamic-validator"
          ? "reports/book1-manual-review-resolutions.autofill.dynamic.json"
          : "reports/book1-manual-review-resolutions.autofill.json",
      instructions:
        "Review suggested preferred keys and backups before apply. Use book1:manual-review:resolve with this file to apply set_preferred actions.",
      targets,
      suggestions,
      resolutions,
    };
  }
}
