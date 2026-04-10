import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getDashboardCounts } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const counts = await getDashboardCounts();

  const stats = [
    { label: "Sources", value: counts.sources, href: "/admin/sources" },
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
    </div>
  );
}
