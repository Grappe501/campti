import type { PrismaClient } from "@prisma/client";
import { RecordType, VisibilityStatus } from "@prisma/client";

/**
 * Optional light sample rows for Character Engine — only inserts when missing (no overwrites).
 */
export async function seedCharacterEngineSample(prisma: PrismaClient) {
  const personId = "seed-person-alexis";
  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) return;

  const existingProfile = await prisma.characterProfile.findUnique({ where: { personId } });
  if (!existingProfile) {
    await prisma.characterProfile.create({
      data: {
        personId,
        worldview: "Sample worldview for the Character Engine (bounded simulation spine).",
        coreBeliefs: ["The camp’s edge is negotiable only by kin."],
        desires: ["Keep the center soft for children."],
        fears: ["Being made nameless on paper."],
        misbeliefs: [],
        internalConflicts: ["Duty to lineage vs hunger for a wider map."],
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.REVIEW,
      },
    });
  }

  const stateCount = await prisma.characterState.count({ where: { personId, label: "seed_opening_day" } });
  if (stateCount === 0) {
    await prisma.characterState.create({
      data: {
        personId,
        label: "seed_opening_day",
        emotionalBaseline: "Watchful calm",
        pressureLevel: "low",
        trustLevel: 55,
        fearLevel: 35,
        stabilityLevel: 60,
        cognitiveLoad: 40,
        recordType: RecordType.HYBRID,
        visibility: VisibilityStatus.REVIEW,
      },
    });
  }
}
