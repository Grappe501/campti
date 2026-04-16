import { createHash } from "node:crypto";

import type { Book1SceneComponentType } from "@/lib/domain/book1-ingestion";
import { evaluateBoundary, type ConfidenceBand } from "@/lib/services/book1-boundary-enforcement-service";
import type {
  Book1BriefMatch,
  Book1EnrichmentHints,
  Book1MapperInput,
  Book1MapperOutput,
  Book1SourceProvenance,
} from "@/lib/services/book1-bulk-ingestion-types";
import type { Book1ProvisionalSegment } from "@/lib/services/book1-ingestion-scaffold";

const KNOWN_SCENE_ARCHITECTURE_MAX = 17;

function shortHash(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 10);
}

function compact(text: string, max = 160): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length <= max ? singleLine : `${singleLine.slice(0, max - 1)}...`;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function extractSceneCandidates(text: string): number[] {
  const matches = [...text.matchAll(/\bscene\s*(\d{1,2})\b/gi)];
  return matches.map((match) => Number(match[1])).filter((num) => Number.isFinite(num) && num > 0);
}

function extractEntityCandidates(segment: Book1ProvisionalSegment): string[] {
  const matches = segment.textContent.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g) ?? [];
  return [...new Set(matches)].slice(0, 4);
}

function inferRelationshipType(text: string):
  | "parent_of"
  | "child_of"
  | "part_of"
  | "allied_with"
  | "trades_with"
  | "moves_through"
  | "lives_in"
  | "symbolizes"
  | "governs"
  | "contradicts"
  | "contrasts_with"
  | "inherits_from"
  | "teaches"
  | "stabilizes"
  | "pressures"
  | "mediates_between" {
  const lowered = text.toLowerCase();
  if (/\bmother|father|parent\b/.test(lowered)) return "parent_of";
  if (/\binherit|descend/.test(lowered)) return "inherits_from";
  if (/\btrade|exchange/.test(lowered)) return "trades_with";
  if (/\ballied|alliance/.test(lowered)) return "allied_with";
  if (/\blives in|dwells|settled in/.test(lowered)) return "lives_in";
  if (/\bmoves|migration|journey/.test(lowered)) return "moves_through";
  if (/\bpressure|threat/.test(lowered)) return "pressures";
  return "part_of";
}

type LayerCandidate = { layer: Book1SceneComponentType; score: number };

function chooseLayers(
  segment: Book1ProvisionalSegment,
  boundaryBand: ConfidenceBand,
  inheritedHints: Book1SceneComponentType[],
): { layers: Book1SceneComponentType[]; downgraded: boolean; warnings: string[] } {
  const text = segment.textContent.toLowerCase();
  const candidates: LayerCandidate[] = [];
  const warnings: string[] = [];

  const push = (layer: Book1SceneComponentType, score: number) => {
    candidates.push({ layer, score });
  };
  if (/\b(i |she |he |they |we )\b|\b(feels|felt|hears|heard|inside|inner)\b/.test(text)) push("primary_pov", 0.84);
  if (/\b(another|companion|witness)\b.*\b(saw|watched|judged|interpreted)\b/.test(text)) push("secondary_pov", 0.7);
  if (/\b(system|current|flow|pressure|weather|climate|terrain behavior)\b/.test(text)) push("environmental_layer", 0.76);
  if (/\b(river|bank|forest|house|village|route|setting|ground|mist)\b/.test(text)) push("setting_layer", 0.75);
  if (/\b(learned|learning|awareness|noticed|realized|observer)\b/.test(text)) push("observer_layer", 0.73);
  if (/\b(suggests|means|implies|therefore|interpret)\b/.test(text)) push("interpretive_layer", 0.7);
  if (/\b(symbol|motif|ritual|echo|metaphor|totem)\b/.test(text)) push("symbolic_layer", 0.69);

  if (segment.category === "scene_fragment") push("primary_pov", 0.74);
  if (segment.category === "setting_passage") push("setting_layer", 0.76);
  if (segment.category === "observer_passage") push("observer_layer", 0.76);
  if (segment.category === "interpretive_passage") push("interpretive_layer", 0.78);
  if (segment.category === "symbolic_motif") push("symbolic_layer", 0.75);

  const collapsed = new Map<Book1SceneComponentType, number>();
  for (const candidate of candidates) {
    collapsed.set(candidate.layer, Math.max(collapsed.get(candidate.layer) ?? 0, candidate.score));
  }
  let ranked = [...collapsed.entries()]
    .map(([layer, score]) => ({ layer, score }))
    .sort((a, b) => b.score - a.score);

  if (segment.category === "interpretive_passage") {
    const before = ranked.length;
    ranked = ranked.filter((entry) => entry.layer !== "primary_pov");
    if (before !== ranked.length) {
      warnings.push(`primary_pov removed for interpretive segment ${segment.provisionalKey}`);
    }
  }

  if (ranked.length === 0 && inheritedHints.length > 0) {
    ranked = inheritedHints.map((layer) => ({ layer, score: 0.55 }));
  }

  if (ranked.length === 0) return { layers: [], downgraded: false, warnings };
  const highConfidence = boundaryBand === "high" && ranked[0].score >= 0.72;
  if (!highConfidence && ranked.length > 1) {
    warnings.push(`scene-layer assignment downgraded to single layer for ${segment.provisionalKey}`);
    return { layers: [ranked[0].layer], downgraded: true, warnings };
  }
  return { layers: ranked.map((entry) => entry.layer), downgraded: false, warnings };
}

