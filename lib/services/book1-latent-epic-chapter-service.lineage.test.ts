import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Book1LatentEpicChapterService } from "@/lib/services/book1-latent-epic-chapter-service";
import { annotateLineageConduitEntities } from "@/lib/services/book1-lineage-conduit-service";

describe("book1-latent-epic-chapter-service lineage conduit integration", () => {
  it("emits lineage conduit report and keeps descendants metadata-only", () => {
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
        displayName: "Alexis",
        entityType: "PERSON",
        description: "later descendant",
        startYear: 1740,
        endYear: null,
        notes: null,
      },
    ]);
    const artifacts = new Book1LatentEpicChapterService().generateChapter1Artifacts({
      epicOutline: {
        generatedAt: new Date().toISOString(),
        thematicVision: ["power", "identity", "faith", "survival"],
        phases: [
          {
            name: "Pre-Civil War",
            timeRange: "Pre-contact to 1865",
            chapters: [
              {
                chapter: 1,
                timePeriod: "Before 1680",
                keyEvents: ["x"],
                characters: ["First Matriarch", "Alexis"],
                psychologicalForces: ["x"],
                themes: ["power", "identity", "faith", "survival"],
                readerExperience: "x",
                connectedScenes: [1],
              },
            ],
          },
          {
            name: "Post-Civil War",
            timeRange: "1865 to present-day narrator convergence",
            chapters: [],
          },
        ],
      },
      knowledgeNodes: [{ nodeType: "history_fact", title: "Node", canonicalStatement: "Node", summaryShort: "Node", summaryLong: null, historicalScope: null, narrativeScope: null }],
      timelineEvents: [{ title: "Event", eventType: "lineage_event", dateStart: new Date(Date.UTC(1637, 0, 1)), dateEnd: null, yearLabel: "1637", description: "desc", historicalOrStory: "HISTORICAL" }],
      entities,
      sceneComponents: [{ componentType: "setting_layer", textContent: "River", summary: "River", functionInScene: null, canonStatus: "CANON", confidenceType: "high" }],
      psychProfiles: [],
    });
    assert.equal(artifacts.lineageConduitReport.artifact, "chapter_lineage_conduit_report");
    assert.equal(artifacts.lineageConduitReport.activeAncestralFigures.length > 0, true);
    assert.equal(artifacts.chapterCharacterHiddenHistories.characters.some((row) => /alexis/i.test(row.character)), false);
  });
});
