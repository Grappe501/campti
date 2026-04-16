import { z } from "zod";

type VoiceCognitionCharacter = {
  character: string;
  attentionBias: string;
  fearTranslationMode: string;
  socialReadingMode: string;
  silenceThreshold: number;
  bodilyConversionPatterns: string[];
};

type EnneagramMediationCharacter = {
  character: string;
  perceptionBiasOutputs: string[];
  omissionPatterns: string[];
  misreadingPatterns: string[];
  bodilyStressConversions: string[];
  silencePatterns: string[];
  intimacyDistancePatterns: string[];
};

type DevelopmentalCharacter = {
  character: string;
  renderingImpact: {
    bodilyConversionPatterns: string[];
    silencePatterns: string[];
    intimacyDistancePatterns: string[];
  };
};

type SegmentState = {
  segment: number;
  whoIsPresent: string[];
  worldPressure: string;
};

type RenderDirective = {
  segment: number;
  paragraph: "A" | "B" | "C";
  abstractionCeiling: number;
  silenceWithholdingRequirement: boolean;
};

type PerspectiveRoute = {
  segment: number;
  paragraph: "A" | "B" | "C";
  dominantCognitionSource: string;
  lawfulForeshadowingOnly: boolean;
};

type VoiceLaw = {
  abstractionCeiling: {
    maxAbstractSignalsPerParagraph: number;
  };
  emotionalRestraintLaw: string[];
};

type LanguageSuppressionMap = {
  blockedPatterns: string[];
};

export const Book1ConsciousnessCohesionRouterSchema = z.object({
  artifact: z.literal("chapter_consciousness_cohesion_router"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  paragraphZones: z.array(
    z.object({
      segment: z.number().int().positive(),
      paragraph: z.enum(["A", "B", "C"]),
      dominantConsciousnessSource: z.string(),
      supportingConsciousnessModifiers: z.array(z.string()),
      bodilyPriority: z.number().min(0).max(1),
      silencePriority: z.number().min(0).max(1),
      intimacyDistancePriority: z.number().min(0).max(1),
      perceptionPriority: z.number().min(0).max(1),
      abstractionCeilingOverride: z.number().int().nonnegative(),
      emotionalExposureMode: z.enum(["guarded", "measured", "vulnerable-through-action"]),
      lawfulWithholdingMode: z.enum(["strict", "moderate", "minimal"]),
    }),
  ),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()),
  }),
});

export type Book1ConsciousnessCohesionRouter = z.infer<typeof Book1ConsciousnessCohesionRouterSchema>;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

