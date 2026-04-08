import Link from "next/link";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { createScene } from "@/app/actions/scenes";
import { AdminFormError } from "@/components/admin-form-error";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getChapters, getScenes } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Search = { chapterId?: string; error?: string };

export default async function AdminScenesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const [scenes, chapters] = await Promise.all([
    getScenes(sp.chapterId ? { chapterId: sp.chapterId } : undefined),
    getChapters(),
  ]);

  const filterHref = (next: Partial<Search>) => {
    const merged = { ...sp, ...next };
    const p = new URLSearchParams();
    if (merged.chapterId) p.set("chapterId", merged.chapterId);
    const q = p.toString();
    return q ? `/admin/scenes?${q}` : "/admin/scenes";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Scenes"
        description="Beat-level planning inside chapters: order, POV, and anchors."
      />
      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Create scene</h2>
        <form action={createScene} className="mt-4 space-y-4">
          <label className={labelClass}>
            <span className={labelSpanClass}>Chapter</span>
            <select name="chapterId" required className={fieldClass}>
              <option value="">Select chapter</option>
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
              <input name="orderInChapter" type="number" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Scene number</span>
              <input name="sceneNumber" type="number" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description (working title / slug)</span>
            <input name="description" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Summary</span>
            <textarea name="summary" rows={3} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Historical anchor</span>
            <input name="historicalAnchor" className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Location note</span>
              <input name="locationNote" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>POV</span>
              <input name="pov" className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Private notes</span>
            <textarea name="privateNotes" rows={2} className={fieldClass} />
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
            Save scene
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">All scenes</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={filterHref({ chapterId: undefined })} className={!sp.chapterId ? "font-semibold text-stone-900" : "text-amber-900 hover:underline"}>
            All chapters
          </Link>
          {chapters.map((c) => (
            <Link
              key={c.id}
              href={filterHref({ chapterId: c.id })}
              className={sp.chapterId === c.id ? "font-semibold text-stone-900" : "text-amber-900 hover:underline"}
            >
              {c.title}
            </Link>
          ))}
        </div>

        {scenes.length === 0 ? (
          <EmptyState title="No scenes yet." />
        ) : (
          <AdminTable
            rows={scenes}
            rowKey={(s) => s.id}
            columns={[
              {
                key: "chapter",
                header: "Chapter",
                cell: (s) => s.chapter.title,
              },
              {
                key: "scene",
                header: "Scene",
                cell: (s) => (
                  <Link href={`/admin/scenes/${s.id}`} className="font-medium text-amber-900 hover:underline">
                    {s.description.slice(0, 72)}
                    {s.description.length > 72 ? "…" : ""}
                  </Link>
                ),
              },
              {
                key: "order",
                header: "Order",
                className: "tabular-nums",
                cell: (s) => s.orderInChapter ?? "—",
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
