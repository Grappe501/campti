import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addReviewerNoteAction,
  promoteExtractedEntityAction,
  updateExtractedEntityReview,
} from "@/app/actions/extracted-entity";
import {
  linkExtractedToCanonicalAction,
  rejectExtractedEntityAction,
} from "@/app/actions/entity-linking";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getExtractedEntityWithCandidates, searchCanonicalRecords } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { EXTRACTION_PROMPT_VERSION, INSTRUCTIONS_VERSION } from "@/lib/ingestion-constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
    promoted?: string;
    q?: string;
    t?: string;
  }>;
};

const promotable = new Set([
  "person",
  "place",
  "event",
  "symbol",
  "claim",
  "question",
  "continuity",
  "chapter",
]);

function excerptFromProposed(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const ex = o.sourceExcerpt ?? o.quoteExcerpt;
  return typeof ex === "string" && ex.trim().length ? ex.trim() : null;
}

export default async function AdminExtractedDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const payload = await getExtractedEntityWithCandidates(id);
  if (!payload) notFound();
  const { entity, candidates } = payload;

  const canPromote =
    promotable.has(entity.entityType) &&
    !entity.matchedRecordId &&
    !entity.canonicalRecordId &&
    (entity.reviewStatus === "pending" || entity.reviewStatus === "approved");

  const excerpt = excerptFromProposed(entity.proposedData);
  const run = entity.ingestionRun;

  const manualType =
    (sp.t?.trim() || entity.entityType)?.trim() || "person";
  const manualQuery = sp.q?.trim() || "";
  const manualResults =
    manualQuery.length >= 2 ? await searchCanonicalRecords(manualType, manualQuery) : [];

  const canonicalHref = (type: string, cid: string) => {
    if (type === "person") return `/admin/people/${cid}`;
    if (type === "place") return `/admin/places/${cid}`;
    if (type === "event") return `/admin/events/${cid}`;
    if (type === "chapter") return `/admin/chapters/${cid}`;
    if (type === "claim") return `/admin/claims/${cid}`;
    if (type === "openQuestion" || type === "question") return `/admin/questions/${cid}`;
    if (type === "continuityNote" || type === "continuity") return `/admin/continuity/${cid}`;
    return null;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/extracted" className="text-sm text-amber-900 hover:underline">
          ← Extracted queue
        </Link>
        <PageHeader
          title={entity.proposedTitle ?? entity.proposedName ?? "Extracted entity"}
          description="Review proposed data before linking to the main model."
        />
        <p className="mt-2 text-sm text-stone-600">
          Source:{" "}
          <Link
            href={`/admin/sources/${entity.sourceId}`}
            className="text-amber-900 hover:underline"
          >
            {entity.source.title}
          </Link>
        </p>
      </div>

      <AdminFormError error={sp.error} />

      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Saved.
        </p>
      ) : null}

      {sp.promoted ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Promoted as new {decodeURIComponent(sp.promoted)} record.
        </p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-stone-500">Type</dt>
            <dd className="font-medium text-stone-900">{entity.entityType}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Review</dt>
            <dd>
              <StatusBadge label={entity.reviewStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Merge decision</dt>
            <dd>{entity.mergeDecision ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Match method</dt>
            <dd>{entity.matchMethod ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Confidence</dt>
            <dd>{entity.confidence ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Source</dt>
            <dd>
              <Link href={`/admin/ingestion/${entity.sourceId}`} className="text-amber-900 hover:underline">
                {entity.source.title}
              </Link>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-stone-500">Ingestion run</dt>
            <dd>
              <Link href={`/admin/runs/${entity.ingestionRunId}`} className="font-mono text-xs text-amber-900 hover:underline">
                {entity.ingestionRunId}
              </Link>
            </dd>
            <dd className="mt-2 text-xs text-stone-600">
              Status: <StatusBadge label={run.status} />
              {run.runType ? (
                <span className="ml-2 text-stone-500">· {run.runType}</span>
              ) : null}
            </dd>
            <dd className="mt-1 text-xs text-stone-600">
              Model:{" "}
              <span className="font-mono text-stone-800">{run.modelName ?? "—"}</span>
            </dd>
            <dd className="mt-1 text-xs text-stone-600">
              Prompt:{" "}
              <span className="break-all text-stone-800">
                {run.promptVersion ?? `${INSTRUCTIONS_VERSION}+${EXTRACTION_PROMPT_VERSION}`}
              </span>
            </dd>
          </div>
          {entity.matchedRecordId ? (
            <div className="sm:col-span-2 rounded-lg bg-stone-50 p-3">
              <dt className="text-xs uppercase text-stone-500">Matched record</dt>
              <dd className="mt-1 text-stone-800">
                {entity.matchedRecordType ?? "record"} ·{" "}
                <span className="font-mono text-xs">{entity.matchedRecordId}</span>
              </dd>
            </div>
          ) : null}
          {entity.canonicalRecordId ? (
            <div className="sm:col-span-2 rounded-lg bg-amber-50 p-3">
              <dt className="text-xs uppercase text-stone-500">Canonical link</dt>
              <dd className="mt-1 text-stone-800">
                {entity.canonicalRecordType ?? "record"} ·{" "}
                <span className="font-mono text-xs">{entity.canonicalRecordId}</span>
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {excerpt ? (
        <DetailSection title="Source excerpt (from extraction)">
          <blockquote className="border-l-4 border-amber-800/30 pl-4 text-sm italic text-stone-800">
            {excerpt}
          </blockquote>
        </DetailSection>
      ) : null}

      <DetailSection title="Proposed data">
        <pre className="max-h-[28rem] overflow-auto rounded-lg bg-stone-900/95 p-4 text-xs text-stone-100">
          {JSON.stringify(entity.proposedData ?? {}, null, 2)}
        </pre>
      </DetailSection>

      <DetailSection title="Likely matches (heuristics)">
        {candidates.length === 0 ? (
          <p className="text-sm text-stone-600">No conservative candidates found.</p>
        ) : (
          <div className="space-y-3">
            {candidates.map((c) => {
              const href = canonicalHref(c.canonicalType, c.canonicalId);
              return (
                <div key={`${c.canonicalType}:${c.canonicalId}`} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">
                        {c.label}{" "}
                        <span className="ml-2 text-xs text-stone-500">
                          {c.canonicalType} · score {c.score}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        Why: {c.why.join(", ")}
                      </p>
                      <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-stone-50 p-3 text-xs text-stone-800">
                        {JSON.stringify(c.summary ?? {}, null, 2)}
                      </pre>
                    </div>
                    <div className="flex flex-col gap-2">
                      <form action={linkExtractedToCanonicalAction}>
                        <input type="hidden" name="extractedEntityId" value={entity.id} />
                        <input type="hidden" name="canonicalType" value={c.canonicalType} />
                        <input type="hidden" name="canonicalId" value={c.canonicalId} />
                        <input type="hidden" name="createAlias" value="1" />
                        <button
                          type="submit"
                          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
                        >
                          Link only
                        </button>
                      </form>
                      <Link
                        href={`/admin/extracted/${entity.id}/merge?canonicalType=${encodeURIComponent(c.canonicalType)}&canonicalId=${encodeURIComponent(c.canonicalId)}`}
                        className="rounded-full bg-stone-900 px-4 py-2 text-center text-sm font-medium text-amber-50 hover:bg-stone-800"
                      >
                        Compare / merge
                      </Link>
                      {href ? (
                        <Link href={href} className="text-center text-sm text-amber-900 hover:underline">
                          Open canonical
                        </Link>
                      ) : (
                        <span className="text-center text-xs text-stone-500">No admin page for this type</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Manual search">
        <form method="get" className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            <span className={labelSpanClass}>Type</span>
            <select name="t" className={fieldClass} defaultValue={manualType}>
              {Array.from(promotable).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass + " sm:col-span-2"}>
            <span className={labelSpanClass}>Search</span>
            <input name="q" defaultValue={manualQuery} className={fieldClass} placeholder="Search canonical records..." />
          </label>
          <div className="sm:col-span-3">
            <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
              Search
            </button>
          </div>
        </form>

        {manualQuery.length >= 2 ? (
          manualResults.length ? (
            <ul className="mt-4 space-y-2">
              {manualResults.map((r: unknown) => {
                const o = (r && typeof r === "object" ? (r as Record<string, unknown>) : {}) as Record<
                  string,
                  unknown
                >;
                const rid = String(o.id ?? "");
                const label = String((o.name ?? o.title ?? o.description ?? rid) || "(unknown)");
                const href = canonicalHref(manualType, rid);
                return (
                  <li key={rid} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3">
                    <div>
                      <p className="font-medium text-stone-900">{label}</p>
                      <p className="text-xs text-stone-500 font-mono">{rid}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={linkExtractedToCanonicalAction}>
                        <input type="hidden" name="extractedEntityId" value={entity.id} />
                        <input type="hidden" name="canonicalType" value={manualType} />
                        <input type="hidden" name="canonicalId" value={rid} />
                        <button type="submit" className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50">
                          Link only
                        </button>
                      </form>
                      <Link
                        href={`/admin/extracted/${entity.id}/merge?canonicalType=${encodeURIComponent(manualType)}&canonicalId=${encodeURIComponent(rid)}`}
                        className="rounded-full bg-stone-900 px-3 py-1.5 text-sm text-amber-50 hover:bg-stone-800"
                      >
                        Compare / merge
                      </Link>
                      {href ? (
                        <Link href={href} className="rounded-full border border-amber-800/30 bg-amber-50 px-3 py-1.5 text-sm text-amber-950 hover:bg-amber-100">
                          Open canonical
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone-600">No results.</p>
          )
        ) : (
          <p className="mt-4 text-sm text-stone-500">Type at least 2 characters to search.</p>
        )}
      </DetailSection>

      <DetailSection title="Reviewer notes">
        {entity.reviewerNotes ? (
          <pre className="mb-4 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm text-stone-800">
            {entity.reviewerNotes}
          </pre>
        ) : (
          <p className="mb-4 text-sm text-stone-500">No notes yet.</p>
        )}
        <form action={addReviewerNoteAction} className="space-y-3">
          <input type="hidden" name="id" value={entity.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Add note</span>
            <textarea
              name="reviewerNotes"
              rows={3}
              defaultValue={entity.reviewerNotes ?? ""}
              className={fieldClass}
              placeholder="Internal notes for this review."
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
          >
            Save note
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Review actions">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <form action={updateExtractedEntityReview}>
              <input type="hidden" name="id" value={entity.id} />
              <input type="hidden" name="reviewStatus" value="approved" />
              <button
                type="submit"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
              >
                Approve
              </button>
            </form>
            <form action={updateExtractedEntityReview}>
              <input type="hidden" name="id" value={entity.id} />
              <input type="hidden" name="reviewStatus" value="rejected" />
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                Reject
              </button>
            </form>
            <form action={rejectExtractedEntityAction}>
              <input type="hidden" name="extractedEntityId" value={entity.id} />
              <button
                type="submit"
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
              >
                Reject (merge decision)
              </button>
            </form>
            <form action={updateExtractedEntityReview}>
              <input type="hidden" name="id" value={entity.id} />
              <input type="hidden" name="reviewStatus" value="merged" />
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                Mark merged
              </button>
            </form>
          </div>

          {canPromote ? (
            <form action={promoteExtractedEntityAction}>
              <input type="hidden" name="id" value={entity.id} />
              <button
                type="submit"
                className="rounded-full border border-amber-800/40 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
              >
                Promote as new record
              </button>
              <p className="mt-2 text-xs text-stone-500">
                Creates a {entity.entityType} in the main database from proposed fields when possible, then marks this row merged.
              </p>
            </form>
          ) : null}
        </div>
      </DetailSection>
    </div>
  );
}
