import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getMetaSceneByIdForAdmin } from "@/lib/data-access";
import { prisma } from "@/lib/prisma";
import { saveSceneBeatsAction } from "@/app/actions/cinematic-narrative";
import { buildNarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import { deriveSceneBeatSequence } from "@/lib/scene-beats";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function ExperienceTuningPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const meta = await getMetaSceneByIdForAdmin(id);
  if (!meta) notFound();

  const [storedBeats, voiceProfile, cinematicPasses, voicePasses, audioAssets] = await Promise.all([
    prisma.sceneBeat.findMany({ where: { metaSceneId: id }, orderBy: { orderIndex: "asc" } }),
    prisma.narrativeVoiceProfile.findFirst({
      where: {
        OR: [{ scopeType: "scene_mode", scopeId: id }, { scopeType: "custom", scopeId: id }],
      },
    }),
    prisma.cinematicNarrativePass.findMany({
      where: { metaSceneId: id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, passType: true, status: true, summary: true },
    }),
    prisma.voicePass.findMany({
      where: { metaSceneId: id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, passType: true, status: true, summary: true },
    }),
    prisma.sceneAudioAsset.findMany({
      where: {
        OR: [{ metaSceneId: id }, ...(meta.sceneId ? [{ sceneId: meta.sceneId }] : [])],
      },
      include: { _count: { select: { audioSyncSegments: true } } },
    }),
  ]);

  const ctx = await buildNarrativeConsciousnessContext(id, {
    includeRelationships: true,
    publicOnly: false,
  });
  const liveBeats = ctx ? deriveSceneBeatSequence(ctx) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href={`/admin/meta-scenes/${id}/cinematic`} className="text-sm text-amber-900 hover:underline">
        ← Cinematic passes
      </Link>
      <PageHeader
        title="Experience tuning"
        description="Voice profile, derived beats, recent passes, and audio sync counts. Not public."
      />

      {sp.beats ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Scene beats saved to database.
        </p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-stone-900">Voice profile</h2>
        {voiceProfile ? (
          <pre className="max-h-56 overflow-auto rounded-md bg-stone-50 p-3 text-xs text-stone-800 whitespace-pre-wrap">
            {JSON.stringify(voiceProfile, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-stone-500">No NarrativeVoiceProfile scoped to this meta scene id.</p>
        )}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-stone-900">Scene beats</h2>
          <form action={saveSceneBeatsAction}>
            <input type="hidden" name="metaSceneId" value={id} />
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-3 py-1.5 text-xs text-white hover:bg-stone-800"
            >
              Persist derived beats
            </button>
          </form>
        </div>
        <p className="text-xs text-stone-500">
          Live derivation (from current consciousness context) vs. stored rows used for sync cue hints.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">Live</h3>
            <ul className="mt-2 space-y-2 text-xs text-stone-700">
              {liveBeats.map((b) => (
                <li key={b.beatType} className="rounded border border-stone-100 p-2">
                  <span className="font-semibold">{b.beatType}</span> — {b.summary.slice(0, 200)}
                  {b.pacingHint ? <span className="block text-stone-500 mt-1">{b.pacingHint}</span> : null}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">Stored</h3>
            <ul className="mt-2 space-y-2 text-xs text-stone-700">
              {storedBeats.length ? (
                storedBeats.map((b) => (
                  <li key={b.id} className="rounded border border-stone-100 p-2">
                    <span className="font-semibold">{b.beatType}</span> — {b.summary.slice(0, 200)}
                  </li>
                ))
              ) : (
                <li className="text-stone-500">None persisted.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-stone-900">Recent cinematic passes</h2>
        <ul className="text-xs text-stone-700 space-y-1">
          {cinematicPasses.map((p) => (
            <li key={p.id}>
              {p.passType} · {p.status} · {p.summary?.slice(0, 80) ?? p.id}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-stone-900">Voice passes</h2>
        <ul className="text-xs text-stone-700 space-y-1">
          {voicePasses.map((p) => (
            <li key={p.id}>
              {p.passType} · {p.status} · {p.summary?.slice(0, 80) ?? p.id}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-stone-900">Audio &amp; sync</h2>
        <ul className="text-xs text-stone-700 space-y-2">
          {audioAssets.map((a) => (
            <li key={a.id}>
              <Link className="text-amber-900 underline" href={`/admin/audio-sync/${a.id}`}>
                {a.title}
              </Link>{" "}
              — {a._count.audioSyncSegments} segments · {a.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
