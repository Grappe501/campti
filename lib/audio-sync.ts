import { prisma } from "@/lib/prisma";
import type { SceneBeatRecord } from "@/lib/scene-beats";
import type { GravityTimingContext } from "@/lib/emotional-gravity";
import type { NarrativeConsciousnessContext } from "@/lib/narrative-consciousness";

export type AudioSyncSegmentDraft = {
  segmentOrder: number;
  startTimeMs: number | null;
  endTimeMs: number | null;
  textExcerpt: string;
  cueType: string | null;
  notes?: string | null;
};

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Turn pass prose into speakable chunks (paragraph / clause aware). */
export function segmentNarrativePassForAudio(text: string): string[] {
  const paras = splitParagraphs(text);
  if (paras.length >= 2) return paras;
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z“"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

export function deriveAudioSyncSegments(
  text: string,
  beatSequence?: SceneBeatRecord[] | null,
): AudioSyncSegmentDraft[] {
  const chunks = segmentNarrativePassForAudio(text);
  const out: AudioSyncSegmentDraft[] = [];
  const beatLen = beatSequence?.length ?? 0;
  for (let i = 0; i < chunks.length; i++) {
    const beat = beatLen ? beatSequence![i % beatLen] : undefined;
    out.push({
      segmentOrder: i,
      startTimeMs: null,
      endTimeMs: null,
      textExcerpt: chunks[i]!,
      cueType: mapBeatToCue(beat?.beatType),
      notes: beat?.pacingHint ?? null,
    });
  }
  return out;
}

function mapBeatToCue(beatType?: string): string | null {
  switch (beatType) {
    case "silence":
      return "pause";
    case "opening":
      return "breath";
    case "pressure":
      return "tension";
    case "reveal":
      return "shift";
    case "exit":
      return "memory";
    default:
      return null;
  }
}

export function derivePauseMoments(
  text: string,
  gravityContext?: GravityTimingContext | null,
): { afterIndex: number; msHint: number }[] {
  const chunks = segmentNarrativePassForAudio(text);
  const base = 380 + (gravityContext?.mystery ?? 0.3) * 520 + (gravityContext?.longing ?? 0.2) * 300;
  const pauses: { afterIndex: number; msHint: number }[] = [];
  for (let i = 0; i < chunks.length - 1; i++) {
    if (/[.!?]$/.test(chunks[i]!.trim())) pauses.push({ afterIndex: i, msHint: Math.round(base) });
  }
  return pauses;
}

export function deriveBreathMoments(
  text: string,
  voiceProfile: { silenceStyle?: string | null; sentenceRhythm?: string | null } | null,
): { beforeIndex: number; msHint: number }[] {
  const chunks = segmentNarrativePassForAudio(text);
  const bias = voiceProfile?.silenceStyle?.toLowerCase().includes("long") ? 1.25 : 1;
  const ms = Math.round(420 * bias);
  return chunks.length ? [{ beforeIndex: 0, msHint: ms }] : [];
}

export function deriveCueMoments(
  text: string,
  perceptionStreamSummary?: string | null,
): { segmentOrder: number; cueType: string }[] {
  const segs = deriveAudioSyncSegments(text, null);
  const cues: { segmentOrder: number; cueType: string }[] = [];
  const hint = perceptionStreamSummary?.toLowerCase() ?? "";
  const stress = hint.includes("threat") || hint.includes("fear");
  for (const s of segs) {
    let cue = s.cueType ?? "pause";
    if (stress && s.segmentOrder === 0) cue = "tension";
    cues.push({ segmentOrder: s.segmentOrder, cueType: cue });
  }
  return cues;
}

/** Persist segment rows and wire audio asset + optional cinematic pass. */
export async function buildAudioSyncMap(
  sceneAudioAssetId: string,
  passId: string,
): Promise<number> {
  const pass = await prisma.cinematicNarrativePass.findUnique({
    where: { id: passId },
    select: { content: true, metaSceneId: true },
  });
  if (!pass?.content?.trim()) return 0;

  let beats: SceneBeatRecord[] | null = null;
  if (pass.metaSceneId) {
    const rows = await prisma.sceneBeat.findMany({
      where: { metaSceneId: pass.metaSceneId },
      orderBy: { orderIndex: "asc" },
    });
    if (rows.length) {
      beats = rows.map((r) => ({
        beatType: r.beatType,
        orderIndex: r.orderIndex,
        summary: r.summary,
        emotionalCharge: r.emotionalCharge,
        symbolicCharge: r.symbolicCharge,
        pacingHint: r.pacingHint,
      }));
    }
  }

  const drafts = deriveAudioSyncSegments(pass.content, beats);
  await prisma.audioSyncSegment.deleteMany({ where: { sceneAudioAssetId } });

  const asset = await prisma.sceneAudioAsset.findUnique({
    where: { id: sceneAudioAssetId },
    select: { durationSeconds: true },
  });
  const totalMs =
    asset?.durationSeconds != null && asset.durationSeconds > 0
      ? Math.round(asset.durationSeconds * 1000)
      : null;

  if (totalMs && drafts.length > 0) {
    const slice = Math.floor(totalMs / drafts.length);
    for (let i = 0; i < drafts.length; i++) {
      drafts[i]!.startTimeMs = i * slice;
      drafts[i]!.endTimeMs = i === drafts.length - 1 ? totalMs : (i + 1) * slice;
    }
  }

  await prisma.audioSyncSegment.createMany({
    data: drafts.map((d) => ({
      sceneAudioAssetId,
      cinematicNarrativePassId: passId,
      segmentOrder: d.segmentOrder,
      startTimeMs: d.startTimeMs,
      endTimeMs: d.endTimeMs,
      textExcerpt: d.textExcerpt,
      cueType: d.cueType,
      notes: d.notes ?? null,
    })),
  });

  return drafts.length;
}

export function perceptionSummaryFromContext(ctx: NarrativeConsciousnessContext | null): string | null {
  if (!ctx) return null;
  return [
    ctx.metaFields.emotionalVoltage,
    ctx.metaFields.centralConflict,
    ctx.metaFields.sensoryField,
  ]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(" · ")
    .slice(0, 400) || null;
}
