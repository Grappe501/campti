import Link from "next/link";
import { notFound } from "next/navigation";
import { FragmentType, RecordType, VisibilityStatus } from "@prisma/client";
import {
  acceptFragmentPlacementAction,
  addFragmentInsightAction,
  applyFragmentInterpretationHeuristicsAction,
  decomposeFragmentAction,
  decomposeFragmentRefinedAction,
  linkFragmentAction,
  rejectFragmentPlacementAction,
  reviewFragmentAction,
  saveRefinedChildFragmentsAction,
  unlinkFragmentAction,
  updateFragmentAction,
} from "@/app/actions/fragments";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { AmbiguityMeter } from "@/components/ambiguity-meter";
import {
  CandidateStatusBadge,
  FragmentTypeBadge,
  PlacementBadge,
} from "@/components/fragment-badges";
import { ConfidenceDot } from "@/components/confidence-dot";
import { PageHeader } from "@/components/page-header";
import {
  enhanceFragmentInterpretationCacheAction,
  generateFragmentInterpretationCacheAction,
} from "@/app/actions/narrative-passes";
import { SyntheticRead } from "@/components/synthetic-read";
import { describeFragmentRichly } from "@/lib/descriptive-synthesis";
import { getFragmentById } from "@/lib/data-access";
import { deriveDecompositionPressure, isFragmentTooDense } from "@/lib/fragment-density";
import { refineFragmentSplit } from "@/lib/fragment-refinement";
import { getFragmentNarrativeDnaSuggestions } from "@/lib/fragment-narrative-dna";
import { fragmentInterpretationPreview } from "@/lib/scene-intelligence";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { FRAGMENT_LINK_ROLES, FRAGMENT_LINK_TARGET_TYPES, fragmentTypeLabel } from "@/lib/fragment-types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; refine?: string }>;
};

function savedLabel(saved: string | undefined): string | null {
  if (saved === "interpretation") return "Interpretation heuristics applied.";
  if (saved === "children") return "Child fragments updated.";
  if (saved === "1") return "Saved.";
  if (saved === "review") return "Review updated.";
  if (saved === "placement") return "Placement updated.";
  if (saved === "link") return "Link added.";
  if (saved === "unlink") return "Link removed.";
  if (saved === "insight") return "Insight added.";
  if (saved === "synthesis") return "Interpretation cache saved (template).";
  if (saved === "synthesisai") return "Interpretation cache enhanced (optional AI).";
  return saved ? "Saved." : null;
}

