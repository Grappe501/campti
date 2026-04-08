import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getMotifsList } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminMotifsPage() {
  const motifs = await getMotifsList();
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="Motifs" description="Recurrence patterns and usage hints." />
      <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        {motifs.length === 0 ? (
          <li className="text-sm text-stone-600">No motifs yet.</li>
        ) : (
          motifs.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/motifs/${m.id}`} className="text-amber-900 hover:underline">
                {m.name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
