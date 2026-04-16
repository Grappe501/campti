import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BookSequencePlanSchema, ChapterSequencePlanSchema } from "@/lib/domain/narrative-sequence";
import { NarrativeSequenceValidationService } from "@/lib/services/narrative-sequence-validation-service";

describe("narrative-sequence-validation-service", () => {
  it("flags repeated chapter-function clustering and missing delayed convergence", () => {
    const bookPlan = BookSequencePlanSchema.parse({
      artifact: "book_sequence_plan",
      schemaVersion: "1.0.0",
      bookId: "book1",
      parentEpicId: "epic1",
      motionFramework: {
        frameworkId: "book1-motion",
        phaseDefinitions: [{ phaseId: "p1", label: "phase", objective: "obj", pressureTarget: 0.5, clarityTarget: 0.5 }],
        chapterAssignments: [
          { chapterId: "ch1", chapterOrder: 1, phaseId: "p1", chapterFunction: "grounding" },
          { chapterId: "ch2", chapterOrder: 2, phaseId: "p1", chapterFunction: "grounding" },
          { chapterId: "ch3", chapterOrder: 3, phaseId: "p1", chapterFunction: "grounding" },
        ],
        allowedTransitions: ["ground->disturb"],
        forbiddenTransitions: [],
        pacingProfile: {
          expansionContractionPattern: ["expansion", "expansion", "expansion"],
          pressureCurve: [0.5, 0.52, 0.51],
          intimacyCurve: [0.5, 0.5, 0.5],
          convergenceCurve: [0.2, 0.2, 0.21],
        },
      },
      chapterFunctionSequence: [
        { chapterId: "ch1", chapterOrder: 1, dominantFunction: "grounding", secondaryFunctions: [] },
        { chapterId: "ch2", chapterOrder: 2, dominantFunction: "grounding", secondaryFunctions: [] },
        { chapterId: "ch3", chapterOrder: 3, dominantFunction: "grounding", secondaryFunctions: [] },
      ],
      threadCadencePlans: [
        {
          threadId: "thread-a",
          introWindow: ["ch1"],
          recurrenceInterval: 1,
          latentWindows: [],
          convergenceWindows: [],
          reinterpretationWindows: [],
          payoffWindow: "book_end",
          disappearanceAllowance: 1,
          echoFrequency: 0.8,
        },
      ],
      routeCadencePlan: [],
      philosophyCadencePlan: [],
      expansionContractionPattern: ["expansion", "expansion", "expansion"],
      fracturePoints: [],
      convergenceWindows: [],
      recallWindows: [],
      endingCarryForwardProfile: ["carry"],
    });
    const chapterPlan = ChapterSequencePlanSchema.parse({
      artifact: "chapter_sequence_plan",
      schemaVersion: "1.0.0",
      chapterId: "ch1",
      dominantFunction: "grounding",
      secondaryFunctions: [],
      readerEnergyRole: "pressure_rise",
      threadRole: "role",
      routeRole: "role",
      philosophyRole: "role",
      recallRole: "role",
      convergenceRole: "role",
      closureRole: "role",
      nextChapterSetup: ["x"],
      delayBindings: [],
      validationFlags: [],
    });

    const report = new NarrativeSequenceValidationService().validate({
      bookPlan,
      chapterPlan,
    });

    assert.equal(report.sequenceScore < 1, true);
    assert.equal(report.structuralWeaknessFlags.includes("repeated_function_cluster"), true);
    assert.equal(report.structuralWeaknessFlags.includes("no_delayed_convergence"), true);
  });
});

