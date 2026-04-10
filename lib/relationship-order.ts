import type {
  CharacterDesireProfile,
  CharacterMaskingProfile,
  RelationshipDisclosureProfile,
  RelationshipDynamicState,
  RelationshipNetworkSummary,
  RelationshipProfile,
  WorldRelationshipNormProfile,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Enforce canonical storage: personAId is lexicographically before personBId. */
export function normalizePersonPair(personIdOne: string, personIdTwo: string): { personAId: string; personBId: string } {
  if (personIdOne === personIdTwo) {
    throw new Error("RelationshipProfile requires two distinct people.");
  }
  return personIdOne < personIdTwo
    ? { personAId: personIdOne, personBId: personIdTwo }
    : { personAId: personIdTwo, personBId: personIdOne };
}

export async function getRelationshipProfile(
  personAId: string,
  personBId: string,
  worldStateId: string,
): Promise<RelationshipProfile | null> {
  const { personAId: a, personBId: b } = normalizePersonPair(personAId, personBId);
  return prisma.relationshipProfile.findUnique({
    where: { personAId_personBId_worldStateId: { personAId: a, personBId: b, worldStateId } },
  });
}

export async function getRelationshipDynamicStates(relationshipProfileId: string): Promise<RelationshipDynamicState[]> {
  return prisma.relationshipDynamicState.findMany({
    where: { relationshipProfileId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCharacterMaskingProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterMaskingProfile | null> {
  return prisma.characterMaskingProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getCharacterDesireProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterDesireProfile | null> {
  return prisma.characterDesireProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getWorldRelationshipNormProfile(
  worldStateId: string,
): Promise<WorldRelationshipNormProfile | null> {
  return prisma.worldRelationshipNormProfile.findUnique({ where: { worldStateId } });
}

export async function getRelationshipDisclosureProfile(
  relationshipProfileId: string,
  worldStateId: string,
): Promise<RelationshipDisclosureProfile | null> {
  return prisma.relationshipDisclosureProfile.findUnique({
    where: { relationshipProfileId_worldStateId: { relationshipProfileId, worldStateId } },
  });
}

export async function getRelationshipNetworkSummary(
  personId: string,
  worldStateId: string,
): Promise<RelationshipNetworkSummary | null> {
  return prisma.relationshipNetworkSummary.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

/** @deprecated Simulation — Stage 6.5+ */
export function evaluateDisclosureSafety(_input: unknown): { score: number; notes: string[] } {
  return { score: 50, notes: ["stub: evaluateDisclosureSafety"] };
}

/** @deprecated Simulation — Stage 6.5+ */
export function evaluateDesireConstraint(_input: unknown): { score: number; notes: string[] } {
  return { score: 50, notes: ["stub: evaluateDesireConstraint"] };
}

/** @deprecated Simulation — Stage 6.5+ */
export function evaluateMaskingPressure(_input: unknown): { score: number; notes: string[] } {
  return { score: 50, notes: ["stub: evaluateMaskingPressure"] };
}

/** @deprecated Simulation — Stage 6.5+ */
export function assembleRelationshipCollisionEnvelope(_input: unknown): { score: number; notes: string[] } {
  return { score: 50, notes: ["stub: assembleRelationshipCollisionEnvelope"] };
}

/** @deprecated Simulation — Stage 6.5+ */
export function evaluateRelationalTabooRisk(_input: unknown): { score: number; notes: string[] } {
  return { score: 50, notes: ["stub: evaluateRelationalTabooRisk"] };
}
