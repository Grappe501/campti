import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  Book1AbstractFearLanguageSuppressorService,
  suppressAbstractFearLine,
} from "@/lib/services/book1-abstract-fear-language-suppressor";

describe("book1-abstract-fear-language-suppressor", () => {
  it("builds suppression plan and rewrites abstract fear lines", () => {
    const plan = new Book1AbstractFearLanguageSuppressorService().build({
      segments: [{ segment: 1 }, { segment: 2 }],
    });

    const rewritten = suppressAbstractFearLine({
      text: "Fear sits at high level while pressure remains unresolved.",
      stopPatterns: plan.globalStopPatterns,
      substitutions: plan.substitutionRules.map((rule) => ({ from: rule.from, toPattern: rule.toPattern })),
    });

    assert.equal(plan.artifact, "chapter_abstract_fear_suppression");
    assert.equal(rewritten.includes("fear sits at"), false);
  });
});
