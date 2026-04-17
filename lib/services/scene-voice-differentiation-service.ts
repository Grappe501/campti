import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";

export type InferredSceneRole =
  | "grounding_scene"
  | "pressure_scene"
  | "closure_scene"
  | "neutral_scene";

function inferSceneRole(contract: SceneGenerationContractV1): InferredSceneRole {
  const order = contract.scene.orderInChapter;
  if (order === 1) return "grounding_scene";
  if (order === null || order === undefined) return "neutral_scene";
  if (order >= 4) return "closure_scene";
  return "pressure_scene";
}

/**
 * Scene/chapter-function-aware voice lines so consecutive scenes do not flatten to one texture.
 */
export class SceneVoiceDifferentiationService {
  derivePromptLines(input: { contract: SceneGenerationContractV1; chapterFunctionHint?: string | null }): string[] {
    const role = inferSceneRole(input.contract);
    const fn = input.chapterFunctionHint?.trim() || "unspecified_chapter_function";
    const intent =
      input.contract.scene.narrativeIntent?.trim() || input.contract.scene.summary?.trim() || "";
    const lines: string[] = [
      `SCENE_ROLE_INFERENCE: ${role} (orderInChapter=${String(input.contract.scene.orderInChapter ?? "null")}).`,
      `CHAPTER_FUNCTION_HINT: ${fn} — let paragraph openings and closure pressure match this scene's job, not a generic chapter template.`,
    ];
    switch (role) {
      case "grounding_scene":
        lines.push(
          "VOICE_SHIFT: prioritize place-embodied arrival, material labor, and who is watching before interpretive summary.",
          "Avoid thesis-like opening; let the world earn attention through friction and detail.",
        );
        break;
      case "pressure_scene":
        lines.push(
          "VOICE_SHIFT: keep relational stakes in behavioral channels (timing, distance, work, silence).",
          "Rotate sentence openings; do not reuse the same syntactic frame as a grounding or closure scene.",
        );
        break;
      case "closure_scene":
        lines.push(
          "VOICE_SHIFT: prefer non-reset closure — leave a behavioral or sensory residue rather than a neat moral summary.",
          "Let the final beat be pressure-forward or withheld; avoid mirrored 'lesson' symmetry with scene one.",
        );
        break;
      default:
        lines.push("VOICE_SHIFT: vary entry texture; avoid repeating the same rhetorical scaffold as adjacent scenes.");
    }
    if (intent.length > 0) {
      lines.push(`SCENE_INTENT_ANCHOR (do not quote; embody): ${intent.slice(0, 280)}`);
    }
    return lines;
  }
}
