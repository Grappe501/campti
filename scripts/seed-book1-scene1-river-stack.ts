import "./load-env";
import {
  Book1CanonStatus,
  Book1ConfidenceType,
  Book1ContentMode,
  Book1SceneAnchorStatus,
  Book1SceneComponentType,
  Book1SourceKind,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

const SOURCE_ID = "book1-source-scene01-river-stack";
const SOURCE_KEY = "book1_scene_01_river_layer_stack";

type SceneLayerSeed = {
  componentKey: string;
  componentType:
    | "PRIMARY_POV"
    | "ENVIRONMENTAL_LAYER"
    | "SETTING_LAYER"
    | "OBSERVER_LAYER"
    | "SECONDARY_POV";
  textContent: string;
  summary: string;
  functionInScene: string;
  orderPriority: number;
};

const SCENE_01_LAYERS: SceneLayerSeed[] = [
  {
    componentKey: "book1_scene_01_primary_pov_girl_alignment",
    componentType: "PRIMARY_POV",
    textContent: "The girl in alignment.",
    summary: "Primary POV centers on the girl moving in alignment with the river world.",
    functionInScene: "Anchor the embodied primary consciousness for Scene 1.",
    orderPriority: 10,
  },
  {
    componentKey: "book1_scene_01_environmental_world_holding_releasing",
    componentType: "ENVIRONMENTAL_LAYER",
    textContent: "The world holding and releasing.",
    summary: "Environmental POV frames cyclical pressure: hold, release, and flow.",
    functionInScene: "Model the environmental force field around the primary POV.",
    orderPriority: 20,
  },
  {
    componentKey: "book1_scene_01_setting_riverbank_teaches_movement",
    componentType: "SETTING_LAYER",
    textContent: "The riverbank teaching movement.",
    summary: "Setting POV encodes movement-learning through terrain and current.",
    functionInScene: "Bind physical geography to scene behavior and memory.",
    orderPriority: 30,
  },
  {
    componentKey: "book1_scene_01_observer_awareness_without_language",
    componentType: "OBSERVER_LAYER",
    textContent: "Awareness forming without language.",
    summary: "Observer POV captures pre-verbal awareness and orientation.",
    functionInScene: "Track early consciousness development without explicit narration.",
    orderPriority: 40,
  },
  {
    componentKey: "book1_scene_01_secondary_pov_system_misinterpretation",
    componentType: "SECONDARY_POV",
    textContent: "Misinterpretation from inside the system. (to build)",
    summary: "Secondary POV layer reserved for systemic misread of the same moment.",
    functionInScene: "Capture counter-reading pressure against primary alignment.",
    orderPriority: 50,
  },
];

async function ensureSourceRecord() {
  await prisma.book1Source.upsert({
    where: { id: SOURCE_ID },
    create: {
      id: SOURCE_ID,
      sourceKey: SOURCE_KEY,
      title: "Book 1 Scene 01 River Layer Stack",
      rawText: [
        "Scene 1 - The River",
        "PRIMARY POV: The girl in alignment",
        "ENVIRONMENTAL POV: The world holding and releasing",
        "SETTING POV: The riverbank teaching movement",
        "OBSERVER POV: Awareness forming without language",
        "SECONDARY POV (to build): Misinterpretation from inside the system",
      ].join("\n"),
      bookNumber: 1,
      sourceKind: Book1SourceKind.RESEARCH_NOTE,
      dominantContentMode: Book1ContentMode.SCENE_TEXT,
      processingStatus: "seeded_scene_stack",
      notes: "Layered seed for Scene 1 stack model; preserves separation between narrative and interpretive lanes.",
    },
    update: {
      rawText: [
        "Scene 1 - The River",
        "PRIMARY POV: The girl in alignment",
        "ENVIRONMENTAL POV: The world holding and releasing",
        "SETTING POV: The riverbank teaching movement",
        "OBSERVER POV: Awareness forming without language",
        "SECONDARY POV (to build): Misinterpretation from inside the system",
      ].join("\n"),
      processingStatus: "seeded_scene_stack",
      notes: "Layered seed for Scene 1 stack model; preserves separation between narrative and interpretive lanes.",
    },
  });
}

async function resolveOrCreateSceneAnchorId(sceneNumber: number): Promise<string> {
  const sceneKey = `book1_scene_${String(sceneNumber).padStart(2, "0")}`;
  const anchorId = `book1-scene-anchor-${String(sceneNumber).padStart(2, "0")}`;
  const row = await prisma.book1SceneAnchor.upsert({
    where: { sceneNumber },
    create: {
      id: anchorId,
      sceneNumber,
      sceneKey,
      title: `Book 1 Anchor Scene ${String(sceneNumber).padStart(2, "0")} (placeholder)`,
      currentStatus: Book1SceneAnchorStatus.STUB,
    },
    update: {},
    select: { id: true },
  });
  return row.id;
}

async function upsertSceneLayer(sceneAnchorId: string, layer: SceneLayerSeed) {
  await prisma.book1SceneComponent.upsert({
    where: { componentKey: layer.componentKey },
    create: {
      id: `book1-scene-component-${layer.componentKey}`,
      sceneAnchorId,
      sourceId: SOURCE_ID,
      componentKey: layer.componentKey,
      componentType: Book1SceneComponentType[layer.componentType],
      textContent: layer.textContent,
      summary: layer.summary,
      functionInScene: layer.functionInScene,
      orderPriority: layer.orderPriority,
      canonStatus: Book1CanonStatus.CANDIDATE,
      confidenceType: Book1ConfidenceType.NARRATIVE_DESIGN,
      timeTagsJson: ["precontact"],
      geographyTagsJson: ["red_river", "riverbank", "campti"],
      culturalTagsJson: ["kinship", "adaptation"],
      narrativeTagsJson: ["system_character", "continuity"],
      functionalTagsJson: ["scene_material", "setting_material"],
    },
    update: {
      sceneAnchorId,
      sourceId: SOURCE_ID,
      componentType: Book1SceneComponentType[layer.componentType],
      textContent: layer.textContent,
      summary: layer.summary,
      functionInScene: layer.functionInScene,
      orderPriority: layer.orderPriority,
      canonStatus: Book1CanonStatus.CANDIDATE,
      confidenceType: Book1ConfidenceType.NARRATIVE_DESIGN,
      timeTagsJson: ["precontact"],
      geographyTagsJson: ["red_river", "riverbank", "campti"],
      culturalTagsJson: ["kinship", "adaptation"],
      narrativeTagsJson: ["system_character", "continuity"],
      functionalTagsJson: ["scene_material", "setting_material"],
    },
  });
}

async function main() {
  await ensureSourceRecord();
  const sceneAnchorId = await resolveOrCreateSceneAnchorId(1);
  for (const layer of SCENE_01_LAYERS) {
    await upsertSceneLayer(sceneAnchorId, layer);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sceneNumber: 1,
        title: "Scene 1 - The River",
        seededLayers: SCENE_01_LAYERS.length,
        sourceId: SOURCE_ID,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
