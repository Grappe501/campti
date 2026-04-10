import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getRelationshipProfilesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminRelationshipsIndexPage() {
  const rows = await getRelationshipProfilesForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Relationships (Stage 6)"
        description="Dyadic bonds, world-sliced — masking, desire, and disclosure live on character and world pages."
      />
      <p className="text-sm text-stone-600">
        <Link href="/admin/relationships/new" className="font-medium text-amber-900 hover:underline">
          New relationship profile →
        </Link>
        <span className="text-stone-500"> · </span>
        <Link href="/admin/relationships/networks" className="font-medium text-amber-900 hover:underline">
          Network summaries (help) →
        </Link>
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-600">No relationship profiles yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <Link href={`/admin/relationships/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.personA.name} ↔ {r.personB.name}
              </Link>
              <span className="text-stone-600">
                {" "}
                · {r.worldState.eraId} · {r.relationshipType} · {r.publicStatus}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
