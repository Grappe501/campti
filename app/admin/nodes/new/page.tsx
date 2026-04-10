import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createEnvironmentNode } from "@/app/actions/environment";
import { getPlacesForEnvironmentAdmin } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const recordTypeOptions = Object.values(RecordType);
const visibilityOptions = Object.values(VisibilityStatus);

export default async function NewEnvironmentNodePage() {
  const places = await getPlacesForEnvironmentAdmin();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="New environment node" description="Attach a keyed node to a canonical place." />
      <Link href="/admin/nodes" className="text-sm text-amber-900 hover:underline">
        ← Nodes
      </Link>
      <form action={createEnvironmentNode} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className={labelClass}>
          <span className={labelSpanClass}>Place</span>
          <select name="placeId" className={fieldClass} required>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Key (unique)</span>
          <input name="key" className={fieldClass} required placeholder="red_river_main_channel" />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" className={fieldClass} required />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Node type</span>
          <input name="nodeType" className={fieldClass} placeholder="registry key or free text" />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Core node</span>
          <select name="isCoreNode" className={fieldClass} defaultValue="false">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Region label</span>
          <input name="regionLabel" className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Summary</span>
          <textarea name="summary" rows={3} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue="">
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
            <select name="visibility" className={fieldClass} defaultValue="">
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
            <input name="certainty" className={fieldClass} />
          </label>
        </div>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} className={fieldClass} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
          Create node
        </button>
      </form>
    </div>
  );
}
