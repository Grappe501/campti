import { z } from "zod";

const PositiveConstraintSchema = z.object({
  sentenceRhythmProfile: z.object({
    preferredBands: z.array(z.object({ minWords: z.number().int(), maxWords: z.number().int(), targetShare: z.number() })),
    cadenceVarianceTarget: z.number(),
    maxRepeatedOpeningsPerSegment: z.number().int(),
  }),
  paragraphDensity: z.object({
    targetSentencesPerParagraph: z.object({ min: z.number().int(), max: z.number().int() }),
    targetWordRangePerParagraph: z.object({ min: z.number().int(), max: z.number().int() }),
  }),
  narrativeDistance: z.object({
    mode: z.string(),
    povDiscipline: z.array(z.string()),
  }),
  historicalEmbeddingMode: z.object({
    mode: z.string(),
    requiredTextureSignals: z.array(z.string()),
  }),
  emotionalRestraintLevel: z.object({
    target: z.string(),
    mustShowThrough: z.array(z.string()),
  }),
  sensoryToAbstractionRatio: z.object({
    targetRatio: z.number(),
    minimumSensoryHitsPerSegment: z.number().int(),
    maxAbstractSignalsPerSegment: z.number().int(),
  }),
  transitionStyle: z.object({
    preferred: z.array(z.string()),
    avoid: z.array(z.string()),
  }),
  foreshadowingTreatment: z.object({
    preferred: z.array(z.string()),
    forbidden: z.array(z.string()),
  }),
});

const NegativeConstraintSchema = z.object({
  outlineLeakageLanguage: z.array(z.string()),
  metaNarrativeScaffolding: z.array(z.string()),
  summaryStylePhrases: z.array(z.string()),
  overExplanatoryThematicPhrasing: z.array(z.string()),
  artificialRhetoricalSymmetry: z.array(z.string()),
  repeatedSegmentOpeningPatterns: z.array(z.string()),
  genericAbstractionWithoutEmbodiment: z.array(z.string()),
});

const ComplianceCheckSchema = z.object({
  check: z.string(),
  scoreRange: z.object({ min: z.number(), max: z.number() }),
  passThreshold: z.number(),
  weight: z.number(),
  measurement: z.string(),
});

