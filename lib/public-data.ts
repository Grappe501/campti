import type { Prisma } from "@prisma/client";
import { VisibilityStatus } from "@prisma/client";
import {
  buildNarrativeConsciousnessContext,
  deriveContinuationImpulse,
} from "@/lib/narrative-consciousness";
import {
  deriveGuidedPrompts,
  deriveRelationshipAttentionPrompts,
  deriveSymbolAttentionPrompts,
  resolvePublicMetaSceneIdForScene,
} from "@/lib/guided-experience";
import type { ReaderNextAction } from "@/lib/reader-flow";
import { deriveNextBestReaderActions } from "@/lib/reader-flow";
import { prisma } from "@/lib/prisma";
import {
  deriveSceneEntryLine,
  deriveSceneExitLine,
  resolvePublicNextSceneLabel,
} from "@/lib/cinematic-flow";
import { PREMIUM_CONTENT_CATEGORIES, type PremiumContentCategory } from "@/lib/premium-content";
import type { ReaderThreadHint } from "@/lib/reader-threads";
import { deriveThreadHintsForSession } from "@/lib/reader-threads";
import { derivePremiumDepthOffers } from "@/lib/premium-depth-offers";
import { deriveEmotionalTrace, deriveReturnHook } from "@/lib/reader-memory";

const PUBLIC = VisibilityStatus.PUBLIC;

/** Narrative passes safe to surface to readers (author-approved). */
const PUBLIC_PASS_STATUSES = ["accepted", "revised"] as const;

/** Cinematic passes only when explicitly marked for the public surface. */
const PUBLIC_CINEMATIC_STATUSES = ["published"] as const;

const PUBLIC_VOICE_PASS_TYPES = ["pov_render", "character_voice", "alternate_perspective"] as const;

const PASS_TYPE_PRIORITY = [
  "full_structured",
  "embodied",
  "opening",
  "interior",
  "environment",
  "relationship_pressure",
  "symbolic",
] as const;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function recordTypeReaderLabel(recordType: string): string {
  const key = recordType.toLowerCase();
  const map: Record<string, string> = {
    historical: "Rooted in recorded history",
    oral_history: "Held in living memory",
    inferred: "Carefully inferred from the record",
    fictional: "Imagined within historical truth",
    hybrid: "Blended history and imagination",
  };
  return map[key] ?? "Part of this world";
}

export { placeTypeReaderLabel } from "@/lib/read-labels";

function pickBestNarrativePass(
  passes: { passType: string; content: string; summary: string | null; updatedAt: Date }[],
) {
  if (!passes.length) return null;
  for (const t of PASS_TYPE_PRIORITY) {
    const p = passes.find((x) => x.passType === t);
    if (p) return p;
  }
  return passes[0];
}

const CINEMATIC_READ_PRIORITY = [
  "full_scene",
  "opening",
  "cinematic_excerpt",
  "premium_extended",
] as const;

function pickBestCinematicPass(
  passes: { passType: string; content: string; summary: string | null; sequenceOrder: number | null }[],
) {
  if (!passes.length) return null;
  const sorted = [...passes].sort(
    (a, b) => (a.sequenceOrder ?? 999) - (b.sequenceOrder ?? 999),
  );
  for (const t of CINEMATIC_READ_PRIORITY) {
    const p = sorted.find((x) => x.passType === t);
    if (p?.content?.trim()) return p;
  }
  return sorted.find((p) => p.content?.trim()) ?? null;
}

const characterProfilePublicSelect = {
  worldview: true,
  coreBeliefs: true,
  fears: true,
  desires: true,
  internalConflicts: true,
  socialPosition: true,
  emotionalBaseline: true,
  behavioralPatterns: true,
  speechPatterns: true,
  memoryBias: true,
  sensoryBias: true,
  moralFramework: true,
  contradictions: true,
  stressPattern: true,
  growthPattern: true,
  defensiveStyle: true,
  coreLonging: true,
  coreFear: true,
  attentionBias: true,
  relationalStyle: true,
  conflictStyle: true,
  attachmentPattern: true,
  shameTrigger: true,
  angerPattern: true,
  griefPattern: true,
  controlPattern: true,
} satisfies Prisma.CharacterProfileSelect;

export type PublicMembershipTier = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  emphasis?: boolean;
};

/** Static membership framing; no billing. */
export async function getPublicMembershipContent(): Promise<{
  intro: string;
  tiers: PublicMembershipTier[];
  footnote: string;
}> {
  return {
    intro:
      "The story is free to enter. Membership is for those who want to live inside it a little longer—more texture, more silence, more room to wander.",
    tiers: [
      {
        id: "free",
        title: "Reader",
        description: "Walk the main corridors of the narrative.",
        bullets: [
          "Core chapters and selected scenes",
          "A curated cast and atlas of places",
          "A guided thread through time",
        ],
      },
      {
        id: "member",
        title: "Member",
        description: "Deeper chambers—richer context, slower light.",
        emphasis: true,
        bullets: [
          "Expanded character histories and interior life",
          "Layered symbolism and metaphor",
          "Richer scene experiences and perspective",
          "Audio and immersive layers as they arrive",
        ],
      },
    ],
    footnote: "Billing and accounts will arrive quietly, when the work is ready. For now, this is an invitation, not a transaction.",
  };
}

