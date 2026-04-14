/**
 * P2-H — Conversational identity snapshot builder.
 *
 * Assembles **identity**, **knowledge boundary** (P2-F), **relationships**, **reader memory** (P2-G),
 * and **emotional state** into one JSON-safe object for future dialogue / LLM routing. **No generation**
 * here — persistence reads and deterministic merges only.
 */

import { FactAssertionStatus } from "@prisma/client";

import { buildCharacterKnowledgeBoundary } from "@/lib/character-knowledge/knowledge-boundary";
import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import { getMemoryForConversation } from "@/lib/services/character-reader-memory-service";
import { cognitionPrisma } from "@/lib/prisma-cognition-access";
import { prisma } from "@/lib/prisma";

function perceivedRealityFromSlices(
  snap: {
    currentFear: string | null;
    currentDesire: string | null;
    currentObligation: string | null;
  } | null,
  legacy: { emotionalState: string | null; motivation: string | null; fearState: string | null } | null
): string {
  const parts: string[] = [];
  if (snap?.currentFear?.trim()) parts.push(`Fear: ${snap.currentFear.trim()}`);
  if (snap?.currentDesire?.trim()) parts.push(`Desire: ${snap.currentDesire.trim()}`);
  if (snap?.currentObligation?.trim()) parts.push(`Obligation: ${snap.currentObligation.trim()}`);
  if (legacy?.fearState?.trim()) parts.push(`Legacy fear: ${legacy.fearState.trim()}`);
  if (legacy?.motivation?.trim()) parts.push(`Motivation: ${legacy.motivation.trim()}`);
  if (legacy?.emotionalState?.trim()) parts.push(`Mood: ${legacy.emotionalState.trim()}`);
  if (parts.length) return parts.join(" | ");
  return "Live conversational turn — no recent structured cognition snapshot; affect is minimally specified.";
}

/**
 * Build the full character state bundle for live interaction with a specific reader.
 */
