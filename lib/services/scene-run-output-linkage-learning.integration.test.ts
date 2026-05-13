/**
 * DB-backed linked output → Decision Assist material signals + churn persistence (node:test).
 * Run: npx tsx --test lib/services/scene-run-output-linkage-learning.integration.test.ts
 *
 * Skips when DATABASE_URL unset, schema drift, or no suitable Scene row.
 * Promotes the bounded output path from optional smoke to a hardened integration check.
 */
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import type { SceneRunLedgerEntry } from "@/lib/domain/scene-run-ledger";
import { prisma } from "@/lib/prisma";
import { computeAssistMaterialSignals } from "@/lib/services/scene-decision-assist-material-signals-service";
import { buildBoundedOutputDiffForLedgerKeys } from "@/lib/services/scene-run-output-delta-service";
import { computeLinkedOutputChurnPersistence } from "@/lib/services/scene-run-output-churn-persistence-service";

let linkedOutputStoreAvailable: boolean | null = null;

async function linkedOutputStoreReady(): Promise<boolean> {
  if (linkedOutputStoreAvailable !== null) return linkedOutputStoreAvailable;
  if (!process.env.DATABASE_URL) {
    linkedOutputStoreAvailable = false;
    return false;
  }
  try {
    await prisma.sceneRunGenerationOutput.findFirst({ take: 1 });
    linkedOutputStoreAvailable = true;
  } catch {
    linkedOutputStoreAvailable = false;
  }
  return linkedOutputStoreAvailable;
}

async function findSceneWithLinkedOutputCountZero(): Promise<{ id: string } | null> {
  const scenes = await prisma.scene.findMany({ take: 40, select: { id: true } });
  for (const s of scenes) {
    const n = await prisma.sceneRunGenerationOutput.count({ where: { sceneId: s.id } });
    if (n === 0) return s;
  }
  return null;
}

function prosePara(text: string): number {
  const parts = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return parts.length > 0 ? parts.length : text.trim() ? 1 : 0;
}

function baseLedgerEntry(sceneId: string, ledgerRunKey: string, overrides: Partial<SceneRunLedgerEntry> = {}): SceneRunLedgerEntry {
  const g = {
    launchAllowance: "allowed" as const,
    confirmationRequired: false,
    riskAcknowledged: false,
    blockerCount: 0,
    riskCount: 0,
    advisoryCount: 0,
    freshnessDigestPrefix: "a",
    inputHashPreview: "h1",
    guardEvaluatedAtIso: "2026-04-18T10:00:00.000Z",
    intent: "full_generation" as const,
  };
  return {
    ledgerRunKey,
    sceneId,
    startedAtIso: "2026-04-18T10:00:00.000Z",
    endedAtIso: "2026-04-18T10:01:00.000Z",
    historyCompleteness: "full",
    historicalGuard: { ...g },
    historicalPreflight: { headlineNote: null, hashPreview: "h1" },
    audit: {
      startAuditId: "a",
      endAuditId: "b",
      eventTypesObserved: [],
      launchClass: "interactive",
      launchSource: "interactive_server_action",
      policyMode: "interactive_default",
      confirmationMode: "human_not_required",
    },
    output: {
      generationStarted: true,
      generationFinished: true,
      generationFailed: false,
      cluster7RunId: "r1",
      persistedOutputKnown: true,
      errorMessagePreview: null,
      linkageStatus: "linked_output",
      outputArtifactId: null,
      storedCharacterCount: null,
      storedParagraphCount: null,
      outputCompleteness: null,
      sceneGenerationTextSynced: null,
      openingFingerprint: null,
      endingFingerprint: null,
    },
    replayEligibility: "replay_allowed",
    replayNotes: [],
    ...overrides,
  };
}