export async function getPublicHomeData() {
  return safe(
    async () => {
      const [featuredChapter, featuredCharacter, featuredPlace, featuredSymbol] =
        await Promise.all([
          prisma.chapter.findFirst({
            where: { visibility: PUBLIC },
            orderBy: [{ chapterNumber: "asc" }, { title: "asc" }],
            select: {
              id: true,
              title: true,
              chapterNumber: true,
              summary: true,
              timePeriod: true,
              historicalAnchor: true,
            },
          }),
          prisma.person.findFirst({
            where: { visibility: PUBLIC },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              characterProfile: {
                select: { coreLonging: true, emotionalBaseline: true },
              },
            },
          }),
          prisma.place.findFirst({
            where: { visibility: PUBLIC },
            orderBy: { name: "asc" },
            select: { id: true, name: true, description: true, placeType: true },
          }),
          prisma.symbol.findFirst({
            where: { visibility: PUBLIC },
            orderBy: { name: "asc" },
            select: { id: true, name: true, meaning: true, category: true },
          }),
        ]);

      const characterHook =
        featuredCharacter?.characterProfile?.coreLonging?.trim() ||
        featuredCharacter?.characterProfile?.emotionalBaseline?.trim() ||
        null;

      return {
        featuredChapter,
        featuredCharacter: featuredCharacter
          ? {
              id: featuredCharacter.id,
              name: featuredCharacter.name,
              description: featuredCharacter.description,
              hook: characterHook,
            }
          : null,
        featuredPlace,
        featuredSymbol,
      };
    },
    {
      featuredChapter: null,
      featuredCharacter: null,
      featuredPlace: null,
      featuredSymbol: null,
    },
  );
}

export async function getPublicPlacesIndex() {
  return safe(
    () =>
      prisma.place.findMany({
        where: { visibility: PUBLIC },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          placeType: true,
          recordType: true,
        },
      }),
    [],
  );
}

export async function getPublicChapterIndex() {
  return safe(
    () =>
      prisma.chapter.findMany({
        where: { visibility: PUBLIC },
        orderBy: [{ chapterNumber: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          summary: true,
          timePeriod: true,
          historicalAnchor: true,
          publicNotes: true,
        },
      }),
    [],
  );
}

export async function getPublicChapterById(id: string) {
  return safe(
    () =>
      prisma.chapter.findFirst({
        where: { id, visibility: PUBLIC },
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          summary: true,
          timePeriod: true,
          historicalAnchor: true,
          publicNotes: true,
          pov: true,
          scenes: {
            where: { visibility: PUBLIC },
            orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
            select: {
              id: true,
              summary: true,
              description: true,
              emotionalTone: true,
              narrativeIntent: true,
              sceneNumber: true,
              orderInChapter: true,
              historicalAnchor: true,
            },
          },
          persons: {
            where: { visibility: PUBLIC },
            select: { id: true, name: true, description: true },
          },
          places: {
            where: { visibility: PUBLIC },
            select: { id: true, name: true, description: true, placeType: true },
          },
          events: {
            where: { visibility: PUBLIC },
            select: { id: true, title: true, description: true, startYear: true, endYear: true },
          },
        },
      }),
    null,
  );
}

export type PublicAudioSyncSegment = {
  segmentOrder: number;
  startTimeMs: number | null;
  endTimeMs: number | null;
  textExcerpt: string | null;
  cueType: string | null;
};

export type PublicSceneAudioTrack = {
  id: string;
  assetType: string;
  title: string;
  audioUrl: string;
  transcript: string | null;
  durationSeconds: number | null;
  /** Published sync segments only; omitted when none. */
  syncSegments?: PublicAudioSyncSegment[];
};

export type PublicSceneViewModel = {
  scene: {
    id: string;
    summary: string | null;
    description: string;
    draftText: string | null;
    emotionalTone: string | null;
    narrativeIntent: string | null;
    historicalAnchor: string | null;
    locationNote: string | null;
    sceneNumber: number | null;
    orderInChapter: number | null;
  };
  chapter: { id: string; title: string; chapterNumber: number | null };
  readingBody: string;
  readingSourceLabel: "scene" | "narrative" | "atmosphere";
  narrativePassSummary: string | null;
  /** Linked meta layer id when present (for guided / gravity helpers). */
  metaSceneId: string | null;
  metaLayer: {
    setting: string | null;
    historicalContext: string | null;
    symbolism: string | null;
    socialContext: string | null;
  } | null;
  povPerson: { id: string; name: string; description: string | null } | null;
  primaryPlace: { id: string; name: string; placeType: string; description: string | null } | null;
  personalityProfile: string | null;
  innerNature: string | null;
  /** Short alternate-voice teaser when an approved pass exists. */
  perspectiveTeaser: string | null;
  /** Published scene / meta audio only; URLs must be non-empty. */
  sceneAudioTracks: PublicSceneAudioTrack[];
  relatedPeople: { id: string; name: string; description: string | null }[];
  relatedPlaces: { id: string; name: string; description: string | null }[];
  relatedSymbols: { id: string; name: string; meaning: string | null }[];
};

export type PublicSceneReaderPack = {
  guidedPrompts: string[];
  symbolPrompts: string[];
  relationshipPrompts: string[];
  nextReaderActions: ReaderNextAction[];
  continuation: { headline: string; mood: string | null };
  /** Subtle entry / exit rhythm (human-facing). */
  sceneEntryLine: string | null;
  sceneExitBridge: string | null;
  /** Premium-ready teasers (no billing enforcement). */
  premiumDepthOffers: {
    category: PremiumContentCategory;
    label: string;
    excerpt: string;
    /** One line before blur in depth gates when present. */
    previewLine?: string;
  }[];
  /** Attachment-aware thread CTAs (session optional). */
  followThreads: ReaderThreadHint[];
};

