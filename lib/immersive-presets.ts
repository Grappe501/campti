/**
 * Visual tone presets for immersive reading (code-defined; no admin UI yet).
 * Maps to CSS layers in AtmosphereLayer / immersive typography context.
 */

export type ImmersiveTonePreset = "mist" | "dusk" | "river" | "firelight" | "neutral";

export type ImmersiveToneTokens = {
  /** Background gradient (Tailwind arbitrary values supported) */
  background: string;
  /** Grain / vignette overlay opacity modifier */
  overlay: string;
  /** Primary text */
  text: string;
  /** Muted / secondary */
  textMuted: string;
  /** Links & accents */
  accent: string;
};

export const IMMERSIVE_TONE_PRESETS: Record<ImmersiveTonePreset, ImmersiveToneTokens> = {
  mist: {
    background: "from-[#0c0d10] via-[#12151c] to-[#0a0c0f]",
    overlay: "from-slate-400/[0.04] to-transparent",
    text: "text-slate-100/92",
    textMuted: "text-slate-400/75",
    accent: "text-sky-200/70 hover:text-sky-100/90",
  },
  dusk: {
    background: "from-[#120c10] via-[#1a1218] to-[#0c080a]",
    overlay: "from-rose-500/[0.06] to-transparent",
    text: "text-rose-50/90",
    textMuted: "text-rose-200/45",
    accent: "text-amber-200/75 hover:text-amber-100/90",
  },
  river: {
    background: "from-[#0a1012] via-[#0e1618] to-[#080c0e]",
    overlay: "from-cyan-900/[0.07] to-transparent",
    text: "text-cyan-50/88",
    textMuted: "text-cyan-200/40",
    accent: "text-teal-200/70 hover:text-teal-100/88",
  },
  firelight: {
    background: "from-[#100a06] via-[#1a120c] to-[#0c0804]",
    overlay: "from-orange-600/[0.08] to-transparent",
    text: "text-orange-50/90",
    textMuted: "text-orange-200/45",
    accent: "text-amber-300/80 hover:text-amber-200/95",
  },
  neutral: {
    background: "from-[#0c0b09] via-[#12110f] to-[#0a0908]",
    overlay: "from-stone-500/[0.05] to-transparent",
    text: "text-stone-100/90",
    textMuted: "text-stone-400/80",
    accent: "text-amber-100/80 hover:text-amber-50/95",
  },
};
