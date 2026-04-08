import Link from "next/link";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { createClaim } from "@/app/actions/claims";
import { AdminFormError } from "@/components/admin-form-error";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getClaims, getSources } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Search = {
  needsReview?: string;
  confidence?: string;
  sourceId?: string;
  error?: string;
};

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filters = {
    needsReview:
      sp.needsReview === "true" ? true : sp.needsReview === "false" ? false : undefined,
    confidence:
      sp.confidence && /^\d+$/.test(sp.confidence)
        ? Math.min(5, Math.max(1, Number(sp.confidence)))
        : undefined,
    sourceId: sp.sourceId?.length ? sp.sourceId : undefined,
  };
  const [claims, sources] = await Promise.all([getClaims(filters), getSources()]);

  const filterHref = (next: Partial<Search>) => {
    const merged = { ...sp, ...next };
    const p = new URLSearchParams();
    if (merged.needsReview) p.set("needsReview", merged.needsReview);
    if (merged.confidence) p.set("confidence", merged.confidence);
    if (merged.sourceId) p.set("sourceId", merged.sourceId);
    const q = p.toString();
    return q ? `/admin/claims?${q}` : "/admin/claims";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Claims"
        description="Verified statements tied to sources. Confidence and review flags support a deliberate verification workflow."
      />
      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Create claim</h2>
        <form action={createClaim} className="mt-4 space-y-4">
          <label className={labelClass}>
            <span className={labelSpanClass}>Source</span>
            <select name="sourceId" required className={fieldClass}>
              <option value="">Select a source</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" required rows={4} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Confidence (1–5)</span>
              <input name="confidence" type="number" min={1} max={5} required defaultValue={3} className={fieldClass} />
            </label>
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
            <span className={labelSpanClass}>Quote excerpt</span>
            <textarea name="quoteExcerpt" rows={2} className={fieldClass} placeholder="Exact wording from the source when available." />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="needsReview" defaultChecked className="rounded border-stone-300" />
            Needs review
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save claim
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">All claims</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={filterHref({ needsReview: "true", confidence: undefined, sourceId: undefined })}
            className={`rounded-full px-3 py-1 ${sp.needsReview === "true" ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
          >
            Needs review
          </Link>
          <Link
            href={filterHref({ needsReview: "false" })}
            className={`rounded-full px-3 py-1 ${sp.needsReview === "false" ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
          >
            Reviewed
          </Link>
          <Link href={filterHref({ needsReview: undefined })} className="rounded-full px-3 py-1 text-amber-900 hover:underline">
            All review states
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-medium uppercase text-stone-500">Confidence</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              href={filterHref({ confidence: String(n) })}
              className={`rounded-full px-2 py-0.5 ${sp.confidence === String(n) ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
            >
              {n}
            </Link>
          ))}
          <Link href={filterHref({ confidence: undefined })} className="text-amber-900 hover:underline">
            Any
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase text-stone-500">Source</span>
          <div className="flex flex-wrap gap-1 text-sm">
            <Link href={filterHref({ sourceId: undefined })} className="text-amber-900 hover:underline">
              All sources
            </Link>
            {sources.slice(0, 12).map((s) => (
              <Link
                key={s.id}
                href={filterHref({ sourceId: s.id })}
                className={`max-w-[140px] truncate rounded-full px-2 py-0.5 ${sp.sourceId === s.id ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
                title={s.title}
              >
                {s.title}
              </Link>
            ))}
          </div>
        </div>

        {claims.length === 0 ? (
          <EmptyState title="No claims match." description="Create one above or adjust filters." />
        ) : (
          <AdminTable
            rows={claims}
            rowKey={(c) => c.id}
            columns={[
              {
                key: "desc",
                header: "Claim",
                cell: (c) => (
                  <Link href={`/admin/claims/${c.id}`} className="font-medium text-amber-900 hover:underline">
                    {c.description.slice(0, 100)}
                    {c.description.length > 100 ? "…" : ""}
                  </Link>
                ),
              },
              {
                key: "source",
                header: "Source",
                cell: (c) => (
                  <Link href={`/admin/sources/${c.source.id}`} className="text-stone-700 hover:underline">
                    {c.source.title}
                  </Link>
                ),
              },
              {
                key: "conf",
                header: "Conf.",
                className: "tabular-nums w-16",
                cell: (c) => c.confidence,
              },
              {
                key: "review",
                header: "Review",
                cell: (c) => (c.needsReview ? <StatusBadge label="needs review" /> : <span className="text-stone-500">OK</span>),
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
