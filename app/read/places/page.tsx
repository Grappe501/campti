import type { Metadata } from "next";
import { PlaceSpotlight } from "@/components/public/place-spotlight";
import { getPublicPlacesIndex, placeTypeReaderLabel } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Places — Campti",
  description: "Atlas of public locations in the Campti world.",
};

export default async function ReadPlacesPage() {
  const places = await getPublicPlacesIndex();

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          The inhabited map
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-stone-100">
          Places
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
          Ground that remembers footsteps. Each name opens weather, texture, and why the
          story keeps returning there.
        </p>
      </header>

      {places.length === 0 ? (
        <p className="text-sm text-stone-500">
          No places have been released to readers yet.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {places.map((pl) => (
            <li key={pl.id}>
              <PlaceSpotlight
                id={pl.id}
                name={pl.name}
                placeTypeLabel={placeTypeReaderLabel(pl.placeType)}
                description={pl.description}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
