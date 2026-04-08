import type { MetaScene } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildEmbodiedPerspectiveContext,
  deriveEnvironmentalInterpretation,
  deriveWhatThisCharacterMisses,
  deriveWhatThisCharacterNeedsButCannotName,
  deriveWhatThisCharacterNoticesFirst,
  deriveWhatThisCharacterWouldNeverSay,
  deriveWhatTriggersMemory,
  summarizeEmbodiedPerspective,
} from "@/lib/perspective-engine";
import { buildRelationshipContext, deriveLikelyConflictLoop } from "@/lib/relationship-dynamics";
import { deriveHeartDeficits } from "@/lib/scene-heart";
import {
  formatNarrativeDnaForScenePass,
  getNarrativeDnaContextForMetaScene,
} from "@/lib/narrative-dna-context";

export type SceneSoulContext = {
  metaScene: MetaScene;
  embodied: Awaited<ReturnType<typeof buildEmbodiedPerspectiveContext>>;
  participantIds: string[];
  relationshipNotes: string[];
};

export async function buildSceneSoulContext(metaSceneId: string): Promise<SceneSoulContext | null> {
  const meta = await prisma.metaScene.findUnique({ where: { id: metaSceneId } });
  if (!meta) return null;

  const embodied = await buildEmbodiedPerspectiveContext(
    meta.povPersonId,
    meta.placeId,
    meta.timePeriod,
    metaSceneId,
  );

  const people = await prisma.person.findMany({ select: { id: true, name: true } });
  const participantIds: string[] = [];
  const relationshipNotes: string[] = [];
  const seenPid = new Set<string>();
  for (const line of meta.participants) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const byId = people.find((p) => p.id === trimmed);
    const byName =
      byId ??
      people.find(
        (p) =>
          trimmed.includes(p.name) ||
          p.name.toLowerCase().includes(trimmed.slice(0, 24).toLowerCase()),
      );
    if (byName && byName.id !== meta.povPersonId && !seenPid.has(byName.id)) {
      seenPid.add(byName.id);
      participantIds.push(byName.id);
      const rc = await buildRelationshipContext(meta.povPersonId, byName.id);
      if (rc?.enneagramRead) relationshipNotes.push(rc.enneagramRead);
    }
  }

  return { metaScene: meta, embodied, participantIds, relationshipNotes };
}

