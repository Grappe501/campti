import { join } from "node:path";

import { runCamptiConsciousnessSafeIngestion } from "@/lib/services/campti-consciousness-safe-ingest-service";

function resolveInputRoots(argv: string[]): string[] {
  const cliRoots = argv
    .filter((arg) => arg.startsWith("--inputRoot="))
    .map((arg) => arg.slice("--inputRoot=".length).trim())
    .filter(Boolean);

  if (cliRoots.length > 0) {
    return cliRoots.map((root) => (root.includes(":") ? root : join(process.cwd(), root)));
  }

  return [join(process.cwd(), "uploads", "incoming")];
}

void (async () => {
  const inputRoots = resolveInputRoots(process.argv.slice(2));
  const result = await runCamptiConsciousnessSafeIngestion({
    workspaceRoot: process.cwd(),
    inputRoots,
    reportRoot: join(process.cwd(), "reports"),
  });

  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
