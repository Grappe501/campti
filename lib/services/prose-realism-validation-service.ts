import {
  ProseRealismDriftReportSchema,
  ProseRealismProfileSchema,
  ProseRealismValidationBundleSchema,
  RealismTruthResultSchema,
  type ProseRealismProfile,
  type ProseRealismValidationBundle,
} from "@/lib/domain/prose-realism";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import { AntiMechanicalProseValidationService } from "@/lib/services/anti-mechanical-prose-validation-service";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

const MODERN_COGNITION_SNIPS = [
  "trauma response",
  "cognitive bias",
  "mindfulness",
  "inner child",
  "self-care",
  "gaslight",
];

const NARRATOR_INTRUSION_SNIPS = [
  "little did she know that everyone",
  "unknown to her, the entire",
  "the reader should understand",
];

export class ProseRealismValidationService {
  private readonly antiMechanical = new AntiMechanicalProseValidationService();

  validate(input: {
    sceneId: string;
    generatedText: string;
    sceneGenerationInput: SceneGenerationInput;
    preGenerationProfile: ProseRealismProfile;
  }): ProseRealismValidationBundle {
    const prose = input.generatedText;
    const lower = prose.toLowerCase();
    const failureModes: string[] = [];
    const warnings: string[] = [];
    const hardFailures: string[] = [];
    const suggestedCorrections: string[] = [];
    const recommendedRefinementTargets: string[] = [];

    let cognitionPenalty = 0;
    for (const snip of MODERN_COGNITION_SNIPS) {
      if (lower.includes(snip)) {
        hardFailures.push(`modern_cognition_leak:${snip.replace(/\s+/g, "_")}`);
        cognitionPenalty += 0.22;
        suggestedCorrections.push("Replace with era-plausible embodied appraisal and social inference.");
      }
    }

    let narratorPenalty = 0;
    for (const snip of NARRATOR_INTRUSION_SNIPS) {
      if (lower.includes(snip)) {
        hardFailures.push(`narrator_intrusion:${snip.replace(/\s+/g, "_")}`);
        narratorPenalty += 0.2;
        suggestedCorrections.push("Restrict to POV-witnessable inference; remove omniscient social totals.");
      }
    }

    const truthHardFailureCount = hardFailures.length;

    const mech = this.antiMechanical.evaluate(prose);
    warnings.push(...mech.warnings);
    failureModes.push(...mech.flags);
    if (mech.sceneOutputInvalid) {
      hardFailures.push("anti_mechanical:scene_output_invalid");
      suggestedCorrections.push(
        "Rewrite to reduce template cadence, system-visible vocabulary, and abstract stacking; increase scene-native sensory and behavioral specificity.",
      );
    }

    const sensoryHits = ["mud", "smoke", "water", "cold", "heat", "hand", "wood", "iron", "river"].filter((w) =>
      lower.includes(w),
    ).length;
    const sensoryPenalty = sensoryHits < 2 ? 0.12 : 0;

    if (sensoryPenalty > 0) {
      warnings.push("Low embodied sensory grounding for historical scene mode.");
      recommendedRefinementTargets.push("add two concrete sensory anchors tied to place or labor");
    }

    const emotionalOverstatement = /\b(?:profoundly|utterly|completely) (?:devastated|heartbroken|transformed)\b/i.test(prose);
    if (emotionalOverstatement) {
      warnings.push("Possible emotional overstatement — prefer indirect consequence.");
      failureModes.push("emotional_overstatement_risk");
    }

    const sceneOutputValidUnderRealismRules = truthHardFailureCount === 0 && !mech.sceneOutputInvalid;

    const base = input.preGenerationProfile;
    const post = ProseRealismProfileSchema.parse({
      ...base,
      cognitionTruthScore: clamp01(base.cognitionTruthScore - cognitionPenalty),
      narratorBoundaryScore: clamp01(base.narratorBoundaryScore - narratorPenalty),
      sensoryEmbodimentScore: clamp01(base.sensoryEmbodimentScore - sensoryPenalty),
      antiMechanicalScore: mech.antiMechanicalScore,
      realismScore: clamp01(
        (base.eraTruthScore +
          clamp01(base.cognitionTruthScore - cognitionPenalty) +
          clamp01(base.narratorBoundaryScore - narratorPenalty) +
          base.emotionalCredibilityScore +
          clamp01(base.sensoryEmbodimentScore - sensoryPenalty) +
          base.voiceDistinctnessScore +
          base.consequenceResidueScore +
          base.literaryNaturalnessScore +
          mech.antiMechanicalScore) /
          9,
      ),
      validationFlags: base.validationFlags.concat(
        !sceneOutputValidUnderRealismRules
          ? ["cluster5_scene_output_invalid", "cluster5_realism_hard_failure"]
          : ["cluster5_realism_validated"],
      ),
    });

    const drift = ProseRealismDriftReportSchema.parse({
      artifact: "prose_realism_drift_report",
      contractVersion: "1",
      sceneId: input.sceneId,
      failureModes,
      warnings,
      hardFailures,
      suggestedCorrections,
      recommendedRefinementTargets: recommendedRefinementTargets.concat(
        truthHardFailureCount > 0 ? ["repair era cognition or narrator boundary before promotion"] : [],
        mech.sceneOutputInvalid ? ["reduce template/system texture; increase scene-native variation"] : [],
      ),
    });

    const invalidationReasons = [
      ...hardFailures.map((h) => `hard:${h}`),
      ...mech.invalidationReasons,
    ];

    const realismTruth = RealismTruthResultSchema.parse({
      contractVersion: "1",
      canonicalSceneGenerationObserved: true,
      realismLayerAppliedToLivePrompt: Boolean(input.sceneGenerationInput.proseRealismLayer?.promptInstructionLines.length),
      sceneOutputValidUnderRealismRules,
      invalidationReasons,
    });

    return ProseRealismValidationBundleSchema.parse({
      artifact: "prose_realism_validation_bundle",
      contractVersion: "1",
      sceneId: input.sceneId,
      postValidationProfile: post,
      driftReport: drift,
      realismTruth,
    });
  }
}
