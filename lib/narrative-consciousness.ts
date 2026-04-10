import type { Prisma } from "@prisma/client";
import { VisibilityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { profileJsonFieldToString } from "@/lib/profile-json";

const PUBLIC_PASS_STATUSES = ["accepted", "revised"] as const;

export type NarrativeConsciousnessOptions = {
  /** When false, skip heavier relationship / memory joins. */
  includeRelationships?: boolean;
  /** Restrict relationship rows to publicly visible counterparts (reader-safe). */
  publicOnly?: boolean;
};

export type NarrativeConsciousnessContext = {
  metaSceneId: string;
  sceneId: string | null;
  title: string;
  place: {
    name: string;
    description: string | null;
    setting: {
      sounds: string | null;
      smells: string | null;
      textures: string | null;
      lightingConditions: string | null;
      physicalDescription: string | null;
    } | null;
  };
  povPerson: {
    id: string;
    name: string;
    profile: {
      sensoryBias: string | null;
      memoryBias: string | null;
      emotionalBaseline: string | null;
      attentionBias: string | null;
      relationalStyle: string | null;
      speechPatterns: string | null;
      coreFear: string | null;
      coreLonging: string | null;
      defensiveStyle: string | null;
      griefPattern: string | null;
      shameTrigger: string | null;
      internalConflicts: Prisma.JsonValue | null;
    } | null;
  };
  participants: string[];
  narrativePasses: {
    passType: string;
    content: string;
    summary: string | null;
  }[];
  metaFields: {
    environmentDescription: string | null;
    sensoryField: string | null;
    historicalConstraints: string | null;
    socialConstraints: string | null;
    emotionalVoltage: string | null;
    centralConflict: string | null;
    symbolicElements: string | null;
    narrativePurpose: string | null;
    characterStatesSummary: string | null;
  };
  relationships: {
    otherName: string;
    summary: string;
    emotional: string | null;
    tension: string | null;
  }[];
  voicePasses: { passType: string; summary: string | null; content: string }[];
};

const profileSelect = {
  sensoryBias: true,
  memoryBias: true,
  emotionalBaseline: true,
  attentionBias: true,
  relationalStyle: true,
  speechPatterns: true,
  coreFear: true,
  coreLonging: true,
  defensiveStyle: true,
  griefPattern: true,
  shameTrigger: true,
  internalConflicts: true,
} as const;

const settingSelect = {
  sounds: true,
  smells: true,
  textures: true,
  lightingConditions: true,
  physicalDescription: true,
} as const;

export async function buildNarrativeConsciousnessContext(
  metaSceneId: string,
  options: NarrativeConsciousnessOptions = {},
): Promise<NarrativeConsciousnessContext | null> {
  const includeRelationships = options.includeRelationships !== false;
  const publicOnly = options.publicOnly === true;

  const row = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    select: {
      id: true,
      title: true,
      sceneId: true,
      participants: true,
      environmentDescription: true,
      sensoryField: true,
      historicalConstraints: true,
      socialConstraints: true,
      emotionalVoltage: true,
      centralConflict: true,
      symbolicElements: true,
      narrativePurpose: true,
      characterStatesSummary: true,
      place: {
        select: {
          name: true,
          description: true,
          settingProfile: { select: settingSelect },
        },
      },
      povPerson: {
        select: {
          id: true,
          name: true,
          characterProfile: { select: profileSelect },
        },
      },
      narrativePasses: {
        where: { status: { in: [...PUBLIC_PASS_STATUSES] } },
        orderBy: { updatedAt: "desc" },
        select: { passType: true, content: true, summary: true },
      },
      voicePasses: {
        where: { status: { in: [...PUBLIC_PASS_STATUSES] } },
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: { passType: true, summary: true, content: true },
      },
    },
  });

  if (!row) return null;

  const povId = row.povPerson.id;
  const relationships: NarrativeConsciousnessContext["relationships"] = [];

  if (includeRelationships) {
    const [asA, asB] = await Promise.all([
      prisma.characterRelationship.findMany({
        where: {
          personAId: povId,
          ...(publicOnly ? { personB: { visibility: VisibilityStatus.PUBLIC } } : {}),
        },
        select: {
          relationshipSummary: true,
          emotionalPattern: true,
          conflictPattern: true,
          generatedDynamicSummary: true,
          personB: { select: { name: true } },
        },
      }),
      prisma.characterRelationship.findMany({
        where: {
          personBId: povId,
          ...(publicOnly ? { personA: { visibility: VisibilityStatus.PUBLIC } } : {}),
        },
        select: {
          relationshipSummary: true,
          emotionalPattern: true,
          conflictPattern: true,
          generatedDynamicSummary: true,
          personA: { select: { name: true } },
        },
      }),
    ]);
    for (const r of asA) {
      const summary =
        r.generatedDynamicSummary?.trim() ||
        r.relationshipSummary?.trim() ||
        "";
      if (!summary) continue;
      relationships.push({
        otherName: r.personB.name,
        summary,
        emotional: r.emotionalPattern?.trim() ?? null,
        tension: r.conflictPattern?.trim() ?? null,
      });
    }
    for (const r of asB) {
      const summary =
        r.generatedDynamicSummary?.trim() ||
        r.relationshipSummary?.trim() ||
        "";
      if (!summary) continue;
      relationships.push({
        otherName: r.personA.name,
        summary,
        emotional: r.emotionalPattern?.trim() ?? null,
        tension: r.conflictPattern?.trim() ?? null,
      });
    }
  }

  return {
    metaSceneId: row.id,
    sceneId: row.sceneId,
    title: row.title,
    place: {
      name: row.place.name,
      description: row.place.description ?? null,
      setting: row.place.settingProfile,
    },
    povPerson: {
      id: row.povPerson.id,
      name: row.povPerson.name,
      profile: row.povPerson.characterProfile,
    },
    participants: row.participants ?? [],
    narrativePasses: row.narrativePasses.map((p) => ({
      passType: p.passType,
      content: p.content,
      summary: p.summary,
    })),
    metaFields: {
      environmentDescription: row.environmentDescription,
      sensoryField: row.sensoryField,
      historicalConstraints: row.historicalConstraints,
      socialConstraints: row.socialConstraints,
      emotionalVoltage: row.emotionalVoltage,
      centralConflict: row.centralConflict,
      symbolicElements: row.symbolicElements,
      narrativePurpose: row.narrativePurpose,
      characterStatesSummary: row.characterStatesSummary,
    },
    relationships,
    voicePasses: row.voicePasses,
  };
}

