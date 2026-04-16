import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1EpicOutlineBuilder } from "@/lib/services/book1-epic-outline-builder";
import { annotateLineageConduitEntities } from "@/lib/services/book1-lineage-conduit-service";

describe("book1-epic-outline-builder lineage conduit weighting", () => {
  it("prioritizes matriarch conduits and gates descendants from early chapters", () => {
    const entities = annotateLineageConduitEntities([
      {
        id: "e1",
        displayName: "First Matriarch",
        entityType: "PERSON",
        description: "matriarch founder",
        startYear: 1637,
        endYear: null,
        notes: null,
      },
      {
        id: "e2",
        displayName: "Second Matriarch",
        entityType: "PERSON",
        description: "daughter line",
        startYear: 1662,
        endYear: null,
        notes: null,
      },
      {
        id: "e3",
        displayName: "Alexis",
        entityType: "PERSON",
        description: "later descendant",
        startYear: 1740,
        endYear: null,
        notes: null,
      },
    ]);
    const outline = new Book1EpicOutlineBuilder().build({
      knowledgeNodes: [{ nodeType: "history_fact", title: "First Matriarch", canonicalStatement: "First Matriarch leads", summaryShort: null, summaryLong: null, historicalScope: null, narrativeScope: null }],
      timelineEvents: [{ title: "Lineage event", eventType: "lineage_event", dateStart: new Date(Date.UTC(1637, 0, 1)), dateEnd: null, yearLabel: "1637", description: "First matriarch born", historicalOrStory: "HISTORICAL" }],
      entities,
      sceneAnchors: [{ sceneNumber: 1, sceneKey: "book1-scene-01", title: "Scene 1", eraLabel: null, functionInBook: null, summary: null }],
      thematicVision: ["power", "identity", "faith", "survival"],
    });
    const chapter1 = outline.phases[0].chapters[0];
    const chapterNames = "characters" in chapter1 ? chapter1.characters : chapter1.keyCharacters;
    assert.equal(chapterNames.includes("First Matriarch"), true);
    assert.equal(chapterNames.includes("Alexis"), false);
  });
});
