export type CinematicPassLike = {
  content: string;
  passType?: string | null;
};

function wordCount(t: string): number {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 1–5 composite quality score (heuristic; for author triage). */
export function scoreCinematicPass(pass: CinematicPassLike): {
  overall: number;
  flags: string[];
} {
  const flags: string[] = [];
  const t = pass.content?.trim() ?? "";
  if (!t.length) return { overall: 1, flags: ["empty"] };

  const wc = wordCount(t);
  const sens = sentences(t);
  const avgLen =
    sens.length > 0 ? sens.reduce((a, s) => a + s.length, 0) / sens.length : t.length;

  if (/^(the scene|this scene|in this passage|summary)/i.test(t)) flags.push("weak_entry");
  if (/\b(in conclusion|overall|the reader should|this demonstrates)\b/i.test(t))
    flags.push("overexplaining");
  if (/\b(very|really|quite|rather|somewhat)\b/gi.test(t) && (t.match(/\bvery\b/gi) ?? []).length > 4)
    flags.push("flat_intensifiers");

  const varLens = sens.map((s) => s.split(/\s+/).length);
  const flat =
    varLens.length >= 4 &&
    Math.max(...varLens) - Math.min(...varLens) < 4 &&
    avgLen > 55;
  if (flat) flags.push("flat_rhythm");

  if (wc > 28 && !/[—;:]/.test(t) && sens.length < 4) flags.push("breathless");

  if (!/[.!?]\s*$/.test(sens[sens.length - 1] ?? "") && sens.length > 0)
    flags.push("weak_exit");

  if (!/\b(he|she|they|i|we)\b/i.test(t) && wc > 80) flags.push("symbolic_deadness");

  const tonguetwist = (t.match(/\b(\w{4,})\s+\1\b/gi) ?? []).length;
  if (tonguetwist > 2 || avgLen > 140) flags.push("audio_unfriendly");

  let score = 4;
  for (const f of flags) {
    if (f === "overexplaining" || f === "weak_entry") score -= 1;
    if (f === "flat_rhythm" || f === "breathless") score -= 0.5;
    if (f === "weak_exit" || f === "symbolic_deadness" || f === "audio_unfriendly") score -= 0.5;
  }
  const overall = Math.min(5, Math.max(1, Math.round(score)));
  return { overall, flags };
}

export function detectOverexplaining(pass: CinematicPassLike): boolean {
  return scoreCinematicPass(pass).flags.includes("overexplaining");
}

export function detectFlatRhythm(pass: CinematicPassLike): boolean {
  return scoreCinematicPass(pass).flags.includes("flat_rhythm");
}

export function detectWeakEntry(pass: CinematicPassLike): boolean {
  return scoreCinematicPass(pass).flags.includes("weak_entry");
}

export function detectWeakExit(pass: CinematicPassLike): boolean {
  return scoreCinematicPass(pass).flags.includes("weak_exit");
}

export function detectSymbolicDeadness(pass: CinematicPassLike): boolean {
  return scoreCinematicPass(pass).flags.includes("symbolic_deadness");
}

export function detectAudioUnfriendliness(pass: CinematicPassLike): boolean {
  return scoreCinematicPass(pass).flags.includes("audio_unfriendly");
}
