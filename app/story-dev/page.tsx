import path from "node:path";
import fs from "node:fs";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Story dev dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type StoryDevDashboard = {
  current_focus: string;
  updated: string;
  alignment_sweep?: { id: string; status: string; path: string };
  story_dev_lane?: { route: string; status: string; source_spec: string };
  epic: { score: number; bar?: string; status: string; summary: string };
  book01: { score: number; bar?: string; status: string; summary: string };
  chapter_candidates?: { count: number; status: string; path: string };
  prose: {
    tonal_model: string;
    tonal_model_path?: string;
    sample_002_status: string;
    sample_002_path?: string;
  };
  character_packets?: { status: string; path: string };
  symbol_braid?: { status: string; path: string; series_symbols_path?: string };
  sassafras_gumbo_research?: { status: string; path: string };
  book01_next_story_moves?: { path: string };
  top_blockers: string[];
  next_actions: string[];
  links: { label: string; path: string }[];
};

function loadDashboard(): StoryDevDashboard {
  const jsonPath = path.join(
    process.cwd(),
    "writing",
    "04_production_dashboard",
    "progress_system",
    "data",
    "story_dev_dashboard.json",
  );
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw) as StoryDevDashboard;
}

export default function StoryDevPage() {
  const data = loadDashboard();

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 text-stone-200">
      <header className="space-y-3 border-b border-stone-800 pb-8">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          Story development lane (non-production)
        </p>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-stone-100 sm:text-4xl">
          Story Dev Dashboard
        </h1>
        <p className="text-sm text-stone-400">
          This route is for author alignment: progress, samples, candidates, symbols, and sweep
          status. It does not replace the main product surfaces.
        </p>
        <p className="text-xs text-stone-500">Data updated: {data.updated}</p>
      </header>

      <section className="rounded-lg border border-stone-800 bg-stone-900/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-300">Current focus</h2>
        <p className="mt-2 text-base text-stone-100">{data.current_focus}</p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-800 bg-stone-900/30 p-5">
          <h2 className="text-sm font-semibold text-stone-300">Epic progress</h2>
          <p className="mt-2 font-mono text-lg text-amber-100/90">{data.epic.bar ?? ""}</p>
          <p className="text-sm text-stone-400">
            {data.epic.score}% — {data.epic.status}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{data.epic.summary}</p>
        </div>
        <div className="rounded-lg border border-stone-800 bg-stone-900/30 p-5">
          <h2 className="text-sm font-semibold text-stone-300">Book 01 progress</h2>
          <p className="mt-2 font-mono text-lg text-amber-100/90">{data.book01.bar ?? ""}</p>
          <p className="text-sm text-stone-400">
            {data.book01.score}% — {data.book01.status}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{data.book01.summary}</p>
        </div>
      </section>

      {data.alignment_sweep ? (
        <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
          <h2 className="text-sm font-semibold text-stone-300">Alignment sweep</h2>
          <p className="mt-2 text-sm text-stone-400">
            {data.alignment_sweep.id} — {data.alignment_sweep.status}
          </p>
          <p className="mt-1 font-mono text-xs text-stone-500">{data.alignment_sweep.path}</p>
        </section>
      ) : null}

      {data.chapter_candidates ? (
        <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
          <h2 className="text-sm font-semibold text-stone-300">Chapter candidates</h2>
          <p className="mt-2 text-sm text-stone-300">
            {data.chapter_candidates.count} candidates — {data.chapter_candidates.status}
          </p>
          <p className="mt-1 font-mono text-xs text-stone-500">{data.chapter_candidates.path}</p>
        </section>
      ) : null}

      <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
        <h2 className="text-sm font-semibold text-stone-300">Prose lab</h2>
        <ul className="mt-3 space-y-2 text-sm text-stone-300">
          <li>
            <span className="text-stone-500">Tonal model:</span> {data.prose.tonal_model}
          </li>
          <li>
            <span className="text-stone-500">Sample 002:</span> {data.prose.sample_002_status}
          </li>
        </ul>
        <div className="mt-4 space-y-1 font-mono text-xs text-amber-100/70">
          {data.prose.tonal_model_path ? <p>{data.prose.tonal_model_path}</p> : null}
          {data.prose.sample_002_path ? <p>{data.prose.sample_002_path}</p> : null}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {data.character_packets ? (
          <div className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
            <h2 className="text-sm font-semibold text-stone-300">Character packets</h2>
            <p className="mt-2 text-sm text-stone-400">{data.character_packets.status}</p>
            <p className="mt-1 font-mono text-xs text-stone-500">{data.character_packets.path}</p>
          </div>
        ) : null}
        {data.symbol_braid ? (
          <div className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
            <h2 className="text-sm font-semibold text-stone-300">Symbol braid</h2>
            <p className="mt-2 text-sm text-stone-400">{data.symbol_braid.status}</p>
            <p className="mt-1 font-mono text-xs text-stone-500">{data.symbol_braid.path}</p>
            {data.symbol_braid.series_symbols_path ? (
              <p className="mt-2 font-mono text-xs text-stone-500">{data.symbol_braid.series_symbols_path}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {data.sassafras_gumbo_research ? (
        <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
          <h2 className="text-sm font-semibold text-stone-300">Sassafras / gumbo research</h2>
          <p className="mt-2 text-sm text-stone-400">{data.sassafras_gumbo_research.status}</p>
          <p className="mt-1 font-mono text-xs text-stone-500">{data.sassafras_gumbo_research.path}</p>
        </section>
      ) : null}

      {data.book01_next_story_moves ? (
        <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
          <h2 className="text-sm font-semibold text-stone-300">Next story moves (Book 01)</h2>
          <p className="mt-2 font-mono text-xs text-stone-500">{data.book01_next_story_moves.path}</p>
        </section>
      ) : null}

      <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
        <h2 className="text-sm font-semibold text-stone-300">Top blockers</h2>
        <ul className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-300">
          {data.top_blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
        <h2 className="text-sm font-semibold text-stone-300">Next actions</h2>
        <ul className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-300">
          {data.next_actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-5">
        <h2 className="text-sm font-semibold text-stone-300">Repo links (paths)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.links.map((l) => (
            <li key={l.path}>
              <span className="text-stone-400">{l.label}:</span>{" "}
              <span className="font-mono text-xs text-amber-100/80">{l.path}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-stone-800 pt-6 text-sm text-stone-500">
        <p>
          Return to{" "}
          <Link className="text-amber-200/80 underline-offset-4 hover:underline" href="/read">
            public reading hub
          </Link>{" "}
          or{" "}
          <Link className="text-amber-200/80 underline-offset-4 hover:underline" href="/">
            home
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
