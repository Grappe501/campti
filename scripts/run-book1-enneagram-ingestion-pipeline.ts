import path from "node:path";

import { Book1EnneagramIngestionPipelineService } from "@/lib/services/book1-enneagram-ingestion-pipeline-service";

function parseArgs(argv: string[]): { sourcePath: string | null } {
  const sourceFlag = argv.find((arg) => arg.startsWith("--source="));
  if (!sourceFlag) return { sourcePath: null };
  const value = sourceFlag.slice("--source=".length).trim();
  return { sourcePath: value.length > 0 ? value : null };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = args.sourcePath ? path.resolve(process.cwd(), args.sourcePath) : undefined;

  const service = new Book1EnneagramIngestionPipelineService({ sourcePath });
  const result = await service.run();

  console.log(
    JSON.stringify(
      {
        ok: true,
        reports: {
          sourceIngest: path.relative(process.cwd(), result.sourceReportPath).replaceAll("\\", "/"),
          normalizedModel: path.relative(process.cwd(), result.normalizedModelReportPath).replaceAll("\\", "/"),
          characterBinding: path.relative(process.cwd(), result.characterBindingReportPath).replaceAll("\\", "/"),
          reviewQueue: path.relative(process.cwd(), result.reviewQueueReportPath).replaceAll("\\", "/"),
        },
        unresolvedMappings: result.reviewQueue.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[book1-enneagram-ingestion] failed: ${message}`);
  process.exitCode = 1;
});
