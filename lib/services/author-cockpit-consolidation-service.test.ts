import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateAuthorCockpitConsolidation,
  getAuthoritativeCockpitRoute,
  resolveLegacyWorkbenchRedirect,
} from "@/lib/services/author-cockpit-consolidation-service";

describe("author-cockpit-consolidation-service", () => {
  it("declares exactly one authoritative cockpit route", () => {
    const summary = evaluateAuthorCockpitConsolidation();
    assert.equal(summary.ok, true);
    assert.deepEqual(summary.authoritativeRoutes, ["/admin/narrative"]);
    assert.equal(summary.duplicateAuthorities.length, 0);
  });

  it("rewires legacy workbench routes to cockpit scope urls", () => {
    assert.equal(getAuthoritativeCockpitRoute(), "/admin/narrative");
    assert.equal(
      resolveLegacyWorkbenchRedirect({ routePattern: "/admin/scenes/[id]/workspace", id: "scene-1" }),
      "/admin/narrative?scope=scene&sceneId=scene-1"
    );
    assert.equal(
      resolveLegacyWorkbenchRedirect({ routePattern: "/admin/narrative/books/[bookId]", id: "book-1" }),
      "/admin/narrative?scope=book&bookId=book-1"
    );
  });
});
