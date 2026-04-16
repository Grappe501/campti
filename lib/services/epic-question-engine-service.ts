import {
  EpicQuestionProfileSchema,
  QuestionEscalationStageSchema,
  QuestionExpressionVariantSchema,
  type EpicQuestionProfile,
  type QuestionExpressionVariant,
} from "@/lib/domain/epic-narrative-continuity";

function variant(input: {
  variantId: string;
  scale: "epic" | "series" | "book" | "chapter" | "scene" | "recall_event";
  eraId: string;
  expressionMode:
    | "direct_expression"
    | "indirect_expression"
    | "symbolic_expression"
    | "relational_expression"
    | "setting_expression"
    | "historical_expression";
  expressionLine: string;
  emotionalSignature: string[];
  linkedAnchorIds: string[];
}): QuestionExpressionVariant {
  return QuestionExpressionVariantSchema.parse(input);
}

export class EpicQuestionEngineService {
  buildCamptiQuestionProfile(): EpicQuestionProfile {
    const centralQuestion =
      "What survives when movement, power, time, and forgetting reshape who a people believe themselves to be?";
    return EpicQuestionProfileSchema.parse({
      artifact: "epic_question_profile",
      schemaVersion: "1.0.0",
      epicId: "campti-epic",
      centralHumanQuestion: centralQuestion,
      questionIntent: "Protect one recognizable human question while letting each era refract it differently.",
      subQuestionsByScale: {
        series: [
          "How does continuity survive as social structures reclassify identity?",
          "Which warning systems remain legible across generations?",
        ],
        book: [
          "What does belonging require when route pressure and external power reorder place?",
          "Which inherited practices are portable and which fail under new conditions?",
        ],
        chapter: [
          "What does this chapter reveal about survival vs fidelity?",
          "Which memory sign shifts meaning but keeps continuity alive?",
        ],
        scene: [
          "What signal appears ordinary now but will be reinterpreted later?",
          "Where does attachment and fear share the same gesture?",
        ],
      },
      expressionVariants: [
        variant({
          variantId: "qv-epic-core",
          scale: "epic",
          eraId: "cross-era",
          expressionMode: "direct_expression",
          expressionLine: centralQuestion,
          emotionalSignature: ["long-memory", "pressure", "continuity-duty"],
          linkedAnchorIds: ["anchor-river-witness", "anchor-warning-pattern"],
        }),
        variant({
          variantId: "qv-book1-place-belonging",
          scale: "book",
          eraId: "era-1650",
          expressionMode: "setting_expression",
          expressionLine: "Can belonging remain true when the place itself becomes unstable?",
          emotionalSignature: ["grounded", "fragile", "watchful"],
          linkedAnchorIds: ["anchor-place-homebend", "anchor-route-fork"],
        }),
        variant({
          variantId: "qv-book3-memory-fracture",
          scale: "book",
          eraId: "era-1960",
          expressionMode: "historical_expression",
          expressionLine: "What does inheritance mean when official history and lived memory disagree?",
          emotionalSignature: ["dislocated", "defiant", "seeking"],
          linkedAnchorIds: ["anchor-phrase-warning", "anchor-family-name-pattern"],
        }),
        variant({
          variantId: "qv-scene-ritual",
          scale: "scene",
          eraId: "era-1650",
          expressionMode: "symbolic_expression",
          expressionLine: "A repeated river-facing gesture asks who remembers the old warning.",
          emotionalSignature: ["ritual", "muted-fear"],
          linkedAnchorIds: ["anchor-gesture-river-check"],
        }),
      ],
      escalationStages: [
        QuestionEscalationStageSchema.parse({
          stageId: "qe-1-belonging",
          stageOrder: 1,
          scale: "book",
          deepeningRule: "Question appears as practical belonging under place pressure.",
          stageQuestionForm: "How do we belong well enough to survive here?",
          requiredDifferenceFromPrior: "Anchored in lived place-work, not abstract philosophy.",
          expectedMeaningGain: "Reader bonds belonging to practice.",
        }),
        QuestionEscalationStageSchema.parse({
          stageId: "qe-2-inheritance",
          stageOrder: 2,
          scale: "series",
          deepeningRule: "Question expands to inherited warning and memory transfer.",
          stageQuestionForm: "What must be carried when world rules shift?",
          requiredDifferenceFromPrior: "Adds intergenerational duty and selective forgetting.",
          expectedMeaningGain: "Reader sees continuity as active labor.",
        }),
        QuestionEscalationStageSchema.parse({
          stageId: "qe-3-reinterpretation",
          stageOrder: 3,
          scale: "epic",
          deepeningRule: "Question refracts through reinterpretation of prior truths.",
          stageQuestionForm: "Which truths survive reinterpretation without becoming false?",
          requiredDifferenceFromPrior: "Past events are re-read from altered historical conditions.",
          expectedMeaningGain: "Reader understands continuity as transformed, not static.",
        }),
      ],
      antiRepetitionGuards: [
        "Every recurrence must add new historical pressure context.",
        "No variant can repeat identical symbol use without meaning shift.",
        "At least one relational expression per era must alter the implied answer.",
      ],
      validationFlags: ["question-centrality-preserved", "cross-era-variants-present"],
    });
  }
}
