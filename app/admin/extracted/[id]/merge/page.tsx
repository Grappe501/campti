import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  linkExtractedToCanonicalAction,
  mergeExtractedIntoCanonicalAction,
} from "@/app/actions/entity-linking";
import { promoteExtractedEntityAction } from "@/app/actions/extracted-entity";
import {
  getExtractedEntityById,
  getMergeComparisonData,
} from "@/lib/data-access";
import {
  buildMergeComparison,
  buildMergePreview,
} from "@/lib/entity-merge";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    canonicalType?: string;
    canonicalId?: string;
    error?: string;
  }>;
};

function excerptFromProposed(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const ex = o.sourceExcerpt ?? o.quoteExcerpt;
  return typeof ex === "string" && ex.trim().length ? ex.trim() : null;
}

function ConfidenceHeat({ confidence }: { confidence: number | null }) {
  const c = confidence ?? null;
  const tone =
    c == null
      ? "bg-stone-200"
      : c >= 5
        ? "bg-emerald-500"
        : c >= 3
          ? "bg-amber-500"
          : "bg-rose-500";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${tone}`} aria-hidden />
      <span>{c ?? "—"}</span>
    </span>
  );
}

function PreviewBlock({
  title,
  preview,
}: {
  title: string;
  preview: ReturnType<typeof buildMergePreview>;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>

      {preview.potentialConflicts.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">⚠ Potential conflict detected</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-amber-950/90">
            {preview.potentialConflicts.map((c) => (
              <li key={c} className="break-words">
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Will update
          </p>
          {preview.willUpdate.length ? (
            <ul className="mt-2 space-y-1 text-sm text-stone-800">
              {preview.willUpdate.map((u) => (
                <li key={u.key} className="break-words">
                  <span className="font-medium">{u.label}</span>{" "}
                  <span className="text-stone-500">
                    ({String(u.from ?? "empty")} → {String(u.to ?? "empty")})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">None.</p>
          )}
        </div>
        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Will NOT change
          </p>
          {preview.willNotChange.length ? (
            <ul className="mt-2 space-y-1 text-sm text-stone-800">
              {preview.willNotChange.slice(0, 6).map((n) => (
                <li key={n.key} className="break-words">
                  <span className="font-medium">{n.label}</span>{" "}
                  <span className="text-stone-500">({n.reason})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">—</p>
          )}
        </div>
        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Will add
          </p>
          {preview.willAdd.length ? (
            <ul className="mt-2 space-y-1 text-sm text-stone-800">
              {preview.willAdd.map((a, i) => (
                <li key={`${a.kind}:${i}`} className="break-words">
                  <span className="font-medium">{a.kind}</span>: {a.detail}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">None.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AdminExtractedMergePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const canonicalType = sp.canonicalType?.trim() ?? "";
  const canonicalId = sp.canonicalId?.trim() ?? "";

  if (!canonicalType || !canonicalId) notFound();

  const [entity, comparisonData] = await Promise.all([
    getExtractedEntityById(id),
    getMergeComparisonData(id, canonicalType, canonicalId),
  ]);
  if (!entity || !comparisonData) notFound();

  const excerpt = excerptFromProposed(entity.proposedData);
  const comparison = buildMergeComparison({
    extracted: comparisonData.extracted,
    canonicalType,
    canonical: comparisonData.canonical,
  });

  const defaultCreateAlias =
    Boolean(comparison.suggestedAliasLabel) &&
    comparison.suggestedAliasLabel?.trim().toLowerCase() !== comparison.canonicalLabel.trim().toLowerCase();

  const previewLinkOnly = buildMergePreview({
    extractedEntityType: entity.entityType,
    decision: "link_only",
    comparison,
    createAlias: defaultCreateAlias,
  });

  const previewMerge = buildMergePreview({
    extractedEntityType: entity.entityType,
    decision: "merge_conservative",
    comparison,
    createAlias: defaultCreateAlias,
  });

  const previewPromote = buildMergePreview({
    extractedEntityType: entity.entityType,
    decision: "promote_new",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link href={`/admin/extracted/${entity.id}`} className="text-sm text-amber-900 hover:underline">
          ← Back to extracted detail
        </Link>
        <PageHeader
          title="Truth arbitration: merge decision"
          description="Fast, explicit decisions with preview + traceability."
        />
      </div>

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm text-sm">
        <h2 className="text-lg font-medium text-stone-900">Context</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs uppercase text-stone-500">Extracted</dt>
            <dd className="font-medium text-stone-900">
              {comparison.extractedLabel}
            </dd>
            <dd className="mt-1 text-xs text-stone-500 font-mono">{entity.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Entity type</dt>
            <dd className="font-medium text-stone-900">{entity.entityType}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Confidence</dt>
            <dd className="font-medium text-stone-900">
              <ConfidenceHeat confidence={entity.confidence ?? null} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Source</dt>
            <dd>
              <Link href={`/admin/sources/${entity.sourceId}`} className="text-amber-900 hover:underline">
                {entity.source.title}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Ingestion run</dt>
            <dd>
              <Link href={`/admin/runs/${entity.ingestionRunId}`} className="font-mono text-xs text-amber-900 hover:underline">
                {entity.ingestionRunId}
              </Link>
              <span className="ml-2">
                <StatusBadge label={entity.ingestionRun.status} />
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Reviewer notes</dt>
            <dd className="text-stone-800">{entity.reviewerNotes ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <DetailSection title="Side-by-side compare">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Extracted (proposed)
            </p>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              {comparison.extractedLabel}
            </h3>
            {excerpt ? (
              <blockquote className="mt-3 border-l-4 border-amber-800/30 pl-4 text-sm italic text-stone-800">
                {excerpt}
              </blockquote>
            ) : null}
            <div className="mt-4 space-y-3">
              {comparison.fields.map((f) => (
                <div key={f.key} className="rounded-lg bg-stone-50 p-3">
                  <p className="text-xs font-semibold text-stone-700">{f.label}</p>
                  <p className="mt-1 text-sm text-stone-900 break-words">
                    {f.extractedValue == null || f.extractedValue === ""
                      ? "—"
                      : String(f.extractedValue)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Canonical (current)
            </p>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              {comparison.canonicalLabel}
            </h3>
            <p className="mt-1 text-xs text-stone-500 font-mono">{comparison.canonicalId}</p>
            <div className="mt-4 space-y-3">
              {comparison.fields.map((f) => (
                <div key={f.key} className="rounded-lg bg-stone-50 p-3">
                  <p className="text-xs font-semibold text-stone-700">{f.label}</p>
                  <p className="mt-1 text-sm text-stone-900 break-words">
                    {f.canonicalValue == null || f.canonicalValue === ""
                      ? "—"
                      : String(f.canonicalValue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Decision (3 options only)">
        <div className="grid gap-4 lg:grid-cols-3">
          <form action={linkExtractedToCanonicalAction} className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-stone-900">✅ Link only</h3>
            <p className="mt-1 text-sm text-stone-600">
              No data changes. Just connect extracted → canonical.
            </p>
            <input type="hidden" name="extractedEntityId" value={entity.id} />
            <input type="hidden" name="canonicalType" value={canonicalType} />
            <input type="hidden" name="canonicalId" value={canonicalId} />
            <label className={`${labelClass} mt-4`}>
              <span className={labelSpanClass}>Notes (optional)</span>
              <textarea name="notes" rows={3} className={fieldClass} placeholder="Why is this the same entity?" />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="createAlias" value="1" defaultChecked={defaultCreateAlias} />
              Create alias if name differs
            </label>
            <button
              type="submit"
              className="mt-4 w-full rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
            >
              Execute link only
            </button>
          </form>

          <form action={mergeExtractedIntoCanonicalAction} className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-stone-900">🔁 Conservative merge</h3>
            <p className="mt-1 text-sm text-stone-600">
              Fill empty fields only, never overwrite, append trace notes, optional alias.
            </p>
            <input type="hidden" name="extractedEntityId" value={entity.id} />
            <input type="hidden" name="canonicalType" value={canonicalType} />
            <input type="hidden" name="canonicalId" value={canonicalId} />
            <label className={`${labelClass} mt-4`}>
              <span className={labelSpanClass}>Notes (optional)</span>
              <textarea name="notes" rows={3} className={fieldClass} placeholder="Any reviewer context to store in trace notes?" />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="createAlias" value="1" defaultChecked={defaultCreateAlias} />
              Create alias if name differs
            </label>
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
            >
              Execute conservative merge
            </button>
          </form>

          <form action={promoteExtractedEntityAction} className="rounded-xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-stone-900">🆕 Promote instead</h3>
            <p className="mt-1 text-sm text-stone-600">
              Abandon merge. Create a new canonical record from the extracted entity.
            </p>
            <input type="hidden" name="id" value={entity.id} />
            <button
              type="submit"
              className="mt-4 w-full rounded-full border border-amber-800/40 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
            >
              Promote as new canonical record
            </button>
          </form>
        </div>
      </DetailSection>

      <DetailSection title="Merge preview (what will happen)">
        <div className="grid gap-4">
          <PreviewBlock title="Preview: Link only" preview={previewLinkOnly} />
          <PreviewBlock title="Preview: Conservative merge" preview={previewMerge} />
          <PreviewBlock title="Preview: Promote instead" preview={previewPromote} />
        </div>
      </DetailSection>
    </div>
  );
}

