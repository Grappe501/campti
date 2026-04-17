import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";

const MODERN_LEAK_TERMS = [
  "therapy",
  "trauma",
  "mindfulness",
  "boundaries",
  "self-care",
  "gaslight",
  "toxic",
  "processed",
  "validate your feelings",
];

/**
 * Era- and cognition-truth shaping: keeps historical cognition register without prettifying into modern psych language.
 */
export class EraCognitionRealismService {
  derivePromptLines(input: SceneGenerationInput): string[] {
    const era = input.contract.effectiveWorldState.label?.trim() || "unspecified_era";
    const anchors = input.historicalAnchorTerms.slice(0, 12);
    const lines: string[] = [
      `ERA_TRUTH: write as inhabitants of ${era} — reasoning, dread, hope, and moral language must be plausible to that horizon.`,
      "COGNITION_TRUTH: interiority is embodied and social — not contemporary analytic self-report.",
      "Forbidden modern cognition register in thought and dialogue (unless era-sourced source material explicitly licenses): " +
        MODERN_LEAK_TERMS.join(", ") +
        ".",
    ];
    if (anchors.length) {
      lines.push(`HISTORICAL_ANCHOR_TERMS (texture, not checklist): ${anchors.join(", ")}`);
    }
    if (input.cognitionFramePayload && typeof input.cognitionFramePayload === "object") {
      lines.push(
        "Respect COGNITION_FRAME_PAYLOAD mediation: thought-language register must match pinned stacks; do not upgrade diction to modern abstraction.",
      );
    }
    return lines;
  }
}
