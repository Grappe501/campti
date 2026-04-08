import Link from "next/link";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getExtractedEntitiesQueue, getSources } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { quickLinkBestCandidateAction, rejectExtractedEntityAction } from "@/app/actions/entity-linking";
import { findCandidateMatchesForExtractedEntity } from "@/lib/entity-matching";

export const dynamic = "force-dynamic";

type QueueRow = Awaited<ReturnType<typeof getExtractedEntitiesQueue>>[number];
type QueueRowWithHints = QueueRow & {
  candidateCount: number | null;
  quickLinkEligible: boolean;
};

type Search = {
  reviewStatus?: string;
  entityType?: string;
  sourceId?: string;
  mergeDecision?: string;
  linkedState?: string;
  confidenceMin?: string;
  confidenceMax?: string;
  groupBy?: string;
};

const ENTITY_TYPES = [
  "person",
  "place",
  "event",
  "symbol",
  "claim",
  "chapter",
  "scene",
  "question",
  "continuity",
] as const;

const REVIEW_STATUSES = ["pending", "approved", "rejected", "merged"] as const;
const MERGE_DECISIONS = [
  "linked_only",
  "merged_into_existing",
  "promoted_new",
  "rejected",
] as const;
const LINKED_STATES = ["linked", "unlinked"] as const;

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
  return <span className={`inline-block h-2 w-2 rounded-full ${tone}`} title={`Confidence ${c ?? "—"}`} />;
}

