import Link from "next/link";
import { notFound } from "next/navigation";
import { updateChapter } from "@/app/actions/chapters";
import { updateSceneOrderInChapter } from "@/app/actions/scenes";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getChapterById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function AdminChapterDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const chapter = await getChapterById(id);
  if (!chapter) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/chapters" className="text-sm text-amber-900 hover:underline">
          ← All chapters
        </Link>
        <PageHeader
          title={chapter.title}
          description={
            chapter.chapterNumber != null
              ? `Chapter ${chapter.chapterNumber}. Planning and linked story objects.`
              : "Planning and linked story objects."
          }
        />
      </div>

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Edit chapter</h2>
        <form action={updateChapter} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={chapter.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required defaultValue={chapter.title} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Chapter number</span>
              <input name="chapterNumber" type="number" defaultValue={chapter.chapterNumber ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Status</span>
              <input name="status" defaultValue={chapter.status ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Summary</span>
            <textarea name="summary" rows={3} defaultValue={chapter.summary ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Time period</span>
            <input name="timePeriod" defaultValue={chapter.timePeriod ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>POV</span>
              <input name="pov" defaultValue={chapter.pov ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Historical anchor</span>
              <input name="historicalAnchor" defaultValue={chapter.historicalAnchor ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Private notes</span>
            <textarea name="privateNotes" rows={3} defaultValue={chapter.privateNotes ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Public notes</span>
            <textarea name="publicNotes" rows={3} defaultValue={chapter.publicNotes ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={chapter.visibility}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={chapter.recordType}>
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

      <DetailSection title="Metadata">
        <RecordMetaBadges visibility={chapter.visibility} recordType={chapter.recordType} />
      </DetailSection>

      <DetailSection title="Scenes">
        {chapter.scenes.length === 0 ? (
          <p className="text-stone-600">No scenes yet. Add scenes from the Scenes admin.</p>
        ) : (
          <ul className="space-y-3">
            {chapter.scenes.map((s) => (
              <li key={s.id} className="rounded-lg border border-stone-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/scenes/${s.id}`} className="text-amber-900 hover:underline">
                      {s.orderInChapter != null ? `${s.orderInChapter}. ` : ""}
                      {s.summary?.slice(0, 80) ?? s.description.slice(0, 80)}
                      {(s.summary ?? s.description).length > 80 ? "…" : ""}
                    </Link>
                    <p className="mt-1 text-xs text-stone-600">
                      Status: <span className="font-medium text-stone-900">{s.sceneStatus ?? "—"}</span>{" "}
                      · Mode: <span className="font-medium text-stone-900">{s.writingMode}</span>
                    </p>
                    <p className="mt-1 text-xs">
                      <Link href={`/admin/scenes/${s.id}/workspace`} className="text-amber-900 hover:underline">
                        Open workspace →
                      </Link>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <form action={updateSceneOrderInChapter} className="flex items-end gap-2">
                      <input type="hidden" name="sceneId" value={s.id} />
                      <label className="text-xs text-stone-600">
                        <span className="block mb-1">Order</span>
                        <input
                          name="orderInChapter"
                          type="number"
                          defaultValue={s.orderInChapter ?? ""}
                          className="w-24 rounded-md border border-stone-300 px-3 py-2 text-sm"
                        />
                      </label>
                      <button
                        type="submit"
                        className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
                      >
                        Save
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="People">
        {chapter.persons.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {chapter.persons.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/people/${p.id}`} className="text-amber-900 hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Places">
        {chapter.places.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {chapter.places.map((pl) => (
              <li key={pl.id}>
                <Link href={`/admin/places/${pl.id}`} className="text-amber-900 hover:underline">
                  {pl.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Events">
        {chapter.events.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {chapter.events.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/events/${e.id}`} className="text-amber-900 hover:underline">
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Sources">
        {chapter.sources.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {chapter.sources.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/sources/${s.id}`} className="text-amber-900 hover:underline">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Continuity notes">
        {chapter.continuityNotes.length === 0 ? (
          <p className="text-stone-600">
            No notes linked to this chapter. Use the Continuity admin to track timeline and identity conflicts.
          </p>
        ) : (
          <ul className="space-y-1">
            {chapter.continuityNotes.map((n) => (
              <li key={n.id}>
                <Link href={`/admin/continuity/${n.id}`} className="text-amber-900 hover:underline">
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
