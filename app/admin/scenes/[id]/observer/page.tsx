import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getSceneById } from "@/lib/data-access";
import { buildSceneObserverSnapshot } from "@/lib/services/world-observer-service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function SceneObserverPage({ params }: Props) {
  const { id } = await params;
  const scene = await getSceneById(id);
  if (!scene) notFound();

  const snap = await buildSceneObserverSnapshot(id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/scenes/${id}`} className="text-sm text-amber-900 hover:underline">
          ← Scene
        </Link>
        <PageHeader
          title={`Scene observer: ${scene.description.slice(0, 72)}${scene.description.length > 72 ? "…" : ""}`}
          description="Participants, dependency edges, assembly status, prose QA headline, and latest text excerpt."
        />
      </div>

      <section className="rounded-xl border border-stone-200 bg-stone-900 p-4 shadow-sm">
        <pre className="max-h-[70vh] overflow-auto text-xs text-stone-100">{JSON.stringify(snap, null, 2)}</pre>
      </section>
    </div>
  );
}
