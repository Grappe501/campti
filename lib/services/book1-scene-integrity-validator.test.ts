import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1SceneIntegrityValidator } from "@/lib/services/book1-scene-integrity-validator";

describe("book1 scene integrity validator", () => {
  it("reports missing required layers and duplicate layers", () => {
    const validator = new Book1SceneIntegrityValidator();
    const report = validator.evaluate({
      sceneAnchors: [{ id: "scene1", sceneNumber: 1, sceneKey: "book1-scene-1", title: "Scene 1" }],
      sceneComponents: [
        {
          id: "c1",
          sceneAnchorId: "scene1",
          componentKey: "comp1",
          componentType: "primary_pov",
          componentSubtype: "scene_fragment",
          confidenceType: "NARRATIVE_DESIGN",
          canonStatus: "CANON",
          sourceKey: "book1-raw-chunk-1",
          textContent: "She stands by the river.",
        },
        {
          id: "c2",
          sceneAnchorId: "scene1",
          componentKey: "comp2",
          componentType: "primary_pov",
          componentSubtype: "scene_fragment",
          confidenceType: "UNRESOLVED",
          canonStatus: "CANON",
          sourceKey: "book1-raw-chunk-1",
          textContent: "She stands by the river.",
        },
      ],
    });

    assert.equal(report.sceneDiagnostics.length, 1);
    assert.deepEqual(report.sceneDiagnostics[0].missingLayers.sort(), [
      "environmental_layer",
      "observer_layer",
      "setting_layer",
    ]);
    assert.equal(report.sceneDiagnostics[0].duplicateLayers.includes("primary_pov"), true);
    assert.equal(report.lowConfidenceAssignments.length, 1);
  });
});
