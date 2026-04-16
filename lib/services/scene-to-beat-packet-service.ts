import type { BeatAssemblyChain } from "@/lib/domain/beat-assembly";
import type { ComposedScenePlan } from "@/lib/domain/chapter-composition";

export type SceneBeatPacket = {
  packetId: string;
  scenePlanId: string;
  beatChainId: string;
  selectedBeatTypes: string[];
  requiredBiases: Record<string, number>;
  validationWarnings: string[];
};

export class SceneToBeatPacketService {
  derive(input: {
    scene: ComposedScenePlan;
    beatChain: BeatAssemblyChain;
    sceneIndex: number;
  }): SceneBeatPacket {
    const selected = input.beatChain.beats
      .slice(input.sceneIndex, input.sceneIndex + 2)
      .map((beat) => beat.beatType);
    const selectedBeatTypes = selected.length > 0
      ? selected
      : input.beatChain.beats.slice(0, 1).map((beat) => beat.beatType);
    const warnings: string[] = [];
    if (selectedBeatTypes.length === 0) warnings.push("No beat mapping available for scene.");
    const selectedKeys = selectedBeatTypes as readonly string[];
    for (const required of Object.keys(input.scene.requiredBeatBiases)) {
      if (!selectedKeys.includes(required)) warnings.push(`Missing required beat bias alignment: ${required}`);
    }
    return {
      packetId: `${input.scene.scenePlanId}:beat-packet`,
      scenePlanId: input.scene.scenePlanId,
      beatChainId: input.beatChain.artifact,
      selectedBeatTypes,
      requiredBiases: input.scene.requiredBeatBiases,
      validationWarnings: warnings,
    };
  }
}

