import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { buildAudioCueBundle } from "@/lib/audio-cue-map";
import { buildGravityTimingContext } from "@/lib/emotional-gravity";
import { getMetaSceneByIdForAdmin } from "@/lib/data-access";
import {
  buildNarrativeConsciousnessContext,
} from "@/lib/narrative-consciousness";
import {
  buildPerceptionStream,
  derivePerceptionTiming,
  groupPerceptionUnitsForRender,
} from "@/lib/perception-stream";
import { prisma } from "@/lib/prisma";
import { renderPerceptionStream, resolveVoiceProfileForMetaScene } from "@/lib/voice-fusion";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MetaScenePerceptionDebugPage({ params }: Props) {
  const { id } = await params;
  const meta = await getMetaSceneByIdForAdmin(id);
  if (!meta) notFound();

  const pass = await prisma.metaSceneNarrativePass.findFirst({
    where: { metaSceneId: id, status: { in: ["accepted", "revised"] } },
    orderBy: { updatedAt: "desc" },
    select: { content: true },
  });
  const readingText = pass?.content?.trim() ?? "";

  const [stream, ctx] = await Promise.all([
    buildPerceptionStream(id, {
      readingText,
      includeContinuationUnit: true,
      preambleCap: 12,
    }),
    buildNarrativeConsciousnessContext(id, { includeRelationships: true }),
  ]);

  const gravity = stream?.gravity ?? (await buildGravityTimingContext(id));

  const voice = await resolveVoiceProfileForMetaScene(id, ctx);
  const fusionPreview = stream
    ? renderPerceptionStream(stream.units, voice, {
        style: "immersive_perception",
        gravity: stream.gravity,
      })
    : [];
  const groups = stream ? groupPerceptionUnitsForRender(stream.units) : [];
  const cues = stream ? buildAudioCueBundle(stream.units) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <div>
        <Link href={`/admin/meta-scenes/${id}`} className="text-sm text-amber-900 hover:underline">
          ← Meta scene
        </Link>
        <PageHeader
          title="Perception stream (internal)"
          description="Debug ordering, timing hints, voice fusion preview, and gravity influence. Not shown to readers."
        />
        <p className="mt-2 text-xs text-stone-500">
          Meta scene ID: <code className="break-all">{id}</code>
        </p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-800">Emotional gravity (timing)</h2>
        <dl className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-stone-500">Overall pressure</dt>
            <dd>{gravity.overallPressure.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-stone-500">Tenderness</dt>
            <dd>{gravity.tenderness.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-stone-500">Threat</dt>
            <dd>{gravity.threat.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-stone-500">Mystery</dt>
            <dd>{gravity.mystery.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-stone-500">Longing</dt>
            <dd>{gravity.longing.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-800">Perception units</h2>
        {!stream?.units.length ? (
          <p className="mt-2 text-sm text-stone-600">No units (consciousness context missing or empty).</p>
        ) : (
          <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm text-stone-700">
            {stream.units.map((u) => {
              const timing = derivePerceptionTiming(u, gravity);
              return (
                <li key={u.id} className="marker:text-stone-400">
                  <span className="font-mono text-xs text-amber-900/90">{u.unitType}</span>
                  {u.timingHint ? (
                    <span className="ml-2 text-xs text-stone-500">hint: {u.timingHint}</span>
                  ) : null}
                  <p className="mt-1 leading-relaxed">{u.summary}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    delay ~{timing.baseDelayMs}ms · hold +{timing.holdExtraMs}ms
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-800">Render groups</h2>
        <ul className="mt-3 space-y-2 font-mono text-xs text-stone-600">
          {groups.map((g) => (
            <li key={g.key}>
              {g.unitIds.join(" + ")} · {g.timingHint}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-800">Voice fusion preview (immersive)</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700">
          {fusionPreview.length ? (
            fusionPreview.map((para, i) => (
              <p key={i} className="whitespace-pre-wrap border-b border-stone-100 pb-3 last:border-0">
                {para}
              </p>
            ))
          ) : (
            <p className="text-stone-600">No preview.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-800">Audio cue hints</h2>
        {!cues?.cues.length ? (
          <p className="mt-2 text-sm text-stone-600">None derived.</p>
        ) : (
          <ul className="mt-3 space-y-1 font-mono text-xs text-stone-600">
            {cues.cues.map((c) => (
              <li key={`${c.unitId}-${c.kind}`}>
                {c.kind} · {c.unitId} · w={c.weight.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
