/**
 * RICRE — research ingestion & canon reconciliation (node:test).
 * Run: npx tsx --test lib/services/ricre-pipeline.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import {
  buildCanonicalSceneGenerationHashInputV1,
  computeSceneGenerationInputHash,
} from "@/lib/scene-generation/canonical-scene-generation-hash";
import { ResearchClaimNormalizationService } from "@/lib/services/research-claim-normalization-service";
import { ResearchContradictionDetectionService } from "@/lib/services/research-contradiction-detection-service";
import { computeResearchProvenanceHash } from "@/lib/services/research-provenance-service";

describe("RICRE provenance", () => {
  it("is stable for identical material", () => {
    const a = computeResearchProvenanceHash({
      sourceUrl: "https://example.com/a",
      sourceTitle: "T",
      rawTextSample: "hello",
      ingestMethod: "author_url_fetch",
    });
    const b = computeResearchProvenanceHash({
      sourceUrl: "https://example.com/a",
      sourceTitle: "T",
      rawTextSample: "hello",
      ingestMethod: "author_url_fetch",
    });
    assert.equal(a, b);
  });
});

describe("RICRE claim normalization", () => {
  it("dedupes identical claim seeds", () => {
    const svc = new ResearchClaimNormalizationService();
    const out = svc.dedupeClaims([
      { claimType: "fact_claim", claimText: "Same text", confidence: 3 },
      { claimType: "fact_claim", claimText: "Same text", confidence: 4 },
    ]);
    assert.equal(out.length, 1);
  });
});

describe("RICRE contradiction surfacing", () => {
  it("filters contradiction-shaped comparisons", () => {
    const svc = new ResearchContradictionDetectionService();
    const rows = [
      {
        contractVersion: "1" as const,
        comparisonId: "1",
        claimId: "c",
        comparedAgainstType: "canon_knowledge" as const,
        comparedAgainstId: "k",
        comparisonResult: "contradicts_canon" as const,
        contradictionType: "x",
        impactScope: "place:p",
        validationFlags: [],
      },
      {
        contractVersion: "1" as const,
        comparisonId: "2",
        claimId: "c",
        comparedAgainstType: "canon_knowledge" as const,
        comparedAgainstId: "k2",
        comparisonResult: "extends_canon" as const,
        contradictionType: null,
        impactScope: "place:p",
        validationFlags: [],
      },
    ];
    assert.equal(svc.listContradictions(rows).length, 1);
  });
});

describe("RICRE downstream hash", () => {
  it("includes ricreAcceptedCanonKnowledge when present", () => {
    const input = {
      contract: {
        contractVersion: "1",
        epic: { id: "e", title: "E", summary: null, metadataJson: {} },
        book: { id: "b", movementIndex: 0, title: "B", readerFacingTitle: null, summary: null },
        chapter: { id: "ch", title: "C", summary: null, sequenceInBook: 1, chapterNumber: 1 },
        scene: {
          id: "sc",
          description: "d",
          summary: null,
          narrativeIntent: null,
          emotionalTone: null,
          orderInChapter: 1,
          writingMode: "STRUCTURED" as const,
          historicalAnchor: null,
          locationNote: null,
          pov: null,
          structuredDataJson: {},
        },
        effectiveWorldState: { worldStateId: "ws", eraId: null, label: "x" },
        place: { id: "pl", name: "P", description: null },
        participatingPeople: [],
        genealogicalAssertions: [],
        worldStateReference: null,
        beatPlan: [],
        continuityNotes: [],
        privateNotes: null,
      },
      generationMode: "draft" as const,
      generationPurpose: "author_draft" as const,
      historicalAnchorTerms: [],
      proseQaContext: {},
      sourceIdsUsed: [],
      ricreAcceptedCanonKnowledge: {
        contractVersion: "1",
        promptInstructionLines: ["RICRE_ACCEPTED_CANON:", "- line"],
        recordCount: 1,
        validationFlags: [],
      },
    } satisfies SceneGenerationInput;
    const h = computeSceneGenerationInputHash(input, null);
    const h2 = computeSceneGenerationInputHash(
      { ...input, ricreAcceptedCanonKnowledge: { ...input.ricreAcceptedCanonKnowledge!, recordCount: 2 } },
      null,
    );
    assert.notEqual(h, h2);
    const payload = buildCanonicalSceneGenerationHashInputV1(input, null);
    assert.ok("ricreAcceptedCanonKnowledge" in payload);
  });
});
