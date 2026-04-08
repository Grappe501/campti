import { renderAudioScriptPass, renderNarratorPass } from "@/lib/voice-rendering";
import { prisma } from "@/lib/prisma";
import { resolvePublicMetaSceneIdForScene } from "@/lib/guided-experience";
import { generateAudioReadyNarration, generateCinematicExcerpt } from "@/lib/cinematic-prose";
import { segmentNarrativePassForAudio } from "@/lib/audio-sync";

export async function buildNarrationScript(metaSceneId: string): Promise<string | null> {
  const fromAudio = await renderAudioScriptPass(metaSceneId);
  if (fromAudio.text) return fromAudio.text;
  const narrator = await renderNarratorPass(metaSceneId);
  return narrator.text;
}

export async function buildCharacterVoiceExcerpt(
  personId: string,
  metaSceneId?: string,
): Promise<string | null> {
  if (!metaSceneId) return null;
  const row = await prisma.voicePass.findFirst({
    where: {
      personId,
      metaSceneId,
      status: { in: ["accepted", "revised"] },
      passType: { in: ["character_voice", "pov_render", "audio_script"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { content: true },
  });
  return row?.content?.trim() ?? null;
}

export async function buildAudioTeaserScript(sceneId: string): Promise<string | null> {
  const metaId = await resolvePublicMetaSceneIdForScene(sceneId);
  if (!metaId) return null;
  return buildNarrationScript(metaId);
}

/** Cinematic, pause-aware narration block for studio / TTS prep (admin-side). */
export async function buildCinematicAudioScript(metaSceneId: string): Promise<string | null> {
  const gen = await generateAudioReadyNarration(metaSceneId, { adminContext: true });
  return gen?.content?.trim() ?? null;
}

/** Chunked narration segments (paragraph / clause). */
export async function buildNarrationSegmentScript(metaSceneId: string): Promise<string[] | null> {
  const text = await buildCinematicAudioScript(metaSceneId);
  if (!text) return null;
  return segmentNarrativePassForAudio(text);
}

export async function buildCharacterVoiceSegmentScript(
  personId: string,
  metaSceneId?: string,
): Promise<string[] | null> {
  if (!metaSceneId) return null;
  const row = await prisma.voicePass.findFirst({
    where: {
      personId,
      metaSceneId,
      status: { in: ["accepted", "revised"] },
      passType: { in: ["character_voice", "pov_render", "audio_script"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { content: true },
  });
  const t = row?.content?.trim();
  if (!t) return null;
  return segmentNarrativePassForAudio(t);
}

export async function buildPremiumAudioExcerpt(metaSceneId: string): Promise<string | null> {
  const excerpt = await generateCinematicExcerpt(metaSceneId, {
    adminContext: true,
    styleMode: "audio_clean",
  });
  return excerpt?.content?.trim() ?? null;
}