export async function getPublicContinuationForScene(sceneId: string): Promise<{
  headline: string;
  mood: string | null;
}> {
  return safe(async () => {
    const metaId = await resolvePublicMetaSceneIdForScene(sceneId);
    if (!metaId) {
      return { headline: "Continue from the last moment", mood: null };
    }
    const ctx = await buildNarrativeConsciousnessContext(metaId, {
      publicOnly: true,
    });
    if (!ctx) return { headline: "Pick up the thread", mood: null };
    return {
      headline: deriveContinuationImpulse(ctx).slice(0, 140),
      mood: ctx.metaFields.emotionalVoltage?.trim().slice(0, 120) ?? null,
    };
  }, { headline: "Return to the river", mood: null });
}

export async function getPublicSceneReaderPack(
  sceneId: string,
  metaSceneId: string | null,
  sessionId?: string | null,
): Promise<PublicSceneReaderPack> {
  return safe(
    async () => {
      const readerState = sessionId?.trim()
        ? await prisma.readerState.findUnique({ where: { sessionId: sessionId.trim() } })
        : null;
      const rawOffers = await derivePremiumDepthOffers(sceneId, readerState);
      const premiumDepthOffers =
        rawOffers?.map((o) => ({
          category: o.category,
          label: o.label,
          excerpt: o.excerpt,
          previewLine: o.previewLine,
        })) ?? [];

      const [
        guidedPrompts,
        symbolPrompts,
        relationshipPrompts,
        nextReaderActions,
        continuation,
        sceneEntryLine,
        sceneExitBridge,
        nextLabel,
        followThreads,
      ] = await Promise.all([
        metaSceneId ? deriveGuidedPrompts(metaSceneId) : Promise.resolve([]),
        metaSceneId ? deriveSymbolAttentionPrompts(metaSceneId) : Promise.resolve([]),
        metaSceneId ? deriveRelationshipAttentionPrompts(metaSceneId) : Promise.resolve([]),
        deriveNextBestReaderActions(sceneId, sessionId ?? null),
        getPublicContinuationForScene(sceneId),
        metaSceneId ? deriveSceneEntryLine(metaSceneId) : Promise.resolve(null),
        metaSceneId ? deriveSceneExitLine(metaSceneId) : Promise.resolve(null),
        resolvePublicNextSceneLabel(sceneId),
        sessionId?.trim()
          ? deriveThreadHintsForSession(sessionId.trim())
          : Promise.resolve([] as ReaderThreadHint[]),
      ]);
      const exitBridge =
        sceneExitBridge ||
        (nextLabel ? `A thread leads toward ${nextLabel}.` : null);
      return {
        guidedPrompts,
        symbolPrompts,
        relationshipPrompts,
        nextReaderActions,
        continuation,
        sceneEntryLine,
        sceneExitBridge: exitBridge,
        premiumDepthOffers,
        followThreads,
      };
    },
    {
      guidedPrompts: [],
      symbolPrompts: [],
      relationshipPrompts: [],
      nextReaderActions: [],
      continuation: { headline: "Pick up the thread", mood: null },
      sceneEntryLine: null,
      sceneExitBridge: null,
      premiumDepthOffers: [],
      followThreads: [],
    },
  );
}

export type PublicReturnExperience = {
  href: string;
  headline: string;
  moodLine: string | null;
  ctaLabel: string;
  chapterTitle: string | null;
  sceneLabel: string | null;
  preferredModeLabel: string | null;
};

export async function getPublicReturnExperience(
  sessionId: string | null | undefined,
): Promise<PublicReturnExperience | null> {
  return safe(async () => {
    if (!sessionId?.trim()) return null;
    const sid = sessionId.trim();
    const state = await prisma.readerState.findUnique({ where: { sessionId: sid } });
    if (!state?.lastSceneId) return null;

    const scene = await prisma.scene.findFirst({
      where: { id: state.lastSceneId, visibility: PUBLIC },
      select: {
        id: true,
        summary: true,
        description: true,
        publicContinuationInvitationLine: true,
        chapter: { select: { title: true } },
      },
    });
    if (!scene) return null;

    const [hook, trace] = await Promise.all([
      deriveReturnHook(sid),
      deriveEmotionalTrace(sid),
    ]);

    const headline =
      state.continuationHeadline?.trim() ||
      scene.publicContinuationInvitationLine?.trim() ||
      hook ||
      "Continue the experience";
    const sceneLabel =
      scene.summary?.trim() ||
      (scene.description.trim().length > 0 ? scene.description.trim().slice(0, 96) : null);

    const modeLabel =
      state.lastMode === "immersive"
        ? "Feel"
        : state.lastMode === "guided"
          ? "Guided"
          : state.lastMode === "listen"
            ? "Listen"
            : state.lastMode === "reading"
              ? "Read"
              : null;

    return {
      href: `/read/scenes/${scene.id}`,
      headline,
      moodLine: state.emotionalTrace?.trim() || trace,
      ctaLabel: "Return to the passage",
      chapterTitle: scene.chapter.title,
      sceneLabel,
      preferredModeLabel: modeLabel,
    };
  }, null);
}

