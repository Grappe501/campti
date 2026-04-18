import { createHash } from "node:crypto";

/** Must match `scene-run-ledger-service` pairing of start audit id + start timestamp. */
export function computeSceneLedgerRunKey(sceneId: string, launchStartAuditId: string, startedAtMs: number): string {
  return createHash("sha256")
    .update(JSON.stringify({ sceneId, startId: launchStartAuditId, startedAtMs }))
    .digest("hex")
    .slice(0, 32);
}
