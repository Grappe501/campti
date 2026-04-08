import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOpenQuestion } from "@/app/actions/questions";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import {
  getEvents,
  getOpenQuestionById,
  getPeople,
  getPlaces,
  getSources,
} from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

const statuses = ["open", "researching", "resolved"];

export default async function AdminQuestionDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const [q, people, places, events, sources] = await Promise.all([
    getOpenQuestionById(id),
    getPeople(),
    getPlaces(),
    getEvents(),
    getSources(),
  ]);
  if (!q) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/admin/questions" className="text-sm text-amber-900 hover:underline">
          ← All open questions
        </Link>
        <PageHeader title={q.title} description="Research thread and optional entity links." />
      </div>

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateOpenQuestion} className="space-y-4">
          <input type="hidden" name="id" value={q.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required defaultValue={q.title} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={5} defaultValue={q.description ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Status</span>
              <select name="status" className={fieldClass} defaultValue={q.status}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Priority (1–5)</span>
              <input name="priority" type="number" min={1} max={5} defaultValue={q.priority ?? ""} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked person</span>
              <select name="linkedPersonId" className={fieldClass} defaultValue={q.linkedPersonId ?? ""}>
                <option value="">—</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked place</span>
              <select name="linkedPlaceId" className={fieldClass} defaultValue={q.linkedPlaceId ?? ""}>
                <option value="">—</option>
                {places.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked event</span>
              <select name="linkedEventId" className={fieldClass} defaultValue={q.linkedEventId ?? ""}>
                <option value="">—</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked source</span>
              <select name="linkedSourceId" className={fieldClass} defaultValue={q.linkedSourceId ?? ""}>
                <option value="">—</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
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

      <DetailSection title="Linked entities (read-only preview)">
        <ul className="space-y-2 text-sm">
          <li>
            Person:{" "}
            {q.linkedPerson ? (
              <Link href={`/admin/people/${q.linkedPerson.id}`} className="text-amber-900 hover:underline">
                {q.linkedPerson.name}
              </Link>
            ) : (
              "—"
            )}
          </li>
          <li>
            Place:{" "}
            {q.linkedPlace ? (
              <Link href={`/admin/places/${q.linkedPlace.id}`} className="text-amber-900 hover:underline">
                {q.linkedPlace.name}
              </Link>
            ) : (
              "—"
            )}
          </li>
          <li>
            Event:{" "}
            {q.linkedEvent ? (
              <Link href={`/admin/events/${q.linkedEvent.id}`} className="text-amber-900 hover:underline">
                {q.linkedEvent.title}
              </Link>
            ) : (
              "—"
            )}
          </li>
          <li>
            Source:{" "}
            {q.linkedSource ? (
              <Link href={`/admin/sources/${q.linkedSource.id}`} className="text-amber-900 hover:underline">
                {q.linkedSource.title}
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
