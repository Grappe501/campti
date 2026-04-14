/**
 * P2-F knowledge boundary (pure). Run: npx tsx --test lib/character-knowledge/knowledge-boundary.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCharacterKnowledgeBoundary,
  type CharacterKnowledgeBoundary,
} from "@/lib/character-knowledge/knowledge-boundary";
import { NarrativeSourceTruthMode } from "@/lib/domain/narrative-source";
import type { NarrativeSource } from "@/lib/domain/narrative-source";

function src(
  id: string,
  title: string,
  mode: string,
  startWs: string
): NarrativeSource {
  return {
    id,
    title,
    authorType: "historical",
    createdAt: new Date(),
    effectiveStartWorldStateId: startWs,
    effectiveEndWorldStateId: null,
    startYear: null,
    endYear: null,
    scope: "regional",
    truthMode: mode,
    tags: [],
    content: "body",
    metadataJson: null,
  };
}

describe("buildCharacterKnowledgeBoundary", () => {
  it("separates authoritative sources into known and interpretive into believed", () => {
    const b: CharacterKnowledgeBoundary = buildCharacterKnowledgeBoundary({
      worldStateLabel: "Test era",
      approximateStoryYear: 1820,
      socialRoleHint: "Trader",
      literacyClerical: "rare",
      relationshipLines: ["Marie: kin"],
      narrativeSources: [
        src("a1", "Parish record", NarrativeSourceTruthMode.Authoritative, "ws0"),
        src("a2", "Historian thesis", NarrativeSourceTruthMode.Interpretive, "ws0"),
      ],
      assertionSlotLabels: ["birth_parentage"],
      perceivedReality: "River light on the dock.",
      gossipPressure01: 0.5,
      witnessRisk01: 0.1,
    });
    assert.ok(b.knownFacts.some((l) => l.includes("Parish record")));
    assert.ok(b.knownFacts.some((l) => l.includes("authoritative")));
    assert.ok(b.believedFacts.some((l) => l.includes("Historian thesis")));
    assert.ok(b.unknownDomains.length > 0);
    assert.ok(b.unknownDomains.some((l) => l.includes("omniscient")));
  });

  it("marks no-global-scope unknown when only regional sources exist", () => {
    const b = buildCharacterKnowledgeBoundary({
      worldStateLabel: null,
      approximateStoryYear: null,
      socialRoleHint: null,
      literacyClerical: null,
      relationshipLines: [],
      narrativeSources: [src("r1", "Regional diary", NarrativeSourceTruthMode.Authoritative, "ws0")],
      assertionSlotLabels: [],
      perceivedReality: "x",
      gossipPressure01: null,
      witnessRisk01: null,
    });
    assert.ok(b.unknownDomains.some((l) => l.includes("global")));
  });
});