export async function deriveSceneEmotionalEngine(metaSceneId: string): Promise<string> {
  const ctx = await buildSceneSoulContext(metaSceneId);
  if (!ctx) return "";
  const m = ctx.metaScene;
  return [
    m.emotionalVoltage?.trim() ? `Voltage: ${m.emotionalVoltage}` : null,
    m.centralConflict?.trim() ? `Conflict: ${m.centralConflict}` : null,
    summarizeEmbodiedPerspective(ctx.embodied).threatPerception,
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function deriveSceneOpeningImpulse(metaSceneId: string): Promise<string> {
  const ctx = await buildSceneSoulContext(metaSceneId);
  if (!ctx) return "";
  return deriveWhatThisCharacterNoticesFirst(ctx.embodied);
}

export async function deriveSceneInteriorPressure(metaSceneId: string): Promise<string> {
  const ctx = await buildSceneSoulContext(metaSceneId);
  if (!ctx) return "";
  return ctx.embodied.environmentalPressure;
}

export async function deriveSceneUnspokenCurrent(metaSceneId: string): Promise<string> {
  const ctx = await buildSceneSoulContext(metaSceneId);
  if (!ctx) return "";
  return deriveWhatThisCharacterNeedsButCannotName(ctx.embodied);
}

export async function deriveSceneEmbodiedSymbolism(metaSceneId: string): Promise<string> {
  const ctx = await buildSceneSoulContext(metaSceneId);
  if (!ctx) return "";
  const sym = ctx.metaScene.symbolicElements?.trim();
  return sym ? `Declared symbols: ${sym}` : "Symbolic layer empty — symbol is not yet alive in metadata.";
}

export type StructuredScenePass = {
  openingPerception: string;
  dominantEmotion: string;
  hiddenEmotion: string;
  bodilyFeeling: string;
  noticesFirst: string;
  misinterpretation: string;
  memoryActivated: string;
  relationshipPressure: string;
  liveSymbol: string;
  tensionEscalation: string;
  emotionalBeatProgression: string;
  /** Bound narrative DNA (themes, symbols, rules, patterns) for this meta scene — admin-facing depth, not reader copy. */
  narrativeCoherenceNotes: string;
};

export async function composeStructuredScenePass(metaSceneId: string): Promise<StructuredScenePass | null> {
  const ctx = await buildSceneSoulContext(metaSceneId);
  if (!ctx) return null;
  const m = ctx.metaScene;
  const emb = ctx.embodied;
  const prof = emb.characterProfile;

  const dnaSlice = await getNarrativeDnaContextForMetaScene(metaSceneId);
  const dnaText = formatNarrativeDnaForScenePass(dnaSlice);

  const [aProfile, bProfile] = await Promise.all([
    prisma.characterProfile.findUnique({ where: { personId: m.povPersonId } }),
    ctx.participantIds[0]
      ? prisma.characterProfile.findUnique({ where: { personId: ctx.participantIds[0] } })
      : Promise.resolve(null),
  ]);

  const conflictLoop =
    ctx.participantIds.length > 0 ? deriveLikelyConflictLoop(aProfile, bProfile) : "No named participant id — relationship loop not computed.";

  const declaredSymbol = m.symbolicElements?.trim() || "—";
  const liveSymbol =
    dnaText.length > 0
      ? `${declaredSymbol}\n\n— Bound narrative context —\n${dnaText}`
      : declaredSymbol;

  return {
    openingPerception: deriveWhatThisCharacterNoticesFirst(emb),
    dominantEmotion: m.emotionalVoltage?.trim() || prof?.emotionalBaseline?.trim() || "—",
    hiddenEmotion: prof?.internalConflicts?.trim() || "—",
    bodilyFeeling: prof?.sensoryBias?.trim() || emb.salience.sensory.join(", ") || "—",
    noticesFirst: deriveWhatThisCharacterNoticesFirst(emb),
    misinterpretation: `Likely blind spot: ${deriveWhatThisCharacterMisses(emb)}`,
    memoryActivated: deriveWhatTriggersMemory(emb),
    relationshipPressure: ctx.relationshipNotes.join(" | ") || "—",
    liveSymbol,
    tensionEscalation: m.centralConflict?.trim() || "—",
    emotionalBeatProgression: [m.narrativePurpose?.trim(), conflictLoop].filter(Boolean).join(" → "),
    narrativeCoherenceNotes: dnaText,
  };
}

/** Persistable soul suggestions (caller writes SceneSoulSuggestion rows). */
export async function buildSceneSoulSuggestionPayloads(metaSceneId: string) {
  const pass = await composeStructuredScenePass(metaSceneId);
  const heart = await deriveHeartDeficits(metaSceneId);
  const ctx = await buildSceneSoulContext(metaSceneId);
  if (!pass || !ctx) return [];

  const confidence = 3;
  const povFocus = deriveEnvironmentalInterpretation(ctx.embodied);
  const engine = await deriveSceneEmotionalEngine(metaSceneId);
  const interior = await deriveSceneInteriorPressure(metaSceneId);
  return [
    {
      title: "Opening impulse",
      suggestionType: "opening_impulse",
      summary: `${pass.openingPerception} — Editorial note: let the first beat be attention, not explanation; readers should feel bias before they understand it.`,
      confidence,
    },
    {
      title: "Emotional engine",
      suggestionType: "emotional_engine",
      summary: `${engine} — Ask whether voltage is specific enough to choreograph breath, face, and pacing.`,
      confidence,
    },
    {
      title: "Unspoken current",
      suggestionType: "unspoken_current",
      summary: `${pass.hiddenEmotion} — What the room cannot say aloud yet; keep subtext in gesture and avoidance.`,
      confidence,
    },
    {
      title: "Memory trigger",
      suggestionType: "memory_trigger",
      summary: `${pass.memoryActivated} — Memory should change how the present is read, not merely annotate it.`,
      confidence,
    },
    {
      title: "Symbolism",
      suggestionType: "symbolism_activation",
      summary: `${pass.liveSymbol} — Prefer symbols that do work: recurrence, friction, or ironic innocence.${
        pass.narrativeCoherenceNotes
          ? ` Narrative bindings present — align declared imagery with bound themes/symbols where appropriate.`
          : ""
      }`,
      confidence,
    },
    {
      title: "Relationship pressure",
      suggestionType: "relationship_pressure",
      summary: `${pass.relationshipPressure} — Let social obligation and misread care create torque.`,
      confidence,
    },
    {
      title: "Embodied environment",
      suggestionType: "embodied_environment",
      summary: `${interior} — Environment should be a force, not wallpaper.`,
      confidence,
    },
    {
      title: "POV focus",
      suggestionType: "pov_focus",
      summary: `${povFocus} — Check whether the scene’s emphasis matches the POV’s habitual attention.`,
      confidence,
    },
    {
      title: "Heart check",
      suggestionType: "heart_deficit",
      summary: heart.deficits.length
        ? `Heart heuristic: ${heart.deficits.join(" · ")}`
        : "No heart deficits flagged — still verify that feeling is scene-specific, not generic.",
      confidence: 2,
    },
  ];
}
