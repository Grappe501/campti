import type { NarrativePsychologyArchitecture } from "@/lib/domain/narrative-psychology";

export type NarrativePsychologyValidationResult = {
  artifact: "narrative_psychology_validation";
  passed: boolean;
  hardFailures: string[];
  warnings: string[];
};

const VAGUE_PATTERNS = ["emotional journey", "keep readers engaged", "big feelings"];
const CHEAP_CLIFFHANGER_PATTERNS = ["twist ending", "shock reveal only", "cliffhanger only"];

export function validateNarrativePsychologyArchitecture(
  architecture: NarrativePsychologyArchitecture,
): NarrativePsychologyValidationResult {
  const hardFailures: string[] = [];
  const warnings: string[] = [];

  if (architecture.chapters.length < 8) {
    hardFailures.push("Architecture must define at least eight chapter-level psychology targets.");
  }

  for (const chapter of architecture.chapters) {
    const chapterText =
      `${chapter.chapterEmotionalObjective} ${chapter.chapterPsychologyConstraints.join(" ")} ${chapter.pullProfile.drivers.join(" ")}`.toLowerCase();
    if (VAGUE_PATTERNS.some((token) => chapterText.includes(token))) {
      hardFailures.push(`${chapter.chapterId} contains vague language that cannot drive machine behavior.`);
    }
    if (CHEAP_CLIFFHANGER_PATTERNS.some((token) => chapterText.includes(token))) {
      hardFailures.push(`${chapter.chapterId} relies on cliffhanger-only pull logic.`);
    }
    if (chapter.pullProfile.pullScore < 0.45) {
      warnings.push(`${chapter.chapterId} pull score is low; consider stronger unresolved meaningful pressure.`);
    }
  }

  const epicText =
    `${architecture.epic.placeAttachmentStrategy} ${architecture.epic.identityAttachmentStrategy} ${architecture.epic.readerExperienceGoals.join(" ")}`
      .toLowerCase();
  if (epicText.includes("thriller")) {
    hardFailures.push("Epic strategy references thriller template, violating historical tonal guardrails.");
  }

  return {
    artifact: "narrative_psychology_validation",
    passed: hardFailures.length === 0,
    hardFailures,
    warnings,
  };
}
