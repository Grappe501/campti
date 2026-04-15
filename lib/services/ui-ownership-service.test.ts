import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertCapabilitySurfaceOwnership,
  resolveCapabilityOwnership,
} from "@/lib/services/ui-ownership-service";

describe("ui-ownership-service", () => {
  it("classifies story reentry as reader-facing", () => {
    const ownership = resolveCapabilityOwnership("story_reentry");
    assert.equal(ownership.surface, "reader");
    assert.equal(ownership.owner, "reader_experience");
  });

  it("rejects wrong surface requests", () => {
    assert.throws(() =>
      assertCapabilitySurfaceOwnership({
        capability: "author_inspection",
        requestedSurface: "reader",
      })
    );
  });
});
