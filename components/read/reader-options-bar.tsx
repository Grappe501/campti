"use client";

import type { ReaderColumnMode, ReaderFlowMode, ReaderUiPreferences } from "@/lib/reader-ui-preferences";
import { FONT_STEPS_REM } from "@/lib/reader-ui-preferences";

type Props = {
  prefs: ReaderUiPreferences;
  onChange: (next: ReaderUiPreferences) => void;
  hasAudio: boolean;
};

export function ReaderOptionsBar({ prefs, onChange, hasAudio }: Props) {
  const set = (patch: Partial<ReaderUiPreferences>) => onChange({ ...prefs, ...patch });

  return (
    <div className="rounded-lg border border-cyan-900/35 bg-black/35 shadow-[inset_0_1px_0_rgba(34,211,238,0.06)]">
      <button
        type="button"
        onClick={() => set({ optionsBarExpanded: !prefs.optionsBarExpanded })}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
        aria-expanded={prefs.optionsBarExpanded}
      >
        <span className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-cyan-500/80">
          Flight deck · reader
        </span>
        <span className="text-[0.65rem] text-stone-500">
          {prefs.optionsBarExpanded ? "Hide" : "Show"} instruments
        </span>
      </button>
      {prefs.optionsBarExpanded ? (
        <div className="border-t border-cyan-950/40 px-4 py-4 sm:px-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="text-[0.55rem] uppercase tracking-[0.2em] text-stone-500">
                Type size
              </span>
              <input
                type="range"
                min={0}
                max={FONT_STEPS_REM.length - 1}
                value={prefs.fontStep}
                onChange={(e) => set({ fontStep: Number(e.target.value) })}
                className="mt-2 w-full accent-cyan-600"
              />
              <p className="mt-1 text-[0.65rem] text-stone-600">
                {Math.round(FONT_STEPS_REM[prefs.fontStep]! * 100)}% body scale
              </p>
            </label>

            <fieldset>
              <legend className="text-[0.55rem] uppercase tracking-[0.2em] text-stone-500">
                Columns
              </legend>
              <div className="mt-2 flex gap-2">
                {([1, 2] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set({ columns: c as ReaderColumnMode })}
                    className={`rounded-md border px-3 py-2 text-[0.7rem] transition ${
                      prefs.columns === c
                        ? "border-cyan-600/60 bg-cyan-950/30 text-stone-100"
                        : "border-stone-800 text-stone-500 hover:border-stone-700"
                    }`}
                  >
                    {c === 1 ? "One page" : "Two pages"}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[0.55rem] uppercase tracking-[0.2em] text-stone-500">
                Flow
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => set({ flow: "scroll" as ReaderFlowMode })}
                  className={`rounded-md border px-3 py-2 text-[0.7rem] transition ${
                    prefs.flow === "scroll"
                      ? "border-cyan-600/60 bg-cyan-950/30 text-stone-100"
                      : "border-stone-800 text-stone-500 hover:border-stone-700"
                  }`}
                >
                  Continuous
                </button>
                <button
                  type="button"
                  onClick={() => set({ flow: "paragraph" as ReaderFlowMode })}
                  className={`rounded-md border px-3 py-2 text-[0.7rem] transition ${
                    prefs.flow === "paragraph"
                      ? "border-cyan-600/60 bg-cyan-950/30 text-stone-100"
                      : "border-stone-800 text-stone-500 hover:border-stone-700"
                  }`}
                >
                  One beat
                </button>
              </div>
              <p className="mt-2 text-[0.6rem] leading-snug text-stone-600">
                “One beat” advances by paragraph in calm reading mode — immersive modes stay
                continuous.
              </p>
            </fieldset>

            <div>
              <span className="text-[0.55rem] uppercase tracking-[0.2em] text-stone-500">
                Sound bed
              </span>
              {hasAudio ? (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-[0.75rem] text-stone-400">
                  <input
                    type="checkbox"
                    checked={prefs.ambientBedMuted}
                    onChange={(e) => set({ ambientBedMuted: e.target.checked })}
                    className="accent-cyan-600"
                  />
                  Mute ambient under voice (when tracks publish)
                </label>
              ) : (
                <p className="mt-2 text-[0.68rem] leading-relaxed text-stone-600">
                  ElevenLabs / mixes will respect this when audio is on the passage.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
