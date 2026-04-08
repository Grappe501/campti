import Link from "next/link";
import { notFound } from "next/navigation";
import {
  consolidateGuideNarrativeDnaAction,
  rebindNarrativeDnaAction,
} from "@/app/actions/narrative-dna-consolidation";
import { extractNarrativeDNAAction } from "@/app/actions/narrative-dna";
import { normalizeSourceTextAction, saveSourceText } from "@/app/actions/source-text";
import { updateSource } from "@/app/actions/sources";
import { AdminFormError } from "@/components/admin-form-error";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { StatusBadge } from "@/components/status-badge";
import {
  countSourceSupportBindingsForSource,
  getExtractedEntityCountsBySource,
  getSourceById,
} from "@/lib/data-access";
import { isNarrativeDnaIngestionEligible } from "@/lib/ingestion-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";
import { RecordType, SourceType, VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function AdminSourceDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const source = await getSourceById(id);
  if (!source) notFound();

  const extractionCounts = await getExtractedEntityCountsBySource(id);
  const sourceSupportBindings = await countSourceSupportBindingsForSource(id);
  const dnaEligible = isNarrativeDnaIngestionEligible(source);
  const dnaExtract = extractNarrativeDNAAction;
  const consolidateGuides = consolidateGuideNarrativeDnaAction;
  const rebindDna = rebindNarrativeDnaAction;
  const dnaCounts = {
    rules: source.narrativeRules.length,
    themes: source.narrativeThemes.length,
    motifs: source.motifs.length,
    devices: source.literaryDevices.length,
    patterns: source.narrativePatterns.length,
    symbols: source.narrativeDnaSymbols.length,
  };
  const hasDna =
    dnaCounts.rules +
      dnaCounts.themes +
      dnaCounts.motifs +
      dnaCounts.devices +
      dnaCounts.patterns +
      dnaCounts.symbols >
    0;

  const update = updateSource.bind(null, id);
  const saveText = saveSourceText;
  const normalizeText = normalizeSourceTextAction;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/sources" className="text-sm text-amber-900 hover:underline">
          ← All sources
        </Link>
        <PageHeader title={source.title} description="Archive record and linked research objects." />
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href={`/admin/ingestion/${id}`} className="text-amber-900 hover:underline">
            Open ingestion workspace
          </Link>
          <Link href={`/admin/sources/${id}/decompose`} className="text-amber-900 hover:underline">
            Decompose into fragments
          </Link>
        </p>
      </div>

      <AdminFormError error={sp.error} />

      {sp.saved === "text" ||
      sp.saved === "normalized" ||
      sp.saved === "dna_extracted" ||
      sp.saved === "consolidated" ||
      sp.saved === "rebound" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {sp.saved === "normalized"
            ? "Text normalized."
            : sp.saved === "dna_extracted"
              ? "Narrative DNA extraction completed for this source."
              : sp.saved === "consolidated"
                ? "Corpus consolidation pass finished (policy merges + similarity)."
                : sp.saved === "rebound"
                  ? "Automatic DNA → world rebinding pass finished."
                  : "Source text saved."}
        </p>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Edit source</h2>
        <form action={update} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Title</span>
              <input name="title" required defaultValue={source.title} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Source type</span>
              <select name="sourceType" className={fieldClass} defaultValue={source.sourceType}>
                {Object.values(SourceType).map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Visibility</span>
              <select name="visibility" className={fieldClass} defaultValue={source.visibility}>
                {Object.values(VisibilityStatus).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Record type</span>
              <select name="recordType" className={fieldClass} defaultValue={source.recordType}>
                {Object.values(RecordType).map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Summary</span>
            <textarea name="summary" rows={3} defaultValue={source.summary ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Original filename</span>
              <input name="originalFilename" defaultValue={source.originalFilename ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>File path</span>
              <input name="filePath" defaultValue={source.filePath ?? ""} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Source date</span>
              <input name="sourceDate" defaultValue={source.sourceDate ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Source year</span>
              <input name="sourceYear" type="number" defaultValue={source.sourceYear ?? ""} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            <span className={labelSpanClass}>Author or origin</span>
            <input name="authorOrOrigin" defaultValue={source.authorOrOrigin ?? ""} className={fieldClass} />
          </label>
          <label className={labelClass}>
            <span className={labelSpanClass}>Notes</span>
            <textarea name="notes" rows={2} defaultValue={source.notes ?? ""} className={fieldClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Archive status</span>
              <input name="archiveStatus" defaultValue={source.archiveStatus ?? ""} className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Ingestion status</span>
              <input name="ingestionStatus" defaultValue={source.ingestionStatus ?? ""} className={fieldClass} placeholder="e.g. reviewing" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="ingestionReady" defaultChecked={source.ingestionReady} className="rounded border-stone-300" />
            Ingestion ready
          </label>
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800">
            Save changes
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-stone-900">Source text</h2>
        <p className="mt-1 text-sm text-stone-600">
          Paste full text from PDFs or documents until automated parsing exists. Ingestion packets read from here.
        </p>
        <form action={saveText} className="mt-4 space-y-4">
          <input type="hidden" name="sourceId" value={source.id} />
          <label className={labelClass}>
            <span className={labelSpanClass}>Raw text</span>
            <textarea
              name="rawText"
              rows={12}
              defaultValue={source.sourceText?.rawText ?? ""}
              className={fieldClass}
              placeholder="Paste transcribed or copied text…"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelSpanClass}>Text status</span>
              <select
                name="textStatus"
                className={fieldClass}
                defaultValue={source.sourceText?.textStatus ?? "none"}
              >
                <option value="none">none</option>
                <option value="imported">imported</option>
                <option value="normalized">normalized</option>
                <option value="reviewed">reviewed</option>
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelSpanClass}>Text notes</span>
              <input
                name="textNotes"
                defaultValue={source.sourceText?.textNotes ?? ""}
                className={fieldClass}
                placeholder="Provenance, OCR caveats, etc."
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
            >
              Save source text
            </button>
          </div>
        </form>
        <form action={normalizeText} className="mt-4 border-t border-stone-100 pt-4">
          <input type="hidden" name="sourceId" value={source.id} />
          <button
            type="submit"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
          >
            Normalize text
          </button>
          <p className="mt-2 text-xs text-stone-500">
            Writes normalized text (whitespace cleanup) and sets status to normalized when possible.
          </p>
        </form>
        {source.sourceText?.normalizedText ? (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-stone-800">Normalized preview</h3>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-stone-50 p-4 text-xs text-stone-800">
              {source.sourceText.normalizedText.slice(0, 12000)}
              {source.sourceText.normalizedText.length > 12000 ? "\n…" : ""}
            </pre>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailSection title="Visibility & classification">
          <RecordMetaBadges visibility={source.visibility} recordType={source.recordType} />
          <p className="mt-2 text-xs text-stone-500">
            Type: {source.sourceType.replaceAll("_", " ")}
          </p>
        </DetailSection>
        <DetailSection title="Ingestion lifecycle">
          <p className="text-stone-700">
            Ingestion ready: <strong>{source.ingestionReady ? "yes" : "no"}</strong>
            {source.ingestionStatus ? (
              <>
                {" "}
                · status: <StatusBadge label={source.ingestionStatus.replaceAll("_", " ")} />
              </>
            ) : null}
          </p>
          {source.archiveStatus ? (
            <p className="mt-2">
              Archive: <StatusBadge label={source.archiveStatus} />
            </p>
          ) : null}
          <p className="mt-3 text-xs text-stone-500">
            Use the ingestion workspace for packets, mock extraction, and entity review. File storage and OCR are deferred.
          </p>
        </DetailSection>
      </div>

      <DetailSection title="Narrative DNA">
        <p className="text-sm text-stone-700">
          When the archive is <strong>reviewed</strong> and <strong>ingestion ready</strong> is off, you can run DNA
          extraction instead of the standard entity pipeline. This creates rules, themes, symbols, motifs, devices, and
          patterns bound to this source.
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Eligible now: <strong>{dnaEligible ? "yes" : "no"}</strong>
          {!dnaEligible ? (
            <span className="text-stone-500">
              {" "}
              — set archive status to <code className="text-xs">reviewed</code> and uncheck ingestion ready.
            </span>
          ) : null}
        </p>
        {hasDna ? (
          <ul className="mt-3 flex flex-wrap gap-2 text-xs text-stone-700">
            <li className="rounded-full bg-stone-100 px-2 py-0.5">Rules: {dnaCounts.rules}</li>
            <li className="rounded-full bg-stone-100 px-2 py-0.5">Themes: {dnaCounts.themes}</li>
            <li className="rounded-full bg-stone-100 px-2 py-0.5">Symbols: {dnaCounts.symbols}</li>
            <li className="rounded-full bg-stone-100 px-2 py-0.5">Motifs: {dnaCounts.motifs}</li>
            <li className="rounded-full bg-stone-100 px-2 py-0.5">Devices: {dnaCounts.devices}</li>
            <li className="rounded-full bg-stone-100 px-2 py-0.5">Patterns: {dnaCounts.patterns}</li>
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">No DNA rows stored for this source yet.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={dnaExtract}>
            <input type="hidden" name="sourceId" value={source.id} />
            <button
              type="submit"
              disabled={
                !dnaEligible ||
                !(
                  source.sourceText?.rawText?.trim() ||
                  source.sourceText?.normalizedText?.trim()
                )
              }
              className="rounded-full bg-violet-900 px-5 py-2 text-sm font-medium text-violet-50 enabled:hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Extract narrative DNA
            </button>
          </form>
          <p className="text-xs text-stone-500 self-center">
            Re-run replaces prior DNA rows tied to this source. Add bindings under Admin → Bindings.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
          <form action={consolidateGuides} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="returnSourceId" value={source.id} />
            <button
              type="submit"
              className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-950 hover:bg-violet-100"
            >
              Run consolidation (full guide corpus)
            </button>
          </form>
          <form action={rebindDna} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="returnSourceId" value={source.id} />
            <button
              type="submit"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
            >
              Rebind DNA → world
            </button>
          </form>
          <p className="text-xs text-stone-500">
            Safe to re-run. Consolidation dedupes policy aliases; rebind adds heuristic scene/place links.
          </p>
        </div>
        <p className="mt-3 text-xs text-stone-600">
          Source-support bindings (DNA emerges_from this archive):{" "}
          <strong>{sourceSupportBindings}</strong>
        </p>
      </DetailSection>

      <DetailSection title="Extraction &amp; review">
        {source.extractedSummary ? (
          <p className="text-sm text-stone-800">
            <span className="font-medium text-stone-900">Extracted summary: </span>
            {source.extractedSummary}
          </p>
        ) : (
          <p className="text-sm text-stone-500">No extracted summary on the source yet.</p>
        )}
        {source.reviewedSummary ? (
          <p className="mt-3 text-sm text-stone-800">
            <span className="font-medium text-stone-900">Reviewed summary: </span>
            {source.reviewedSummary}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-stone-700">
          Latest extraction result:{" "}
          {source.lastIngestionRun?.extractionResult ? (
            <StatusBadge label={source.lastIngestionRun.extractionResult.status} />
          ) : (
            "—"
          )}
        </p>
        <p className="mt-2 text-sm text-stone-700">
          Extracted entities (all runs): <strong>{extractionCounts.total}</strong>
        </p>
        {extractionCounts.total > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2 text-xs text-stone-600">
            {Object.entries(extractionCounts.byType)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([t, n]) => (
                <li
                  key={t}
                  className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-800"
                >
                  {t}: {n}
                </li>
              ))}
          </ul>
        ) : null}
        <p className="mt-3 text-xs text-stone-500">
          Open the ingestion workspace for packets, OpenAI extraction, and per-entity review.
        </p>
      </DetailSection>

      <DetailSection title="Linked claims">
        {source.claims.length === 0 ? (
          <p className="text-stone-600">No claims yet. Add claims from the Claims admin.</p>
        ) : (
          <ul className="space-y-2">
            {source.claims.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/claims/${c.id}`} className="text-amber-900 hover:underline">
                  {c.description.slice(0, 120)}
                  {c.description.length > 120 ? "…" : ""}
                </Link>
                <span className="ml-2 text-xs text-stone-500">confidence {c.confidence}</span>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Linked people">
        {source.persons.length === 0 ? (
          <p className="text-stone-600">None linked yet. Many-to-many links can be assigned when relationship UI ships.</p>
        ) : (
          <ul className="list-inside list-disc">
            {source.persons.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/people/${p.id}`} className="text-amber-900 hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Linked places">
        {source.places.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="list-inside list-disc">
            {source.places.map((pl) => (
              <li key={pl.id}>
                <Link href={`/admin/places/${pl.id}`} className="text-amber-900 hover:underline">
                  {pl.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Linked events">
        {source.events.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="list-inside list-disc">
            {source.events.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/events/${e.id}`} className="text-amber-900 hover:underline">
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Linked chapters">
        {source.chapters.length === 0 ? (
          <p className="text-stone-600">None linked yet.</p>
        ) : (
          <ul className="list-inside list-disc">
            {source.chapters.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/chapters/${c.id}`} className="text-amber-900 hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Open questions referencing this source">
        {source.openQuestions.length === 0 ? (
          <p className="text-stone-600">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {source.openQuestions.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/questions/${q.id}`} className="text-amber-900 hover:underline">
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
