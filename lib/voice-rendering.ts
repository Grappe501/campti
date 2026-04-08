import { buildNarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import { prisma } from "@/lib/prisma";

const OK = ["accepted", "revised"] as const;

export type VoiceRenderResult = {
  text: string | null;
  source: "voice_pass" | "none";
  voicePassId?: string;
};

async function pickVoicePass(where: {
  metaSceneId?: string;
  personId?: string;
  voiceProfileId?: string;
  passType: string;
}): Promise<VoiceRenderResult> {
  const row = await prisma.voicePass.findFirst({
    where: {
      status: { in: [...OK] },
      passType: where.passType,
      ...(where.metaSceneId ? { metaSceneId: where.metaSceneId } : {}),
      ...(where.personId ? { personId: where.personId } : {}),
      ...(where.voiceProfileId ? { voiceProfileId: where.voiceProfileId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, content: true },
  });
  if (row?.content?.trim()) {
    return { text: row.content.trim(), source: "voice_pass", voicePassId: row.id };
  }
  return { text: null, source: "none" };
}

export async function renderSceneInVoice(
  metaSceneId: string,
  voiceProfileId: string,
): Promise<VoiceRenderResult> {
  return pickVoicePass({
    metaSceneId,
    voiceProfileId,
    passType: "character_voice",
  });
}

export async function renderCharacterPovPass(
  metaSceneId: string,
  personId: string,
): Promise<VoiceRenderResult> {
  const direct = await pickVoicePass({
    metaSceneId,
    personId,
    passType: "pov_render",
  });
  if (direct.text) return direct;
  return pickVoicePass({
    metaSceneId,
    personId,
    passType: "character_voice",
  });
}

export async function renderNarratorPass(metaSceneId: string): Promise<VoiceRenderResult> {
  return pickVoicePass({ metaSceneId, passType: "narrator_voice" });
}

export async function renderAlternateVoicePass(
  metaSceneId: string,
  personIdOrProfileId: string,
): Promise<VoiceRenderResult> {
  const asPerson = await pickVoicePass({
    metaSceneId,
    personId: personIdOrProfileId,
    passType: "alternate_perspective",
  });
  if (asPerson.text) return asPerson;
  return pickVoicePass({
    metaSceneId,
    voiceProfileId: personIdOrProfileId,
    passType: "alternate_perspective",
  });
}

export async function renderAudioScriptPass(metaSceneId: string): Promise<VoiceRenderResult> {
  return pickVoicePass({ metaSceneId, passType: "audio_script" });
}

export async function renderImmersiveSceneExcerpt(metaSceneId: string): Promise<VoiceRenderResult> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, { publicOnly: true });
  const pass = ctx?.narrativePasses[0];
  if (pass?.content?.trim()) {
    const t = pass.content.trim();
    const excerpt = t.length > 900 ? `${t.slice(0, 897)}…` : t;
    return { text: excerpt, source: "none" };
  }
  return { text: null, source: "none" };
}
