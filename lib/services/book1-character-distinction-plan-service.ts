import { z } from "zod";

import type { Book1CognitionSignatures } from "@/lib/services/book1-character-cognition-signature-service";
import type { Book1SegmentSimulationState } from "@/lib/services/book1-segment-simulation-state-builder";

const InteriorChannelSchema = z.enum(["image", "duty", "suspicion", "memory", "bodily_sensation", "social_reading"]);

const CharacterDistinctionSchema = z.object({
  character: z.string(),
  noticesFirst: z.string(),
  neverNamesDirectly: z.string(),
  emotionalPressurePhysicalization: z.string(),
  sentenceTexture: z.string(),
  dominantInteriorChannel: InteriorChannelSchema,
});

export const Book1CharacterDistinctionPlanSchema = z.object({
  artifact: z.literal("chapter_character_distinction_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  characters: z.array(CharacterDistinctionSchema),
});

export type Book1CharacterDistinctionPlan = z.infer<typeof Book1CharacterDistinctionPlanSchema>;

function chooseChannel(input: string): z.infer<typeof InteriorChannelSchema> {
  const lower = input.toLowerCase();
  if (/\bduty|obligation|lineage|continuity\b/.test(lower)) return "duty";
  if (/\bmisread|uncertain|risk|threat|danger\b/.test(lower)) return "suspicion";
  if (/\bremember|past|before\b/.test(lower)) return "memory";
  if (/\bbreath|jaw|hands|posture|shoulders\b/.test(lower)) return "bodily_sensation";
  if (/\broom|witness|order|rank|social\b/.test(lower)) return "social_reading";
  return "image";
}

export class Book1CharacterDistinctionPlanService {
  build(input: {
    cognitionSignatures: Book1CognitionSignatures;
    segmentSimulationState: Book1SegmentSimulationState;
  }): Book1CharacterDistinctionPlan {
    const distinct = input.cognitionSignatures.characters.map((character) => {
      const simulationPersona =
        input.segmentSimulationState.segments
          .flatMap((segment) => segment.people)
          .find((person) => person.character.toLowerCase() === character.character.toLowerCase()) ?? null;
      const neverNamesDirectly = simulationPersona?.hiding ?? "the private cost of choosing continuity";
      const pressurePhysical = simulationPersona
        ? `${character.character} shows pressure through ${character.sensoryPriority[0] ?? "breath"} and pace changes when ${simulationPersona.misreads.toLowerCase()}.`
        : `${character.character} shows pressure through posture and timing rather than explicit emotion labels.`;
      const sentenceTexture =
        character.thoughtStyle.includes("compressed")
          ? "short-to-medium clauses with interrupted cadence and concrete pivots"
          : character.thoughtStyle.includes("relational")
            ? "medium clauses with social-reference chaining and selective omission"
            : "mixed clause lengths with sensory anchor before inference";
      const channel = chooseChannel(`${character.attentionBias} ${character.decisionStyle} ${neverNamesDirectly}`);
      return {
        character: character.character,
        noticesFirst: character.attentionBias,
        neverNamesDirectly,
        emotionalPressurePhysicalization: pressurePhysical,
        sentenceTexture,
        dominantInteriorChannel: channel,
      };
    });

    return Book1CharacterDistinctionPlanSchema.parse({
      artifact: "chapter_character_distinction_plan",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      characters: distinct,
    });
  }
}
