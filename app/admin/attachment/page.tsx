import {
  getHighestLingerScenes,
  getHighestReturnScenes,
  getMostEffectivePremiumDepthOffers,
  getMostEffectiveReturnHooks,
  getMostImprintedCharacters,
  getMostImprintedPlaces,
  getMostImprintedSymbols,
  strongestListenCompletions,
} from "@/lib/attachment-analytics";

export const dynamic = "force-dynamic";

export default async function AdminAttachmentPage() {
  const [
    lingerScenes,
    returnScenes,
    imprintedChars,
    imprintedSyms,
    imprintedPlaces,
    returnHooks,
    premiumSignals,
    listenCompletions,
  ] = await Promise.all([
    getHighestLingerScenes(10),
    getHighestReturnScenes(10),
    getMostImprintedCharacters(10),
    getMostImprintedSymbols(10),
    getMostImprintedPlaces(10),
    getMostEffectiveReturnHooks(12),
    getMostEffectivePremiumDepthOffers(12),
    strongestListenCompletions(10),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Reader attachment (internal)</h1>
        <p className="mt-2 text-sm text-stone-600">
          Session-based emotional signals — not shown to public readers. Use to tune scenes, hooks,
          and depth offers.
        </p>
      </header>

      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-800">Strongest scene linger (imprints)</h2>
        <ul className="mt-3 space-y-1 font-mono text-xs text-stone-700">
          {lingerScenes.length === 0 ? (
            <li className="text-stone-500">No data yet.</li>
          ) : (
            lingerScenes.map((r) => (
              <li key={r.sceneId}>
                {r.sceneId} — weight {r.totalWeight}, rows {r.imprintCount}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-800">Return / revisit signals</h2>
        <ul className="mt-3 space-y-1 font-mono text-xs text-stone-700">
          {returnScenes.length === 0 ? (
            <li className="text-stone-500">No data yet.</li>
          ) : (
            returnScenes.map((r) => (
              <li key={r.sceneId}>
                {r.sceneId} — signals {r.returnSignals}
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-stone-800">Characters (imprint + listen)</h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-stone-700">
            {imprintedChars.length === 0 ? (
              <li className="text-stone-500">No data yet.</li>
            ) : (
              imprintedChars.map((r) => (
                <li key={r.personId}>
                  {r.personId} — imprint {r.imprintScore}, listen {r.listenSeconds}s
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-stone-800">Symbols</h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-stone-700">
            {imprintedSyms.length === 0 ? (
              <li className="text-stone-500">No data yet.</li>
            ) : (
              imprintedSyms.map((r) => (
                <li key={r.symbolId}>
                  {r.symbolId} — score {r.score}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-800">Places</h2>
        <ul className="mt-3 space-y-1 font-mono text-xs text-stone-700">
          {imprintedPlaces.length === 0 ? (
            <li className="text-stone-500">No data yet.</li>
          ) : (
            imprintedPlaces.map((r) => (
              <li key={r.placeId}>
                {r.placeId} — score {r.score}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-800">Return hook lines (stored)</h2>
        <ul className="mt-3 space-y-2 text-xs text-stone-700">
          {returnHooks.length === 0 ? (
            <li className="text-stone-500">No hooks yet.</li>
          ) : (
            returnHooks.map((r, i) => (
              <li key={`${i}-${r.count}`} className="border-b border-stone-100 pb-2">
                <span className="text-stone-500">{r.count}×</span> {r.hook}
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-stone-800">Premium depth signals</h2>
          <p className="mt-1 text-xs text-stone-500">expanded_depth imprints by entity id</p>
          <ul className="mt-3 space-y-1 font-mono text-xs text-stone-700">
            {premiumSignals.length === 0 ? (
              <li className="text-stone-500">No data yet.</li>
            ) : (
              premiumSignals.map((r) => (
                <li key={r.entityId}>
                  {r.entityId} — {r.signals}
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-stone-800">Listen completions (scene)</h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-stone-700">
            {listenCompletions.length === 0 ? (
              <li className="text-stone-500">No data yet.</li>
            ) : (
              listenCompletions.map((r) => (
                <li key={r.sceneId}>
                  {r.sceneId} — {r.completions}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
