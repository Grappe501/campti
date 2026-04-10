import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getWorldStateReferences } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminWorldStatesPage() {
  const states = await getWorldStateReferences();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="World states"
        description="Era slices (WorldStateReference). Open pressure & governance per state."
      />
      {states.length === 0 ? (
        <p className="text-sm text-stone-600">No world states. Seed or add via Prisma.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {states.map((w) => (
            <li key={w.id} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <Link href={`/admin/world-states/${w.id}/pressure`} className="font-medium text-amber-900 hover:underline">
                {w.eraId}
              </Link>
              <span className="text-stone-600"> — {w.label}</span>
              <span className="text-stone-500"> · </span>
              <Link href={`/admin/world-states/${w.id}/knowledge`} className="text-amber-900 hover:underline">
                Knowledge
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
