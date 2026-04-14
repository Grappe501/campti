import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buildWorldSnapshot } from "@/lib/services/world-observer-service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    worldStateReferenceId?: string;
    sceneId?: string;
    storyYear?: string;
    focalPersonId?: string;
    focalPlaceId?: string;
    parishPlaceId?: string;
  }>;
};

export default async function WorldObserverPage({ searchParams }: Props) {
  const sp = await searchParams;
  const wsId = sp.worldStateReferenceId?.trim();
  let snapshotJson: string | null = null;
  let error: string | null = null;

  if (wsId) {
    try {
      const snap = await buildWorldSnapshot({
        worldStateReferenceId: wsId,
        storyYear: sp.storyYear ? Number.parseInt(sp.storyYear, 10) : null,
        sceneId: sp.sceneId ?? null,
        focalPersonId: sp.focalPersonId ?? null,
        focalPlaceId: sp.focalPlaceId ?? null,
        parishPlaceId: sp.parishPlaceId ?? null,
      });
      snapshotJson = JSON.stringify(snap, null, 2);
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to build snapshot.";
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/world-states" className="text-sm text-amber-900 hover:underline">
          ← World states
        </Link>
        <PageHeader
          title="World observer"
          description="Structured snapshot: population, places, social-field summary, and recent events. Pass query params to load."
        />
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm text-sm text-stone-700">
        <p className="font-medium text-stone-900">Query parameters</p>
        <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs">
          <li>
            <span className="text-stone-900">worldStateReferenceId</span> (required)
          </li>
          <li>sceneId, storyYear, focalPersonId, focalPlaceId, parishPlaceId (optional)</li>
        </ul>
        <p className="mt-3 text-xs text-stone-500">
          Example:{" "}
          <code className="rounded bg-stone-100 px-1">
            /admin/world-observer?worldStateReferenceId=YOUR_WS_ID
          </code>
        </p>
      </section>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : null}

      {snapshotJson ? (
        <section className="rounded-xl border border-stone-200 bg-stone-900 p-4 shadow-sm">
          <pre className="max-h-[70vh] overflow-auto text-xs text-stone-100">{snapshotJson}</pre>
        </section>
      ) : (
        <p className="text-sm text-stone-500">Provide worldStateReferenceId to render a snapshot.</p>
      )}
    </div>
  );
}
