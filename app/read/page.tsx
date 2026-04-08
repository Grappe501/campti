import Link from "next/link";
import { ContinueReadingBanner } from "@/components/public/continue-reading-banner";
import { ReturnExperienceCard } from "@/components/public/return-experience-card";
import { WorldEntryCard } from "@/components/public/world-entry-card";
import { AudioTeaser } from "@/components/public/audio-teaser";
import { getCamptiSessionId } from "@/lib/campti-session";
import { getPublicReadHubData, getPublicReturnExperience } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ReadHubPage() {
  const hub = await getPublicReadHubData();
  const sessionId = await getCamptiSessionId();
  const returnExperience = await getPublicReturnExperience(sessionId);

  return (
    <div className="mx-auto max-w-5xl space-y-16">
      <header className="max-w-2xl">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          The reading room
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-stone-100 sm:text-5xl">
          You have crossed the threshold.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-400">
          Move as you would in a house: along the spine of chapters, into rooms held by
          people and places, or drift through time when you need bearing. Nothing here
          hurries you.
        </p>
      </header>

      {returnExperience ? (
        <ReturnExperienceCard experience={returnExperience} />
      ) : (
        <ContinueReadingBanner />
      )}

      {(hub.featuredChapter || hub.featuredScene) && (
        <section className="rounded-lg border border-stone-800 bg-stone-900/25 p-8 sm:p-10">
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-stone-500">
            Where the light falls first
          </p>
          {hub.featuredChapter ? (
            <>
              <h2 className="mt-3 font-serif text-3xl text-stone-100">
                <Link
                  href={`/read/chapters/${hub.featuredChapter.id}`}
                  className="transition hover:text-amber-50/90"
                >
                  {hub.featuredChapter.chapterNumber != null
                    ? `Chapter ${hub.featuredChapter.chapterNumber}: ${hub.featuredChapter.title}`
                    : hub.featuredChapter.title}
                </Link>
              </h2>
              {hub.featuredChapter.summary ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-400">
                  {hub.featuredChapter.summary}
                </p>
              ) : null}
            </>
          ) : null}
          {hub.featuredScene ? (
            <div className="mt-8 border-t border-stone-800 pt-8">
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-stone-500">
                A scene at hand
              </p>
              <Link
                href={`/read/scenes/${hub.featuredScene.id}`}
                className="mt-2 block font-serif text-xl text-amber-100/90 transition hover:text-amber-50"
              >
                Open the passage
              </Link>
              <p className="mt-2 text-sm text-stone-500">
                From {hub.featuredScene.chapterTitle}
              </p>
              {(hub.featuredScene.summary || hub.featuredScene.description) && (
                <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-stone-400">
                  {hub.featuredScene.summary ?? hub.featuredScene.description}
                </p>
              )}
            </div>
          ) : null}
        </section>
      )}

      <section>
        <h2 className="font-serif text-2xl text-stone-100">Ways through</h2>
        <p className="mt-2 max-w-xl text-sm text-stone-500">
          Each path returns you to the same world from a different angle.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <WorldEntryCard
            href="/read/chapters"
            title="Read the story"
            description="Chapters in order, with scenes you can open like doors."
            meta={`${hub.counts.chapters} chapters`}
          />
          <WorldEntryCard
            href="/read/characters"
            title="Know the people"
            description="Figures who carry memory, desire, and consequence."
            meta={`${hub.counts.characters} people`}
          />
          <WorldEntryCard
            href="/read/places"
            title="Walk the ground"
            description="Locations that hold weather, ritual, and silence."
            meta={`${hub.counts.places} places`}
          />
          <WorldEntryCard
            href="/read/timeline"
            title="Feel the years"
            description={
              hub.timelineSpan
                ? `Roughly ${hub.timelineSpan.from} to ${hub.timelineSpan.to}, as the record allows.`
                : "Anchors in time, when the record offers them."
            }
            meta="Timeline"
          />
        </div>
      </section>

      <AudioTeaser
        label="Listen to this world"
        sublabel="Voiced scenes and character tones will arrive as the sound design matures."
      />
    </div>
  );
}
