import type { ChapterCompositionPlan } from "@/lib/domain/chapter-composition";
import {
  BookMotionFrameworkSchema,
  BookSequencePlanSchema,
  type ChapterFunction,
  ChapterSequencePlanSchema,
  EpicSequencePlanSchema,
  PhilosophyCadencePlanSchema,
  type BookSequencePlan,
  type ChapterSequencePlan,
  type EpicSequencePlan,
} from "@/lib/domain/narrative-sequence";
import type { NarrativeThread, SettingCoverageReport } from "@/lib/domain/narrative-thread";
import { RecallReframingService } from "@/lib/services/recall-reframing-service";
import { RouteCadenceService } from "@/lib/services/route-cadence-service";
import { ThreadCadenceService } from "@/lib/services/thread-cadence-service";

const DEFAULT_FUNCTION_SEQUENCE = [
  "grounding",
  "disturbance",
  "widening",
  "doubling",
  "fracture",
  "echo",
  "convergence",
  "revelation",
] as const;

export class NarrativeSequenceDerivationService {
  private readonly threadCadenceService = new ThreadCadenceService();

  private readonly routeCadenceService = new RouteCadenceService();

  private readonly recallService = new RecallReframingService();

  derive(input: {
    epicId: string;
    bookId: string;
    chapterId: string;
    chapterCompositionPlan: ChapterCompositionPlan;
    threads: NarrativeThread[];
    settingCoverageReport: Pick<SettingCoverageReport, "records" | "missingLocationIds">;
  }): {
    epicSequencePlan: EpicSequencePlan;
    bookSequencePlan: BookSequencePlan;
    chapterSequencePlan: ChapterSequencePlan;
    chapterFunctionMatrix: Record<string, ChapterFunction[]>;
    recallReframingPlans: ReturnType<RecallReframingService["buildPlans"]>;
  } {
    const epicSequencePlan = EpicSequencePlanSchema.parse({
      artifact: "epic_sequence_plan",
      schemaVersion: "1.0.0",
      epicId: input.epicId,
      emotionalNorthStar: "Continuity under pressure transforms identity without severing kinship memory.",
      longArcPhases: ["rooting", "disturbance", "migration_pressure", "convergence", "transformation"],
      continuityThemes: ["kinship labor", "route intelligence", "memory as survival infrastructure"],
      identityPressureTrajectory: [0.2, 0.35, 0.56, 0.74, 0.88],
      routeExpansionTrajectory: [0.18, 0.3, 0.48, 0.69, 0.86],
      generationalPatternRules: [
        "Every rupture inherits a prior unclosed duty loop.",
        "Each generation reinterprets the same warning through changed route conditions.",
      ],
      convergenceStrategy: "Distributed setup followed by staggered local convergences before epic synthesis.",
      finalTransformationLogic: "Transformation is validated only when continuity duty survives new route reality.",
    });

    const chapterIds = Array.from({ length: Math.max(8, input.chapterCompositionPlan.sceneSequence.length) }, (_, index) =>
      `book1-chapter-${String(index + 1).padStart(2, "0")}`,
    );
    const threadCadencePlans = this.threadCadenceService.buildPlans({
      threads: input.threads,
      chapterIds,
      defaultPayoffWindow: "book_end",
    });
    const routeCadencePlan = this.routeCadenceService.buildPlan({
      coverageReport: {
        artifact: "red_river_setting_coverage_report",
        bookId: input.bookId,
        requiredLocationIds: [],
        records: input.settingCoverageReport.records,
        missingLocationIds: input.settingCoverageReport.missingLocationIds,
        underrepresentedLocationIds: [],
        coverageRatio: 1,
        recommendations: [],
      },
      fallbackLocationIds: input.settingCoverageReport.missingLocationIds,
    });
    const recallReframingPlans = this.recallService.buildPlans({
      chapterId: input.chapterId,
      reinterpretationAnchors: input.chapterCompositionPlan.reinterpretationAnchors,
    });

    const motionFramework = BookMotionFrameworkSchema.parse({
      frameworkId: `${input.bookId}:motion:core`,
      phaseDefinitions: [
        { phaseId: "ground", label: "Ground", objective: "Anchor duty and place", pressureTarget: 0.35, clarityTarget: 0.75 },
        { phaseId: "disturb", label: "Disturb", objective: "Introduce unstable signals", pressureTarget: 0.52, clarityTarget: 0.58 },
        { phaseId: "fracture", label: "Fracture", objective: "Break assumptions", pressureTarget: 0.78, clarityTarget: 0.34 },
        { phaseId: "converge", label: "Converge", objective: "Reveal hidden links", pressureTarget: 0.82, clarityTarget: 0.62 },
        { phaseId: "transform", label: "Transform", objective: "Reframe identity and route logic", pressureTarget: 0.7, clarityTarget: 0.8 },
      ],
      chapterAssignments: chapterIds.map((chapterId, index) => ({
        chapterId,
        chapterOrder: index + 1,
        phaseId: index < 2 ? "ground" : index < 4 ? "disturb" : index < 6 ? "fracture" : index < 7 ? "converge" : "transform",
        chapterFunction: DEFAULT_FUNCTION_SEQUENCE[Math.min(index, DEFAULT_FUNCTION_SEQUENCE.length - 1)],
      })),
      allowedTransitions: [
        "ground->disturb",
        "disturb->widen",
        "widen->fracture",
        "fracture->echo",
        "echo->convergence",
        "convergence->revelation",
      ],
      forbiddenTransitions: ["ground->revelation", "disturb->aftermath", "fracture->grounding"],
      pacingProfile: {
        expansionContractionPattern: ["expansion", "expansion", "contraction", "expansion", "contraction", "contraction", "expansion", "stabilization"],
        pressureCurve: [0.3, 0.42, 0.5, 0.6, 0.77, 0.83, 0.72, 0.64],
        intimacyCurve: [0.62, 0.59, 0.54, 0.5, 0.45, 0.48, 0.57, 0.63],
        convergenceCurve: [0.1, 0.15, 0.2, 0.28, 0.41, 0.56, 0.82, 0.9],
      },
    });

    const philosophyThreadIds = input.threads.filter((thread) => thread.threadType === "philosophy_thread").map((thread) => thread.threadId);
    const philosophyCadencePlan = (philosophyThreadIds.length > 0 ? philosophyThreadIds : ["book1-philosophy-reading-signs"]).map((threadId) =>
      PhilosophyCadencePlanSchema.parse({
        philosophyThreadId: threadId,
        recurrenceWindows: ["chapter-01", "chapter-03", "chapter-05", "chapter-07"],
        carrierModes: ["action_pattern", "warning_pattern", "memory_comparison", "scene_contrast"],
        deepeningRule: "Each recurrence must add consequence depth or reinterpretive contrast.",
        explicitnessCeiling: 0.28,
      }),
    );

    const chapterFunctionSequence = motionFramework.chapterAssignments.map((assignment) => ({
      chapterId: assignment.chapterId,
      chapterOrder: assignment.chapterOrder,
      dominantFunction: assignment.chapterFunction,
      secondaryFunctions: assignment.chapterOrder % 2 === 0 ? ["echo"] : ["relay"],
    }));

    const bookSequencePlan = BookSequencePlanSchema.parse({
      artifact: "book_sequence_plan",
      schemaVersion: "1.0.0",
      bookId: input.bookId,
      parentEpicId: input.epicId,
      motionFramework,
      chapterFunctionSequence,
      threadCadencePlans,
      routeCadencePlan,
      philosophyCadencePlan,
      expansionContractionPattern: motionFramework.pacingProfile.expansionContractionPattern,
      fracturePoints: ["chapter-05", "chapter-06"],
      convergenceWindows: ["chapter-07", "chapter-08"],
      recallWindows: ["chapter-03", "chapter-06", "chapter-08"],
      endingCarryForwardProfile: [
        "Route pressure remains active beyond local chapter closure.",
        "Continuity thread resolves locally but expands to epic scale cost.",
      ],
    });

    const chapterSequencePlan = ChapterSequencePlanSchema.parse({
      artifact: "chapter_sequence_plan",
      schemaVersion: "1.0.0",
      chapterId: input.chapterId,
      dominantFunction: "grounding",
      secondaryFunctions: ["disturbance", "concealment"],
      readerEnergyRole: "expansion_push",
      threadRole: "Seed active continuity and warning threads while withholding convergence.",
      routeRole: "Anchor direct source location and schedule indirect route corridor mentions.",
      philosophyRole: "Propagate philosophy through action/observation, not exposition.",
      recallRole: "Install callback-capable anchors for chapter+2 reinterpretation.",
      convergenceRole: "Distribute hidden keys with explicit delayed convergence windows.",
      closureRole: "Close on unresolved pressure with carry-forward hooks.",
      nextChapterSetup: ["Escalate route rumor thread", "Activate one latent memory thread"],
      delayBindings: input.chapterCompositionPlan.sceneSequence.flatMap((scene) => scene.delayedConvergenceKeys),
      validationFlags: ["sequence_first_composition_subordinate"],
    });

    const chapterFunctionMatrix: Record<string, ChapterFunction[]> = {
      opening_window: ["grounding", "disturbance", "widening"],
      complication_window: ["doubling", "concealment", "relay", "route_expansion"],
      fracture_window: ["fracture", "reversal", "compression"],
      convergence_window: ["echo", "memory_return", "convergence", "cost", "revelation", "aftermath"],
    };

    return {
      epicSequencePlan,
      bookSequencePlan,
      chapterSequencePlan,
      chapterFunctionMatrix,
      recallReframingPlans,
    };
  }
}

