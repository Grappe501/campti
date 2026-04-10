import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { deleteEnvironmentNode, updateEnvironmentNode } from "@/app/actions/environment";
import { getEnvironmentNodeByIdForAdmin, getNodeConnectionsForAdmin } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const recordTypeOptions = Object.values(RecordType);
const visibilityOptions = Object.values(VisibilityStatus);

export default async function AdminNodeDetailPage({ params }: Props) {
  const { id } = await params;
  const node = await getEnvironmentNodeByIdForAdmin(id);
  if (!node) notFound();

  const connections = await getNodeConnectionsForAdmin();
  const related = connections.filter((c) => c.fromNodeId === id || c.toNodeId === id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={node.label} description={`Key: ${node.key} · Place: ${node.place.name}`} />
      <Link href="/admin/nodes" className="text-sm text-amber-900 hover:underline">
        ← Nodes
      </Link>
      <form action={updateEnvironmentNode} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={node.id} />
        <input type="hidden" name="placeId" value={node.placeId} />
        <label className={labelClass}>
          <span className={labelSpanClass}>Key</span>
          <input name="key" className={fieldClass} defaultValue={node.key} required />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" className={fieldClass} defaultValue={node.label} required />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Node type</span>
          <input name="nodeType" className={fieldClass} defaultValue={node.nodeType ?? ""} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Core node</span>
          <select name="isCoreNode" className={fieldClass} defaultValue={node.isCoreNode ? "true" : "false"}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Region</span>
          <input name="regionLabel" className={fieldClass} defaultValue={node.regionLabel ?? ""} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Summary</span>
          <textarea name="summary" rows={3} className={fieldClass} defaultValue={node.summary ?? ""} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={node.recordType ?? ""}>
              <option value="">—</option>
              {recordTypeOptions.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Visibility</span>
            <select name="visibility" className={fieldClass} defaultValue={node.visibility ?? ""}>
              <option value="">—</option>
              {visibilityOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Certainty</span>
            <input name="certainty" className={fieldClass} defaultValue={node.certainty ?? ""} />
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} className={fieldClass} defaultValue={node.notes ?? ""} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
          Save
        </button>
      </form>

      <form action={deleteEnvironmentNode} className="rounded-lg border border-rose-100 bg-rose-50/40 p-4 text-sm">
        <input type="hidden" name="id" value={node.id} />
        <p className="text-stone-700">Deletes this node and its corridor rows (connections cascade).</p>
        <button type="submit" className="mt-2 text-sm font-medium text-rose-800 hover:underline">
          Delete node
        </button>
      </form>

      <section className="rounded-lg border border-stone-200 bg-white p-4 text-sm">
        <h2 className="font-medium text-stone-900">Connections</h2>
        {related.length === 0 ? (
          <p className="mt-2 text-stone-600">None. Add from Connections admin.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {related.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/connections/${c.id}`} className="text-amber-900 hover:underline">
                  {c.connectionType}
                </Link>
                <span className="text-stone-600">
                  {" "}
                  {c.fromNode.key} → {c.toNode.key}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
