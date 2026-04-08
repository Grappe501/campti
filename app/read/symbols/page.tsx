import type { Metadata } from "next";
import Link from "next/link";
import { PremiumDepthGate } from "@/components/public/premium-depth-gate";
import { ReaderThreadSuggestions } from "@/components/public/reader-thread-suggestions";
import { getCamptiSessionId } from "@/lib/campti-session";
import { deriveThreadHintsForSession } from "@/lib/reader-threads";
import {
  getPublicSymbolsLivingIndex,
  recordTypeReaderLabel,
} from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Symbolism — Campti",
  description: "Motifs and recurring images in the public world.",
};

function layeredMeaning(s: {
  meaning: string | null;
  meaningPrimary: string | null;
  meaningSecondary: string | null;
}): string | null {
  const parts = [s.meaningPrimary, s.meaningSecondary, s.meaning]
    .map((x) => x?.trim())
    .filter(Boolean) as string[];
  if (!parts.length) return null;
  return parts.join("\n\n");
}

export default async function ReadSymbolsPage() {
  const symbols = await getPublicSymbolsLivingIndex();
  const sessionId = await getCamptiSessionId();
  const threads = sessionId?.trim()
    ? await deriveThreadHintsForSession(sessionId.trim())
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.35em] text-amber-200/60">
          What returns, what insists
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal tracking-tight text-stone-100">
          Symbolism
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-500">
          Images that gather force as they repeat—through weather, ritual, hands, and memory. This
          is not a glossary; it is a map of currents.
        </p>
      </header>

      {threads.length > 0 ? (
        <ReaderThreadSuggestions
          threads={threads}
          title="Follow a current from your last visit"
          className="rounded-lg border border-stone-800/80 bg-stone-950/20 px-5 py-5"
        />
      ) : null}

      {symbols.length === 0 ? (
        <p className="text-sm text-stone-500">
          Symbols will appear here when they are shared with readers.
        </p>
      ) : (
        <ul className="space-y-8">
          {symbols.map((s) => {
            const body = layeredMeaning(s);
            return (
              <li
                key={s.id}
                id={s.id}
                className="scroll-mt-24 rounded-lg border border-stone-800 bg-stone-900/25 px-6 py-6"
              >
                <h2 className="font-serif text-2xl text-stone-100">{s.name}</h2>
                <p className="mt-2 text-xs text-stone-600">
                  {s.category?.replaceAll("_", " ") ?? "Motif"} ·{" "}
                  {recordTypeReaderLabel(s.recordType)}
                  {s.sceneCount > 0 ? (
                    <span className="text-stone-500">
                      {" "}
                      · Appears across {s.sceneCount} public scene
                      {s.sceneCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </p>
                {s.emotionalTone?.trim() ? (
                  <p className="mt-3 text-xs italic text-stone-500">
                    Emotional temperature (as the record suggests): {s.emotionalTone.trim()}
                  </p>
                ) : null}
                {body ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-400">
                    {body}
                  </p>
                ) : (
                  <p className="mt-4 text-sm italic text-stone-600">
                    Meaning will articulate further as the motif moves through scenes.
                  </p>
                )}
                {s.usageContext?.trim() ? (
                  <p className="mt-4 text-sm leading-relaxed text-stone-500">
                    {s.usageContext.trim()}
                  </p>
                ) : null}
                {s.sceneIds.length > 0 ? (
                  <div className="mt-5 border-t border-stone-800/80 pt-4">
                    <p className="text-[0.6rem] uppercase tracking-[0.22em] text-stone-600">
                      Where it surfaces
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {s.sceneIds.slice(0, 6).map((id, i) => (
                        <li key={id}>
                          <Link
                            href={`/read/scenes/${id}`}
                            className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-400 transition hover:border-amber-900/35 hover:text-stone-200"
                          >
                            Passage {i + 1}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {s.sceneCount > 0 ? (
                  <div className="mt-6">
                    <PremiumDepthGate
                      tone="symbol"
                      category="deep_symbolic_experience"
                      teaser={
                        <span>
                          A premium symbol journey will trace how “{s.name}” moves across scenes—deeper
                          layers, contested readings, and the cost of return.
                        </span>
                      }
                    >
                      <p className="text-stone-300">
                        MeaningPrimary and secondary layers stay visible above; the journey layer will
                        braid cross-scene appearances, audio studies, and interpretive corridors—optional,
                        never loud.
                      </p>
                    </PremiumDepthGate>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
