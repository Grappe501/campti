import Link from "next/link";
import { notFound } from "next/navigation";
import { updateEvent } from "@/app/actions/events";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getEventById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { EventType, RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function AdminEventDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/events" className="text-sm text-amber-900 hover:underline">
          ← All events
        </Link>
        <PageHeader title={event.title} description="Participants, geography, and narrative placement." />
      </div>

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Edit event</h2>
        <form action={updateEvent} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={event.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required defaultValue={event.title} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={3} defaultValue={event.description ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Event type</span>
              <select name="eventType" className={fieldClass} defaultValue={event.eventType}>
                {Object.values(EventType).map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={event.visibility}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Record type</span>
            <select name="recordType" className={fieldClass} defaultValue={event.recordType}>
              {Object.values(RecordType).map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Start year</span>
              <input name="startYear" type="number" defaultValue={event.startYear ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>End year</span>
              <input name="endYear" type="number" defaultValue={event.endYear ?? ""} className={fieldClass} />
            </label>
          </div>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save changes
          </button>
        </form>
      </section>

      <DetailSection title="Summary">
        <RecordMetaBadges visibility={event.visibility} recordType={event.recordType} />
        <p className="mt-2 text-stone-700">
          Type: <strong>{event.eventType.replaceAll("_", " ")}</strong>
        </p>
      </DetailSection>

      <DetailSection title="Related people">
        {event.persons.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {event.persons.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/people/${p.id}`} className="text-amber-900 hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Related places">
        {event.places.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {event.places.map((pl) => (
              <li key={pl.id}>
                <Link href={`/admin/places/${pl.id}`} className="text-amber-900 hover:underline">
                  {pl.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Related chapters">
        {event.chapters.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {event.chapters.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/chapters/${c.id}`} className="text-amber-900 hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Scenes">
        {event.scenes.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {event.scenes.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/scenes/${s.id}`} className="text-amber-900 hover:underline">
                  {s.description.slice(0, 80)}
                  {s.description.length > 80 ? "…" : ""}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Linked sources">
        {event.sources.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {event.sources.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/sources/${s.id}`} className="text-amber-900 hover:underline">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Open questions & continuity">
        {event.openQuestions.length === 0 ? (
          <p className="text-stone-600">No open questions linked.</p>
        ) : (
          <ul className="space-y-1">
            {event.openQuestions.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/questions/${q.id}`} className="text-amber-900 hover:underline">
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {event.continuityNotes.length > 0 ? (
          <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3">
            {event.continuityNotes.map((n) => (
              <li key={n.id}>
                <Link href={`/admin/continuity/${n.id}`} className="text-amber-900 hover:underline">
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-stone-500">No continuity notes linked.</p>
        )}
      </DetailSection>
    </div>
  );
}
