"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  generateAlternatePovPass,
  generateAudioReadyNarration,
  generateCinematicExcerpt,
  generateCinematicOpening,
  generateCinematicScenePass,
  generateCinematicTransition,
  generatePremiumExtendedPass,
} from "@/lib/cinematic-prose";
import { buildNarrativeConsciousnessContext } from "@/lib/narrative-consciousness";
import { deriveSceneBeatSequence } from "@/lib/scene-beats";
import { buildAudioSyncMap } from "@/lib/audio-sync";
import {
  enhanceAlternatePovPass,
  enhanceAudioNarration,
  enhanceCinematicPass,
  enhanceTransitionBeat,
} from "@/lib/cinematic-ai";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
}

const PASS_TYPES = new Set([
  "opening",
  "full_scene",
  "cinematic_excerpt",
  "transition",
  "audio_script",
  "premium_extended",
  "alternate_pov",
]);

export async function generateCinematicNarrativePassAction(formData: FormData) {
  const metaSceneId = str(formData.get("metaSceneId"));
  const passType = str(formData.get("passType"));
  const styleMode = str(formData.get("styleMode"));
  const sourcePassId = str(formData.get("sourcePassId"));
  const personId = str(formData.get("personId"));
  const toMetaSceneId = str(formData.get("toMetaSceneId"));

  if (!metaSceneId || !passType || !PASS_TYPES.has(passType)) {
    redirect("/admin/meta-scenes?error=validation");
  }

  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: { sceneId: true },
  });
  if (!meta) redirect("/admin/meta-scenes?error=notfound");

  let result: { content: string; summary: string; confidence: number } | null = null;

  switch (passType) {
    case "opening":
      result = await generateCinematicOpening(metaSceneId, { styleMode, adminContext: true });
      break;
    case "full_scene":
      result = await generateCinematicScenePass(metaSceneId, { styleMode, adminContext: true });
      break;
    case "cinematic_excerpt":
      result = await generateCinematicExcerpt(metaSceneId, { styleMode, adminContext: true });
      break;
    case "transition": {
      if (!toMetaSceneId) redirect(`/admin/meta-scenes/${metaSceneId}/cinematic?error=validation`);
      result = await generateCinematicTransition(metaSceneId, toMetaSceneId, {
        styleMode,
        adminContext: true,
      });
      break;
    }
    case "audio_script":
      result = await generateAudioReadyNarration(metaSceneId, { styleMode, adminContext: true });
      break;
    case "premium_extended":
      result = await generatePremiumExtendedPass(metaSceneId, { styleMode, adminContext: true });
      break;
    case "alternate_pov": {
      if (!personId) redirect(`/admin/meta-scenes/${metaSceneId}/cinematic?error=validation`);
      result = await generateAlternatePovPass(metaSceneId, personId, {
        styleMode,
        adminContext: true,
      });
      break;
    }
    default:
      redirect(`/admin/meta-scenes/${metaSceneId}/cinematic?error=validation`);
  }

  if (!result?.content?.trim()) {
    redirect(`/admin/meta-scenes/${metaSceneId}/cinematic?error=empty`);
  }

  const count = await prisma.cinematicNarrativePass.count({ where: { metaSceneId } });

  await prisma.cinematicNarrativePass.create({
    data: {
      metaSceneId,
      sceneId: meta.sceneId,
      sourcePassId: sourcePassId ?? null,
      passType,
      styleMode: styleMode ?? null,
      content: result.content,
      summary: result.summary,
      sequenceOrder: count,
      status: "generated",
      confidence: result.confidence,
    },
  });

  revalidatePath(`/admin/meta-scenes/${metaSceneId}/cinematic`);
  redirect(`/admin/meta-scenes/${metaSceneId}/cinematic?saved=1`);
}

export async function updateCinematicPassStatusAction(formData: FormData) {
  const passId = str(formData.get("passId"));
  const metaSceneId = str(formData.get("metaSceneId"));
  const status = str(formData.get("status"));
  const notes = str(formData.get("notes"));

  if (!passId || !status) redirect("/admin/meta-scenes?error=validation");

  await prisma.cinematicNarrativePass.update({
    where: { id: passId },
    data: { status, notes: notes ?? undefined },
  });

  if (metaSceneId) {
    revalidatePath(`/admin/meta-scenes/${metaSceneId}/cinematic`);
  }
  redirect(metaSceneId ? `/admin/meta-scenes/${metaSceneId}/cinematic?saved=1` : "/admin/meta-scenes");
}

