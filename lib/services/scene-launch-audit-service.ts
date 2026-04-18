import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SceneLaunchAuditWriteInput = {
  sceneId: string;
  eventType: string;
  launchAllowance?: string | null;
  freshnessDigestPrefix?: string | null;
  blockerCount?: number | null;
  riskCount?: number | null;
  advisoryCount?: number | null;
  confirmationRequired?: boolean | null;
  riskAcknowledged?: boolean | null;
  guardEvaluatedAtIso?: string | null;
  inputHashPreview?: string | null;
  finalAction?: string | null;
  errorMessage?: string | null;
  intent?: string | null;
  meta?: Record<string, unknown> | null;
  launchClass?: string | null;
  launchSource?: string | null;
  policyMode?: string | null;
  confirmationMode?: string | null;
};

/**
 * Persists launch guard audit rows. Fails soft if the table is absent (older deploys).
 */
export async function writeSceneLaunchAudit(
  input: SceneLaunchAuditWriteInput,
): Promise<{ id: string; createdAt: Date } | null> {
  try {
    const row = await prisma.sceneLaunchAuditLog.create({
      data: {
        sceneId: input.sceneId,
        eventType: input.eventType,
        launchAllowance: input.launchAllowance ?? null,
        freshnessDigestPrefix: input.freshnessDigestPrefix ?? null,
        blockerCount: input.blockerCount ?? null,
        riskCount: input.riskCount ?? null,
        advisoryCount: input.advisoryCount ?? null,
        confirmationRequired: input.confirmationRequired ?? null,
        riskAcknowledged: input.riskAcknowledged ?? null,
        guardEvaluatedAtIso: input.guardEvaluatedAtIso ?? null,
        inputHashPreview: input.inputHashPreview ?? null,
        finalAction: input.finalAction ?? null,
        errorMessage: input.errorMessage ?? null,
        intent: input.intent ?? null,
        meta: input.meta ? (input.meta as Prisma.InputJsonValue) : undefined,
        launchClass: input.launchClass ?? null,
        launchSource: input.launchSource ?? null,
        policyMode: input.policyMode ?? null,
        confirmationMode: input.confirmationMode ?? null,
      },
    });
    return { id: row.id, createdAt: row.createdAt };
  } catch {
    return null;
  }
}
