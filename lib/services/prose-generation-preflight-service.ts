import type { ProseGenerationConstraints, ProseGenerationPreflight } from "@/lib/domain/prose-generation-constraints";
import { ProseGenerationPreflightSchema } from "@/lib/domain/prose-generation-constraints";

export class ProseGenerationPreflightService {
  build(input: { constraints: ProseGenerationConstraints }): ProseGenerationPreflight {
    return ProseGenerationPreflightSchema.parse({
      artifact: "prose_generation_preflight",
      chapterId: input.constraints.chapterId,
      proseMode: input.constraints.proseMode,
      paragraphObjectiveTypes: [
        "grounded_salience_opening",
        "signal_comparison_mid",
        "relational_or_decision_shift",
        "unresolved_carry_forward_close",
      ],
      openingConstraints: [
        "Open with material action and sensory grounding.",
        "Do not open with historical exposition or abstract emotional labels.",
      ],
      middleConstraints: [
        "Interpretation must remain evidence-linked and observer-bounded.",
        "Use memory comparison only when signal integrity weakens.",
      ],
      endingVectorTypes: [
        "consequence_seed",
        "state_update_with_unresolved_pull",
        "relational_shift_without_full_discharge",
      ],
      localCarryForwardRules: [
        "Each paragraph end should preserve at least one unresolved meaningful pressure marker.",
        "Allow local resolution only when larger continuity pressure remains active.",
      ],
    });
  }
}
