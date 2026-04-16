import { z } from "zod";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import type { Book1VoiceContract } from "@/lib/services/book1-voice-contract-service";

const ProseBriefSegmentSchema = z.object({
  segment: z.number().int().positive(),
  mustShow: z.string(),
  livedPov: z.string(),
  activePressure: z.string(),
  readerInference: z.string(),
  handoff: z.string(),
});

export const Book1ProseBriefsSchema = z.object({
  artifact: z.literal("chapter_prose_briefs"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segments: z.array(ProseBriefSegmentSchema),
});

export type Book1ProseBriefs = z.infer<typeof Book1ProseBriefsSchema>;

const BANNED_PHRASES = [
  "the focus turns to",
  "psychologically",
  "this beat matters because",
  "the reader should feel",
  "foreshadowing signal",
  "transition",
  "narrative purpose",
  "reader experience",
  "historical context",
];

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sanitize(value: string): string {
  let out = value;
  for (const phrase of BANNED_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), "");
  }
  return compact(out);
}

function inferPressure(psychology: string): string {
  const lower = psychology.toLowerCase();
  if (lower.includes("fear")) return "Fear pushes caution even when caution costs dignity.";
  if (lower.includes("desire")) return "Desire for continuity competes with immediate safety.";
  if (lower.includes("duty")) return "Duty to kin conflicts with the need to survive the day.";
  if (lower.includes("pressure")) return "Outside pressure narrows what can be said in the open.";
  return "Old obligations tighten while choices get smaller.";
}

function handoffLine(segment: number, total: number): string {
  if (segment >= total) return "Night closes over unresolved vows that now govern the chapter break.";
  return "The final action leaves a residue that carries directly into the next movement.";
}

export class Book1ProseBriefTransformer {
  transform(input: { outline: Chapter1DeepOutline; voiceContract: Book1VoiceContract }): Book1ProseBriefs {
    const textureCue = input.voiceContract.positiveConstraints.historicalEmbeddingMode.requiredTextureSignals[0] ?? "labor cue";
    const segments = input.outline.timeline.map((row) => {
      const mustShow = sanitize(
        `${row.setting} The scene stays with concrete work, interrupted routine, and social glances that reveal changing rank.`,
      );
      const livedPov = sanitize(
        `${row.characters[0] ?? "The focal witness"} reads weather, hands, and silence before speaking, carrying memory as immediate burden rather than explanation.`,
      );
      const activePressure = sanitize(`${inferPressure(row.psychology)} Every exchange is shaped by ${textureCue} and public consequence.`);
      const readerInference = sanitize(
        `Without explicit explanation, the scene makes clear that private choices are already being judged by kinship law and future debt.`,
      );
      const handoff = sanitize(handoffLine(row.segment, input.outline.timeline.length));
      return { segment: row.segment, mustShow, livedPov, activePressure, readerInference, handoff };
    });

    return Book1ProseBriefsSchema.parse({
      artifact: "chapter_prose_briefs",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      segments,
    });
  }
}
