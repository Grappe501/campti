import { prisma } from "@/lib/prisma";

export type RuntimeDependencyFailureKind =
  | "schema_dependency_missing"
  | "seed_data_missing"
  | "runtime_failure";

export type RuntimeDependencyDescriptor = {
  tables?: string[];
  columns?: Array<{ table: string; column: string }>;
};

type DependencyCheckResult = {
  missingTables: string[];
  missingColumns: Array<{ table: string; column: string }>;
};

type ExistsRow = { exists_text: string | null };
type OneRow = { one: number };

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function resolveMissingTables(tables: string[]): Promise<string[]> {
  const missing: string[] = [];
  for (const table of tables) {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT to_regclass($1)::text AS exists_text`,
      `public."${table}"`
    )) as ExistsRow[];
    const present = rows[0]?.exists_text != null;
    if (!present) missing.push(table);
  }
  return missing;
}

async function resolveMissingColumns(
  columns: Array<{ table: string; column: string }>
): Promise<Array<{ table: string; column: string }>> {
  const missing: Array<{ table: string; column: string }> = [];
  for (const dep of columns) {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT 1 AS one FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      dep.table,
      dep.column
    )) as OneRow[];
    if (!rows.length || rows[0]?.one !== 1) {
      missing.push(dep);
    }
  }
  return missing;
}

export async function inspectRuntimeDependencies(
  deps: RuntimeDependencyDescriptor
): Promise<DependencyCheckResult> {
  const tables = unique((deps.tables ?? []).filter((t) => t.trim().length > 0));
  const columns = (deps.columns ?? []).filter(
    (d) => d.table.trim().length > 0 && d.column.trim().length > 0
  );

  const [missingTables, missingColumns] = await Promise.all([
    resolveMissingTables(tables),
    resolveMissingColumns(columns),
  ]);

  return { missingTables, missingColumns };
}

export async function assertRuntimeDependencies(
  context: string,
  deps: RuntimeDependencyDescriptor
): Promise<void> {
  const result = await inspectRuntimeDependencies(deps);
  if (!result.missingTables.length && !result.missingColumns.length) {
    return;
  }

  const tableMsg = result.missingTables.length
    ? `missing tables: ${result.missingTables.join(", ")}`
    : null;
  const columnMsg = result.missingColumns.length
    ? `missing columns: ${result.missingColumns.map((c) => `${c.table}.${c.column}`).join(", ")}`
    : null;
  const detail = [tableMsg, columnMsg].filter(Boolean).join("; ");

  throw new Error(
    `[runtime-dependency:${context}] ${detail}. Apply migrations and ensure schema is up to date (try: npx prisma migrate deploy).`
  );
}

export function classifyRuntimeDependencyFailure(error: unknown): {
  kind: RuntimeDependencyFailureKind;
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    /\[runtime-dependency:/.test(message) ||
    /p2021|p2022|does not exist|missing tables|missing columns|schema is up to date|migration drift/.test(
      normalized
    )
  ) {
    return { kind: "schema_dependency_missing", message };
  }

  if (/could not resolve scene\/character anchors|need at least one scene and one person/i.test(message)) {
    return { kind: "seed_data_missing", message };
  }

  return { kind: "runtime_failure", message };
}