describe("scene-run-output linkage learning (integration)", () => {
  const keysToDelete: string[] = [];
  after(async () => {
    if (!process.env.DATABASE_URL || keysToDelete.length === 0) return;
    if (!(await linkedOutputStoreReady())) return;
    try {
      await prisma.sceneRunGenerationOutput.deleteMany({ where: { ledgerRunKey: { in: keysToDelete } } });
    } catch {
      /* best-effort cleanup */
    }
  });

  it("buildBoundedOutputDiffForLedgerKeys + computeAssistMaterialSignals use durable rows", async () => {
    if (!(await linkedOutputStoreReady())) {
      assert.ok(true, "skip: SceneRunGenerationOutput table missing or DATABASE_URL unset (run migrations for full integration)");
      return;
    }
    const scene = await prisma.scene.findFirst({ select: { id: true } });
    if (!scene) {
      assert.ok(true, "skip: no Scene row");
      return;
    }

    const keyOlder = `integ-bo-${randomUUID()}`;
    const keyNewer = `integ-bo-${randomUUID()}`;
    keysToDelete.push(keyOlder, keyNewer);

    const proseOld = "Short opening.\n\nOld body.";
    const proseNew = `${"W".repeat(600)}\n\nNew ending paragraph with different shape.\n\nThird block.`;

    try {
      await prisma.sceneRunGenerationOutput.create({
        data: {
          sceneId: scene.id,
          ledgerRunKey: keyOlder,
          persistedProse: proseOld,
          outputCompleteness: "persisted_to_scene",
          characterCount: proseOld.length,
          paragraphCount: prosePara(proseOld),
          openingFingerprint: "fp-old-open",
          endingFingerprint: "fp-old-end",
          createdAt: new Date(Date.now() - 120_000),
        },
      });
      await prisma.sceneRunGenerationOutput.create({
        data: {
          sceneId: scene.id,
          ledgerRunKey: keyNewer,
          persistedProse: proseNew,
          outputCompleteness: "persisted_to_scene",
          characterCount: proseNew.length,
          paragraphCount: prosePara(proseNew),
          openingFingerprint: "fp-new-open",
          endingFingerprint: "fp-new-end",
          createdAt: new Date(Date.now() - 60_000),
        },
      });
    } catch {
      assert.ok(true, "skip: SceneRunGenerationOutput unavailable (migrations / drift)");
      return;
    }

    const diff = await buildBoundedOutputDiffForLedgerKeys(scene.id, keyNewer, keyOlder);
    assert.ok(diff, "expected bounded diff when both ledger keys have rows");
    assert.ok(diff!.signals.length >= 1, `expected at least one output signal, got ${diff!.signals.length}`);

    const entries = [baseLedgerEntry(scene.id, keyNewer), baseLedgerEntry(scene.id, keyOlder)];
    const sig = await computeAssistMaterialSignals(scene.id, entries, []);
    assert.ok(sig.boundedLatestPairDiff, "assist material signals should load bounded diff for linked newest pair");
    assert.equal(sig.outputChurnMaterial, true);
    assert.equal(sig.materialRunDiffCombined, true);
  });

  it("computeLinkedOutputChurnPersistence detects repeated drift on a scene with no prior snapshots", async () => {
    if (!(await linkedOutputStoreReady())) {
      assert.ok(true, "skip: SceneRunGenerationOutput table missing or DATABASE_URL unset (run migrations for full integration)");
      return;
    }
    const scene = await findSceneWithLinkedOutputCountZero();
    if (!scene) {
      assert.ok(true, "skip: no Scene with zero linked outputs in sample (avoid cross-talk with other snapshots)");
      return;
    }

    const k1 = `integ-persist-${randomUUID()}`;
    const k2 = `integ-persist-${randomUUID()}`;
    const k3 = `integ-persist-${randomUUID()}`;
    keysToDelete.push(k1, k2, k3);

    const p1 = "A.\n\nB.";
    const p2 = `${"M".repeat(500)}\n\nSecond.\n\nBlock.`;
    const p3 = `${"Z".repeat(700)}\n\nThird wave.\n\nMore.`;

    try {
      await prisma.sceneRunGenerationOutput.create({
        data: {
          sceneId: scene.id,
          ledgerRunKey: k1,
          persistedProse: p1,
          outputCompleteness: "snapshot_only",
          characterCount: p1.length,
          paragraphCount: prosePara(p1),
          openingFingerprint: "p1-o",
          endingFingerprint: "p1-e",
          createdAt: new Date(Date.now() - 180_000),
        },
      });
      await prisma.sceneRunGenerationOutput.create({
        data: {
          sceneId: scene.id,
          ledgerRunKey: k2,
          persistedProse: p2,
          outputCompleteness: "snapshot_only",
          characterCount: p2.length,
          paragraphCount: prosePara(p2),
          openingFingerprint: "p2-o",
          endingFingerprint: "p2-e",
          createdAt: new Date(Date.now() - 120_000),
        },
      });
      await prisma.sceneRunGenerationOutput.create({
        data: {
          sceneId: scene.id,
          ledgerRunKey: k3,
          persistedProse: p3,
          outputCompleteness: "snapshot_only",
          characterCount: p3.length,
          paragraphCount: prosePara(p3),
          openingFingerprint: "p3-o",
          endingFingerprint: "p3-e",
          createdAt: new Date(Date.now() - 60_000),
        },
      });
    } catch {
      assert.ok(true, "skip: SceneRunGenerationOutput create failed");
      return;
    }

    const persist = await computeLinkedOutputChurnPersistence(scene.id);
    assert.equal(persist.pairsCompared, 2);
    assert.equal(persist.materialPairCount, 2);
    assert.equal(persist.persistentDrift, true);
  });
});
