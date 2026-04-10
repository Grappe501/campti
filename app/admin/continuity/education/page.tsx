import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getWorldEducationNormProfilesForAdmin } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function ContinuityEducationIndexPage() {
  const rows = await getWorldEducationNormProfilesForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/continuity" className="text-sm text-amber-900 hover:underline">
        ← Continuity notes
      </Link>
      <PageHeader
        title="Education norms (Stage 6.5)"
        description="World-state training models and knowledge access — one row per era."
      />
      <p className="text-sm text-stone-600">
        <Link href="/admin/continuity/education/new" className="font-medium text-amber-900 hover:underline">
          New world education norm →
        </Link>
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-600">No world education norm profiles yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
              <Link href={`/admin/continuity/education/${r.id}`} className="font-medium text-amber-900 hover:underline">
                {r.label}
              </Link>
              <span className="text-stone-600">
                {" "}
                · {r.worldState.eraId} · elite {r.eliteKnowledgeAccess} / common {r.commonKnowledgeAccess}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
