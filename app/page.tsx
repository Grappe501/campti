import Link from "next/link";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { CamptiLandingSplash } from "@/components/public/campti-landing-splash";
import { CharacterSpotlight } from "@/components/public/character-spotlight";
import { PlaceSpotlight } from "@/components/public/place-spotlight";
import { PublicHero } from "@/components/public/public-hero";
import { PublicSiteChrome } from "@/components/public/public-site-chrome";
import { HomeReturnLayer } from "@/components/public/home-return-layer";
import { WorldEntryCard } from "@/components/public/world-entry-card";
import { getPublicHomeData, placeTypeReaderLabel } from "@/lib/public-data";

export const dynamic = "force-dynamic";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-campti-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-campti-sans",
});

export const metadata: Metadata = {
  title: "Campti — A narrative world",
  description:
    "A multi-generational historical story world—read, wander, and feel what waits beneath the page.",
  openGraph: {
    title: "Campti — A narrative world",
    description:
      "Enter a literary historical world built to be read slowly and explored like a house with many rooms.",
    type: "website",
  },
};

export default async function HomePage() {
  const home = await getPublicHomeData();

  return (
    <CamptiLandingSplash>
    <div
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#0f0e0c] font-sans text-stone-200 antialiased`}
      style={{ fontFamily: "var(--font-campti-sans), system-ui, sans-serif" }}
    >
      <PublicSiteChrome />
      <div className="pt-14">
        <PublicHero
          variant="home"
          eyebrow="A living story world"
          title={
            <span className="font-[family-name:var(--font-campti-display),Georgia,serif]">
              Campti
            </span>
          }
          subtitle="Memory, land, and consequence braided across generations—meant to be entered the way you enter weather: slowly, bodily, with attention."
        >
          <Link
            href="/read"
            className="rounded-full bg-stone-100 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-950 transition hover:bg-white"
          >
            Start reading
          </Link>
          <Link
            href="/read/places"
            className="rounded-full border border-stone-600 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
          >
            Explore the world
          </Link>
          <Link
            href="#why"
            className="rounded-full px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-300"
          >
            Why this matters
          </Link>
        </PublicHero>

        <HomeReturnLayer />

        <section
          id="why"
          className="mx-auto max-w-3xl scroll-mt-24 px-6 py-20 sm:px-10 lg:px-16"
        >
          <h2 className="font-[family-name:var(--font-campti-display),Georgia,serif] text-3xl text-stone-100 sm:text-4xl">
            Not a feed. Not a file.
          </h2>
          <p className="mt-8 text-lg leading-relaxed text-stone-400">
            This is a multi-generational historical narrative—rooted in real history, memory,
            symbolism, and lived experience. It is built to be read as story{" "}
            <em className="text-stone-300 not-italic">and</em> explored as world: people who
            persist, ground that holds meaning, time that bends back on itself.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-stone-500">
            What you see today is the first public layer. More rooms will open—quietly, without
            breaking what already breathes.
          </p>
        </section>

        <section className="border-t border-stone-900/80 bg-[#12110f]/50 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-[family-name:var(--font-campti-display),Georgia,serif] text-3xl text-stone-100 sm:text-4xl">
              Three ways in
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-sm text-stone-500">
              You do not have to choose once. The paths return to each other.
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <WorldEntryCard
                href="/read"
                title="Read the story"
                description="Chapters and scenes set for a hushed, cinematic page."
                meta="Narrative"
              />
              <WorldEntryCard
                href="/read/characters"
                title="Explore the world"
                description="People, places, time, and the images that keep returning."
                meta="Atlas"
              />
              <WorldEntryCard
                href="/read"
                title="Listen / experience"
                description="Sound and immersion are being composed beside the text—not bolted on."
                meta="Soon"
                footer={
                  <p className="text-xs text-stone-600">
                    Placeholders now; playback when the work is worthy of your ear.
                  </p>
                }
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl space-y-10 px-6 py-20 sm:px-10 lg:px-16">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-campti-display),Georgia,serif] text-3xl text-stone-100">
              Thresholds
            </h2>
            <p className="mt-3 text-sm text-stone-500">
              A few doors left ajar tonight.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {home.featuredChapter ? (
              <WorldEntryCard
                href={`/read/chapters/${home.featuredChapter.id}`}
                title={
                  home.featuredChapter.chapterNumber != null
                    ? `Chapter ${home.featuredChapter.chapterNumber}`
                    : home.featuredChapter.title
                }
                description={
                  home.featuredChapter.summary ??
                  "Step into the first public stretch of the manuscript."
                }
                meta="Chapter"
              />
            ) : (
              <div className="rounded-lg border border-dashed border-stone-800 p-6 text-sm text-stone-600">
                The first chapter will appear here when it is shared with readers.
              </div>
            )}
            {home.featuredCharacter ? (
              <CharacterSpotlight
                id={home.featuredCharacter.id}
                name={home.featuredCharacter.name}
                descriptor={home.featuredCharacter.description}
                line={home.featuredCharacter.hook}
                roleHint="Figure"
              />
            ) : (
              <div className="rounded-lg border border-dashed border-stone-800 p-6 text-sm text-stone-600">
                A featured portrait will appear when a public figure is ready.
              </div>
            )}
            {home.featuredPlace ? (
              <PlaceSpotlight
                id={home.featuredPlace.id}
                name={home.featuredPlace.name}
                placeTypeLabel={placeTypeReaderLabel(home.featuredPlace.placeType)}
                description={home.featuredPlace.description}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-stone-800 p-6 text-sm text-stone-600">
                A place card will surface when the atlas opens.
              </div>
            )}
            {home.featuredSymbol ? (
              <Link
                href={`/read/symbols#${home.featuredSymbol.id}`}
                className="group flex flex-col rounded-lg border border-stone-800 bg-stone-900/30 p-6 transition hover:border-amber-900/35"
              >
                <span className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-stone-500">
                  {home.featuredSymbol.category
                    ? String(home.featuredSymbol.category).replaceAll("_", " ")
                    : "Symbolism"}
                </span>
                <span className="mt-2 font-[family-name:var(--font-campti-display),Georgia,serif] text-2xl text-stone-100 group-hover:text-amber-50/95">
                  {home.featuredSymbol.name}
                </span>
                {home.featuredSymbol.meaning ? (
                  <p className="mt-3 line-clamp-3 text-sm text-stone-400">
                    {home.featuredSymbol.meaning}
                  </p>
                ) : null}
                <span className="mt-4 text-xs text-amber-200/50">Follow the motif →</span>
              </Link>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-800 p-6 text-sm text-stone-600">
                A recurring image will anchor this grid when symbolism is public.
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-stone-900/80 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-2xl rounded-lg border border-amber-900/20 bg-amber-950/10 px-8 py-12 text-center">
            <h2 className="font-[family-name:var(--font-campti-display),Georgia,serif] text-3xl text-amber-50/95">
              There is more beneath the page
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-stone-400">
              A free layer lets you read and wander. A deeper layer will open richer interiors,
              fuller timelines, layered symbolism, and immersive scene experiences—without
              turning this into noise.
            </p>
            <Link
              href="/membership"
              className="mt-8 inline-flex rounded-full border border-amber-800/40 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-amber-200/80 transition hover:border-amber-700/60 hover:text-amber-50"
            >
              Depth & membership
            </Link>
          </div>
        </section>

        <footer className="border-t border-stone-900 px-6 py-10 text-center text-xs text-stone-600">
          <p>Campti — a narrative world in motion.</p>
        </footer>
      </div>
    </div>
    </CamptiLandingSplash>
  );
}
