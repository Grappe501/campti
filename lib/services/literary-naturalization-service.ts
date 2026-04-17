import type { ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";

/**
 * Turns literary-device governance into scene-native craft instructions (less "device panel", more place/thread).
 */
export class LiteraryNaturalizationService {
  derivePromptLines(constraints: ProseGenerationConstraints | null | undefined): string[] {
    if (!constraints) {
      return [
        "LITERARY_NATURALIZATION: no merged prose constraints — keep devices rare and anchored to place/object/thread.",
      ];
    }
    const ld = constraints.literaryDeviceConstraints;
    const lines: string[] = [
      "LITERARY_NATURALIZATION (Cluster 5): devices must feel earned by setting and continuity — not announced.",
      `— Sound pattern allowance: ${ld.soundPatternAllowance}; symbolism: ${ld.symbolismAllowance}; metaphor/simile: ${ld.metaphorSimileAllowance}.`,
      `— Closure pressure style: ${ld.closurePressureStyle}; repetition: ${ld.repetitionAllowance}.`,
    ];
    if (constraints.driftFlags.length) {
      lines.push(`— Prose drift flags to absorb as texture (never paste): ${constraints.driftFlags.slice(0, 6).join(" | ")}`);
    }
    lines.push(
      "Alliteration: only in narrow zones (breath, route, labor chorus) and never as tongue-twister ornament.",
      "Symbolism: bind to concrete anchors already in the scene contract (place, kin object, route memory).",
      "Callbacks: use as half-heard echo or misremembered phrase — not wink-to-reader repetition.",
    );
    return lines;
  }
}
