import { prisma } from "@/lib/prisma";

/**
 * Consecutive linked snapshots (SceneRunGenerationOutput) — material movement if length or fingerprints
 * shift between adjacent snapshots in time. Uses the same bounded length thresholds as churn hints.
 */
const CHAR_MATERIAL_RATIO = 0.12;
const CHAR_MATERIAL_ABS = 400;

export type LinkedOutputChurnPersistence = {
  /** Count of adjacent snapshot pairs (oldest→newest) that show material drift. */
  materialPairCount: number;
  /** Number of adjacent pairs compared (snapshots minus one). */
  pairsCompared: number;
  /** True when at least two transitions show drift — drift is persisting, not a single hop. */
  persistentDrift: boolean;
};

function pairIsMaterial(
  older: { characterCount: number; openingFingerprint: string; endingFingerprint: string },
  newer: { characterCount: number; openingFingerprint: string; endingFingerprint: string },
): boolean {
  const delta = newer.characterCount - older.characterCount;
  const base = Math.max(older.characterCount, newer.characterCount, 1);
  const lengthMaterial = Math.abs(delta) >= CHAR_MATERIAL_ABS || Math.abs(delta) / base >= CHAR_MATERIAL_RATIO;
  const openingShift = older.openingFingerprint !== newer.openingFingerprint;
  const endingShift = older.endingFingerprint !== newer.endingFingerprint;
  return lengthMaterial || openingShift || endingShift;
}

/**
 * Reads recent durable snapshots only — no ledger join. Sparse history yields zeros / persistentDrift false.
 */
export async function computeLinkedOutputChurnPersistence(sceneId: string, snapshotTake = 8): Promise<LinkedOutputChurnPersistence> {
  let rows: { characterCount: number; openingFingerprint: string; endingFingerprint: string }[] = [];
  try {
    rows = await prisma.sceneRunGenerationOutput.findMany({
      where: { sceneId },
      orderBy: { createdAt: "desc" },
      take: snapshotTake,
      select: { characterCount: true, openingFingerprint: true, endingFingerprint: true },
    });
  } catch {
    return { materialPairCount: 0, pairsCompared: 0, persistentDrift: false };
  }

  if (rows.length < 3) {
    return { materialPairCount: 0, pairsCompared: 0, persistentDrift: false };
  }

  const chronological = [...rows].reverse();
  let materialPairCount = 0;
  let pairsCompared = 0;
  for (let i = 0; i < chronological.length - 1; i++) {
    pairsCompared++;
    const older = chronological[i]!;
    const newer = chronological[i + 1]!;
    if (pairIsMaterial(older, newer)) materialPairCount++;
  }

  return {
    materialPairCount,
    pairsCompared,
    persistentDrift: materialPairCount >= 2 && pairsCompared >= 2,
  };
}
