import Link from "next/link";

import type { AuthorCommandCockpitBundle, AuthorCockpitScope } from "@/lib/domain/author-command-cockpit";

type ScopeOption = {
  id: string;
  label: string;
  href: string;
};

type Props = {
  bundle: AuthorCommandCockpitBundle;
  scopeOptions: Record<AuthorCockpitScope, ScopeOption[]>;
};

export function AuthorCommandCockpit({ bundle, scopeOptions }: Props) {
  const currentScopeOptions = scopeOptions[bundle.context.scope];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-stone-500">Author Command Cockpit</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">{bundle.centeredSurface.title}</h1>
            <p className="text-sm text-stone-600">{bundle.centeredSurface.subtitle}</p>
          </div>
          <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs text-stone-700">
            Scope: {bundle.context.scope}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-stone-500">{bundle.toolRails.topBand.label}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {bundle.toolRails.topBand.tools.map((tool) => (
            <span key={tool} className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
              {tool.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">{bundle.toolRails.leftRail.label}</p>
            <ul className="mt-2 space-y-1 text-sm text-stone-700">
              {bundle.toolRails.leftRail.tools.map((tool) => (
                <li key={tool}>- {tool.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">Scope switching</p>
            <div className="mt-3 space-y-3">
              {(Object.keys(scopeOptions) as AuthorCockpitScope[]).map((scope) => (
                <div key={scope}>
                  <p className="text-xs font-medium text-stone-500">{scope}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {scopeOptions[scope].length === 0 ? (
                      <span className="text-xs text-stone-400">No records</span>
                    ) : (
                      scopeOptions[scope].slice(0, 4).map((option) => (
                        <Link
                          key={option.id}
                          href={option.href}
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            scope === bundle.context.scope
                              ? "border-amber-400 bg-amber-50 text-amber-900"
                              : "border-stone-300 bg-white text-stone-700"
                          }`}
                        >
                          {option.label}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-4 lg:col-span-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">Centered work surface</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-900">{bundle.centeredSurface.title}</h2>
            <p className="mt-1 text-sm text-stone-600">{bundle.centeredSurface.subtitle}</p>

            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-medium text-stone-700">Indicator bank ({bundle.indicatorBank.scope})</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {bundle.indicatorBank.indicators.map((indicator) => (
                  <li key={indicator.key} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-700">{indicator.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          indicator.severity === "high"
                            ? "bg-red-100 text-red-800"
                            : indicator.severity === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {indicator.severity}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-stone-500">{String(indicator.value)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>

        <aside className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">{bundle.toolRails.rightRail.label}</p>
            <ul className="mt-2 space-y-1 text-sm text-stone-700">
              {bundle.toolRails.rightRail.tools.map((tool) => (
                <li key={tool}>- {tool.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">Guided action signals</p>
            {bundle.guidedSignals.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">No elevated advisory signals.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {bundle.guidedSignals.map((signal) => (
                  <li key={signal.signalId} className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-sm">
                    <p className="font-medium text-stone-800">{signal.summary}</p>
                    <p className="mt-1 text-xs text-stone-600">{signal.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {bundle.beatAssembly ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Beat assembly</p>
              <p className="mt-2 text-sm font-medium text-stone-800">
                Chapter {bundle.beatAssembly.chapter} · {bundle.beatAssembly.beatCount} beats
              </p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Validation: {bundle.beatAssembly.validationPassed ? "pass" : "fail"}</li>
                <li>Highest pressure load: {bundle.beatAssembly.highestPressureLoad.toFixed(2)}</li>
                <li>Salience coverage: {(bundle.beatAssembly.salienceCoverage * 100).toFixed(0)}%</li>
                <li>Memory-linked beats: {bundle.beatAssembly.memoryLinkedBeats}</li>
                <li>Social feedback beats: {bundle.beatAssembly.socialFeedbackBeats}</li>
                <li>Meaning traces: {bundle.beatAssembly.meaningTraceBeats}</li>
              </ul>
              <p className="mt-2 text-xs text-stone-500">{bundle.beatAssembly.summaryLine}</p>
            </div>
          ) : null}

          {bundle.chapterState ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-stone-500">Chapter state</p>
              <p className="mt-2 text-sm font-medium text-stone-800">
                {bundle.chapterState.chapterId} · {bundle.chapterState.chapterMode.replaceAll("_", " ")}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>Movement pressure: {bundle.chapterState.movementPressure}</li>
                <li>Decision pressure: {bundle.chapterState.decisionPressure}</li>
                <li>Meaning load: {bundle.chapterState.meaningLoad}</li>
                <li>Allowed meaning intensity: {bundle.chapterState.allowedMeaningIntensity.replaceAll("_", " ")}</li>
                <li>Validation: {bundle.chapterState.validationPassed ? "pass" : "fail"}</li>
              </ul>
              <p className="mt-2 text-xs text-stone-500">{bundle.chapterState.summaryLine}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-stone-500">Command actions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {bundle.availableActions.map((action) => (
                <span key={action} className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs text-stone-700">
                  {action.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
