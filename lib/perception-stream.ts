import {
  buildNarrativeConsciousnessContext,
  deriveBodilyExperience,
  deriveDelayedMeaning,
  deriveEmotionalUndercurrent,
  deriveNarrativeGravityHooks,
  derivePovPerceptualField,
  deriveUnspokenThoughtStream,
  deriveContinuationImpulse as narrativeContinuationLine,
  type NarrativeConsciousnessContext,
} from "@/lib/narrative-consciousness";
import { buildGravityTimingContext, type GravityTimingContext } from "@/lib/emotional-gravity";

export type PerceptionTimingHint = "linger" | "steady" | "quick" | "hold";

export type PerceptionUnitType =
  | "sensory"
  | "environmental_pressure"
  | "bodily_response"
  | "emotional_shift"
  | "unspoken_thought"
  | "partial_meaning"
  | "relationship_pressure"
  | "symbolic_charge"
  | "continuation_impulse"
  /** Wordless beat: timing and hold only (see deriveSilenceWeight / injectSilenceBeats). */
  | "silence";

export type PerceptionUnit = {
  id: string;
  unitType: PerceptionUnitType;
  summary: string;
  rawText?: string;
  emotionalWeight?: number;
  tensionDelta?: number;
  memoryCharge?: number;
  voicePriority?: number;
  timingHint?: PerceptionTimingHint;
  notes?: string;
  /** Corrective or delayed read, fused after the main line in voice (misinterpretation layer). */
  misreadLine?: string;
  /** Subtle contradiction, rendered as a separate short line (not exposition). */
  internalConflictLine?: string;
  /** 0–1 from deriveSilenceWeight; extends hold in derivePerceptionTiming. */
  silenceWeight?: number;
  /** Imperfect continuity: perceptual jump / gap before this beat. */
  perceptionGap?: boolean;
};

export type PerceptionStreamOptions = {
  /** Public narrative text shown on the reader (aligns with approved pass). */
  readingText: string;
  /** Max awareness units before narrative body (keeps manuscript primary). */
  preambleCap?: number;
  /** When false, omits continuation beat (public reader uses nav for that). Default false. */
  includeContinuationUnit?: boolean;
};

export type PerceptionStream = {
  metaSceneId: string;
  units: PerceptionUnit[];
  gravity: GravityTimingContext;
  readingText: string;
};

