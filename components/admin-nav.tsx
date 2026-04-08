import Link from "next/link";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/brain", label: "Brain" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/fragments", label: "Fragments" },
  { href: "/admin/clusters", label: "Clusters" },
  { href: "/admin/ingestion", label: "Ingestion" },
  { href: "/admin/extracted", label: "Extracted" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/relationships", label: "Relationships" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/chapters", label: "Chapters" },
  { href: "/admin/scenes", label: "Scenes" },
  { href: "/admin/meta-scenes", label: "Meta scenes" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/continuity", label: "Continuity" },
  { href: "/admin/narrative-rules", label: "Narrative rules" },
  { href: "/admin/themes", label: "Themes" },
  { href: "/admin/symbols", label: "Symbols" },
  { href: "/admin/motifs", label: "Motifs" },
  { href: "/admin/literary-devices", label: "Literary devices" },
  { href: "/admin/patterns", label: "Patterns" },
  { href: "/admin/bindings", label: "Bindings" },
  { href: "/admin/attachment", label: "Attachment" },
];

export function AdminNav() {
  return (
    <aside className="w-full shrink-0 border-b border-stone-200 bg-white md:w-56 md:border-b-0 md:border-r">
      <div className="flex flex-col gap-1 p-4">
        <Link
          href="/"
          className="mb-2 text-sm font-semibold text-stone-900 hover:underline"
        >
          ← Campti
        </Link>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Admin
        </p>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
