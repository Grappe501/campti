import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AtmosphereBlock } from "@/components/public/atmosphere-block";
import { CharacterFollowButton } from "@/components/public/character-follow-button";
import { CharacterVoiceSection } from "@/components/public/character-voice-section";
import { ExploreDeeperCard } from "@/components/public/explore-deeper-card";
import { PremiumDepthGate } from "@/components/public/premium-depth-gate";
import {
  getPublicCharacterById,
  recordTypeReaderLabel,
} from "@/lib/public-data";
import { profileJsonFieldToString } from "@/lib/profile-json";
import { VisibilityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function mergeFields(
  parts: (string | null | undefined | unknown)[],
  max = 8,
): string | null {
  const t = parts
    .map((x) => {
      if (x == null) return "";
      if (typeof x === "string") return x.trim();
      return profileJsonFieldToString(x).trim();
    })
    .filter(Boolean) as string[];
  if (!t.length) return null;
  return t.slice(0, max).join("\n\n");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const person = await getPublicCharacterById(id);
  if (!person) return { title: "Person — Campti" };
  return {
    title: `${person.name} — Campti`,
    description: person.description ?? undefined,
    openGraph: { title: person.name, description: person.description ?? undefined },
  };
}

export default async function ReadCharacterDetailPage({ params }: Props) {
  const { id } = await params;
  const person = await getPublicCharacterById(id);
  if (!person) notFound();

  const cp = person.characterProfile;
  const personalityProfile = cp
    ? mergeFields([
        cp.worldview,
        cp.coreBeliefs,
        cp.behavioralPatterns,
        cp.relationalStyle,
        cp.conflictStyle,
        cp.moralFramework,
        cp.speechPatterns,
      ])
    : null;

  const innerNature = cp
    ? mergeFields([
        cp.desires,
        cp.fears,
        cp.internalConflicts,
        cp.contradictions,
        cp.emotionalBaseline,
        cp.memoryBias,
        cp.sensoryBias,
        cp.griefPattern,
        cp.shameTrigger,
      ])
    : null;

  const movesThroughWorld = cp
    ? mergeFields([cp.behavioralPatterns, cp.socialPosition, cp.attentionBias])
    : null;
  const protectsFirst = cp
    ? mergeFields([cp.coreBeliefs, cp.moralFramework, cp.controlPattern])
    : null;
  const destabilizes = cp
    ? mergeFields([cp.stressPattern, cp.shameTrigger, cp.coreFear])
    : null;
  const silenceMeans = cp
    ? mergeFields([cp.speechPatterns, cp.griefPattern, cp.defensiveStyle])
    : null;
  const relationshipsBend = cp ? mergeFields([cp.relationalStyle, cp.conflictStyle, cp.attachmentPattern]) : null;

  type DynRow = {
    id: string;
    otherId: string;
    otherName: string;
    text: string;
  };

  const dynamics: DynRow[] = [];

  for (const r of person.relationshipsAsA) {
    if (r.personB.visibility !== VisibilityStatus.PUBLIC) continue;
    const text =
      r.generatedDynamicSummary?.trim() ||
      r.relationshipSummary?.trim() ||
      mergeFields([
        r.emotionalPattern,
        r.conflictPattern,
        r.attachmentPattern,
        r.powerDynamic,
      ]) ||
      r.relationshipType;
    if (!text) continue;
    dynamics.push({
      id: r.id,
      otherId: r.personB.id,
      otherName: r.personB.name,
      text,
    });
  }
  for (const r of person.relationshipsAsB) {
    if (r.personA.visibility !== VisibilityStatus.PUBLIC) continue;
    const text =
      r.generatedDynamicSummary?.trim() ||
      r.relationshipSummary?.trim() ||
      mergeFields([
        r.emotionalPattern,
        r.conflictPattern,
        r.attachmentPattern,
        r.powerDynamic,
      ]) ||
      r.relationshipType;
    if (!text) continue;
    dynamics.push({
      id: r.id,
      otherId: r.personA.id,
      otherName: r.personA.name,
      text,
    });
  }

  const monogram = person.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <article className="mx-auto max-w-3xl space-y-14 pb-20">
      <Link
        href="/read/characters"
        className="text-xs uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-300"
      >
        ← All people
      </Link>

      <header className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <div
          className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-stone-700 bg-stone-900/50 font-serif text-2xl tracking-tight text-amber-100/80"
          aria-hidden
        >
          {monogram}
        </div>
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
            {recordTypeReaderLabel(person.recordType)}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight text-stone-100 sm:text-5xl">
            {person.name}
          </h1>
          {(person.birthYear != null || person.deathYear != null) && (
            <p className="mt-4 text-xs tabular-nums text-stone-500">
              {[person.birthYear, person.deathYear].map((y) => y ?? "—").join(" — ")}
            </p>
          )}
          {person.description ? (
            <p className="mt-6 text-lg leading-relaxed text-stone-400">{person.description}</p>
          ) : (
            <p className="mt-6 text-sm italic text-stone-600">
              A fuller public biography is still being shaped.
            </p>
          )}
          <div className="mt-8">
            <CharacterFollowButton
              personId={person.id}
              shortName={person.name.split(/\s+/)[0] ?? person.name}
            />
          </div>
        </div>
      </header>

      {cp ? (
        <section className="space-y-3">
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Stay with this person
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-400">
            {cp.coreLonging?.trim() ||
              profileJsonFieldToString(cp.desires) ||
              "The page can hold them longer than a single visit—return when you are ready to listen closer."}
          </p>
          {person.scenes[0] ? (
            <Link
              href={`/read/scenes/${person.scenes[0].id}`}
              className="inline-block text-sm text-amber-200/75 underline-offset-4 transition hover:text-amber-50 hover:underline"
            >
              Step back into a scene →
            </Link>
          ) : null}
        </section>
      ) : null}

      {(personalityProfile || innerNature) && (
        <div className="space-y-6">
          {personalityProfile ? (
            <AtmosphereBlock title="Personality profile">
              <p className="whitespace-pre-wrap text-stone-400">{personalityProfile}</p>
            </AtmosphereBlock>
          ) : null}
          {innerNature ? (
            <AtmosphereBlock title="Inner nature">
              <p className="whitespace-pre-wrap text-stone-400">{innerNature}</p>
            </AtmosphereBlock>
          ) : null}
        </div>
      )}

      {(movesThroughWorld || protectsFirst || relationshipsBend) && (
        <div className="space-y-6">
          {movesThroughWorld ? (
            <AtmosphereBlock title="How they move through the world">
              <p className="whitespace-pre-wrap text-stone-400">{movesThroughWorld}</p>
            </AtmosphereBlock>
          ) : null}
          {protectsFirst ? (
            <AtmosphereBlock title="What they protect first">
              <p className="whitespace-pre-wrap text-stone-400">{protectsFirst}</p>
            </AtmosphereBlock>
          ) : null}
          {relationshipsBend ? (
            <AtmosphereBlock title="How relationships bend them">
              <p className="whitespace-pre-wrap text-stone-400">{relationshipsBend}</p>
            </AtmosphereBlock>
          ) : null}
        </div>
      )}

      {dynamics.length > 0 ? (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Relationship dynamics
          </h2>
          <ul className="mt-6 space-y-6">
            {dynamics.map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-stone-800 bg-stone-900/25 px-5 py-5"
              >
                <Link
                  href={`/read/characters/${d.otherId}`}
                  className="font-medium text-stone-200 hover:text-amber-100/90 hover:underline"
                >
                  With {d.otherName}
                </Link>
                <p className="mt-2 text-xs italic text-stone-600">
                  How closeness bends—what pulls, what resists, what is never quite said.
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-400">
                  {d.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {person.scenes.length > 0 ? (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Appears in
          </h2>
          <ul className="mt-4 space-y-3">
            {person.scenes.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/read/scenes/${s.id}`}
                  className="text-sm text-stone-300 underline-offset-4 hover:text-amber-100/90 hover:underline"
                >
                  {s.summary?.trim() || s.description.slice(0, 80)}
                </Link>
                <span className="mt-1 block text-xs text-stone-600">
                  {s.chapter.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {person.places.length > 0 ? (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Places tied to them
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {person.places.map((pl) => (
              <li key={pl.id}>
                <Link
                  href={`/read/places/${pl.id}`}
                  className="rounded-full border border-stone-700 px-3 py-1 text-sm text-stone-400 hover:border-amber-900/40 hover:text-stone-200"
                >
                  {pl.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {person.events.length > 0 ? (
        <section>
          <h2 className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Timeline moments
          </h2>
          <ul className="mt-4 space-y-4">
            {person.events.map((e) => (
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

      <p className="mb-4 text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
        Hear this voice · Stay with this person · What they do not say aloud
      </p>
      <CharacterVoiceSection
        title="Hear them speak"
        firstName={person.name.split(/\s+/)[0] ?? "this figure"}
        publishedAssets={person.characterVoiceAssets
          .filter((a) => a.audioUrl?.trim())
          .map((a) => ({
            id: a.id,
            assetType: a.assetType,
            title: a.title,
            audioUrl: a.audioUrl,
            transcript: a.transcript,
          }))}
      />

      {silenceMeans || cp?.speechPatterns ? (
        <PremiumDepthGate
          title="What they don’t say"
          tone="voice"
          category="character_voice_monologue"
          teaser={
            <span>
              The subtext that still moves when the sentence ends—membership depth will hold longer
              cuts here.
            </span>
          }
        >
          <p className="text-stone-300">
            {(silenceMeans ?? cp?.speechPatterns)?.trim() ||
              "What stays beneath the line is not omission—it is pressure."}
          </p>
        </PremiumDepthGate>
      ) : null}

      {destabilizes ? (
        <AtmosphereBlock title="Where they break">
          <p className="whitespace-pre-wrap text-stone-400">{destabilizes}</p>
        </AtmosphereBlock>
      ) : null}

      <PremiumDepthGate
        tone="perspective"
        teaser={
          <span>
            Short, scene-anchored invitations into how {person.name.split(/\s+/)[0] ?? "they"}{" "}
            witness the world—without turning living people into puzzles.
          </span>
        }
      >
        <p className="text-stone-300">
          When depth opens for members, alternate perspective excerpts will appear here, tied to
          real passages you can already read—never speculation sold as certainty.
        </p>
      </PremiumDepthGate>

      <ExploreDeeperCard />
    </article>
  );
}
