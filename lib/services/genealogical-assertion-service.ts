import type { Prisma } from "@prisma/client";
import {
  FactAssertionStatus,
  GenealogicalPredicate,
  RecordType,
  VisibilityStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseAssertionValue } from "@/lib/domain/genealogical-values";

export type UpsertSlotInput = {
  subjectType: string;
  subjectId: string;
  predicate: GenealogicalPredicate;
  discriminator?: string;
  slotLabel?: string;
  notes?: string;
};

export type AddAssertionInput = {
  slotId: string;
  valueJson: unknown;
  visibility: VisibilityStatus;
  recordType: RecordType;
  confidence?: number;
  sourceId?: string | null;
  quoteExcerpt?: string | null;
  notes?: string | null;
  needsReview?: boolean;
  legacyClaimId?: string | null;
  branchTag?: string | null;
  supersedesId?: string | null;
  /** If true, clears other preferred flags on this slot in the same transaction. */
  setNarrativePreferred?: boolean;
};

export async function upsertGenealogicalFactSlot(input: UpsertSlotInput) {
  const disc = input.discriminator ?? "";
  return prisma.genealogicalFactSlot.upsert({
    where: {
      subjectType_subjectId_predicate_discriminator: {
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        predicate: input.predicate,
        discriminator: disc,
      },
    },
    create: {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      predicate: input.predicate,
      discriminator: disc,
      slotLabel: input.slotLabel,
      notes: input.notes,
    },
    update: {
      slotLabel: input.slotLabel ?? undefined,
      notes: input.notes ?? undefined,
    },
  });
}

/**
 * Adds an assertion. Validates `valueJson` shape against `slot.predicate`.
 * Multiple ACTIVE rows per slot = competing claims (oral vs record, etc.).
 */
export async function addGenealogicalAssertion(input: AddAssertionInput) {
  const slot = await prisma.genealogicalFactSlot.findUniqueOrThrow({
    where: { id: input.slotId },
  });
  parseAssertionValue(slot.predicate, input.valueJson);

  return prisma.$transaction(async (tx) => {
    if (input.setNarrativePreferred) {
      await tx.genealogicalAssertion.updateMany({
        where: { slotId: input.slotId, status: FactAssertionStatus.ACTIVE },
        data: { narrativePreferred: false },
      });
    }

    return tx.genealogicalAssertion.create({
      data: {
        slotId: input.slotId,
        valueJson: input.valueJson as Prisma.InputJsonValue,
        visibility: input.visibility,
        recordType: input.recordType,
        confidence: input.confidence ?? 3,
        sourceId: input.sourceId ?? undefined,
        quoteExcerpt: input.quoteExcerpt ?? undefined,
        notes: input.notes ?? undefined,
        needsReview: input.needsReview ?? true,
        legacyClaimId: input.legacyClaimId ?? undefined,
        branchTag: input.branchTag ?? undefined,
        supersedesId: input.supersedesId ?? undefined,
        status: FactAssertionStatus.ACTIVE,
        narrativePreferred: input.setNarrativePreferred ?? false,
      },
    });
  });
}

export async function setNarrativePreferredAssertion(
  assertionId: string
): Promise<void> {
  const row = await prisma.genealogicalAssertion.findUniqueOrThrow({
    where: { id: assertionId },
    select: { id: true, slotId: true, status: true },
  });
  if (row.status !== FactAssertionStatus.ACTIVE) {
    throw new Error(
      "Only ACTIVE assertions can be marked narrativePreferred"
    );
  }

  await prisma.$transaction([
    prisma.genealogicalAssertion.updateMany({
      where: { slotId: row.slotId, status: FactAssertionStatus.ACTIVE },
      data: { narrativePreferred: false },
    }),
    prisma.genealogicalAssertion.update({
      where: { id: row.id },
      data: { narrativePreferred: true },
    }),
  ]);
}

export async function supersedeAssertion(
  oldId: string,
  replacementInput: Omit<AddAssertionInput, "supersedesId"> & { slotId: string }
) {
  const old = await prisma.genealogicalAssertion.findUniqueOrThrow({
    where: { id: oldId },
  });
  if (old.slotId !== replacementInput.slotId) {
    throw new Error("Replacement must target the same slot");
  }
  parseAssertionValue(
    (await prisma.genealogicalFactSlot.findUniqueOrThrow({
      where: { id: old.slotId },
    })).predicate,
    replacementInput.valueJson
  );

  return prisma.$transaction(async (tx) => {
    await tx.genealogicalAssertion.update({
      where: { id: oldId },
      data: { status: FactAssertionStatus.SUPERSEDED },
    });
    return tx.genealogicalAssertion.create({
      data: {
        slotId: replacementInput.slotId,
        valueJson: replacementInput.valueJson as Prisma.InputJsonValue,
        visibility: replacementInput.visibility,
        recordType: replacementInput.recordType,
        confidence: replacementInput.confidence ?? 3,
        sourceId: replacementInput.sourceId ?? undefined,
        quoteExcerpt: replacementInput.quoteExcerpt ?? undefined,
        notes: replacementInput.notes ?? undefined,
        needsReview: replacementInput.needsReview ?? true,
        legacyClaimId: replacementInput.legacyClaimId ?? undefined,
        branchTag: replacementInput.branchTag ?? undefined,
        supersedesId: oldId,
        status: FactAssertionStatus.ACTIVE,
        narrativePreferred: replacementInput.setNarrativePreferred ?? false,
      },
    });
  });
}

export async function listActiveAssertionsForSlot(slotId: string) {
  return prisma.genealogicalAssertion.findMany({
    where: { slotId, status: FactAssertionStatus.ACTIVE },
    orderBy: [{ narrativePreferred: "desc" }, { updatedAt: "desc" }],
    include: { source: true, legacyClaim: true },
  });
}