export default async function AdminFragmentDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const fragment = await getFragmentById(id);
  if (!fragment) notFound();

  const pressure = deriveDecompositionPressure(fragment);
  const tooDense = isFragmentTooDense(fragment);
  const interpret = fragmentInterpretationPreview(fragment);
  const fragmentRich = await describeFragmentRichly(id);
  const refinedPreview = sp.refine === "1" ? refineFragmentSplit(fragment.text) : null;
  const narrativeSuggestions = await getFragmentNarrativeDnaSuggestions(id);

  const update = updateFragmentAction;
  const review = reviewFragmentAction;
  const acceptPlacement = acceptFragmentPlacementAction;
  const rejectPlacement = rejectFragmentPlacementAction;
  const addInsight = addFragmentInsightAction;
  const linkFrag = linkFragmentAction;
  const unlink = unlinkFragmentAction;
  const decomposeChild = decomposeFragmentAction;
  const decomposeRefined = decomposeFragmentRefinedAction;
  const applyInterpret = applyFragmentInterpretationHeuristicsAction;
  const saveRefined = saveRefinedChildFragmentsAction;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <nav className="flex flex-wrap gap-2 text-sm text-stone-600">
          <Link href="/admin/fragments" className="hover:text-amber-900 hover:underline">
            Fragments
          </Link>
          {fragment.source ? (
            <>
              <span aria-hidden>/</span>
              <Link
                href={`/admin/sources/${fragment.source.id}`}
                className="hover:text-amber-900 hover:underline"
              >
                {fragment.source.title}
              </Link>
              <span aria-hidden>/</span>
              <Link
                href={`/admin/sources/${fragment.source.id}/decompose`}
                className="hover:text-amber-900 hover:underline"
                >
                Decompose
              </Link>
            </>
          ) : null}
        </nav>
        <PageHeader
          title={fragment.title?.trim() || "Fragment"}
          description="Core text stays central; metadata and placements frame it."
        />
      </div>

      <AdminFormError error={sp.error} />

      {savedLabel(sp.saved) ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          {savedLabel(sp.saved)}
        </p>
      ) : null}

      <DetailSection title="Text">
        <div className="rounded-lg border border-stone-100 bg-stone-50/80 p-5 text-base leading-relaxed text-stone-900">
          {fragment.text}
        </div>
        {fragment.excerpt ? (
          <p className="mt-3 text-xs text-stone-500">Excerpt: {fragment.excerpt}</p>
        ) : null}
      </DetailSection>

      <DetailSection title="Core metadata">
        <div className="flex flex-wrap gap-3 text-sm">
          <FragmentTypeBadge type={fragment.fragmentType} />
          <PlacementBadge status={fragment.placementStatus} />
          <PlacementBadge status={fragment.reviewStatus} />
          <ConfidenceDot level={fragment.confidence} />
          <AmbiguityMeter level={fragment.ambiguityLevel} />
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-600">
          <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-800">
            Decomposition pressure: {pressure}
          </span>
          {tooDense ? <span className="text-rose-800">Dense — consider refined split.</span> : null}
          <span>Scene readiness (stored): {fragment.sceneReadinessScore ?? "—"}</span>
          <span>Clusters: {fragment.clusterLinks.length}</span>
          <Link
            href={sp.refine === "1" ? `/admin/fragments/${fragment.id}` : `/admin/fragments/${fragment.id}?refine=1`}
            className="text-amber-900 hover:underline"
          >
            {sp.refine === "1" ? "Hide refined preview" : "Preview refined split"}
          </Link>
        </p>
        <form action={update} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={fragment.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Title</span>
              <input name="title" defaultValue={fragment.title ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Fragment type</span>
              <select name="fragmentType" className={fieldClass} defaultValue={fragment.fragmentType}>
                {Object.values(FragmentType).map((t) => (
                  <option key={t} value={t}>
                    {fragmentTypeLabel(t)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Primary type (interpretation)</span>
              <select
                name="primaryFragmentType"
                className={fieldClass}
                defaultValue={fragment.primaryFragmentType ?? fragment.fragmentType}
              >
                {Object.values(FragmentType).map((t) => (
                  <option key={t} value={t}>
                    {fragmentTypeLabel(t)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Secondary types (JSON array)</span>
              <textarea
                name="secondaryFragmentTypes"
                rows={2}
                className={fieldClass}
                placeholder='["MEMORY","SCENE_SEED"]'
                defaultValue={
                  fragment.secondaryFragmentTypes && Array.isArray(fragment.secondaryFragmentTypes)
                    ? JSON.stringify(fragment.secondaryFragmentTypes)
                    : ""
                }
              />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Text</span>
            <textarea name="text" rows={8} defaultValue={fragment.text} className={fieldClass} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={fragment.visibility}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={fragment.recordType ?? ""}>
                <option value="">—</option>
                {Object.values(RecordType).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Summary</span>
              <textarea name="summary" rows={2} defaultValue={fragment.summary ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Time hint</span>
              <input name="timeHint" defaultValue={fragment.timeHint ?? ""} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional tone</span>
              <input name="emotionalTone" defaultValue={fragment.emotionalTone ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Narrative function</span>
              <input
                name="narrativeFunction"
                defaultValue={fragment.narrativeFunction ?? ""}
                className={fieldClass}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Confidence (1–5)</span>
              <input
                name="confidence"
                type="number"
                min={1}
                max={5}
                defaultValue={fragment.confidence ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Ambiguity (1–5)</span>
              <input
                name="ambiguityLevel"
                type="number"
                min={1}
                max={5}
                defaultValue={fragment.ambiguityLevel ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Placement status</span>
              <input
                name="placementStatus"
                defaultValue={fragment.placementStatus ?? ""}
                className={fieldClass}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Surface meaning</span>
              <textarea name="surfaceMeaning" rows={2} defaultValue={fragment.surfaceMeaning ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Hidden meaning</span>
              <textarea name="hiddenMeaning" rows={2} defaultValue={fragment.hiddenMeaning ?? ""} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Symbolic use</span>
              <textarea name="symbolicUse" rows={2} defaultValue={fragment.symbolicUse ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Emotional use</span>
              <textarea name="emotionalUse" rows={2} defaultValue={fragment.emotionalUse ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Narrative use</span>
              <textarea name="narrativeUse" rows={2} defaultValue={fragment.narrativeUse ?? ""} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelSpanClass}>Decomposition pressure</span>
              <select name="decompositionPressure" className={fieldClass} defaultValue={fragment.decompositionPressure ?? ""}>
                <option value="">— (derive from text)</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Scene readiness (1–5)</span>
              <input
                name="sceneReadinessScore"
                type="number"
                min={1}
                max={5}
                defaultValue={fragment.sceneReadinessScore ?? ""}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Cluster hint</span>
              <input name="clusterHint" defaultValue={fragment.clusterHint ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={3} defaultValue={fragment.notes ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Source trace</span>
            <input name="sourceTraceNote" defaultValue={fragment.sourceTraceNote ?? ""} className={fieldClass} />
          </label>
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Save changes
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Narrative DNA suggestions (overlap)">
        <p className="text-xs text-stone-500">
          Token overlap with existing themes, symbols, and rules — not auto-linked. Create bindings from Admin →
          Bindings when a match is real.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-stone-800">
          {narrativeSuggestions.length === 0 ? (
            <li className="text-stone-600">No suggestions.</li>
          ) : (
            narrativeSuggestions.slice(0, 20).map((s, i) => (
              <li key={i} className="rounded-md border border-stone-100 bg-stone-50/50 px-3 py-2">
                <span className="font-medium">{s.sourceType}</span> · {s.relationship} · confidence{" "}
                {s.confidence.toFixed(2)}
                <p className="mt-1 text-xs text-stone-600">{s.rationale}</p>
                <p className="text-xs text-stone-500">
                  Use source ID <code>{s.sourceId}</code> — attach to this fragment via bindings if appropriate.
                </p>
              </li>
            ))
          )}
        </ul>
      </DetailSection>

      <DetailSection title="Interpretation preview (rule-based)">
        <p className="text-xs text-stone-500">
          Heuristic read only — not canonical truth. Use “Apply” to copy into stored fields.
        </p>
        <dl className="mt-4 grid gap-4 text-sm text-stone-800 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-stone-500">Surface</dt>
            <dd className="mt-1 whitespace-pre-wrap">{interpret.surface}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Hidden</dt>
            <dd className="mt-1 whitespace-pre-wrap">{interpret.hidden}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Emotional use</dt>
            <dd className="mt-1 whitespace-pre-wrap">{interpret.emotionalUse}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Symbolic use</dt>
            <dd className="mt-1 whitespace-pre-wrap">{interpret.symbolicUse}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-stone-500">Narrative use</dt>
            <dd className="mt-1 whitespace-pre-wrap">{interpret.narrativeUse}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-stone-500">Readiness (heuristic)</dt>
            <dd className="mt-1">{interpret.readiness}/5</dd>
          </div>
        </dl>
        <form action={applyInterpret} className="mt-4">
          <input type="hidden" name="id" value={fragment.id} />
          <button
            type="submit"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
          >
            Apply heuristics to stored interpretation fields
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Rich interpretation synthesis">
        <p className="text-xs text-stone-500">
          Layered narrative read — surface, undertow, emotional weather, and scene function. Does not replace raw fields.
        </p>
        <div className="mt-4 max-h-[28rem] overflow-y-auto">
          <SyntheticRead title="Live synthesis">{fragmentRich}</SyntheticRead>
        </div>
        {fragment.generatedInterpretationSummary ? (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <SyntheticRead title="Cached generated summary (field)">{fragment.generatedInterpretationSummary}</SyntheticRead>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={generateFragmentInterpretationCacheAction}>
            <input type="hidden" name="fragmentId" value={id} />
            <button
              type="submit"
              className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-950 hover:bg-violet-100"
            >
              Save template to cache
            </button>
          </form>
          <form action={enhanceFragmentInterpretationCacheAction}>
            <input type="hidden" name="fragmentId" value={id} />
            <button
              type="submit"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
            >
              Enhance cache with OpenAI
            </button>
          </form>
        </div>
      </DetailSection>

      <DetailSection title="Review">
        <form action={review} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={fragment.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Review status</span>
            <select name="reviewStatus" className={fieldClass} defaultValue={fragment.reviewStatus ?? "pending"}>
              <option value="pending">pending</option>
              <option value="reviewed">reviewed</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Placement status</span>
            <select name="placementStatus" className={fieldClass} defaultValue={fragment.placementStatus ?? "unplaced"}>
              <option value="unplaced">unplaced</option>
              <option value="candidate">candidate</option>
              <option value="linked">linked</option>
              <option value="promoted">promoted</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
          >
            Apply review
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Interpretation">
        <ul className="space-y-3">
          {fragment.insights.length === 0 ? (
            <li className="text-sm text-stone-600">No insights yet.</li>
          ) : (
            fragment.insights.map((i) => (
              <li
                key={i.id}
                className="rounded-lg border border-stone-100 bg-white p-4 text-sm text-stone-800 shadow-sm"
              >
                <p className="text-xs font-medium uppercase text-stone-500">{i.insightType}</p>
                <p className="mt-2 whitespace-pre-wrap">{i.content}</p>
                {i.confidence ? (
                  <p className="mt-2 text-xs text-stone-500">Confidence: {i.confidence}/5</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
        <form action={addInsight} className="mt-6 space-y-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="fragmentId" value={fragment.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Insight type</span>
            <input name="insightType" placeholder="theme, tension, symbol…" className={fieldClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Content</span>
            <textarea name="content" rows={3} className={fieldClass} required />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Confidence (optional)</span>
            <input name="confidence" type="number" min={1} max={5} className={fieldClass} />
          </label>
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Add insight
          </button>
        </form>
      </DetailSection>

      <DetailSection title="Relationships">
        {fragment.parentFragment ? (
          <p className="text-sm">
            Parent:{" "}
            <Link href={`/admin/fragments/${fragment.parentFragment.id}`} className="text-amber-900 hover:underline">
              {fragment.parentFragment.title?.trim() ||
                fragment.parentFragment.text.slice(0, 60)}
            </Link>
          </p>
        ) : (
          <p className="text-sm text-stone-600">No parent fragment.</p>
        )}

        <h3 className="mt-6 text-sm font-medium text-stone-800">Child fragments</h3>
        <ul className="mt-2 space-y-2">
          {fragment.childFragments.length === 0 ? (
            <li className="text-sm text-stone-600">None yet.</li>
          ) : (
            fragment.childFragments.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/fragments/${c.id}`} className="text-sm text-amber-900 hover:underline">
                  <FragmentTypeBadge type={c.fragmentType} />{" "}
                  {c.title?.trim() || c.text.slice(0, 72)}
                </Link>
              </li>
            ))
          )}
        </ul>

        <form action={decomposeChild} className="mt-4 space-y-3 rounded-lg border border-stone-100 p-4">
          <input type="hidden" name="parentFragmentId" value={fragment.id} />
          <p className="text-sm text-stone-600">
            Split this fragment further using the same rule-based engine (paragraphs / sentences).
          </p>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="force" value="true" />
            Force if children already exist
          </label>
          <button
            type="submit"
            className="rounded-md bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-900 hover:bg-stone-200"
          >
            Decompose into child fragments
          </button>
        </form>

        <form action={decomposeChild} className="mt-4 space-y-3 rounded-lg border border-dashed border-stone-200 p-4">
          <input type="hidden" name="parentFragmentId" value={fragment.id} />
          <p className="text-sm text-stone-600">
            Or paste a sub-passage to decompose (overrides automatic split of full body).
          </p>
          <textarea name="text" rows={4} className={fieldClass} placeholder="Paste text to split…" />
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Decompose selection
          </button>
        </form>

        <form action={decomposeRefined} className="mt-4 space-y-3 rounded-lg border border-amber-200/60 bg-amber-50/40 p-4">
          <input type="hidden" name="parentFragmentId" value={fragment.id} />
          <p className="text-sm text-stone-700">
            <strong>Refined split</strong> — uses contrast markers, dialogue edges, and pivot sentences (finer than
            paragraph-only).
          </p>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="force" value="true" />
            Force if children already exist
          </label>
          <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white">
            Decompose further (refined)
          </button>
        </form>

        <form action={decomposeRefined} className="mt-4 space-y-3 rounded-lg border border-dashed border-amber-200 p-4">
          <input type="hidden" name="parentFragmentId" value={fragment.id} />
          <p className="text-sm text-stone-600">Refined split on pasted text only.</p>
          <textarea name="text" rows={4} className={fieldClass} placeholder="Paste passage…" />
          <button type="submit" className="text-sm font-medium text-amber-900 hover:underline">
            Decompose selection (refined)
          </button>
        </form>

        <h3 className="mt-8 text-sm font-medium text-stone-800">Clusters</h3>
        <ul className="mt-2 space-y-2">
          {fragment.clusterLinks.length === 0 ? (
            <li className="text-sm text-stone-600">Not in any cluster.</li>
          ) : (
            fragment.clusterLinks.map((cl) => (
              <li key={cl.id}>
                <Link href={`/admin/clusters/${cl.cluster.id}`} className="text-amber-900 hover:underline">
                  {cl.cluster.title}
                </Link>
                <span className="text-xs text-stone-500"> · {cl.cluster.clusterType}</span>
              </li>
            ))
          )}
        </ul>

        <h3 className="mt-8 text-sm font-medium text-stone-800">Approved links</h3>
        <ul className="mt-2 space-y-2">
          {fragment.links.length === 0 ? (
            <li className="text-sm text-stone-600">No durable links yet.</li>
          ) : (
            fragment.links.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-stone-100 bg-stone-50/50 px-3 py-2 text-sm"
              >
                <span>
                  {l.linkedType} · {l.linkRole ?? "—"} ·{" "}
                  <code className="text-xs">{l.linkedId}</code>
                </span>
                <form action={unlink}>
                  <input type="hidden" name="linkId" value={l.id} />
                  <input type="hidden" name="fragmentId" value={fragment.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>

        <form action={linkFrag} className="mt-4 space-y-3 rounded-lg border border-stone-100 p-4">
          <input type="hidden" name="fragmentId" value={fragment.id} />
          <p className="text-xs text-stone-500">
            Link to canonical records by ID (search elsewhere, paste ID). Types include character_profile,
            setting_profile, meta_scene, character_memory, character_state. Roles include supports, inspires,
            informs_character, informs_setting, informs_scene, represents_memory, drives_conflict,
            provides_symbolism, and the chapter roles listed in the dropdown.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked type</span>
              <select name="linkedType" className={fieldClass} required>
                {FRAGMENT_LINK_TARGET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Linked ID</span>
              <input name="linkedId" className={fieldClass} required />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Link role</span>
            <select name="linkRole" className={fieldClass}>
              <option value="">—</option>
              {FRAGMENT_LINK_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <input name="notes" className={fieldClass} />
          </label>
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            Add link
          </button>
        </form>
      </DetailSection>

      {refinedPreview && refinedPreview.length > 1 ? (
        <DetailSection title="Refined split preview (not saved)">
          <p className="text-xs text-stone-500">
            Review units below, then save as child fragments. Nothing is persisted until you submit.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-stone-800">
            {refinedPreview.map((u, idx) => (
              <li key={idx}>
                <span className="text-xs font-medium text-stone-500">{fragmentTypeLabel(u.suggestedType)}</span>
                <p className="mt-1 whitespace-pre-wrap">{u.text}</p>
              </li>
            ))}
          </ol>
          <form action={saveRefined} className="mt-6 space-y-3 rounded-lg border border-stone-200 bg-stone-50/50 p-4">
            <input type="hidden" name="parentFragmentId" value={fragment.id} />
            <input
              type="hidden"
              name="unitsJson"
              value={JSON.stringify(
                refinedPreview.map((u) => ({ text: u.text, suggestedType: u.suggestedType })),
              )}
            />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="force" value="true" />
              Force if children already exist
            </label>
            <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
              Save child fragments from preview
            </button>
          </form>
        </DetailSection>
      ) : null}

      <DetailSection title="Placement candidates">
        <ul className="space-y-4">
          {fragment.placementCandidates.length === 0 ? (
            <li className="text-sm text-stone-600">No suggestions.</li>
          ) : (
            fragment.placementCandidates.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-stone-100 bg-white p-4 text-sm shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-stone-900">{c.targetType}</span>
                  {c.targetLabel ? (
                    <span className="text-stone-600">{c.targetLabel}</span>
                  ) : null}
                  <CandidateStatusBadge status={c.status} />
                </div>
                {c.rationale ? <p className="mt-2 text-stone-700">{c.rationale}</p> : null}
                {c.targetId ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Target ID: <code>{c.targetId}</code>
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={acceptPlacement}>
                    <input type="hidden" name="candidateId" value={c.id} />
                    <input type="hidden" name="status" value="accepted" />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                    >
                      Accept
                    </button>
                  </form>
                  <form action={rejectPlacement}>
                    <input type="hidden" name="candidateId" value={c.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))
          )}
        </ul>
      </DetailSection>

      <DetailSection title="Provenance">
        <dl className="grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">AI generated</dt>
            <dd>{fragment.aiGenerated ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Decomposition version</dt>
            <dd>{fragment.decompositionVersion ?? "—"}</dd>
          </div>
          {fragment.sourceChunk ? (
            <div className="sm:col-span-2">
              <dt className="text-stone-500">Source chunk</dt>
              <dd>
                <Link
                  href={`/admin/chunks/${fragment.sourceChunk.id}`}
                  className="text-amber-900 hover:underline"
                >
                  {fragment.sourceChunk.chunkLabel ?? `Chunk ${fragment.sourceChunk.chunkIndex}`}
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      </DetailSection>
    </div>
  );
}
