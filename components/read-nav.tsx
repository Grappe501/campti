import Link from "next/link";

const links = [
  { href: "/read", label: "Story" },
  { href: "/read/chapters", label: "Chapters" },
  { href: "/read/characters", label: "People" },
  { href: "/read/places", label: "Places" },
  { href: "/read/timeline", label: "Timeline" },
  { href: "/read/symbols", label: "Symbols" },
];

export function ReadNav() {
  return (
    <header
      id="read-nav"
      className="sticky top-0 z-20 border-b border-stone-800/80 bg-[#0f0e0c]/90 backdrop-blur-md transition-opacity duration-500"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="font-serif text-lg tracking-tight text-stone-100 transition hover:text-amber-50/90"
        >
          Campti
        </Link>
        <nav className="flex flex-wrap justify-end gap-1 text-xs uppercase tracking-[0.16em] text-stone-500 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-stone-400 transition hover:bg-stone-900 hover:text-stone-100"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/membership"
            className="rounded-full border border-amber-900/30 px-3 py-1.5 text-amber-200/70 transition hover:border-amber-800/50 hover:text-amber-100"
          >
            Depth
          </Link>
        </nav>
      </div>
    </header>
  );
}
