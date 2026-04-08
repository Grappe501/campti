import type { NarrativeStylePreset } from "@/lib/descriptive-validation";

/**
 * Internal style presets for template + optional LLM enhancement.
 * Defaults: immersive_literary (world/perspective), editorial_interpretive (suggestions), restrained_historical (source-grounded).
 */
export const NARRATIVE_STYLE_PRESETS: Record<NarrativeStylePreset, { label: string; guidance: string }> = {
  restrained_historical: {
    label: "Restrained historical",
    guidance:
      "Prefer concrete period constraints, hedged inference, and explicit uncertainty. No invented dates or names.",
  },
  immersive_literary: {
    label: "Immersive literary",
    guidance:
      "Sensorily specific, emotionally legible, POV-filtered. Avoid purple prose; every image should earn its place.",
  },
  editorial_interpretive: {
    label: "Editorial interpretive",
    guidance:
      "Speak like a sharp developmental editor: name what is missing, why it matters, and what would fix it — without bullying the author.",
  },
  embodied_minimal: {
    label: "Embodied minimal",
    guidance: "Short bodily and attentional cues; almost no metaphor; high signal density.",
  },
  symbolic_dense: {
    label: "Symbolic dense",
    guidance: "Track motif pressure, latent meaning, and what the POV might not yet verbalize.",
  },
  cinematic_lyrical: {
    label: "Cinematic lyrical",
    guidance:
      "Image-led rhythm: contrast long and short beats, allow silence, favor concrete nouns and motion verbs over explanation.",
  },
  voice_forward: {
    label: "Voice forward",
    guidance:
      "Let diction and cadence carry meaning; interiority shows through how things are said, not commentary.",
  },
  audio_clean: {
    label: "Audio clean",
    guidance:
      "Speakable lines: moderate sentence length, natural breath breaks, minimal tongue-twisters; mark pauses lightly.",
  },
};

export const DEFAULT_WORLD_PREVIEW_STYLE: NarrativeStylePreset = "immersive_literary";
export const DEFAULT_SUGGESTION_STYLE: NarrativeStylePreset = "editorial_interpretive";
export const DEFAULT_SOURCE_GROUNDED_STYLE: NarrativeStylePreset = "restrained_historical";
