import { z } from "zod";

import type { Book1LivedHistory } from "@/lib/services/book1-lived-history-transformer";

type OutlineLike = {
  timeline: Array<{ segment: number; setting: string; characters: string[]; sceneFocus: string }>;
};

type HiddenHistoryLike = {
  characters: Array<{ character: string; suppressedMotive: string; privateWound: string }>;
};

type EvidenceLike = {
  evidence: Array<{ statement: string }>;
};

type ChapterLawLike = {
  chronologyInvariants: Array<{ rule: string }>;
  futureArcConstraints: Array<{ mustPreserve: string }>;
};

const PersonStateSchema = z.object({
  character: z.string(),
  wants: z.string(),
  knows: z.string(),
  misreads: z.string(),
  hiding: z.string(),
});

const SegmentSimulationStateSchema = z.object({
  segment: z.number().int().positive(),
  whoIsPresent: z.array(z.string()),
  people: z.array(PersonStateSchema),
  worldPressure: z.string(),
  visibleAction: z.string(),
  hiddenChange: z.string(),
});

export const Book1SegmentSimulationStateSchema = z.object({
  artifact: z.literal("chapter_segment_simulation_state"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segments: z.array(SegmentSimulationStateSchema),
});

export type Book1SegmentSimulationState = z.infer<typeof Book1SegmentSimulationStateSchema>;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function lowerSnippet(value: string): string {
  const cleaned = compact(value);
  return cleaned.length > 96 ? `${cleaned.slice(0, 93).trimEnd()}...` : cleaned;
}

function inferVisibleAction(sceneFocus: string, livedEnvironment: string, evidence: string): string {
  return compact(`${sceneFocus}. Hands and posture carry the exchange while ${lowerSnippet(livedEnvironment).toLowerCase()}. ${lowerSnippet(evidence)}`);
}

export class Book1SegmentSimulationStateBuilderService {
  build(input: {
    outline: OutlineLike;
    hiddenHistories: HiddenHistoryLike;
    livedHistory: Book1LivedHistory;
    chapterEvidencePack: EvidenceLike;
    chapterLaw: ChapterLawLike;
  }): Book1SegmentSimulationState {
    const segments = input.outline.timeline.map((scene, index) => {
      const lived = input.livedHistory.packets.find((row) => row.segment === scene.segment) ?? input.livedHistory.packets[index];
      const evidenceLine = input.chapterEvidencePack.evidence[index]?.statement ?? input.chapterEvidencePack.evidence[0]?.statement ?? "";
      const people = scene.characters.map((character, charIndex) => {
        const hidden = input.hiddenHistories.characters.find((row) => row.character.toLowerCase() === character.toLowerCase()) ?? {
          character,
          suppressedMotive: "preserve kin continuity",
          privateWound: "fear of being misread",
        };
        return {
          character,
          wants: compact(`Secure ${hidden.suppressedMotive.toLowerCase()} without public rupture.`),
          knows: compact(`Understands current leverage around ${lowerSnippet(evidenceLine).toLowerCase()}.`),
          misreads:
            charIndex % 2 === 0
              ? "Assumes silence means consent rather than tactical delay."
              : "Reads caution as weakness and misses hidden agreement patterns.",
          hiding: compact(hidden.privateWound),
        };
      });
      return {
        segment: scene.segment,
        whoIsPresent: scene.characters,
        people,
        worldPressure: compact(
          `${lowerSnippet(lived.environment)} ${lowerSnippet(lived.socialOrder)} Chronology invariant: ${lowerSnippet(
            input.chapterLaw.chronologyInvariants[0]?.rule ?? "no temporal leakage",
          )}.`,
        ),
        visibleAction: inferVisibleAction(scene.sceneFocus, lived.environment, evidenceLine),
        hiddenChange: compact(
          `Speaking order and proximity change, preserving ${lowerSnippet(
            input.chapterLaw.futureArcConstraints[0]?.mustPreserve ?? "future uncertainty",
          ).toLowerCase()} while shifting local authority.`,
        ),
      };
    });

    return Book1SegmentSimulationStateSchema.parse({
      artifact: "chapter_segment_simulation_state",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      segments,
    });
  }
}
