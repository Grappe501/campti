import { buildAudioCueBundle, type AudioCueBundle } from "@/lib/audio-cue-map";
import { buildNarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import type { GravityTimingContext } from "@/lib/emotional-gravity";
import { deriveInternalizedGuidance, fuseGuidedPromptIntoPerceptionStream } from "@/lib/guided-fusion";
import {
  buildPerceptionStream,
  derivePerceptionTiming,
  type PerceptionUnit,
} from "@/lib/perception-stream";
import type { PublicSceneViewModel } from "@/lib/public-data";
import { getPublicSceneById } from "@/lib/public-data";
import {
  renderPerceptionUnit,
  resolveVoiceProfileForMetaScene,
  type PerceptionVoiceProfile,
  type VoiceFusionRenderStyle,
} from "@/lib/voice-fusion";

export type PublicExperienceModeInput = "reading" | "immersive" | "guided" | "listen";

export type ExperienceDisplayUnitType = PerceptionUnit["unitType"] | "narrative_body";

export type ExperiencePerceptionSegment = {
  id: string;
  text: string;
  displayUnitType: ExperienceDisplayUnitType;
  timingHint: NonNullable<PerceptionUnit["timingHint"]>;
  emotionalWeight?: number;
  isHold?: boolean;
  delayMs: number;
  holdExtraMs: number;
  /** Wordless perception beat: timing only, no copy (silence as meaning / pressure). */
  isSilenceBeat?: boolean;
  /** Internal: subtle guided styling (not shown as a labeled layer). */
  blend?: "guided_cue";
};

export type PublicPerceptionExperiencePayload = {
  feelSegments: ExperiencePerceptionSegment[];
  guidedSegments: ExperiencePerceptionSegment[];
  guidedMargins: string[];
  gravity: GravityTimingContext;
  audioCueHints: AudioCueBundle;
  voiceFingerprint: string;
};

export type PublicExperienceRenderResult = {
  mode: PublicExperienceModeInput;
  renderStyle: VoiceFusionRenderStyle;
  readingBody: string;
  segments: ExperiencePerceptionSegment[] | null;
  audioCueHints: AudioCueBundle | null;
  guidedMargins: string[];
};

function splitNarrativeBlocks(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function unitsToSegments(
  units: PerceptionUnit[],
  voice: PerceptionVoiceProfile,
  style: VoiceFusionRenderStyle,
  gravity: GravityTimingContext,
): ExperiencePerceptionSegment[] {
  const out: ExperiencePerceptionSegment[] = [];
  for (const unit of units) {
    const isSilence = unit.unitType === "silence";
    const text = isSilence
      ? ""
      : renderPerceptionUnit(unit, voice, style, { gravity }).trim();
    if (!text && !isSilence) continue;
    const { baseDelayMs, holdExtraMs } = derivePerceptionTiming(unit, gravity);
    out.push({
      id: unit.id,
      text,
      displayUnitType: unit.unitType,
      timingHint: unit.timingHint ?? "steady",
      emotionalWeight: unit.emotionalWeight,
      isHold: unit.timingHint === "hold" || isSilence,
      delayMs: baseDelayMs,
      holdExtraMs,
      isSilenceBeat: isSilence,
      blend: unit.notes === "guided_cue" ? "guided_cue" : undefined,
    });
  }
  return out;
}

function narrativeSegments(
  readingBody: string,
  gravity: GravityTimingContext,
): ExperiencePerceptionSegment[] {
  const blocks = splitNarrativeBlocks(readingBody);
  return blocks.map((text, i) => ({
    id: `narr-${i}`,
    text,
    displayUnitType: "narrative_body" as const,
    timingHint: "steady" as const,
    emotionalWeight: 0.38 + gravity.overallPressure * 0.22,
    delayMs: Math.round(400 * (1 + gravity.tenderness * 0.22 - gravity.threat * 0.08)),
    holdExtraMs: gravity.mystery > 0.55 ? Math.round(180 + gravity.mystery * 120) : 0,
  }));
}

function mergePreambleAndBody(
  preamble: ExperiencePerceptionSegment[],
  body: ExperiencePerceptionSegment[],
): ExperiencePerceptionSegment[] {
  return [...preamble, ...body];
}

function voiceFingerprint(v: PerceptionVoiceProfile): string {
  return [
    v.sentenceLengthBias,
    v.pauseAffinity.toFixed(2),
    v.metaphorDensity.toFixed(2),
    v.memoryStyle,
  ].join("|");
}

/**
 * Server-only: one serialized payload for Feel + Guided immersive paths.
 * Returns null when no meta scene or on quiet failure.
 */
export async function buildPublicPerceptionPayload(
  vm: PublicSceneViewModel,
): Promise<PublicPerceptionExperiencePayload | null> {
  const metaSceneId = vm.metaSceneId;
  if (!metaSceneId || !vm.readingBody.trim()) return null;
  try {
    const stream = await buildPerceptionStream(metaSceneId, {
      readingText: vm.readingBody,
      includeContinuationUnit: false,
    });
    if (!stream?.units.length) return null;

    const ctx = await buildNarrativeConsciousnessContext(metaSceneId, { publicOnly: true });
    const voice = await resolveVoiceProfileForMetaScene(metaSceneId, ctx);
    const fp = voiceFingerprint(voice);

    const guidance = await deriveInternalizedGuidance(metaSceneId);
    const guidedPrompts = [...guidance.marginCues, ...guidance.attentionCues];
    const guidedUnits = fuseGuidedPromptIntoPerceptionStream(stream.units, guidedPrompts);

    const feelPre = unitsToSegments(stream.units, voice, "immersive_perception", stream.gravity);
    const guidedPre = unitsToSegments(guidedUnits, voice, "guided_perception", stream.gravity);
    const narr = narrativeSegments(vm.readingBody, stream.gravity);

    const feelSegments = mergePreambleAndBody(feelPre, narr);
    const guidedSegments = mergePreambleAndBody(guidedPre, narr);

    const audioCueHints = buildAudioCueBundle(stream.units);

    return {
      feelSegments,
      guidedSegments,
      guidedMargins: guidance.marginCues,
      gravity: stream.gravity,
      audioCueHints,
      voiceFingerprint: fp,
    };
  } catch {
    return null;
  }
}

export async function buildPublicExperienceRender(
  sceneId: string,
  mode: PublicExperienceModeInput,
): Promise<PublicExperienceRenderResult | null> {
  const vm = await getPublicSceneById(sceneId);
  if (!vm) return null;
  const payload = await buildPublicPerceptionPayload(vm);
  return mapPayloadToRender(vm, mode, payload);
}

function mapPayloadToRender(
  vm: PublicSceneViewModel,
  mode: PublicExperienceModeInput,
  payload: PublicPerceptionExperiencePayload | null,
): PublicExperienceRenderResult {
  const readingBody = vm.readingBody;
  if (mode === "reading") {
    return {
      mode,
      renderStyle: "minimal_perception",
      readingBody,
      segments: null,
      audioCueHints: null,
      guidedMargins: [],
    };
  }
  if (!payload) {
    return {
      mode,
      renderStyle: mode === "guided" ? "guided_perception" : "immersive_perception",
      readingBody,
      segments: null,
      audioCueHints: null,
      guidedMargins: [],
    };
  }
  if (mode === "listen") {
    return {
      mode,
      renderStyle: "minimal_perception",
      readingBody,
      segments: payload.feelSegments,
      audioCueHints: payload.audioCueHints,
      guidedMargins: [],
    };
  }
  if (mode === "guided") {
    return {
      mode,
      renderStyle: "guided_perception",
      readingBody,
      segments: payload.guidedSegments,
      audioCueHints: payload.audioCueHints,
      guidedMargins: payload.guidedMargins,
    };
  }
  return {
    mode,
    renderStyle: "immersive_perception",
    readingBody,
    segments: payload.feelSegments,
    audioCueHints: payload.audioCueHints,
    guidedMargins: [],
  };
}

export async function buildFeelModeRender(
  sceneId: string,
): Promise<PublicExperienceRenderResult | null> {
  return buildPublicExperienceRender(sceneId, "immersive");
}

export async function buildGuidedModeRender(
  sceneId: string,
): Promise<PublicExperienceRenderResult | null> {
  return buildPublicExperienceRender(sceneId, "guided");
}

export async function buildListenModeRender(
  sceneId: string,
): Promise<PublicExperienceRenderResult | null> {
  return buildPublicExperienceRender(sceneId, "listen");
}

export async function buildReadingModeRender(
  sceneId: string,
): Promise<PublicExperienceRenderResult | null> {
  return buildPublicExperienceRender(sceneId, "reading");
}
