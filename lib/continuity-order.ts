import type {
  CharacterConsequenceMemoryProfile,
  CharacterEducationProfile,
  CharacterEmotionalHealthProfile,
  CharacterHealthEnvelope,
  CharacterLearningEnvelope,
  CharacterMentalHealthProfile,
  CharacterPhysicalHealthProfile,
  CharacterRumorReputationProfile,
  CharacterTraumaProfile,
  WorldEducationNormProfile,
  WorldHealthNormProfile,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getCharacterTraumaProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterTraumaProfile | null> {
  return prisma.characterTraumaProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getCharacterConsequenceMemoryProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterConsequenceMemoryProfile | null> {
  return prisma.characterConsequenceMemoryProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getCharacterRumorReputationProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterRumorReputationProfile | null> {
  return prisma.characterRumorReputationProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getWorldEducationNormProfile(worldStateId: string): Promise<WorldEducationNormProfile | null> {
  return prisma.worldEducationNormProfile.findUnique({ where: { worldStateId } });
}

export async function getCharacterEducationProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterEducationProfile | null> {
  return prisma.characterEducationProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getCharacterLearningEnvelope(
  personId: string,
  worldStateId: string,
): Promise<CharacterLearningEnvelope | null> {
  return prisma.characterLearningEnvelope.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getWorldHealthNormProfile(worldStateId: string): Promise<WorldHealthNormProfile | null> {
  return prisma.worldHealthNormProfile.findUnique({ where: { worldStateId } });
}

export async function getCharacterPhysicalHealthProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterPhysicalHealthProfile | null> {
  return prisma.characterPhysicalHealthProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getCharacterMentalHealthProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterMentalHealthProfile | null> {
  return prisma.characterMentalHealthProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getCharacterEmotionalHealthProfile(
  personId: string,
  worldStateId: string,
): Promise<CharacterEmotionalHealthProfile | null> {
  return prisma.characterEmotionalHealthProfile.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

export async function getCharacterHealthEnvelope(
  personId: string,
  worldStateId: string,
): Promise<CharacterHealthEnvelope | null> {
  return prisma.characterHealthEnvelope.findUnique({
    where: { personId_worldStateId: { personId, worldStateId } },
  });
}

/** Future: apply physical/mental/emotional loads to cognition, pressure, relationships (simulation). */
export async function evaluateHealthCrossLayerEffects(personId: string, worldStateId: string): Promise<null> {
  void personId;
  void worldStateId;
  return null;
}

/** Future: scene + consequence hooks — shock activation vs stored loads. */
export async function evaluateTraumaActivation(personId: string, worldStateId: string): Promise<null> {
  void personId;
  void worldStateId;
  return null;
}

/** Future: pair interaction outcomes with CharacterConsequenceMemoryProfile. */
export async function evaluateConsequenceLearning(personId: string, worldStateId: string): Promise<null> {
  void personId;
  void worldStateId;
  return null;
}

/** Future: tie rumor field to disclosure and masking. */
export async function evaluateRumorRisk(personId: string, worldStateId: string): Promise<null> {
  void personId;
  void worldStateId;
  return null;
}

/** Future: norms vs CharacterEducationProfile + intelligence. */
export async function evaluateEducationConstraint(personId: string, worldStateId: string): Promise<null> {
  void personId;
  void worldStateId;
  return null;
}

/** Future: merge Stage 5.5 + 6 + 6.5 into one runtime envelope. */
export async function assembleCharacterContinuityEnvelope(personId: string, worldStateId: string): Promise<null> {
  void personId;
  void worldStateId;
  return null;
}
