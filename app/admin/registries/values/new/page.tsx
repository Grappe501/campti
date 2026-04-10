import Link from "next/link";
import { RegistryFamily } from "@prisma/client";
import { AdminFormError } from "@/components/admin-form-error";
import { createRegistryValue } from "@/app/actions/ontology";
import { REGISTRY_FAMILY_ORDER } from "@/lib/ontology-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewRegistryValuePage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin/registries/values" className="text-sm text-amber-900 hover:underline">
        ← Registry values
      </Link>
      <PageHeader title="New registry value" description="Controlled vocabulary row (unique key)." />
      <AdminFormError error={sp.error} />

      <form action={createRegistryValue} className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className={labelClass}>
          <span className={labelSpanClass}>Key</span>
          <input name="key" required className={fieldClass} placeholder="symbolic_custom" />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Label</span>
          <input name="label" required className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Description</span>
          <textarea name="description" rows={3} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Family</span>
          <select name="family" required defaultValue={RegistryFamily.GENERAL} className={fieldClass}>
            {REGISTRY_FAMILY_ORDER.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Registry type</span>
          <input name="registryType" className={fieldClass} defaultValue="default" />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Sort order</span>
          <input name="sortOrder" type="number" defaultValue={0} className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Active</span>
          <select name="isActive" defaultValue="true" className={fieldClass}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Config JSON</span>
          <textarea name="configJson" rows={2} className={fieldClass} placeholder="{}" />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Applies to JSON</span>
          <textarea name="appliesToJson" rows={2} className={fieldClass} placeholder="{}" />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Source trace note</span>
          <input name="sourceTraceNote" className={fieldClass} />
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Notes</span>
          <textarea name="notes" rows={2} className={fieldClass} />
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
          Create
        </button>
      </form>
    </div>
  );
}
