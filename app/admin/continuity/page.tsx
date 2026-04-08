import Link from "next/link";
import { createContinuityNote } from "@/app/actions/continuity";
import { AdminFormError } from "@/components/admin-form-error";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  getChapters,
  getContinuityNotes,
  getEvents,
  getPeople,
  getScenes,
} from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Search = { severity?: string; status?: string; error?: string };

const severities = ["low", "medium", "high"];
const statuses = ["open", "resolved"];

export default async function AdminContinuityPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const notes = await getContinuityNotes({
    severity: sp.severity,
    status: sp.status,
  });
  const [chapters, scenes, people, events] = await Promise.all([
    getChapters(),
    getScenes(),
    getPeople(),
    getEvents(),
  ]);

  const filterHref = (next: Partial<Search>) => {
    const merged = { ...sp, ...next };
    const p = new URLSearchParams();
    if (merged.severity) p.set("severity", merged.severity);
    if (merged.status) p.set("status", merged.status);
    const q = p.toString();
    return q ? `/admin/continuity?${q}` : "/admin/continuity";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Continuity"
        description="Timeline risk, identity collisions, and lore conflicts. Resolve or track until fixed."
      />
      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-rose-200/60 bg-rose-50/30 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">New continuity note</h2>
        <form action={createContinuityNote} className="mt-4 space-y-4">
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={4} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Severity</span>
              <select name="severity" className={fieldClass} defaultValue="medium">
                {severities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Status</span>
              <select name="status" className={fieldClass} defaultValue="open">
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
              <select name="linkedChapterId" className={fieldClass}>
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
              <select name="linkedSceneId" className={fieldClass}>
                <option value="">—</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.description.slice(0, 60)}
                    {s.description.length > 60 ? "…" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked person</span>
              <select name="linkedPersonId" className={fieldClass}>
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
              <select name="linkedEventId" className={fieldClass}>
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
            Save note
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">All continuity notes</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-xs font-semibold uppercase text-stone-500">Severity</span>
          {severities.map((s) => (
            <Link
              key={s}
              href={filterHref({ severity: s })}
              className={`rounded-full px-2 py-0.5 capitalize ${sp.severity === s ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
            >
              {s}
            </Link>
          ))}
          <Link href={filterHref({ severity: undefined })} className="text-amber-900 hover:underline">
            Any
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-xs font-semibold uppercase text-stone-500">Status</span>
          {statuses.map((s) => (
            <Link
              key={s}
              href={filterHref({ status: s })}
              className={`rounded-full px-2 py-0.5 capitalize ${sp.status === s ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white"}`}
            >
              {s}
            </Link>
          ))}
          <Link href={filterHref({ status: undefined })} className="text-amber-900 hover:underline">
            Any
          </Link>
        </div>

        {notes.length === 0 ? (
          <EmptyState title="No notes match." />
        ) : (
          <AdminTable
            rows={notes}
            rowKey={(n) => n.id}
            columns={[
              {
                key: "title",
                header: "Note",
                cell: (n) => (
                  <Link href={`/admin/continuity/${n.id}`} className="font-medium text-amber-900 hover:underline">
                    {n.title}
                  </Link>
                ),
              },
              {
                key: "sev",
                header: "Severity",
                cell: (n) => <StatusBadge label={n.severity} />,
              },
              {
                key: "st",
                header: "Status",
                cell: (n) => <StatusBadge label={n.status} />,
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