export const Book1VoiceContractSchema = z.object({
  artifact: z.literal("chapter_voice_contract"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  positiveConstraints: PositiveConstraintSchema,
  negativeConstraints: NegativeConstraintSchema,
  complianceRubric: z.object({
    rhythmCompliance: ComplianceCheckSchema,
    narrativeDistanceCompliance: ComplianceCheckSchema,
    embodimentCompliance: ComplianceCheckSchema,
    historicalIntegrationCompliance: ComplianceCheckSchema,
    abstractionLeakageRisk: ComplianceCheckSchema,
    syntheticProseRisk: ComplianceCheckSchema,
  }),
});

export type Book1VoiceContract = z.infer<typeof Book1VoiceContractSchema>;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizedStarts(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/g)
    .map((sentence) =>
      compact(sentence)
        .toLowerCase()
        .replace(/^[^a-z0-9]+/g, "")
        .split(/\s+/g)
        .slice(0, 3)
        .join(" "),
    )
    .filter((row) => row.length > 0);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sentenceLengths(text: string): number[] {
  return text
    .split(/(?<=[.!?])\s+/g)
    .map((sentence) => sentence.split(/\s+/g).filter((token) => token.trim().length > 0).length)
    .filter((count) => count > 0);
}

export function scoreVoiceContractCompliance(input: { draftText: string; contract: Book1VoiceContract }): Record<string, number> {
  const text = input.draftText;
  const lower = text.toLowerCase();
  const lengths = sentenceLengths(text);
  const avgLength = average(lengths);
  const starts = normalizedStarts(text);
  const repeatedStarts = starts.length - new Set(starts).size;
  const sensoryHits = (lower.match(/\b(river|ash|hands|fire|weather|cane|clay|wind|smoke|mud|salt|reed)\b/g) ?? []).length;
  const abstractionHits = (lower.match(/\b(system|structure|constraint|framework|theme|dynamic|logic|process)\b/g) ?? []).length;
  const historicalSignals = (lower.match(/\b(kinship|council|lineage|ritual|oath|debt|harvest|ledger|tide)\b/g) ?? []).length;
  const distanceSignals = (lower.match(/\b(thought|noticed|watched|hesitated|kept silent|measured)\b/g) ?? []).length;

  const rhythmCompliance = Math.max(0, 1 - Math.abs(avgLength - 18) / 20 - repeatedStarts * 0.02);
  const narrativeDistanceCompliance = Math.min(1, distanceSignals / 8);
  const embodimentCompliance = Math.min(1, sensoryHits / 18);
  const historicalIntegrationCompliance = Math.min(1, historicalSignals / 14);
  const abstractionLeakageRisk = Math.min(1, abstractionHits / Math.max(8, sensoryHits));
  const syntheticProseRisk = Math.min(1, repeatedStarts / Math.max(6, starts.length * 0.25));

  return {
    rhythmCompliance: Number(rhythmCompliance.toFixed(3)),
    narrativeDistanceCompliance: Number(narrativeDistanceCompliance.toFixed(3)),
    embodimentCompliance: Number(embodimentCompliance.toFixed(3)),
    historicalIntegrationCompliance: Number(historicalIntegrationCompliance.toFixed(3)),
    abstractionLeakageRisk: Number(abstractionLeakageRisk.toFixed(3)),
    syntheticProseRisk: Number(syntheticProseRisk.toFixed(3)),
  };
}

export class Book1VoiceContractService {
  buildContract(): Book1VoiceContract {
    return Book1VoiceContractSchema.parse({
      artifact: "chapter_voice_contract",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt: new Date().toISOString(),
      positiveConstraints: {
        sentenceRhythmProfile: {
          preferredBands: [
            { minWords: 8, maxWords: 15, targetShare: 0.38 },
            { minWords: 16, maxWords: 26, targetShare: 0.47 },
            { minWords: 27, maxWords: 36, targetShare: 0.15 },
          ],
          cadenceVarianceTarget: 0.42,
          maxRepeatedOpeningsPerSegment: 1,
        },
        paragraphDensity: {
          targetSentencesPerParagraph: { min: 4, max: 8 },
          targetWordRangePerParagraph: { min: 90, max: 180 },
        },
        narrativeDistance: {
          mode: "third-person close with embodied social observation",
          povDiscipline: [
            "show inner pressure through perception and withheld response",
            "anchor thought in immediate physical context",
            "avoid omniscient future exposition",
          ],
        },
        historicalEmbeddingMode: {
          mode: "lived material reality",
          requiredTextureSignals: ["labor gesture", "ritual signal", "social hierarchy cue", "environment pressure"],
        },
        emotionalRestraintLevel: {
          target: "controlled, unsentimental pressure",
          mustShowThrough: ["choice under strain", "silence", "micro-reaction", "attention shift"],
        },
        sensoryToAbstractionRatio: {
          targetRatio: 2.6,
          minimumSensoryHitsPerSegment: 6,
          maxAbstractSignalsPerSegment: 2,
        },
        transitionStyle: {
          preferred: ["consequence handoff", "object continuity", "social pressure carryover"],
          avoid: ["meta signpost", "declared transition"],
        },
        foreshadowingTreatment: {
          preferred: ["latent implication", "behavioral omen", "ritual anomaly"],
          forbidden: ["explicit future summary", "arc explanation"],
        },
      },
      negativeConstraints: {
        outlineLeakageLanguage: ["the focus turns to", "this beat matters because", "transition to next", "segment objective"],
        metaNarrativeScaffolding: ["the chapter does", "the narrative now", "the story signals", "reader should"],
        summaryStylePhrases: ["in this scene", "what happens next", "the purpose is", "this section shows"],
        overExplanatoryThematicPhrasing: ["because this symbolizes", "the theme is", "this represents"],
        artificialRhetoricalSymmetry: ["not only... but also", "both x and y in equal measure", "on the one hand"],
        repeatedSegmentOpeningPatterns: ["scene x holds", "at river light", "by this point"],
        genericAbstractionWithoutEmbodiment: ["systems pressure", "social dynamic", "historical process", "structural tension"],
      },
      complianceRubric: {
        rhythmCompliance: {
          check: "sentence rhythm and opening variance",
          scoreRange: { min: 0, max: 1 },
          passThreshold: 0.68,
          weight: 0.2,
          measurement: "sentence-length distribution + repeated opening count",
        },
        narrativeDistanceCompliance: {
          check: "close POV discipline without omniscient exposition",
          scoreRange: { min: 0, max: 1 },
          passThreshold: 0.65,
          weight: 0.16,
          measurement: "presence of perception-action cues vs meta narration",
        },
        embodimentCompliance: {
          check: "sensory and material grounding density",
          scoreRange: { min: 0, max: 1 },
          passThreshold: 0.72,
          weight: 0.2,
          measurement: "sensory token density and concrete action references",
        },
        historicalIntegrationCompliance: {
          check: "historical context appears as lived conditions",
          scoreRange: { min: 0, max: 1 },
          passThreshold: 0.7,
          weight: 0.16,
          measurement: "kinship/labor/ritual cues without expository explanation",
        },
        abstractionLeakageRisk: {
          check: "generic abstraction leakage risk",
          scoreRange: { min: 0, max: 1 },
          passThreshold: 0.45,
          weight: 0.14,
          measurement: "abstraction term frequency relative to sensory grounding",
        },
        syntheticProseRisk: {
          check: "template-like synthetic prose risk",
          scoreRange: { min: 0, max: 1 },
          passThreshold: 0.35,
          weight: 0.14,
          measurement: "repeated openings, balanced-clause cadence, and formulaic pivots",
        },
      },
    });
  }
}
