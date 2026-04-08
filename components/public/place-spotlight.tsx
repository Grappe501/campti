import Link from "next/link";

type PlaceSpotlightProps = {
  id: string;
  name: string;
  placeTypeLabel: string;
  description?: string | null;
};

export function PlaceSpotlight({
  id,
  name,
  placeTypeLabel,
  description,
}: PlaceSpotlightProps) {
  return (
    <Link
      href={`/read/places/${id}`}
      className="group block rounded-lg border border-stone-700/50 bg-stone-900/30 p-6 transition hover:border-stone-600 hover:bg-stone-900/50"
    >
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-stone-500">
        {placeTypeLabel}
      </p>
      <h3 className="mt-2 font-serif text-2xl text-stone-100 group-hover:text-amber-50/95">
        {name}
      </h3>
      {description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-400">
          {description}
        </p>
      ) : null}
    </Link>
  );
}
