import type { ReactNode } from "react";
import Link from "next/link";
import {
  RecordType,
  SourceType,
  VisibilityStatus,
} from "@prisma/client";
import { createSource } from "@/app/actions/sources";
import { AdminFormError } from "@/components/admin-form-error";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { StatusBadge } from "@/components/status-badge";
import { getSources } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Search = {
  visibility?: string;
  recordType?: string;
  sourceType?: string;
  error?: string;
};

function parseEnum<T extends string>(
  v: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!v) return undefined;
  return allowed.includes(v as T) ? (v as T) : undefined;
}

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filters = {
    visibility: parseEnum(sp.visibility, Object.values(VisibilityStatus)),
    recordType: parseEnum(sp.recordType, Object.values(RecordType)),
    sourceType: parseEnum(sp.sourceType, Object.values(SourceType)),
  };
  const sources = await getSources(filters);

  const filterHref = (next: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...next };
    if (merged.visibility) p.set("visibility", merged.visibility);
    if (merged.recordType) p.set("recordType", merged.recordType);
    if (merged.sourceType) p.set("sourceType", merged.sourceType);
    const q = p.toString();
    return q ? `/admin/sources?${q}` : "/admin/sources";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Sources"
        description="Archive intake: register documents and track metadata. File storage and parsing are not wired yet."
      />

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Add source</h2>
        <form action={createSource} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Title</span>
              <input name="title" required className={fieldClass} placeholder="e.g. Parish register excerpt" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Source type</span>
              <select name="sourceType" className={fieldClass} defaultValue={SourceType.NOTE}>
                {Object.values(SourceType).map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={VisibilityStatus.PRIVATE}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={RecordType.HISTORICAL}>
                {Object.values(RecordType).map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Summary</span>
            <textarea name="summary" rows={3} className={fieldClass} placeholder="What this source covers and why it matters." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Original filename</span>
              <input name="originalFilename" className={fieldClass} placeholder="As named in your archive" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>File path (optional)</span>
              <input name="filePath" className={fieldClass} placeholder="/storage/sources/..." />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Source date (free text)</span>
              <input name="sourceDate" className={fieldClass} placeholder="e.g. Spring 1842" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Source year</span>
              <input name="sourceYear" type="number" className={fieldClass} placeholder="1842" />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Author or origin</span>
            <input name="authorOrOrigin" className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Archive status</span>
              <input name="archiveStatus" className={fieldClass} placeholder="uploaded, parsed, reviewed…" />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Ingestion status</span>
              <input name="ingestionStatus" className={fieldClass} placeholder="e.g. reviewing, packet_ready" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="ingestionReady" className="rounded border-stone-300" />
            Ingestion ready
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save source
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">All sources</h2>
        <div className="space-y-2 text-sm">
          <FilterRow
            label="Visibility"
            current={sp.visibility}
            options={Object.values(VisibilityStatus)}
            buildHref={(v) => filterHref({ visibility: v })}
          />
          <FilterRow
            label="Record"
            current={sp.recordType}
            options={Object.values(RecordType)}
            buildHref={(v) => filterHref({ recordType: v })}
          />
          <FilterRow
            label="Type"
            current={sp.sourceType}
            options={Object.values(SourceType)}
            buildHref={(v) => filterHref({ sourceType: v })}
          />
          <Link href="/admin/sources" className="inline-block text-amber-900 hover:underline">
            Clear filters
          </Link>
        </div>

        {sources.length === 0 ? (
          <EmptyState title="No sources match these filters." description="Add a source above or widen your filters." />
        ) : (
          <AdminTable
            rows={sources}
            rowKey={(s) => s.id}
            columns={[
              {
                key: "title",
                header: "Title",
                cell: (s) => (
                  <Link href={`/admin/sources/${s.id}`} className="font-medium text-amber-900 hover:underline">
                    {s.title}
                  </Link>
                ),
              },
              {
                key: "meta",
                header: "Visibility / record",
                cell: (s) => <RecordMetaBadges visibility={s.visibility} recordType={s.recordType} />,
              },
              {
                key: "type",
                header: "Type",
                cell: (s) => (
                  <span className="text-stone-600">{s.sourceType.replaceAll("_", " ")}</span>
                ),
              },
              {
                key: "ingest",
                header: "Ingestion",
                cell: (s) => (
                  <span className="tabular-nums text-stone-600">
                    {s.ingestionReady ? "Ready" : "—"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Archive",
                cell: (s) => (s.archiveStatus ? <StatusBadge label={s.archiveStatus} /> : <span className="text-stone-400">—</span>),
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  current,
  options,
  buildHref,
}: {
  label: string;
  current?: string;
  options: T[];
  buildHref: (v: T | undefined) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <FilterLink active={!current} href={buildHref(undefined)}>
        All
      </FilterLink>
      {options.map((o) => (
        <FilterLink key={o} active={current === o} href={buildHref(o)}>
          {String(o).replaceAll("_", " ")}
        </FilterLink>
      ))}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-2.5 py-0.5 ${
        active
          ? "bg-stone-900 text-amber-50"
          : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {children}
    </Link>
  );
}