function chooseSceneAnchors(
  chunkNumber: number,
  segment: Book1ProvisionalSegment,
  hints: Book1EnrichmentHints,
): { anchors: number[]; warnings: string[] } {
  const candidates = new Set<number>([...hints.sceneAnchorCandidates, ...extractSceneCandidates(segment.textContent)]);
  if (segment.category === "scene_fragment" || segment.category === "setting_passage" || segment.category === "observer_passage") {
    candidates.add(chunkNumber);
  }

  const normalized = [...candidates].filter((value) => value > 0).sort((a, b) => a - b);
  const warnings: string[] = [];
  if (normalized.length > 1) {
    warnings.push(`multiple scene anchors inferred for ${segment.provisionalKey}: ${normalized.join(", ")}`);
  }
  const outOfRange = normalized.filter((value) => value > KNOWN_SCENE_ARCHITECTURE_MAX);
  if (outOfRange.length > 0) {
    warnings.push(
      `scene anchor exceeds known 17-scene architecture for ${segment.provisionalKey}: ${outOfRange.join(", ")}`,
    );
  }
  const canonical = normalized.filter((value) => value <= KNOWN_SCENE_ARCHITECTURE_MAX);
  if (canonical.length === 0 && outOfRange.length > 0) {
    warnings.push(`all inferred scene anchors are out-of-scope for Book 1 canonical range.`);
  }
  return { anchors: canonical, warnings };
}

function buildProvenance(input: Book1MapperInput, segmentKey?: string): Book1SourceProvenance {
  return {
    rawChunkPath: input.rawChunk.relativePath,
    rawChunkFileName: input.rawChunk.fileName,
    matchedBriefPaths: input.matchedBriefs.map((brief) => brief.brief.relativePath),
    matchedBriefFileNames: input.matchedBriefs.map((brief) => brief.brief.fileName),
    segmentKey,
  };
}

function extractYear(text: string): number | null {
  const match = text.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (!match) return null;
  return Number(match[1]);
}

export function deriveEnrichmentHints(input: { chunkNumber: number; matchedBriefs: Book1BriefMatch[] }): Book1EnrichmentHints {
  const sceneCandidates = new Set<number>();
  const layerHints = new Set<Book1SceneComponentType>();
  const summaryHints: string[] = [];
  const titleHints: string[] = [];
  const warnings: string[] = [];

  for (const brief of input.matchedBriefs) {
    const fileNameLower = brief.brief.fileName.toLowerCase();
    const sceneMatch = fileNameLower.match(/scene[-_ ]?(\d{1,2})/);
    if (sceneMatch) sceneCandidates.add(Number(sceneMatch[1]));
    if (fileNameLower.includes("symbolic")) layerHints.add("symbolic_layer");
    if (fileNameLower.includes("interpretive")) layerHints.add("interpretive_layer");
    if (fileNameLower.includes("setting")) layerHints.add("setting_layer");
    if (fileNameLower.includes("observer")) layerHints.add("observer_layer");

    titleHints.push(brief.brief.fileName.replace(/\.[^.]+$/, ""));
    const firstLine = brief.brief.rawText.split(/\r?\n/g).find((line) => line.trim().length > 0) ?? "";
    if (firstLine.length > 0) summaryHints.push(compact(firstLine, 120));

    if (brief.confidence < 0.5) {
      warnings.push(`low-confidence brief match: ${brief.brief.fileName} (${brief.confidenceLabel})`);
    }
  }

  if (sceneCandidates.size === 0) sceneCandidates.add(input.chunkNumber);
  if (layerHints.size === 0) layerHints.add("environmental_layer");

  return {
    sceneAnchorCandidates: [...sceneCandidates].sort((a, b) => a - b),
    sceneLayerRoleHints: [...layerHints],
    canonStatusSuggestion: input.matchedBriefs.length > 0 ? "candidate" : "optional",
    confidenceHint: input.matchedBriefs.some((brief) => brief.confidence >= 0.8) ? "inferred_historical" : "unresolved",
    summaryHints: summaryHints.slice(0, 3),
    titleHints: titleHints.slice(0, 3),
    warnings,
  };
}

