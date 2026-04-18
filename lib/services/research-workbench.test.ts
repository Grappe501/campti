/**
 * Research workbench — validation, contradiction surfacing, decision mapping (node:test).
 * Run: npx tsx --test lib/services/research-workbench.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CanonComparisonRecord } from "@/lib/domain/canon-reconciliation";
import { AuthorCanonDecisionInputSchema } from "@/lib/domain/canon-reconciliation";
import {
  ResearchIngestionManualInputSchema,
  ResearchIngestionUrlInputSchema,
  ResearchTargetCreateInputSchema,
  ResearchWorkbenchDecisionInputSchema,
  mapWorkbenchDecisionToAuthorType,
} from "@/lib/domain/research-workbench-validation";
import { ResearchContradictionDetectionService } from "@/lib/services/research-contradiction-detection-service";

describe("ResearchTargetCreateInputSchema", () => {
  it("rejects non-other target with zero links", () => {
    const r = ResearchTargetCreateInputSchema.safeParse({
      targetType: "scene",
      targetName: "T",
      linkedSceneIds: [],
      linkedChapterIds: [],
      linkedBookIds: [],
      linkedCharacterIds: [],
      linkedSettingIds: [],
      linkedEraIds: [],
      linkedThreadIds: [],
    });
    assert.equal(r.success, false);
  });

  it("accepts other target with intent and no links", () => {
    const r = ResearchTargetCreateInputSchema.safeParse({
      targetType: "other",
      targetName: "General topic",
      researchIntent: "Chronology of ferry crossings in Book 1.",
      linkedSceneIds: [],
      linkedChapterIds: [],
      linkedBookIds: [],
      linkedCharacterIds: [],
      linkedSettingIds: [],
      linkedEraIds: [],
      linkedThreadIds: [],
    });
    assert.equal(r.success, true);
  });

  it("rejects other target without intent when unlinked", () => {
    const r = ResearchTargetCreateInputSchema.safeParse({
      targetType: "other",
      targetName: "General topic",
      researchIntent: "",
      linkedSceneIds: [],
      linkedChapterIds: [],
      linkedBookIds: [],
      linkedCharacterIds: [],
      linkedSettingIds: [],
      linkedEraIds: [],
      linkedThreadIds: [],
    });
    assert.equal(r.success, false);
  });
});

describe("ResearchIngestionManualInputSchema", () => {
  it("rejects whitespace-only manual text", () => {
    const r = ResearchIngestionManualInputSchema.safeParse({
      researchTargetId: "t1",
      sourceTitle: "Title",
      manualText: "   \n\t  ",
    });
    assert.equal(r.success, false);
  });

  it("accepts bounded manual payload", () => {
    const r = ResearchIngestionManualInputSchema.safeParse({
      researchTargetId: "t1",
      sourceTitle: "Title",
      manualText: "Substantive excerpt for extraction.",
      sourceTrustTier: "secondary",
    });
    assert.equal(r.success, true);
  });
});

describe("ResearchIngestionUrlInputSchema", () => {
  it("rejects malformed URL", () => {
    const r = ResearchIngestionUrlInputSchema.safeParse({
      researchTargetId: "t1",
      sourceTitle: "T",
      sourceUrl: "not-a-url",
      fetchRemote: true,
    });
    assert.equal(r.success, false);
  });

  it("accepts https URL", () => {
    const r = ResearchIngestionUrlInputSchema.safeParse({
      researchTargetId: "t1",
      sourceTitle: "T",
      sourceUrl: "https://example.com/path",
      fetchRemote: false,
    });
    assert.equal(r.success, true);
  });
});

describe("ResearchWorkbenchDecisionInputSchema", () => {
  it("requires override notes for divergence", () => {
    const r = ResearchWorkbenchDecisionInputSchema.safeParse({
      claimId: "c1",
      workbenchDecision: "divergence",
      decisionReason: "Story needs different chronology.",
      canonTargetType: "scene",
      canonTargetId: "s1",
      historicalRealityStatus: "likely_historical",
      storyRealityStatus: "intentional_story_divergence",
    });
    assert.equal(r.success, false);
  });

  it("accepts divergence with rationale", () => {
    const r = ResearchWorkbenchDecisionInputSchema.safeParse({
      claimId: "c1",
      workbenchDecision: "divergence",
      decisionReason: "Story needs different chronology.",
      overrideNotes: "Explicit operator rationale for intentional divergence.",
      canonTargetType: "scene",
      canonTargetId: "s1",
      historicalRealityStatus: "likely_historical",
      storyRealityStatus: "intentional_story_divergence",
    });
    assert.equal(r.success, true);
  });

  it("maps workbench intents to author enum", () => {
    assert.equal(mapWorkbenchDecisionToAuthorType("accept"), "accept_as_canon");
    assert.equal(mapWorkbenchDecisionToAuthorType("reject"), "reject");
    assert.equal(mapWorkbenchDecisionToAuthorType("uncertain"), "mark_as_uncertain");
    assert.equal(mapWorkbenchDecisionToAuthorType("divergence"), "mark_as_intentional_story_divergence");
  });
});

describe("ResearchContradictionDetectionService", () => {
  it("surfaces contradiction-shaped comparisons only", () => {
    const svc = new ResearchContradictionDetectionService();
    const rows: CanonComparisonRecord[] = [
      {
        contractVersion: "1",
        comparisonId: "a",
        claimId: "c",
        comparedAgainstType: "canon_knowledge",
        comparedAgainstId: "k",
        comparisonResult: "contradicts_canon",
        contradictionType: "lexical",
        impactScope: "x",
        validationFlags: [],
      },
      {
        contractVersion: "1",
        comparisonId: "b",
        claimId: "c",
        comparedAgainstType: "canon_knowledge",
        comparedAgainstId: "k2",
        comparisonResult: "extends_canon",
        contradictionType: null,
        impactScope: "x",
        validationFlags: [],
      },
    ];
    assert.equal(svc.listContradictions(rows).length, 1);
  });
});

describe("AuthorCanonDecisionInputSchema (domain)", () => {
  it("accepts minimal canonical payload", () => {
    const r = AuthorCanonDecisionInputSchema.safeParse({
      claimId: "c1",
      authorDecision: "reject",
      decisionReason: "Not adopting this claim.",
      resultingCanonAction: "reject_no_canon",
    });
    assert.equal(r.success, true);
  });
});

describe("merge_with_existing honesty", () => {
  it("is not a workbench decision option (schema)", () => {
    const r = ResearchWorkbenchDecisionInputSchema.safeParse({
      claimId: "c1",
      workbenchDecision: "merge_with_existing",
      decisionReason: "x",
      canonTargetType: "scene",
      canonTargetId: "s1",
      historicalRealityStatus: "likely_historical",
      storyRealityStatus: "accepted_story_canon",
    } as Record<string, unknown>);
    assert.equal(r.success, false);
  });
});
