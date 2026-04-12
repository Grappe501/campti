import Link from "next/link";

const links = [
  { href: "/read", label: "Story" },
  { href: "/read/chapters", label: "Chapters" },
  { href: "/read/characters", label: "People" },
  { href: "/read/places", label: "Places" },
  { href: "/read/timeline", label: "Timeline" },
  { href: "/read/symbols", label: "Symbols" },
];

export function ReadNav({ variant = "default" }: { variant?: "default" | "cockpit" }) {
  const cockpit = variant === "cockpit";
  return (
    <header
      id="read-nav"
      className={`sticky top-0 z-20 border-b backdrop-blur-md transition-opacity duration-500 ${
        cockpit
          ? "border-cyan-900/40 bg-[#050403]/92 shadow-[0_0_40px_rgba(0,0,0,0.45)]"
          : "border-stone-800/80 bg-[#0f0e0c]/90"
      }`}
    >
      <div
        className={`mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 ${
          cockpit ? "max-w-[100rem]" : "max-w-6xl"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {cockpit ? (
            <span
              className="hidden h-2 w-2 shrink-0 rounded-full bg-cyan-500/90 shadow-[0_0_12px_rgba(34,211,238,0.5)] sm:block"
              aria-hidden
            />
          ) : null}
          <Link
            href="/"
            className={`font-serif tracking-tight transition hover:text-amber-50/90 ${
              cockpit ? "text-base text-stone-100 sm:text-lg" : "text-lg text-stone-100"
            }`}
          >
            Campti
          </Link>
          {cockpit ? (
            <span className="hidden text-[0.5rem] uppercase tracking-[0.35em] text-cyan-700/80 sm:inline">
              Read deck
            </span>
          ) : null}
        </div>
        <nav
          className={`flex flex-wrap justify-end gap-1 sm:gap-2 ${
            cockpit ? "text-[0.65rem] uppercase tracking-[0.18em] text-stone-500" : "text-xs uppercase tracking-[0.16em] text-stone-500"
          }`}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 transition ${
                cockpit
                  ? "text-stone-400 hover:bg-cyan-950/40 hover:text-cyan-100/90"
                  : "text-stone-400 hover:bg-stone-900 hover:text-stone-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/membership"
            className={`rounded-full border px-3 py-1.5 transition ${
              cockpit
                ? "border-amber-800/35 text-amber-200/75 hover:border-amber-600/50 hover:text-amber-50"
                : "border-amber-900/30 text-amber-200/70 hover:border-amber-800/50 hover:text-amber-100"
            }`}
          >
            Depth
          </Link>
        </nav>
      </div>
    </header>
  );
}
