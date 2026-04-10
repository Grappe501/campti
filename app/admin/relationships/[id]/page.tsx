import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createRelationshipDisclosureProfile,
  createRelationshipDynamicState,
  deleteRelationshipDynamicState,
  deleteRelationshipProfile,
  updateRelationshipDisclosureProfile,
  updateRelationshipDynamicState,
  updateRelationshipProfile,
} from "@/app/actions/relationship-order";
import { PageHeader } from "@/components/page-header";
import { getRelationshipProfileByIdForAdmin } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { PublicStatus, RecordType, RelationshipType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RelationshipProfileDetailPage({ params }: Props) {
  const { id } = await params;
  const r = await getRelationshipProfileByIdForAdmin(id);
  if (!r) notFound();

  const disc = r.disclosureProfiles[0] ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/relationships" className="text-sm text-amber-900 hover:underline">
          ← Relationships
        </Link>
        <PageHeader
          title={`${r.personA.name} ↔ ${r.personB.name}`}
          description={`${r.worldState.eraId} · ${r.relationshipType} · ${r.publicStatus}`}
        />
        <p className="mt-1 text-xs text-stone-500">
          Profile id: <code className="break-all">{r.id}</code>
        </p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Edit profile</h2>
        <form action={updateRelationshipProfile} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={r.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Relationship type</span>
              <select name="relationshipType" className={fieldClass} defaultValue={r.relationshipType}>
                {Object.values(RelationshipType).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Public status</span>
              <select name="publicStatus" className={fieldClass} defaultValue={r.publicStatus}>
                {Object.values(PublicStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Private status</span>
            <input name="privateStatus" className={fieldClass} defaultValue={r.privateStatus ?? ""} />
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["trustLevel", r.trustLevel],
                ["fearLevel", r.fearLevel],
                ["shameLeverage", r.shameLeverage],
                ["obligationWeight", r.obligationWeight],
                ["betrayalThreshold", r.betrayalThreshold],
                ["rescueThreshold", r.rescueThreshold],
              ] as const
            ).map(([name, val]) => (
              <label key={name} className={labelClass}>
                <span className={labelSpanClass}>{name}</span>
                <input name={name} type="number" min={0} max={100} className={fieldClass} defaultValue={val} />
              </label>
            ))}
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Hidden truth (JSON)</span>
            <textarea name="hiddenTruthJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(r.hiddenTruth)} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Power direction (JSON)</span>
            <textarea name="powerDirectionJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(r.powerDirection)} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Dependency direction (JSON)</span>
            <textarea name="dependencyDirectionJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(r.dependencyDirection)} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} className={fieldClass} defaultValue={r.notes ?? ""} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={r.recordType}>
                {Object.values(RecordType).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={r.visibility}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Certainty</span>
            <input name="certainty" className={fieldClass} defaultValue={r.certainty ?? ""} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-sm text-amber-50">
            Save profile
          </button>
        </form>
        <form action={deleteRelationshipProfile} className="mt-4 border-t border-stone-100 pt-4">
          <input type="hidden" name="id" value={r.id} />
          <button type="submit" className="text-sm text-rose-800 hover:underline">
            Delete profile
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Dynamic states</h2>
        <ul className="mt-3 space-y-4">
          {r.dynamicStates.map((d) => (
            <li key={d.id} className="rounded border border-stone-100 p-3 text-sm">
              <p className="font-medium text-stone-900">{d.label}</p>
              <form action={updateRelationshipDynamicState} className="mt-2 grid gap-2 sm:grid-cols-3">
                <input type="hidden" name="id" value={d.id} />
                <label className={labelClass}>
                  <span className={labelSpanClass}>Label</span>
                  <input name="label" className={fieldClass} defaultValue={d.label} />
                </label>
                {(
                  [
                    ["emotionalTemperature", d.emotionalTemperature],
                    ["volatility", d.volatility],
                    ["intimacyLevel", d.intimacyLevel],
                    ["conflictLoad", d.conflictLoad],
                    ["mutualRecognition", d.mutualRecognition],
                    ["disclosureSafety", d.disclosureSafety],
                  ] as const
                ).map(([k, v]) => (
                  <label key={k} className={labelClass}>
                    <span className={labelSpanClass}>{k}</span>
                    <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                  </label>
                ))}
                <label className={labelClass + " sm:col-span-3"}>
                  <span className={labelSpanClass}>Current tensions (JSON)</span>
                  <textarea name="currentTensionsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(d.currentTensions)} />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  <span className={labelSpanClass}>Current needs (JSON)</span>
                  <textarea name="currentNeedsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(d.currentNeeds)} />
                </label>
                <label className={labelClass + " sm:col-span-3"}>
                  <span className={labelSpanClass}>Notes</span>
                  <textarea name="notes" rows={2} className={fieldClass} defaultValue={d.notes ?? ""} />
                </label>
                <div className="grid gap-2 sm:col-span-3 sm:grid-cols-2">
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Record type</span>
                    <select name="recordType" className={fieldClass} defaultValue={d.recordType}>
                      {Object.values(RecordType).map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Visibility</span>
                    <select name="visibility" className={fieldClass} defaultValue={d.visibility}>
                      {Object.values(VisibilityStatus).map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className={labelClass + " sm:col-span-3"}>
                  <span className={labelSpanClass}>Certainty</span>
                  <input name="certainty" className={fieldClass} defaultValue={d.certainty ?? ""} />
                </label>
                <div className="sm:col-span-3 flex flex-wrap gap-2">
                  <button type="submit" className="rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                    Save state
                  </button>
                </div>
              </form>
              <form action={deleteRelationshipDynamicState} className="mt-2">
                <input type="hidden" name="id" value={d.id} />
                <button type="submit" className="text-xs text-rose-800 hover:underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createRelationshipDynamicState} className="mt-4 space-y-2 border-t border-stone-100 pt-4">
          <input type="hidden" name="relationshipProfileId" value={r.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>New label</span>
            <input name="label" className={fieldClass} placeholder="e.g. mid_arc" required />
          </label>
          <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-sm">
            Add dynamic state
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Disclosure profile</h2>
        {disc ? (
          <form action={updateRelationshipDisclosureProfile} className="mt-3 space-y-2">
            <input type="hidden" name="id" value={disc.id} />
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["truthShareCapacity", disc.truthShareCapacity],
                  ["emotionalDisclosureCapacity", disc.emotionalDisclosureCapacity],
                  ["secrecyBurden", disc.secrecyBurden],
                  ["misrecognitionRisk", disc.misrecognitionRisk],
                  ["exposureConsequence", disc.exposureConsequence],
                ] as const
              ).map(([k, v]) => (
                <label key={k} className={labelClass}>
                  <span className={labelSpanClass}>{k}</span>
                  <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                </label>
              ))}
            </div>
            <label className={labelClass}>
              <span className={labelSpanClass}>Safe topics (JSON)</span>
              <textarea name="safeTopicsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(disc.safeTopics)} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Unsafe topics (JSON)</span>
              <textarea name="unsafeTopicsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(disc.unsafeTopics)} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Coded channels (JSON)</span>
              <textarea name="codedChannelsJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(disc.codedChannels)} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Notes</span>
              <textarea name="notes" rows={2} className={fieldClass} defaultValue={disc.notes ?? ""} />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelSpanClass}>Record type</span>
                <select name="recordType" className={fieldClass} defaultValue={disc.recordType}>
                  {Object.values(RecordType).map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className={labelSpanClass}>Visibility</span>
                <select name="visibility" className={fieldClass} defaultValue={disc.visibility}>
                  {Object.values(VisibilityStatus).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={labelClass}>
              <span className={labelSpanClass}>Certainty</span>
              <input name="certainty" className={fieldClass} defaultValue={disc.certainty ?? ""} />
            </label>
            <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-sm text-amber-50">
              Save disclosure
            </button>
          </form>
        ) : (
          <form action={createRelationshipDisclosureProfile} className="mt-3 space-y-2">
            <input type="hidden" name="relationshipProfileId" value={r.id} />
            <input type="hidden" name="worldStateId" value={r.worldStateId} />
            <p className="text-sm text-stone-600">Create disclosure row for this world slice.</p>
            <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-sm">
              Create disclosure profile
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
