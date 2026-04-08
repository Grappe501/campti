import type { ImmersiveTonePreset } from "@/lib/immersive-presets";

/** Ambient bed keys — wire URLs via env when assets exist. */
export type AmbientAudioKey =
  | "river"
  | "wind"
  | "insects"
  | "distant_voices"
  | "none";

export type PublicSceneImmersion = {
  tonePreset: ImmersiveTonePreset;
  ambientAudioKey: AmbientAudioKey;
  /** When set, show narration player (user must press play). */
  narrationSrc: string | null;
  narrationTitle?: string | null;
  /** Published immersive / ambient mix from database when present. */
  ambientMixSrc?: string | null;
  ambientMixTitle?: string | null;
};

/**
 * Optional per-scene overrides (IDs from your database).
 * Extend this object as you add authored atmosphere.
 */
const SCENE_IMMERSION_OVERRIDES: Record<
  string,
  Partial<Pick<PublicSceneImmersion, "tonePreset" | "ambientAudioKey" | "narrationSrc">>
> = {};

/** Per-scene narration URLs when you host audio; empty until wired. */
const SCENE_NARRATION_URLS: Partial<Record<string, string>> = {};

/** Resolve ambient URL from env — all optional, no autoplay. */
export function ambientSrcForKey(key: AmbientAudioKey): string | null {
  if (key === "none") return null;
  const envMap: Record<AmbientAudioKey, string | undefined> = {
    river: process.env.NEXT_PUBLIC_AMBIENT_RIVER_URL,
    wind: process.env.NEXT_PUBLIC_AMBIENT_WIND_URL,
    insects: process.env.NEXT_PUBLIC_AMBIENT_INSECTS_URL,
    distant_voices: process.env.NEXT_PUBLIC_AMBIENT_DISTANT_VOICES_URL,
    none: undefined,
  };
  const u = envMap[key]?.trim();
  return u || null;
}

function inferToneFromEmotionalTone(emotionalTone: string | null | undefined): ImmersiveTonePreset {
  const t = (emotionalTone ?? "").toLowerCase();
  if (
    /\b(mist|fog|grey|gray|cold|distant|numb|dissoc)\b/.test(t) ||
    t.includes("dissociat")
  ) {
    return "mist";
  }
  if (
    /\b(dusk|sunset|twilight|evening|longing|grief|loss)\b/.test(t) ||
    t.includes("melanch")
  ) {
    return "dusk";
  }
  if (/\b(river|water|rain|wet|current|flow)\b/.test(t)) {
    return "river";
  }
  if (/\b(fire|warm|hearth|home|intimate|candle)\b/.test(t)) {
    return "firelight";
  }
  return "neutral";
}

function inferAmbientFromTone(preset: ImmersiveTonePreset): AmbientAudioKey {
  switch (preset) {
    case "river":
      return "river";
    case "mist":
      return "wind";
    case "dusk":
      return "distant_voices";
    case "firelight":
      return "none";
    default:
      return "none";
  }
}

/**
 * Build immersion config for a public scene (no schema migration).
 * Override per scene id in SCENE_IMMERSION_OVERRIDES when needed.
 */
export function resolvePublicSceneImmersion(input: {
  sceneId: string;
  emotionalTone: string | null;
  /** Optional published tracks from `SceneAudioAsset` (already filtered). */
  publishedAudio?: { assetType: string; audioUrl: string; title: string }[];
}): PublicSceneImmersion {
  const override = SCENE_IMMERSION_OVERRIDES[input.sceneId] ?? {};
  const tonePreset =
    override.tonePreset ?? inferToneFromEmotionalTone(input.emotionalTone);
  const ambientAudioKey =
    override.ambientAudioKey ?? inferAmbientFromTone(tonePreset);

  const demo = process.env.NEXT_PUBLIC_DEMO_SCENE_NARRATION_URL?.trim();
  const fromDbNarration = input.publishedAudio?.find(
    (a) => a.assetType === "narration" || a.assetType === "excerpt",
  );
  const fromDbAmbient = input.publishedAudio?.find(
    (a) => a.assetType === "ambient_mix" || a.assetType === "immersive_mix",
  );

  const narrationSrc =
    override.narrationSrc ??
    fromDbNarration?.audioUrl?.trim() ??
    SCENE_NARRATION_URLS[input.sceneId] ??
    (demo || null);

  const ambientMixSrc = fromDbAmbient?.audioUrl?.trim() || null;

  return {
    tonePreset,
    ambientAudioKey,
    narrationSrc: narrationSrc || null,
    narrationTitle: fromDbNarration?.title ?? null,
    ambientMixSrc,
    ambientMixTitle: fromDbAmbient?.title ?? null,
  };
}