export type PerceptionRenderGroup = {
  key: string;
  unitIds: string[];
  timingHint: PerceptionTimingHint;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function clip(s: string | null | undefined, max: number): string {
  const t = s?.replace(/\s+/g, " ").trim() ?? "";
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

/** Deterministic 0–1 draws for a scene (stable across rebuilds). */
export function sceneRng(metaSceneId: string, salt: string): () => number {
  let h = 0;
  const s = `${metaSceneId}:${salt}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  let state = (Math.abs(h) || 1) >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function swap<T>(arr: T[], i: number, j: number): void {
  if (i === j || i < 0 || j < 0 || i >= arr.length || j >= arr.length) return;
  const t = arr[i]!;
  arr[i] = arr[j]!;
  arr[j] = t;
}

/**
 * Occasionally reorders micro-beats so meaning lags, tension leads, or symbolic recognition slips.
 */
export function applyPerceptionDrift(
  units: PerceptionUnit[],
  context: NarrativeConsciousnessContext,
  gravity: GravityTimingContext,
): PerceptionUnit[] {
  const out = [...units];
  const rng = sceneRng(context.metaSceneId, "drift");
  const roll = rng();

  if (roll < 0.28 + gravity.mystery * 0.14) {
    const i = out.findIndex(
      (u) => u.unitType === "partial_meaning" && u.notes !== "unresolved" && !u.notes?.startsWith("return"),
    );
    if (i >= 0 && i < out.length - 1) {
      const next = out[i + 1]!;
      if (next.unitType !== "continuation_impulse" && next.unitType !== "silence") {
        swap(out, i, i + 1);
      }
    }
  } else if (roll < 0.42 + gravity.threat * 0.1) {
    const sym = out.findIndex((u) => u.unitType === "symbolic_charge");
    const emo = out.findIndex((u) => u.unitType === "emotional_shift");
    if (sym >= 0 && emo >= 0 && sym > emo) {
      const [piece] = out.splice(sym, 1);
      out.splice(emo, 0, piece!);
    }
  } else if (roll < 0.52) {
    const rel = out.findIndex((u) => u.unitType === "relationship_pressure");
    const env = out.findIndex((u) => u.unitType === "environmental_pressure");
    if (rel >= 0 && env >= 0 && rel > env + 1) {
      const [piece] = out.splice(rel, 1);
      out.splice(env + 1, 0, piece!);
    }
  }

  return out;
}

/**
 * A single corrective line for this unit (first impression vs what the scene will not let stay true).
 */
export function deriveMisread(unit: PerceptionUnit, context: NarrativeConsciousnessContext): string | null {
  const t = unit.summary.toLowerCase();
  const hasPressure =
    Boolean(context.metaFields.centralConflict?.trim()) ||
    Boolean(context.povPerson.profile?.coreFear?.trim()) ||
    Boolean(context.relationships[0]?.tension?.trim());

  if (unit.unitType === "sensory" && /\b(nothing|empty|still|quiet|calm|fine)\b/.test(t) && hasPressure) {
    return "—except the read won’t stay that innocent.";
  }
  if (unit.unitType === "emotional_shift" && /\b(calm|ease|soft|light|bright)\b/.test(t)) {
    return "—the body doesn’t fully sign off on calm.";
  }
  if (unit.unitType === "relationship_pressure" && /\b(fine|okay|alright|loves?|trust)\b/.test(t)) {
    return "—part of the mind files that verdict as provisional.";
  }
  if (unit.unitType === "symbolic_charge" && hasPressure) {
    return "—recognition arrives a beat late, then bites.";
  }
  if (unit.unitType === "partial_meaning" && unit.notes !== "unresolved") {
    return "—what seemed settled loosens the moment you name it.";
  }
  return null;
}

function attachMisreadLayer(units: PerceptionUnit[], context: NarrativeConsciousnessContext): PerceptionUnit[] {
  let placed = 0;
  const maxMisreads = 1;
  for (const u of units) {
    if (placed >= maxMisreads) break;
    if (
      u.unitType === "silence" ||
      u.notes === "guided_cue" ||
      u.misreadLine ||
      u.notes?.startsWith("return")
    ) {
      continue;
    }
    const line = deriveMisread(u, context);
    if (line) {
      u.misreadLine = line;
      placed++;
    }
  }
  return units;
}

/**
 * Echoes an earlier beat so consciousness circles back (fire, silence, face, smell).
 */
export function injectReturnUnits(
  units: PerceptionUnit[],
  context: NarrativeConsciousnessContext,
): PerceptionUnit[] {
  const rng = sceneRng(context.metaSceneId, "return");
  if (rng() > 0.38 + (context.metaFields.centralConflict?.trim() ? 0.12 : 0)) {
    return units;
  }

  const candidate = units.find(
    (u) =>
      (u.unitType === "sensory" ||
        u.unitType === "bodily_response" ||
        u.unitType === "symbolic_charge") &&
      u.summary.trim().length > 28 &&
      !u.notes?.startsWith("return"),
  );
  if (!candidate) return units;

  const smell = context.place.setting?.smells?.trim();
  const sound = context.place.setting?.sounds?.trim();
  const tail =
    smell && rng() < 0.45
      ? ` — ${smell.slice(0, 72)}${smell.length > 72 ? "…" : ""} again.`
      : sound && rng() < 0.5
        ? ` — ${sound.slice(0, 64)}${sound.length > 64 ? "…" : ""}, the ear returning.`
        : " — the mind passes it twice, unwilling to let the first read stand alone.";

  const echo: PerceptionUnit = {
    ...candidate,
    id: `return-${candidate.id}`,
    summary: `${candidate.summary.trim().slice(0, 100)}${candidate.summary.trim().length > 100 ? "…" : ""}${tail}`,
    voicePriority: clamp((candidate.voicePriority ?? 0.65) * 0.82, 0.2, 0.95),
    timingHint: "linger",
    notes: "return_echo",
    misreadLine: undefined,
    internalConflictLine: undefined,
  };

  const unresolvedIdx = units.findIndex((u) => u.unitType === "partial_meaning" && u.notes === "unresolved");
  const insertAt =
    unresolvedIdx > 1 ? unresolvedIdx - 1 : Math.min(units.length - 1, Math.max(2, units.length - 2));

  const out = [...units];
  out.splice(insertAt, 0, echo);
  return out;
}

/**
 * Pulls a split impulse from profile / relationship / conflict (contradiction, not therapy-speak).
 */
export function deriveInternalConflict(context: NarrativeConsciousnessContext): string | null {
  const ic = context.povPerson.profile?.internalConflicts?.trim();
  if (ic) {
    const frag = ic.slice(0, 110);
    return `${frag}${ic.length > 110 ? "…" : ""} — wants one thing, braces for another.`;
  }
  const rel = context.relationships[0];
  if (rel?.tension?.trim() && rel?.emotional?.trim()) {
    return `Care and doubt share a pulse toward ${rel.otherName}.`;
  }
  if (context.metaFields.centralConflict?.trim() && context.povPerson.profile?.coreFear?.trim()) {
    return "Loyalty to the moment’s peace fights loyalty to what the body already knows.";
  }
  if (context.metaFields.socialConstraints?.trim()) {
    return "The face behaves; something underneath does not.";
  }
  return null;
}

function attachInternalConflictOverlay(
  units: PerceptionUnit[],
  context: NarrativeConsciousnessContext,
): PerceptionUnit[] {
  const line = deriveInternalConflict(context);
  if (!line) return units;
  const host = units.find((u) => u.unitType === "unspoken_thought" && u.notes !== "guided_cue");
  if (host && !host.internalConflictLine) {
    host.internalConflictLine = line;
  }
  return units;
}

/**
 * How much this beat should “sit” in silence (meaning, pressure, avoidance, reverence).
 */
export function deriveSilenceWeight(unit: PerceptionUnit, context: NarrativeConsciousnessContext): number {
  if (unit.unitType === "silence") return 0.85;

  let w = 0;
  const sum = unit.summary.toLowerCase();
  if (unit.unitType === "unspoken_thought" || unit.notes === "withheld") w += 0.32;
  if (unit.notes === "internal_conflict" || unit.internalConflictLine) w += 0.12;
  if (/\b(silence|quiet|still|hush|pause|nothing\s+said)\b/.test(sum)) w += 0.28;
  if (context.povPerson.profile?.defensiveStyle?.trim()) w += 0.1;
  if (context.metaFields.socialConstraints?.trim()) w += 0.08;
  if (context.metaFields.historicalConstraints?.trim()) w += 0.06;
  const sounds = context.place.setting?.sounds?.toLowerCase() ?? "";
  if (/\b(quiet|hush|still|mute)\b/.test(sounds)) w += 0.1;
  if (unit.unitType === "symbolic_charge" || unit.unitType === "partial_meaning") w += 0.08;
  return clamp(w, 0, 1);
}

function applySilenceWeights(units: PerceptionUnit[], context: NarrativeConsciousnessContext): PerceptionUnit[] {
  for (const u of units) {
    u.silenceWeight = deriveSilenceWeight(u, context);
  }
  return units;
}

function silenceRoleNote(context: NarrativeConsciousnessContext, rng: () => number): string {
  const threat = Boolean(context.metaFields.centralConflict?.trim());
  const tender = Boolean(context.povPerson.profile?.emotionalBaseline?.trim());
  if (threat && rng() < 0.45) return "silence:pressure";
  if (tender && rng() < 0.4) return "silence:reverence";
  if (context.povPerson.profile?.defensiveStyle?.trim() && rng() < 0.5) return "silence:avoidance";
  return "silence:meaning";
}

/**
 * Inserts one wordless beat when gravity asks for room between thoughts.
 */
export function injectSilenceBeats(
  units: PerceptionUnit[],
  context: NarrativeConsciousnessContext,
  gravity: GravityTimingContext,
): PerceptionUnit[] {
  const rng = sceneRng(context.metaSceneId, "silence-beat");
  const threshold = 0.22 + gravity.mystery * 0.22 + gravity.tenderness * 0.12;
  if (rng() > threshold || units.length < 4) return units;

  const inner = units.filter((u) => u.unitType !== "continuation_impulse" && u.unitType !== "silence");
  if (inner.length < 3) return units;

  const idx = 1 + Math.floor(rng() * (inner.length - 2));
  const anchor = inner[idx];
  if (!anchor) return units;
  const pos = units.indexOf(anchor);
  if (pos <= 0) return units;

  const beat: PerceptionUnit = {
    id: makeId("silence", pos),
    unitType: "silence",
    summary: "",
    timingHint: "hold",
    emotionalWeight: 0.22,
    voicePriority: 0.05,
    silenceWeight: 0.9,
    notes: silenceRoleNote(context, rng),
  };

  const out = [...units];
  out.splice(pos, 0, beat);
  return out;
}

/**
 * Marks a few beats for jumpier rhythm (cinematic discontinuity).
 */
export function applyImperfectContinuity(
  units: PerceptionUnit[],
  context: NarrativeConsciousnessContext,
  gravity: GravityTimingContext,
): PerceptionUnit[] {
  const rng = sceneRng(context.metaSceneId, "gap");
  if (gravity.threat < 0.32 && gravity.mystery < 0.4) return units;

  const candidates = units
    .map((u, i) => ({ u, i }))
    .filter(
      ({ u, i }) =>
        i > 0 &&
        i < units.length - 1 &&
        u.unitType !== "silence" &&
        u.unitType !== "continuation_impulse" &&
        u.notes !== "guided_cue",
    );
  if (!candidates.length) return units;

  const pick = candidates[Math.floor(rng() * candidates.length)];
  if (pick) pick.u.perceptionGap = true;

  if (rng() < 0.35 + gravity.mystery * 0.15) {
    const second = candidates.filter((c) => c.u !== pick?.u);
    const p2 = second[Math.floor(rng() * second.length)];
    if (p2) p2.u.perceptionGap = true;
  }

  return units;
}

function hintFromWeight(weight: number, tension: number): PerceptionTimingHint {
  if (tension > 0.65) return "quick";
  if (weight > 0.72) return "linger";
  if (weight < 0.28) return "steady";
  return "steady";
}

/** First-moment awareness: attention + immediate field. */
export function deriveImmediatePerception(
  context: NarrativeConsciousnessContext,
): PerceptionUnit {
  const field = clip(derivePovPerceptualField(context), 320);
  const sensory = clip(context.metaFields.sensoryField, 200);
  const summary = sensory || field || `${context.povPerson.name} arrives into ${context.place.name}.`;
  const w = clamp((summary.length / 400) * 0.5 + (sensory ? 0.25 : 0), 0, 1);
  return {
    id: makeId("immediate", 0),
    unitType: "sensory",
    summary,
    rawText: field || undefined,
    emotionalWeight: w,
    timingHint: sensory ? "linger" : "steady",
    voicePriority: 0.9,
  };
}

/** Environment as force on POV (not wallpaper). */
export function deriveEnvironmentalPressure(
  context: NarrativeConsciousnessContext,
): PerceptionUnit {
  const env = clip(
    [context.metaFields.environmentDescription, context.place.setting?.physicalDescription]
      .filter(Boolean)
      .join(" — "),
    360,
  );
  const social = clip(context.metaFields.socialConstraints, 220);
  const summary =
    env && social
      ? `${env} The air carries expectation: ${social.slice(0, 140)}${social.length > 140 ? "…" : ""}`
      : env || social || `The place insists—${context.place.name} does not stay neutral.`;
  const tension = clamp(
    (social ? 0.35 : 0) + (context.metaFields.centralConflict ? 0.2 : 0),
    0,
    1,
  );
  return {
    id: makeId("env", 0),
    unitType: "environmental_pressure",
    summary,
    rawText: env || undefined,
    tensionDelta: tension,
    emotionalWeight: 0.45 + tension * 0.3,
    timingHint: tension > 0.45 ? "quick" : "linger",
    voicePriority: 0.75,
  };
}

export function deriveBodilyResponse(context: NarrativeConsciousnessContext): PerceptionUnit {
  const body = clip(deriveBodilyExperience(context), 300);
  const summary =
    body ||
    clip(
      [context.place.setting?.textures, context.place.setting?.lightingConditions]
        .filter(Boolean)
        .join(" · "),
      260,
    ) ||
    "The body keeps its own counsel—tight or open, seen or hidden.";
  const w = clamp(summary.length / 380, 0.2, 0.95);
  return {
    id: makeId("body", 0),
    unitType: "bodily_response",
    summary,
    emotionalWeight: w,
    memoryCharge: context.povPerson.profile?.griefPattern ? 0.55 : 0.25,
    timingHint: "steady",
    voicePriority: 0.7,
  };
}

export function deriveEmotionalShift(context: NarrativeConsciousnessContext): PerceptionUnit {
  const under = clip(deriveEmotionalUndercurrent(context), 320);
  const volt = clip(context.metaFields.emotionalVoltage, 180);
  const summary = volt && under ? `${volt} — ${under.slice(0, 200)}` : under || volt || "Feeling moves before it is named.";
  const w = clamp(0.35 + (volt ? 0.2 : 0) + (under.length > 120 ? 0.15 : 0), 0, 1);
  return {
    id: makeId("emo", 0),
    unitType: "emotional_shift",
    summary,
    tensionDelta: context.metaFields.centralConflict ? 0.4 : 0.2,
    emotionalWeight: w,
    timingHint: hintFromWeight(w, context.metaFields.centralConflict ? 0.5 : 0.2),
    voicePriority: 0.85,
  };
}

export function deriveUnspokenThought(context: NarrativeConsciousnessContext): PerceptionUnit {
  const thought = clip(deriveUnspokenThoughtStream(context), 300);
  const summary =
    thought ||
    clip(context.povPerson.profile?.internalConflicts, 240) ||
    "Something is being held back from language.";
  const conceal = context.povPerson.profile?.defensiveStyle ? 0.55 : 0.3;
  return {
    id: makeId("thought", 0),
    unitType: "unspoken_thought",
    summary,
    emotionalWeight: 0.5 + conceal * 0.2,
    timingHint: "hold",
    voicePriority: 0.95,
    notes: "withheld",
  };
}

export function derivePartialMeaning(context: NarrativeConsciousnessContext): PerceptionUnit {
  const delayed = deriveDelayedMeaning(context);
  const sym = clip(context.metaFields.symbolicElements, 200);
  const core = clip(delayed, 260);
  const summary =
    core && sym
      ? `${sym} — only partly legible: ${core.slice(0, 140)}…`
      : core || sym || "Meaning flickers—complete sense is not yet due.";
  return {
    id: makeId("partial", 0),
    unitType: "partial_meaning",
    summary,
    emotionalWeight: 0.4,
    timingHint: "linger",
    voicePriority: 0.5,
  };
}

export function deriveUnresolvedTension(context: NarrativeConsciousnessContext): PerceptionUnit {
  const hooks = deriveNarrativeGravityHooks(context);
  const conflict = clip(context.metaFields.centralConflict, 280);
  const relT = context.relationships[0]?.tension?.trim();
  const summary =
    conflict ||
    (relT ? `Between bodies: ${clip(relT, 220)}` : null) ||
    hooks[0]?.replace(/^The unresolved pressure:\s*/i, "") ||
    "Tension remains honest company—it does not resolve on command.";
  const td = clamp(0.35 + (conflict ? 0.25 : 0) + (relT ? 0.15 : 0), 0, 1);
  return {
    id: makeId("tension", 0),
    unitType: "partial_meaning",
    summary,
    rawText: hooks.length ? hooks.join(" | ") : undefined,
    tensionDelta: td,
    timingHint: td > 0.55 ? "quick" : "hold",
    voicePriority: 0.65,
    notes: "unresolved",
  };
}

/** Continuation pull as a perception beat (string helper lives in narrative-consciousness). */
export function deriveContinuationImpulse(
  context: NarrativeConsciousnessContext,
): PerceptionUnit {
  const line = narrativeContinuationLine(context);
  return {
    id: makeId("continue", 0),
    unitType: "continuation_impulse",
    summary: clip(line, 240),
    emotionalWeight: 0.55,
    timingHint: "steady",
    voicePriority: 0.4,
  };
}

function relationshipUnit(context: NarrativeConsciousnessContext): PerceptionUnit | null {
  const r = context.relationships[0];
  if (!r) return null;
  const summary = clip(r.tension || r.emotional || r.summary, 300);
  if (!summary) return null;
  return {
    id: makeId("rel", 0),
    unitType: "relationship_pressure",
    summary,
    tensionDelta: r.tension ? 0.55 : 0.3,
    emotionalWeight: 0.6,
    timingHint: "steady",
    voicePriority: 0.72,
  };
}

function symbolicUnit(context: NarrativeConsciousnessContext): PerceptionUnit | null {
  const sym = context.metaFields.symbolicElements?.trim();
  if (!sym) return null;
  return {
    id: makeId("sym", 0),
    unitType: "symbolic_charge",
    summary: clip(sym, 280),
    emotionalWeight: 0.42,
    memoryCharge: 0.35,
    timingHint: "linger",
    voicePriority: 0.55,
  };
}

const TYPE_ORDER: PerceptionUnitType[] = [
  "sensory",
  "environmental_pressure",
  "bodily_response",
  "emotional_shift",
  "unspoken_thought",
  "relationship_pressure",
  "symbolic_charge",
  "partial_meaning",
  "silence",
  "continuation_impulse",
];

/** Re-order micro-units like consciousness (with light gravity bias). */
export function orderUnitsForConsciousness(
  units: PerceptionUnit[],
  gravity: GravityTimingContext,
): PerceptionUnit[] {
  const rank = (t: PerceptionUnitType) => {
    const i = TYPE_ORDER.indexOf(t);
    return i < 0 ? 99 : i;
  };

  const sorted = [...units].sort((a, b) => {
    if (gravity.threat > gravity.tenderness + 0.12 && gravity.threat > 0.45) {
      const pri = (u: PerceptionUnit) =>
        u.unitType === "environmental_pressure"
          ? 0
          : u.unitType === "emotional_shift"
            ? 1
            : u.unitType === "bodily_response"
              ? 2
              : 10 + rank(u.unitType);
      return pri(a) - pri(b);
    }
    if (gravity.mystery > 0.55) {
      if (a.unitType === "partial_meaning" && a.notes !== "unresolved") return 1;
      if (b.unitType === "partial_meaning" && b.notes !== "unresolved") return -1;
    }
    return rank(a.unitType) - rank(b.unitType);
  });

  const out: PerceptionUnit[] = [];
  const seen = new Set<string>();
  for (const u of sorted) {
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  return out;
}

export function derivePerceptionTiming(
  unit: PerceptionUnit,
  gravity: GravityTimingContext,
): { baseDelayMs: number; holdExtraMs: number; groupWithPrevious: boolean } {
  const base: Record<PerceptionTimingHint, number> = {
    linger: 1120,
    steady: 520,
    quick: 220,
    hold: 2080,
  };
  const hint = unit.timingHint ?? "steady";
  let ms = base[hint];
  ms *= 1 + gravity.tenderness * 0.38;
  ms *= 1 - gravity.threat * 0.22;
  if (hint === "hold" || unit.unitType === "unspoken_thought") {
    ms += gravity.mystery * 420;
  }
  if (unit.unitType === "partial_meaning" && unit.notes === "unresolved") {
    ms += gravity.longing * 360;
  }
  if (unit.unitType === "continuation_impulse") {
    ms = Math.min(ms, 640);
  }
  if (unit.unitType === "silence") {
    ms = Math.round(680 + gravity.mystery * 520 + gravity.tenderness * 380);
  }
  if (unit.perceptionGap) {
    ms = Math.round(ms * 1.32 + gravity.threat * 180);
  }
  let holdExtra =
    hint === "hold" ? Math.round(400 + gravity.mystery * 500 + gravity.longing * 320) : 0;
  if (unit.unitType === "silence") {
    holdExtra = Math.round(520 + gravity.mystery * 640 + gravity.threat * 420 + gravity.longing * 260);
  }
  const sw = unit.silenceWeight ?? 0;
  if (sw > 0) {
    const silenceHoldScale = hint === "quick" ? 0.28 : hint === "steady" ? 0.58 : 1;
    holdExtra += Math.round(
      sw * (260 + gravity.mystery * 420 + gravity.tenderness * 240) * silenceHoldScale,
    );
  }
  if (unit.perceptionGap) {
    holdExtra += Math.round(140 + gravity.threat * 260 + gravity.mystery * 160);
  }
  const groupWithPrevious =
    unit.unitType === "environmental_pressure" && gravity.threat < 0.35;
  return {
    baseDelayMs: Math.round(clamp(ms, 160, 4200)),
    holdExtraMs: holdExtra,
    groupWithPrevious,
  };
}

export function groupPerceptionUnitsForRender(units: PerceptionUnit[]): PerceptionRenderGroup[] {
  const groups: PerceptionRenderGroup[] = [];
  let i = 0;
  while (i < units.length) {
    const u = units[i];
    if (u.unitType === "silence") {
      groups.push({ key: `grp-${i}`, unitIds: [u.id], timingHint: "hold" });
      i += 1;
      continue;
    }
    const hint = u.timingHint ?? "steady";
    if (
      u.unitType === "sensory" &&
      units[i + 1]?.unitType === "environmental_pressure" &&
      (units[i + 1]?.tensionDelta ?? 0) < 0.42
    ) {
      groups.push({
        key: `grp-${i}`,
        unitIds: [u.id, units[i + 1]!.id],
        timingHint: "linger",
      });
      i += 2;
      continue;
    }
    groups.push({ key: `grp-${i}`, unitIds: [u.id], timingHint: hint });
    i += 1;
  }
  return groups;
}

export async function buildPerceptionUnits(
  metaSceneId: string,
  options?: Partial<PerceptionStreamOptions>,
): Promise<PerceptionUnit[]> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
    includeRelationships: true,
  });
  if (!ctx) return [];
  const gravity = await buildGravityTimingContext(metaSceneId);
  const cap = options?.preambleCap ?? 7;

  const core: PerceptionUnit[] = [
    deriveImmediatePerception(ctx),
    deriveEnvironmentalPressure(ctx),
    deriveBodilyResponse(ctx),
    deriveEmotionalShift(ctx),
    deriveUnspokenThought(ctx),
  ];

  const rel = relationshipUnit(ctx);
  if (rel) core.push(rel);

  const sym = symbolicUnit(ctx);
  if (sym) core.push(sym);

  core.push(derivePartialMeaning(ctx));

  const tension = deriveUnresolvedTension(ctx);
  if (tension.summary !== core[core.length - 1]?.summary) {
    core.push(tension);
  }

  const cont = deriveContinuationImpulse(ctx);
  if (options?.includeContinuationUnit === true) {
    core.push(cont);
  }

  let tuned = orderUnitsForConsciousness(core, gravity);
  tuned = applyPerceptionDrift(tuned, ctx, gravity);
  tuned = injectReturnUnits(tuned, ctx);
  tuned = attachInternalConflictOverlay(tuned, ctx);
  tuned = attachMisreadLayer(tuned, ctx);
  tuned = injectSilenceBeats(tuned, ctx, gravity);
  tuned = applySilenceWeights(tuned, ctx);
  tuned = applyImperfectContinuity(tuned, ctx, gravity);

  const preamble = tuned
    .filter((u) => u.unitType !== "continuation_impulse")
    .slice(0, cap);
  if (options?.includeContinuationUnit === true) {
    return [...preamble, cont];
  }
  return preamble;
}

export async function buildPerceptionStream(
  metaSceneId: string,
  options?: Partial<PerceptionStreamOptions>,
): Promise<PerceptionStream | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
    includeRelationships: true,
  });
  if (!ctx) return null;
  const gravity = await buildGravityTimingContext(metaSceneId);
  const units = await buildPerceptionUnits(metaSceneId, options);
  return {
    metaSceneId,
    units,
    gravity,
    readingText: options?.readingText?.trim() ?? "",
  };
}