function buildReadingBodyFromScene(scene: {
  draftText: string | null;
  summary: string | null;
  description: string;
  emotionalTone: string | null;
  narrativeIntent: string | null;
}): { text: string; label: "scene" | "atmosphere" } {
  if (scene.draftText?.trim()) {
    return { text: scene.draftText.trim(), label: "scene" };
  }
  const parts: string[] = [];
  if (scene.summary?.trim()) parts.push(scene.summary.trim());
  if (scene.narrativeIntent?.trim()) parts.push(scene.narrativeIntent.trim());
  if (scene.emotionalTone?.trim()) parts.push(scene.emotionalTone.trim());
  if (!parts.length && scene.description.trim()) {
    parts.push(scene.description.trim());
  }
  return {
    text: parts.join("\n\n"),
    label: parts.length ? "atmosphere" : "atmosphere",
  };
}

function mergeProfileParagraphs(
  fields: (string | null | undefined)[],
  max = 6,
): string | null {
  const cleaned = fields.map((f) => f?.trim()).filter(Boolean) as string[];
  if (!cleaned.length) return null;
  return cleaned.slice(0, max).join("\n\n");
}

export async function getPublicSceneById(id: string): Promise<PublicSceneViewModel | null> {
  return safe(
    async () => {
      const row = await prisma.scene.findFirst({
        where: {
          id,
          visibility: PUBLIC,
          chapter: { visibility: PUBLIC },
        },
        include: {
          chapter: {
            select: { id: true, title: true, chapterNumber: true, visibility: true },
          },
          persons: {
            where: { visibility: PUBLIC },
            select: {
              id: true,
              name: true,
              description: true,
              characterProfile: { select: characterProfilePublicSelect },
            },
          },
          places: {
            where: { visibility: PUBLIC },
            select: { id: true, name: true, placeType: true, description: true },
          },
          symbols: {
            where: { visibility: PUBLIC },
            select: { id: true, name: true, meaning: true },
          },
          metaScenes: {
            include: {
              narrativePasses: {
                where: { status: { in: [...PUBLIC_PASS_STATUSES] } },
                orderBy: { updatedAt: "desc" },
              },
              cinematicNarrativePasses: {
                where: { status: { in: [...PUBLIC_CINEMATIC_STATUSES] } },
                orderBy: [{ sequenceOrder: "asc" }, { updatedAt: "desc" }],
              },
              place: {
                select: {
                  id: true,
                  name: true,
                  placeType: true,
                  visibility: true,
                  description: true,
                },
              },
              povPerson: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  visibility: true,
                  characterProfile: { select: characterProfilePublicSelect },
                },
              },
            },
          },
        },
      });

      if (!row || row.chapter.visibility !== PUBLIC) return null;

      let readingBody: string;
      let readingSourceLabel: "scene" | "narrative" | "atmosphere" =
        "atmosphere";
      let narrativePassSummary: string | null = null;
      let metaLayer: PublicSceneViewModel["metaLayer"] = null;
      let povPerson: PublicSceneViewModel["povPerson"] = null;
      let primaryPlace: PublicSceneViewModel["primaryPlace"] = null;
      let personalityProfile: string | null = null;
      let innerNature: string | null = null;

      type MetaInc = (typeof row.metaScenes)[number];
      function pickMetaForReading(metaScenes: MetaInc[]): MetaInc | null {
        for (const m of metaScenes) {
          const c = pickBestCinematicPass(m.cinematicNarrativePasses);
          if (c?.content?.trim()) return m;
        }
        for (const m of metaScenes) {
          const p = pickBestNarrativePass(m.narrativePasses);
          if (p?.content?.trim()) return m;
        }
        return metaScenes[0] ?? null;
      }

      const metaWithPass = pickMetaForReading(row.metaScenes);
      const metaAnchor = metaWithPass ?? row.metaScenes[0] ?? null;
      const metaSceneId = metaAnchor?.id ?? null;
      const bestCinematic = metaWithPass
        ? pickBestCinematicPass(metaWithPass.cinematicNarrativePasses)
        : null;
      const bestNarrative = metaWithPass
        ? pickBestNarrativePass(metaWithPass.narrativePasses)
        : null;

      if (bestCinematic?.content?.trim() && metaWithPass) {
        readingBody = bestCinematic.content.trim();
        readingSourceLabel = "narrative";
        narrativePassSummary = bestCinematic.summary?.trim() ?? null;
        metaLayer = {
          setting:
            [metaWithPass.environmentDescription, metaWithPass.sensoryField]
              .map((s) => s?.trim())
              .filter(Boolean)
              .join("\n\n") || null,
          historicalContext: metaWithPass.historicalConstraints?.trim() ?? null,
          symbolism: metaWithPass.symbolicElements?.trim() ?? null,
          socialContext: metaWithPass.socialConstraints?.trim() ?? null,
        };
        if (
          metaWithPass.povPerson.visibility === PUBLIC &&
          metaWithPass.povPerson.characterProfile
        ) {
          const cp = metaWithPass.povPerson.characterProfile;
          personalityProfile = mergeProfileParagraphs([
            cp.worldview,
            cp.coreBeliefs,
            cp.behavioralPatterns,
            cp.relationalStyle,
            cp.conflictStyle,
            cp.moralFramework,
          ]);
          innerNature = mergeProfileParagraphs([
            cp.desires,
            cp.fears,
            cp.internalConflicts,
            cp.contradictions,
            cp.emotionalBaseline,
            cp.memoryBias,
            cp.sensoryBias,
          ]);
          povPerson = {
            id: metaWithPass.povPerson.id,
            name: metaWithPass.povPerson.name,
            description: metaWithPass.povPerson.description ?? null,
          };
        }
        if (metaWithPass.place.visibility === PUBLIC) {
          primaryPlace = {
            id: metaWithPass.place.id,
            name: metaWithPass.place.name,
            placeType: metaWithPass.place.placeType,
            description: metaWithPass.place.description ?? null,
          };
        }
      } else if (bestNarrative?.content?.trim() && metaWithPass) {
        readingBody = bestNarrative.content.trim();
        readingSourceLabel = "narrative";
        narrativePassSummary = bestNarrative.summary?.trim() ?? null;
        metaLayer = {
          setting:
            [metaWithPass.environmentDescription, metaWithPass.sensoryField]
              .map((s) => s?.trim())
              .filter(Boolean)
              .join("\n\n") || null,
          historicalContext: metaWithPass.historicalConstraints?.trim() ?? null,
          symbolism: metaWithPass.symbolicElements?.trim() ?? null,
          socialContext: metaWithPass.socialConstraints?.trim() ?? null,
        };
        if (
          metaWithPass.povPerson.visibility === PUBLIC &&
          metaWithPass.povPerson.characterProfile
        ) {
          const cp = metaWithPass.povPerson.characterProfile;
          personalityProfile = mergeProfileParagraphs([
            cp.worldview,
            cp.coreBeliefs,
            cp.behavioralPatterns,
            cp.relationalStyle,
            cp.conflictStyle,
            cp.moralFramework,
          ]);
          innerNature = mergeProfileParagraphs([
            cp.desires,
            cp.fears,
            cp.internalConflicts,
            cp.contradictions,
            cp.emotionalBaseline,
            cp.memoryBias,
            cp.sensoryBias,
          ]);
          povPerson = {
            id: metaWithPass.povPerson.id,
            name: metaWithPass.povPerson.name,
            description: metaWithPass.povPerson.description ?? null,
          };
        }
        if (metaWithPass.place.visibility === PUBLIC) {
          primaryPlace = {
            id: metaWithPass.place.id,
            name: metaWithPass.place.name,
            placeType: metaWithPass.place.placeType,
            description: metaWithPass.place.description ?? null,
          };
        }
      } else {
        const fallback = buildReadingBodyFromScene(row);
        readingBody = fallback.text;
        readingSourceLabel = fallback.label === "scene" ? "scene" : "atmosphere";
      }

      if (!primaryPlace && row.places[0]) {
        primaryPlace = {
          id: row.places[0].id,
          name: row.places[0].name,
          placeType: row.places[0].placeType,
          description: row.places[0].description ?? null,
        };
      }

      if (!povPerson && row.persons[0]?.characterProfile) {
        const cp = row.persons[0].characterProfile;
        personalityProfile = mergeProfileParagraphs([
          cp.worldview,
          cp.coreBeliefs,
          cp.behavioralPatterns,
          cp.relationalStyle,
        ]);
        innerNature = mergeProfileParagraphs([
          cp.desires,
          cp.fears,
          cp.internalConflicts,
          cp.emotionalBaseline,
        ]);
        povPerson = {
          id: row.persons[0].id,
          name: row.persons[0].name,
          description: row.persons[0].description ?? null,
        };
      } else if (!povPerson && row.persons[0]) {
        povPerson = {
          id: row.persons[0].id,
          name: row.persons[0].name,
          description: row.persons[0].description ?? null,
        };
      }

      if (!metaLayer && (row.historicalAnchor?.trim() || row.locationNote?.trim())) {
        metaLayer = {
          setting: row.locationNote?.trim() ?? null,
          historicalContext: row.historicalAnchor?.trim() ?? null,
          symbolism: null,
          socialContext: null,
        };
      }

      let perspectiveTeaser: string | null = null;
      if (metaSceneId) {
        const vp = await prisma.voicePass.findFirst({
          where: {
            metaSceneId,
            status: { in: [...PUBLIC_PASS_STATUSES] },
            passType: { in: [...PUBLIC_VOICE_PASS_TYPES] },
          },
          orderBy: { updatedAt: "desc" },
          select: { summary: true, content: true },
        });
        if (vp) {
          perspectiveTeaser =
            vp.summary?.trim() ||
            (vp.content?.trim() ? vp.content.trim().slice(0, 420) : null);
        }
      }

      const audioOr: ({ sceneId: string } | { metaSceneId: string })[] = [
        { sceneId: row.id },
      ];
      if (metaSceneId) audioOr.push({ metaSceneId });
      const audioRows = await prisma.sceneAudioAsset.findMany({
        where: { status: "published", OR: audioOr },
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: {
          id: true,
          assetType: true,
          title: true,
          audioUrl: true,
          transcript: true,
          durationSeconds: true,
        },
      });
      const sceneAudioTracks: PublicSceneAudioTrack[] = audioRows
        .filter((a) => Boolean(a.audioUrl?.trim()))
        .map((a) => ({
          id: a.id,
          assetType: a.assetType,
          title: a.title,
          audioUrl: a.audioUrl!.trim(),
          transcript: a.transcript,
          durationSeconds: a.durationSeconds,
        }));

      const trackIds = sceneAudioTracks.map((t) => t.id);
      const syncByAsset = new Map<string, PublicAudioSyncSegment[]>();
      if (trackIds.length > 0) {
        const syncRows = await prisma.audioSyncSegment.findMany({
          where: {
            sceneAudioAssetId: { in: trackIds },
            OR: [
              { cinematicNarrativePassId: null },
              {
                cinematicNarrativePass: {
                  status: { in: [...PUBLIC_CINEMATIC_STATUSES] },
                },
              },
            ],
          },
          orderBy: { segmentOrder: "asc" },
          select: {
            sceneAudioAssetId: true,
            segmentOrder: true,
            startTimeMs: true,
            endTimeMs: true,
            textExcerpt: true,
            cueType: true,
          },
        });
        for (const s of syncRows) {
          if (!s.sceneAudioAssetId) continue;
          const arr = syncByAsset.get(s.sceneAudioAssetId) ?? [];
          arr.push({
            segmentOrder: s.segmentOrder,
            startTimeMs: s.startTimeMs,
            endTimeMs: s.endTimeMs,
            textExcerpt: s.textExcerpt,
            cueType: s.cueType,
          });
          syncByAsset.set(s.sceneAudioAssetId, arr);
        }
      }
      const sceneAudioTracksSynced = sceneAudioTracks.map((t) => {
        const segs = syncByAsset.get(t.id);
        return segs?.length ? { ...t, syncSegments: segs } : t;
      });

      return {
        scene: {
          id: row.id,
          summary: row.summary,
          description: row.description,
          draftText: row.draftText,
          emotionalTone: row.emotionalTone,
          narrativeIntent: row.narrativeIntent,
          historicalAnchor: row.historicalAnchor,
          locationNote: row.locationNote,
          sceneNumber: row.sceneNumber,
          orderInChapter: row.orderInChapter,
        },
        chapter: {
          id: row.chapter.id,
          title: row.chapter.title,
          chapterNumber: row.chapter.chapterNumber,
        },
        readingBody,
        readingSourceLabel,
        narrativePassSummary,
        metaSceneId,
        metaLayer,
        povPerson,
        primaryPlace,
        personalityProfile,
        innerNature,
        perspectiveTeaser,
        sceneAudioTracks: sceneAudioTracksSynced,
        relatedPeople: row.persons.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? null,
        })),
        relatedPlaces: row.places.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? null,
        })),
        relatedSymbols: row.symbols.map((s) => ({
          id: s.id,
          name: s.name,
          meaning: s.meaning,
        })),
      };
    },
    null,
  );
}

