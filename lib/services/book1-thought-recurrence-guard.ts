import { z } from "zod";

import type { Book1SegmentSimulationState } from "@/lib/services/book1-segment-simulation-state-builder";

const RecurrenceGuardSegmentSchema = z.object({
  segment: z.number().int().positive(),
  blockedThoughtPhrases: z.array(z.string()),
  blockedMotifs: z.array(z.string()),
  blockedFearAbstractions: z.array(z.string()),
  blockedSymbolicParaphrases: z.array(z.string()),
  allowRecurrenceIf: z.array(z.string()),
  obsessionPatternIntended: z.boolean(),
});

export const Book1ThoughtRecurrenceGuardSchema = z.object({
  artifact: z.literal("chapter_thought_recurrence_guard"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  chapterLevelRepeatedSignals: z.object({
    thoughtContent: z.array(z.string()),
    motifs: z.array(z.string()),
    fears: z.array(z.string()),
    symbols: z.array(z.string()),
  }),
  segmentGuards: z.array(RecurrenceGuardSegmentSchema),
});

export type Book1ThoughtRecurrenceGuard = z.infer<typeof Book1ThoughtRecurrenceGuardSchema>;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function keyPhrases(text: string): string[] {
  return compact(text)
    .toLowerCase()
    .split(/[.?!,;:]/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 18)
    .map((part) => part.split(/\s+/g).slice(0, 8).join(" "))
    .filter((part) => part.length > 0);
}

function collectByCount(values: string[], minCount: number): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .map(([value]) => value);
}

export class Book1ThoughtRecurrenceGuardService {
  build(input: { segmentSimulationState: Book1SegmentSimulationState }): Book1ThoughtRecurrenceGuard {
    const thoughtSignals: string[] = [];
    const motifSignals: string[] = [];
    const fearSignals: string[] = [];
    const symbolSignals: string[] = [];

    for (const segment of input.segmentSimulationState.segments) {
      for (const person of segment.people) {
        thoughtSignals.push(...keyPhrases(`${person.wants}. ${person.knows}. ${person.misreads}. ${person.hiding}.`));
      }
      motifSignals.push(...keyPhrases(segment.hiddenChange));
      fearSignals.push(
        ...keyPhrases(
          segment.people
            .map((person) => person.hiding)
            .join(". "),
        ),
      );
      symbolSignals.push(...keyPhrases(segment.visibleAction));
    }

    const repeatedThoughts = collectByCount(thoughtSignals, 2);
    const repeatedMotifs = collectByCount(motifSignals, 2);
    const repeatedFears = collectByCount(fearSignals, 2);
    const repeatedSymbols = collectByCount(symbolSignals, 2);

    const segmentGuards = input.segmentSimulationState.segments.map((segment, index) => {
      const currentThoughts = new Set<string>();
      for (const person of segment.people) {
        for (const phrase of keyPhrases(`${person.wants}. ${person.knows}. ${person.hiding}.`)) currentThoughts.add(phrase);
      }
      const blockedThoughtPhrases = repeatedThoughts.filter((phrase) => currentThoughts.has(phrase));
      const blockedMotifs = repeatedMotifs.filter((phrase) => segment.hiddenChange.toLowerCase().includes(phrase.slice(0, 10)));
      const blockedFearAbstractions = repeatedFears.filter((phrase) =>
        segment.people.some((person) => person.hiding.toLowerCase().includes(phrase.slice(0, 10))),
      );
      const blockedSymbolicParaphrases = repeatedSymbols.filter((phrase) =>
        segment.visibleAction.toLowerCase().includes(phrase.slice(0, 10)),
      );

      return {
        segment: segment.segment,
        blockedThoughtPhrases,
        blockedMotifs,
        blockedFearAbstractions,
        blockedSymbolicParaphrases,
        allowRecurrenceIf: [
          "pressure escalates",
          "meaning changes",
          "embodiment changes",
          "obsession pattern explicitly intended",
        ],
        obsessionPatternIntended: index === input.segmentSimulationState.segments.length - 1 && blockedThoughtPhrases.length > 0,
      };
    });

    return Book1ThoughtRecurrenceGuardSchema.parse({
      artifact: "chapter_thought_recurrence_guard",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      chapterLevelRepeatedSignals: {
        thoughtContent: repeatedThoughts,
        motifs: repeatedMotifs,
        fears: repeatedFears,
        symbols: repeatedSymbols,
      },
      segmentGuards,
    });
  }
}
