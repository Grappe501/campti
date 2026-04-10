import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCharacterDesireProfile,
  createCharacterMaskingProfile,
  createRelationshipNetworkSummary,
  deleteCharacterDesireProfile,
  deleteCharacterMaskingProfile,
  deleteRelationshipNetworkSummary,
  updateCharacterDesireProfile,
  updateCharacterMaskingProfile,
  updateRelationshipNetworkSummary,
} from "@/app/actions/relationship-order";
import { PageHeader } from "@/components/page-header";
import { getCharacterRelationshipBundle, getPersonById, getWorldStateReferences } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { AttachmentStyle, RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CharacterRelationshipsPage({ params }: Props) {
  const { id } = await params;
  const person = await getPersonById(id);
  if (!person) notFound();

  const worlds = await getWorldStateReferences();
  const bundles = await Promise.all(worlds.map((w) => getCharacterRelationshipBundle(id, w.id)));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/people/${id}`} className="text-sm text-amber-900 hover:underline">
          ← {person.name}
        </Link>
        <PageHeader
          title={`Relationships · ${person.name}`}
          description="Stage 6 — masking, desire, network summary, and dyads involving this character per world state."
        />
      </div>

      {worlds.map((w, i) => {
        const b = bundles[i];
        if (!b) return null;
        const { masking, desire, networkSummary, worldNorms, relationshipProfilesInvolvingPerson } = b;

        return (
          <section key={w.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium text-stone-900">
                {w.eraId}
                <span className="font-normal text-stone-600"> — {w.label}</span>
              </h2>
              <Link href={`/admin/world-states/${w.id}/relationships`} className="text-xs text-amber-900 hover:underline">
                World norms →
              </Link>
            </div>
            {worldNorms ? (
              <p className="mt-2 text-xs text-stone-600">
                Norm label: <span className="font-medium text-stone-800">{worldNorms.label}</span> · visibility{" "}
                {worldNorms.relationalVisibility} · punishment {worldNorms.punishmentForViolation}
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-800">No world relationship norm profile for this era.</p>
            )}

            <details className="mt-4 border-t border-stone-100 pt-4">
              <summary className="cursor-pointer text-sm font-medium text-stone-900">Masking</summary>
              {masking ? (
                <form action={updateCharacterMaskingProfile} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={masking.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["maskingIntensity", masking.maskingIntensity],
                        ["codeSwitchingLoad", masking.codeSwitchingLoad],
                        ["secrecyNeed", masking.secrecyNeed],
                        ["disclosureRisk", masking.disclosureRisk],
                      ] as const
                    ).map(([k, v]) => (
                      <label key={k} className={labelClass}>
                        <span className={labelSpanClass}>{k}</span>
                        <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Authentic private self (JSON)</span>
                    <textarea name="authenticPrivateSelfJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(masking.authenticPrivateSelf)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Public mask (JSON)</span>
                    <textarea name="publicMaskJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(masking.publicMask)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Notes</span>
                    <textarea name="notes" rows={2} className={fieldClass} defaultValue={masking.notes ?? ""} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Record type</span>
                      <select name="recordType" className={fieldClass} defaultValue={masking.recordType}>
                        {Object.values(RecordType).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Visibility</span>
                      <select name="visibility" className={fieldClass} defaultValue={masking.visibility}>
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
                    <input name="certainty" className={fieldClass} defaultValue={masking.certainty ?? ""} />
                  </label>
                  <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-sm text-amber-50">
                    Save masking
                  </button>
                </form>
              ) : (
                <form action={createCharacterMaskingProfile} className="mt-3 space-y-2">
                  <input type="hidden" name="personId" value={id} />
                  <input type="hidden" name="worldStateId" value={w.id} />
                  <p className="text-sm text-stone-600">No masking row for this world.</p>
                  <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-sm">
                    Create masking profile
                  </button>
                </form>
              )}
              {masking ? (
                <form action={deleteCharacterMaskingProfile} className="mt-2">
                  <input type="hidden" name="id" value={masking.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove masking row
                  </button>
                </form>
              ) : null}
            </details>

            <details className="mt-4 border-t border-stone-100 pt-4">
              <summary className="cursor-pointer text-sm font-medium text-stone-900">Desire</summary>
              {desire ? (
                <form action={updateCharacterDesireProfile} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={desire.id} />
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Attachment style</span>
                    <select name="attachmentStyle" className={fieldClass} defaultValue={desire.attachmentStyle}>
                      {(Object.values(AttachmentStyle) as AttachmentStyle[]).map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        ["desireVisibility", desire.desireVisibility],
                        ["desireSuppression", desire.desireSuppression],
                        ["jealousySensitivity", desire.jealousySensitivity],
                        ["intimacyNeed", desire.intimacyNeed],
                        ["autonomyNeed", desire.autonomyNeed],
                        ["tabooExposureRisk", desire.tabooExposureRisk],
                      ] as const
                    ).map(([k, v]) => (
                      <label key={k} className={labelClass}>
                        <span className={labelSpanClass}>{k}</span>
                        <input name={k} type="number" min={0} max={100} className={fieldClass} defaultValue={v} />
                      </label>
                    ))}
                  </div>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Attraction pattern (JSON)</span>
                    <textarea name="attractionPatternJson" rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(desire.attractionPattern)} />
                  </label>
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Notes</span>
                    <textarea name="notes" rows={2} className={fieldClass} defaultValue={desire.notes ?? ""} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Record type</span>
                      <select name="recordType" className={fieldClass} defaultValue={desire.recordType}>
                        {Object.values(RecordType).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Visibility</span>
                      <select name="visibility" className={fieldClass} defaultValue={desire.visibility}>
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
                    <input name="certainty" className={fieldClass} defaultValue={desire.certainty ?? ""} />
                  </label>
                  <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-sm text-amber-50">
                    Save desire
                  </button>
                </form>
              ) : (
                <form action={createCharacterDesireProfile} className="mt-3">
                  <input type="hidden" name="personId" value={id} />
                  <input type="hidden" name="worldStateId" value={w.id} />
                  <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-sm">
                    Create desire profile
                  </button>
                </form>
              )}
              {desire ? (
                <form action={deleteCharacterDesireProfile} className="mt-2">
                  <input type="hidden" name="id" value={desire.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove desire row
                  </button>
                </form>
              ) : null}
            </details>

            <details className="mt-4 border-t border-stone-100 pt-4">
              <summary className="cursor-pointer text-sm font-medium text-stone-900">Network summary</summary>
              {networkSummary ? (
                <form action={updateRelationshipNetworkSummary} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={networkSummary.id} />
                  {(
                    [
                      ["keyBondsJson", "Key bonds", networkSummary.keyBonds],
                      ["primaryTensionsJson", "Primary tensions", networkSummary.primaryTensions],
                      ["dependencyMapJson", "Dependency map", networkSummary.dependencyMap],
                      ["trustMapJson", "Trust map", networkSummary.trustMap],
                      ["hiddenConflictsJson", "Hidden conflicts", networkSummary.hiddenConflicts],
                    ] as const
                  ).map(([name, lab, val]) => (
                    <label key={name} className={labelClass}>
                      <span className={labelSpanClass}>{lab} (JSON)</span>
                      <textarea name={name} rows={2} className={fieldClass} defaultValue={profileJsonFieldToFormText(val)} />
                    </label>
                  ))}
                  <label className={labelClass}>
                    <span className={labelSpanClass}>Notes</span>
                    <textarea name="notes" rows={2} className={fieldClass} defaultValue={networkSummary.notes ?? ""} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Record type</span>
                      <select name="recordType" className={fieldClass} defaultValue={networkSummary.recordType}>
                        {Object.values(RecordType).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={labelClass}>
                      <span className={labelSpanClass}>Visibility</span>
                      <select name="visibility" className={fieldClass} defaultValue={networkSummary.visibility}>
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
                    <input name="certainty" className={fieldClass} defaultValue={networkSummary.certainty ?? ""} />
                  </label>
                  <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-sm text-amber-50">
                    Save network summary
                  </button>
                </form>
              ) : (
                <form action={createRelationshipNetworkSummary} className="mt-3">
                  <input type="hidden" name="personId" value={id} />
                  <input type="hidden" name="worldStateId" value={w.id} />
                  <button type="submit" className="rounded-full border border-stone-300 px-4 py-2 text-sm">
                    Create network summary
                  </button>
                </form>
              )}
              {networkSummary ? (
                <form action={deleteRelationshipNetworkSummary} className="mt-2">
                  <input type="hidden" name="id" value={networkSummary.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove network summary
                  </button>
                </form>
              ) : null}
            </details>

            <div className="mt-4 border-t border-stone-100 pt-4">
              <h3 className="text-sm font-medium text-stone-900">Dyads involving {person.name}</h3>
              {relationshipProfilesInvolvingPerson.length === 0 ? (
                <p className="mt-1 text-sm text-stone-600">None in this world.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {relationshipProfilesInvolvingPerson.map((rp) => {
                    const other = rp.personAId === id ? rp.personB : rp.personA;
                    return (
                      <li key={rp.id}>
                        <Link href={`/admin/relationships/${rp.id}`} className="text-amber-900 hover:underline">
                          {other.name}
                        </Link>
                        <span className="text-stone-600"> · {rp.relationshipType}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-2 text-xs text-stone-500">
                <Link href="/admin/relationships/new" className="text-amber-900 hover:underline">
                  New relationship profile
                </Link>
              </p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
