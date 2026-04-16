import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildToolRailSystem } from "@/lib/services/tool-rail-system-service";

describe("tool-rail-system-service", () => {
  it("returns contextual rail systems by scope", () => {
    const sceneRails = buildToolRailSystem("scene");
    const epicRails = buildToolRailSystem("epic");
    assert.equal(sceneRails.leftRail.tools.includes("linked_entities"), true);
    assert.equal(epicRails.leftRail.tools.includes("book_constellation"), true);
  });
});
