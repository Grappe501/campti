import { z } from "zod";

import type { Book1SegmentSimulationState } from "@/lib/services/book1-segment-simulation-state-builder";

const MotiveExpressionModeSchema = z.enum(["express directly", "embody only", "imply through action", "suppress because already surfaced"]);

const CharacterMotiveStateSchema = z.object({
  character: z.string(),
  coreImmediateWant: z.string(),
  coreImmediateFear: z.string(),
  hiddenContradiction: z.string(),
  currentTacticalBehavior: z.string(),
});

const ParaphraseClusterSchema = z.object({
  clusterId: z.string(),
  stem: z.string(),
  segments: z.array(z.number().int().positive()),
  characters: z.array(z.string()),
});

const SegmentDirectiveSchema = z.object({
  segment: z.number().int().positive(),
  character: z.string(),
  mode: MotiveExpressionModeSchema,
  rationale: z.string(),
});

export const Book1MotiveCompressionSchema = z.object({
  artifact: z.literal("chapter_motive_compression"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  characterStates: z.array(CharacterMotiveStateSchema),
  paraphraseClusters: z.array(ParaphraseClusterSchema),
  segmentDirectives: z.array(SegmentDirectiveSchema),
});

export type Book1MotiveCompression = z.infer<typeof Book1MotiveCompressionSchema>;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stem(value: string): string {
  return compact(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/g)
    .filter((token) => token.length > 2)
    .slice(0, 7)
    .join(" ");
}

function extractFearLine(person: { hiding: string; misreads: string }): string {
  const fromHiding = compact(person.hiding);
  if (fromHiding.length > 0) return fromHiding;
  return compact(person.misreads);
}

export class Book1MotiveCompressionService {
  build(input: { segmentSimulationState: Book1SegmentSimulationState }): Book1MotiveCompression {
    const generatedAt = new Date().toISOString();
    const states = new Map<string, z.infer<typeof CharacterMotiveStateSchema>>();
    const clusterSource = new Map<string, { segments: Set<number>; characters: Set<string> }>();
    const seenDirectSurface = new Set<string>();
    const directives: z.infer<typeof SegmentDirectiveSchema>[] = [];

    for (const segment of input.segmentSimulationState.segments) {
      for (const person of segment.people) {
        if (!states.has(person.character)) {
          states.set(person.character, {
            character: person.character,
            coreImmediateWant: compact(person.wants),
            coreImmediateFear: extractFearLine(person),
            hiddenContradiction: compact(`${person.knows} Yet behavior still follows ${person.misreads}`),
            currentTacticalBehavior: compact(`Uses controlled silence and positional adjustment while ${person.hiding.toLowerCase()}.`),
          });
        }
        const motiveStem = stem(person.wants);
        const fearStem = stem(extractFearLine(person));
        for (const s of [motiveStem, fearStem]) {
          if (!clusterSource.has(s)) clusterSource.set(s, { segments: new Set<number>(), characters: new Set<string>() });
          const target = clusterSource.get(s);
          if (target) {
            target.segments.add(segment.segment);
            target.characters.add(person.character);
          }
        }
      }
    }

    const paraphraseClusters = Array.from(clusterSource.entries())
      .filter(([, value]) => value.segments.size >= 2)
      .map(([key, value], index) => ({
        clusterId: `MOTIVE-CLUSTER-${index + 1}`,
        stem: key,
        segments: Array.from(value.segments.values()).sort((a, b) => a - b),
        characters: Array.from(value.characters.values()).sort((a, b) => a.localeCompare(b)),
      }));

    for (const segment of input.segmentSimulationState.segments) {
      for (const person of segment.people) {
        const key = `${person.character.toLowerCase()}::${stem(person.wants)}`;
        let mode: z.infer<typeof MotiveExpressionModeSchema> = "express directly";
        if (seenDirectSurface.has(key)) mode = "embody only";
        const clusterHit = paraphraseClusters.some((cluster) => cluster.stem === stem(person.wants) && cluster.segments.includes(segment.segment));
        if (clusterHit && seenDirectSurface.has(key)) mode = "imply through action";
        if (clusterHit && segment.segment > 3 && seenDirectSurface.has(key)) mode = "suppress because already surfaced";
        seenDirectSurface.add(key);
        directives.push({
          segment: segment.segment,
          character: person.character,
          mode,
          rationale:
            mode === "express directly"
              ? "First stable appearance of motive state in chapter flow."
              : mode === "embody only"
                ? "Direct restatement would flatten motive progression."
                : mode === "imply through action"
                  ? "Paraphrase cluster detected; move meaning into gesture and misreading."
                  : "Motive already surfaced and transformed; suppress repeated direct naming.",
        });
      }
    }

    return Book1MotiveCompressionSchema.parse({
      artifact: "chapter_motive_compression",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      characterStates: Array.from(states.values()),
      paraphraseClusters,
      segmentDirectives: directives,
    });
  }
}
