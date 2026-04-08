import type { ReaderState } from "@prisma/client";
import { VisibilityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PREMIUM_CONTENT_CATEGORIES,
  type PremiumContentCategory,
} from "@/lib/premium-content";
import { resolvePublicMetaSceneIdForScene } from "@/lib/guided-experience";

const PUBLIC_CINEMATIC_STATUSES = ["published"] as const;
const PUBLIC_VOICE_PASS = ["accepted", "revised"] as const;

export type PremiumDepthOffer = {
  category: PremiumContentCategory;
  label: string;
  excerpt: string;
  /** One line safe to show before blur (optional). */
  previewLine?: string;
};

function firstLine(text: string, max = 200): string {
  const t = text.trim();
  const line = t.split(/\n/)[0]?.trim() ?? t;
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

async function loadCinematicAndVoiceOffers(metaSceneId: string): Promise<PremiumDepthOffer[]> {
  const rows = await prisma.cinematicNarrativePass.findMany({
    where: {
      metaSceneId,
      status: { in: [...PUBLIC_CINEMATIC_STATUSES] },
      passType: {
        in: ["alternate_pov", "premium_extended", "audio_script", "transition"],
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: { passType: true, summary: true, content: true },
  });
  const out: PremiumDepthOffer[] = [];
  for (const r of rows) {
    const excerpt =
      r.summary?.trim() ||
      (r.content?.trim() ? r.content.trim().slice(0, 280) : "");
    if (!excerpt) continue;
    const previewLine = r.content?.trim() ? firstLine(r.content, 160) : undefined;
    if (r.passType === "alternate_pov") {
      out.push({
        category: PREMIUM_CONTENT_CATEGORIES.alternatePovPass,
        label: "There is another perspective waiting",
        excerpt,
        previewLine,
      });
    } else if (r.passType === "premium_extended") {
      out.push({
        category: PREMIUM_CONTENT_CATEGORIES.premiumCinematicPass,
        label: "This moment goes deeper",
        excerpt,
        previewLine,
      });
    } else if (r.passType === "audio_script") {
      out.push({
        category: PREMIUM_CONTENT_CATEGORIES.extendedAudioNarration,
        label: "Hear the voice beneath the silence",
        excerpt,
        previewLine,
      });
    } else if (r.passType === "transition") {
      out.push({
        category: PREMIUM_CONTENT_CATEGORIES.deepSymbolicExperience,
        label: "Enter the fuller telling",
        excerpt,
        previewLine,
      });
    }
  }

  const voiceRows = await prisma.voicePass.findMany({
    where: {
      metaSceneId,
      status: { in: [...PUBLIC_VOICE_PASS] },
      passType: { in: ["character_voice", "alternate_perspective", "pov_render"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 4,
    select: { passType: true, summary: true, content: true },
  });
  for (const r of voiceRows) {
    const excerpt =
      r.summary?.trim() ||
      (r.content?.trim() ? r.content.trim().slice(0, 280) : "");
    if (!excerpt) continue;
    const previewLine = r.content?.trim() ? firstLine(r.content, 160) : undefined;
    if (r.passType === "character_voice") {
      out.push({
        category: PREMIUM_CONTENT_CATEGORIES.characterVoiceMonologue,
        label: "What they do not say aloud",
        excerpt,
        previewLine,
      });
    } else if (r.passType === "alternate_perspective") {
      out.push({
        category: PREMIUM_CONTENT_CATEGORIES.alternatePovPass,
        label: "There is another consciousness here",
        excerpt,
        previewLine,
      });
    } else if (r.passType === "pov_render") {
      out.push({
        category: PREMIUM_CONTENT_CATEGORIES.alternateVoicePass,
        label: "Stay longer with this voice",
        excerpt,
        previewLine,
      });
    }
  }
  return out;
}

function boostIfRelevant(
  offers: PremiumDepthOffer[],
  readerState: ReaderState | null | undefined,
  sceneId: string,
): PremiumDepthOffer[] {
  if (!readerState?.lastSceneId || readerState.lastSceneId !== sceneId) return offers;
  return [...offers].sort((a, b) => {
    const score = (o: PremiumDepthOffer) => {
      let w = o.excerpt.length > 40 ? 1 : 0;
      if (
        readerState.lastMode === "listen" &&
        (o.category === PREMIUM_CONTENT_CATEGORIES.extendedAudioNarration ||
          o.category === PREMIUM_CONTENT_CATEGORIES.premiumAudio)
      ) {
        w += 2;
      }
      if (readerState.lastCharacterId && o.label.toLowerCase().includes("voice")) w += 1;
      return w;
    };
    return score(b) - score(a);
  });
}

/**
 * Context-aware premium invitations for a public scene (membership is still non-billing).
 */
export async function derivePremiumDepthOffers(
  sceneId: string,
  readerState?: ReaderState | null,
): Promise<PremiumDepthOffer[]> {
  const metaSceneId = await resolvePublicMetaSceneIdForScene(sceneId);
  if (!metaSceneId) return [];
  const base = await loadCinematicAndVoiceOffers(metaSceneId);
  return boostIfRelevant(base, readerState ?? null, sceneId).slice(0, 6);
}

export async function deriveCharacterPremiumOffer(
  characterId: string,
  readerState?: ReaderState | null,
): Promise<PremiumDepthOffer | null> {
  const person = await prisma.person.findFirst({
    where: { id: characterId, visibility: VisibilityStatus.PUBLIC },
    select: { id: true, name: true, description: true },
  });
  if (!person) return null;
  const vp = await prisma.voicePass.findFirst({
    where: {
      personId: characterId,
      status: { in: [...PUBLIC_VOICE_PASS] },
    },
    orderBy: { updatedAt: "desc" },
    select: { summary: true, content: true },
  });
  const excerpt =
    vp?.summary?.trim() ||
    (vp?.content?.trim() ? vp.content.trim().slice(0, 280) : "") ||
    (person.description?.trim() ? person.description.trim().slice(0, 220) : "");
  if (!excerpt) return null;
  const previewLine = vp?.content?.trim() ? firstLine(vp.content, 140) : undefined;
  const boost =
    readerState?.lastCharacterId === characterId ? " Stay with this person a little longer." : "";
  return {
    category: PREMIUM_CONTENT_CATEGORIES.expandedCharacterHistory,
    label: "There is more interior life here",
    excerpt: `${excerpt}${boost}`,
    previewLine,
  };
}

export async function deriveSymbolPremiumOffer(
  symbolId: string,
  readerState?: ReaderState | null,
): Promise<PremiumDepthOffer | null> {
  const sym = await prisma.symbol.findFirst({
    where: { id: symbolId, visibility: VisibilityStatus.PUBLIC },
    select: {
      name: true,
      meaningPrimary: true,
      meaningSecondary: true,
      meaning: true,
    },
  });
  if (!sym) return null;
  const body =
    sym.meaningPrimary?.trim() ||
    sym.meaningSecondary?.trim() ||
    sym.meaning?.trim() ||
    "";
  if (!body) return null;
  const extra =
    readerState?.lastSymbolId === symbolId
      ? " The thread you followed is not finished."
      : "";
  return {
    category: PREMIUM_CONTENT_CATEGORIES.deepSymbolEssay,
    label: "Follow this symbol through time",
    excerpt: `${body.slice(0, 260)}${body.length > 260 ? "…" : ""}${extra}`,
    previewLine: firstLine(body, 120),
  };
}

export async function deriveAudioPremiumOffer(
  sceneId: string,
  readerState?: ReaderState | null,
): Promise<PremiumDepthOffer | null> {
  const metaSceneId =
    readerState?.lastMetaSceneId?.trim() ||
    (await resolvePublicMetaSceneIdForScene(sceneId));
  const audioOr: ({ sceneId: string } | { metaSceneId: string })[] = [{ sceneId }];
  if (metaSceneId) audioOr.push({ metaSceneId });
  const asset = await prisma.sceneAudioAsset.findFirst({
    where: {
      status: "published",
      OR: audioOr,
    },
    orderBy: { updatedAt: "desc" },
    select: { title: true, transcript: true },
  });
  if (!asset?.transcript?.trim()) {
    return {
      category: PREMIUM_CONTENT_CATEGORIES.premiumAudio,
      label: "Extended listening will open here",
      excerpt: "A longer audio presence—room to breathe between sentences.",
    };
  }
  return {
    category: PREMIUM_CONTENT_CATEGORIES.extendedAudioNarration,
    label: "Hear this carried further",
    excerpt: asset.transcript.trim().slice(0, 280),
    previewLine: firstLine(asset.transcript, 140),
  };
}

export async function deriveAlternatePerspectiveOffer(
  sceneId: string,
  readerState?: ReaderState | null,
): Promise<PremiumDepthOffer | null> {
  const offers = await derivePremiumDepthOffers(sceneId, readerState);
  return (
    offers.find((o) => o.category === PREMIUM_CONTENT_CATEGORIES.alternatePovPass) ?? null
  );
}
