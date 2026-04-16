import { z } from "zod";

const CognitionSignatureSchema = z.object({
  character: z.string(),
  attentionBias: z.string(),
  thoughtStyle: z.string(),
  emotionalProcessingStyle: z.string(),
  namingAvoidanceStyle: z.string(),
  sensoryPriority: z.array(z.string()),
  decisionStyle: z.string(),
});

export const Book1CognitionSignaturesSchema = z.object({
  artifact: z.literal("chapter_cognition_signatures"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  characters: z.array(CognitionSignatureSchema),
});

export type Book1CognitionSignatures = z.infer<typeof Book1CognitionSignaturesSchema>;

type HiddenHistoryLike = {
  character: string;
  suppressedMotive: string;
  privateWound: string;
};

function inferAttentionBias(input: HiddenHistoryLike): string {
  const lower = `${input.suppressedMotive} ${input.privateWound}`.toLowerCase();
  if (/\b(fear|wound|erasure)\b/.test(lower)) return "threat-first scan of faces, doors, and pauses";
  if (/\b(duty|continuity|lineage)\b/.test(lower)) return "obligation-first scan of kin order and witness position";
  return "context-first scan of labor, weather, and social rank shifts";
}

function inferThoughtStyle(input: HiddenHistoryLike): string {
  const lower = `${input.suppressedMotive} ${input.privateWound}`.toLowerCase();
  if (/\b(fear|wound)\b/.test(lower)) return "compressed inferential thought; tests outcomes before speaking";
  if (/\b(desire|continuity)\b/.test(lower)) return "relational thought; maps choices through kin consequences";
  return "situational thought with short internal revisions under pressure";
}

function inferEmotionalProcessing(input: HiddenHistoryLike): string {
  const lower = `${input.suppressedMotive} ${input.privateWound}`.toLowerCase();
  if (/\b(fear|erasure)\b/.test(lower)) return "suppresses fear into stillness and delayed response";
  if (/\b(duty|continuity)\b/.test(lower)) return "converts feeling into practical action and ritual compliance";
  return "keeps emotion legible only through timing, attention, and silence";
}

function inferNamingStyle(input: HiddenHistoryLike): string {
  const lower = `${input.suppressedMotive} ${input.privateWound}`.toLowerCase();
  if (/\b(fear|wound|danger)\b/.test(lower)) return "avoids naming risk directly; speaks through objects and gesture";
  if (/\b(duty|lineage)\b/.test(lower)) return "names obligations directly, avoids naming private hurt";
  return "names immediate task, avoids abstract motive language";
}

function inferSensoryPriority(input: HiddenHistoryLike): string[] {
  const lower = `${input.suppressedMotive} ${input.privateWound}`.toLowerCase();
  if (/\b(fear|danger)\b/.test(lower)) return ["sound", "distance", "breath"];
  if (/\b(continuity|lineage|duty)\b/.test(lower)) return ["touch", "object weight", "voice cadence"];
  return ["weather", "posture", "movement"];
}

function inferDecisionStyle(input: HiddenHistoryLike): string {
  const lower = `${input.suppressedMotive} ${input.privateWound}`.toLowerCase();
  if (/\b(fear|wound)\b/.test(lower)) return "risk-minimizing; delays commitment until signal confidence rises";
  if (/\b(duty|lineage)\b/.test(lower)) return "constraint-first; chooses for continuity over comfort";
  return "situational; chooses smallest irreversible action under uncertainty";
}

export class Book1CharacterCognitionSignatureService {
  build(input: { activeCharacters: string[]; hiddenHistories: HiddenHistoryLike[] }): Book1CognitionSignatures {
    const characters = input.activeCharacters.map((character) => {
      const hidden = input.hiddenHistories.find((row) => row.character.toLowerCase() === character.toLowerCase()) ?? {
        character,
        suppressedMotive: "preserve continuity",
        privateWound: "fear of social fracture",
      };
      return {
        character,
        attentionBias: inferAttentionBias(hidden),
        thoughtStyle: inferThoughtStyle(hidden),
        emotionalProcessingStyle: inferEmotionalProcessing(hidden),
        namingAvoidanceStyle: inferNamingStyle(hidden),
        sensoryPriority: inferSensoryPriority(hidden),
        decisionStyle: inferDecisionStyle(hidden),
      };
    });
    return Book1CognitionSignaturesSchema.parse({
      artifact: "chapter_cognition_signatures",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      characters,
    });
  }
}