export async function getPublicCharacterIndex() {
  return safe(
    () =>
      prisma.person.findMany({
        where: { visibility: PUBLIC },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          recordType: true,
          birthYear: true,
          deathYear: true,
          characterProfile: {
            select: {
              socialPosition: true,
              coreLonging: true,
              emotionalBaseline: true,
            },
          },
        },
      }),
    [],
  );
}

export async function getPublicCharacterById(id: string) {
  return safe(
    () =>
      prisma.person.findFirst({
        where: { id, visibility: PUBLIC },
        select: {
          id: true,
          name: true,
          description: true,
          recordType: true,
          birthYear: true,
          deathYear: true,
          characterProfile: { select: characterProfilePublicSelect },
          places: {
            where: { visibility: PUBLIC },
            select: { id: true, name: true, description: true, placeType: true },
          },
          events: {
            where: { visibility: PUBLIC },
            select: {
              id: true,
              title: true,
              description: true,
              startYear: true,
              endYear: true,
            },
          },
          chapters: {
            where: { visibility: PUBLIC },
            select: { id: true, title: true, chapterNumber: true },
          },
          scenes: {
            where: { visibility: PUBLIC, chapter: { visibility: PUBLIC } },
            select: {
              id: true,
              summary: true,
              description: true,
              emotionalTone: true,
              chapter: { select: { id: true, title: true, chapterNumber: true } },
            },
          },
          relationshipsAsA: {
            select: {
              id: true,
              relationshipType: true,
              relationshipSummary: true,
              emotionalPattern: true,
              conflictPattern: true,
              attachmentPattern: true,
              powerDynamic: true,
              generatedDynamicSummary: true,
              personB: {
                select: { id: true, name: true, visibility: true },
              },
            },
          },
          relationshipsAsB: {
            select: {
              id: true,
              relationshipType: true,
              relationshipSummary: true,
              emotionalPattern: true,
              conflictPattern: true,
              attachmentPattern: true,
              powerDynamic: true,
              generatedDynamicSummary: true,
              personA: {
                select: { id: true, name: true, visibility: true },
              },
            },
          },
          characterVoiceAssets: {
            where: { status: "published" },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              assetType: true,
              title: true,
              audioUrl: true,
              transcript: true,
            },
          },
        },
      }),
    null,
  );
}

