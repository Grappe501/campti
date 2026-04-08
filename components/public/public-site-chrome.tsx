import Link from "next/link";

/** Minimal top bar for routes outside /read (home, membership). */
export function PublicSiteChrome() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-800/60 bg-[#0f0e0c]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <Link
          href="/"
          className="font-serif text-lg tracking-tight text-stone-100 transition hover:text-amber-50/90"
        >
          Campti
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.18em] text-stone-500">
          <Link href="/read" className="transition hover:text-stone-200">
            Read
          </Link>
          <Link href="/membership" className="transition hover:text-stone-200">
            Depth
          </Link>
        </nav>
      </div>
    </header>
  );
}
