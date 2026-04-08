import Link from "next/link";
import type { Metadata } from "next";
import { getPublicChapterIndex } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chapters — Campti",
  description: "Chapter index for the public reading experience.",
};

export default async function ReadChaptersPage() {
  const chapters = await getPublicChapterIndex();

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          The spine
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-stone-100">
          Chapters
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
          Each block is a stretch of intention—summary first, then the scenes inside when you
          are ready to lean closer.
        </p>
      </header>

      {chapters.length === 0 ? (
        <p className="text-sm text-stone-500">
          The first public chapters are not yet on the shelf. When they are marked for
          readers, they will appear here.
        </p>
      ) : (
        <ol className="space-y-10">
          {chapters.map((c, idx) => (
            <li
              key={c.id}
              className="group relative border-b border-stone-800/90 pb-10 last:border-0 last:pb-0"
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-xs tabular-nums text-stone-600">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <Link
                  href={`/read/chapters/${c.id}`}
                  className="font-serif text-2xl text-stone-100 transition group-hover:text-amber-50/95"
                >
                  {c.chapterNumber != null ? `Chapter ${c.chapterNumber}` : "Chapter"}:{" "}
                  {c.title}
                </Link>
              </div>
              {c.timePeriod ? (
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-600">
                  {c.timePeriod}
                </p>
              ) : null}
              {c.summary ? (
                <p className="mt-4 text-sm leading-relaxed text-stone-400">{c.summary}</p>
              ) : null}
              {c.historicalAnchor ? (
                <p className="mt-3 border-l border-amber-900/30 pl-4 text-sm italic text-stone-500">
                  {c.historicalAnchor}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
