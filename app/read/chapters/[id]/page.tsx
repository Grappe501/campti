import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExploreDeeperCard } from "@/components/public/explore-deeper-card";
import { getPublicChapterById, getPublicChapterNarrativeHints } from "@/lib/public-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const chapter = await getPublicChapterById(id);
  if (!chapter) return { title: "Chapter — Campti" };
  return {
    title: `${chapter.title} — Campti`,
    description: chapter.summary ?? `Chapter ${chapter.chapterNumber ?? ""}`.trim(),
    openGraph: {
      title: chapter.title,
      description: chapter.summary ?? undefined,
    },
  };
}

export default async function ReadChapterDetailPage({ params }: Props) {
  const { id } = await params;
  const chapter = await getPublicChapterById(id);
  if (!chapter) notFound();

  const narrativeHints = await getPublicChapterNarrativeHints(id);

  const sceneCards = chapter.scenes.map((s) => ({
    ...s,
    cardTitle: s.summary?.trim() || s.description.slice(0, 72) + (s.description.length > 72 ? "…" : ""),
  }));

  return (
    <article className="mx-auto max-w-3xl space-y-12">
      <Link
        href="/read/chapters"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-300"
      >
        ← All chapters
      </Link>

      <header className="border-b border-stone-800 pb-10">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          {chapter.chapterNumber != null ? `Chapter ${chapter.chapterNumber}` : "Chapter"}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-stone-100 sm:text-5xl">
          {chapter.title}
        </h1>
        {chapter.timePeriod ? (
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-stone-500">
            {chapter.timePeriod}
          </p>
        ) : null}
        {chapter.summary ? (
          <p className="mt-8 text-lg leading-relaxed text-stone-400">{chapter.summary}</p>
        ) : null}
        {chapter.publicNotes ? (
          <div className="mt-8 rounded-lg border border-stone-800 bg-stone-900/30 px-5 py-5">
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
              Note to the reader
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-400">{chapter.publicNotes}</p>
          </div>
        ) : null}
      </header>

      {narrativeHints.length > 0 ? (
        <section className="rounded-lg border border-stone-800/80 bg-stone-900/20 px-5 py-5">
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            How this chapter leans
          </h2>
          <p className="mt-2 text-xs text-stone-600">
            Shaped currents—pacing, return, silence—without naming private documents.
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-400">
            {narrativeHints.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {sceneCards.length > 0 ? (
        <section>
          <h2 className="font-serif text-2xl text-stone-100">Scenes</h2>
          <p className="mt-2 text-sm text-stone-500">
            Passages you can enter fully—typography slows, margins widen.
          </p>
          <ul className="mt-8 space-y-4">
            {sceneCards.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/read/scenes/${s.id}`}
                  className="block rounded-lg border border-stone-800 bg-stone-900/20 px-5 py-5 transition hover:border-stone-700 hover:bg-stone-900/40"
                >
                  <span className="text-xs tabular-nums text-stone-600">
                    {s.orderInChapter ?? s.sceneNumber ?? "—"}
                  </span>
                  <p className="mt-2 font-serif text-lg text-stone-200">{s.cardTitle}</p>
                  {s.emotionalTone ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.15em] text-stone-600">
                      {s.emotionalTone}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(chapter.persons.length > 0 ||
        chapter.places.length > 0 ||
        chapter.events.length > 0) && (
        <section className="grid gap-8 sm:grid-cols-2">
          {chapter.persons.length > 0 ? (
            <div>
              <h3 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
                People present
              </h3>
              <ul className="mt-4 space-y-2">
                {chapter.persons.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/read/characters/${p.id}`}
                      className="text-sm text-stone-300 underline-offset-4 hover:text-amber-100/90 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {chapter.places.length > 0 ? (
            <div>
              <h3 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
                Ground
              </h3>
              <ul className="mt-4 space-y-2">
                {chapter.places.map((pl) => (
                  <li key={pl.id}>
                    <Link
                      href={`/read/places/${pl.id}`}
                      className="text-sm text-stone-300 underline-offset-4 hover:text-amber-100/90 hover:underline"
                    >
                      {pl.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {chapter.events.length > 0 ? (
            <div className="sm:col-span-2">
              <h3 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
                Timeline anchors
              </h3>
              <ul className="mt-4 space-y-3">
                {chapter.events.map((e) => (
                  <li key={e.id} className="text-sm text-stone-400">
                    <span className="text-stone-200">{e.title}</span>
                    {(e.startYear != null || e.endYear != null) && (
                      <span className="ml-2 tabular-nums text-stone-600">
                        ({[e.startYear, e.endYear].filter((x) => x != null).join(" — ")})
                      </span>
                    )}
                    {e.description ? (
                      <p className="mt-1 text-stone-500">{e.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      <ExploreDeeperCard />
    </article>
  );
}
