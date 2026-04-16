import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NarrativeThreadDerivationService } from "@/lib/services/narrative-thread-derivation-service";
import { SettingThreadCoverageService } from "@/lib/services/setting-thread-coverage-service";

describe("setting-thread-coverage-service", () => {
  it("evaluates red river location coverage with indirect mentions", () => {
    const threads = new NarrativeThreadDerivationService().buildBook1SampleThreadPack().threads;
    const report = new SettingThreadCoverageService().buildCoverageReport({
      bookId: "book1",
      requiredLocationIds: ["natchitoches", "alexandria-portage", "atchafalaya-fork", "lower-river-market"],
      seeds: [
        {
          locationId: "natchitoches",
          locationName: "Natchitoches",
          routeRole: "source",
          appearanceMode: "direct_scene",
          associatedThreads: ["book1-continuity-survival"],
          associatedCharacters: ["natchitoches-matriarch-keeper"],
          currentMeaning: "Continuity anchor",
          callbackLinks: ["storage-knot-gesture"],
          nextRecommendedAppearanceWindow: "chapter-02",
        },
        {
          locationId: "lower-river-market",
          locationName: "Lower River Market",
          routeRole: "destination",
          appearanceMode: "rumor",
          associatedThreads: ["book1-red-river-route-setting"],
          associatedCharacters: ["household-runner"],
          currentMeaning: "Disturbance signal",
          callbackLinks: ["double-harbor-rumor"],
          nextRecommendedAppearanceWindow: "chapter-03",
        },
      ],
      threads,
    });
    assert.equal(report.coverageRatio > 0, true);
    assert.equal(report.records.some((record) => record.indirectMentionCount > 0), true);
  });
});
