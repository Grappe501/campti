import { prisma } from "@/lib/prisma";
import type { SceneRunOutputChurnHint } from "@/lib/domain/scene-run-output-linkage";

/**
 * Advisory hints for Decision Assist / analytics — bounded, no quality scoring.
 */
export async function loadSceneRunOutputChurnHints(sceneId: string, limit = 8): Promise<SceneRunOutputChurnHint[]> {
  let rows: { characterCount: number; openingFingerprint: string; endingFingerprint: string; outputCompleteness: string }[] = [];
  try {
    rows = await prisma.sceneRunGenerationOutput.findMany({
      where: { sceneId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { characterCount: true, openingFingerprint: true, endingFingerprint: true, outputCompleteness: true },
    });
  } catch {
    return [];
  }
  if (rows.length < 2) return [];

  const hints: SceneRunOutputChurnHint[] = [];
  const [latest, prev] = rows;
  const delta = latest.characterCount - prev.characterCount;
  const base = Math.max(latest.characterCount, prev.characterCount, 1);
  if (Math.abs(delta) >= 400 || Math.abs(delta) / base >= 0.12) {
    hints.push({
      code: "recent_linked_output_length_shift",
      text: `Latest linked output length differs from prior snapshot by ${delta > 0 ? "+" : ""}${delta} characters (bounded threshold).`,
      derivation: "fact",
    });
  }
  if (latest.openingFingerprint !== prev.openingFingerprint) {
    hints.push({
      code: "recent_opening_fingerprint_shift",
      text: "Most recent run’s opening fingerprint differs from the prior linked snapshot.",
      derivation: "fact",
    });
  }
  if (latest.endingFingerprint !== prev.endingFingerprint) {
    hints.push({
      code: "recent_ending_fingerprint_shift",
      text: "Most recent run’s ending fingerprint differs from the prior linked snapshot.",
      derivation: "fact",
    });
  }
  const blocked = rows.filter((r) => r.outputCompleteness.startsWith("blocked_save")).length;
  if (blocked >= 2) {
    hints.push({
      code: "repeated_blocked_save_outputs",
      text: `${blocked} recent linked outputs were snapshot-only due to blocked scene save (realism / human gravity) — review validation before chasing replay loops.`,
      derivation: "heuristic",
    });
  }
  return hints;
}
