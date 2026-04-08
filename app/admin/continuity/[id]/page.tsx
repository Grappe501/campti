import Link from "next/link";
import { notFound } from "next/navigation";
import { updateContinuityNote } from "@/app/actions/continuity";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import {
  getChapters,
  getContinuityNoteById,
  getEvents,
  getPeople,
  getScenes,
} from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

const severities = ["low", "medium", "high"];
const statuses = ["open", "resolved"];

export default async function AdminContinuityDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const [note, chapters, scenes, people, events] = await Promise.all([
    getContinuityNoteById(id),
    getChapters(),
    getScenes(),
    getPeople(),
    getEvents(),
  ]);
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/admin/continuity" className="text-sm text-amber-900 hover:underline">
          ← Continuity center
        </Link>
        <PageHeader title={note.title} description="Track resolution and linked story objects." />
      </div>

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateContinuityNote} className="space-y-4">
          <input type="hidden" name="id" value={note.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required defaultValue={note.title} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={5} defaultValue={note.description ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Severity</span>
              <select name="severity" className={fieldClass} defaultValue={note.severity}>
                {severities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Status</span>
              <select name="status" className={fieldClass} defaultValue={note.status}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked chapter</span>
              <select name="linkedChapterId" className={fieldClass} defaultValue={note.linkedChapterId ?? ""}>
                <option value="">—</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked scene</span>
              <select name="linkedSceneId" className={fieldClass} defaultValue={note.linkedSceneId ?? ""}>
                <option value="">—</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.description.slice(0, 60)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked person</span>
              <select name="linkedPersonId" className={fieldClass} defaultValue={note.linkedPersonId ?? ""}>
                <option value="">—</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked event</span>
              <select name="linkedEventId" className={fieldClass} defaultValue={note.linkedEventId ?? ""}>
                <option value="">—</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
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

      <DetailSection title="Resolved context">
        <ul className="space-y-2 text-sm text-stone-700">
          <li>
            Chapter:{" "}
            {note.linkedChapter ? (
              <Link href={`/admin/chapters/${note.linkedChapter.id}`} className="text-amber-900 hover:underline">
                {note.linkedChapter.title}
              </Link>
            ) : (
              "—"
            )}
          </li>
          <li>
            Scene:{" "}
            {note.linkedScene ? (
              <Link href={`/admin/scenes/${note.linkedScene.id}`} className="text-amber-900 hover:underline">
                {note.linkedScene.description}
              </Link>
            ) : (
              "—"
            )}
          </li>
          <li>
            Person:{" "}
            {note.linkedPerson ? (
              <Link href={`/admin/people/${note.linkedPerson.id}`} className="text-amber-900 hover:underline">
                {note.linkedPerson.name}
              </Link>
            ) : (
              "—"
            )}
          </li>
          <li>
            Event:{" "}
            {note.linkedEvent ? (
              <Link href={`/admin/events/${note.linkedEvent.id}`} className="text-amber-900 hover:underline">
                {note.linkedEvent.title}
              </Link>
            ) : (
              "—"
            )}
          </li>
        </ul>
      </DetailSection>
    </div>
  );
}
