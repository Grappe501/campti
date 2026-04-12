"use client";

import Link from "next/link";
import { ReadNav } from "@/components/read-nav";

/**
 * Jet-cockpit style shell for the public read zone: HUD top bar, side rails, center stage.
 * Side rails stay minimal in the free layer; paid depth can replace rail content later.
 */
export function ReadCockpitFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#060504] text-stone-200">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.09]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 100%)",
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <ReadNav variant="cockpit" />
        <div className="flex min-h-0 flex-1">
          <aside className="relative hidden w-[12rem] shrink-0 flex-col border-r border-cyan-950/35 bg-gradient-to-b from-black/50 to-[#070605] px-3 py-5 lg:flex">
            <p className="text-[0.5rem] font-medium uppercase tracking-[0.28em] text-cyan-700/80">
              Signal
            </p>
            <nav className="mt-4 flex flex-col gap-2 text-[0.7rem] leading-snug text-stone-500">
              <Link
                href="/read/chapters"
                className="rounded border border-transparent px-2 py-1.5 transition hover:border-cyan-900/40 hover:text-stone-300"
              >
                Chapter spine
              </Link>
              <Link
                href="/read/timeline"
                className="rounded border border-transparent px-2 py-1.5 transition hover:border-cyan-900/40 hover:text-stone-300"
              >
                Time axis
              </Link>
              <Link
                href="/read/symbols"
                className="rounded border border-transparent px-2 py-1.5 transition hover:border-cyan-900/40 hover:text-stone-300"
              >
                Motifs
              </Link>
            </nav>
            <div className="mt-auto border-t border-cyan-950/25 pt-4">
              <p className="text-[0.55rem] leading-relaxed text-stone-600">
                Reader view — instruments stay quiet until you need them.
              </p>
            </div>
          </aside>

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[min(100%,56rem)] px-4 py-10 sm:px-6 lg:px-10">
              {children}
            </div>
          </main>

          <aside className="relative hidden w-[12rem] shrink-0 flex-col border-l border-amber-950/25 bg-gradient-to-b from-[#070605] to-black/45 px-3 py-5 lg:flex">
            <p className="text-[0.5rem] font-medium uppercase tracking-[0.28em] text-amber-700/70">
              Depth
            </p>
            <p className="mt-3 text-[0.68rem] leading-relaxed text-stone-500">
              Member tier will load dossiers, literary tools, and scene studies into these rails.
            </p>
            <Link
              href="/membership"
              className="mt-4 text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/60 transition hover:text-amber-100"
            >
              Depth & access →
            </Link>
            <div className="mt-6 border-t border-amber-950/20 pt-4">
              <p className="text-[0.5rem] font-medium uppercase tracking-[0.26em] text-violet-400/60">
                Archivist
              </p>
              <p className="mt-2 text-[0.65rem] leading-relaxed text-stone-600">
                Third layer: ask historical questions, what-ifs, and light simulations against the
                archive — shipping after voice passes land.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
