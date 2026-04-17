import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BOOK1_CONSOLE_ENFORCEMENT,
  Book1ConsoleLawConstraintRowSchema,
  chronologyInvariantToConsoleConstraintRow,
  futureArcConstraintToConsoleConstraintRow,
  sceneLawConstraintToConsoleRow,
  type Book1ConsoleLawConstraintRow,
} from "@/lib/domain/book1-console-law-constraint";

describe("book1-console-law-constraint", () => {
  it("parses only rows that include enforcement", () => {
    Book1ConsoleLawConstraintRowSchema.parse({
      id: "x",
      constraint: "c",
      enforcement: "e",
    });
    assert.throws(() => Book1ConsoleLawConstraintRowSchema.parse({ id: "x", constraint: "c" }));
  });

  it("futureArcConstraintToConsoleConstraintRow sets future_arc_constraint enforcement", () => {
    const row = futureArcConstraintToConsoleConstraintRow({
      id: "FA-1",
      mustPreserve: "Keep pressure unresolved.",
      forbiddenResolution: "No treaty.",
    });
    assert.equal(row.enforcement, BOOK1_CONSOLE_ENFORCEMENT.futureArcConstraint);
    assert.match(row.constraint, /Forbidden: No treaty\./);
  });

  it("chronologyInvariantToConsoleConstraintRow preserves source enforcement text", () => {
    const row = chronologyInvariantToConsoleConstraintRow({
      id: "CI-1",
      rule: "No year over 1680.",
      enforcement: "reject year token",
    });
    assert.equal(row.enforcement, "reject year token");
  });

  it("chronologyInvariantToConsoleConstraintRow derives chronology_invariant when enforcement is absent or blank", () => {
    assert.equal(
      chronologyInvariantToConsoleConstraintRow({ id: "CI-1", rule: "r" }).enforcement,
      BOOK1_CONSOLE_ENFORCEMENT.chronologyInvariant,
    );
    assert.equal(
      chronologyInvariantToConsoleConstraintRow({ id: "CI-1", rule: "r", enforcement: "   " }).enforcement,
      BOOK1_CONSOLE_ENFORCEMENT.chronologyInvariant,
    );
  });

  it("sceneLawConstraintToConsoleRow sets scene_law_constraint enforcement", () => {
    const row = sceneLawConstraintToConsoleRow({
      id: "SL-1-focus",
      constraint: "Preserve scene focus: opening",
    });
    assert.equal(row.enforcement, BOOK1_CONSOLE_ENFORCEMENT.sceneLawConstraint);
  });

  it("merging chronology and future-arc normalized rows yields enforcement on every item", () => {
    const merged: Book1ConsoleLawConstraintRow[] = [
      ...[{ id: "CI-1", rule: "r", enforcement: "gate" }].map(chronologyInvariantToConsoleConstraintRow),
      ...[{ id: "FA-1", mustPreserve: "m", forbiddenResolution: "f" }].map(futureArcConstraintToConsoleConstraintRow),
    ];
    assert.equal(merged.length, 2);
    for (const row of merged) {
      assert.equal(typeof row.enforcement, "string");
      assert.ok(row.enforcement.length > 0);
      Book1ConsoleLawConstraintRowSchema.parse(row);
    }
    assert.equal(merged[1].enforcement, BOOK1_CONSOLE_ENFORCEMENT.futureArcConstraint);
  });
});
