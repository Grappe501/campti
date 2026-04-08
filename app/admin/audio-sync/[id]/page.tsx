import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { buildAudioSyncFromPassAction } from "@/app/actions/cinematic-narrative";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AudioSyncAdminPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const asset = await prisma.sceneAudioAsset.findUnique({
    where: { id },
    include: {
      audioSyncSegments: { orderBy: { segmentOrder: "asc" } },
      metaScene: { select: { id: true, title: true } },
      scene: { select: { id: true, description: true } },
    },
  });
  if (!asset) notFound();

  const passes = asset.metaSceneId
    ? await prisma.cinematicNarrativePass.findMany({
        where: { metaSceneId: asset.metaSceneId },
        orderBy: { updatedAt: "desc" },
        take: 40,
        select: { id: true, passType: true, status: true, summary: true },
      })
    : [];

  const field =
    "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/admin/meta-scenes" className="text-sm text-amber-900 hover:underline">
        ← Admin
      </Link>
      <PageHeader title={asset.title} description="Audio sync segment map (segment-level, not word-level)." />

      {sp.sync ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Wrote {sp.sync} segment(s).
        </p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
        <p className="text-xs text-stone-600">
          Meta:{" "}
          {asset.metaScene ? (
            <Link className="text-amber-900 underline" href={`/admin/meta-scenes/${asset.metaScene.id}/cinematic`}>
              {asset.metaScene.title}
            </Link>
          ) : (
            "—"
          )}
        </p>
        <p className="text-xs text-stone-600">
          Scene: {asset.scene ? asset.scene.description.slice(0, 80) : "—"}
        </p>
        {passes.length > 0 ? (
          <form action={buildAudioSyncFromPassAction} className="flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4">
            <input type="hidden" name="sceneAudioAssetId" value={id} />
            <input type="hidden" name="metaSceneId" value={asset.metaSceneId ?? ""} />
            <label className="text-xs text-stone-600 flex-1 min-w-[14rem]">
              Cinematic pass
              <select name="passId" className={`${field} mt-1`} required>
                {passes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.passType} ({p.status}) {p.summary?.slice(0, 40) ?? ""}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white">
              Rebuild segments
            </button>
          </form>
        ) : (
          <p className="text-sm text-stone-500">Link a meta scene and create cinematic passes first.</p>
        )}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Segments ({asset.audioSyncSegments.length})</h2>
        <ul className="mt-4 space-y-3">
          {asset.audioSyncSegments.map((s) => (
            <li key={s.id} className="rounded-md border border-stone-100 bg-stone-50 p-3 text-xs">
              <p className="font-mono text-stone-500">
                #{s.segmentOrder}{" "}
                {s.startTimeMs != null || s.endTimeMs != null
                  ? `${s.startTimeMs ?? "?"}–${s.endTimeMs ?? "?"} ms`
                  : "timing unset"}
                {s.cueType ? ` · ${s.cueType}` : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-stone-800">{s.textExcerpt ?? "—"}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
