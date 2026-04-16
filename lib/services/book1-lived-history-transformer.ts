import { z } from "zod";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";

type EvidenceLike = {
  statement: string;
};

const LivedHistoryPacketSchema = z.object({
  segment: z.number().int().positive(),
  environment: z.string(),
  socialOrder: z.string(),
  materialLife: z.string(),
  movementPatterns: z.string(),
  laborRitualGovernanceCues: z.string(),
  obviousToCharacters: z.string(),
  notConsciouslyExplained: z.string(),
});

export const Book1LivedHistorySchema = z.object({
  artifact: z.literal("chapter_lived_history"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  packets: z.array(LivedHistoryPacketSchema),
});

export type Book1LivedHistory = z.infer<typeof Book1LivedHistorySchema>;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clean(value: string): string {
  let out = value.replace(/https?:\/\/\S+/gi, " ");
  out = out.replace(/\[[^\]]+\]\([^)]+\)/g, " ");
  out = out.replace(/\[[^\]]+\]:?/g, " ");
  out = out.replace(/^\s*[-*]\s+/gm, " ");
  out = out.replace(/[*_`>#]+/g, " ");
  out = out.replace(/\b(source|citation|reference|historical context|analysis|therefore|thus)\b/gi, " ");
  out = compact(out);
  if (out.length > 180) out = `${out.slice(0, 177).trimEnd()}...`;
  return out;
}

function evidenceLine(evidence: EvidenceLike[], offset: number): string {
  const row = evidence[offset % Math.max(evidence.length, 1)];
  return clean(row?.statement ?? "River weather and kinship protocol set the pace of every task.");
}

export class Book1LivedHistoryTransformer {
  transform(input: { outline: Chapter1DeepOutline; evidence: EvidenceLike[] }): Book1LivedHistory {
    const packets = input.outline.timeline.map((scene, index) => ({
      segment: scene.segment,
      environment: clean(`${scene.setting} ${evidenceLine(input.evidence, index)}`),
      socialOrder: clean(
        `${scene.characters.join(", ")} read rank through who speaks first, who waits, and who is trusted to carry unfinished news.`,
      ),
      materialLife: clean(
        `Wet cane, ash, stored grain, woven reed, and smoke-stung cloth keep everyone inside the same practical economy of effort.`,
      ),
      movementPatterns: clean(
        `People move between bank, cook fire, and council edge in loops that reveal allegiance without needing a declaration.`,
      ),
      laborRitualGovernanceCues: clean(
        `Work and ritual are not separate tracks here; oath language, food allocation, and witness order all function as local governance.`,
      ),
      obviousToCharacters: clean(
        `Everyone knows debt, weather, and kin obligation can shift status before sundown, so speech stays careful and short.`,
      ),
      notConsciouslyExplained: clean(
        `No one pauses to explain why a silence matters; the body already knows when danger enters the room.`,
      ),
    }));

    return Book1LivedHistorySchema.parse({
      artifact: "chapter_lived_history",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      packets,
    });
  }
}
