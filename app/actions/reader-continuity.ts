"use server";

import type { ReaderContinuityCacheSnapshot } from "@/lib/domain/reader-continuity";
import { getCamptiSessionId } from "@/lib/campti-session";
import { loadReaderContinuity } from "@/lib/services/reader-continuity-service";

export async function actionReconcileReaderContinuity(
  cacheSnapshot?: ReaderContinuityCacheSnapshot | null
) {
  const sessionId = await getCamptiSessionId();
  if (!sessionId) return null;
  return loadReaderContinuity({
    sessionId,
    readerId: sessionId,
    cacheSnapshot: cacheSnapshot ?? null,
  });
}