export class DeterministicBook1SegmentSchemaMapper {
  map(input: Book1MapperInput): Book1MapperOutput {
    const output: Book1MapperOutput = {
      knowledgeNodes: [],
      entities: [],
      relationships: [],
      timelineEvents: [],
      sceneComponents: [],
      retrievalProfiles: [],
      detectedSceneAnchors: [],
      ambiguousLayerAssignments: [],
      warnings: [...input.hints.warnings],
      manualReviewQueue: [],
      rejectedLineageCandidates: [],
      downgradedSceneLayerAssignments: [],
      boundaryEnforcementActions: [],
    };

    const seenEntityNames = new Set<string>();
    const discoveredSceneAnchors = new Set<number>();
    const fallbackTitle = input.hints.titleHints[0] ?? `Book1 chunk ${input.rawChunk.chunkNumber}`;

    for (const segment of input.segments) {
      const boundary = evaluateBoundary(segment.textContent);
      output.boundaryEnforcementActions.push(...boundary.actions.map((action) => `${segment.provisionalKey}: ${action}`));
      if (boundary.rejectedLineageCandidate) {
        output.rejectedLineageCandidates.push(segment.provisionalKey);
      }

      const provenance = buildProvenance(input, segment.provisionalKey);
      const { anchors, warnings } = chooseSceneAnchors(input.rawChunk.chunkNumber, segment, input.hints);
      warnings.forEach((warning) => {
        output.warnings.push(warning);
        output.manualReviewQueue.push(warning);
      });
      anchors.forEach((anchor) => discoveredSceneAnchors.add(anchor));

      const layerDecision = chooseLayers(segment, boundary.confidenceBand, input.hints.sceneLayerRoleHints);
      if (layerDecision.layers.length > 1) {
        const warning = `multiple layer candidates for ${segment.provisionalKey}: ${layerDecision.layers.join(", ")}`;
        output.ambiguousLayerAssignments.push(warning);
        output.manualReviewQueue.push(warning);
      }
      if (layerDecision.downgraded) {
        output.downgradedSceneLayerAssignments.push(segment.provisionalKey);
      }
      for (const warning of layerDecision.warnings) {
        output.warnings.push(warning);
        output.manualReviewQueue.push(warning);
      }

      const baseNodeKey = `book1-node-${shortHash(`${input.rawChunk.chunkNumber}|${segment.provisionalKey}`)}`;
      const canonicalStatement = compact(segment.textContent, 280);
      const inferredCategory = boundary.inferredCategory;
      const effectiveCategory = boundary.confidenceBand === "low" ? segment.category : inferredCategory;
      const confidenceScore = Number(boundary.confidenceScore.toFixed(4));

      if (effectiveCategory === "timeline_fact") {
        const year = extractYear(segment.textContent);
        const eventKey = `book1-event-${shortHash(segment.provisionalKey)}`;
        output.timelineEvents.push({
          eventKey,
          title: `Timeline anchor from ${fallbackTitle}`,
          description: canonicalStatement,
          yearLabel: year ? String(year) : null,
          dateStart: year ? new Date(Date.UTC(year, 0, 1)) : null,
          eventType: "historical_event",
          historicalOrStory: "historical",
          confidenceType: input.hints.confidenceHint,
          confidenceBand: boundary.confidenceBand,
          provenance,
        });
        output.knowledgeNodes.push({
          nodeKey: baseNodeKey,
          nodeType: "timeline_anchor",
          title: `Timeline claim ${input.rawChunk.chunkNumber}`,
          canonicalStatement,
          summaryShort: compact(segment.textContent, 120),
          summaryLong: null,
          canonStatus: input.hints.canonStatusSuggestion,
          confidenceType: input.hints.confidenceHint,
          confidenceScore,
          confidenceBand: boundary.confidenceBand,
          provenance,
          narrativeTags: ["timeline_fact", `chunk_${input.rawChunk.chunkNumber}`],
        });
      } else if (effectiveCategory === "lineage_fact") {
        output.knowledgeNodes.push({
          nodeKey: baseNodeKey,
          nodeType: "lineage_fact",
          title: `Lineage fact ${input.rawChunk.chunkNumber}`,
          canonicalStatement,
          summaryShort: compact(segment.textContent, 120),
          summaryLong: null,
          canonStatus: "candidate",
          confidenceType: "inferred_historical",
          confidenceScore,
          confidenceBand: boundary.confidenceBand,
          provenance,
          narrativeTags: ["lineage_fact", `chunk_${input.rawChunk.chunkNumber}`],
        });

        const names = extractEntityCandidates(segment);
        for (const name of names) {
          const normalizedName = normalizeName(name);
          if (seenEntityNames.has(normalizedName)) continue;
          seenEntityNames.add(normalizedName);
          output.entities.push({
            entityKey: `book1-entity-${shortHash(normalizedName)}`,
            entityType: "person",
            displayName: name,
            normalizedName,
            description: `Extracted from ${segment.provisionalKey}`,
            confidenceBand: boundary.confidenceBand,
            provenance,
          });
        }
        if (names.length >= 2) {
          output.relationships.push({
            fromNormalizedName: normalizeName(names[0]),
            toNormalizedName: normalizeName(names[1]),
            relationshipType: inferRelationshipType(segment.textContent),
            description: `Derived from lineage segment ${segment.provisionalKey}`,
            confidenceBand: boundary.confidenceBand,
            provenance,
          });
        }
        const lineageYear = extractYear(segment.textContent);
        if (lineageYear) {
          output.timelineEvents.push({
            eventKey: `book1-lineage-event-${shortHash(segment.provisionalKey)}`,
            title: `Lineage event ${lineageYear}`,
            description: canonicalStatement,
            yearLabel: String(lineageYear),
            dateStart: new Date(Date.UTC(lineageYear, 0, 1)),
            eventType: "lineage_event",
            historicalOrStory: "historical",
            confidenceType: "inferred_historical",
            confidenceBand: boundary.confidenceBand,
            provenance,
          });
        }
      } else if (effectiveCategory === "symbolic_motif") {
        output.knowledgeNodes.push({
          nodeKey: baseNodeKey,
          nodeType: "symbolic_motif",
          title: `Symbolic motif ${input.rawChunk.chunkNumber}`,
          canonicalStatement,
          summaryShort: compact(segment.textContent, 120),
          summaryLong: null,
          canonStatus: "candidate",
          confidenceType: "interpretive",
          confidenceScore,
          confidenceBand: boundary.confidenceBand,
          provenance,
          narrativeTags: ["symbolic_motif"],
        });
      } else if (effectiveCategory === "interpretive_passage") {
        output.knowledgeNodes.push({
          nodeKey: baseNodeKey,
          nodeType: "scene_interpretation",
          title: `Interpretive passage ${input.rawChunk.chunkNumber}`,
          canonicalStatement,
          summaryShort: compact(segment.textContent, 120),
          summaryLong: null,
          canonStatus: "candidate",
          confidenceType: "interpretive",
          confidenceScore,
          confidenceBand: boundary.confidenceBand,
          provenance,
          narrativeTags: ["interpretive_passage"],
        });
      } else if (effectiveCategory === "setting_passage") {
        if (anchors.length === 0) {
          output.knowledgeNodes.push({
            nodeKey: baseNodeKey,
            nodeType: "setting_intelligence",
            title: `Setting intelligence ${input.rawChunk.chunkNumber}`,
            canonicalStatement,
            summaryShort: compact(segment.textContent, 120),
            summaryLong: null,
            canonStatus: "candidate",
            confidenceType: input.hints.confidenceHint,
            confidenceScore,
            confidenceBand: boundary.confidenceBand,
            provenance,
            narrativeTags: ["setting_passage", "scene_unlinked"],
          });
        }
      } else if (effectiveCategory === "scene_fragment") {
        if (anchors.length === 0) {
          output.knowledgeNodes.push({
            nodeKey: baseNodeKey,
            nodeType: "scene_seed",
            title: `Scene seed ${input.rawChunk.chunkNumber}`,
            canonicalStatement,
            summaryShort: compact(segment.textContent, 120),
            summaryLong: null,
            canonStatus: "candidate",
            confidenceType: "narrative_design",
            confidenceScore,
            confidenceBand: boundary.confidenceBand,
            provenance,
            narrativeTags: ["scene_fragment", "scene_unlinked"],
          });
        }
      } else if (effectiveCategory === "atomic_claim") {
        output.knowledgeNodes.push({
          nodeKey: baseNodeKey,
          nodeType: "historical_claim",
          title: `Atomic claim ${input.rawChunk.chunkNumber}`,
          canonicalStatement,
          summaryShort: compact(segment.textContent, 120),
          summaryLong: null,
          canonStatus: input.hints.canonStatusSuggestion,
          confidenceType: input.hints.confidenceHint,
          confidenceScore,
          confidenceBand: boundary.confidenceBand,
          provenance,
          narrativeTags: ["atomic_claim"],
        });
      }

      const shouldSceneLink = new Set<Book1ProvisionalSegment["category"]>([
        "scene_fragment",
        "setting_passage",
        "observer_passage",
        "symbolic_motif",
        "interpretive_passage",
      ]);
      if (shouldSceneLink.has(effectiveCategory) && anchors.length > 0) {
        const layers = layerDecision.layers.length > 0 ? layerDecision.layers : input.hints.sceneLayerRoleHints;
        if (layers.length === 0) {
          const warning = `uncertain layer type for ${segment.provisionalKey}`;
          output.ambiguousLayerAssignments.push(warning);
          output.manualReviewQueue.push(warning);
        }
        for (const anchor of anchors) {
          const layerTypes: Book1SceneComponentType[] =
            layers.length > 0 ? layers : ["environmental_layer"];
          for (const layer of layerTypes) {
            output.sceneComponents.push({
              componentKey: `book1-scene-component-${shortHash(`${segment.provisionalKey}|${anchor}|${layer}`)}`,
              sceneAnchorNumber: anchor,
              componentType: layer,
              componentSubtype: segment.category,
              textContent: segment.textContent,
              summary: compact(segment.textContent, 140),
              functionInScene: segment.label ?? null,
              canonStatus: "candidate",
              confidenceType: input.hints.confidenceHint,
              confidenceBand: boundary.confidenceBand,
              confidenceScore,
              provenance,
              reviewWarnings: warnings,
            });
          }
        }
      }

      if (boundary.confidenceBand === "low") {
        output.manualReviewQueue.push(
          `${segment.provisionalKey}: low-confidence boundary classification (${boundary.inferredCategory})`,
        );
      } else if (boundary.confidenceBand === "medium") {
        output.manualReviewQueue.push(
          `${segment.provisionalKey}: medium-confidence segment committed with review flag`,
        );
      }
    }

    output.detectedSceneAnchors = [...discoveredSceneAnchors].sort((a, b) => a - b);

    const retrievalRows = [
      ...output.knowledgeNodes.map((node) => ({
        objectType: "knowledge_node" as const,
        objectStableKey: node.nodeKey,
        embeddingText: `${node.title}. ${node.canonicalStatement}`,
        retrievalTags: node.narrativeTags,
        useCases: ["knowledge_lookup", "canon_validation"],
        spoilerLevel: "medium",
        priorityWeight: node.confidenceBand === "high" ? 0.78 : node.confidenceBand === "medium" ? 0.68 : 0.52,
      })),
      ...output.entities.map((entity) => ({
        objectType: "entity" as const,
        objectStableKey: entity.entityKey,
        embeddingText: `${entity.displayName}. ${entity.description ?? ""}`.trim(),
        retrievalTags: ["entity", entity.entityType, `chunk_${input.rawChunk.chunkNumber}`],
        useCases: ["entity_linking", "lineage_search"],
        spoilerLevel: "low",
        priorityWeight: entity.confidenceBand === "high" ? 0.74 : entity.confidenceBand === "medium" ? 0.65 : 0.51,
      })),
      ...output.timelineEvents.map((event) => ({
        objectType: "timeline_event" as const,
        objectStableKey: event.eventKey,
        embeddingText: `${event.title}. ${event.description}`,
        retrievalTags: ["timeline_event", event.historicalOrStory],
        useCases: ["timeline_retrieval", "chronology_checks"],
        spoilerLevel: "low",
        priorityWeight: event.confidenceBand === "high" ? 0.77 : event.confidenceBand === "medium" ? 0.67 : 0.53,
      })),
      ...output.sceneComponents.map((component) => ({
        objectType: "scene_component" as const,
        objectStableKey: component.componentKey,
        embeddingText: `${component.componentType}. ${component.summary ?? compact(component.textContent, 140)}`,
        retrievalTags: ["scene_component", component.componentType, `scene_${component.sceneAnchorNumber}`],
        useCases: ["scene_assembly", "layered_retrieval"],
        spoilerLevel: "high",
        priorityWeight:
          component.confidenceBand === "high" ? 0.82 : component.confidenceBand === "medium" ? 0.69 : 0.54,
      })),
    ];
    output.retrievalProfiles = retrievalRows;

    return output;
  }
}
