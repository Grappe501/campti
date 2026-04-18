import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { updateScene } from "@/app/actions/scenes";
import { AdminFormError } from "@/components/admin-form-error";
import { SceneDecisionAssistTabSection } from "@/components/admin/scene-decision-assist-tab-section";
import { SceneDetailPreflightInline } from "@/components/admin/scene-detail-preflight-inline";
import { ScenePreflightTabSection } from "@/components/admin/scene-preflight-tab-section";
import { SceneResearchTabSection } from "@/components/admin/scene-research-tab-section";
import { SceneRunLedgerTabSection } from "@/components/admin/scene-run-ledger-tab-section";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getChapters, getSceneByIdFull } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; tab?: "edit" | "research" | "preflight" | "runs" | "assist" | string }>;
};

export default async function AdminSceneDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const tab =
    sp.tab === "research"
      ? "research"
      : sp.tab === "preflight"
        ? "preflight"
        : sp.tab === "runs"
          ? "runs"
          : sp.tab === "assist"
            ? "assist"
            : "edit";
  const [scene, chapters] = await Promise.all([getSceneByIdFull(id), getChapters()]);
  if (!scene) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/scenes" className="text-sm text-amber-900 hover:underline">
          ← All scenes
        </Link>
        <PageHeader title={scene.description} description="Scene beat: POV, place, and historical tether." />
      </div>

      <nav className="flex gap-2 border-b border-stone-200 pb-2 text-sm font-medium">
        <Link
          href={`/admin/scenes/${scene.id}`}
          className={tab === "edit" ? "rounded-full bg-stone-900 px-4 py-1.5 text-amber-50" : "rounded-full px-4 py-1.5 text-stone-700 hover:bg-stone-100"}
        >
          Details
        </Link>
        <Link
          href={`/admin/scenes/${scene.id}?tab=research`}
          className={tab === "research" ? "rounded-full bg-violet-900 px-4 py-1.5 text-violet-50" : "rounded-full px-4 py-1.5 text-stone-700 hover:bg-stone-100"}
        >
          Research
        </Link>
        <Link
          href={`/admin/scenes/${scene.id}?tab=preflight`}
          className={tab === "preflight" ? "rounded-full bg-stone-900 px-4 py-1.5 text-amber-50" : "rounded-full px-4 py-1.5 text-stone-700 hover:bg-stone-100"}
        >
          Preflight
        </Link>
        <Link
          href={`/admin/scenes/${scene.id}?tab=runs`}
          className={tab === "runs" ? "rounded-full bg-amber-900 px-4 py-1.5 text-amber-50" : "rounded-full px-4 py-1.5 text-stone-700 hover:bg-stone-100"}
        >
          Runs
        </Link>
        <Link
          href={`/admin/scenes/${scene.id}?tab=assist`}
          className={tab === "assist" ? "rounded-full bg-teal-900 px-4 py-1.5 text-teal-50" : "rounded-full px-4 py-1.5 text-stone-700 hover:bg-stone-100"}
        >
          Decision assist
        </Link>
      </nav>

      {tab === "assist" ? (
        <Suspense fallback={<p className="text-sm text-stone-600">Loading decision assist…</p>}>
          <SceneDecisionAssistTabSection sceneId={scene.id} />
        </Suspense>
      ) : tab === "research" ? (
        <Suspense fallback={<p className="text-sm text-stone-600">Loading scene research…</p>}>
          <SceneResearchTabSection sceneId={scene.id} />
        </Suspense>
      ) : tab === "preflight" ? (
        <Suspense fallback={<p className="text-sm text-stone-600">Loading scene generation preflight…</p>}>
          <ScenePreflightTabSection sceneId={scene.id} />
        </Suspense>
      ) : tab === "runs" ? (
        <Suspense fallback={<p className="text-sm text-stone-600">Loading run ledger…</p>}>
          <SceneRunLedgerTabSection sceneId={scene.id} />
        </Suspense>
      ) : (
        <>
          <AdminFormError error={sp.error} />

          <Suspense fallback={<p className="text-sm text-stone-600">Loading preflight snapshot…</p>}>
            <SceneDetailPreflightInline sceneId={scene.id} />
          </Suspense>

          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-stone-900">Edit scene</h2>
            <p className="mt-1 text-sm text-stone-600">
              Use the{" "}
              <Link href={`/admin/narrative?scope=scene&sceneId=${scene.id}`} className="font-medium text-amber-900 hover:underline">
                Author cockpit (scene)
              </Link>{" "}
              to write drafts, link entities, generate scaffolds, and view continuity warnings. Open the{" "}
              <Link href={`/admin/scenes/${scene.id}?tab=preflight`} className="font-medium text-stone-900 hover:underline">
                Preflight tab
              </Link>{" "}
              before model-backed generation. Use the{" "}
              <Link href={`/admin/scenes/${scene.id}?tab=research`} className="font-medium text-violet-900 hover:underline">
                Research tab
              </Link>{" "}
              for scene-local RICRE truth, the{" "}
              <Link href={`/admin/scenes/${scene.id}?tab=assist`} className="font-medium text-teal-900 hover:underline">
                Decision assist
              </Link>{" "}
              tab for advisory next steps, or the{" "}
              <Link href={`/admin/research?sceneId=${scene.id}`} className="font-medium text-violet-900 hover:underline">
                full research workbench
              </Link>{" "}
              for queue governance.
            </p>
            <form action={updateScene} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={scene.id} />
              <label className={labelClass}>
                <span className={labelSpanClass}>Chapter</span>
                <select name="chapterId" required className={fieldClass} defaultValue={scene.chapterId}>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.chapterNumber != null ? `${c.chapterNumber}. ` : ""}
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className={labelSpanClass}>Order in chapter</span>
                  <input name="orderInChapter" type="number" defaultValue={scene.orderInChapter ?? ""} className={fieldClass} />
                </label>
                <label className={labelClass}>
                  <span className={labelSpanClass}>Scene number</span>
                  <input name="sceneNumber" type="number" defaultValue={scene.sceneNumber ?? ""} className={fieldClass} />
                </label>
              </div>
              <label className={labelClass}>
                <span className={labelSpanClass}>Description (working title)</span>
                <input name="description" required defaultValue={scene.description} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Summary</span>
                <textarea name="summary" rows={3} defaultValue={scene.summary ?? ""} className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Historical anchor</span>
                <input name="historicalAnchor" defaultValue={scene.historicalAnchor ?? ""} className={fieldClass} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className={labelSpanClass}>Location note</span>
                  <input name="locationNote" defaultValue={scene.locationNote ?? ""} className={fieldClass} />
                </label>
                <label className={labelClass}>
                  <span className={labelSpanClass}>POV</span>
                  <input name="pov" defaultValue={scene.pov ?? ""} className={fieldClass} />
                </label>
              </div>
              <label className={labelClass}>
                <span className={labelSpanClass}>Private notes</span>
                <textarea name="privateNotes" rows={2} defaultValue={scene.privateNotes ?? ""} className={fieldClass} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className={labelSpanClass}>Visibility</span>
                  <select name="visibility" className={fieldClass} defaultValue={scene.visibility}>
                    {Object.values(VisibilityStatus).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  <span className={labelSpanClass}>Record type</span>
                  <select name="recordType" className={fieldClass} defaultValue={scene.recordType}>
                    {Object.values(RecordType).map((r) => (
                      <option key={r} value={r}>
                        {r.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
                Save changes
              </button>
            </form>
          </section>

          <DetailSection title="Summary">
            {scene.summary ? <p className="whitespace-pre-wrap text-stone-800">{scene.summary}</p> : <p className="text-stone-500">No summary yet.</p>}
          </DetailSection>

          <DetailSection title="Historical anchor">
            {scene.historicalAnchor ? (
              <p className="whitespace-pre-wrap text-stone-800">{scene.historicalAnchor}</p>
            ) : (
              <p className="text-stone-500">—</p>
            )}
          </DetailSection>

          <DetailSection title="Chapter">
            <p>
              <Link href={`/admin/chapters/${scene.chapter.id}`} className="font-medium text-amber-900 hover:underline">
                {scene.chapter.title}
              </Link>
            </p>
          </DetailSection>

          <DetailSection title="Classification">
            <RecordMetaBadges visibility={scene.visibility} recordType={scene.recordType} />
          </DetailSection>

          <DetailSection title="Related events">
            {scene.events.length === 0 ? (
              <p className="text-stone-600">None linked yet.</p>
            ) : (
              <ul className="space-y-1">
                {scene.events.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/events/${e.id}`} className="text-amber-900 hover:underline">
                      {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <DetailSection title="Continuity notes">
            {scene.continuityNotes.length === 0 ? (
              <p className="text-stone-600">None linked. Link from the Continuity admin when issues touch this scene.</p>
            ) : (
              <ul className="space-y-1">
                {scene.continuityNotes.map((n) => (
                  <li key={n.id}>
                    <Link href={`/admin/continuity/${n.id}`} className="text-amber-900 hover:underline">
                      {n.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        </>
      )}
    </div>
  );
}
