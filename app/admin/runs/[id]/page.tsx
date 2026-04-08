import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getIngestionRunById } from "@/lib/data-access";
import {
  EXTRACTION_PROMPT_VERSION,
  INSTRUCTIONS_VERSION,
} from "@/lib/ingestion-constants";
import { groupBy } from "@/lib/group-by";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function packetTruncationNote(packetJson: unknown): string | null {
  if (!packetJson || typeof packetJson !== "object") return null;
  const t = (packetJson as Record<string, unknown>).truncation as
    | Record<string, unknown>
    | undefined;
  if (!t || typeof t !== "object") return null;
  if (t.truncated === true) {
    return `Text truncated before send: ${String(t.sentChars ?? "?")} of ${String(t.originalChars ?? "?")} characters (limit ${String(t.maxChars ?? "")}).`;
  }
  return null;
}

export default async function AdminIngestionRunPage({ params }: Props) {
  const { id } = await params;
  const run = await getIngestionRunById(id);
  if (!run) notFound();

  const entitiesByType = groupBy(run.extractedEntities, (e) => e.entityType);
  const truncationFromPacket = run.extractionPacket
    ? packetTruncationNote(run.extractionPacket.packetJson)
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/admin/ingestion/${run.sourceId}`} className="text-sm text-amber-900 hover:underline">
          ← Source ingestion
        </Link>
        <PageHeader title="Ingestion run" description="Debug snapshot: packet, result, and extracted rows." />
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm text-sm">
        <h2 className="text-lg font-medium text-stone-900">Run metadata</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-stone-500">ID</dt>
            <dd className="font-mono text-xs text-stone-800">{run.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Status</dt>
            <dd>
              <StatusBadge label={run.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Source</dt>
            <dd>
              <Link href={`/admin/ingestion/${run.sourceId}`} className="text-amber-900 hover:underline">
                {run.source.title}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Run type</dt>
            <dd>{run.runType ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Model</dt>
            <dd className="font-mono text-xs text-stone-800">{run.modelName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Prompt version (stored)</dt>
            <dd className="break-all text-xs text-stone-800">{run.promptVersion ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Instructions / extraction prompt</dt>
            <dd className="text-xs text-stone-700">
              {INSTRUCTIONS_VERSION} · {EXTRACTION_PROMPT_VERSION}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Tokens (est.)</dt>
            <dd>{run.tokenEstimate ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Raw text length (original)</dt>
            <dd>{run.rawTextLength ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Chunking mode</dt>
            <dd>{run.chunkingMode ?? "single"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Chunk count</dt>
            <dd>{run.chunkCount ?? "—"}</dd>
          </div>
          {run.errorMessage ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-rose-600">Error</dt>
              <dd className="text-rose-900">{run.errorMessage}</dd>
            </div>
          ) : null}
          {truncationFromPacket ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-amber-800">Truncation</dt>
              <dd className="text-amber-950">{truncationFromPacket}</dd>
            </div>
          ) : null}
          {run.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-stone-500">Notes / warnings</dt>
              <dd className="whitespace-pre-wrap text-stone-800">{run.notes}</dd>
            </div>
          ) : null}
          {run.aggregationNotes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-stone-500">Aggregation notes</dt>
              <dd className="whitespace-pre-wrap text-stone-800">{run.aggregationNotes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <DetailSection title="Chunk runs">
        {run.chunkExtractionRuns.length === 0 ? (
          <p className="text-stone-600">No chunk runs for this ingestion run.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {run.chunkExtractionRuns.map((r) => (
              <li key={r.id} className="rounded-lg border border-stone-100 bg-stone-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/admin/chunks/${r.sourceChunkId}`}
                    className="text-amber-900 hover:underline"
                  >
                    {r.sourceChunk.chunkLabel ??
                      `Chunk ${String(r.sourceChunk.chunkIndex + 1).padStart(2, "0")}`}
                  </Link>
                  <StatusBadge label={r.status} />
                </div>
                {r.errorMessage ? (
                  <p className="mt-2 text-xs text-rose-900">{r.errorMessage}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-stone-500">
          View chunk boundaries in{" "}
          <Link href="/admin/chunks" className="text-amber-900 hover:underline">
            /admin/chunks
          </Link>
          .
        </p>
      </DetailSection>

      <DetailSection title="Extraction packet snapshot">
        {run.extractionPacket ? (
          <div className="space-y-3 text-sm text-stone-800">
            <p>
              Ready for AI:{" "}
              <strong>{run.extractionPacket.readyForAI ? "yes" : "no"}</strong> · Instructions:{" "}
              {run.extractionPacket.instructionsVersion ?? "—"}
            </p>
            <p className="text-xs text-stone-500">
              Normalized length: {run.extractionPacket.normalizedText?.length ?? 0} chars
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-stone-900/95 p-4 text-xs text-stone-100">
              {run.extractionPacket.rawText.slice(0, 8000)}
              {run.extractionPacket.rawText.length > 8000 ? "\n…" : ""}
            </pre>
          </div>
        ) : (
          <p className="text-stone-600">No packet on this run.</p>
        )}
      </DetailSection>

      <DetailSection title="Extraction result snapshot">
        {run.extractionResult ? (
          <div className="space-y-3 text-sm">
            <p>
              Status: <StatusBadge label={run.extractionResult.status} />
            </p>
            {run.extractionResult.summaryDraft ? (
              <p className="text-stone-700">{run.extractionResult.summaryDraft}</p>
            ) : null}
            <pre className="max-h-96 overflow-auto rounded-lg bg-stone-50 p-4 text-xs text-stone-800">
              {JSON.stringify(
                {
                  peopleDraft: run.extractionResult.peopleDraft,
                  placesDraft: run.extractionResult.placesDraft,
                  claimsDraft: run.extractionResult.claimsDraft,
                  symbolsDraft: run.extractionResult.symbolsDraft,
                  questionsDraft: run.extractionResult.questionsDraft,
                },
                null,
                2,
              )}
            </pre>
            {run.extractionResult.rawModelOutput ? (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase text-stone-500">
                  Raw model output (debug)
                </h3>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-stone-900/95 p-4 text-xs text-stone-100">
                  {JSON.stringify(run.extractionResult.rawModelOutput, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-stone-600">No extraction result yet.</p>
        )}
      </DetailSection>

      <DetailSection title="Extracted entities">
        {run.extractedEntities.length === 0 ? (
          <p className="text-stone-600">None for this run.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <p className="text-stone-700">
              Total: <strong>{run.extractedEntities.length}</strong>
            </p>
            <ul className="flex flex-wrap gap-2 text-xs text-stone-600">
              {Array.from(entitiesByType.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([type, list]) => (
                  <li
                    key={type}
                    className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-800"
                  >
                    {type}: {list.length}
                  </li>
                ))}
            </ul>
            <ul className="space-y-2">
              {run.extractedEntities.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/extracted/${e.id}`} className="text-amber-900 hover:underline">
                    [{e.entityType}] {e.proposedTitle ?? e.proposedName ?? e.id}
                  </Link>
                  <span className="ml-2 text-xs text-stone-500">{e.reviewStatus}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DetailSection>
    </div>
  );
}
