import Link from "next/link";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { createChapter } from "@/app/actions/chapters";
import { AdminFormError } from "@/components/admin-form-error";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getChapters } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

export default async function AdminChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const chapters = await getChapters();

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Chapters"
        description="Book structure: planning fields, POV, and public-facing notes for the reader site."
      />
      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Create chapter</h2>
        <form action={createChapter} className="mt-4 space-y-4">
          <label className={labelClass}>
            <span className={labelSpanClass}>Title</span>
            <input name="title" required className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Chapter number</span>
              <input name="chapterNumber" type="number" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Status</span>
              <input name="status" className={fieldClass} placeholder="planned, drafting, revised, approved" />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Summary</span>
            <textarea name="summary" rows={3} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Time period</span>
            <input name="timePeriod" className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>POV</span>
              <input name="pov" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Historical anchor</span>
              <input name="historicalAnchor" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Private notes</span>
            <textarea name="privateNotes" rows={2} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Public notes</span>
            <textarea name="publicNotes" rows={2} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={RecordType.FICTIONAL}>
                {Object.values(RecordType).map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save chapter
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">All chapters</h2>
        {chapters.length === 0 ? (
          <EmptyState title="No chapters yet." />
        ) : (
          <AdminTable
            rows={chapters}
            rowKey={(c) => c.id}
            columns={[
              {
                key: "num",
                header: "#",
                className: "w-12 tabular-nums",
                cell: (c) => c.chapterNumber ?? "—",
              },
              {
                key: "title",
                header: "Title",
                cell: (c) => (
                  <Link href={`/admin/chapters/${c.id}`} className="font-medium text-amber-900 hover:underline">
                    {c.title}
                  </Link>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (c) => c.status ?? "—",
              },
              {
                key: "meta",
                header: "Visibility",
                cell: (c) => <RecordMetaBadges visibility={c.visibility} recordType={c.recordType} />,
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
