import Link from "next/link";
import {
  RecordType,
  SourceType,
  VisibilityStatus,
} from "@prisma/client";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getSourcesForIngestionList } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Search = {
  visibility?: string;
  recordType?: string;
  sourceType?: string;
  archiveStatus?: string;
  ingestionStatus?: string;
};

function parseEnum<T extends string>(
  v: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!v) return undefined;
  return allowed.includes(v as T) ? (v as T) : undefined;
}

const INGESTION_STATUSES = [
  "uploaded",
  "packet_ready",
  "extracted",
  "reviewing",
  "linked",
  "archived",
  "failed",
] as const;

export default async function AdminIngestionPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filters = {
    visibility: parseEnum(sp.visibility, Object.values(VisibilityStatus)),
    recordType: parseEnum(sp.recordType, Object.values(RecordType)),
    sourceType: parseEnum(sp.sourceType, Object.values(SourceType)),
    archiveStatus: sp.archiveStatus?.trim() || undefined,
    ingestionStatus: sp.ingestionStatus?.trim() || undefined,
  };

  const rows = await getSourcesForIngestionList(filters);

  const filterHref = (next: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...next };
    if (merged.visibility) p.set("visibility", merged.visibility);
    if (merged.recordType) p.set("recordType", merged.recordType);
    if (merged.sourceType) p.set("sourceType", merged.sourceType);
    if (merged.archiveStatus) p.set("archiveStatus", merged.archiveStatus);
    if (merged.ingestionStatus) p.set("ingestionStatus", merged.ingestionStatus);
    const q = p.toString();
    return q ? `/admin/ingestion?${q}` : "/admin/ingestion";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        title="Ingestion"
        description="Archive control center: source text, packets, extraction runs, and review. One file at a time."
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Filters</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" method="get">
          <label className={labelClass}>
            <span className={labelSpanClass}>Visibility</span>
            <select name="visibility" className={fieldClass} defaultValue={sp.visibility ?? ""}>
              <option value="">Any</option>
              {Object.values(VisibilityStatus).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Source type</span>
            <select name="sourceType" className={fieldClass} defaultValue={sp.sourceType ?? ""}>
              <option value="">Any</option>
              {Object.values(SourceType).map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={sp.recordType ?? ""}>
              <option value="">Any</option>
              {Object.values(RecordType).map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Archive status</span>
            <input
              name="archiveStatus"
              className={fieldClass}
              placeholder="e.g. reviewed"
              defaultValue={sp.archiveStatus ?? ""}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Ingestion status</span>
            <select name="ingestionStatus" className={fieldClass} defaultValue={sp.ingestionStatus ?? ""}>
              <option value="">Any</option>
              {INGESTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
            >
              Apply
            </button>
            <Link href="/admin/ingestion" className="text-sm text-amber-900 hover:underline">
              Clear
            </Link>
          </div>
        </form>
        <p className="mt-3 text-xs text-stone-500">
          Quick:{" "}
          <Link className="text-amber-900 hover:underline" href={filterHref({ ingestionStatus: "reviewing" })}>
            reviewing
          </Link>
          {" · "}
          <Link className="text-amber-900 hover:underline" href={filterHref({ archiveStatus: "reviewed" })}>
            archive reviewed
          </Link>
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Sources
        </h2>
        <AdminTable
          rows={rows}
          rowKey={(r) => r.id}
          empty={
            <EmptyState
              title="No sources match"
              description="Adjust filters or add a source under Sources."
            />
          }
          columns={[
            {
              key: "title",
              header: "Source",
              cell: (r) => (
                <div>
                  <Link href={`/admin/ingestion/${r.id}`} className="font-medium text-amber-900 hover:underline">
                    {r.title}
                  </Link>
                  <p className="text-xs text-stone-500">
                    <Link href={`/admin/sources/${r.id}`} className="hover:underline">
                      Archive detail
                    </Link>
                  </p>
                </div>
              ),
            },
            {
              key: "ingestion",
              header: "Ingestion",
              cell: (r) =>
                r.ingestionStatus ? (
                  <StatusBadge label={r.ingestionStatus.replaceAll("_", " ")} />
                ) : (
                  <span className="text-stone-500">—</span>
                ),
            },
            {
              key: "runs",
              header: "Runs / entities",
              cell: (r) => (
                <span className="text-stone-700">
                  {r._count.ingestionRuns} runs · {r._count.extractedEntities} extracted
                </span>
              ),
            },
            {
              key: "packet",
              header: "Packet / result",
              cell: (r) => {
                const run = r.lastIngestionRun;
                if (!run) return <span className="text-stone-500">No run yet</span>;
                return (
                  <div className="text-xs text-stone-700">
                    <p>
                      Packet:{" "}
                      {run.extractionPacket ? (
                        <span>{run.extractionPacket.readyForAI ? "ready" : "draft"}</span>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p>
                      Result:{" "}
                      {run.extractionResult ? (
                        <Link
                          href={`/admin/runs/${run.id}`}
                          className="text-amber-900 hover:underline"
                        >
                          {run.extractionResult.status}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                );
              },
            },
            {
              key: "last",
              header: "Last run",
              cell: (r) =>
                r.lastIngestionRun ? (
                  <Link
                    href={`/admin/runs/${r.lastIngestionRun.id}`}
                    className="text-amber-900 hover:underline"
                  >
                    {r.lastIngestionRun.status}
                  </Link>
                ) : (
                  <span className="text-stone-500">—</span>
                ),
            },
          ]}
        />
      </section>
    </div>
  );
}
