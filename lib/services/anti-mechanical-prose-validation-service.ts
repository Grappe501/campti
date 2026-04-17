/**
 * Heuristic anti-template / anti-system detectors for generated prose (deterministic).
 *
 * ANTI-MECHANICAL RULE: Output may be marked invalid when signals read as template-like, repetitive,
 * or visibly system-driven without enough scene-native variation — see `sceneOutputInvalid`.
 */
export const ANTI_MECHANICAL_INVALID_SCORE_CEILING = 0.42;

export class AntiMechanicalProseValidationService {
  evaluate(prose: string): {
    antiMechanicalScore: number;
    flags: string[];
    warnings: string[];
    /** True when prose fails the anti-mechanical rule (not merely advisory). */
    sceneOutputInvalid: boolean;
    invalidationReasons: string[];
  } {
    const t = prose.trim();
    const lower = t.toLowerCase();
    const flags: string[] = [];
    const warnings: string[] = [];
    const invalidationReasons: string[] = [];
    let penalty = 0;

    const sentences = t.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
    const starters = sentences.map((s) => s.split(/\s+/).slice(0, 2).join(" ").toLowerCase());
    const starterDup = sentences.length >= 4 ? starters.length - new Set(starters).size : 0;
    if (sentences.length >= 4 && starterDup >= 2) {
      penalty += 0.12;
      flags.push("repeated_sentence_openers");
      warnings.push("Several sentences share the same opening cadence — vary entry and agency.");
    }

    const templatePhrases = [
      "it was a",
      "little did",
      "in that moment",
      "she knew that",
      "the air was thick",
      "couldn't help but feel",
    ];
    let templatePhraseHits = 0;
    for (const p of templatePhrases) {
      let count = 0;
      let search = 0;
      while (true) {
        const i = lower.indexOf(p, search);
        if (i === -1) break;
        count += 1;
        search = i + Math.max(1, p.length);
      }
      if (count > 0) {
        templatePhraseHits += count;
        penalty += 0.06 * Math.min(4, count);
        flags.push(`template_phrase:${p.replace(/\s+/g, "_")}x${count}`);
      }
    }

    const explicitEmotion = /\b(felt (?:happy|sad|angry|anxious|depressed|excited|worried))\b/i;
    if (explicitEmotion.test(t)) {
      penalty += 0.08;
      flags.push("explicit_emotion_label");
      warnings.push("Prefer behavioral, sensory, or social evidence over direct emotion naming.");
    }

    const systemy =
      /\b(structured\s+(?:facts?|constraints?)|genealogical|json|contract)\b/i;
    if (systemy.test(t)) {
      penalty += 0.15;
      flags.push("system_language_leak");
      warnings.push("Prose echoes tooling vocabulary — remove meta references.");
      invalidationReasons.push("anti_mechanical:system_language_leak");
    }

    const abstractStack =
      (t.match(/\b(meaning|symbolize|represent|theme|arc|narrative)\b/gi) ?? []).length;
    if (abstractStack >= 4) {
      penalty += 0.1;
      flags.push("abstract_interpretation_stack");
      warnings.push("High density of abstract interpretation — ground in witnessable detail.");
    }

    const antiMechanicalScore = Math.max(0, Math.min(1, Number((1 - Math.min(0.95, penalty)).toFixed(3))));

    if (antiMechanicalScore < ANTI_MECHANICAL_INVALID_SCORE_CEILING) {
      invalidationReasons.push(
        `anti_mechanical:low_scene_native_variation(score=${antiMechanicalScore.toFixed(2)}<${ANTI_MECHANICAL_INVALID_SCORE_CEILING})`,
      );
    }

    if (flags.includes("repeated_sentence_openers") && templatePhraseHits >= 2) {
      invalidationReasons.push("anti_mechanical:repetitive_cadence_with_multiple_template_phrases");
    }

    if (flags.includes("abstract_interpretation_stack") && flags.includes("explicit_emotion_label")) {
      invalidationReasons.push("anti_mechanical:abstract_stack_with_explicit_emotion_labels");
    }

    const sceneOutputInvalid = invalidationReasons.length > 0;

    return {
      antiMechanicalScore,
      flags,
      warnings,
      sceneOutputInvalid,
      invalidationReasons: [...new Set(invalidationReasons)],
    };
  }
}
