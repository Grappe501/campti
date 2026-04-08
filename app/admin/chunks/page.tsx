import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getSourceChunksForAdminList } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminChunksPage() {
  const chunks = await getSourceChunksForAdminList();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Chunks"
        description="Reviewable chunk boundaries for long sources (normalized offsets + labels)."
      />

      {chunks.length === 0 ? (
        <p className="text-sm text-stone-600">No chunks yet.</p>
      ) : (
        <ul className="space-y-3">
          {chunks.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/chunks/${c.id}`}
                    className="font-medium text-amber-900 hover:underline"
                  >
                    {c.chunkLabel ?? `Chunk ${String(c.chunkIndex + 1).padStart(2, "0")}`}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">
                    Source:{" "}
                    <Link
                      href={`/admin/ingestion/${c.source.id}`}
                      className="text-amber-900 hover:underline"
                    >
                      {c.source.title}
                    </Link>
                  </p>
                  <p className="mt-1 font-mono text-xs text-stone-500">
                    offsets {c.startOffset ?? "—"}–{c.endOffset ?? "—"} · chars{" "}
                    {c.charCount ?? (c.normalizedText?.length ?? c.rawText?.length ?? 0)}
                  </p>
                </div>
                <div className="text-right text-xs text-stone-600">
                  <StatusBadge label={c.textStatus ?? "—"} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