function joinHints(parts: (string | null | undefined)[], maxLen = 480): string {
  const t = parts.map((p) => p?.trim()).filter(Boolean) as string[];
  const s = t.join(" ").replace(/\s+/g, " ").trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

export function derivePovPerceptualField(context: NarrativeConsciousnessContext): string {
  const p = context.povPerson.profile;
  const bias = joinHints([p?.sensoryBias, p?.attentionBias, context.metaFields.sensoryField]);
  const env = joinHints([context.metaFields.environmentDescription, context.place.setting?.physicalDescription]);
  if (!bias && !env) {
    return `${context.povPerson.name} moves through ${context.place.name} with attention still forming.`;
  }
  return joinHints(
    [
      `${context.povPerson.name}'s attention bends toward:`,
      bias || null,
      `The place offers: ${env || "details not yet named"}.`,
    ],
    560,
  );
}

export function deriveEmotionalUndercurrent(context: NarrativeConsciousnessContext): string {
  const p = context.povPerson.profile;
  return joinHints(
    [
      context.metaFields.emotionalVoltage,
      p?.emotionalBaseline,
      p?.coreLonging,
      p?.coreFear,
      context.metaFields.centralConflict,
    ],
    520,
  );
}

export function deriveBodilyExperience(context: NarrativeConsciousnessContext): string {
  const p = context.povPerson.profile;
  return joinHints(
    [
      context.metaFields.characterStatesSummary,
      p?.griefPattern,
      p?.shameTrigger,
      p?.defensiveStyle,
      context.place.setting?.textures,
      context.place.setting?.lightingConditions,
    ],
    480,
  );
}

export function deriveUnspokenThoughtStream(context: NarrativeConsciousnessContext): string {
  const p = context.povPerson.profile;
  const passHint = context.narrativePasses[0]?.summary ?? context.narrativePasses[0]?.content;
  return joinHints(
    [
      profileJsonFieldToString(p?.internalConflicts) || null,
      p?.relationalStyle,
      passHint ? `What the scene leans toward (without naming it outright): ${passHint.slice(0, 220)}` : null,
    ],
    500,
  );
}

export function deriveDelayedMeaning(context: NarrativeConsciousnessContext): string {
  return joinHints(
    [
      context.metaFields.symbolicElements,
      context.metaFields.narrativePurpose,
      context.metaFields.historicalConstraints,
    ],
    420,
  );
}

export function deriveNarrativeGravityHooks(context: NarrativeConsciousnessContext): string[] {
  const hooks: string[] = [];
  if (context.metaFields.centralConflict?.trim()) {
    hooks.push(`The unresolved pressure: ${context.metaFields.centralConflict.trim().slice(0, 160)}`);
  }
  if (context.metaFields.socialConstraints?.trim()) {
    hooks.push(`What the room expects: ${context.metaFields.socialConstraints.trim().slice(0, 160)}`);
  }
  if (context.povPerson.profile?.coreLonging?.trim()) {
    hooks.push(`A want that does not announce itself: ${context.povPerson.profile.coreLonging.trim().slice(0, 140)}`);
  }
  if (context.relationships[0]?.tension?.trim()) {
    hooks.push(`Between people: ${context.relationships[0].tension.trim().slice(0, 160)}`);
  }
  return hooks.slice(0, 5);
}

export function deriveSceneMysteryPressure(context: NarrativeConsciousnessContext): string {
  return joinHints(
    [
      context.metaFields.historicalConstraints,
      context.metaFields.symbolicElements,
      "Some things are known; some are only felt.",
    ],
    380,
  );
}

export function deriveContinuationImpulse(context: NarrativeConsciousnessContext): string {
  const nextVoice = context.voicePasses.find((v) => v.passType === "emotional_gravity");
  if (nextVoice?.summary?.trim()) return nextVoice.summary.trim().slice(0, 220);
  if (context.metaFields.narrativePurpose?.trim()) {
    return `The scene asks you to stay for: ${context.metaFields.narrativePurpose.trim().slice(0, 180)}`;
  }
  if (context.narrativePasses[0]?.summary?.trim()) {
    return context.narrativePasses[0].summary!.trim().slice(0, 220);
  }
  return "The thread tightens—another beat will answer the one you just felt.";
}
