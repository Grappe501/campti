import type { Metadata } from "next";
import { CharacterSpotlight } from "@/components/public/character-spotlight";
import {
  getPublicCharacterIndex,
  recordTypeReaderLabel,
} from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "People — Campti",
  description: "Public character index for the Campti reading world.",
};

export default async function ReadCharactersPage() {
  const people = await getPublicCharacterIndex();

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          The living cast
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-stone-100">
          People
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
          Names that carry weight. Each card opens a private orbit of biography, inner weather,
          and the relationships that shape them.
        </p>
      </header>

      {people.length === 0 ? (
        <p className="text-sm text-stone-500">
          No figures have been offered to readers yet. When someone is marked for the public
          room, they will appear here.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {people.map((p) => {
            const role =
              p.characterProfile?.socialPosition?.trim() ||
              recordTypeReaderLabel(p.recordType);
            const line =
              p.characterProfile?.coreLonging?.trim() ||
              p.characterProfile?.emotionalBaseline?.trim() ||
              null;
            return (
              <li key={p.id}>
                <CharacterSpotlight
                  id={p.id}
                  name={p.name}
                  descriptor={p.description}
                  line={line}
                  roleHint={role}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
