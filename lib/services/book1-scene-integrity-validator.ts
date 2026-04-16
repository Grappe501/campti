export type SceneLayerKey =
  | "primary_pov"
  | "secondary_pov"
  | "environmental_layer"
  | "setting_layer"
  | "observer_layer"
  | "interpretive_layer"
  | "symbolic_layer";

export type SceneAnchorRow = {
  id: string;
  sceneNumber: number;
  sceneKey: string;
  title: string;
};

export type SceneComponentRow = {
  id: string;
  sceneAnchorId: string;
  componentKey: string | null;
  componentType: SceneLayerKey;
  componentSubtype: string | null;
  confidenceType: string;
  canonStatus: string;
  sourceKey: string | null;
  textContent: string;
};

export type SceneIntegrityDiagnostic = {
  sceneNumber: number;
  sceneKey: string;
  title: string;
  completenessScore: number;
  missingLayers: SceneLayerKey[];
  activeCountByLayer: Record<SceneLayerKey, number>;
  candidateCountByLayer: Record<SceneLayerKey, number>;
  duplicateLayers: SceneLayerKey[];
  conflictingAssignments: string[];
  lowConfidenceAssignments: string[];
};

export type SceneIntegrityReport = {
  generatedAt: string;
  sceneDiagnostics: SceneIntegrityDiagnostic[];
  missingLayers: Array<{ sceneNumber: number; layers: SceneLayerKey[] }>;
  duplicateLayers: Array<{ sceneNumber: number; layers: SceneLayerKey[] }>;
  lowConfidenceAssignments: Array<{ sceneNumber: number; componentId: string; reason: string }>;
};

const REQUIRED_LAYERS: SceneLayerKey[] = ["primary_pov", "environmental_layer", "setting_layer", "observer_layer"];
const RECOMMENDED_LAYERS: SceneLayerKey[] = ["secondary_pov"];

function normalizeLayer(raw: string): SceneLayerKey {
  return raw.toLowerCase() as SceneLayerKey;
}

function baseLayerCountMap(): Record<SceneLayerKey, number> {
  return {
    primary_pov: 0,
    secondary_pov: 0,
    environmental_layer: 0,
    setting_layer: 0,
    observer_layer: 0,
    interpretive_layer: 0,
    symbolic_layer: 0,
  };
}

function isActivePreferred(component: SceneComponentRow): boolean {
  return component.canonStatus.toUpperCase() === "CANON";
}

function isCandidateAlternative(component: SceneComponentRow): boolean {
  return component.canonStatus.toUpperCase() === "CANDIDATE";
}

export class Book1SceneIntegrityValidator {
  evaluate(input: { sceneAnchors: SceneAnchorRow[]; sceneComponents: SceneComponentRow[] }): SceneIntegrityReport {
    const diagnostics: SceneIntegrityDiagnostic[] = [];
    const missingLayers: SceneIntegrityReport["missingLayers"] = [];
    const duplicateLayers: SceneIntegrityReport["duplicateLayers"] = [];
    const lowConfidenceAssignments: SceneIntegrityReport["lowConfidenceAssignments"] = [];

    for (const anchor of input.sceneAnchors) {
      const components = input.sceneComponents.filter((component) => component.sceneAnchorId === anchor.id);
      const activeCountByLayer = baseLayerCountMap();
      const candidateCountByLayer = baseLayerCountMap();
      for (const component of components) {
        const layer = normalizeLayer(component.componentType);
        if (isActivePreferred(component)) activeCountByLayer[layer] += 1;
        if (isCandidateAlternative(component)) candidateCountByLayer[layer] += 1;
      }

      const missing = REQUIRED_LAYERS.filter((layer) => activeCountByLayer[layer] === 0);
      const duplicate = (Object.entries(activeCountByLayer) as Array<[SceneLayerKey, number]>)
        .filter(([, count]) => count > 1)
        .map(([layer]) => layer);

      const conflicts: string[] = [];
      const typeByText = new Map<string, Set<SceneLayerKey>>();
      for (const component of components.filter(isActivePreferred)) {
        const textKey = component.textContent.trim().slice(0, 120).toLowerCase();
        const current = typeByText.get(textKey) ?? new Set<SceneLayerKey>();
        current.add(component.componentType);
        typeByText.set(textKey, current);
      }
      for (const [textKey, layers] of typeByText.entries()) {
        if (layers.size > 1) {
          conflicts.push(`same excerpt mapped to multiple layers: ${[...layers].join(", ")} :: ${textKey.slice(0, 60)}`);
        }
      }

      const lowConfidence = components
        .filter(
          (component) =>
            component.confidenceType.toUpperCase() === "UNRESOLVED" ||
            component.canonStatus.toUpperCase() === "OPTIONAL" ||
            component.canonStatus.toUpperCase() === "DEPRECATED",
        )
        .map((component) => {
          const reason =
            component.confidenceType.toUpperCase() === "UNRESOLVED"
              ? "unresolved confidence type"
              : `canon status ${component.canonStatus.toLowerCase()}`;
          lowConfidenceAssignments.push({ sceneNumber: anchor.sceneNumber, componentId: component.id, reason });
          return `${component.id}: ${reason}`;
        });

      const requiredSatisfied = REQUIRED_LAYERS.filter((layer) => activeCountByLayer[layer] > 0).length;
      const recommendedSatisfied = RECOMMENDED_LAYERS.filter((layer) => activeCountByLayer[layer] > 0).length;
      const completenessScore = Number(
        ((requiredSatisfied / REQUIRED_LAYERS.length) * 0.85 + (recommendedSatisfied / RECOMMENDED_LAYERS.length) * 0.15).toFixed(4),
      );

      diagnostics.push({
        sceneNumber: anchor.sceneNumber,
        sceneKey: anchor.sceneKey,
        title: anchor.title,
        completenessScore,
        missingLayers: missing,
        activeCountByLayer,
        candidateCountByLayer,
        duplicateLayers: duplicate,
        conflictingAssignments: conflicts,
        lowConfidenceAssignments: lowConfidence,
      });

      if (missing.length > 0) missingLayers.push({ sceneNumber: anchor.sceneNumber, layers: missing });
      if (duplicate.length > 0) duplicateLayers.push({ sceneNumber: anchor.sceneNumber, layers: duplicate });
    }

    diagnostics.sort((a, b) => a.sceneNumber - b.sceneNumber);
    return {
      generatedAt: new Date().toISOString(),
      sceneDiagnostics: diagnostics,
      missingLayers,
      duplicateLayers,
      lowConfidenceAssignments,
    };
  }
}
