import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailSection } from "@/components/detail-section";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getSourceChunkById } from "@/lib/data-access";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminChunkDetailPage({ params }: Props) {
  const { id } = await params;
  const chunk = await getSourceChunkById(id);
  if (!chunk) notFound();

  const text = chunk.normalizedText ?? chunk.rawText ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link href="/admin/chunks" className="text-sm text-amber-900 hover:underline">
          ← Chunks
        </Link>
        <PageHeader
          title={chunk.chunkLabel ?? `Chunk ${String(chunk.chunkIndex + 1).padStart(2, "0")}`}
          description="Normalized offsets are the source of truth for debugging aggregation later."
        />
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm text-sm">
        <h2 className="text-lg font-medium text-stone-900">Chunk metadata</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-stone-500">ID</dt>
            <dd className="font-mono text-xs text-stone-800">{chunk.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Status</dt>
            <dd>
              <StatusBadge label={chunk.textStatus ?? "—"} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Source</dt>
            <dd>
              <Link
                href={`/admin/ingestion/${chunk.source.id}`}
                className="text-amber-900 hover:underline"
              >
                {chunk.source.title}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Chunk index</dt>
            <dd>{chunk.chunkIndex}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Offsets (normalized)</dt>
            <dd className="font-mono text-xs text-stone-800">
              {chunk.startOffset ?? "—"}–{chunk.endOffset ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-stone-500">Chars / tokens</dt>
            <dd className="font-mono text-xs text-stone-800">
              {chunk.charCount ?? text.length} / {chunk.tokenEstimate ?? "—"}
            </dd>
          </div>
          {chunk.headingHint ? (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-stone-500">Heading hint</dt>
              <dd className="text-stone-800">{chunk.headingHint}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <DetailSection title="Chunk extraction runs">
        {chunk.chunkExtractionRuns.length === 0 ? (
          <p className="text-stone-600">No chunk runs yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {chunk.chunkExtractionRuns.map((r) => (
              <li key={r.id} className="rounded-lg border border-stone-100 bg-stone-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/admin/runs/${r.ingestionRun.id}`}
                    className="font-mono text-xs text-amber-900 hover:underline"
                  >
                    run {r.ingestionRun.id}
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
      </DetailSection>

      <DetailSection title="Normalized text">
        {text.length ? (
          <pre className="max-h-[70vh] overflow-auto rounded-lg bg-stone-900/95 p-4 text-xs text-stone-100 whitespace-pre-wrap">
            {text}
          </pre>
        ) : (
          <p className="text-stone-600">No text stored on this chunk.</p>
        )}
      </DetailSection>
    </div>
  );
}

