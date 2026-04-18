import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

function paragraphCount(text: string): number {
  const parts = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return parts.length > 0 ? parts.length : text.trim() ? 1 : 0;
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function fingerprintSlice(text: string, fromEnd: boolean): string {
  const t = normalizeWhitespace(text);
  const slice = fromEnd ? t.slice(Math.max(0, t.length - 200)) : t.slice(0, Math.min(200, t.length));
  return createHash("sha256").update(slice).digest("hex").slice(0, 16);
}

/**
 * Persists a durable prose snapshot for a guarded launch (best-effort if table missing).
 */
export async function persistSceneRunGenerationOutputRecord(params: {
  sceneId: string;
  ledgerRunKey: string;
  startAuditId: string | null;
  endAuditId: string | null;
  cluster7RunId: string | null;
  generatedText: string;
  saveGenerationTextRequested: boolean;
  savedToScene: boolean;
  generationTextSaveBlockedByRealism?: boolean;
  generationTextSaveBlockedByHumanGravity?: boolean;
  launchClass: string | null;
  launchSource: string | null;
  intent: string | null;
}): Promise<void> {
  let outputCompleteness: "persisted_to_scene" | "snapshot_only" | "blocked_save_realism" | "blocked_save_human_gravity";
  if (params.savedToScene) {
    outputCompleteness = "persisted_to_scene";
  } else if (params.generationTextSaveBlockedByRealism) {
    outputCompleteness = "blocked_save_realism";
  } else if (params.generationTextSaveBlockedByHumanGravity) {
    outputCompleteness = "blocked_save_human_gravity";
  } else {
    outputCompleteness = "snapshot_only";
  }

  const prose = params.generatedText ?? "";
  const pc = paragraphCount(prose);
  const cc = prose.length;

  try {
    await prisma.sceneRunGenerationOutput.upsert({
      where: { ledgerRunKey: params.ledgerRunKey },
      create: {
        sceneId: params.sceneId,
        ledgerRunKey: params.ledgerRunKey,
        launchStartAuditId: params.startAuditId,
        launchEndAuditId: params.endAuditId,
        cluster7RunId: params.cluster7RunId,
        persistedProse: prose,
        sceneGenerationTextSynced: params.savedToScene,
        outputCompleteness,
        characterCount: cc,
        paragraphCount: pc,
        openingFingerprint: fingerprintSlice(prose, false),
        endingFingerprint: fingerprintSlice(prose, true),
        launchClass: params.launchClass,
        launchSource: params.launchSource,
        intent: params.intent,
      },
      update: {
        launchEndAuditId: params.endAuditId,
        cluster7RunId: params.cluster7RunId,
        persistedProse: prose,
        sceneGenerationTextSynced: params.savedToScene,
        outputCompleteness,
        characterCount: cc,
        paragraphCount: pc,
        openingFingerprint: fingerprintSlice(prose, false),
        endingFingerprint: fingerprintSlice(prose, true),
        launchClass: params.launchClass,
        launchSource: params.launchSource,
        intent: params.intent,
      },
    });
  } catch {
    // Older deploys / migration not applied — do not block launch path.
  }
}
