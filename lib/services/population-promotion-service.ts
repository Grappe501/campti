import {
  PopulationEntityRecordStatus,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";

import type { PopulationPromotionPlan } from "@/lib/domain/population-social-field";
import { prisma } from "@/lib/prisma";

/**
 * Phase 5F — link census-style rows to canonical `Person` without forcing full character modeling.
 */

export async function buildPopulationPromotionPlan(
  populationEntityId: string
): Promise<PopulationPromotionPlan | null> {
  const ent = await prisma.populationEntity.findUnique({
    where: { id: populationEntityId },
    include: { aliases: true },
  });
  if (!ent) return null;

  return {
    populationEntityId: ent.id,
    proposedPersonName: ent.displayName,
    preserveAliases: ent.aliases.length > 0,
    linkExistingPersonId: ent.personId,
    createCharacterCore: false,
    notes: ent.notes,
  };
}

export async function linkPopulationEntityToExistingPerson(
  populationEntityId: string,
  personId: string
): Promise<{ populationEntityId: string; personId: string }> {
  const [person, ent] = await Promise.all([
    prisma.person.findUnique({ where: { id: personId } }),
    prisma.populationEntity.findUnique({ where: { id: populationEntityId } }),
  ]);
  if (!person) throw new Error("Person not found");
  if (!ent) throw new Error("Population entity not found");
  if (ent.personId && ent.personId !== personId) {
    throw new Error("Population entity is already linked to a different Person");
  }

  await prisma.populationEntity.update({
    where: { id: populationEntityId },
    data: {
      personId,
      recordStatus: PopulationEntityRecordStatus.LINKED_PERSON,
    },
  });

  return { populationEntityId, personId };
}

export async function promotePopulationEntityToPerson(
  populationEntityId: string
): Promise<{ personId: string; alreadyLinked: boolean }> {
  const ent = await prisma.populationEntity.findUnique({
    where: { id: populationEntityId },
  });
  if (!ent) throw new Error("Population entity not found");
  if (ent.personId) {
    return { personId: ent.personId, alreadyLinked: true };
  }

  const person = await prisma.person.create({
    data: {
      name: ent.displayName,
      birthYear: ent.birthYear,
      deathYear: ent.deathYear,
      visibility: VisibilityStatus.REVIEW,
      recordType: RecordType.HYBRID,
      description: ent.notes?.slice(0, 2000) ?? null,
      sourceTraceNote: `Promoted from PopulationEntity ${ent.id}`,
    },
  });

  await prisma.populationEntity.update({
    where: { id: populationEntityId },
    data: {
      personId: person.id,
      recordStatus: PopulationEntityRecordStatus.LINKED_PERSON,
    },
  });

  return { personId: person.id, alreadyLinked: false };
}
