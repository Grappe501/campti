/**
 * Temporal truth-firewall predicate. Run: npx tsx --test lib/services/narrative-source-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  narrativeSourceIsVisibleAtWorldState,
  type WorldStateChronologyIndexById,
} from "@/lib/services/narrative-source-service";

function chronology(...entries: [string, number][]): WorldStateChronologyIndexById {
  return new Map(entries);
}

describe("narrativeSourceIsVisibleAtWorldState", () => {
  it("excludes sources whose effective start is after the current world state (later validity does not leak backward)", () => {
    const c = chronology(["ws_early", 0], ["ws_late", 2]);
    assert.equal(
      narrativeSourceIsVisibleAtWorldState(
        {
          effectiveStartWorldStateId: "ws_late",
          effectiveEndWorldStateId: null,
          startYear: null,
          endYear: null,
        },
        "ws_early",
        c
      ),
      false
    );
  });

  it("includes sources whose world-state window contains the current state by chronologyIndex", () => {
    const c = chronology(["ws_a", 0], ["ws_b", 1], ["ws_c", 2]);
    assert.equal(
      narrativeSourceIsVisibleAtWorldState(
        {
          effectiveStartWorldStateId: "ws_a",
          effectiveEndWorldStateId: "ws_c",
          startYear: null,
          endYear: null,
        },
        "ws_b",
        c
      ),
      true
    );
  });

  it("excludes when the current world state is after effective end (bounded forward window)", () => {
    const c = chronology(["ws_a", 0], ["ws_b", 1], ["ws_c", 2]);
    assert.equal(
      narrativeSourceIsVisibleAtWorldState(
        {
          effectiveStartWorldStateId: "ws_a",
          effectiveEndWorldStateId: "ws_b",
          startYear: null,
          endYear: null,
        },
        "ws_c",
        c
      ),
      false
    );
  });

  it("uses canonical chronologyIndex, not lexicographic id order (ids may sort opposite to the timeline)", () => {
    const c = chronology(
      ["zzz_is_earlier_timeline", 0],
      ["aaa_is_later_timeline", 2]
    );
    const source = {
      effectiveStartWorldStateId: "aaa_is_later_timeline",
      effectiveEndWorldStateId: null as string | null,
      startYear: null,
      endYear: null,
    };
    assert.equal(
      narrativeSourceIsVisibleAtWorldState(source, "zzz_is_earlier_timeline", c),
      false
    );
    // Lexicographic compare would treat "aaa..." < "zzz..." and incorrectly admit this source at the earlier slice.
    assert.equal(source.effectiveStartWorldStateId < "zzz_is_earlier_timeline", true);
  });

  it("later world state can see a source that began in an earlier slice and has no end bound", () => {
    const c = chronology(["past", 0], ["present", 3]);
    assert.equal(
      narrativeSourceIsVisibleAtWorldState(
        {
          effectiveStartWorldStateId: "past",
          effectiveEndWorldStateId: null,
          startYear: null,
          endYear: null,
        },
        "present",
        c
      ),
      true
    );
  });

  it("applies year bounds when year is provided (calendar axis independent from world-state chronology)", () => {
    const c = chronology(["ws_a", 0]);
    const base = {
      effectiveStartWorldStateId: "ws_a",
      effectiveEndWorldStateId: null as string | null,
      startYear: 1800,
      endYear: 1850,
    };
    assert.equal(narrativeSourceIsVisibleAtWorldState(base, "ws_a", c, 1820), true);
    assert.equal(narrativeSourceIsVisibleAtWorldState(base, "ws_a", c, 1799), false);
    assert.equal(narrativeSourceIsVisibleAtWorldState(base, "ws_a", c, 1851), false);
  });
});
