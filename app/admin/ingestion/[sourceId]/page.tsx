import Link from "next/link";
import { notFound } from "next/navigation";
import { extractNarrativeDNAAction } from "@/app/actions/narrative-dna";
import {
  createIngestionPacketAction,
  createMockExtractionResultAction,
  generateExtractedEntitiesAction,
  markPacketReadyAction,
  markSourceLinkedAction,
  markSourceReviewingAction,
} from "@/app/actions/ingestion";
import {
  rerunExtractionAction,
  runRealExtractionAction,
} from "@/app/actions/openai-extraction";
import { AlertBanner } from "@/components/alert-banner";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { RecordMetaBadges } from "@/components/record-meta-badges";
import { StatusBadge } from "@/components/status-badge";
import {
  getExtractedEntityCountsBySource,
  getIngestionWorkspace,
} from "@/lib/data-access";
import { groupBy } from "@/lib/group-by";
import { hasUsableSourceTextForExtraction } from "@/lib/openai-extraction";
import { isOpenAIApiKeyConfigured } from "@/lib/openai";
import { MAX_EXTRACTION_CHARS, isNarrativeDnaIngestionEligible } from "@/lib/ingestion-constants";
import { estimateTokenCount } from "@/lib/ingestion-packet";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ sourceId: string }>;
  searchParams: Promise<{ saved?: string; run?: string; error?: string }>;
};

function SavedBanner(code: string | undefined) {
  if (!code) return null;
  const labels: Record<string, string> = {
    packet_ready: "Packet marked ready for AI.",
    mock_result: "Mock extraction result saved.",
    entities: "Extracted entity rows generated.",
    reviewing: "Source marked as reviewing.",
    linked: "Source marked as linked.",
    ai_ok: "OpenAI extraction finished. Review the run and extracted entities.",
    dna_extracted: "Narrative DNA extraction finished. Review rules, themes, and bindings.",
  };
  const msg = labels[code] ?? "Saved.";
  return (
    <AlertBanner variant="success">{msg}</AlertBanner>
  );
}

function ErrorBanner(code: string | undefined) {
  if (!code) return null;
  const labels: Record<string, string> = {
    no_key:
      "OPENAI_API_KEY is not set. Add it to your environment for real extraction.",
    no_text: "Add source text on the source detail page before running extraction.",
    not_found: "Source or packet was not found.",
    empty_packet: "Packet text was empty after preparation.",
    openai_failed: "OpenAI request failed. See the ingestion run for details.",
    invalid_json: "Model returned invalid JSON. See the ingestion run for details.",
    db_failed: "Saving extraction failed. See the ingestion run for details.",
    all_chunks_failed:
      "All chunks failed extraction; no aggregated result was produced. See the ingestion run for details.",
    validation: "Invalid form input.",
    no_result: "Create an extraction result first.",
  };
  const msg =
    labels[code] ??
    (() => {
      try {
        return decodeURIComponent(code);
      } catch {
        return code;
      }
    })();
  return (
    <AlertBanner variant="error" role="alert">
      {msg}
    </AlertBanner>
  );
}

