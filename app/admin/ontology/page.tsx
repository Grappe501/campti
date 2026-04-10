import Link from "next/link";
import { OntologyFamily } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { toggleOntologyTypeActive } from "@/app/actions/ontology";
import { ONTOLOGY_FAMILY_ORDER } from "@/lib/ontology-constants";
import { getOntologyTypesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Search = { family?: string; saved?: string; error?: string };

function parseFamily(raw: string | undefined): OntologyFamily | undefined {
  if (!raw || raw === "ALL") return undefined;
  return Object.values(OntologyFamily).includes(raw as OntologyFamily) ? (raw as OntologyFamily) : undefined;
}

export default async function OntologyAdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const family = parseFamily(sp.family);
  const rows = await getOntologyTypesForAdmin(family ? { family } : undefined);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Ontology types"
          description="Master list of object kinds in the Campti graph (person, scene, branch_condition, …). Inherits record type and visibility like other governed rows."
        />
        <Link
          href="/admin/ontology/new"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50"
        >
          New type
        </Link>
      </div>

      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      {sp.error === "db" ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
          Database error. Check DATABASE_URL and migrations.
        </p>
      ) : null}

      <form method="get" className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-stone-600">Family</span>
          <select name="family" defaultValue={sp.family ?? "ALL"} className="rounded-md border border-stone-300 px-2 py-1">
            <option value="ALL">All</option>
            {ONTOLOGY_FAMILY_ORDER.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md border border-stone-300 bg-white px-3 py-1 hover:bg-stone-50">
          Filter
        </button>
      </form>

      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-sm text-stone-600">
            No rows. Run seed after migration (<code className="text-xs">npx prisma db seed</code>).
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <Link href={`/admin/ontology/${r.id}`} className="font-medium text-amber-900 hover:underline">
                  {r.name}
                </Link>
                <span className="ml-2 font-mono text-xs text-stone-500">
                  {r.key} · {r.family}
                  {!r.isActive ? " · inactive" : ""}
                </span>
                <p className="mt-1 line-clamp-2 text-xs text-stone-600">{r.description}</p>
              </div>
              <form action={toggleOntologyTypeActive}>
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

      <p className="text-center text-sm text-stone-600">
        <Link href="/admin/registries" className="text-amber-900 hover:underline">
          Master registry catalog
        </Link>
        {" · "}
        <Link href="/admin/registries/values" className="text-amber-900 hover:underline">
          Registry values
        </Link>
      </p>
    </div>
  );
}
