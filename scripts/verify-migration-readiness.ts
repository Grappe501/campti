import { runMigrationReadinessCheckCommand } from "@/lib/certification/migration-readiness-check";

const result = runMigrationReadinessCheckCommand();
console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exit(1);
}
