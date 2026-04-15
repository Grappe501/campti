/**
 * P4-H background maintenance runner.
 */
import {
  aggregateEngagementForDate,
  cleanupEndedSessions,
  compactLedgerEntries,
} from "@/lib/services/background-maintenance-service";
import { assertRuntimeDependencies } from "@/lib/services/runtime-dependency-guard";

async function main() {
  await assertRuntimeDependencies("ops-background-maintenance", {
    tables: ["CharacterConversationSession", "ReaderInteractionLedgerEntry"],
  });

  const cleaned = await cleanupEndedSessions({ olderThanDays: 30 });
  const compacted = await compactLedgerEntries({ olderThanDays: 21 });
  const today = new Date().toISOString().slice(0, 10);
  const agg = await aggregateEngagementForDate(today);
  console.log(
    JSON.stringify(
      {
        cleanedSessions: cleaned,
        compacted,
        aggregate: agg,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ops:background-maintenance] ${message}`);
  process.exit(1);
});

