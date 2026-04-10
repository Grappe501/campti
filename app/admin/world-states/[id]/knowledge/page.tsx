import Link from "next/link";
import { notFound } from "next/navigation";
import { upsertWorldExpressionProfile, upsertWorldKnowledgeProfile } from "@/app/actions/intelligence";
import { PageHeader } from "@/components/page-header";
import { getWorldIntelligenceHorizonForAdmin, getWorldStateById } from "@/lib/data-access";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { profileJsonFieldToFormText } from "@/lib/profile-json";
import { RecordType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function WorldStateKnowledgePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const ws = await getWorldStateById(id);
  if (!ws) notFound();

  const { knowledge: k, expression: e } = await getWorldIntelligenceHorizonForAdmin(id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link href="/admin/world-states" className="text-amber-900 hover:underline">
            ← World states
          </Link>
          <Link href={`/admin/world-states/${ws.id}/pressure`} className="text-amber-900 hover:underline">
            Pressure (Stage 5) →
          </Link>
        </div>
        <PageHeader
          title={`Knowledge horizon · ${ws.eraId}`}
          description="Stage 5.5 — era-level abstraction, literacy, technology reach, information speed, and expression norms. OpenAI is inference substrate; these rows bound what can be known and how it may be said."
        />
        <p className="mt-2 text-sm text-stone-600">{ws.description ?? "—"}</p>
        <p className="mt-1 text-xs text-stone-500">
          World state id: <code className="break-all">{ws.id}</code>
        </p>
      </div>

      {sp.saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          Saved ({sp.saved}).
        </p>
      ) : null}
      {sp.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">Save failed.</p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">World knowledge profile</h2>
        <p className="mt-1 text-sm text-stone-600">
          What can exist in discourse for this era: abstraction ceiling, literacy regime, explanatory systems, technology horizon,
          information flow, geographic awareness, taboo knowledge domains.
        </p>
        <form action={upsertWorldKnowledgeProfile} className="mt-4 space-y-3">
          <input type="hidden" name="worldStateId" value={ws.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Label</span>
            <input name="label" className={fieldClass} defaultValue={k?.label ?? ""} placeholder="Optional short label" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Abstraction ceiling (0–100)</span>
              <input
                name="abstractionCeiling"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={k?.abstractionCeiling ?? 50}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Information flow speed (0–100)</span>
              <input
                name="informationFlowSpeed"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={k?.informationFlowSpeed ?? 50}
              />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Literacy regime</span>
            <textarea name="literacyRegime" rows={3} className={fieldClass} defaultValue={k?.literacyRegime ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Geographic awareness norm</span>
            <textarea name="geographicAwarenessNorm" rows={2} className={fieldClass} defaultValue={k?.geographicAwarenessNorm ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Dominant explanatory systems (JSON)</span>
            <textarea
              name="dominantExplanatorySystemsJson"
              rows={4}
              className={fieldClass}
              defaultValue={profileJsonFieldToFormText(k?.dominantExplanatorySystems)}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Technology horizon (JSON)</span>
            <textarea
              name="technologyHorizonJson"
              rows={4}
              className={fieldClass}
              defaultValue={profileJsonFieldToFormText(k?.technologyHorizon)}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Taboo knowledge domains (JSON)</span>
            <textarea
              name="tabooKnowledgeDomainsJson"
              rows={3}
              className={fieldClass}
              defaultValue={profileJsonFieldToFormText(k?.tabooKnowledgeDomains)}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={3} className={fieldClass} defaultValue={k?.notes ?? ""} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={k?.recordType ?? RecordType.HYBRID}>
                {Object.values(RecordType).map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={k?.visibility ?? VisibilityStatus.REVIEW}>
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
            <input name="certainty" className={fieldClass} defaultValue={k?.certainty ?? ""} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save knowledge profile
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">World expression profile</h2>
        <p className="mt-1 text-sm text-stone-600">
          Norms for public and inner language: metaphor domains, acceptable explanation modes, silence patterns, taboo phrasing.
        </p>
        <form action={upsertWorldExpressionProfile} className="mt-4 space-y-3">
          <input type="hidden" name="worldStateId" value={ws.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Label</span>
            <input name="label" className={fieldClass} defaultValue={e?.label ?? ""} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Public expression ceiling (0–100)</span>
              <input
                name="publicExpressionCeiling"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={e?.publicExpressionCeiling ?? 50}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Internal language complexity norm (0–100)</span>
              <input
                name="internalLanguageComplexityNorm"
                type="number"
                min={0}
                max={100}
                className={fieldClass}
                defaultValue={e?.internalLanguageComplexityNorm ?? 50}
              />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Silence patterns norm</span>
            <textarea name="silencePatternsNorm" rows={2} className={fieldClass} defaultValue={e?.silencePatternsNorm ?? ""} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Metaphor source domains (JSON)</span>
            <textarea
              name="metaphorSourceDomainsJson"
              rows={3}
              className={fieldClass}
              defaultValue={profileJsonFieldToFormText(e?.metaphorSourceDomains)}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Acceptable explanation modes (JSON)</span>
            <textarea
              name="acceptableExplanationModesJson"
              rows={3}
              className={fieldClass}
              defaultValue={profileJsonFieldToFormText(e?.acceptableExplanationModes)}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Taboo phrasing domains (JSON)</span>
            <textarea
              name="tabooPhrasingDomainsJson"
              rows={3}
              className={fieldClass}
              defaultValue={profileJsonFieldToFormText(e?.tabooPhrasingDomains)}
            />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={3} className={fieldClass} defaultValue={e?.notes ?? ""} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={e?.recordType ?? RecordType.HYBRID}>
                {Object.values(RecordType).map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={e?.visibility ?? VisibilityStatus.REVIEW}>
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
            <input name="certainty" className={fieldClass} defaultValue={e?.certainty ?? ""} />
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save expression profile
          </button>
        </form>
      </section>
    </div>
  );
}
