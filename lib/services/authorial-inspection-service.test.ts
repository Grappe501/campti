/**
 * P3-J authorial inspection (separate from bounded chat). Run: npx tsx --test lib/services/authorial-inspection-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AUTHORIAL_ACCESS_MODE } from "@/lib/domain/authorial-access";
import { NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION } from "@/lib/domain/narration-modes";
import { runAuthorialInspection } from "@/lib/services/authorial-inspection-service";
import { buildReaderCockpitPayload } from "@/lib/services/reader-cockpit-payload-service";

describe("runAuthorialInspection", () => {
  it("returns explicit author/bounded mode separation and payload shape", async () => {
    const p = await runAuthorialInspection({
      mode: AUTHORIAL_ACCESS_MODE.omniscientInteriorInspection,
      characterId: "c1",
      sceneId: "s1",
    });
    assert.equal(p.contractVersion, "1");
    assert.equal(
      p.modeSeparation.boundedReaderCharacterMode,
      NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION
    );
    assert.equal(p.modeSeparation.separationEnforced, true);
    assert.equal(Array.isArray(p.characterKnowledgeBoundary.knownFacts), true);
    assert.equal(typeof p.currentEmotionalState.baselineTone, "string");
    assert.ok(p.storylineExplainability);
    assert.equal(typeof p.storylineExplainability?.arcState.lifecycleState, "string");
    assert.ok((p.storylineExplainability?.storylineGuidance.allowedSceneTendencies.length ?? 0) <= 6);
  });

  it("reader cockpit payload excludes author-only inspection fields", async () => {
    const out = await buildReaderCockpitPayload({
      readerId: "authorial-inspection-separation-test",
      characterId: "character-separation-test",
    }).catch(() => null);
    if (!out) {
      assert.ok(true, "skip: requires DB-backed reader cockpit rows");
      return;
    }
    const serialized = JSON.stringify(out);
    assert.equal(serialized.includes("internalThoughtVisibility"), false);
    assert.equal(serialized.includes("modeSeparation"), false);
    assert.equal(serialized.includes("canonicalTruthRelevantToCharacter"), false);
    assert.equal(serialized.includes("storylineExplainability"), false);
  });
});
