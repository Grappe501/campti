import Link from "next/link";
import {
  EventType,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";
import { createEvent } from "@/app/actions/events";
import { AdminFormError } from "@/components/admin-form-error";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getEvents } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Search = { visibility?: string; eventType?: string; error?: string };

function parseEnum<T extends string>(
  v: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!v) return undefined;
  return allowed.includes(v as T) ? (v as T) : undefined;
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filters = {
    visibility: parseEnum(sp.visibility, Object.values(VisibilityStatus)),
    eventType: parseEnum(sp.eventType, Object.values(EventType)),
  };
  const events = await getEvents(filters);

  const filterHref = (next: Partial<Search>) => {
    const merged = { ...sp, ...next };
    const p = new URLSearchParams();
    if (merged.visibility) p.set("visibility", merged.visibility);
    if (merged.eventType) p.set("eventType", merged.eventType);
    const q = p.toString();
    return q ? `/admin/events?${q}` : "/admin/events";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Events"
        description="Historical anchors and story beats. Types help classify research vs invention."
      />
      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Create event</h2>
        <form action={createEvent} className="mt-4 space-y-4">
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={3} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Event type</span>
              <select name="eventType" className={fieldClass} defaultValue={EventType.OTHER}>
                {Object.values(EventType).map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={VisibilityStatus.PRIVATE}>
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
            <select name="recordType" className={fieldClass} defaultValue={RecordType.HISTORICAL}>
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
              <input name="startYear" type="number" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>End year</span>
              <input name="endYear" type="number" className={fieldClass} />
            </label>
          </div>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save event
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">All events</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.values(EventType).slice(0, 8).map((t) => (
            <Link
              key={t}
              href={filterHref({ eventType: t })}
              className={`rounded-full px-2 py-0.5 ${sp.eventType === t ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
            >
              {t.replaceAll("_", " ")}
            </Link>
          ))}
          <Link href={filterHref({ eventType: undefined })} className="text-amber-900 hover:underline">
            Any type
          </Link>
        </div>

        {events.length === 0 ? (
          <EmptyState title="No events yet." />
        ) : (
          <AdminTable
            rows={events}
            rowKey={(e) => e.id}
            columns={[
              {
                key: "title",
                header: "Title",
                cell: (e) => (
                  <Link href={`/admin/events/${e.id}`} className="font-medium text-amber-900 hover:underline">
                    {e.title}
                  </Link>
                ),
              },
              {
                key: "type",
                header: "Type",
                cell: (e) => e.eventType.replaceAll("_", " "),
              },
              {
                key: "years",
                header: "Years",
                className: "tabular-nums",
                cell: (e) =>
                  e.startYear != null || e.endYear != null
                    ? `${e.startYear ?? "—"} – ${e.endYear ?? "—"}`
                    : "—",
              },
              {
                key: "meta",
                header: "Visibility / record",
                cell: (e) => <RecordMetaBadges visibility={e.visibility} recordType={e.recordType} />,
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