export default async function AdminIngestionSourcePage({ params, searchParams }: Props) {
  const { sourceId } = await params;
  const sp = await searchParams;
  const workspace = await getIngestionWorkspace(sourceId);
  if (!workspace) notFound();

  const latestRun = workspace.ingestionRuns[0] ?? null;
  const byType = groupBy(workspace.extractedEntities, (e) => e.entityType);
  const openaiReady = isOpenAIApiKeyConfigured();
  const hasRealText = hasUsableSourceTextForExtraction(workspace, workspace.sourceText);
  const packetReady = Boolean(latestRun?.extractionPacket?.readyForAI);
  const extractionCounts = await getExtractedEntityCountsBySource(workspace.id);
  const normalizedLen = workspace.sourceText?.normalizedText?.length ?? 0;
  const tokenEstimate = workspace.sourceText?.normalizedText
    ? estimateTokenCount(workspace.sourceText.normalizedText)
    : 0;
  const selectedMode = normalizedLen > MAX_EXTRACTION_CHARS ? "chunked" : "single";
  const modeReason =
    normalizedLen > MAX_EXTRACTION_CHARS
      ? `above threshold (${MAX_EXTRACTION_CHARS})`
      : `within threshold (${MAX_EXTRACTION_CHARS})`;

  const dnaEligible = workspace ? isNarrativeDnaIngestionEligible(workspace) : false;
  const dnaExtract = extractNarrativeDNAAction;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/ingestion" className="text-sm text-amber-900 hover:underline">
          ← Ingestion queue
        </Link>
        <PageHeader
          title={workspace.title}
          description="Source-specific ingestion workspace: packet, mock extraction, and entity review prep."
        />
      </div>

      {SavedBanner(sp.saved)}
      {ErrorBanner(sp.error)}

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-stone-900">Source metadata</h2>
            <p className="mt-2 text-sm text-stone-600">
              {workspace.summary ?? "No summary yet."}
            </p>
            <div className="mt-3">
              <RecordMetaBadges visibility={workspace.visibility} recordType={workspace.recordType} />
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Type: {workspace.sourceType.replaceAll("_", " ")} · Year: {workspace.sourceYear ?? "—"}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="text-stone-500">Ingestion: </span>
              {workspace.ingestionStatus ? (
                <StatusBadge label={workspace.ingestionStatus.replaceAll("_", " ")} />
              ) : (
                "—"
              )}
            </p>
            <p className="mt-2">
              <Link href={`/admin/sources/${workspace.id}`} className="text-amber-900 hover:underline">
                Edit source &amp; paste text
              </Link>
            </p>
          </div>
        </div>
        {workspace.processingNotes ? (
          <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-700">
            <span className="font-medium text-stone-800">Processing notes: </span>
            {workspace.processingNotes}
          </p>
        ) : null}
        {workspace.extractedSummary ? (
          <p className="mt-2 text-sm text-stone-700">
            <span className="font-medium">Extracted summary: </span>
            {workspace.extractedSummary}
          </p>
        ) : null}
        {workspace.reviewedSummary ? (
          <p className="mt-2 text-sm text-stone-700">
            <span className="font-medium">Reviewed summary: </span>
            {workspace.reviewedSummary}
          </p>
        ) : null}
        <div className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-700">
          <p className="font-medium text-stone-800">Extraction snapshot</p>
          <p className="mt-1 text-stone-600">
            Latest result (source pointer):{" "}
            {workspace.lastIngestionRun?.extractionResult ? (
              <StatusBadge
                label={workspace.lastIngestionRun.extractionResult.status}
              />
            ) : (
              "—"
            )}{" "}
            · Entities (all runs):{" "}
            <strong>{extractionCounts.total}</strong>
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
        </div>
      </section>

      <DetailSection title="Narrative DNA extraction (alternate path)">
        <p className="text-sm text-stone-700">
          For long-form narrative bibles, use DNA extraction instead of the standard people/places/events pipeline when
          the source is archived as reviewed and not marked ingestion-ready. This writes rules, themes, symbols, motifs,
          devices, and patterns, then links them to the source.
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Eligible: <strong>{dnaEligible ? "yes" : "no"}</strong>
          {workspace.ingestionStatus === "dna_extracted" ? (
            <span className="ml-2 text-violet-800">· last DNA status: dna_extracted</span>
          ) : null}
        </p>
        <form action={dnaExtract} className="mt-4">
          <input type="hidden" name="sourceId" value={workspace.id} />
          <button
            type="submit"
            disabled={!dnaEligible || !hasRealText}
            className="rounded-full bg-violet-900 px-5 py-2 text-sm font-medium text-violet-50 enabled:hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Extract narrative DNA
          </button>
        </form>
        <p className="mt-2 text-xs text-stone-500">
          Same action as on the source detail page. Re-run replaces prior DNA rows for this source.
        </p>
      </DetailSection>

      <DetailSection title="AI extraction (OpenAI)">
        <div className="space-y-4 text-sm text-stone-700">
          <AlertBanner variant={openaiReady ? "success" : "warning"}>
            API key: {openaiReady ? "configured (server)" : "not set — real extraction disabled"}
          </AlertBanner>
          <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="font-medium text-stone-800">Mode decision</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-600">
              <li>Normalized text length: <strong>{normalizedLen.toLocaleString()}</strong> chars</li>
              <li>Estimated tokens: <strong>{tokenEstimate.toLocaleString()}</strong></li>
              <li>
                Extraction mode selected: <strong>{selectedMode}</strong> · reason: {modeReason}
              </li>
            </ul>
          </section>
          <ul className="list-inside list-disc space-y-1 text-stone-600">
            <li>Source text: {hasRealText ? "available" : "missing or placeholder only"}</li>
            <li>
              Packet ready (latest run): {packetReady ? "yes" : "no — create packet and mark ready, or run extraction (creates a new run)"}
            </li>
            <li>
              Last run:{" "}
              {latestRun ? (
                <>
                  <Link
                    href={`/admin/runs/${latestRun.id}`}
                    className="font-mono text-amber-900 hover:underline"
                  >
                    {latestRun.status}
                  </Link>
                  {latestRun.runType ? (
                    <span className="text-stone-500"> · {latestRun.runType}</span>
                  ) : null}
                </>
              ) : (
                "—"
              )}
            </li>
            <li>
              Last extraction result:{" "}
              {latestRun?.extractionResult ? (
                <StatusBadge label={latestRun.extractionResult.status} />
              ) : (
                "—"
              )}
            </li>
          </ul>
          <div className="flex flex-col gap-3 border-t border-stone-100 pt-4">
            <form action={runRealExtractionAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="sourceId" value={workspace.id} />
              <button
                type="submit"
                disabled={!openaiReady || !hasRealText}
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Run real extraction
              </button>
              <p className="text-xs text-stone-500">
                Creates a new ingestion run, calls OpenAI with structured JSON, saves result and entity rows.
              </p>
            </form>
            <form action={rerunExtractionAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="sourceId" value={workspace.id} />
              <button
                type="submit"
                disabled={!openaiReady || !hasRealText}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Re-run extraction
              </button>
              <p className="text-xs text-stone-500">
                Starts a fresh run; prior runs remain in history.
              </p>
            </form>
            {latestRun ? (
              <div className="flex flex-wrap gap-3">
                <form action={generateExtractedEntitiesAction}>
                  <input type="hidden" name="sourceId" value={workspace.id} />
                  <input type="hidden" name="ingestionRunId" value={latestRun.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
                  >
                    Regenerate entities from latest result
                  </button>
                </form>
                <Link
                  href={`/admin/runs/${latestRun.id}`}
                  className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
                >
                  View latest run
                </Link>
              </div>
            ) : null}
            <p className="text-xs text-stone-500">
              Real runs already create extracted rows; use regenerate if you edited the stored extraction result manually.
            </p>
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Mock &amp; packet workflow (testing)">
        <div className="flex flex-col gap-4">
          <form action={createIngestionPacketAction}>
            <input type="hidden" name="sourceId" value={workspace.id} />
            <button
              type="submit"
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-stone-800"
            >
              Create packet
            </button>
            <p className="mt-2 text-xs text-stone-500">
              Creates an ingestion run (parsed) and saves an extraction packet from Source text (or placeholder).
            </p>
          </form>

          {latestRun?.extractionPacket ? (
            <form action={markPacketReadyAction} className="border-t border-stone-100 pt-4">
              <input type="hidden" name="sourceId" value={workspace.id} />
              <input type="hidden" name="ingestionRunId" value={latestRun.id} />
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                Mark packet ready for AI
              </button>
              <p className="mt-2 text-xs text-stone-500">
                Latest run: <Link href={`/admin/runs/${latestRun.id}`} className="text-amber-900 hover:underline">{latestRun.id}</Link>
              </p>
            </form>
          ) : null}

          {latestRun ? (
            <form action={createMockExtractionResultAction} className="border-t border-stone-100 pt-4">
              <input type="hidden" name="sourceId" value={workspace.id} />
              <input type="hidden" name="ingestionRunId" value={latestRun.id} />
              <input type="hidden" name="status" value="draft" />
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                Create mock extraction result
              </button>
              <p className="mt-2 text-xs text-stone-500">
                Fills drafts from title/summary/notes — no OpenAI.
              </p>
            </form>
          ) : null}

          {latestRun ? (
            <form action={generateExtractedEntitiesAction} className="border-t border-stone-100 pt-4">
              <input type="hidden" name="sourceId" value={workspace.id} />
              <input type="hidden" name="ingestionRunId" value={latestRun.id} />
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                Generate extracted entity review set
              </button>
              <p className="mt-2 text-xs text-stone-500">
                Replaces prior extracted rows for this run and creates review rows from the result JSON.
              </p>
            </form>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-stone-100 pt-4">
            <form action={markSourceReviewingAction}>
              <input type="hidden" name="sourceId" value={workspace.id} />
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                Mark source reviewing
              </button>
            </form>
            <form action={markSourceLinkedAction}>
              <input type="hidden" name="sourceId" value={workspace.id} />
              <button
                type="submit"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                Mark source linked
              </button>
            </form>
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Ingestion runs">
        {workspace.ingestionRuns.length === 0 ? (
          <p className="text-stone-600">No runs yet. Use “Create packet” to start.</p>
        ) : (
          <ul className="space-y-3">
            {workspace.ingestionRuns.map((run) => (
              <li key={run.id} className="rounded-lg border border-stone-100 bg-stone-50/80 px-4 py-3 text-sm">
                <Link href={`/admin/runs/${run.id}`} className="font-medium text-amber-900 hover:underline">
                  {run.status}
                </Link>
                <span className="ml-2 text-xs text-stone-500">
                  {run.createdAt.toISOString().slice(0, 10)}
                </span>
                {run.extractionPacket ? (
                  <span className="ml-2 text-xs text-stone-600">
                    · packet {run.extractionPacket.readyForAI ? "(ready)" : "(draft)"}
                  </span>
                ) : null}
                {run.extractionResult ? (
                  <span className="ml-2 text-xs text-stone-600">
                    · result {run.extractionResult.status}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="Extracted entities (this source)">
        {workspace.extractedEntities.length === 0 ? (
          <p className="text-stone-600">
            None yet.{" "}
            <Link href="/admin/extracted" className="text-amber-900 hover:underline">
              Global extracted queue
            </Link>
          </p>
        ) : (
          <div className="space-y-6">
            {Array.from(byType.entries()).map(([type, list]) => (
              <div key={type}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{type}</h3>
                <ul className="mt-2 space-y-1">
                  {list.map((e) => (
                    <li key={e.id}>
                      <Link href={`/admin/extracted/${e.id}`} className="text-amber-900 hover:underline">
                        {e.proposedTitle ?? e.proposedName ?? e.id}
                      </Link>
                      <span className="ml-2 text-xs text-stone-500">{e.reviewStatus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </DetailSection>
    </div>
  );
}
