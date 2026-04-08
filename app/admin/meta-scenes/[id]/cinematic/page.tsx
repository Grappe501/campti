import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getMetaSceneByIdForAdmin } from "@/lib/data-access";
import { prisma } from "@/lib/prisma";
import {
  buildAudioSyncFromPassAction,
  generateCinematicNarrativePassAction,
  runCinematicAiEnhanceAction,
  updateCinematicPassStatusAction,
} from "@/app/actions/cinematic-narrative";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function MetaSceneCinematicPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const meta = await getMetaSceneByIdForAdmin(id);
  if (!meta) notFound();

  const [passes, audioAssets, metaScenesPicker, people] = await Promise.all([
    prisma.cinematicNarrativePass.findMany({
      where: { metaSceneId: id },
      orderBy: [{ sequenceOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.sceneAudioAsset.findMany({
      where: {
        OR: [{ metaSceneId: id }, ...(meta.sceneId ? [{ sceneId: meta.sceneId }] : [])],
      },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { audioSyncSegments: true } } },
    }),
    prisma.metaScene.findMany({
      where: { id: { not: id } },
      orderBy: { title: "asc" },
      take: 80,
      select: { id: true, title: true },
    }),
    prisma.person.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 200 }),
  ]);

  const field =
    "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/meta-scenes/${id}`} className="text-sm text-amber-900 hover:underline">
          ← Meta scene
        </Link>
        <PageHeader
          title="Cinematic passes"
          description="Generate prose-level passes, publish to the public surface, and build audio sync maps."
        />
      </div>

      {sp.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Something went wrong ({sp.error}). Check OpenAI keys for AI enhance, or required fields for
          transitions / alternate POV.
        </p>
      ) : null}
      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved.
        </p>
      ) : null}
      {sp.sync ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800">
          Wrote {sp.sync} sync segment(s).
        </p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">Generate pass</h2>
        <form action={generateCinematicNarrativePassAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="metaSceneId" value={id} />
          <label className="block text-xs font-medium text-stone-600 sm:col-span-2">
            Pass type
            <select name="passType" className={`${field} mt-1`} required>
              <option value="opening">opening</option>
              <option value="full_scene">full_scene</option>
              <option value="cinematic_excerpt">cinematic_excerpt</option>
              <option value="audio_script">audio_script</option>
              <option value="premium_extended">premium_extended</option>
              <option value="transition">transition</option>
              <option value="alternate_pov">alternate_pov</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-stone-600">
            Style (optional)
            <input name="styleMode" className={`${field} mt-1`} placeholder="e.g. cinematic_lyrical" />
          </label>
          <label className="block text-xs font-medium text-stone-600">
            Source pass id (optional)
            <input name="sourcePassId" className={`${field} mt-1`} placeholder="narrative or voice pass id" />
          </label>
          <label className="block text-xs font-medium text-stone-600 sm:col-span-2">
            Transition → target meta scene
            <select name="toMetaSceneId" className={`${field} mt-1`}>
              <option value="">—</option>
              {metaScenesPicker.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-stone-600 sm:col-span-2">
            Alternate POV person
            <select name="personId" className={`${field} mt-1`}>
              <option value="">—</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 sm:col-span-2"
          >
            Generate (template engine)
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">Passes</h2>
        <p className="text-xs text-stone-500">
          Set status to <strong>published</strong> for public reading / sync eligibility. Narrative passes
          still use accepted/revised; cinematic uses published as the public gate.
        </p>
        <ul className="space-y-6">
          {passes.map((p) => (
            <li key={p.id} className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-stone-800">
                  {p.passType}{" "}
                  <span className="text-xs font-normal text-stone-500">({p.status})</span>
                </p>
                <span className="text-xs text-stone-500">{p.id}</span>
              </div>
              {p.summary ? <p className="mt-1 text-xs text-stone-600">{p.summary}</p> : null}
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-xs text-stone-800">
                {p.content.slice(0, 4000)}
                {p.content.length > 4000 ? "…" : ""}
              </pre>
              <form action={updateCinematicPassStatusAction} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="passId" value={p.id} />
                <input type="hidden" name="metaSceneId" value={id} />
                <label className="text-xs text-stone-600">
                  Status
                  <select name="status" className={`${field} mt-1`} defaultValue={p.status}>
                    <option value="generated">generated</option>
                    <option value="accepted">accepted</option>
                    <option value="revised">revised</option>
                    <option value="rejected">rejected</option>
                    <option value="archived">archived</option>
                    <option value="published">published</option>
                  </select>
                </label>
                <label className="text-xs text-stone-600 flex-1 min-w-[12rem]">
                  Notes
                  <input name="notes" className={`${field} mt-1`} defaultValue={p.notes ?? ""} />
                </label>
                <button type="submit" className="rounded-md border border-stone-300 px-3 py-2 text-xs">
                  Update
                </button>
              </form>
              <form action={runCinematicAiEnhanceAction} className="mt-2 flex flex-wrap gap-2">
                <input type="hidden" name="kind" value="pass" />
                <input type="hidden" name="metaSceneId" value={id} />
                <input type="hidden" name="passId" value={p.id} />
                <input type="hidden" name="passType" value={p.passType} />
                <button
                  type="submit"
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-950"
                >
                  AI refine this pass
                </button>
              </form>
              <div className="mt-3 space-y-2 border-t border-dashed border-stone-200 pt-3">
                <p className="text-xs font-medium text-stone-700">Build sync from pass + audio asset</p>
                {audioAssets.length === 0 ? (
                  <p className="text-xs text-stone-500">No scene audio rows linked to this meta/scene.</p>
                ) : (
                  <form action={buildAudioSyncFromPassAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="passId" value={p.id} />
                    <input type="hidden" name="metaSceneId" value={id} />
                    <label className="text-xs text-stone-600">
                      Audio asset
                      <select name="sceneAudioAssetId" className={`${field} mt-1`} required>
                        {audioAssets.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({a.assetType}) — {a._count.audioSyncSegments} segments
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" className="rounded-md bg-stone-800 px-3 py-2 text-xs text-white">
                      Rebuild sync segments
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
        {passes.length === 0 ? <p className="text-sm text-stone-500">No cinematic passes yet.</p> : null}
      </section>

      <p className="text-sm">
        <Link href={`/admin/meta-scenes/${id}/experience-tuning`} className="text-amber-900 hover:underline">
          Experience tuning &amp; beat debug →
        </Link>
      </p>
    </div>
  );
}
