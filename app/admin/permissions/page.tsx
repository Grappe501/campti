import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getNarrativePermissionProfilesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Search = { saved?: string };

export default async function PermissionsAdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const rows = await getNarrativePermissionProfilesForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved.</p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Narrative permission profiles"
          description="What information may do in story systems (scene support, atmosphere, canonical reveal). Aligns with RegistryValue family PERMISSION."
        />
        <Link
          href="/admin/permissions/new"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50"
        >
          New profile
        </Link>
      </div>

      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-sm text-stone-600">No profiles. Run seed after migration.</li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="px-4 py-3 text-sm">
              <Link href={`/admin/permissions/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.name}
              </Link>
              <span className="ml-2 font-mono text-xs text-stone-500">{r.key}</span>
              <p className="mt-1 text-xs text-stone-600">
                direct={String(r.allowsDirectNarrativeUse)} · scene={String(r.allowsSceneSupport)} · atmos=
                {String(r.allowsAtmosphereSupport)} · canonical={String(r.allowsCanonicalReveal)}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
