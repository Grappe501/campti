"use client";

type AudioTeaserProps = {
  label: string;
  sublabel?: string;
};

/**
 * Intentional “coming soon” listening affordance — wires later to real audio URLs.
 */
export function AudioTeaser({ label, sublabel }: AudioTeaserProps) {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
            Sound
          </p>
          <p className="mt-1 font-serif text-lg text-stone-200">{label}</p>
          {sublabel ? (
            <p className="mt-1 text-xs text-stone-500">{sublabel}</p>
          ) : null}
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2 sm:w-48">
          <div className="flex h-9 items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/80 px-3">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-600 text-stone-500"
              title="Audio coming soon"
            >
              <span className="sr-only">Play (coming soon)</span>
              <span aria-hidden className="ml-0.5 text-[0.55rem]">
                ▶
              </span>
            </button>
            <div className="h-1 flex-1 rounded-full bg-stone-800">
              <div className="h-full w-0 rounded-full bg-amber-900/40" />
            </div>
          </div>
          <p className="text-center text-[0.65rem] text-stone-600">
            Listening experiences are in quiet preparation.
          </p>
        </div>
      </div>
    </div>
  );
}
