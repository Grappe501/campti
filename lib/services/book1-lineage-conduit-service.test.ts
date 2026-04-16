import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MATRIARCH_LINE_NAMES, annotateLineageConduitEntities, isFutureDescendantOnlyEntity } from "@/lib/services/book1-lineage-conduit-service";

describe("book1-lineage-conduit-service", () => {
  it("annotates matriarch conduit metadata and future descendant links", () => {
    const entities = annotateLineageConduitEntities([
      {
        id: "1",
        displayName: "First Matriarch",
        entityType: "PERSON",
        description: "founder",
        startYear: 1637,
        endYear: null,
        notes: null,
      },
      {
        id: "2",
        displayName: "Alexis",
        entityType: "PERSON",
        description: "later descendant",
        startYear: 1740,
        endYear: null,
        notes: null,
      },
    ]);
    const first = entities.find((row) => row.displayName === "First Matriarch");
    assert.equal(first?.direct_lineage_conduit, true);
    assert.equal((first?.future_descendant_links ?? []).length > 0, true);
    const alexis = entities.find((row) => row.displayName === "Alexis");
    assert.equal(Boolean(alexis && isFutureDescendantOnlyEntity(alexis)), true);
  });

  it("ensures first four matriarch placeholders exist", () => {
    const entities = annotateLineageConduitEntities([]);
    for (const name of MATRIARCH_LINE_NAMES) {
      assert.equal(entities.some((row) => row.displayName === name), true);
    }
  });
});
