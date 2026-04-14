import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { buildCharacterObserverSnapshot } from "@/lib/services/world-observer-service";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    sceneId?: string;
    selectedAction?: string;
  }>;
};

export default async function CharacterObserverPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const person = await prisma.person.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!person) notFound();

  let snapshotJson: string | null = null;
  let error: string | null = null;

  try {
    const snap = await buildCharacterObserverSnapshot({
      characterId: id,
      sceneId: sp.sceneId ?? null,
      selectedActionLabel: sp.selectedAction ?? null,
    });
    snapshotJson = JSON.stringify(snap, null, 2);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to build snapshot.";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/characters/${id}/mind`} className="text-sm text-amber-900 hover:underline">
          ← Character mind
        </Link>
        <PageHeader
          title={`Observer: ${person.name}`}
          description="Cognition, social field, embodiment, desire — and optional deterministic decision-trace labels when `selectedAction` is set."
        />
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm text-sm text-stone-700">
        <p className="font-medium text-stone-900">Query parameters</p>
        <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs">
          <li>sceneId (recommended for cognition + social field)</li>
          <li>selectedAction (optional — enables deterministic decision-trace summary)</li>
        </ul>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : null}

      {snapshotJson ? (
        <section className="rounded-xl border border-stone-200 bg-stone-900 p-4 shadow-sm">
          <pre className="max-h-[70vh] overflow-auto text-xs text-stone-100">{snapshotJson}</pre>
        </section>
      ) : null}
    </div>
  );
}
