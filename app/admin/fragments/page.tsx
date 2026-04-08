import Link from "next/link";
import { FragmentType } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { AmbiguityMeter } from "@/components/ambiguity-meter";
import { FragmentTypeBadge, PlacementBadge } from "@/components/fragment-badges";
import { ConfidenceDot } from "@/components/confidence-dot";
import { AdminFormError } from "@/components/admin-form-error";
import { getFragments, getSources, type FragmentsFilters } from "@/lib/data-access";
import { fragmentTypeLabel } from "@/lib/fragment-types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    fragmentType?: string;
    placementStatus?: string;
    reviewStatus?: string;
    sourceId?: string;
    scope?: string;
    group?: string;
    error?: string;
  }>;
};

export default async function AdminFragmentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters: FragmentsFilters = {};

  if (sp.fragmentType && Object.values(FragmentType).includes(sp.fragmentType as FragmentType)) {
    filters.fragmentType = sp.fragmentType as FragmentType;
  }
  if (sp.placementStatus) filters.placementStatus = sp.placementStatus;
  if (sp.reviewStatus) filters.reviewStatus = sp.reviewStatus;
  if (sp.sourceId) filters.sourceId = sp.sourceId;
  if (sp.scope === "top") filters.parentOnly = true;

  const [fragments, sources] = await Promise.all([getFragments(filters), getSources()]);

  const grouped =
    sp.group === "source"
      ? Object.entries(
          fragments.reduce<Record<string, typeof fragments>>((acc, f) => {
            const k = f.sourceId ?? "no-source";
            if (!acc[k]) acc[k] = [];
            acc[k].push(f);
            return acc;
          }, {}),
        )
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Fragments"
        description="Thought units decomposed from sources. Not canonical facts by default — review, place, and link with care."
      />

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-stone-500">Filters</h2>
        <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-stone-600">Type</span>
            <select
              name="fragmentType"
              defaultValue={sp.fragmentType ?? ""}
              className="rounded-md border border-stone-300 px-2 py-1.5 text-stone-900"
            >
              <option value="">All</option>
              {Object.values(FragmentType).map((t) => (
                <option key={t} value={t}>
                  {fragmentTypeLabel(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-stone-600">Placement</span>
            <input
              name="placementStatus"
              placeholder="unplaced, linked…"
              defaultValue={sp.placementStatus ?? ""}
              className="rounded-md border border-stone-300 px-2 py-1.5 text-stone-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-stone-600">Review</span>
            <input
              name="reviewStatus"
              placeholder="pending, approved…"
              defaultValue={sp.reviewStatus ?? ""}
              className="rounded-md border border-stone-300 px-2 py-1.5 text-stone-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-stone-600">Source</span>
            <select
              name="sourceId"
              defaultValue={sp.sourceId ?? ""}
              className="max-w-xs rounded-md border border-stone-300 px-2 py-1.5 text-stone-900"
            >
              <option value="">All</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="scope" value="top" defaultChecked={sp.scope === "top"} />
            Top-level only
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-stone-600">Group</span>
            <select
              name="group"
              defaultValue={sp.group ?? ""}
              className="rounded-md border border-stone-300 px-2 py-1.5 text-stone-900"
            >
              <option value="">Flat list</option>
              <option value="source">By source</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Apply
          </button>
          <Link href="/admin/fragments" className="text-sm text-amber-900 hover:underline">
            Clear
          </Link>
        </form>
        <p className="mt-3 text-xs text-stone-500">
          <Link href="/admin/brain" className="text-amber-900 hover:underline">
            Open Brain dashboard
          </Link>
        </p>
      </section>

      {grouped ? (
        <div className="space-y-8">
          {grouped.map(([key, rows]) => (
            <div key={key}>
              <h3 className="mb-3 text-sm font-medium text-stone-700">
                {key === "no-source" ? "No source" : sources.find((s) => s.id === key)?.title ?? key}
                <span className="ml-2 text-stone-500">({rows.length})</span>
              </h3>
              <FragmentTable rows={rows} />
            </div>
          ))}
        </div>
      ) : (
        <FragmentTable rows={fragments} />
      )}
    </div>
  );
}

function formatSecondary(f: { secondaryFragmentTypes?: unknown }): string {
  const r = f.secondaryFragmentTypes;
  if (!r || !Array.isArray(r)) return "—";
  const parts = r.filter((x): x is string => typeof x === "string").slice(0, 4);
  return parts.length ? parts.map((p) => p.replace(/_/g, " ")).join(", ") : "—";
}

function PressureBadge({ pressure }: { pressure: string | null | undefined }) {
  const p = (pressure ?? "unset").toLowerCase();
  const cls =
    p === "high"
      ? "bg-rose-100 text-rose-900"
      : p === "medium"
        ? "bg-amber-100 text-amber-900"
        : p === "low"
          ? "bg-emerald-50 text-emerald-900"
          : "bg-stone-100 text-stone-600";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {pressure ?? "—"}
    </span>
  );
}

function FragmentTable({
  rows,
}: {
  rows: Awaited<ReturnType<typeof getFragments>>;
}) {
  if (!rows.length) {
    return (
      <p className="text-sm text-stone-600">
        No fragments match. Decompose a source from its{" "}
        <Link href="/admin/sources" className="text-amber-900 hover:underline">
          source detail → decompose
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
        <thead className="bg-stone-50 text-xs font-medium uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3">Fragment</th>
            <th className="px-4 py-3">Identity</th>
            <th className="px-4 py-3">Pressure</th>
            <th className="px-4 py-3">Ready</th>
            <th className="px-4 py-3">Placement</th>
            <th className="px-4 py-3">Review</th>
            <th className="px-4 py-3">Signals</th>
            <th className="px-4 py-3">Counts</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((f) => (
            <tr key={f.id} className="align-top hover:bg-stone-50/80">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/fragments/${f.id}`}
                  className="font-medium text-stone-900 hover:underline"
                >
                  {f.title?.trim() || f.excerpt?.slice(0, 72) || "Untitled fragment"}
                </Link>
                {f.source ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Source:{" "}
                    <Link href={`/admin/sources/${f.source.id}`} className="hover:underline">
                      {f.source.title}
                    </Link>
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <FragmentTypeBadge type={f.primaryFragmentType ?? f.fragmentType} />
                  <span className="text-[11px] text-stone-500" title="Secondary types">
                    {formatSecondary(f)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <PressureBadge pressure={f.decompositionPressure} />
              </td>
              <td className="px-4 py-3 text-xs text-stone-700">
                {f.sceneReadinessScore ?? "—"}
              </td>
              <td className="px-4 py-3">
                <PlacementBadge status={f.placementStatus} />
              </td>
              <td className="px-4 py-3">
                <PlacementBadge status={f.reviewStatus} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <ConfidenceDot level={f.confidence} />
                  <AmbiguityMeter level={f.ambiguityLevel} />
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-stone-600">
                <span title="Placement candidates">{f._count.placementCandidates}c</span>
                {" · "}
                <span title="Child fragments">{f._count.childFragments}ch</span>
                {" · "}
                <span title="Approved links">{f._count.links}L</span>
                {" · "}
                <span title="Clusters">{f._count.clusterLinks}cl</span>
                {" · "}
                <span title="Hidden meaning set">{f.hiddenMeaning?.trim() ? "H" : "·"}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-col items-end gap-1">
                  <Link href={`/admin/fragments/${f.id}`} className="text-amber-900 hover:underline">
                    Open
                  </Link>
                  <Link
                    href={`/admin/fragments/${f.id}?refine=1`}
                    className="text-[11px] text-stone-600 hover:text-amber-900 hover:underline"
                  >
                    Refine split
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
