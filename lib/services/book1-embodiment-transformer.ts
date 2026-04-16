import { z } from "zod";

import type { Book1ProseBriefs } from "@/lib/services/book1-prose-brief-transformer";
import type { Book1LivedHistory } from "@/lib/services/book1-lived-history-transformer";

type EvidencePackLike = {
  evidence: Array<{ evidenceId: string; statement: string }>;
};

type ChapterLawLike = {
  chronologyInvariants: Array<{ rule: string }>;
  futureArcConstraints: Array<{ mustPreserve: string }>;
};

const EmbodimentPacketSchema = z.object({
  segment: z.number().int().positive(),
  concreteActions: z.array(z.string()),
  bodyStateCues: z.array(z.string()),
  sensoryCues: z.array(z.string()),
  environmentalPressureCues: z.array(z.string()),
  socialRitualCues: z.array(z.string()),
  noticedFirst: z.string(),
  remainsUnspoken: z.string(),
  physicalChangeByEnd: z.string(),
});

export const Book1EmbodimentMapSchema = z.object({
  artifact: z.literal("chapter_embodiment_packets"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segments: z.array(EmbodimentPacketSchema),
});

export type Book1EmbodimentMap = z.infer<typeof Book1EmbodimentMapSchema>;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function snippet(value: string): string {
  const cleaned = compact(value);
  if (cleaned.length <= 120) return cleaned;
  return `${cleaned.slice(0, 117).trimEnd()}...`;
}

export class Book1EmbodimentTransformerService {
  transform(input: {
    chapterEvidencePack: EvidencePackLike;
    livedHistory: Book1LivedHistory;
    proseBriefs: Book1ProseBriefs;
    chapterLaw: ChapterLawLike;
  }): Book1EmbodimentMap {
    const segments = input.proseBriefs.segments.map((brief, index) => {
      const lived = input.livedHistory.packets.find((row) => row.segment === brief.segment) ?? input.livedHistory.packets[index];
      const evidence = input.chapterEvidencePack.evidence.slice(index * 2, index * 2 + 3);
      const evidenceAction = evidence.map((row) => `A witness handles ${snippet(row.statement).toLowerCase()} as immediate task evidence.`);
      return {
        segment: brief.segment,
        concreteActions: [
          `Hands sort tools and food while conversation stays indirect.`,
          `A messenger crosses the threshold, forcing everyone to recalculate obligations.`,
          ...evidenceAction,
        ],
        bodyStateCues: [
          "Jaw tension rises before anyone names conflict.",
          "Shoulders angle toward exits when uncertainty sharpens.",
          "Breath shortens at the moment of decision.",
        ],
        sensoryCues: [
          snippet(lived.environment),
          snippet(lived.materialLife),
          "Smoke, wet reed, and skin heat signal pace shifts before speech does.",
        ],
        environmentalPressureCues: [
          snippet(lived.movementPatterns),
          "Weather and distance alter which promises can still be kept by dusk.",
          `Chronology pressure remains active: ${snippet(input.chapterLaw.chronologyInvariants[0]?.rule ?? "no chronology violation")}.`,
        ],
        socialRitualCues: [
          snippet(lived.socialOrder),
          snippet(lived.laborRitualGovernanceCues),
          `Future pressure is carried, not explained: ${snippet(input.chapterLaw.futureArcConstraints[0]?.mustPreserve ?? "future arc unresolved")}.`,
        ],
        noticedFirst: snippet(brief.mustShow),
        remainsUnspoken: snippet(brief.readerInference),
        physicalChangeByEnd: "Object positions, body orientation, and speaking order all shift, marking altered rank and risk.",
      };
    });
    return Book1EmbodimentMapSchema.parse({
      artifact: "chapter_embodiment_packets",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      segments,
    });
  }
}