export async function buildConversationalIdentitySnapshot(
  characterId: string,
  readerId: string
): Promise<ConversationalIdentitySnapshot> {
  if (!readerId.trim()) {
    throw new Error("readerId is required (opaque reader key).");
  }

  const person = await prisma.person.findUnique({
    where: { id: characterId },
    include: {
      characterProfile: true,
      characterCoreProfile: true,
    },
  });

  if (!person) {
    throw new Error(`Person/character not found: ${characterId}`);
  }

  const [rel, assertions, latestSnap, latestLegacy, readerMemory] = await Promise.all([
    prisma.characterRelationship.findMany({
      where: { OR: [{ personAId: characterId }, { personBId: characterId }] },
      take: 48,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.genealogicalAssertion.findMany({
      where: {
        status: FactAssertionStatus.ACTIVE,
        narrativePreferred: true,
        slot: { subjectType: "Person", subjectId: characterId },
      },
      include: { slot: { select: { slotLabel: true } } },
      take: 80,
    }),
    cognitionPrisma.characterStateSnapshot.findFirst({
      where: { characterId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.characterState.findFirst({
      where: { personId: characterId },
      orderBy: { updatedAt: "desc" },
    }),
    getMemoryForConversation(characterId, readerId),
  ]);

  const otherIds = [...new Set(rel.map((r) => (r.personAId === characterId ? r.personBId : r.personAId)))];
  const otherPeople =
    otherIds.length > 0
      ? await prisma.person.findMany({
          where: { id: { in: otherIds } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = Object.fromEntries(otherPeople.map((p) => [p.id, p.name]));

  const relationshipLines = rel.map((r) => {
    const oid = r.personAId === characterId ? r.personBId : r.personAId;
    const nm = nameById[oid] ?? oid;
    return `${nm}: ${r.relationshipType}`;
  });

  const relationshipEdges = rel.map((r) => {
    const oid = r.personAId === characterId ? r.personBId : r.personAId;
    return {
      counterpartyId: oid,
      counterpartyName: nameById[oid] ?? "Unknown",
      relationshipType: r.relationshipType,
      relationshipSummary: r.relationshipSummary,
    };
  });

  const assertionSlotLabels = assertions
    .map((a) => a.slot?.slotLabel?.trim())
    .filter((x): x is string => Boolean(x));

  let worldStateLabel: string | null = null;
  let literacyClerical: "rare" | "minority" | "common" | "widespread" | null = null;
  if (latestSnap?.worldStateReferenceId) {
    const ws = await prisma.worldStateReference.findUnique({
      where: { id: latestSnap.worldStateReferenceId },
      select: { label: true, languageEnvironmentJson: true },
    });
    worldStateLabel = ws?.label ?? null;
    const le = ws?.languageEnvironmentJson;
    if (le && typeof le === "object" && !Array.isArray(le)) {
      const lit = (le as Record<string, unknown>).literacyNorm;
      if (lit && typeof lit === "object" && !Array.isArray(lit)) {
        const c = (lit as Record<string, unknown>).clericalLiteracy;
        if (c === "rare" || c === "minority" || c === "common" || c === "widespread") {
          literacyClerical = c;
        }
      }
    }
  }

  const lit = person.characterProfile;
  const socialRoleHint =
    [lit?.socialPosition, lit?.roleArchetype]
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean)
      .join(" — ") || null;

  const perceivedReality = perceivedRealityFromSlices(latestSnap, latestLegacy);

  const knowledgeBoundary = buildCharacterKnowledgeBoundary({
    worldStateLabel,
    approximateStoryYear: null,
    socialRoleHint,
    literacyClerical,
    relationshipLines,
    narrativeSources: [],
    assertionSlotLabels,
    perceivedReality,
    gossipPressure01: null,
    witnessRisk01: null,
  });

  const core = person.characterCoreProfile;
  const snapshot: ConversationalIdentitySnapshot = {
    contractVersion: "1",
    builtAtIso: new Date().toISOString(),
    characterId,
    readerId: readerId.trim(),
    identity: {
      person: {
        id: person.id,
        name: person.name,
        birthYear: person.birthYear,
        deathYear: person.deathYear,
      },
      literaryProfile: lit
        ? {
            socialPosition: lit.socialPosition,
            roleArchetype: lit.roleArchetype,
            educationLevel: lit.educationLevel,
            narrativeFunction: lit.narrativeFunction,
            worldview: lit.worldview,
            coreBeliefs: lit.coreBeliefs,
            fears: lit.fears,
            desires: lit.desires,
          }
        : null,
      coreHighlights: core
        ? {
            enneagramType: core.enneagramType,
            enneagramWing: core.enneagramWing,
            instinctStacking: core.instinctStacking,
            worldviewSummary: core.worldviewSummary,
            coreFear: core.coreFear,
            coreDesire: core.coreDesire,
          }
        : null,
    },
    knowledgeBoundary,
    relationships: relationshipEdges,
    readerMemory,
    emotionalState: {
      latestCognitionSnapshot: latestSnap
        ? {
            id: latestSnap.id,
            sceneId: latestSnap.sceneId,
            label: latestSnap.label,
            currentFear: latestSnap.currentFear,
            currentDesire: latestSnap.currentDesire,
            currentObligation: latestSnap.currentObligation,
            currentShame: latestSnap.currentShame,
            currentHope: latestSnap.currentHope,
            currentAnger: latestSnap.currentAnger,
            currentSocialRisk: latestSnap.currentSocialRisk,
            currentMask: latestSnap.currentMask,
            currentContradiction: latestSnap.currentContradiction,
            currentArousal: latestSnap.currentArousal,
            currentLoneliness: latestSnap.currentLoneliness,
          }
        : null,
      latestLegacyCharacterState: latestLegacy
        ? {
            id: latestLegacy.id,
            sceneId: latestLegacy.sceneId,
            label: latestLegacy.label,
            emotionalState: latestLegacy.emotionalState,
            motivation: latestLegacy.motivation,
            fearState: latestLegacy.fearState,
            fearLevel: latestLegacy.fearLevel,
            trustLevel: latestLegacy.trustLevel,
            stabilityLevel: latestLegacy.stabilityLevel,
            cognitiveLoad: latestLegacy.cognitiveLoad,
            emotionalBaseline: latestLegacy.emotionalBaseline,
            socialConstraint: latestLegacy.socialConstraint,
          }
        : null,
    },
  };

  return snapshot;
}
