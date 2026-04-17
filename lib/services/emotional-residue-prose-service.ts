import type { CamptiEpicEmotionalGravityPack } from "@/lib/domain/epic-emotional-gravity";

/**
 * Promotes EEGS / carry-forward signals into behavioral and sensory prose instructions (not melodrama).
 */
export class EmotionalResidueProseService {
  derivePromptLines(pack: CamptiEpicEmotionalGravityPack | null | undefined): string[] {
    if (!pack) {
      return [
        "CONSEQUENCE_RESIDUE: no EEGS pack on this run — still avoid emotional reset at scene end; leave relational or bodily remainder.",
      ];
    }
    const s = pack.cockpitSummary;
    const lines: string[] = [
      "EEGS_PROSE_RESIDUE (embody; never restate as analysis):",
      `— Fear/desire/vulnerability lines to texture (not dialogue labels): ${s.activeFearDesireVulnerabilityLines.slice(0, 6).join(" | ") || "none listed"}`,
      `— Carry-forward emotional hooks: ${s.emotionalCarryForwardSummary.slice(0, 4).join(" | ") || "none listed"}`,
    ];
    if (s.resetHeavyWarnings.length) {
      lines.push(`— Anti-reset warnings from gravity pack: ${s.resetHeavyWarnings.slice(0, 4).join(" | ")}`);
    }
    if (s.consequenceIrreversibilityMarkers.length) {
      lines.push(
        `— Consequence shadow (behavioral/sensory): ${s.consequenceIrreversibilityMarkers.slice(0, 3).join(" | ")}`,
      );
    }
    lines.push(
      "Prefer omission, pause, deflection, and altered proximity over naming emotions directly.",
      "End with unfinished relational or bodily pressure when continuity asks for carry-forward.",
    );
    return lines;
  }
}
