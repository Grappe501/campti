import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  Book1PreferredNarrativeExtractor,
  type NarrativeComponent,
} from "@/lib/services/book1-preferred-narrative-extractor";

function component(partial: Partial<NarrativeComponent>): NarrativeComponent {
  return {
    id: partial.id ?? "id",
    componentKey: partial.componentKey ?? "component-key",
    sceneAnchorId: partial.sceneAnchorId ?? "anchor-1",
    sceneNumber: partial.sceneNumber ?? 1,
    sceneKey: partial.sceneKey ?? "book1_scene_01",
    sceneTitle: partial.sceneTitle ?? "Scene 1",
    componentType: partial.componentType ?? "setting_layer",
    canonStatus: partial.canonStatus ?? "CANON",
    confidenceType: partial.confidenceType ?? "HISTORICAL",
    textContent: partial.textContent ?? "text",
    summary: partial.summary ?? null,
    functionInScene: partial.functionInScene ?? null,
    orderPriority: partial.orderPriority ?? 1,
    sourceKey: partial.sourceKey ?? "source-1",
    sourceFileName: partial.sourceFileName ?? "chunk1.txt",
    sourceChunkNumber: partial.sourceChunkNumber ?? 1,
  };
}

describe("book1 preferred narrative extractor", () => {
  it("orders preferred layers as setting -> environment -> pov -> observer -> interpretation", () => {
    const extractor = new Book1PreferredNarrativeExtractor();
    const result = extractor.extract({
      sceneComponents: [
        component({ id: "a", componentType: "primary_pov", textContent: "POV content" }),
        component({ id: "b", componentType: "setting_layer", textContent: "Setting content" }),
        component({ id: "c", componentType: "observer_layer", textContent: "Observer content" }),
        component({ id: "d", componentType: "environmental_layer", textContent: "Environment content" }),
        component({ id: "e", componentType: "interpretive_layer", textContent: "Interpretive content" }),
      ],
      options: {
        includeInterpretiveLayer: true,
        includeSymbolicLayer: false,
        includeCandidates: false,
        candidateTopN: 0,
      },
    });

    const scene = result.scenes[0];
    assert.deepEqual(
      scene.orderedNarrativeBlocks.map((row) => row.layer),
      ["setting_layer", "environmental_layer", "primary_pov", "observer_layer", "interpretive_layer"],
    );
  });

  it("selects top candidate by confidence and similarity", () => {
    const extractor = new Book1PreferredNarrativeExtractor();
    const result = extractor.extract({
      sceneComponents: [
        component({
          id: "preferred",
          componentType: "observer_layer",
          canonStatus: "CANON",
          textContent: "He notices the river pattern and breath rhythm.",
        }),
        component({
          id: "candidate-strong",
          componentType: "observer_layer",
          canonStatus: "CANDIDATE",
          confidenceType: "HISTORICAL",
          textContent: "The river pattern aligns with his breathing rhythm.",
        }),
        component({
          id: "candidate-weak",
          componentType: "observer_layer",
          canonStatus: "CANDIDATE",
          confidenceType: "UNRESOLVED",
          textContent: "A distant unrelated image appears.",
        }),
      ],
      options: {
        includeInterpretiveLayer: false,
        includeSymbolicLayer: false,
        includeCandidates: true,
        candidateTopN: 1,
      },
    });

    const observerCandidates = result.scenes[0].candidates.observer_layer ?? [];
    assert.equal(observerCandidates.length, 1);
    assert.equal(observerCandidates[0].id, "candidate-strong");
  });
});
