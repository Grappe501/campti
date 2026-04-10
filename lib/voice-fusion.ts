import type { GravityTimingContext } from "@/lib/emotional-gravity";
import type { NarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import { profileJsonFieldToString } from "@/lib/profile-json";
import { prisma } from "@/lib/prisma";
import type { PerceptionUnit } from "@/lib/perception-stream";
import { groupPerceptionUnitsForRender, sceneRng } from "@/lib/perception-stream";

export type VoiceFusionRenderStyle =
  | "minimal_perception"
  | "immersive_perception"
  | "guided_perception";

export type PerceptionVoiceProfile = {
  sentenceLengthBias: "short" | "medium" | "long";
  pauseAffinity: number;
  metaphorDensity: number;
  directness: number;
  interiority: number;
  memoryStyle: "present" | "echo" | "fragment";
  concealment: number;
};

export type VoiceFusionOptions = {
  style?: VoiceFusionRenderStyle;
  mergeBreath?: boolean;
  /** When set, immersive path can fragment and weight cadence from emotional gravity. */
  gravity?: GravityTimingContext;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function parseBias(s: string | null | undefined): number {
  const t = (s ?? "").toLowerCase();
  if (/\bsparse|staccato|short|terse\b/.test(t)) return 0.25;
  if (/\blong|rolling|lyrical|expansive\b/.test(t)) return 0.85;
  return 0.5;
}

/** Map DB / consciousness into fusion knobs (heuristic, no LLM). */
export async function resolveVoiceProfileForMetaScene(
  metaSceneId: string,
  ctx: NarrativeConsciousnessContext | null,
): Promise<PerceptionVoiceProfile> {
  const row = await prisma.narrativeVoiceProfile.findFirst({
    where: {
      OR: [{ scopeId: metaSceneId, scopeType: "scene_mode" }, { isDefault: true }],
    },
    orderBy: [{ isDefault: "asc" }, { updatedAt: "desc" }],
  });

  const p = ctx?.povPerson.profile;
  const rhythm = parseBias(row?.sentenceRhythm ?? p?.speechPatterns);
  const metaphor =
    row?.metaphorDensity?.toLowerCase().includes("high") ||
    p?.sensoryBias?.toLowerCase().includes("metaphor")
      ? 0.72
      : row?.metaphorDensity?.toLowerCase().includes("low")
        ? 0.28
        : 0.48;
  const silence = parseBias(row?.silenceStyle);
  const interior =
    row?.interiorityStyle?.toLowerCase().includes("deep") ||
    profileJsonFieldToString(p?.internalConflicts).trim()
      ? 0.75
      : 0.45;
  const memory =
    row?.memoryStyle?.toLowerCase().includes("fragment")
      ? "fragment"
      : row?.memoryStyle?.toLowerCase().includes("echo")
        ? "echo"
        : p?.memoryBias?.toLowerCase().includes("present")
          ? "present"
          : "echo";
  const conceal =
    p?.defensiveStyle?.trim() || p?.shameTrigger?.trim() ? 0.62 : 0.35;

  return {
    sentenceLengthBias: rhythm < 0.38 ? "short" : rhythm > 0.65 ? "long" : "medium",
    pauseAffinity: silence,
    metaphorDensity: metaphor,
    directness: clamp(1 - conceal * 0.4, 0.2, 0.95),
    interiority: interior,
    memoryStyle: memory,
    concealment: conceal,
  };
}

export function applyVoiceRhythm(text: string, voice: PerceptionVoiceProfile): string {
  const t = text.trim();
  if (!t) return t;
  if (voice.sentenceLengthBias === "short") {
    return t
      .replace(/;\s+/g, ". ")
      .replace(/\s+and\s+/gi, " · ")
      .replace(/\s{2,}/g, " ");
  }
  if (voice.sentenceLengthBias === "long") {
    return t.replace(/\.\s+(?=[A-Za-z])/g, voice.pauseAffinity > 0.55 ? " — " : "; ");
  }
  return t;
}

export function applyVoiceSilence(text: string, voice: PerceptionVoiceProfile): string {
  const t = text.trim();
  if (!t) return t;
  const gap = voice.pauseAffinity > 0.62 ? "\n\n" : voice.pauseAffinity > 0.38 ? "\n" : " ";
  if (voice.pauseAffinity > 0.55 && t.includes(". ")) {
    return t.replace(/\.(\s+)(?=[A-Za-z])/g, `.${gap}`);
  }
  return t;
}

export function applyVoiceDiction(text: string, voice: PerceptionVoiceProfile): string {
  let t = text.trim();
  if (!t) return t;
  if (voice.directness < 0.42) {
    t = t.replace(/\b(very|really|quite)\b/gi, "");
  }
  return t.replace(/\s{2,}/g, " ").trim();
}

export function applyVoiceMetaphorDensity(text: string, voice: PerceptionVoiceProfile): string {
  const t = text.trim();
  if (!t) return t;
  if (voice.metaphorDensity < 0.34) {
    return t.replace(/\b(like|as if)\b/gi, "");
  }
  if (voice.metaphorDensity > 0.62 && !/\b(as if|like a)\b/i.test(t)) {
    return t.endsWith(".") ? t.slice(0, -1) + "—as if the room were listening." : `${t}—as if the room were listening.`;
  }
  return t;
}

export function applyVoiceInteriority(text: string, voice: PerceptionVoiceProfile): string {
  const t = text.trim();
  if (!t) return t;
  if (voice.interiority > 0.62 && voice.concealment > 0.45) {
    return t.startsWith("(") ? t : `(${t})`;
  }
  return t;
}

/**
 * Under high tension / mystery / bodily volatility, break the fused line—sparingly.
 */
export function applyPerceptualFragmentation(
  text: string,
  unit: PerceptionUnit,
  gravity: GravityTimingContext,
): string {
  const t = text.trim();
  if (!t) return t;

  const emotionalInstability = clamp(
    gravity.threat * 0.38 +
      gravity.mystery * 0.34 +
      (unit.tensionDelta ?? 0) * 0.22 +
      Math.abs((unit.emotionalWeight ?? 0.5) - 0.5) * 0.2,
    0,
    1,
  );
  if (emotionalInstability < 0.52) return t;
  if (unit.unitType === "continuation_impulse" || unit.notes === "guided_cue") return t;

  const rng = sceneRng(unit.id, "voice-frag");
  if (rng() > 0.4) return t;

  if (t.length > 85 && t.includes(". ")) {
    const idx = t.indexOf(". ");
    if (idx > 22 && idx < t.length - 28 && rng() < 0.45) {
      return `${t.slice(0, idx + 1).trim()}\n\n${t.slice(idx + 2).trim()}`;
    }
  }
  if (t.length > 95 && t.includes(",")) {
    const lastComma = t.lastIndexOf(",");
    if (lastComma > 44 && rng() < 0.5) {
      return `${t.slice(0, lastComma).trim()}…`;
    }
  }
  if (t.length > 70 && /\b(that|because|and yet|but)\b/i.test(t) && rng() < 0.42) {
    return t.replace(/\b(that|because|and yet|but)\b/i, "\n$1");
  }
  return t;
}

export function applyVoiceMemoryStyle(text: string, voice: PerceptionVoiceProfile): string {
  const t = text.trim();
  if (!t) return t;
  if (voice.memoryStyle === "fragment") {
    return t
      .split(/(?<=[.!?])\s+/)
      .slice(0, 2)
      .join(" ")
      .trim();
  }
  if (voice.memoryStyle === "echo" && t.length > 40) {
    const frag = t.slice(0, Math.min(72, t.length)).trim();
    return `${frag} … ${frag.slice(0, Math.min(28, frag.length))}`;
  }
  return t;
}

function stylePipeline(
  text: string,
  voice: PerceptionVoiceProfile,
  style: VoiceFusionRenderStyle,
): string {
  let t = text;
  if (style === "minimal_perception") {
    const v: PerceptionVoiceProfile = {
      ...voice,
      sentenceLengthBias: "short",
      pauseAffinity: voice.pauseAffinity * 0.65,
      metaphorDensity: voice.metaphorDensity * 0.55,
      interiority: voice.interiority * 0.7,
    };
    t = applyVoiceDiction(t, v);
    t = applyVoiceRhythm(t, v);
    t = applyVoiceMetaphorDensity(t, v);
    return applyVoiceSilence(t, v);
  }
  if (style === "guided_perception") {
    const v: PerceptionVoiceProfile = {
      ...voice,
      pauseAffinity: Math.min(1, voice.pauseAffinity * 1.08),
      interiority: Math.min(1, voice.interiority * 1.05),
    };
    t = applyVoiceRhythm(t, v);
    t = applyVoiceSilence(t, v);
    t = applyVoiceMemoryStyle(t, v);
    return applyVoiceDiction(t, v);
  }
  t = applyVoiceRhythm(t, voice);
  t = applyVoiceSilence(t, voice);
  t = applyVoiceMemoryStyle(t, voice);
  t = applyVoiceMetaphorDensity(t, voice);
  t = applyVoiceInteriority(t, voice);
  return applyVoiceDiction(t, voice);
}

export function renderPerceptionUnit(
  unit: PerceptionUnit,
  voice: PerceptionVoiceProfile,
  style: VoiceFusionRenderStyle,
  fusion?: Pick<VoiceFusionOptions, "gravity">,
): string {
  if (unit.unitType === "silence") return "";
  const raw = unit.summary.trim();
  let t = stylePipeline(raw, voice, style);
  if (style === "immersive_perception" && fusion?.gravity) {
    t = applyPerceptualFragmentation(t, unit, fusion.gravity);
  }
  if (unit.internalConflictLine?.trim()) {
    t = `${t}\n${unit.internalConflictLine.trim()}`;
  }
  if (unit.misreadLine?.trim()) {
    t = `${t} ${unit.misreadLine.trim()}`;
  }
  return t;
}

export function renderPerceptionStream(
  units: PerceptionUnit[],
  voice: PerceptionVoiceProfile,
  options?: VoiceFusionOptions,
): string[] {
  const style = options?.style ?? "immersive_perception";
  const groups = groupPerceptionUnitsForRender(units);
  const byId = new Map(units.map((u) => [u.id, u] as const));
  const chunks: string[] = [];

  const grav = options?.gravity;
  for (const g of groups) {
    const merged = g.unitIds
      .map((id) => byId.get(id))
      .filter((u): u is PerceptionUnit => !!u)
      .map((u) => renderPerceptionUnit(u, voice, style, grav ? { gravity: grav } : undefined));
    const joiner = options?.mergeBreath === false ? "\n\n" : style === "minimal_perception" ? "\n" : "\n\n";
    const text = merged.join(joiner).trim();
    if (text) chunks.push(text);
  }
  return chunks;
}
