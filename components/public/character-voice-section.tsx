import { PublicAudioPlayer } from "@/components/public/public-audio-player";

export type PublishedVoiceAsset = {
  id: string;
  assetType: string;
  title: string;
  audioUrl: string | null;
  transcript: string | null;
};

type CharacterVoiceSectionProps = {
  firstName: string;
  publishedAssets?: PublishedVoiceAsset[];
  /** Main heading (Phase 10E attachment language). */
  title?: string;
};

function labelForAssetType(t: string): string {
  const k = t.toLowerCase();
  if (k === "monologue") return "Monologue";
  if (k === "narration") return "Narration";
  if (k === "teaser") return "Teaser";
  if (k === "sample") return "Sample";
  return "Voice";
}

/**
 * Character audio — published assets when present; otherwise a quiet placeholder.
 */
export function CharacterVoiceSection({
  firstName,
  publishedAssets = [],
  title = "Hear them speak",
}: CharacterVoiceSectionProps) {
  const playable = publishedAssets.filter((a) => a.audioUrl?.trim());

  return (
    <section className="rounded-lg border border-stone-800/90 bg-stone-950/35 px-5 py-6 sm:px-6">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-stone-500">
        Voice
      </p>
      <h2 className="mt-2 font-serif text-xl font-normal text-stone-100">{title}</h2>
      {playable.length > 0 ? (
        <div className="mt-6 space-y-5">
          {playable.map((a) => (
            <div key={a.id}>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-stone-600">
                {labelForAssetType(a.assetType)}
              </p>
              <PublicAudioPlayer
                src={a.audioUrl}
                title={a.title}
                domId={null}
                loop={false}
                className="mt-2 border-stone-800/80"
              />
              {a.transcript?.trim() ? (
                <p className="mt-3 text-xs leading-relaxed text-stone-500">{a.transcript.trim()}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
            A spoken presence for {firstName} is being composed separately from the text—quiet,
            measured, and faithful to what you already sense on the page.
          </p>
          <div className="mt-6 rounded-lg border border-dashed border-stone-800/90 bg-stone-900/40 px-4 py-4 text-center">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-stone-600">Not yet published</p>
            <p className="mt-1 text-xs text-stone-500">Playback will appear when the sound layer is ready.</p>
          </div>
        </>
      )}
    </section>
  );
}
