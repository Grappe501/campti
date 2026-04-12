import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getDashboardCounts, getRecentScriptIndexedSources } from "@/lib/data-access";
import { SCRIPT_UPLOAD_ARCHIVE_STATUS } from "@/lib/script-upload-index";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [counts, scriptUploads] = await Promise.all([
    getDashboardCounts(),
    getRecentScriptIndexedSources(12),
  ]);

  const scriptIngestionHref = `/admin/ingestion?archiveStatus=${encodeURIComponent(SCRIPT_UPLOAD_ARCHIVE_STATUS)}`;

  const stats = [
    { label: "Sources", value: counts.sources, href: "/admin/sources" },
    {
      label: "Script-indexed uploads",
      value: counts.scriptIndexedSources,
      href: scriptIngestionHref,
    },
    { label: "Claims", value: counts.claims, href: "/admin/claims" },
    { label: "People", value: counts.people, href: "/admin/people" },
    { label: "Places", value: counts.places, href: "/admin/places" },
    { label: "Events", value: counts.events, href: "/admin/events" },
    { label: "Chapters", value: counts.chapters, href: "/admin/chapters" },
    { label: "Scenes", value: counts.scenes, href: "/admin/scenes" },
    { label: "Meta scenes", value: counts.metaScenes, href: "/admin/meta-scenes" },
    { label: "Open questions", value: counts.openQuestions, href: "/admin/questions" },
    { label: "Continuity notes", value: counts.continuityNotes, href: "/admin/continuity" },
    { label: "Symbols", value: counts.symbols, href: "/admin/symbols" },
    { label: "Themes", value: counts.themes, href: "/admin/themes" },
    { label: "Motifs", value: counts.motifs, href: "/admin/motifs" },
    { label: "Narrative rules", value: counts.narrativeRules, href: "/admin/narrative-rules" },
    { label: "Literary devices", value: counts.literaryDevices, href: "/admin/literary-devices" },
    { label: "Patterns", value: counts.narrativePatterns, href: "/admin/patterns" },
    { label: "Bindings", value: counts.narrativeBindings, href: "/admin/bindings" },
    { label: "Fragments", value: counts.fragments, href: "/admin/fragments" },
    { label: "Clusters", value: counts.fragmentClusters, href: "/admin/clusters" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Dashboard"
        description="Counts across the archive, narrative graph, and author tools."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-300/80"
          >
            <p className="text-sm font-medium text-stone-500">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-stone-900">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium text-stone-900">Incoming uploads (script-indexed)</h2>
          <Link
            href={scriptIngestionHref}
            className="text-sm font-medium text-amber-800 underline-offset-2 hover:underline"
          >
            View in ingestion
          </Link>
        </div>
        <p className="mt-1 text-sm text-stone-600">
          Drop files under <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">uploads/incoming/</code>, then run{" "}
          <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">npx tsx scripts/index-incoming-uploads.ts</code>.
          Text files become searchable chunks; other types are registered with path. Louisiana census bundle:{" "}
          <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">npm run research:census-pipeline</code>{" "}
          (sync from Downloads, index, import SQLite with normalized labels for story assembly).
        </p>
        {scriptUploads.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No script-indexed files yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {scriptUploads.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <div className="min-w-0">
                  <Link
                    href={`/admin/sources/${s.id}`}
                    className="font-medium text-stone-900 underline-offset-2 hover:underline"
                  >
                    {s.title}
                  </Link>
                  {s.filePath ? (
                    <p className="truncate text-xs text-stone-500">{s.filePath}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right text-xs text-stone-500">
                  {s._count.sourceChunks > 0 ? (
                    <span>{s._count.sourceChunks} chunks</span>
                  ) : (
                    <span>registered</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
