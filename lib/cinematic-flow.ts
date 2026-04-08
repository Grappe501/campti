import { VisibilityStatus } from "@prisma/client";
import {
  buildNarrativeConsciousnessContext,
  deriveContinuationImpulse,
} from "@/lib/narrative-consciousness";
import { prisma } from "@/lib/prisma";

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function deriveSceneEntryLine(metaSceneId: string): Promise<string | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
    includeRelationships: true,
  });
  if (!ctx) return null;
  const place = ctx.place.name;
  const tone = ctx.metaFields.emotionalVoltage?.trim();
  if (tone) return clip(`You arrive in ${place}—${tone}`, 200);
  return clip(`You arrive in ${place}, before the moment names itself.`, 200);
}

export async function deriveSceneExitLine(metaSceneId: string): Promise<string | null> {
  const ctx = await buildNarrativeConsciousnessContext(metaSceneId, {
    publicOnly: true,
  });
  if (!ctx) return null;
  const impulse = deriveContinuationImpulse(ctx);
  return clip(impulse, 220);
}

export async function deriveBridgeLine(fromSceneId: string, toSceneId: string): Promise<string | null> {
  const [from, to] = await Promise.all([
    prisma.scene.findUnique({
      where: { id: fromSceneId },
      select: { summary: true, emotionalTone: true },
    }),
    prisma.scene.findUnique({
      where: { id: toSceneId },
      select: { summary: true, description: true },
    }),
  ]);
  if (!to) return null;
  const label = to.summary?.trim() || to.description.trim().slice(0, 64);
  const residue = from?.emotionalTone?.trim();
  if (residue) return clip(`Something of ${residue} follows you toward ${label}.`, 200);
  return clip(`The corridor turns; you step toward ${label}.`, 200);
}

export async function deriveContinuationInvitation(sceneId: string): Promise<string | null> {
  const meta = await prisma.metaScene.findFirst({
    where: { sceneId },
    select: { id: true },
  });
  if (!meta) return null;
  const ctx = await buildNarrativeConsciousnessContext(meta.id, { publicOnly: true });
  if (!ctx) return null;
  return clip(deriveContinuationImpulse(ctx), 200);
}

export async function deriveEmotionalCarryover(sceneId: string): Promise<string | null> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: { emotionalTone: true, narrativeIntent: true, summary: true },
  });
  if (!scene) return null;
  const line = scene.emotionalTone?.trim() || scene.narrativeIntent?.trim();
  if (line) return clip(line, 180);
  return scene.summary?.trim() ? clip(scene.summary.trim(), 180) : null;
}

/** Next scene in chapter (public) for handoff copy. */
export async function resolvePublicNextSceneLabel(sceneId: string): Promise<string | null> {
  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, visibility: VisibilityStatus.PUBLIC },
    select: { chapterId: true, orderInChapter: true, sceneNumber: true },
  });
  if (!scene) return null;
  const siblings = await prisma.scene.findMany({
    where: { chapterId: scene.chapterId, visibility: VisibilityStatus.PUBLIC },
    orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
    select: { id: true, summary: true, description: true },
  });
  const idx = siblings.findIndex((s) => s.id === sceneId);
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  if (!next) return null;
  return next.summary?.trim() || next.description.trim().slice(0, 80) || "the next passage";
}