export async function getPublicPlaceById(id: string) {
  return safe(
    () =>
      prisma.place.findFirst({
        where: { id, visibility: PUBLIC },
        select: {
          id: true,
          name: true,
          description: true,
          placeType: true,
          recordType: true,
          settingProfile: {
            select: {
              physicalDescription: true,
              sounds: true,
              smells: true,
              textures: true,
              lightingConditions: true,
              climateDescription: true,
              dominantActivities: true,
              religiousPresence: true,
              economicContext: true,
            },
          },
          persons: {
            where: { visibility: PUBLIC },
            select: { id: true, name: true, description: true },
          },
          scenes: {
            where: { visibility: PUBLIC, chapter: { visibility: PUBLIC } },
            select: {
              id: true,
              summary: true,
              description: true,
              emotionalTone: true,
              chapter: { select: { id: true, title: true, chapterNumber: true } },
            },
          },
          events: {
            where: { visibility: PUBLIC },
            select: {
              id: true,
              title: true,
              description: true,
              startYear: true,
              endYear: true,
            },
          },
        },
      }),
    null,
  );
}

export type PublicTimelineEra = {
  label: string;
  startYear: number;
  endYear: number;
  events: {
    id: string;
    title: string;
    description: string | null;
    startYear: number | null;
    endYear: number | null;
    chapters: { id: string; title: string }[];
    people: { id: string; name: string }[];
    places: { id: string; name: string }[];
  }[];
};

