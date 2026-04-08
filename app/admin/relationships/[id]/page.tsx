import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteCharacterRelationshipAction,
  upsertCharacterRelationshipAction,
} from "@/app/actions/scene-soul";
import {
  enhanceRelationshipDynamicCacheAction,
  generateRelationshipDynamicCacheAction,
} from "@/app/actions/narrative-passes";
import { SyntheticRead } from "@/components/synthetic-read";
import { describeRelationshipDyadRichly } from "@/lib/descriptive-synthesis";
import { PageHeader } from "@/components/page-header";
import { getPeople, getRelationshipById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RelationshipDetailPage({ params }: Props) {
  const { id } = await params;
  const row = await getRelationshipById(id);
  if (!row) notFound();

  const people = await getPeople();
  const dyadSynthesis = await describeRelationshipDyadRichly(id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/admin/relationships" className="text-sm text-amber-900 hover:underline">
          ← Relationships
        </Link>
        <PageHeader
          title={`${row.personA.name} ↔ ${row.personB.name}`}
          description="Edit interpretive dynamics. Ordering is normalized (A/B) internally."
        />
      </div>

      <section className="rounded-xl border border-violet-100 bg-violet-50/20 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Dyad synthesis</h2>
        <p className="mt-1 text-sm text-stone-600">Interpretive — uses authored fields + type law where available.</p>
        <div className="mt-4 max-h-[28rem] overflow-y-auto">
          <SyntheticRead title="Relationship dynamics (live read)">{dyadSynthesis}</SyntheticRead>
        </div>
        {row.generatedDynamicSummary ? (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <SyntheticRead title="Cached generated summary (field)">{row.generatedDynamicSummary}</SyntheticRead>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={generateRelationshipDynamicCacheAction}>
            <input type="hidden" name="relationshipId" value={id} />
            <button
              type="submit"
              className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-950 hover:bg-violet-100"
            >
              Save template synthesis to cache
            </button>
          </form>
          <form action={enhanceRelationshipDynamicCacheAction}>
            <input type="hidden" name="relationshipId" value={id} />
            <button
              type="submit"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
            >
              Enhance cache with OpenAI
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={upsertCharacterRelationshipAction} className="space-y-4">
          <input type="hidden" name="id" value={row.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Person A</span>
              <select name="personAId" className={fieldClass} defaultValue={row.personAId} required>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Person B</span>
              <select name="personBId" className={fieldClass} defaultValue={row.personBId} required>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Relationship type</span>
            <input name="relationshipType" className={fieldClass} defaultValue={row.relationshipType} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Summary</span>
            <textarea name="relationshipSummary" rows={3} className={fieldClass} defaultValue={row.relationshipSummary ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Emotional pattern</span>
            <textarea name="emotionalPattern" rows={2} className={fieldClass} defaultValue={row.emotionalPattern ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Conflict pattern</span>
            <textarea name="conflictPattern" rows={2} className={fieldClass} defaultValue={row.conflictPattern ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Attachment pattern</span>
            <textarea name="attachmentPattern" rows={2} className={fieldClass} defaultValue={row.attachmentPattern ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Power dynamic</span>
            <textarea name="powerDynamic" rows={2} className={fieldClass} defaultValue={row.powerDynamic ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Enneagram dynamic</span>
            <textarea name="enneagramDynamic" rows={3} className={fieldClass} defaultValue={row.enneagramDynamic ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Confidence (1–5)</span>
            <input
              name="confidence"
              type="number"
              min={1}
              max={5}
              className={fieldClass}
              defaultValue={row.confidence ?? ""}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} defaultValue={row.notes ?? ""} />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
            >
              Save
            </button>
          </div>
        </form>
        <form action={deleteCharacterRelationshipAction} className="mt-6 border-t border-stone-100 pt-4">
          <input type="hidden" name="id" value={row.id} />
          <button type="submit" className="text-sm text-rose-800 hover:underline">
            Delete relationship
          </button>
        </form>
      </section>
    </div>
  );
}
