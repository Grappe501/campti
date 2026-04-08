import Link from "next/link";
import { RecordType, VisibilityStatus } from "@prisma/client";
import { createPerson } from "@/app/actions/people";
import { AdminFormError } from "@/components/admin-form-error";
import { AdminTable } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getPeople } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const people = await getPeople();

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="People"
        description="Cast, historical figures, and narrative personas. Visibility gates the public reader."
      />
      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Create person</h2>
        <form action={createPerson} className="mt-4 space-y-4">
          <label className={labelClass}>
            <span className={labelSpanClass}>Name</span>
            <input name="name" required className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" rows={3} className={fieldClass} />
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
              <select name="recordType" className={fieldClass} defaultValue={RecordType.HYBRID}>
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
              <input name="birthYear" type="number" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Death year</span>
              <input name="deathYear" type="number" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Enneagram (1–9)</span>
              <input name="enneagram" type="number" min={1} max={9} className={fieldClass} />
            </label>
          </div>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save person
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900">All people</h2>
        {people.length === 0 ? (
          <EmptyState title="No people yet." />
        ) : (
          <AdminTable
            rows={people}
            rowKey={(p) => p.id}
            columns={[
              {
                key: "name",
                header: "Name",
                cell: (p) => (
                  <Link href={`/admin/people/${p.id}`} className="font-medium text-amber-900 hover:underline">
                    {p.name}
                  </Link>
                ),
              },
              {
                key: "meta",
                header: "Visibility / record",
                cell: (p) => <RecordMetaBadges visibility={p.visibility} recordType={p.recordType} />,
              },
              {
                key: "years",
                header: "Years",
                className: "tabular-nums text-stone-600",
                cell: (p) =>
                  [p.birthYear, p.deathYear].filter(Boolean).length
                    ? `${p.birthYear ?? "—"} – ${p.deathYear ?? "—"}`
                    : "—",
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
