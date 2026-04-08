import type { PerceptionUnit, PerceptionStream } from "@/lib/perception-stream";

export type NarrativeCadenceHint = {
  atUnitIndex: number;
  unitId: string;
  cadence: "open" | "tight" | "suspended" | "release";
};

export type AmbientShiftHint = {
  atUnitIndex: number;
  unitId: string;
  shift: "warm" | "cool" | "thin" | "dense" | "still";
};

export type ExperienceAudioCueKind =
  | "memory_rise"
  | "threat_pulse"
  | "silence_hold"
  | "symbolic_charge"
  | "transition_soft"
  | "transition_sharp";

export type AudioCueHint = {
  unitId: string;
  unitIndex: number;
  kind: ExperienceAudioCueKind;
  weight: number;
};

export type AudioCueBundle = {
  cues: AudioCueHint[];
  ambientShifts: AmbientShiftHint[];
  narrationCadence: NarrativeCadenceHint[];
};

export function deriveAudioCueHints(stream: PerceptionUnit[]): AudioCueHint[] {
  const cues: AudioCueHint[] = [];
  stream.forEach((u, unitIndex) => {
    let kind: ExperienceAudioCueKind | null = null;
    let weight = 0.5;
    if (u.unitType === "bodily_response" && (u.memoryCharge ?? 0) > 0.4) {
      kind = "memory_rise";
      weight = u.memoryCharge ?? 0.55;
    } else if (u.tensionDelta && u.tensionDelta > 0.5) {
      kind = "threat_pulse";
      weight = u.tensionDelta;
    } else if (u.unitType === "silence") {
      kind = "silence_hold";
      weight = 0.62 + (u.silenceWeight ?? 0) * 0.25;
    } else if (u.timingHint === "hold" || u.unitType === "unspoken_thought") {
      kind = "silence_hold";
      weight = 0.55 + (u.emotionalWeight ?? 0) * 0.2;
    } else if (u.unitType === "symbolic_charge") {
      kind = "symbolic_charge";
      weight = 0.62;
    } else if (u.unitType === "emotional_shift") {
      kind = u.tensionDelta && u.tensionDelta > 0.45 ? "transition_sharp" : "transition_soft";
      weight = 0.48;
    }
    if (kind) {
      cues.push({ unitId: u.id, unitIndex, kind, weight: Math.min(1, weight) });
    }
  });
  return cues;
}

export function deriveAmbientShiftHints(stream: PerceptionUnit[]): AmbientShiftHint[] {
  return stream.map((u, atUnitIndex) => {
    let shift: AmbientShiftHint["shift"] = "still";
    if (u.unitType === "silence") shift = "still";
    else if (u.unitType === "sensory") shift = u.emotionalWeight && u.emotionalWeight > 0.55 ? "dense" : "thin";
    else if (u.unitType === "environmental_pressure") shift = "cool";
    else if (u.unitType === "emotional_shift" && (u.emotionalWeight ?? 0) > 0.6) shift = "warm";
    else if (u.timingHint === "hold") shift = "still";
    return { atUnitIndex, unitId: u.id, shift };
  });
}

export function deriveNarrationCadenceHints(stream: PerceptionUnit[]): NarrativeCadenceHint[] {
  return stream.map((u, atUnitIndex) => {
    let cadence: NarrativeCadenceHint["cadence"] = "open";
    if (u.timingHint === "quick" || (u.tensionDelta ?? 0) > 0.55) cadence = "tight";
    else if (u.unitType === "silence") cadence = "suspended";
    else if (u.timingHint === "hold" || u.unitType === "unspoken_thought") cadence = "suspended";
    else if (u.unitType === "continuation_impulse") cadence = "release";
    return { atUnitIndex, unitId: u.id, cadence };
  });
}

export function buildAudioCueBundle(stream: PerceptionUnit[]): AudioCueBundle {
  return {
    cues: deriveAudioCueHints(stream),
    ambientShifts: deriveAmbientShiftHints(stream),
    narrationCadence: deriveNarrationCadenceHints(stream),
  };
}

export function deriveAudioCueHintsFromStream(
  perception: PerceptionStream | null,
): AudioCueBundle | null {
  if (!perception?.units.length) return null;
  return buildAudioCueBundle(perception.units);
}
