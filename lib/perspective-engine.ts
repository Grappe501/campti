import type {
  CharacterMemory,
  CharacterProfile,
  CharacterState,
  EnneagramType,
  MetaScene,
  SettingProfile,
  SettingState,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadNarrativeDNAForPerson } from "@/lib/narrative-dna-context";
import {
  deriveAttentionBias,
  deriveConflictStyle,
  deriveLikelyBlindSpot,
  deriveLikelySceneFocus,
  deriveStressBehavior,
  getEnneagramProfile,
} from "@/lib/enneagram-engine";
import {
  howEnvironmentActsOnCharacter,
  howHungerGriefFearChangeAttention,
  howLaborOrFatigueChangesPerception,
  howSocialRiskChangesPerception,
  howWeatherChangesPerception,
} from "@/lib/embodied-environment";

export type CharacterPerspectiveContext = {
  personId: string;
  placeId: string;
  timePeriod: string | null;
  characterProfile: CharacterProfile | null;
  memories: CharacterMemory[];
  settingProfile: SettingProfile | null;
  settingStates: SettingState[];
  linkedFragments: {
    id: string;
    title: string | null;
    fragmentType: string;
    linkRole: string | null;
    linkedType: string;
    linkedId: string;
  }[];
  constraints: {
    historical: string | null;
    social: string | null;
  };
  emotionalContext: {
    baseline: string | null;
    fromMemories: { description: string; weight: number | null; reliability: string | null }[];
  };
  /** Narrative DNA bindings that target this person (patterns, themes, rules). */
  narrativeDNA?: {
    patterns: { id: string; title: string; patternType: string }[];
    themes: { id: string; name: string }[];
    rules: { id: string; title: string }[];
  };
};

/**
 * Assembles POV-relevant state for a person at a place and optional time window.
 * Safe when profiles are missing — returns nulls and empty arrays instead of throwing.
 */
