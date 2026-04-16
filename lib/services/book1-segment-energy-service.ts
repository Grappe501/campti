import { z } from "zod";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";

const EnergyTypeSchema = z.enum(["stillness", "motion", "ritual", "threat", "intimacy", "observation", "rupture", "aftermath"]);

const SegmentEnergySchema = z.object({
  segment: z.number().int().positive(),
  dominantEnergy: EnergyTypeSchema,
  tempoTarget: z.enum(["slow", "measured", "variable", "fast"]),
  sentenceDensityTarget: z.object({ min: z.number().int(), max: z.number().int() }),
  abstractionCeiling: z.number(),
  sensoryPriority: z.array(z.string()),
  transitionPressure: z.enum(["low", "moderate", "high"]),
});

export const Book1SegmentEnergyMapSchema = z.object({
  artifact: z.literal("chapter_segment_energy"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segments: z.array(SegmentEnergySchema),
});

export type Book1SegmentEnergyMap = z.infer<typeof Book1SegmentEnergyMapSchema>;

const ROTATION: Array<z.infer<typeof EnergyTypeSchema>> = ["stillness", "motion", "observation", "ritual", "threat", "rupture"];

function inferEnergy(sceneFocus: string, index: number): z.infer<typeof EnergyTypeSchema> {
  const lower = sceneFocus.toLowerCase();
  if (/\b(ritual|oath|ceremon)\b/.test(lower)) return "ritual";
  if (/\b(threat|danger|pressure|risk)\b/.test(lower)) return "threat";
  if (/\b(watch|observe|witness|lens)\b/.test(lower)) return "observation";
  if (/\b(close|ending|handoff|after)\b/.test(lower)) return "aftermath";
  return ROTATION[index % ROTATION.length];
}

function profileForEnergy(energy: z.infer<typeof EnergyTypeSchema>) {
  if (energy === "stillness") {
    return { tempoTarget: "slow" as const, sentenceDensityTarget: { min: 5, max: 7 }, abstractionCeiling: 0.22, sensoryPriority: ["touch", "breath", "sound"], transitionPressure: "low" as const };
  }
  if (energy === "motion") {
    return {
      tempoTarget: "fast" as const,
      sentenceDensityTarget: { min: 6, max: 9 },
      abstractionCeiling: 0.18,
      sensoryPriority: ["movement", "friction", "weather"],
      transitionPressure: "high" as const,
    };
  }
  if (energy === "ritual") {
    return {
      tempoTarget: "measured" as const,
      sentenceDensityTarget: { min: 5, max: 8 },
      abstractionCeiling: 0.2,
      sensoryPriority: ["gesture", "voice", "object"],
      transitionPressure: "moderate" as const,
    };
  }
  if (energy === "threat") {
    return {
      tempoTarget: "variable" as const,
      sentenceDensityTarget: { min: 6, max: 10 },
      abstractionCeiling: 0.16,
      sensoryPriority: ["distance", "silence", "pulse"],
      transitionPressure: "high" as const,
    };
  }
  if (energy === "intimacy") {
    return {
      tempoTarget: "measured" as const,
      sentenceDensityTarget: { min: 4, max: 7 },
      abstractionCeiling: 0.24,
      sensoryPriority: ["breath", "eye-line", "posture"],
      transitionPressure: "moderate" as const,
    };
  }
  if (energy === "observation") {
    return {
      tempoTarget: "slow" as const,
      sentenceDensityTarget: { min: 5, max: 8 },
      abstractionCeiling: 0.2,
      sensoryPriority: ["detail", "sound", "distance"],
      transitionPressure: "moderate" as const,
    };
  }
  if (energy === "rupture") {
    return {
      tempoTarget: "fast" as const,
      sentenceDensityTarget: { min: 7, max: 10 },
      abstractionCeiling: 0.15,
      sensoryPriority: ["impact", "motion", "heat"],
      transitionPressure: "high" as const,
    };
  }
  return {
    tempoTarget: "measured" as const,
    sentenceDensityTarget: { min: 4, max: 7 },
    abstractionCeiling: 0.2,
    sensoryPriority: ["residue", "sound", "light"],
    transitionPressure: "low" as const,
  };
}

export class Book1SegmentEnergyService {
  build(input: { outline: Chapter1DeepOutline }): Book1SegmentEnergyMap {
    const segments = input.outline.timeline.map((row, index) => {
      const dominantEnergy = inferEnergy(row.sceneFocus, index);
      const profile = profileForEnergy(dominantEnergy);
      return {
        segment: row.segment,
        dominantEnergy,
        tempoTarget: profile.tempoTarget,
        sentenceDensityTarget: profile.sentenceDensityTarget,
        abstractionCeiling: profile.abstractionCeiling,
        sensoryPriority: profile.sensoryPriority,
        transitionPressure: profile.transitionPressure,
      };
    });
    return Book1SegmentEnergyMapSchema.parse({
      artifact: "chapter_segment_energy",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      segments,
    });
  }
}