export async function saveSceneBeatsAction(formData: FormData) {
  const metaSceneId = str(formData.get("metaSceneId"));
  if (!metaSceneId) redirect("/admin/meta-scenes?error=validation");

  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    includeRelationships: true,
    publicOnly: false,
  });
  if (!ctx) redirect(`/admin/meta-scenes/${metaSceneId}/experience-tuning?error=context`);

  const beats = deriveSceneBeatSequence(ctx);
  await prisma.sceneBeat.deleteMany({ where: { metaSceneId } });
  await prisma.sceneBeat.createMany({
    data: beats.map((b) => ({
      metaSceneId,
      beatType: b.beatType,
      orderIndex: b.orderIndex,
      summary: b.summary,
      emotionalCharge: b.emotionalCharge,
      symbolicCharge: b.symbolicCharge,
      pacingHint: b.pacingHint,
    })),
  });

  revalidatePath(`/admin/meta-scenes/${metaSceneId}/experience-tuning`);
  revalidatePath(`/admin/meta-scenes/${metaSceneId}/cinematic`);
  redirect(`/admin/meta-scenes/${metaSceneId}/experience-tuning?beats=1`);
}

export async function buildAudioSyncFromPassAction(formData: FormData) {
  const sceneAudioAssetId = str(formData.get("sceneAudioAssetId"));
  const passId = str(formData.get("passId"));
  const metaSceneId = str(formData.get("metaSceneId"));
  if (!sceneAudioAssetId || !passId) redirect("/admin/meta-scenes?error=validation");

  const n = await buildAudioSyncMap(sceneAudioAssetId, passId);
  if (metaSceneId) {
    revalidatePath(`/admin/meta-scenes/${metaSceneId}/cinematic`);
    revalidatePath(`/admin/audio-sync/${sceneAudioAssetId}`);
  }
  redirect(
    metaSceneId
      ? `/admin/meta-scenes/${metaSceneId}/cinematic?sync=${n}`
      : `/admin/audio-sync/${sceneAudioAssetId}?sync=${n}`,
  );
}

export async function runCinematicAiEnhanceAction(formData: FormData) {
  const kind = str(formData.get("kind"));
  const metaSceneId = str(formData.get("metaSceneId"));
  const passId = str(formData.get("passId"));
  const passType = str(formData.get("passType"));
  const personId = str(formData.get("personId"));
  const fromSceneId = str(formData.get("fromSceneId"));
  const toSceneId = str(formData.get("toSceneId"));

  if (!metaSceneId || !kind) redirect("/admin/meta-scenes?error=validation");

  let text: string | null = null;
  if (kind === "pass" && passType) {
    text = await enhanceCinematicPass(metaSceneId, passType);
  } else if (kind === "audio") {
    text = await enhanceAudioNarration(metaSceneId);
  } else if (kind === "transition" && fromSceneId && toSceneId) {
    text = await enhanceTransitionBeat(fromSceneId, toSceneId);
  } else if (kind === "alternate_pov" && personId) {
    text = await enhanceAlternatePovPass(metaSceneId, personId);
  }

  if (!text?.trim()) {
    redirect(`/admin/meta-scenes/${metaSceneId}/cinematic?error=ai`);
  }

  if (passId) {
    await prisma.cinematicNarrativePass.update({
      where: { id: passId },
      data: { content: text, status: "revised", notes: "AI-enhanced" },
    });
  } else {
    const meta = await prisma.metaScene.findUnique({
      where: { id: metaSceneId },
      select: { sceneId: true },
    });
    await prisma.cinematicNarrativePass.create({
      data: {
        metaSceneId,
        sceneId: meta?.sceneId ?? null,
        passType: passType ?? "full_scene",
        content: text,
        summary: "AI-enhanced pass",
        status: "generated",
        confidence: 3,
      },
    });
  }

  revalidatePath(`/admin/meta-scenes/${metaSceneId}/cinematic`);
  redirect(`/admin/meta-scenes/${metaSceneId}/cinematic?saved=ai`);
}
