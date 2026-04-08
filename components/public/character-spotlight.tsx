import Link from "next/link";

type CharacterSpotlightProps = {
  id: string;
  name: string;
  descriptor?: string | null;
  line?: string | null;
  roleHint?: string | null;
};

export function CharacterSpotlight({
  id,
  name,
  descriptor,
  line,
  roleHint,
}: CharacterSpotlightProps) {
  return (
    <Link
      href={`/read/characters/${id}`}
      className="group block rounded-lg border border-stone-700/50 bg-stone-900/30 p-6 transition hover:border-stone-600 hover:bg-stone-900/50"
    >
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-stone-500">
        {roleHint ?? "Figure"}
      </p>
      <h3 className="mt-2 font-serif text-2xl text-stone-100 group-hover:text-amber-50/95">
        {name}
      </h3>
      {descriptor ? (
        <p className="mt-2 text-sm text-stone-400">{descriptor}</p>
      ) : null}
      {line ? (
        <p className="mt-4 border-l border-amber-900/40 pl-4 text-sm italic leading-relaxed text-stone-500">
          {line}
        </p>
      ) : null}
    </Link>
  );
}
