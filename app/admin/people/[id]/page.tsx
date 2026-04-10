import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePerson } from "@/app/actions/people";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getNarrativeBindingsForPerson, getPersonById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function AdminPersonDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const person = await getPersonById(id);
  if (!person) notFound();

  const narrativeBindings = await getNarrativeBindingsForPerson(id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/people" className="text-sm text-amber-900 hover:underline">
          ← All people
        </Link>
        <PageHeader title={person.name} description="Core identity, relationships, and story-facing notes." />
        <p className="mt-2 text-sm">
          <Link href={`/admin/characters/${person.id}/mind`} className="text-amber-900 hover:underline">
            Character mind (world model) →
          </Link>
          {" · "}
          <Link href={`/admin/characters/${person.id}/pressure`} className="text-amber-900 hover:underline">
            Pressure (Stage 5) →
          </Link>
          {" · "}
          <Link href={`/admin/characters/${person.id}/intelligence`} className="text-amber-900 hover:underline">
            Intelligence (Stage 5.5) →
          </Link>
          {" · "}
          <Link href={`/admin/characters/${person.id}/relationships`} className="text-amber-900 hover:underline">
            Relationships (Stage 6) →
          </Link>
          {" · "}
          <Link href={`/admin/characters/${person.id}/continuity`} className="text-amber-900 hover:underline">
            Continuity (Stage 6.5) →
          </Link>
        </p>
      </div>

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Edit person</h2>
        <form action={updatePerson} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={person.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Name</span>
            <input name="name" required defaultValue={person.name} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={4} defaultValue={person.description ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={person.visibility}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={person.recordType}>
                {Object.values(RecordType).map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Birth year</span>
              <input name="birthYear" type="number" defaultValue={person.birthYear ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Death year</span>
              <input name="deathYear" type="number" defaultValue={person.deathYear ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Enneagram (1–9)</span>
              <input name="enneagram" type="number" min={1} max={9} defaultValue={person.enneagram ?? ""} className={fieldClass} />
            </label>
          </div>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save changes
          </button>
        </form>
      </section>

      <DetailSection title="Core identity">
        <RecordMetaBadges visibility={person.visibility} recordType={person.recordType} />
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-stone-500">Birth year</dt>
            <dd className="font-medium text-stone-900">{person.birthYear ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Death year</dt>
            <dd className="font-medium text-stone-900">{person.deathYear ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Enneagram</dt>
            <dd className="font-medium text-stone-900">{person.enneagram ?? "—"}</dd>
          </div>
        </dl>
      </DetailSection>

      <DetailSection title="Related places">
        {person.places.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {person.places.map((pl) => (
              <li key={pl.id}>
                <Link href={`/admin/places/${pl.id}`} className="text-amber-900 hover:underline">
                  {pl.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Related events">
        {person.events.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {person.events.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/events/${e.id}`} className="text-amber-900 hover:underline">
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Chapter appearances">
        {person.chapters.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {person.chapters.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/chapters/${c.id}`} className="text-amber-900 hover:underline">
                  {c.chapterNumber != null ? `Ch. ${c.chapterNumber}: ` : ""}
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Linked sources">
        {person.sources.length === 0 ? (
          <p className="text-stone-600">
            No archive sources linked yet. When relationship pickers ship, tie oral histories and documents here.
          </p>
        ) : (
          <ul className="space-y-1">
            {person.sources.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/sources/${s.id}`} className="text-amber-900 hover:underline">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Narrative DNA bindings (incoming)">
        <p className="text-sm text-stone-600">
          Patterns, themes, and rules linked to this character via Admin → Bindings influence perspective context in the
          scene engine.
        </p>
        {narrativeBindings.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">None yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-stone-800">
            {narrativeBindings.map((b) => (
              <li key={b.id} className="rounded-md border border-stone-100 bg-white px-3 py-2">
                <span className="font-medium">
                  {b.sourceType}:{b.sourceId}
                </span>{" "}
                <span className="text-stone-500">{b.relationship}</span> this person
                {b.strength != null ? (
                  <span className="text-xs text-stone-500"> · strength {b.strength}</span>
                ) : null}
                {b.notes ? <p className="mt-1 text-xs text-stone-600">{b.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-stone-500">
          <Link href="/admin/bindings" className="text-amber-900 hover:underline">
            Manage bindings →
          </Link>
        </p>
      </DetailSection>

      <DetailSection title="Open questions & continuity">
        {person.openQuestions.length === 0 ? (
          <p className="text-stone-600">No open questions linked.</p>
        ) : (
          <ul className="space-y-1">
            {person.openQuestions.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/questions/${q.id}`} className="text-amber-900 hover:underline">
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {person.continuityNotes.length > 0 ? (
          <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3">
            {person.continuityNotes.map((n) => (
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
