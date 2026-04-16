import {
  LiteraryDeviceApplicationPlanSchema,
  LiteraryDeviceValidationResultSchema,
  type LiteraryDeviceApplicationPlan,
  type LiteraryDeviceControlSetting,
  type LiteraryDeviceValidationIssue,
  type LiteraryDeviceValidationResult,
} from "@/lib/domain/literary-device-control";

export class LiteraryDeviceValidationService {
  validate(input: {
    plan: LiteraryDeviceApplicationPlan;
    controls: LiteraryDeviceControlSetting[];
    activeThreadIds: string[];
    chapterMode: string;
    chapterToneCeiling: "minimal" | "guarded" | "elevated" | "transition_peak";
  }): LiteraryDeviceValidationResult {
    const parsedPlan = LiteraryDeviceApplicationPlanSchema.parse(input.plan);
    const hardFailures: LiteraryDeviceValidationIssue[] = [];
    const softWarnings: LiteraryDeviceValidationIssue[] = [];
    const suggestedSuppressionActions: string[] = [];
    const driftDiagnostics: string[] = [];

    const controlByDevice = new Map(input.controls.map((control) => [control.deviceId, control]));
    const motifDrivenCount = input.controls.filter((control) => control.densityBand === "motif_driven").length;

    const alliteration = controlByDevice.get("alliteration");
    if (
      alliteration?.alliterationPolicy &&
      (alliteration.activationMode === "strong" || alliteration.activationMode === "required") &&
      alliteration.alliterationPolicy.highTensionDecisionLineAllowance
    ) {
      hardFailures.push({
        severity: "hard",
        category: "forced_alliteration",
        message: "Alliteration strong/required mode permits high-tension decision lines.",
        suggestedAction: "Disable high-tension decision line usage and lower density to rare/occasional.",
      });
    }

    for (const control of input.controls) {
      if ((control.deviceId === "symbolism" || control.deviceId === "motif") && control.threadBindings.length === 0 && control.settingBindings.length === 0) {
        hardFailures.push({
          severity: "hard",
          category: "decorative_symbolism_without_binding",
          message: `${control.deviceId} has no thread/setting binding.`,
          suggestedAction: "Bind symbolism/motif to thread, setting, object, or character anchors.",
        });
      }
      if (control.deviceId === "callback_echo" && control.threadBindings.length === 0 && control.motifBindings.length === 0) {
        hardFailures.push({
          severity: "hard",
          category: "callback_without_source",
          message: "Callback echo has no source motif/thread binding.",
          suggestedAction: "Add callback source binding before activation.",
        });
      }
      if (control.deviceId === "philosophy_echo" && control.explicitnessBand === "high") {
        softWarnings.push({
          severity: "soft",
          category: "philosophy_preachiness_risk",
          message: "Philosophy echo explicitness is high, risking preachy exposition.",
          suggestedAction: "Lower explicitness and route through action/contrast/consequence.",
        });
      }
    }

    if (parsedPlan.activeDeviceIds.length >= 9) {
      softWarnings.push({
        severity: "soft",
        category: "device_overload",
        message: "Too many active devices in current plan envelope.",
        suggestedAction: "Suppress lower-priority devices for this scene/chapter.",
      });
      suggestedSuppressionActions.push("Reduce active devices to <= 8 for single-scene focus.");
    }

    if (motifDrivenCount >= 4) {
      softWarnings.push({
        severity: "soft",
        category: "motif_overload",
        message: "Motif-driven controls are over-concentrated.",
        suggestedAction: "Demote some motif-driven controls to patterned/occasional.",
      });
    }

    if (
      input.chapterMode === "continuity_chapter" &&
      parsedPlan.activeDeviceIds.includes("fragmentation_withheld_context") &&
      input.chapterToneCeiling === "minimal"
    ) {
      softWarnings.push({
        severity: "soft",
        category: "tone_breakage_risk",
        message: "Fragmentation device may break continuity chapter tonal integrity.",
        suggestedAction: "Limit fragmentation to transition-only placement zones.",
      });
    }

    if (input.activeThreadIds.length === 0 && parsedPlan.activeDeviceIds.includes("symbolism")) {
      hardFailures.push({
        severity: "hard",
        category: "symbol_without_thread_logic",
        message: "Symbolism active but no active narrative threads to carry meaning recurrence.",
        suggestedAction: "Activate relevant thread bindings or suppress symbolism.",
      });
    }

    driftDiagnostics.push(...parsedPlan.misuseWarnings, ...parsedPlan.densityWarnings);
    if (hardFailures.length > 0) {
      suggestedSuppressionActions.push("Apply hard suppression on failed devices until bindings/risk checks pass.");
    }

    return LiteraryDeviceValidationResultSchema.parse({
      artifact: "literary_device_validation_result",
      passesHardValidation: hardFailures.length === 0,
      hardFailures,
      softWarnings,
      suggestedSuppressionActions,
      driftDiagnostics,
      validationFlags: [
        "native_cognition_protected",
        "chapter_tone_guarded",
        "symbolism_binding_enforced",
        "sound_pattern_risk_checked",
      ],
    });
  }
}
