import { z } from "zod";

type VoiceCognitionCharacter = {
  character: string;
  attentionBias: string;
  namingAvoidanceStyle: string;
  socialReadingMode: string;
  decisionMode: string;
};

type CohesionZone = {
  segment: number;
  paragraph: "A" | "B" | "C";
  dominantConsciousnessSource: string;
  emotionalExposureMode: "guarded" | "measured" | "vulnerable-through-action";
  lawfulWithholdingMode: "strict" | "moderate" | "minimal";
  abstractionCeilingOverride: number;
  supportingConsciousnessModifiers: string[];
};

export const Book1VoiceIdentityStabilizerSchema = z.object({
  artifact: z.literal("chapter_voice_identity_stabilizer"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  paragraphGroups: z.array(
    z.object({
      segment: z.number().int().positive(),
      paragraph: z.enum(["A", "B", "C"]),
      chapterVoiceIdentity: z.string(),
      localConsciousnessTexture: z.string(),
      stabilizationRules: z.array(z.string()),
      preventedDriftSignals: z.array(
        z.enum([
          "over-management-tone",
          "theory-flavored-prose",
          "abstract-explanation-spike",
          "generic-good-prose-flattening",
        ]),
      ),
    }),
  ),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()),
  }),
});

export type Book1VoiceIdentityStabilizer = z.infer<typeof Book1VoiceIdentityStabilizerSchema>;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

export class Book1VoiceIdentityStabilizerService {
  build(input: {
    chapterVoiceCognitionMap: { characters: VoiceCognitionCharacter[] };
    chapterConsciousnessCohesionRouter: { paragraphZones: CohesionZone[] };
  }): Book1VoiceIdentityStabilizer {
    const paragraphGroups = input.chapterConsciousnessCohesionRouter.paragraphZones.map((zone) => {
      const cognition = input.chapterVoiceCognitionMap.characters.find(
        (row) => row.character.toLowerCase() === zone.dominantConsciousnessSource.toLowerCase(),
      );

      const chapterVoiceIdentity =
        "Chapter 1 voice law: embodied witness-order pressure, no system-language, no theory-surface, no generic literary smoothing.";
      const localConsciousnessTexture = [
        `${zone.dominantConsciousnessSource} attention=${cognition?.attentionBias ?? "movement-first"}`,
        `naming-avoidance=${cognition?.namingAvoidanceStyle ?? "withhold thesis, show behavior"}`,
        `social-reading=${cognition?.socialReadingMode ?? "read spacing and witness order"}`,
        `decision=${cognition?.decisionMode ?? "stepwise response under pressure"}`,
      ].join(" | ");

      const stabilizationRules = unique([
        "Anchor every paragraph in body/perception before inference.",
        zone.abstractionCeilingOverride <= 0
          ? "Block abstract explanatory clauses unless transformed into movement, silence, or object handling."
          : "Allow minimal abstraction only after embodied evidence has already landed.",
        zone.emotionalExposureMode === "guarded"
          ? "Keep emotion indirect: posture, pause, and misreading; do not narrate interior thesis."
          : "Permit emotional exposure only through lived action chain, not psychological labels.",
        zone.lawfulWithholdingMode === "strict"
          ? "Maintain strict lawful withholding: no resolution language, no summary voice."
          : "Retain partial withholding and preserve unresolved motive edge.",
      ]).slice(0, 5);

      return {
        segment: zone.segment,
        paragraph: zone.paragraph,
        chapterVoiceIdentity,
        localConsciousnessTexture,
        stabilizationRules,
        preventedDriftSignals: [
          "over-management-tone",
          "theory-flavored-prose",
          "abstract-explanation-spike",
          "generic-good-prose-flattening",
        ] as const,
      };
    });

    return Book1VoiceIdentityStabilizerSchema.parse({
      artifact: "chapter_voice_identity_stabilizer",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      paragraphGroups,
      provenance: {
        sourceArtifacts: [
          "reports/book1-chapter-01-voice-cognition-map.json",
          "reports/book1-chapter-01-consciousness-cohesion-router.json",
        ],
      },
    });
  }
}
