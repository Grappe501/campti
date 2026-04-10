import Link from "next/link";
import { RegistryFamily } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { toggleRegistryValueActive } from "@/app/actions/ontology";
import { REGISTRY_FAMILY_ORDER } from "@/lib/ontology-constants";
import { getRegistryValuesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Search = { family?: string; type?: string; saved?: string; error?: string };

function parseFamily(raw: string | undefined): RegistryFamily | undefined {
  if (!raw || raw === "ALL") return undefined;
  return Object.values(RegistryFamily).includes(raw as RegistryFamily) ? (raw as RegistryFamily) : undefined;
}

export default async function RegistryValuesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const family = parseFamily(sp.family);
  const registryType = sp.type?.trim() || undefined;
  const rows = await getRegistryValuesForAdmin(
    family || registryType ? { family, registryType: registryType ?? undefined } : undefined,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Registry values"
          description="Controlled vocabulary: symbolic, relationship, environment, pressure, permission, readiness, branch. Distinct from the fifteen-registry conceptual catalog below."
        />
        <Link
          href="/admin/registries/values/new"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50"
        >
          New value
        </Link>
      </div>

      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}

      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-stone-600">Family</span>
          <select name="family" defaultValue={sp.family ?? "ALL"} className="rounded-md border border-stone-300 px-2 py-1">
            <option value="ALL">All</option>
            {REGISTRY_FAMILY_ORDER.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-stone-600">Registry type</span>
          <input
            name="type"
            defaultValue={sp.type ?? ""}
            placeholder="e.g. catalog_v1"
            className="rounded-md border border-stone-300 px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded-md border border-stone-300 bg-white px-3 py-1 hover:bg-stone-50">
          Filter
        </button>
      </form>

      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-sm text-stone-600">No values match. Seed or create rows.</li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <Link href={`/admin/registries/values/${r.id}`} className="font-medium text-amber-900 hover:underline">
                  {r.label}
                </Link>
                <span className="ml-2 font-mono text-xs text-stone-500">
                  {r.key} · {r.family} · {r.registryType}
                  {!r.isActive ? " · inactive" : ""}
                </span>
              </div>
              <form action={toggleRegistryValueActive}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-800 hover:border-amber-300"
                >
                  {r.isActive ? "Deactivate" : "Activate"}
                </button>
              </form>
            </li>
          ))
        )}
      </ul>

      <p className="text-center text-sm">
        <Link href="/admin/registries" className="text-amber-900 hover:underline">
          ← Master registry catalog
        </Link>
        {" · "}
        <Link href="/admin/ontology" className="text-amber-900 hover:underline">
          Ontology types
        </Link>
      </p>
    </div>
  );
}
