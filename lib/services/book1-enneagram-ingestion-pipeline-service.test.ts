import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { Book1EnneagramIngestionPipelineService } from "@/lib/services/book1-enneagram-ingestion-pipeline-service";

describe("book1-enneagram-ingestion-pipeline-service", () => {
  it("produces governed artifacts and 54 state expressions", async () => {
    const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "campti-enneagram-ingest-"));
    try {
      const sourcePath = path.join(tmpRoot, "uploaded-enneagram.json");
      const reportsDirectory = path.join(tmpRoot, "reports");
      await writeFile(
        sourcePath,
        JSON.stringify(
          {
            artifact: "chapter_enneagram_consciousness_engine",
            schemaVersion: "1.0.0",
            generatedAt: "2026-04-16T19:18:53.853Z",
            characters: [
              {
                character: "Alexis",
                coreStructure: {
                  enneagramType: "6",
                  wing: "w5",
                  instinctualStack: ["sp", "so", "sx"],
                },
                stressSecurityMovement: {
                  underPressure: "worst-case chaining and rapid doubt loops",
                  inGrowth: "grounded caution with cooperative trust",
                },
                levelsOfDevelopment: {
                  currentAwarenessLevel: "high",
                  selfAwareness: "self-narration accuracy 78% with partial blind spots",
                },
                relationshipFieldBehavior: {
                  intimateBehavior: "selective disclosure",
                  kinshipRole: "kin continuity guardian",
                  powerWorkBehavior: "tests authority reliability",
                  socialGroupBehavior: "slow trust gating",
                },
                attentionEngine: {
                  noticesFirst: "threat-first scan",
                  ignores: "comfort cues",
                  overFocusesOn: "seam drift",
                },
                distortionEngine: {
                  misinterpretsRealityAs: "silence equals consent",
                  coreNarrativeBias: "betrayal expectancy",
                },
                defenseMechanism: {
                  psychologicalProtectionPattern: "suspicion as certainty",
                },
                spiritualOrientation: {
                  seeks: "ritual continuity",
                  distorts: "uncertainty as betrayal",
                  experiencesMeaning: "embodied trust cadence",
                },
                languageImpact: {
                  sentenceStructure: "conditional phrasing",
                  silenceVsSpeech: "silence as control gate",
                  emotionalExpression: "contained vigilance",
                  abstractionVsEmbodiment: "body cues before thesis",
                },
              },
            ],
          },
          null,
          2,
        ),
        "utf8",
      );

      const service = new Book1EnneagramIngestionPipelineService({
        sourcePath,
        reportsDirectory,
      });
      const result = await service.run();

      const normalized = JSON.parse(await readFile(result.normalizedModelReportPath, "utf8")) as {
        normalized: { stateExpressions: unknown[] };
      };
      const sourceIngest = JSON.parse(await readFile(result.sourceReportPath, "utf8")) as {
        sourceRegistration: { preservation: { preservedExactly: boolean; rawSourceTextExact: string } };
      };
      const binding = JSON.parse(await readFile(result.characterBindingReportPath, "utf8")) as {
        bindings: Array<{ character: string; mediationRouting: { allowDirectSourceToRenderer: boolean } }>;
      };

      assert.equal(normalized.normalized.stateExpressions.length, 54);
      assert.equal(sourceIngest.sourceRegistration.preservation.preservedExactly, true);
      assert.ok(sourceIngest.sourceRegistration.preservation.rawSourceTextExact.includes("\"artifact\""));
      assert.equal(binding.bindings[0]?.character, "Alexis");
      assert.equal(binding.bindings[0]?.mediationRouting.allowDirectSourceToRenderer, false);
    } finally {
      await rm(tmpRoot, { recursive: true, force: true });
    }
  });
});
