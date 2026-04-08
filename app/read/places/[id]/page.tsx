import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AtmosphereBlock } from "@/components/public/atmosphere-block";
import { ExploreDeeperCard } from "@/components/public/explore-deeper-card";
import {
  getPublicPlaceById,
  getPublicPlaceSymbolicHints,
  placeTypeReaderLabel,
  recordTypeReaderLabel,
} from "@/lib/public-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function atmosphereFromSetting(sp: NonNullable<
  Awaited<ReturnType<typeof getPublicPlaceById>>
>["settingProfile"]): string | null {
  if (!sp) return null;
  const chunks = [
    sp.physicalDescription,
    sp.climateDescription,
    sp.sounds,
    sp.smells,
    sp.textures,
    sp.lightingConditions,
    sp.dominantActivities,
    sp.religiousPresence,
    sp.economicContext,
  ]
    .map((s) => s?.trim())
    .filter(Boolean) as string[];
  return chunks.length ? chunks.join("\n\n") : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const place = await getPublicPlaceById(id);
  if (!place) return { title: "Place — Campti" };
  return {
    title: `${place.name} — Campti`,
    description: place.description ?? undefined,
    openGraph: { title: place.name, description: place.description ?? undefined },
  };
}

export default async function ReadPlaceDetailPage({ params }: Props) {
  const { id } = await params;
  const place = await getPublicPlaceById(id);
  if (!place) notFound();

  const symbolicHints = await getPublicPlaceSymbolicHints(id);

  const atmosphere = atmosphereFromSetting(place.settingProfile);
  const whyItMatters = place.description?.trim() ?? null;

  return (
    <article className="mx-auto max-w-3xl space-y-14 pb-20">
      <Link
        href="/read/places"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-300"
      >
        ← All places
      </Link>

      <header className="border-b border-stone-800 pb-10">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          {placeTypeReaderLabel(place.placeType)}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-stone-100 sm:text-5xl">
          {place.name}
        </h1>
        <p className="mt-4 text-xs text-stone-600">{recordTypeReaderLabel(place.recordType)}</p>
      </header>

      {whyItMatters ? (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Why it matters here
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-stone-400">{whyItMatters}</p>
        </section>
      ) : null}

      {atmosphere ? (
        <AtmosphereBlock title="Atmosphere">
          <div className="whitespace-pre-wrap">{atmosphere}</div>
        </AtmosphereBlock>
      ) : (
        <p className="text-sm italic text-stone-600">
          Sensory and social detail will deepen as the setting is drafted for readers.
        </p>
      )}

      {symbolicHints.length > 0 ? (
        <AtmosphereBlock title="Symbolic weather here">
          <ul className="space-y-3 text-sm leading-relaxed text-stone-400">
            {symbolicHints.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </AtmosphereBlock>
      ) : null}

      {place.persons.length > 0 ? (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            People tied to this ground
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {place.persons.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/read/characters/${p.id}`}
                  className="rounded-full border border-stone-700 px-3 py-1 text-sm text-stone-400 hover:border-amber-900/40 hover:text-stone-200"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {place.scenes.length > 0 ? (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Scenes that breathe here
          </h2>
          <ul className="mt-4 space-y-3">
            {place.scenes.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/read/scenes/${s.id}`}
                  className="text-sm text-stone-300 underline-offset-4 hover:text-amber-100/90 hover:underline"
                >
                  {s.summary?.trim() || s.description.slice(0, 88)}
                </Link>
                <span className="mt-1 block text-xs text-stone-600">{s.chapter.title}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {place.events.length > 0 ? (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Moments in time
          </h2>
          <ul className="mt-4 space-y-4">
            {place.events.map((e) => (
              <li key={e.id} className="text-sm text-stone-400">
                <span className="font-medium text-stone-200">{e.title}</span>
                {(e.startYear != null || e.endYear != null) && (
                  <span className="ml-2 tabular-nums text-stone-600">
                    ({[e.startYear, e.endYear].filter((x) => x != null).join(" — ")})
                  </span>
                )}
                {e.description ? <p className="mt-1 text-stone-500">{e.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ExploreDeeperCard />
    </article>
  );
}
