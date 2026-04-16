import { z } from "zod";

type CognitionSignatureCharacter = {
  character: string;
  attentionBias: string;
  thoughtStyle: string;
  namingAvoidanceStyle: string;
};

type EnneagramMediationCharacter = {
  character: string;
  perceptionBiasOutputs: string[];
  misreadingPatterns: string[];
  silencePatterns: string[];
  bodilyStressConversions: string[];
};

type DevelopmentalCharacter = {
  character: string;
  renderingImpact: {
    bodilyConversionPatterns: string[];
    silencePatterns: string[];
    intimacyDistancePatterns: string[];
  };
};

type SegmentShape = {
  segment: number;
  cast: string[];
};

export const Book1EmbodiedInnerLifeRouterSchema = z.object({
  artifact: z.literal("chapter_embodied_inner_life_router"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  routes: z.array(
    z.object({
      segment: z.number().int().positive(),
      character: z.string(),
      bodyCue: z.string(),
      attentionShift: z.string(),
      silencePattern: z.string(),
      objectInteraction: z.string(),
      socialReading: z.string(),
      ritualDeviation: z.string(),
      environmentalPressureContact: z.string(),
      priorityOrder: z.array(
        z.enum([
          "body cue",
          "attention shift",
          "silence pattern",
          "object interaction",
          "social reading",
          "ritual deviation",
          "environmental pressure contact",
        ]),
      ),
    }),
  ),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()),
  }),
});

export type Book1EmbodiedInnerLifeRouter = z.infer<typeof Book1EmbodiedInnerLifeRouterSchema>;

export class Book1EmbodiedInnerLifeRouterService {
  build(input: {
    segments: SegmentShape[];
    chapterDevelopmentalIntimacyEngine: { characters: DevelopmentalCharacter[] };
    chapterEnneagramMediationLayer: { characters: EnneagramMediationCharacter[] };
    chapterCognitionSignatures: { characters: CognitionSignatureCharacter[] };
  }): Book1EmbodiedInnerLifeRouter {
    const routes = input.segments.flatMap((segment) =>
      segment.cast.map((character) => {
        const cognition = input.chapterCognitionSignatures.characters.find(
          (row) => row.character.toLowerCase() === character.toLowerCase(),
        );
        const mediation = input.chapterEnneagramMediationLayer.characters.find(
          (row) => row.character.toLowerCase() === character.toLowerCase(),
        );
        const developmental = input.chapterDevelopmentalIntimacyEngine.characters.find(
          (row) => row.character.toLowerCase() === character.toLowerCase(),
        );

        return {
          segment: segment.segment,
          character,
          bodyCue:
            developmental?.renderingImpact.bodilyConversionPatterns[0] ??
            mediation?.bodilyStressConversions[0] ??
            "breath cadence shifts before naming pressure",
          attentionShift:
            cognition?.attentionBias ??
            mediation?.perceptionBiasOutputs[0] ??
            "attention redirects toward witness order before interpretation",
          silencePattern:
            developmental?.renderingImpact.silencePatterns[0] ??
            mediation?.silencePatterns[0] ??
            "silence carries unresolved motive before speech",
          objectInteraction:
            "hands route feeling through handled objects before explicit explanation",
          socialReading:
            mediation?.misreadingPatterns[0] ??
            cognition?.namingAvoidanceStyle ??
            "social reading leads interpretation; certainty remains provisional",
          ritualDeviation:
            "small ritual timing deviations surface interior strain without explicit thesis",
          environmentalPressureContact:
            "weather, distance, and witness placement physically constrain available speech",
          priorityOrder: [
            "body cue",
            "attention shift",
            "silence pattern",
            "object interaction",
            "social reading",
            "ritual deviation",
            "environmental pressure contact",
          ] as const,
        };
      }),
    );

    return Book1EmbodiedInnerLifeRouterSchema.parse({
      artifact: "chapter_embodied_inner_life_router",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      routes,
      provenance: {
        sourceArtifacts: [
          "reports/book1-chapter-01-developmental-intimacy-engine.json",
          "reports/book1-chapter-01-enneagram-mediation-layer.json",
          "reports/book1-chapter-01-cognition-signatures.json",
        ],
      },
    });
  }
}
