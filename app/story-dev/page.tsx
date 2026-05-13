import path from "node:path";
import fs from "node:fs";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Story dev dashboard — Campti",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type GateRow = { gate: string; status: string; notes?: string };

type SymbolRow = { name: string; book01_job: string; density?: string };

type ArcRow = { name: string; book01_touch: string; status?: string };

type PlotRow = { thread: string; spine_or_units: string; key_docs: string };

type ProseReviewRow = {
  title: string;
  role: string;
  status: string;
  path: string;
  gate_path?: string;
};

type SpineUnit = { id: string; third: string; one_line: string };

type StoryDevDashboard = {
  current_focus: string;
  updated: string;
  build_lens?: {
    epic_label: string;
    book_label: string;
    one_paragraph: string;
    native_only_note: string;
    great_raft_note: string;
  };
  movements_thirds?: { third: string; focus: string; anchor?: string }[];
  symbols_detailed?: SymbolRow[];
  arcs_detailed?: ArcRow[];
  plot_tracks?: PlotRow[];
  prose_review_queue?: ProseReviewRow[];
  spine_fifteen?: { readme: string; units: SpineUnit[] };
  post_fill_gate?: GateRow[];
  alignment_sweep?: { id: string; status: string; path: string };
  story_dev_lane?: { route: string; status: string; source_spec: string };
  epic_symbol_map?: { status: string; path: string; index?: string };
  epic_arc_braid?: { status: string; path: string; index?: string };
  language_doctrine?: { status: string; path: string; index?: string };
  epic_war_conflict_engine?: {
    status: string;
    path: string;
    timeline?: string;
    doctrine?: string;
    research_queue?: string;
  };
  literary_control?: Record<string, string>;
  symbol_series_seeds?: Record<string, string>;
  epic: { score: number; bar?: string; status: string; summary: string };
  book01: { score: number; bar?: string; status: string; summary: string };
  chapter_candidates?: {
    count: number;
    status: string;
    path: string;
    refinement_pass_01?: string;
    recommendation_summary?: string;
  };
  prose: {
    tonal_model: string;
    tonal_model_path?: string;
    sample_002_status: string;
    sample_002_path?: string;
    sample_002_revA_path?: string;
    sample_002_archive_path?: string;
    sample_001_revA_archive_note?: string;
  };
  character_packets?: { status: string; path: string };
  symbol_braid?: {
    status: string;
    path: string;
    series_symbols_path?: string;
    chapter_symbol_plan?: string;
  };
  sassafras_gumbo_research?: { status: string; path: string };
  book01_next_story_moves?: { path: string };
  top_active_symbols?: string[];
  top_active_arcs?: string[];
  symbolic_blockers?: string[];
  top_blockers: string[];
  next_actions: string[];
  links: { label: string; path: string }[];
  chapter_folder_readiness_gate?: {
    status: string;
    readme: string;
    where_to_review: string;
    next_human_action: string;
  };
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-700/90 bg-zinc-900/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
      <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm leading-relaxed text-zinc-400">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function StoryDevPage() {
  const data = loadDashboard();
  const lens = data.build_lens;
  const spine = data.spine_fifteen;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 pb-16">
      <header className="space-y-4 border-b border-zinc-700 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Non-production · author / producer lane
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Story development dashboard
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-zinc-200">
          One screen for what the Red River / Book 01 lane is building: <strong className="text-white">symbols</strong>,{" "}
          <strong className="text-white">arcs</strong>, <strong className="text-white">plot pressure</strong>,{" "}
          <strong className="text-white">prose in review</strong>, and the <strong className="text-white">15-unit spine</strong>{" "}
          (still not <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-amber-200/95">ch_###</code> folders).
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
          <span className="rounded-md border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 font-medium text-white">
            Updated {data.updated}
          </span>
          <span className="rounded-md border border-zinc-600 bg-zinc-800/80 px-3 py-1.5">
            Current focus: <span className="text-amber-200/95">{data.current_focus}</span>
          </span>
        </div>
      </header>

      {data.chapter_folder_readiness_gate ? (
        <Section
          title="Chapter folder readiness gate (repo)"
          subtitle={data.chapter_folder_readiness_gate.next_human_action}
        >
          <p className="text-sm text-zinc-300">
            Status: <span className="font-medium text-amber-200/95">{data.chapter_folder_readiness_gate.status}</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-200">
            Fill human tables in the repo (not only on this page). Start with the <strong className="text-white">where-to-review map</strong>, then spine + RevA + folder-name tables.
          </p>
          <ul className="mt-4 space-y-2 font-mono text-[11px] leading-relaxed text-amber-200/90 break-all">
            <li>
              <span className="text-zinc-500">README:</span> {data.chapter_folder_readiness_gate.readme}
            </li>
            <li>
              <span className="text-zinc-500">Review map:</span> {data.chapter_folder_readiness_gate.where_to_review}
            </li>
          </ul>
        </Section>
      ) : null}

      {lens ? (
        <Section title="What we are building" subtitle="Epic + Book 01 contract (PROPOSED — not canon until promoted).">
          <p className="text-base leading-relaxed text-zinc-100">{lens.one_paragraph}</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-200">
            <li>
              <span className="font-medium text-white">Epic:</span> {lens.epic_label}
            </li>
            <li>
              <span className="font-medium text-white">Book:</span> {lens.book_label}
            </li>
            <li>
              <span className="font-medium text-white">Native-only (Book 01):</span> {lens.native_only_note}
            </li>
            <li>
              <span className="font-medium text-white">Great Raft:</span> {lens.great_raft_note}
            </li>
          </ul>
        </Section>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-700/90 bg-zinc-900/90 p-6">
          <h2 className="text-lg font-semibold text-white">Epic progress</h2>
          <p className="mt-2 font-mono text-xl text-amber-300">{data.epic.bar ?? ""}</p>
          <p className="mt-1 text-sm text-zinc-300">
            <span className="font-medium text-white">{data.epic.score}%</span> — {data.epic.status}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-200">{data.epic.summary}</p>
        </div>
        <div className="rounded-xl border border-zinc-700/90 bg-zinc-900/90 p-6">
          <h2 className="text-lg font-semibold text-white">Book 01 progress</h2>
          <p className="mt-2 font-mono text-xl text-amber-300">{data.book01.bar ?? ""}</p>
          <p className="mt-1 text-sm text-zinc-300">
            <span className="font-medium text-white">{data.book01.score}%</span> — {data.book01.status}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-200">{data.book01.summary}</p>
        </div>
      </section>

      {data.movements_thirds?.length ? (
        <Section title="Three-thirds spine (movement shape)" subtitle="How Third I / II / III divide Book 01 before raid.">
          <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {data.movements_thirds.map((m) => (
              <li key={m.third} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <span className="font-medium text-amber-200/95">{m.third}</span>
                <span className="max-w-2xl text-sm text-zinc-200">{m.focus}</span>
                {m.anchor ? (
                  <span className="text-xs text-zinc-500 sm:text-right">{m.anchor}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {data.symbols_detailed?.length ? (
        <Section
          title="Symbols (Book 01 + series)"
          subtitle="What images and motifs are doing work right now — not a full symbol index."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 font-semibold">Symbol</th>
                  <th className="px-4 py-3 font-semibold">Book 01 job</th>
                  <th className="px-4 py-3 font-semibold">Density / note</th>
                </tr>
              </thead>
              <tbody>
                {data.symbols_detailed.map((row) => (
                  <tr key={row.name} className="border-b border-zinc-800/90 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.book01_job}</td>
                    <td className="px-4 py-3 text-zinc-400">{row.density ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.top_active_symbols?.length ? (
            <p className="mt-3 text-xs text-zinc-500">
              Quick list: {data.top_active_symbols.join(" · ")}
            </p>
          ) : null}
        </Section>
      ) : null}

      {data.arcs_detailed?.length ? (
        <Section title="Working arcs (series-level)" subtitle="Braid threads that touch Book 01 even when payoff is later.">
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 font-semibold">Arc</th>
                  <th className="px-4 py-3 font-semibold">Book 01 touch</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.arcs_detailed.map((row) => (
                  <tr key={row.name} className="border-b border-zinc-800/90 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                    <td className="px-4 py-3 text-zinc-200">{row.book01_touch}</td>
                    <td className="px-4 py-3 text-zinc-400">{row.status ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.top_active_arcs?.length ? (
            <p className="mt-3 text-xs text-zinc-500">Active arc labels: {data.top_active_arcs.join(" · ")}</p>
          ) : null}
        </Section>
      ) : null}

      {data.plot_tracks?.length ? (
        <Section
          title="Plot / pressure tracks (Book 01)"
          subtitle="Visible story machinery — binding, trade face, provider interface, rupture."
        >
          <ul className="space-y-3">
            {data.plot_tracks.map((p) => (
              <li
                key={p.thread}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-200"
              >
                <p className="font-medium text-white">{p.thread}</p>
                <p className="mt-1 text-zinc-300">
                  <span className="text-zinc-500">Spine / units:</span> {p.spine_or_units}
                </p>
                <p className="mt-1 font-mono text-xs text-amber-200/90">{p.key_docs}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {data.prose_review_queue?.length ? (
        <Section
          title="Prose written for review (draft lab)"
          subtitle="Controlled samples — not final chapters. Gates live beside each line."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 font-semibold">Piece</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Gate / review</th>
                </tr>
              </thead>
              <tbody>
                {data.prose_review_queue.map((row) => (
                  <tr key={row.title} className="border-b border-zinc-800/90 last:border-0">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-white">{row.title}</div>
                      <div className="mt-1 font-mono text-[11px] leading-snug text-zinc-500 break-all">{row.path}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-200">{row.role}</td>
                    <td className="px-4 py-3 align-top text-amber-200/95">{row.status}</td>
                    <td className="px-4 py-3 align-top font-mono text-[11px] text-zinc-400 break-all">
                      {row.gate_path ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Tonal model decision:{" "}
            <span className="font-mono text-zinc-400">
              writing/03_epics/epic_02_red_river_matrilineage/books/book_01_world_before_disruption/draft_lab/prose_sample_001_tonal_model_decision.md
            </span>
          </p>
        </Section>
      ) : null}

      {spine?.units?.length ? (
        <Section
          title="15-unit chapter spine (PROPOSED)"
          subtitle="Merge plan from 22 candidates — no final ch folders until human + Post-Fill Gate."
        >
          <p className="text-sm text-zinc-300">
            Full table + dependency overlay:{" "}
            <span className="font-mono text-xs text-amber-200/90">{spine.readme}</span>
          </p>
          {data.chapter_candidates?.refinement_pass_01 ? (
            <p className="mt-1 font-mono text-xs text-zinc-500">{data.chapter_candidates.refinement_pass_01}</p>
          ) : null}
          <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-zinc-700 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Unit</th>
                  <th className="px-3 py-2 font-semibold">Third</th>
                  <th className="px-3 py-2 font-semibold">One-line job</th>
                </tr>
              </thead>
              <tbody>
                {spine.units.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-800/80 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-medium text-amber-200/95">
                      {u.id}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-400">{u.third}</td>
                    <td className="px-3 py-2 text-zinc-200">{u.one_line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {data.post_fill_gate?.length ? (
        <Section title="Post–fill gate (before ch_### folders)" subtitle="From refinement recommendation — all OPEN until human closes.">
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3 font-semibold">Gate</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.post_fill_gate.map((g) => (
                  <tr key={g.gate} className="border-b border-zinc-800/90 last:border-0">
                    <td className="px-4 py-3 text-zinc-100">{g.gate}</td>
                    <td className="px-4 py-3 font-medium text-amber-200/95">{g.status}</td>
                    <td className="px-4 py-3 text-zinc-400">{g.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {data.alignment_sweep ? (
        <Section title="Alignment sweep" subtitle="Cross-repo consistency work.">
          <p className="text-sm text-zinc-200">
            <span className="font-medium text-white">{data.alignment_sweep.id}</span> — {data.alignment_sweep.status}
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-500">{data.alignment_sweep.path}</p>
        </Section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        {data.epic_symbol_map ? (
          <div className="rounded-xl border border-zinc-700/90 bg-zinc-900/90 p-5">
            <h2 className="text-base font-semibold text-white">Epic symbol map</h2>
            <p className="mt-2 text-sm text-zinc-300">{data.epic_symbol_map.status}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{data.epic_symbol_map.path}</p>
            {data.epic_symbol_map.index ? (
              <p className="mt-2 font-mono text-[11px] text-amber-200/90">{data.epic_symbol_map.index}</p>
            ) : null}
          </div>
        ) : null}
        {data.epic_arc_braid ? (
          <div className="rounded-xl border border-zinc-700/90 bg-zinc-900/90 p-5">
            <h2 className="text-base font-semibold text-white">Epic arc braid</h2>
            <p className="mt-2 text-sm text-zinc-300">{data.epic_arc_braid.status}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{data.epic_arc_braid.path}</p>
            {data.epic_arc_braid.index ? (
              <p className="mt-2 font-mono text-[11px] text-amber-200/90">{data.epic_arc_braid.index}</p>
            ) : null}
          </div>
        ) : null}
        {data.language_doctrine ? (
          <div className="rounded-xl border border-zinc-700/90 bg-zinc-900/90 p-5">
            <h2 className="text-base font-semibold text-white">Language doctrine</h2>
            <p className="mt-2 text-sm text-zinc-300">{data.language_doctrine.status}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{data.language_doctrine.path}</p>
            {data.language_doctrine.index ? (
              <p className="mt-2 font-mono text-[11px] text-amber-200/90">{data.language_doctrine.index}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {data.epic_war_conflict_engine ? (
        <Section title="War / conflict engine (series)" subtitle="Timeline + doctrine — do not dramatize unsourced battles.">
          <p className="text-sm text-zinc-300">{data.epic_war_conflict_engine.status}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">{data.epic_war_conflict_engine.path}</p>
          <ul className="mt-3 space-y-1 font-mono text-[11px] text-amber-200/90">
            {data.epic_war_conflict_engine.timeline ? <li>{data.epic_war_conflict_engine.timeline}</li> : null}
            {data.epic_war_conflict_engine.doctrine ? <li>{data.epic_war_conflict_engine.doctrine}</li> : null}
            {data.epic_war_conflict_engine.research_queue ? <li>{data.epic_war_conflict_engine.research_queue}</li> : null}
          </ul>
        </Section>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2">
        {data.character_packets ? (
          <div className="rounded-xl border border-zinc-700/90 bg-zinc-900/90 p-5">
            <h2 className="text-base font-semibold text-white">Character packets</h2>
            <p className="mt-2 text-sm text-zinc-300">{data.character_packets.status}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{data.character_packets.path}</p>
          </div>
        ) : null}
        {data.symbol_braid ? (
          <div className="rounded-xl border border-zinc-700/90 bg-zinc-900/90 p-5">
            <h2 className="text-base font-semibold text-white">Book 01 symbol braid</h2>
            <p className="mt-2 text-sm text-zinc-300">{data.symbol_braid.status}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{data.symbol_braid.path}</p>
            {data.symbol_braid.chapter_symbol_plan ? (
              <p className="mt-2 font-mono text-[11px] text-amber-200/90">{data.symbol_braid.chapter_symbol_plan}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      {data.chapter_candidates ? (
        <Section title="Chapter candidates" subtitle="V0 pool feeding the 15-unit spine.">
          <p className="text-sm text-zinc-200">
            <span className="font-medium text-white">{data.chapter_candidates.count}</span> candidates —{" "}
            {data.chapter_candidates.status}
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-500">{data.chapter_candidates.path}</p>
          {data.chapter_candidates.recommendation_summary ? (
            <p className="mt-2 font-mono text-xs text-amber-200/90">{data.chapter_candidates.recommendation_summary}</p>
          ) : null}
        </Section>
      ) : null}

      <Section title="Top blockers" subtitle="Production dashboard mirror — tackle in order with research + human gates.">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-200">
          {data.top_blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ol>
      </Section>

      {data.symbolic_blockers?.length ? (
        <Section title="Symbolic / craft guardrails" subtitle="Operator discipline — not story spoilers.">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-200">
            {data.symbolic_blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ol>
        </Section>
      ) : null}

      <Section title="Next actions" subtitle="Synced from story_dev_dashboard.json — edit JSON to change this list.">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-200">
          {data.next_actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </Section>

      <Section title="Repo paths (deep links)" subtitle="Open in IDE from clone root.">
        <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
          {data.links.map((l) => (
            <li key={l.path} className="border-b border-zinc-800/80 pb-2 last:border-0">
              <span className="text-zinc-400">{l.label}</span>
              <div className="mt-0.5 font-mono text-[11px] text-amber-200/85 break-all">{l.path}</div>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="border-t border-zinc-700 pt-8 text-sm text-zinc-400">
        <p>
          <Link className="font-medium text-amber-300 underline-offset-4 hover:underline" href="/read">
            Public reading hub
          </Link>
          {" · "}
          <Link className="font-medium text-amber-300 underline-offset-4 hover:underline" href="/">
            Home
          </Link>
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Spec: <span className="font-mono">story_dev_dashboard/README.md</span> · Data:{" "}
          <span className="font-mono">writing/04_production_dashboard/progress_system/data/story_dev_dashboard.json</span>
        </p>
      </footer>
    </div>
  );
}
