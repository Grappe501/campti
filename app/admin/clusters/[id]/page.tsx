import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { getClusterById } from "@/lib/data-access";
import { CLUSTER_TYPES } from "@/lib/scene-intelligence-validation";
import {
  enhanceClusterSummaryCacheAction,
  generateClusterSynthesisCacheAction,
} from "@/app/actions/narrative-passes";
import { linkFragmentToClusterAction, unlinkFragmentFromClusterAction, updateClusterAction } from "@/app/actions/clusters";
import { SyntheticRead } from "@/components/synthetic-read";
import { describeClusterRichly } from "@/lib/descriptive-synthesis";
import { fragmentTypeLabel } from "@/lib/fragment-types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function AdminClusterDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const cluster = await getClusterById(id);
  if (!cluster) notFound();

  const clusterRich = await describeClusterRichly(id);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <nav className="text-sm text-stone-600">
          <Link href="/admin/clusters" className="hover:text-amber-900 hover:underline">
            Clusters
          </Link>
        </nav>
        <PageHeader title={cluster.title} description="Review linked fragments and cluster metadata." />
      </div>

      <AdminFormError error={sp.error} />
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {sp.saved === "clustersynth" ? "Cluster synthesis updated." : "Saved."}
        </p>
      ) : null}

      <section className="rounded-xl border border-violet-100 bg-violet-50/20 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Cluster synthesis</h2>
        <p className="mt-1 text-sm text-stone-600">Mini thought-system — what unifies fragments and what pressure they stack.</p>
        <div className="mt-4 max-h-96 overflow-y-auto">
          <SyntheticRead title="Live read">{clusterRich}</SyntheticRead>
        </div>
        {cluster.generatedClusterSynthesis ? (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <SyntheticRead title="AI-assisted synthesis (cached field)">{cluster.generatedClusterSynthesis}</SyntheticRead>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={generateClusterSynthesisCacheAction}>
            <input type="hidden" name="clusterId" value={id} />
            <button
              type="submit"
              className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-950 hover:bg-violet-100"
            >
              Save template to generated field
            </button>
          </form>
          <form action={enhanceClusterSummaryCacheAction}>
            <input type="hidden" name="clusterId" value={id} />
            <button
              type="submit"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
            >
              Replace with OpenAI enhancement
            </button>
          </form>
        </div>
      </section>

      <DetailSection title="Cluster record">
        <form action={updateClusterAction} className="space-y-4">
          <input type="hidden" name="id" value={cluster.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" defaultValue={cluster.title} className={fieldClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Cluster type</span>
            <select name="clusterType" className={fieldClass} defaultValue={cluster.clusterType}>
              {CLUSTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Summary</span>
            <textarea name="summary" rows={3} defaultValue={cluster.summary ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional tone</span>
              <input name="emotionalTone" defaultValue={cluster.emotionalTone ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Dominant function</span>
              <input name="dominantFunction" defaultValue={cluster.dominantFunction ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Confidence (1–5)</span>
            <input
              name="confidence"
              type="number"
              min={1}
              max={5}
              defaultValue={cluster.confidence ?? ""}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} defaultValue={cluster.notes ?? ""} className={fieldClass} />
          </label>
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Save cluster
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Related anchors">
        <ul className="text-sm text-stone-700">
          {cluster.metaScene ? (
            <li>
              Meta scene:{" "}
              <Link href={`/admin/meta-scenes/${cluster.metaScene.id}/compose`} className="text-amber-900 hover:underline">
                {cluster.metaScene.title}
              </Link>
            </li>
          ) : null}
          {cluster.place ? (
            <li>
              Place:{" "}
              <Link href={`/admin/places/${cluster.place.id}`} className="text-amber-900 hover:underline">
                {cluster.place.name}
              </Link>
            </li>
          ) : null}
          {cluster.person ? (
            <li>
              Person:{" "}
              <Link href={`/admin/people/${cluster.person.id}`} className="text-amber-900 hover:underline">
                {cluster.person.name}
              </Link>
            </li>
          ) : null}
          {!cluster.metaScene && !cluster.place && !cluster.person ? (
            <li className="text-stone-500">No optional anchors set.</li>
          ) : null}
        </ul>
      </DetailSection>

      <DetailSection title="Fragments in cluster">
        <ul className="space-y-3">
          {cluster.fragmentLinks.length === 0 ? (
            <li className="text-sm text-stone-600">No fragments linked.</li>
          ) : (
            cluster.fragmentLinks.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-stone-100 bg-stone-50/50 px-3 py-2 text-sm"
              >
                <div>
                  <Link href={`/admin/fragments/${row.fragment.id}`} className="font-medium text-amber-900 hover:underline">
                    {row.fragment.title?.trim() || row.fragment.id.slice(0, 8)}
                  </Link>
                  <span className="text-xs text-stone-500"> · {fragmentTypeLabel(row.fragment.fragmentType)}</span>
                  {row.role ? <span className="text-xs text-stone-500"> · {row.role}</span> : null}
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600">{row.fragment.summary ?? row.fragment.text.slice(0, 140)}</p>
                </div>
                <form action={unlinkFragmentFromClusterAction}>
                  <input type="hidden" name="linkId" value={row.id} />
                  <input type="hidden" name="clusterId" value={cluster.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>

        <form action={linkFragmentToClusterAction} className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="clusterId" value={cluster.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Fragment ID</span>
            <input name="fragmentId" className={fieldClass} placeholder="cuid…" required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Role</span>
            <input name="role" className={fieldClass} placeholder="echo, central…" />
          </label>
          <button type="submit" className="rounded-md bg-stone-900 px-3 py-2 text-sm text-white">
            Link fragment
          </button>
        </form>
      </DetailSection>

      <p className="text-xs text-stone-500">
        To create a new cluster with multiple fragments at once, use the meta scene compose panel (create cluster from linked
        fragments).
      </p>
    </div>
  );
}
