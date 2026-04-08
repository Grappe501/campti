import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePlace } from "@/app/actions/places";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getPlaceById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { PlaceType, RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function AdminPlaceDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const place = await getPlaceById(id);
  if (!place) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/places" className="text-sm text-amber-900 hover:underline">
          ← All places
        </Link>
        <PageHeader title={place.name} description="Geography, relationships, and research hooks." />
        <p className="mt-2 text-sm">
          <Link href={`/admin/places/${place.id}/environment`} className="text-amber-900 hover:underline">
            Environment / setting model →
          </Link>
        </p>
      </div>

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Edit place</h2>
        <form action={updatePlace} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={place.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Name</span>
            <input name="name" required defaultValue={place.name} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={3} defaultValue={place.description ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Place type</span>
              <select name="placeType" className={fieldClass} defaultValue={place.placeType}>
                {Object.values(PlaceType).map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={place.visibility}>
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
            <select name="recordType" className={fieldClass} defaultValue={place.recordType}>
              {Object.values(RecordType).map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Latitude</span>
              <input name="latitude" type="text" inputMode="decimal" defaultValue={place.latitude ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Longitude</span>
              <input name="longitude" type="text" inputMode="decimal" defaultValue={place.longitude ?? ""} className={fieldClass} />
            </label>
          </div>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save changes
          </button>
        </form>
      </section>

      <DetailSection title="Summary">
        <RecordMetaBadges visibility={place.visibility} recordType={place.recordType} />
        <p className="mt-2 text-stone-700">
          Type: <strong>{place.placeType.replaceAll("_", " ")}</strong>
        </p>
      </DetailSection>

      <DetailSection title="Related people">
        {place.persons.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {place.persons.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/people/${p.id}`} className="text-amber-900 hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Related events">
        {place.events.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {place.events.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/events/${e.id}`} className="text-amber-900 hover:underline">
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Related chapters">
        {place.chapters.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {place.chapters.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/chapters/${c.id}`} className="text-amber-900 hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Linked sources">
        {place.sources.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="space-y-1">
            {place.sources.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/sources/${s.id}`} className="text-amber-900 hover:underline">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Maps & research notes">
        <p className="text-stone-600">
          Placeholder for future map pins, survey overlays, and land-record citations. Use description and coordinates for now.
        </p>
      </DetailSection>

      <DetailSection title="Open questions">
        {place.openQuestions.length === 0 ? (
          <p className="text-stone-600">None linked.</p>
        ) : (
          <ul className="space-y-1">
            {place.openQuestions.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/questions/${q.id}`} className="text-amber-900 hover:underline">
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
