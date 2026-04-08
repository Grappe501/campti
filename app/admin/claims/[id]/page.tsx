import Link from "next/link";
import { notFound } from "next/navigation";
import { updateClaim } from "@/app/actions/claims";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { getClaimById, getSources } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function AdminClaimDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const [claim, sources] = await Promise.all([getClaimById(id), getSources()]);
  if (!claim) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/admin/claims" className="text-sm text-amber-900 hover:underline">
          ← All claims
        </Link>
        <PageHeader title="Claim" description="Edit verification metadata and source assignment." />
      </div>

      <AdminFormError error={sp.error} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={updateClaim} className="space-y-4">
          <input type="hidden" name="id" value={claim.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Source</span>
            <select name="sourceId" required className={fieldClass} defaultValue={claim.sourceId}>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Description</span>
            <textarea name="description" required rows={5} defaultValue={claim.description} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Confidence (1–5)</span>
              <input
                name="confidence"
                type="number"
                min={1}
                max={5}
                required
                defaultValue={claim.confidence}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={claim.visibility}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={claim.recordType}>
                {Object.values(RecordType).map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Quote excerpt</span>
            <textarea name="quoteExcerpt" rows={2} defaultValue={claim.quoteExcerpt ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} defaultValue={claim.notes ?? ""} className={fieldClass} />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="needsReview" defaultChecked={claim.needsReview} className="rounded border-stone-300" />
            Needs review
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save changes
          </button>
        </form>
      </section>

      <DetailSection title="Source">
        <p>
          <Link href={`/admin/sources/${claim.source.id}`} className="font-medium text-amber-900 hover:underline">
            {claim.source.title}
          </Link>
        </p>
        {claim.source.summary ? <p className="mt-2 text-stone-600">{claim.source.summary}</p> : null}
      </DetailSection>

      <DetailSection title="Classification">
        <RecordMetaBadges visibility={claim.visibility} recordType={claim.recordType} />
      </DetailSection>
    </div>
  );
}
