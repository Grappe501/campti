export type NarrativeLayer =
  | "setting_layer"
  | "environmental_layer"
  | "primary_pov"
  | "observer_layer"
  | "interpretive_layer"
  | "symbolic_layer";

export type NarrativeComponent = {
  id: string;
  componentKey: string | null;
  sceneAnchorId: string;
  sceneNumber: number;
  sceneKey: string;
  sceneTitle: string;
  componentType: NarrativeLayer;
  canonStatus: string;
  confidenceType: string;
  textContent: string;
  summary: string | null;
  functionInScene: string | null;
  orderPriority: number | null;
  sourceKey: string | null;
  sourceFileName: string | null;
  sourceChunkNumber: number | null;
};

export type PreferredNarrativeExtractorOptions = {
  includeInterpretiveLayer: boolean;
  includeSymbolicLayer: boolean;
  includeCandidates: boolean;
  candidateTopN: number;
};

export type SceneNarrative = {
  sceneNumber: number;
  sceneKey: string;
  title: string;
  preferred: Partial<Record<NarrativeLayer, NarrativeComponent>>;
  candidates: Partial<Record<NarrativeLayer, NarrativeComponent[]>>;
  orderedNarrativeBlocks: Array<{
    layer: NarrativeLayer;
    text: string;
    source: { componentKey: string | null; sourceKey: string | null };
    candidate: boolean;
  }>;
  plainText: string;
  warnings: string[];
};

export type PreferredNarrativeExtraction = {
  generatedAt: string;
  options: PreferredNarrativeExtractorOptions;
  scenes: SceneNarrative[];
};

const ORDERED_LAYERS: NarrativeLayer[] = [
  "setting_layer",
  "environmental_layer",
  "primary_pov",
  "observer_layer",
  "interpretive_layer",
  "symbolic_layer",
];

function confidenceScore(type: string): number {
  const normalized = type.toUpperCase();
  if (normalized === "HISTORICAL") return 1;
  if (normalized === "INFERRED_HISTORICAL") return 0.86;
  if (normalized === "NARRATIVE_DESIGN") return 0.79;
  if (normalized === "INTERPRETIVE") return 0.68;
  return 0.45;
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
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const token of ta) {
    if (tb.has(token)) intersection += 1;
  }
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : intersection / union;
}

function bestPreferredForLayer(
  components: NarrativeComponent[],
  layer: NarrativeLayer,
): NarrativeComponent | undefined {
  return components
    .filter((component) => component.componentType === layer && component.canonStatus.toUpperCase() === "CANON")
    .sort((a, b) => (a.orderPriority ?? 999) - (b.orderPriority ?? 999))[0];
}

function topCandidatesForLayer(
  components: NarrativeComponent[],
  layer: NarrativeLayer,
  preferred: NarrativeComponent | undefined,
  topN: number,
): NarrativeComponent[] {
  const seedText = preferred?.textContent ?? components.map((row) => row.textContent).join("\n");
  return components
    .filter((component) => component.componentType === layer && component.canonStatus.toUpperCase() === "CANDIDATE")
    .map((component) => ({
      component,
      score: confidenceScore(component.confidenceType) * 0.7 + similarity(component.textContent, seedText) * 0.3,
    }))
    .sort((a, b) => b.score - a.score || (a.component.orderPriority ?? 999) - (b.component.orderPriority ?? 999))
    .slice(0, topN)
    .map((row) => row.component);
}

function layerLabel(layer: NarrativeLayer): string {
  return {
    setting_layer: "Setting",
    environmental_layer: "Environment",
    primary_pov: "POV",
    observer_layer: "Observer",
    interpretive_layer: "Interpretation",
    symbolic_layer: "Symbolic",
  }[layer];
}

function composePlainText(scene: SceneNarrative): string {
  const lines: string[] = [];
  lines.push(`Scene ${scene.sceneNumber}: ${scene.title}`);
  lines.push("");
  for (const block of scene.orderedNarrativeBlocks) {
    lines.push(`${layerLabel(block.layer)}: ${block.text}`);
    if (block.candidate) lines.push("(candidate blend)");
    lines.push("");
  }
  if (scene.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of scene.warnings) lines.push(`- ${warning}`);
  }
  return lines.join("\n").trim();
}

export class Book1PreferredNarrativeExtractor {
  extract(input: {
    sceneComponents: NarrativeComponent[];
    options: PreferredNarrativeExtractorOptions;
  }): PreferredNarrativeExtraction {
    const byScene = new Map<number, NarrativeComponent[]>();
    for (const component of input.sceneComponents) {
      if (!byScene.has(component.sceneNumber)) byScene.set(component.sceneNumber, []);
      byScene.get(component.sceneNumber)?.push(component);
    }

    const scenes: SceneNarrative[] = [];
    for (const sceneNumber of [...byScene.keys()].sort((a, b) => a - b)) {
      const components = byScene.get(sceneNumber) ?? [];
      const sceneTitle = components[0]?.sceneTitle ?? `Scene ${sceneNumber}`;
      const sceneKey = components[0]?.sceneKey ?? `book1_scene_${String(sceneNumber).padStart(2, "0")}`;
      const preferred: SceneNarrative["preferred"] = {};
      const candidates: SceneNarrative["candidates"] = {};
      const warnings: string[] = [];

      for (const layer of ORDERED_LAYERS) {
        if (!input.options.includeInterpretiveLayer && layer === "interpretive_layer") continue;
        if (!input.options.includeSymbolicLayer && layer === "symbolic_layer") continue;

        const selected = bestPreferredForLayer(components, layer);
        if (selected) preferred[layer] = selected;
        else if (layer !== "interpretive_layer" && layer !== "symbolic_layer") {
          warnings.push(`missing preferred ${layer}`);
        }
        if (input.options.includeCandidates) {
          const top = topCandidatesForLayer(components, layer, selected, input.options.candidateTopN);
          if (top.length > 0) candidates[layer] = top;
        }
      }

      const orderedNarrativeBlocks: SceneNarrative["orderedNarrativeBlocks"] = [];
      for (const layer of ORDERED_LAYERS) {
        if (!input.options.includeInterpretiveLayer && layer === "interpretive_layer") continue;
        if (!input.options.includeSymbolicLayer && layer === "symbolic_layer") continue;
        const preferredComponent = preferred[layer];
        if (preferredComponent) {
          orderedNarrativeBlocks.push({
            layer,
            text: preferredComponent.summary ?? preferredComponent.textContent,
            source: {
              componentKey: preferredComponent.componentKey,
              sourceKey: preferredComponent.sourceKey,
            },
            candidate: false,
          });
        }
        if (input.options.includeCandidates) {
          for (const candidate of candidates[layer] ?? []) {
            orderedNarrativeBlocks.push({
              layer,
              text: candidate.summary ?? candidate.textContent,
              source: { componentKey: candidate.componentKey, sourceKey: candidate.sourceKey },
              candidate: true,
            });
          }
        }
      }

      const scene: SceneNarrative = {
        sceneNumber,
        sceneKey,
        title: sceneTitle,
        preferred,
        candidates,
        orderedNarrativeBlocks,
        plainText: "",
        warnings,
      };
      scene.plainText = composePlainText(scene);
      scenes.push(scene);
    }

    return {
      generatedAt: new Date().toISOString(),
      options: input.options,
      scenes,
    };
  }
}