function decadeLabel(start: number): string {
  const d = Math.floor(start / 10) * 10;
  return `${d}s`;
}

export async function getPublicTimelineData(): Promise<PublicTimelineEra[]> {
  return safe(
    async () => {
      const events = await prisma.event.findMany({
        where: { visibility: PUBLIC },
        orderBy: [{ startYear: "asc" }, { title: "asc" }],
        include: {
          chapters: {
            where: { visibility: PUBLIC },
            select: { id: true, title: true },
          },
          persons: {
            where: { visibility: PUBLIC },
            select: { id: true, name: true },
          },
          places: {
            where: { visibility: PUBLIC },
            select: { id: true, name: true },
          },
        },
      });

      if (!events.length) return [];

      const buckets = new Map<
        string,
        { start: number; end: number; events: typeof events }
      >();

      for (const ev of events) {
        const y = ev.startYear ?? ev.endYear ?? 1900;
        const decadeStart = Math.floor(y / 10) * 10;
        const key = String(decadeStart);
        const cur = buckets.get(key);
        if (cur) {
          cur.events.push(ev);
          cur.start = Math.min(cur.start, decadeStart);
          cur.end = Math.max(cur.end, decadeStart + 9);
        } else {
          buckets.set(key, {
            start: decadeStart,
            end: decadeStart + 9,
            events: [ev],
          });
        }
      }

      const sorted = [...buckets.entries()].sort(
        (a, b) => a[1].start - b[1].start,
      );

      return sorted.map(([, bucket]) => ({
        label: decadeLabel(bucket.start),
        startYear: bucket.start,
        endYear: bucket.end,
        events: bucket.events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          startYear: e.startYear,
          endYear: e.endYear,
          chapters: e.chapters,
          people: e.persons,
          places: e.places,
        })),
      }));
    },
    [],
  );
}

export type PublicSceneNavigation = {
  prevScene: { id: string; label: string } | null;
  nextScene: { id: string; label: string } | null;
  chapter: { id: string; title: string; chapterNumber: number | null };
  nextChapter: { id: string; title: string; chapterNumber: number | null } | null;
};

function sceneCardLabel(summary: string | null, description: string): string {
  const s = summary?.trim();
  if (s) return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  const d = description.trim();
  return d.length > 48 ? `${d.slice(0, 48)}…` : d;
}

export async function getPublicSceneNavigation(
  sceneId: string,
  chapterId: string,
): Promise<PublicSceneNavigation | null> {
  return safe(
    async () => {
      const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, visibility: PUBLIC },
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          scenes: {
            where: { visibility: PUBLIC },
            orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
            select: { id: true, summary: true, description: true },
          },
        },
      });
      if (!chapter) return null;
      const idx = chapter.scenes.findIndex((s) => s.id === sceneId);

      const chapters = await prisma.chapter.findMany({
        where: { visibility: PUBLIC },
        orderBy: [{ chapterNumber: "asc" }, { title: "asc" }],
        select: { id: true, title: true, chapterNumber: true },
      });
      const chIdx = chapters.findIndex((c) => c.id === chapterId);
      const nextChapter =
        chIdx >= 0 && chIdx < chapters.length - 1 ? chapters[chIdx + 1] : null;

      if (idx === -1) {
        return {
          prevScene: null,
          nextScene: null,
          chapter: {
            id: chapter.id,
            title: chapter.title,
            chapterNumber: chapter.chapterNumber,
          },
          nextChapter,
        };
      }

      const prev =
        idx > 0
          ? {
              id: chapter.scenes[idx - 1].id,
              label: sceneCardLabel(
                chapter.scenes[idx - 1].summary,
                chapter.scenes[idx - 1].description,
              ),
            }
          : null;
      const next =
        idx < chapter.scenes.length - 1
          ? {
              id: chapter.scenes[idx + 1].id,
              label: sceneCardLabel(
                chapter.scenes[idx + 1].summary,
                chapter.scenes[idx + 1].description,
              ),
            }
          : null;

      return {
        prevScene: prev,
        nextScene: next,
        chapter: {
          id: chapter.id,
          title: chapter.title,
          chapterNumber: chapter.chapterNumber,
        },
        nextChapter,
      };
    },
    null,
  );
}

export async function getPublicSymbolsIndex() {
  return safe(
    () =>
      prisma.symbol.findMany({
        where: { visibility: PUBLIC },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          meaning: true,
          category: true,
          recordType: true,
        },
      }),
    [],
  );
}

export type PublicSymbolLivingCard = {
  id: string;
  name: string;
  meaning: string | null;
  meaningPrimary: string | null;
  meaningSecondary: string | null;
  emotionalTone: string | null;
  usageContext: string | null;
  category: string | null;
  recordType: string;
  sceneCount: number;
  sceneIds: string[];
};