export class Book1ConsciousnessCohesionRouterService {
  build(input: {
    chapterVoiceCognitionMap: { characters: VoiceCognitionCharacter[] };
    chapterEnneagramMediationLayer: { characters: EnneagramMediationCharacter[] };
    chapterDevelopmentalIntimacyEngine: { characters: DevelopmentalCharacter[] };
    chapterSegmentSimulationState: { segments: SegmentState[] };
    chapterRenderDirectives: { directives: RenderDirective[] };
    chapterVoiceLawEngine: VoiceLaw;
    chapterLanguageSuppressionMap: LanguageSuppressionMap;
    chapterPerspectiveRoutingPlan: { routes: PerspectiveRoute[] };
  }): Book1ConsciousnessCohesionRouter {
    const paragraphZones = input.chapterRenderDirectives.directives.map((directive) => {
      const route = input.chapterPerspectiveRoutingPlan.routes.find(
        (row) => row.segment === directive.segment && row.paragraph === directive.paragraph,
      );
      const dominantSource = route?.dominantCognitionSource ?? "Household witness";
      const cognition = input.chapterVoiceCognitionMap.characters.find(
        (row) => row.character.toLowerCase() === dominantSource.toLowerCase(),
      );
      const mediation = input.chapterEnneagramMediationLayer.characters.find(
        (row) => row.character.toLowerCase() === dominantSource.toLowerCase(),
      );
      const developmental = input.chapterDevelopmentalIntimacyEngine.characters.find(
        (row) => row.character.toLowerCase() === dominantSource.toLowerCase(),
      );
      const simulation = input.chapterSegmentSimulationState.segments.find((row) => row.segment === directive.segment);

      const bodilyPriority = clamp01(
        0.42 +
          (directive.paragraph === "A" ? 0.18 : 0.08) +
          (cognition?.bodilyConversionPatterns.length ?? 0) * 0.03 +
          (developmental?.renderingImpact.bodilyConversionPatterns.length ?? 0) * 0.02,
      );
      const silencePriority = clamp01(
        0.25 +
          (directive.silenceWithholdingRequirement ? 0.35 : 0) +
          (cognition?.silenceThreshold ?? 0) * 0.2 +
          ((mediation?.silencePatterns.length ?? 0) > 0 ? 0.08 : 0),
      );
      const intimacyDistancePriority = clamp01(
        0.18 +
          ((mediation?.intimacyDistancePatterns.length ?? 0) > 0 ? 0.24 : 0) +
          ((developmental?.renderingImpact.intimacyDistancePatterns.length ?? 0) > 0 ? 0.24 : 0),
      );
      const perceptionPriority = clamp01(
        0.35 +
          ((mediation?.perceptionBiasOutputs.length ?? 0) > 0 ? 0.25 : 0) +
          (directive.paragraph === "B" ? 0.12 : 0),
      );
      const abstractionCeilingOverride = Math.max(
        0,
        Math.min(
          directive.abstractionCeiling,
          input.chapterVoiceLawEngine.abstractionCeiling.maxAbstractSignalsPerParagraph,
          input.chapterLanguageSuppressionMap.blockedPatterns.includes("the reason is")
            ? directive.paragraph === "C"
              ? 1
              : 0
            : directive.abstractionCeiling,
        ),
      );

      const exposureSignal =
        `${simulation?.worldPressure ?? ""} ${cognition?.fearTranslationMode ?? ""} ${mediation?.omissionPatterns.join(" ") ?? ""}`.toLowerCase();
      const emotionalExposureMode: "guarded" | "measured" | "vulnerable-through-action" =
        /withhold|guard|conceal|control gate|hesitation/.test(exposureSignal)
          ? "guarded"
          : /movement|action|breath|touch|object/.test(exposureSignal)
            ? "vulnerable-through-action"
            : "measured";

      const lawfulWithholdingMode: "strict" | "moderate" | "minimal" =
        route?.lawfulForeshadowingOnly || directive.silenceWithholdingRequirement
          ? "strict"
          : directive.paragraph === "B"
            ? "moderate"
            : "minimal";

      return {
        segment: directive.segment,
        paragraph: directive.paragraph,
        dominantConsciousnessSource: dominantSource,
        supportingConsciousnessModifiers: unique([
          cognition?.attentionBias ?? "",
          cognition?.socialReadingMode ?? "",
          mediation?.misreadingPatterns[0] ?? "",
          mediation?.silencePatterns[0] ?? "",
          developmental?.renderingImpact.silencePatterns[0] ?? "",
          developmental?.renderingImpact.intimacyDistancePatterns[0] ?? "",
        ]).slice(0, 6),
        bodilyPriority,
        silencePriority,
        intimacyDistancePriority,
        perceptionPriority,
        abstractionCeilingOverride,
        emotionalExposureMode,
        lawfulWithholdingMode,
      };
    });

    return Book1ConsciousnessCohesionRouterSchema.parse({
      artifact: "chapter_consciousness_cohesion_router",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      paragraphZones,
      provenance: {
        sourceArtifacts: [
          "reports/book1-chapter-01-voice-cognition-map.json",
          "reports/book1-chapter-01-enneagram-mediation-layer.json",
          "reports/book1-chapter-01-developmental-intimacy-engine.json",
          "reports/book1-chapter-01-segment-simulation-state.json",
          "reports/book1-chapter-01-render-directives.json",
          "reports/book1-chapter-01-voice-law-engine.json",
          "reports/book1-chapter-01-language-suppression-map.json",
        ],
      },
    });
  }
}