function QueueBadge({
  label,
  tone,
}: {
  label: string;
  tone: "stone" | "amber" | "emerald" | "rose" | "sky";
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-950 ring-amber-200"
        : tone === "rose"
          ? "bg-rose-50 text-rose-950 ring-rose-200"
          : tone === "sky"
            ? "bg-sky-50 text-sky-950 ring-sky-200"
            : "bg-stone-100 text-stone-800 ring-stone-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

function decisionBadge(mergeDecision: string | null) {
  if (mergeDecision === "linked_only") return <QueueBadge label="🟢 Linked" tone="emerald" />;
  if (mergeDecision === "merged_into_existing") return <QueueBadge label="🔁 Merged" tone="sky" />;
  if (mergeDecision === "promoted_new") return <QueueBadge label="🆕 Promoted" tone="amber" />;
  if (mergeDecision === "rejected") return <QueueBadge label="❌ Rejected" tone="rose" />;
  return <QueueBadge label="🟡 Pending" tone="amber" />;
}

export default async function AdminExtractedQueuePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const confidenceMin = sp.confidenceMin?.trim();
  const confidenceMax = sp.confidenceMax?.trim();
  const filters = {
    reviewStatus: sp.reviewStatus?.trim() || undefined,
    entityType: sp.entityType?.trim() || undefined,
    sourceId: sp.sourceId?.trim() || undefined,
    mergeDecision: sp.mergeDecision?.trim() || undefined,
    linkedState:
      sp.linkedState?.trim() === "linked" || sp.linkedState?.trim() === "unlinked"
        ? (sp.linkedState.trim() as "linked" | "unlinked")
        : undefined,
    confidenceMin: confidenceMin ? Number(confidenceMin) : undefined,
    confidenceMax: confidenceMax ? Number(confidenceMax) : undefined,
  };

  const [rowsRaw, sources] = await Promise.all([
    getExtractedEntitiesQueue(filters),
    getSources(),
  ]);

  // Candidate hints (lightweight but useful): only compute for pending rows.
  const rows: QueueRowWithHints[] = await Promise.all(
    rowsRaw.map(async (r) => {
      const isPending = r.reviewStatus === "pending" && !r.mergeDecision;
      if (!isPending) return { ...r, candidateCount: null as number | null, quickLinkEligible: false };
      const candidates = await findCandidateMatchesForExtractedEntity(r.id);
      const best = candidates[0];
      const second = candidates[1];
      const hasCandidates = candidates.length > 0;
      const strongEnough = Boolean(best && best.score >= 90);
      const clearlyBest = Boolean(best && (!second || best.score - second.score >= 10));
      return {
        ...r,
        candidateCount: hasCandidates ? candidates.length : 0,
        quickLinkEligible: Boolean(hasCandidates && strongEnough && clearlyBest),
      };
    }),
  );

  const groupBy = sp.groupBy?.trim() || "";

  const sorted = [...rows].sort((a, b) => {
    const aPending = a.reviewStatus === "pending" && !a.mergeDecision;
    const bPending = b.reviewStatus === "pending" && !b.mergeDecision;
    const aHas = a.candidateCount != null && a.candidateCount > 0;
    const bHas = b.candidateCount != null && b.candidateCount > 0;

    const rank = (r: QueueRowWithHints) => {
      const pending = r.reviewStatus === "pending" && !r.mergeDecision;
      if (pending && (r.candidateCount ?? 0) > 0) return 0; // Pending + has candidates
      if (pending) return 1; // Pending + no candidates
      if (r.mergeDecision) return 3; // Linked / merged / promoted / rejected
      return 2; // Reviewed (approved/rejected via reviewStatus)
    };

    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;

    // Within pending, prefer candidate rows first.
    if (aPending && bPending && aHas !== bHas) return aHas ? -1 : 1;

    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });

  const filterHref = (next: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { ...sp, ...next };
    if (merged.reviewStatus) p.set("reviewStatus", merged.reviewStatus);
    if (merged.entityType) p.set("entityType", merged.entityType);
    if (merged.sourceId) p.set("sourceId", merged.sourceId);
    if (merged.mergeDecision) p.set("mergeDecision", merged.mergeDecision);
    if (merged.linkedState) p.set("linkedState", merged.linkedState);
    if (merged.confidenceMin) p.set("confidenceMin", merged.confidenceMin);
    if (merged.confidenceMax) p.set("confidenceMax", merged.confidenceMax);
    if (merged.groupBy) p.set("groupBy", merged.groupBy);
    const q = p.toString();
    return q ? `/admin/extracted?${q}` : "/admin/extracted";
  };

  const renderTable = (tableRows: QueueRowWithHints[]) => (
    <AdminTable
      rows={tableRows}
      rowKey={(r) => r.id}
      empty={<EmptyState title="No extracted rows match" />}
      columns={[
        {
          key: "name",
          header: "Proposed",
          cell: (r) => (
            <div className="space-y-1">
              <Link href={`/admin/extracted/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.proposedTitle ?? r.proposedName ?? "(untitled)"}
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className="inline-flex items-center gap-2">
                  <ConfidenceHeat confidence={r.confidence ?? null} />
                  <span>{r.confidence ?? "—"}</span>
                </span>
                <span>·</span>
                <span>{r.entityType}</span>
              </div>
            </div>
          ),
        },
        {
          key: "source",
          header: "Source",
          cell: (r) => (
            <div className="space-y-1">
              <Link href={`/admin/ingestion/${r.sourceId}`} className="text-amber-900 hover:underline">
                {r.source.title}
              </Link>
              <p className="text-xs text-stone-500 font-mono">{r.ingestionRunId.slice(0, 8)}…</p>
            </div>
          ),
        },
        {
          key: "badges",
          header: "Status",
          cell: (r) => (
            <div className="flex flex-wrap items-center gap-2">
              {decisionBadge(r.mergeDecision ?? null)}
              <StatusBadge label={r.reviewStatus} />
                {r.candidateCount != null ? (
                  r.candidateCount > 0 ? (
                  <QueueBadge label="⚠ Has candidates" tone="amber" />
                ) : (
                  <QueueBadge label="🔍 No candidates" tone="stone" />
                )
              ) : null}
              {typeof r.confidence === "number" && r.confidence < 3 ? (
                <QueueBadge label="🧠 Low confidence" tone="rose" />
              ) : null}
            </div>
          ),
        },
        {
          key: "link",
          header: "Linked",
          cell: (r) =>
            r.matchedRecordId ? (
              <span className="text-emerald-800">
                {r.matchedRecordType ?? "record"} · {r.matchedRecordId.slice(0, 8)}…
              </span>
            ) : (
              <span className="text-stone-500">Unlinked</span>
            ),
        },
        {
          key: "actions",
          header: "Actions",
          cell: (r) => (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/extracted/${r.id}`}
                className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-900 hover:bg-stone-50"
              >
                Open review
              </Link>
                {r.quickLinkEligible ? (
                <form action={quickLinkBestCandidateAction}>
                  <input type="hidden" name="extractedEntityId" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-stone-800"
                  >
                    Quick link
                  </button>
                </form>
              ) : null}
              <form action={rejectExtractedEntityAction}>
                <input type="hidden" name="extractedEntityId" value={r.id} />
                <button
                  type="submit"
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-100"
                >
                  Reject
                </button>
              </form>
            </div>
          ),
        },
      ]}
    />
  );

  const grouped =
    groupBy === "source"
      ? Object.entries(
          sorted.reduce((acc: Record<string, QueueRowWithHints[]>, r) => {
            const k = r.source?.title ?? r.sourceId;
            (acc[k] ??= []).push(r);
            return acc;
          }, {}),
        )
      : groupBy === "entityType"
        ? Object.entries(
            sorted.reduce((acc: Record<string, QueueRowWithHints[]>, r) => {
              const k = r.entityType;
              (acc[k] ??= []).push(r);
              return acc;
            }, {}),
          )
        : null;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        title="Extracted entities"
        description="Review queue bridging draft extraction and the world model."
      />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Filters</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
          <label className={labelClass}>
            <span className={labelSpanClass}>Review status</span>
            <select name="reviewStatus" className={fieldClass} defaultValue={sp.reviewStatus ?? ""}>
              <option value="">Any</option>
              {REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Entity type</span>
            <select name="entityType" className={fieldClass} defaultValue={sp.entityType ?? ""}>
              <option value="">Any</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Source</span>
            <select name="sourceId" className={fieldClass} defaultValue={sp.sourceId ?? ""}>
              <option value="">Any</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Merge decision</span>
            <select name="mergeDecision" className={fieldClass} defaultValue={sp.mergeDecision ?? ""}>
              <option value="">Any</option>
              {MERGE_DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Linked state</span>
            <select name="linkedState" className={fieldClass} defaultValue={sp.linkedState ?? ""}>
              <option value="">Any</option>
              {LINKED_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Group</span>
            <select name="groupBy" className={fieldClass} defaultValue={sp.groupBy ?? ""}>
              <option value="">None</option>
              <option value="source">Source</option>
              <option value="entityType">Entity type</option>
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Confidence min</span>
            <input name="confidenceMin" className={fieldClass} defaultValue={sp.confidenceMin ?? ""} placeholder="1" />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Confidence max</span>
            <input name="confidenceMax" className={fieldClass} defaultValue={sp.confidenceMax ?? ""} placeholder="5" />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
            >
              Apply
            </button>
            <Link href="/admin/extracted" className="text-sm text-amber-900 hover:underline">
              Clear
            </Link>
          </div>
        </form>
        <p className="mt-3 text-xs text-stone-500">
          Quick:{" "}
          <Link className="text-amber-900 hover:underline" href={filterHref({ reviewStatus: "pending" })}>
            pending only
          </Link>
        </p>
      </section>

      {grouped ? (
        <div className="space-y-6">
          {grouped.map(([k, rs]) => (
            <section key={k} className="space-y-3">
              <h2 className="text-sm font-semibold text-stone-700">{k}</h2>
              {renderTable(rs)}
            </section>
          ))}
        </div>
      ) : (
        renderTable(sorted)
      )}
    </div>
  );
}
