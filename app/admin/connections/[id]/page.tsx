import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateNodeConnection } from "@/app/actions/environment";
import { getEnvironmentNodesForAdmin, getNodeConnectionByIdForAdmin, getWorldStateReferences } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { NodeConnectionType, RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const connTypes = Object.values(NodeConnectionType);
const recordTypeOptions = Object.values(RecordType);
const visibilityOptions = Object.values(VisibilityStatus);

export default async function ConnectionDetailPage({ params }: Props) {
  const { id } = await params;
  const row = await getNodeConnectionByIdForAdmin(id);
  if (!row) notFound();

  const nodes = await getEnvironmentNodesForAdmin();
  const worldStates = await getWorldStateReferences();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Connection" description={`${row.fromNode.key} → ${row.toNode.key}`} />
      <Link href="/admin/connections" className="text-sm text-amber-900 hover:underline">
        ← Connections
      </Link>
      <form action={updateNodeConnection} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={row.id} />
        <label className={labelClass}>
          <span className={labelSpanClass}>From node</span>
          <select name="fromNodeId" className={fieldClass} defaultValue={row.fromNodeId} required>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.key}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>To node</span>
          <select name="toNodeId" className={fieldClass} defaultValue={row.toNodeId} required>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.key}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Connection type</span>
          <select name="connectionType" className={fieldClass} defaultValue={row.connectionType} required>
            {connTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Bidirectional</span>
          <select name="bidirectional" className={fieldClass} defaultValue={row.bidirectional ? "true" : "false"}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Travel risk</span>
          <input name="travelRisk" type="number" min={0} max={100} className={fieldClass} defaultValue={row.travelRisk} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Travel difficulty</span>
          <input name="travelDifficulty" type="number" min={0} max={100} className={fieldClass} defaultValue={row.travelDifficulty} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Seasonal modifier (JSON)</span>
          <textarea
            name="seasonalModifierJson"
            rows={2}
            className={fieldClass}
            defaultValue={profileJsonFieldToFormText(row.seasonalModifier)}
          />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>World state</span>
          <select name="worldStateId" className={fieldClass} defaultValue={row.worldStateId ?? ""}>
            <option value="">—</option>
            {worldStates.map((w) => (
              <option key={w.id} value={w.id}>
                {w.eraId}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={row.recordType ?? ""}>
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
            <select name="visibility" className={fieldClass} defaultValue={row.visibility ?? ""}>
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
            <input name="certainty" className={fieldClass} defaultValue={row.certainty ?? ""} />
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} className={fieldClass} defaultValue={row.notes ?? ""} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
          Save
        </button>
      </form>
    </div>
  );
}
