import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";

export type CharacterSimulationValidationResult = {
  contractVersion: "1";
  clusterTag: "cluster8_character_simulation_validation";
  sceneId: string;
  flags: string[];
  hardIssues: string[];
  softIssues: string[];
  scenePressureSatisfied: boolean;
  voiceFlatteningRisk: boolean;
};

/**
 * Post-gen checks: empty pressure, voice collapse, plot-forcing tells (heuristic).
 */
export class CharacterSimulationValidationService {
  validate(input: {
    sceneGenerationInput: SceneGenerationInput;
    generatedText: string;
  }): CharacterSimulationValidationResult {
    const sim = input.sceneGenerationInput.characterSimulationRuntime;
    const sceneId = input.sceneGenerationInput.contract.scene.id;
    const text = input.generatedText.trim();
    const flags: string[] = [];
    const hardIssues: string[] = [];
    const softIssues: string[] = [];

    if (!sim) {
      return {
        contractVersion: "1",
        clusterTag: "cluster8_character_simulation_validation",
        sceneId,
        flags: ["cluster8_validation_skipped_no_runtime"],
        hardIssues: [],
        softIssues: [],
        scenePressureSatisfied: true,
        voiceFlatteningRisk: false,
      };
    }

    const necessityJoined = sim.sceneEmergenceDigest.sceneNecessityReasons.join(" ").toLowerCase();
    const lowEmbodiment =
      text.length > 400 && !text.includes(",") && text.split("\n").length < 3;
    if (lowEmbodiment) {
      softIssues.push("prose_block_may_be_under_segmented_for_multi_character_pressure");
    }

    if (text.length < 220) {
      hardIssues.push("scene_too_thin_for_declared_character_pressure");
      flags.push("cluster8_empty_or_thin_scene");
    }

    const uniqueSpeakerCues = new Set(
      sim.voiceProfiles.map((v) => v.metaphorDomain + v.cadenceProfile.slice(0, 12)),
    );
    const voiceFlatteningRisk = uniqueSpeakerCues.size === 1 && sim.voiceProfiles.length > 1;
    if (voiceFlatteningRisk) {
      softIssues.push("voice_metaphor_domain_collapsed_across_characters");
      flags.push("cluster8_voice_flattening_risk");
    }

    const plotForcePhrases = [
      "little did they know",
      "suddenly, for no reason",
      "out of nowhere",
      "as if on cue",
    ];
    for (const p of plotForcePhrases) {
      if (text.toLowerCase().includes(p)) {
        softIssues.push(`plot_force_phrase_detected:${p}`);
        flags.push("cluster8_plot_force_language");
      }
    }

    const participating = input.sceneGenerationInput.contract.participatingPeople.map((p) => p.id);
    const mentionHits = participating.filter((id) => text.includes(id));
    if (participating.length > 1 && mentionHits.length === participating.length) {
      softIssues.push("raw_character_ids_in_prose_suggest_template_leak");
    }

    const scenePressureSatisfied =
      necessityJoined.length > 0 && sim.sceneEmergenceDigest.conflictSources.length > 0 && !hardIssues.length;

    return {
      contractVersion: "1",
      clusterTag: "cluster8_character_simulation_validation",
      sceneId,
      flags,
      hardIssues,
      softIssues,
      scenePressureSatisfied,
      voiceFlatteningRisk,
    };
  }
}
