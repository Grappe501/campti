import {
  SequenceValidationReportSchema,
  type BookSequencePlan,
  type ChapterSequencePlan,
  type SequenceValidationReport,
} from "@/lib/domain/narrative-sequence";

function push<T>(arr: T[], value: T | null): void {
  if (value !== null) arr.push(value);
}

export class NarrativeSequenceValidationService {
  validate(input: {
    bookPlan: BookSequencePlan;
    chapterPlan: ChapterSequencePlan;
    /** Epic continuity validation risks (e.g. HCEL anti-dropoff) promoted into sequence gating. */
    cluster3EpicContinuityHookRisks?: string[];
  }): SequenceValidationReport {
    const warnings: string[] = [];
    const flags: SequenceValidationReport["structuralWeaknessFlags"] = [];

    const dominant = input.bookPlan.chapterFunctionSequence.map((row) => row.dominantFunction);
    for (let index = 2; index < dominant.length; index += 1) {
      if (dominant[index] === dominant[index - 1] && dominant[index - 1] === dominant[index - 2]) {
        warnings.push(`Function cluster detected around chapter index ${index + 1}.`);
        push(flags, "repeated_function_cluster");
        break;
      }
    }
    const overexposedThreads = input.bookPlan.threadCadencePlans.filter((plan) => plan.recurrenceInterval === 1 && plan.latentWindows.length === 0);
    if (overexposedThreads.length > 0) {
      warnings.push(`Threads are overexposed without latent windows: ${overexposedThreads.map((plan) => plan.threadId).join(", ")}.`);
      push(flags, "thread_overexposure");
    }
    const missingRoutes = input.bookPlan.routeCadencePlan.filter((plan) => plan.directPresenceWindows.length === 0 && plan.indirectPresenceWindows.length === 0);
    if (missingRoutes.length > 0) {
      warnings.push("At least one route has no scheduled recurrence window.");
      push(flags, "missing_route_presence");
    }
    if (input.chapterPlan.delayBindings.length === 0 && input.bookPlan.convergenceWindows.length === 0) {
      warnings.push("No delayed convergence strategy detected.");
      push(flags, "no_delayed_convergence");
    }
    if (input.bookPlan.recallWindows.length === 0) {
      warnings.push("No recall windows defined for reinterpretive scheduling.");
      push(flags, "no_recall_events");
    }
    if (new Set(input.bookPlan.expansionContractionPattern).size <= 1) {
      warnings.push("Expansion/contraction pattern is flat.");
      push(flags, "flat_expansion_contraction");
    }

    const pressureCurve = input.bookPlan.motionFramework.pacingProfile.pressureCurve;
    const pressureSpread = Math.max(...pressureCurve) - Math.min(...pressureCurve);
    if (pressureSpread < 0.18) {
      warnings.push("Reader-energy pressure spread is too flat.");
      push(flags, "flat_reader_energy");
    }
    const linearTransitionsOnly = input.bookPlan.motionFramework.allowedTransitions.length <= 2;
    if (linearTransitionsOnly) {
      warnings.push("Motion framework transitions are overly linear.");
      push(flags, "over_linear_structure");
    }

    const hookRisks = input.cluster3EpicContinuityHookRisks ?? [];
    for (const risk of hookRisks) {
      if (risk.includes("ANTI-DROPOFF") || risk.includes("READER-CARRY FAIL")) {
        warnings.push(`Cluster3 hook continuity: ${risk}`);
        push(flags, "cluster3_hook_continuity_pressure");
        break;
      }
    }

    const score = Number(Math.max(0, 1 - flags.length * 0.11 - warnings.length * 0.03).toFixed(3));
    return SequenceValidationReportSchema.parse({
      artifact: "sequence_validation_report",
      schemaVersion: "1.0.0",
      sequenceScore: score,
      sequenceWarnings: warnings,
      structuralWeaknessFlags: Array.from(new Set(flags)),
    });
  }
}