export async function getCharacterPerspectiveContext(
  personId: string,
  placeId: string,
  timePeriod?: string | null,
  metaSceneId?: string | null,
): Promise<CharacterPerspectiveContext> {
  const [profile, memories, settingProfile, settingStates] = await Promise.all([
    prisma.characterProfile.findUnique({ where: { personId } }),
    prisma.characterMemory.findMany({
      where: {
        personId,
        ...(timePeriod
          ? {
              OR: [{ timePeriod: null }, { timePeriod: "" }, { timePeriod }],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.settingProfile.findUnique({ where: { placeId } }),
    prisma.settingState.findMany({
      where: {
        placeId,
        ...(timePeriod
          ? {
              OR: [{ timePeriod: null }, { timePeriod: "" }, { timePeriod }],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const profileId = profile?.id;
  const settingId = settingProfile?.id;
  const memoryIds = memories.map((m) => m.id);

  const orClauses: { linkedType: string; linkedId: string }[] = [
    { linkedType: "person", linkedId: personId },
    { linkedType: "place", linkedId: placeId },
  ];
  if (profileId) orClauses.push({ linkedType: "character_profile", linkedId: profileId });
  if (settingId) orClauses.push({ linkedType: "setting_profile", linkedId: settingId });
  for (const id of memoryIds) {
    orClauses.push({ linkedType: "character_memory", linkedId: id });
  }

  const metaRow =
    metaSceneId != null && metaSceneId !== ""
      ? await prisma.metaScene.findUnique({
          where: { id: metaSceneId },
          select: { historicalConstraints: true, socialConstraints: true },
        })
      : null;

  const links = await prisma.fragmentLink.findMany({
    where: { OR: orClauses },
    include: {
      fragment: { select: { id: true, title: true, fragmentType: true } },
    },
    take: 120,
    orderBy: { updatedAt: "desc" },
  });

  const seen = new Set<string>();
  const linkedFragments: CharacterPerspectiveContext["linkedFragments"] = [];
  for (const l of links) {
    if (seen.has(l.fragment.id)) continue;
    seen.add(l.fragment.id);
    linkedFragments.push({
      id: l.fragment.id,
      title: l.fragment.title,
      fragmentType: l.fragment.fragmentType,
      linkRole: l.linkRole,
      linkedType: l.linkedType,
      linkedId: l.linkedId,
    });
  }

  const narrativeDNA = await loadNarrativeDNAForPerson(personId);

  return {
    personId,
    placeId,
    timePeriod: timePeriod ?? null,
    characterProfile: profile,
    memories,
    settingProfile,
    settingStates,
    linkedFragments,
    constraints: {
      historical: metaRow?.historicalConstraints?.trim() ?? null,
      social: metaRow?.socialConstraints?.trim() ?? null,
    },
    emotionalContext: {
      baseline: profile?.emotionalBaseline ?? null,
      fromMemories: memories.map((m) => ({
        description: m.description,
        weight: m.emotionalWeight,
        reliability: m.reliability,
      })),
    },
    narrativeDNA:
      narrativeDNA.patterns.length + narrativeDNA.themes.length + narrativeDNA.rules.length > 0
        ? narrativeDNA
        : undefined,
  };
}

export type MetaSceneWorldContext = {
  metaScene: MetaScene & {
    place: { id: string; name: string } | null;
    povPerson: { id: string; name: string } | null;
    scene: { id: string; description: string; chapter: { title: string } } | null;
  };
  characterStates: CharacterState[];
  settingProfile: SettingProfile | null;
  settingStates: SettingState[];
  linkedFragments: { fragmentId: string; linkRole: string | null; linkedType: string }[];
  symbolicLayer: {
    symbolicElements: string | null;
    narrativePurpose: string | null;
    emotionalVoltage: string | null;
  };
};

/**
 * Full structured “world state” for a meta scene (DB-backed, no generation).
 */
export async function buildMetaSceneContext(metaSceneId: string): Promise<MetaSceneWorldContext | null> {
  const meta = await prisma.metaScene.findUnique({
    where: { id: metaSceneId },
    include: {
      place: { select: { id: true, name: true } },
      povPerson: { select: { id: true, name: true } },
      scene: {
        select: {
          id: true,
          description: true,
          chapter: { select: { title: true } },
        },
      },
    },
  });
  if (!meta) return null;

  const [characterStates, settingProfile, settingStates, fragmentLinks] = await Promise.all([
    prisma.characterState.findMany({
      where: { personId: meta.povPersonId, ...(meta.sceneId ? { sceneId: meta.sceneId } : {}) },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.settingProfile.findUnique({ where: { placeId: meta.placeId } }),
    prisma.settingState.findMany({
      where: {
        placeId: meta.placeId,
        OR: [{ timePeriod: null }, { timePeriod: "" }, { timePeriod: meta.timePeriod ?? undefined }],
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.fragmentLink.findMany({
      where: { linkedType: "meta_scene", linkedId: meta.id },
      select: { fragmentId: true, linkRole: true, linkedType: true },
    }),
  ]);

  return {
    metaScene: meta,
    characterStates,
    settingProfile,
    settingStates,
    linkedFragments: fragmentLinks.map((l) => ({
      fragmentId: l.fragmentId,
      linkRole: l.linkRole,
      linkedType: l.linkedType,
    })),
    symbolicLayer: {
      symbolicElements: meta.symbolicElements,
      narrativePurpose: meta.narrativePurpose,
      emotionalVoltage: meta.emotionalVoltage,
    },
  };
}

export type PerspectiveNarrativeInput = {
  personId: string;
  placeId: string;
  timePeriod?: string | null;
  sceneId?: string | null;
  /** When set, stub can surface meta scene source support and constraints (no LLM). */
  metaSceneId?: string | null;
};

export type PerspectiveNarrativeStub = {
  seen: string;
  felt: string;
  thought: string;
  feared: string;
  possible: string;
  meta?: { sceneId?: string | null;
    sourceSupport?: string | null };
};

/**
 * Stub narrative layer — returns structured slots filled from persisted models only.
 * Replace later with a grounded LLM pass that respects `historicalConstraints` on MetaScene.
 */
export async function generatePerspectiveNarrative(input: PerspectiveNarrativeInput): Promise<PerspectiveNarrativeStub> {
  const ctx = await getCharacterPerspectiveContext(input.personId, input.placeId, input.timePeriod, input.metaSceneId);

  const metaRow =
    input.metaSceneId != null && input.metaSceneId !== ""
      ? await prisma.metaScene.findUnique({
          where: { id: input.metaSceneId },
          select: { sourceSupportLevel: true, historicalConstraints: true, socialConstraints: true },
        })
      : null;

  const placeName = await prisma.place.findUnique({
    where: { id: input.placeId },
    select: { name: true },
  });

  const sensoryParts = [
    ctx.settingProfile?.sounds,
    ctx.settingProfile?.smells,
    ctx.settingProfile?.textures,
    ctx.settingProfile?.lightingConditions,
  ].filter(Boolean);

  const seen =
    sensoryParts.length > 0
      ? `At ${placeName?.name ?? "this place"}, sensory cues recorded in the setting model: ${sensoryParts.join("; ")}.`
      : `No structured sensory field yet for ${placeName?.name ?? "this place"} — add a setting profile or fragments.`;

  const felt =
    ctx.emotionalContext.baseline ||
    (ctx.memories.length
      ? `Weighted memories (${ctx.memories.length}) shape felt experience; review reliability notes per memory.`
      : "Emotional baseline not set; memory layer is empty or sparse.");

  const thought =
    ctx.characterProfile?.coreBeliefs ||
    ctx.characterProfile?.worldview ||
    "Worldview / core beliefs not recorded — add a character profile when ready.";

  const feared = ctx.characterProfile?.fears || "Fears not recorded.";

  const basePossible =
    ctx.characterProfile?.desires ||
    "Desires and affordances not recorded — historical constraints apply once meta scene is linked.";

  const constraintNote =
    metaRow?.historicalConstraints?.trim() || metaRow?.socialConstraints?.trim()
      ? ` Declared constraints on the meta scene: ${[metaRow.historicalConstraints, metaRow.socialConstraints].filter(Boolean).join(" · ")}`
      : "";

  const possible = `${basePossible}${constraintNote}`;

  return {
    seen,
    felt,
    thought,
    feared,
    possible,
    meta: {
      sceneId: input.sceneId ?? null,
      sourceSupport: metaRow?.sourceSupportLevel?.trim() ?? null,
    },
  };
}

/** Lived-consciousness layer for POV — deterministic, profile + Enneagram law + setting + memories. */
export type EmbodiedSalience = {
  sensory: string[];
  emotional: string[];
  social: string[];
};

export type EmbodiedPerspectiveContext = {
  personId: string;
  placeId: string;
  timePeriod: string | null;
  metaSceneId: string | null;
  characterProfile: CharacterProfile | null;
  enneagramType: EnneagramType | null;
  enneagramDerived: ReturnType<typeof getEnneagramProfile> | null;
  memories: CharacterMemory[];
  settingProfile: SettingProfile | null;
  settingStates: SettingState[];
  linkedFragments: CharacterPerspectiveContext["linkedFragments"];
  constraints: CharacterPerspectiveContext["constraints"];
  environmentalPressure: string;
  salience: EmbodiedSalience;
};

export async function buildEmbodiedPerspectiveContext(
  personId: string,
  placeId: string,
  timePeriod?: string | null,
  metaSceneId?: string | null,
): Promise<EmbodiedPerspectiveContext> {
  const base = await getCharacterPerspectiveContext(personId, placeId, timePeriod, metaSceneId);
  const profile = base.characterProfile;
  const et = profile?.enneagramType ?? null;
  const wing = profile?.enneagramWing ?? null;
  const derived = et ? getEnneagramProfile(et, wing) : null;

  const envAct = howEnvironmentActsOnCharacter({
    settingProfile: base.settingProfile,
    settingStates: base.settingStates,
    constraints: base.constraints,
  });
  const weatherNote = howWeatherChangesPerception({ settingStates: base.settingStates, settingProfile: base.settingProfile });
  const socialRisk = howSocialRiskChangesPerception({ settingProfile: base.settingProfile, constraints: base.constraints });
  const labor = howLaborOrFatigueChangesPerception({ characterProfile: profile, settingProfile: base.settingProfile });
  const body = howHungerGriefFearChangeAttention({ characterProfile: profile, memories: base.memories });

  const environmentalPressure = [envAct, weatherNote, socialRisk, labor, body].filter(Boolean).join(" ");

  const sensory: string[] = [];
  if (base.settingProfile?.sounds) sensory.push(`sounds: ${base.settingProfile.sounds.slice(0, 120)}`);
  if (base.settingProfile?.smells) sensory.push(`smells: ${base.settingProfile.smells.slice(0, 120)}`);
  if (base.settingProfile?.textures) sensory.push(`textures: ${base.settingProfile.textures.slice(0, 120)}`);

  const emotional: string[] = [];
  if (base.emotionalContext.baseline) emotional.push(`baseline: ${base.emotionalContext.baseline}`);
  for (const m of base.memories.slice(0, 3)) {
    emotional.push(`memory (w${m.emotionalWeight ?? "?"}): ${m.description.slice(0, 140)}`);
  }

  const social: string[] = [];
  if (base.constraints.social) social.push(`social constraint: ${base.constraints.social.slice(0, 160)}`);
  if (base.settingProfile?.socialRules) social.push(`rules: ${base.settingProfile.socialRules.slice(0, 160)}`);

  return {
    personId,
    placeId,
    timePeriod: timePeriod ?? null,
    metaSceneId: metaSceneId ?? null,
    characterProfile: profile,
    enneagramType: et,
    enneagramDerived: derived,
    memories: base.memories,
    settingProfile: base.settingProfile,
    settingStates: base.settingStates,
    linkedFragments: base.linkedFragments,
    constraints: base.constraints,
    environmentalPressure,
    salience: { sensory, emotional, social },
  };
}

export function deriveWhatThisCharacterNoticesFirst(ctx: EmbodiedPerspectiveContext): string {
  if (ctx.characterProfile?.sensoryBias?.trim()) return `Profile bias: ${ctx.characterProfile.sensoryBias}`;
  if (ctx.enneagramDerived) return `Type lens (${ctx.enneagramDerived.label}): ${deriveAttentionBias(ctx.enneagramType!)}`;
  return "No explicit sensory bias or Enneagram law — default to concrete motion, faces, and sound.";
}

export function deriveWhatThisCharacterMisses(ctx: EmbodiedPerspectiveContext): string {
  if (ctx.enneagramDerived) return deriveLikelyBlindSpot(ctx.enneagramType!);
  return ctx.characterProfile?.memoryBias?.trim() ? `Memory bias may hide: ${ctx.characterProfile.memoryBias}` : "Underspecified — blind spot not inferable without type or bias notes.";
}

export function deriveWhatFeelsSafeOrThreatening(ctx: EmbodiedPerspectiveContext): string {
  const fear = ctx.characterProfile?.fears?.trim();
  const longing = ctx.characterProfile?.desires?.trim();
  const stress = ctx.enneagramType ? deriveStressBehavior(ctx.enneagramType) : "";
  return [
    fear ? `Named fear: ${fear}` : null,
    longing ? `Named desire: ${longing}` : null,
    stress ? `Under stress: ${stress}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function deriveWhatTriggersMemory(ctx: EmbodiedPerspectiveContext): string {
  if (ctx.memories.length === 0) return "No memories on file — triggers are unmoored.";
  const top = ctx.memories[0];
  return `Strongest recent memory (weight ${top.emotionalWeight ?? "—"}): ${top.description.slice(0, 220)}`;
}

export function deriveWhatThisCharacterWouldNeverSay(ctx: EmbodiedPerspectiveContext): string {
  if (ctx.enneagramDerived) {
    return `Type guardrail (${ctx.enneagramDerived.label}): ${deriveConflictStyle(ctx.enneagramType!)} — avoid dialogue that contradicts this unless breaking character is intentional.`;
  }
  return "Without Enneagram law, anchor only on speech patterns / moral framework in profile.";
}

export function deriveWhatThisCharacterNeedsButCannotName(ctx: EmbodiedPerspectiveContext): string {
  const longing = ctx.characterProfile?.coreLonging?.trim() || ctx.enneagramDerived?.coreLonging;
  const fear = ctx.characterProfile?.coreFear?.trim() || ctx.enneagramDerived?.coreFear;
  return [
    longing ? `Longing (explicit or type-default): ${longing}` : null,
    fear ? `Fear underside: ${fear}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function deriveEnvironmentalInterpretation(ctx: EmbodiedPerspectiveContext): string {
  const place = ctx.settingProfile?.environmentType?.trim();
  const focus = ctx.enneagramType ? deriveLikelySceneFocus(ctx.enneagramType) : "Open perceptual field.";
  return [place ? `Place reads as: ${place}` : null, `Environmental pressure: ${ctx.environmentalPressure}`, `Scene emphasis: ${focus}`]
    .filter(Boolean)
    .join(" ");
}

export type EmbodiedPerspectiveOutput = {
  sensorySalience: EmbodiedSalience;
  emotionalSalience: string;
  socialSalience: string;
  threatPerception: string;
  desirePull: string;
  memoryActivation: string;
  internalTension: string;
};

export function summarizeEmbodiedPerspective(ctx: EmbodiedPerspectiveContext): EmbodiedPerspectiveOutput {
  return {
    sensorySalience: ctx.salience,
    emotionalSalience:
      ctx.characterProfile?.emotionalBaseline?.trim() ||
      ctx.salience.emotional.join(" | ") ||
      "—",
    socialSalience: ctx.salience.social.join(" | ") || "—",
    threatPerception: deriveWhatFeelsSafeOrThreatening(ctx),
    desirePull: ctx.characterProfile?.desires?.trim() ?? ctx.enneagramDerived?.coreLonging ?? "—",
    memoryActivation: deriveWhatTriggersMemory(ctx),
    internalTension: ctx.characterProfile?.internalConflicts?.trim() ?? "—",
  };
}

