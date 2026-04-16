import type { BeatAssemblyChain } from "@/lib/domain/beat-assembly";
import {
  ProseGenerationValidationResultSchema,
  type ProseGenerationConstraints,
  type ProseGenerationValidationIssue,
  type ProseGenerationValidationResult,
} from "@/lib/domain/prose-generation-constraints";

const HARD_MODERN_PATTERNS = ["she felt anxious about what it meant", "trauma response", "cognitive bias"];
const HARD_OMNISCIENT_PATTERNS = ["everyone knew", "the whole settlement knew", "unknown to her, all"];
const HARD_EXPOSITION_PATTERNS = ["historically, this region", "in those times, people always"];

export class ProseGenerationValidationService {
  validate(input: {
    constraints: ProseGenerationConstraints;
    beatChain: BeatAssemblyChain;
    proseBySegment: string[];
  }): ProseGenerationValidationResult {
    const issues: ProseGenerationValidationIssue[] = [];
    const proseJoined = input.proseBySegment.join("\n\n").toLowerCase();

    if (HARD_MODERN_PATTERNS.some((pattern) => proseJoined.includes(pattern))) {
      issues.push({
        severity: "hard",
        category: "modern_cognition_drift",
        message: "Detected modern self-analytic cognition language.",
        suggestedFix: "Re-express cognition via embodied appraisal, relational signal reading, and action routing.",
      });
    }
    if (HARD_OMNISCIENT_PATTERNS.some((pattern) => proseJoined.includes(pattern))) {
      issues.push({
        severity: "hard",
        category: "omniscient_leakage",
        message: "Detected omniscient leakage beyond observer-dependent truth.",
        suggestedFix: "Restrict lines to what POV can notice, infer, or remember.",
      });
    }
    if (HARD_EXPOSITION_PATTERNS.some((pattern) => proseJoined.includes(pattern))) {
      issues.push({
        severity: "hard",
        category: "exposition_drift",
        message: "Detected exposition-first paragraph behavior.",
        suggestedFix: "Move cultural context into place-grounded action and witness behavior.",
      });
    }

    const environmentTokens = ["river", "mud", "reed", "smoke", "grain", "water", "hands", "bundle"];
    const environmentHits = environmentTokens.filter((token) => proseJoined.includes(token)).length;
    if (environmentHits < 3) {
      issues.push({
        severity: "soft",
        category: "weak_place_immersion",
        message: "Low place-immersion lexical grounding for constrained chapter mode.",
        suggestedFix: "Increase material sensory anchors (water, labor tools, humidity, sound).",
      });
    }

    const ending = input.proseBySegment.at(-1)?.toLowerCase() ?? "";
    if (!/(still|yet|before|not yet|without naming|kept)/.test(ending)) {
      issues.push({
        severity: "soft",
        category: "weak_carry_forward",
        message: "Ending momentum appears over-resolved.",
        suggestedFix: "End on unresolved meaningful pressure tied to continuity or consequence seed.",
      });
    }

    const beatOrderHints = input.beatChain.beats.slice(0, 3).map((beat) => beat.beatType.split("_")[0]);
    const beatHintMisses = beatOrderHints.filter((hint) => !proseJoined.includes(hint));
    if (beatHintMisses.length >= 3) {
      issues.push({
        severity: "hard",
        category: "beat_omission",
        message: "Generated prose does not reflect required early beat signal classes.",
        suggestedFix: "Re-align opening paragraphs with salience, environmental confirmation, and memory comparison beats.",
      });
    }

    const hardFailureCount = issues.filter((issue) => issue.severity === "hard").length;
    const softFailureCount = issues.filter((issue) => issue.severity === "soft").length;
    return ProseGenerationValidationResultSchema.parse({
      artifact: "prose_generation_validation",
      passed: hardFailureCount === 0,
      hardFailureCount,
      softFailureCount,
      issues,
      cockpitSummary: {
        compliant: hardFailureCount === 0,
        driftWarnings: issues.map((issue) => `${issue.category}: ${issue.message}`),
      },
      machineFlags: issues.map((issue) => `${issue.severity}:${issue.category}`),
    });
  }
}
