import Link from "next/link";
import type { PublicTimelineEra } from "@/lib/public-data";

type TimelineSectionProps = {
  eras: PublicTimelineEra[];
};

export function TimelineSection({ eras }: TimelineSectionProps) {
  if (!eras.length) return null;
  return (
    <div className="relative mx-auto max-w-3xl">
      <div
        className="absolute left-[0.65rem] top-2 bottom-2 w-px bg-gradient-to-b from-amber-900/30 via-stone-700/50 to-transparent sm:left-3"
        aria-hidden
      />
      <ul className="space-y-14">
        {eras.map((era) => (
          <li key={era.label} className="relative pl-10 sm:pl-14">
            <span className="absolute left-0 top-1.5 flex h-3 w-3 items-center justify-center sm:left-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-700/80 ring-4 ring-stone-950" />
            </span>
            <h3 className="font-serif text-2xl text-stone-100">{era.label}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
              {era.startYear} — {era.endYear}
            </p>
            <ul className="mt-6 space-y-8">
              {era.events.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-lg border border-stone-800/80 bg-stone-900/25 p-5"
                >
                  <h4 className="font-medium text-stone-200">{ev.title}</h4>
                  {(ev.startYear != null || ev.endYear != null) && (
                    <p className="mt-1 text-xs text-stone-500 tabular-nums">
                      {[ev.startYear, ev.endYear].filter((x) => x != null).join(" — ")}
                    </p>
                  )}
                  {ev.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-stone-400">
                      {ev.description}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {ev.chapters.map((c) => (
                      <Link
                        key={c.id}
                        href={`/read/chapters/${c.id}`}
                        className="rounded-full border border-stone-700/60 px-2.5 py-1 text-stone-400 transition hover:border-amber-900/40 hover:text-stone-200"
                      >
                        {c.title}
                      </Link>
                    ))}
                    {ev.people.map((p) => (
                      <Link
                        key={p.id}
                        href={`/read/characters/${p.id}`}
                        className="rounded-full border border-stone-700/60 px-2.5 py-1 text-stone-400 transition hover:border-amber-900/40 hover:text-stone-200"
                      >
                        {p.name}
                      </Link>
                    ))}
                    {ev.places.map((pl) => (
                      <Link
                        key={pl.id}
                        href={`/read/places/${pl.id}`}
                        className="rounded-full border border-stone-700/60 px-2.5 py-1 text-stone-400 transition hover:border-amber-900/40 hover:text-stone-200"
                      >
                        {pl.name}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