export async function getPublicSymbolsLivingIndex(): Promise<PublicSymbolLivingCard[]> {
  return safe(
    async () => {
      const rows = await prisma.symbol.findMany({
        where: { visibility: PUBLIC },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          meaning: true,
          meaningPrimary: true,
          meaningSecondary: true,
          emotionalTone: true,
          usageContext: true,
          category: true,
          recordType: true,
          scenes: {
            where: { visibility: PUBLIC, chapter: { visibility: PUBLIC } },
            select: { id: true },
          },
        },
      });
      return rows.map((s) => ({
        id: s.id,
        name: s.name,
        meaning: s.meaning,
        meaningPrimary: s.meaningPrimary,
        meaningSecondary: s.meaningSecondary,
        emotionalTone: s.emotionalTone,
        usageContext: s.usageContext,
        category: s.category,
        recordType: s.recordType,
        sceneCount: s.scenes.length,
        sceneIds: s.scenes.map((x) => x.id),
      }));
    },
    [],
  );
}

/** Hub: latest public chapter + one scene card, counts. */
export async function getPublicReadHubData() {
  return safe(
    async () => {
      const [chapters, chapterCount, characterCount, placeCount, eventRows] =
        await Promise.all([
          prisma.chapter.findMany({
            where: { visibility: PUBLIC },
            orderBy: [{ chapterNumber: "asc" }, { title: "asc" }],
            take: 1,
            select: {
              id: true,
              title: true,
              chapterNumber: true,
              summary: true,
              scenes: {
                where: { visibility: PUBLIC },
                orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
                take: 1,
                select: {
                  id: true,
                  summary: true,
                  description: true,
                  emotionalTone: true,
                },
              },
            },
          }),
          prisma.chapter.count({ where: { visibility: PUBLIC } }),
          prisma.person.count({ where: { visibility: PUBLIC } }),
          prisma.place.count({ where: { visibility: PUBLIC } }),
          prisma.event.findMany({
            where: { visibility: PUBLIC },
            select: { startYear: true, endYear: true },
            take: 80,
          }),
        ]);

      const years = eventRows
        .flatMap((e) => [e.startYear, e.endYear].filter((x): x is number => x != null))
        .sort((a, b) => a - b);
      const timelineSpan =
        years.length >= 2
          ? { from: years[0], to: years[years.length - 1] }
          : years.length === 1
            ? { from: years[0], to: years[0] }
            : null;

      const featured = chapters[0] ?? null;
      const featuredScene = featured?.scenes[0] ?? null;

      return {
        featuredChapter: featured
          ? {
              id: featured.id,
              title: featured.title,
              chapterNumber: featured.chapterNumber,
              summary: featured.summary,
            }
          : null,
        featuredScene: featuredScene
          ? {
              id: featuredScene.id,
              summary: featuredScene.summary,
              description: featuredScene.description,
              emotionalTone: featuredScene.emotionalTone,
              chapterId: featured!.id,
              chapterTitle: featured!.title,
            }
          : null,
        counts: {
          chapters: chapterCount,
          characters: characterCount,
          places: placeCount,
        },
        timelineSpan,
      };
    },
    {
      featuredChapter: null,
      featuredScene: null,
      counts: { chapters: 0, characters: 0, places: 0 },
      timelineSpan: null,
    },
  );
}

/** Public-safe chapter hints from narrative DNA bindings (no source titles). */
export async function getPublicChapterNarrativeHints(chapterId: string): Promise<string[]> {
  return safe(
    async () => {
      const bindings = await prisma.narrativeBinding.findMany({
        where: { targetType: "chapter", targetId: chapterId },
        take: 24,
        orderBy: { updatedAt: "desc" },
        select: { sourceType: true, sourceId: true },
      });
      const ruleIds = bindings.filter((b) => b.sourceType === "narrative_rule").map((b) => b.sourceId);
      const themeIds = bindings.filter((b) => b.sourceType === "theme").map((b) => b.sourceId);
      const [rules, themes] = await Promise.all([
        ruleIds.length
          ? prisma.narrativeRule.findMany({
              where: { id: { in: ruleIds } },
              select: { title: true, description: true },
            })
          : [],
        themeIds.length
          ? prisma.theme.findMany({
              where: { id: { in: themeIds } },
              select: { name: true, description: true },
            })
          : [],
      ]);
      const out: string[] = [];
      for (const r of rules) {
        const d = r.description.trim();
        out.push(`${r.title}: ${d.slice(0, 220)}${d.length > 220 ? "…" : ""}`);
      }
      for (const t of themes) {
        const d = t.description.trim();
        out.push(`${t.name} — ${d.slice(0, 180)}${d.length > 180 ? "…" : ""}`);
      }
      return out.slice(0, 6);
    },
    [],
  );
}

/** Public symbols bound to a place (visibility PUBLIC only). */
export async function getPublicPlaceSymbolicHints(placeId: string): Promise<string[]> {
  return safe(
    async () => {
      const bindings = await prisma.narrativeBinding.findMany({
        where: { targetType: "place", targetId: placeId, sourceType: "symbol" },
        take: 16,
        orderBy: { updatedAt: "desc" },
        select: { sourceId: true },
      });
      const ids = [...new Set(bindings.map((b) => b.sourceId))];
      if (!ids.length) return [];
      const syms = await prisma.symbol.findMany({
        where: { id: { in: ids }, visibility: PUBLIC },
        select: { name: true, meaningPrimary: true, meaning: true },
        take: 8,
      });
      return syms.map((s) => {
        const m = (s.meaningPrimary ?? s.meaning ?? "").trim();
        return m
          ? `${s.name}: ${m.slice(0, 200)}${m.length > 200 ? "…" : ""}`
          : s.name;
      });
    },
    [],
  );
}
