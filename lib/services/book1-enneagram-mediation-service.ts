import { z } from "zod";

const EnneagramOperatingCharacterSchema = z.object({
  character: z.string(),
  coreFear: z.string(),
  defenseMechanism: z.string(),
  attentionFixation: z.string(),
  stressPattern: z.string(),
  securityPattern: z.string(),
  selfAwarenessLevel: z.enum(["low", "developing", "high"]),
  selfNarrationAccuracy: z.number().min(0).max(1),
  howTheyMisreadOthers: z.string(),
  whatTheyCannotAdmit: z.array(z.string()),
});

const EnneagramConsciousnessCharacterSchema = z.object({
  character: z.string(),
  attentionEngine: z.object({
    noticesFirst: z.string(),
    ignores: z.string(),
    overFocusesOn: z.string(),
  }),
  distortionEngine: z.object({
    misinterpretsRealityAs: z.string(),
    coreNarrativeBias: z.string(),
  }),
  relationshipFieldBehavior: z.object({
    intimateBehavior: z.string(),
    kinshipRole: z.string(),
    powerWorkBehavior: z.string(),
    socialGroupBehavior: z.string(),
  }),
  stressSecurityMovement: z.object({
    underPressure: z.string(),
    inGrowth: z.string(),
  }),
  spiritualOrientation: z.object({
    seeks: z.string(),
    distorts: z.string(),
    experiencesMeaning: z.string(),
  }),
  languageImpact: z.object({
    silenceVsSpeech: z.string(),
    abstractionVsEmbodiment: z.string(),
  }),
});

export const Book1EnneagramMediationLayerSchema = z.object({
  artifact: z.literal("chapter_enneagram_mediation_layer"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  characters: z.array(
    z.object({
      character: z.string(),
      perceptionBiasOutputs: z.array(z.string()),
      omissionPatterns: z.array(z.string()),
      misreadingPatterns: z.array(z.string()),
      bodilyStressConversions: z.array(z.string()),
      silencePatterns: z.array(z.string()),
      conflictResponsePatterns: z.array(z.string()),
      intimacyDistancePatterns: z.array(z.string()),
      authorityResponsePatterns: z.array(z.string()),
      ritualMeaningPatterns: z.array(z.string()),
    }),
  ),
});
export type Book1EnneagramMediationLayer = z.infer<typeof Book1EnneagramMediationLayerSchema>;

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export class Book1EnneagramMediationService {
  build(input: {
    activeCharacters: string[];
    enneagramOperatingLayer: { characters: Array<z.infer<typeof EnneagramOperatingCharacterSchema>> };
    enneagramConsciousnessEngine: { characters: Array<z.infer<typeof EnneagramConsciousnessCharacterSchema>> };
  }): Book1EnneagramMediationLayer {
    const characters = input.activeCharacters.map((character) => {
      const operating = input.enneagramOperatingLayer.characters.find((row) => row.character.toLowerCase() === character.toLowerCase());
      const consciousness = input.enneagramConsciousnessEngine.characters.find(
        (row) => row.character.toLowerCase() === character.toLowerCase(),
      );

      const perceptionBiasOutputs = unique([
        `notices ${consciousness?.attentionEngine.noticesFirst ?? "movement before claims"}`,
        `filters threat through ${operating?.attentionFixation ?? "witness-order volatility"}`,
        `ignores ${consciousness?.attentionEngine.ignores ?? "unpriced relational residue"}`,
        `over-focuses on ${consciousness?.attentionEngine.overFocusesOn ?? "rank and seam shifts"}`,
      ]);
      const omissionPatterns = unique([
        `withholds ${operating?.whatTheyCannotAdmit[0] ?? "private dependency"}`,
        `self-narration ceiling at ${Math.round((operating?.selfNarrationAccuracy ?? 0.5) * 100)}%`,
        `suppresses motive naming when ${operating?.defenseMechanism ?? "protective concealment"} activates`,
      ]);
      const misreadingPatterns = unique([
        operating?.howTheyMisreadOthers ?? "reads caution as concealed resistance",
        consciousness?.distortionEngine.misinterpretsRealityAs ?? "treats hesitation as intent",
        consciousness?.distortionEngine.coreNarrativeBias ?? "frames events through rupture expectancy",
      ]);
      const bodilyStressConversions = unique([
        operating?.stressPattern ?? "converts stress into control routines",
        consciousness?.stressSecurityMovement.underPressure ?? "tightens options and timing",
        consciousness?.languageImpact.abstractionVsEmbodiment ?? "routes abstraction into breath and object contact",
      ]);
      const silencePatterns = unique([
        consciousness?.languageImpact.silenceVsSpeech ?? "uses silence as a control gate",
        operating?.selfNarrationAccuracy !== undefined && operating.selfNarrationAccuracy < 0.45
          ? "silence extends until external evidence forces response"
          : "silence holds unresolved motive before reply",
      ]);
      const conflictResponsePatterns = unique([
        operating?.defenseMechanism ?? "protective positioning",
        consciousness?.stressSecurityMovement.underPressure ?? "pressure response favors narrowing",
      ]);
      const intimacyDistancePatterns = unique([
        consciousness?.relationshipFieldBehavior.intimateBehavior ?? "selective disclosure under attachment strain",
        consciousness?.relationshipFieldBehavior.socialGroupBehavior ?? "tests trust before joining consensus",
      ]);
      const authorityResponsePatterns = unique([
        consciousness?.relationshipFieldBehavior.powerWorkBehavior ?? "tracks authority through leverage shifts",
        operating?.coreFear ? `resists authority moves that trigger ${operating.coreFear.toLowerCase()}` : "resists abrupt hierarchy changes",
      ]);
      const ritualMeaningPatterns = unique([
        consciousness?.spiritualOrientation.experiencesMeaning ?? "meaning arrives through embodied ritual sequence",
        consciousness?.spiritualOrientation.seeks ?? "seeks continuity in practiced form",
        consciousness?.spiritualOrientation.distorts ?? "distorts uncertainty into rupture forecast",
      ]);

      return {
        character,
        perceptionBiasOutputs,
        omissionPatterns,
        misreadingPatterns,
        bodilyStressConversions,
        silencePatterns,
        conflictResponsePatterns,
        intimacyDistancePatterns,
        authorityResponsePatterns,
        ritualMeaningPatterns,
      };
    });

    return Book1EnneagramMediationLayerSchema.parse({
      artifact: "chapter_enneagram_mediation_layer",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      characters,
    });
  }
}
