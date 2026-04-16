import {
  NarratorEraBridgeProfileSchema,
  type NarratorEraBridgeProfile,
  type NarratorModeProfile,
} from "@/lib/domain/narrator-presence";

export class NarratorEraBridgeService {
  buildCamptiBridges(input: { modeProfile: NarratorModeProfile }): NarratorEraBridgeProfile[] {
    const links = [
      {
        fromEraId: "era-1650",
        toEraId: "era-1890",
        reassuranceSignals: [
          "Narrator keeps continuity anchors explicit while preserving era-native cognition.",
          "Warning phrase and river-route motifs remain active across the jump.",
        ],
      },
      {
        fromEraId: "era-1890",
        toEraId: "era-1960",
        reassuranceSignals: [
          "Narrator frames inherited burden as continuity, not collapse.",
          "Lineage signal continuity is restated with transformed social pressure.",
        ],
      },
      {
        fromEraId: "era-1960",
        toEraId: "era-2026",
        reassuranceSignals: [
          "Narrator marks transition from inherited witness toward lived witness.",
          "Epic question continuity remains explicit while first-person threshold emerges.",
        ],
      },
    ] as const;

    return links.map((row) =>
      NarratorEraBridgeProfileSchema.parse({
        artifact: "narrator_era_bridge_profile",
        schemaVersion: "1.0.0",
        profileId: `${row.fromEraId}->${row.toEraId}:narrator-bridge`,
        fromEraId: row.fromEraId,
        toEraId: row.toEraId,
        reassuranceSignals: row.reassuranceSignals,
        activeNarratorMode: input.modeProfile,
        eraNarrationShiftRules: [
          {
            ruleId: `${row.fromEraId}->${row.toEraId}:mode-preservation`,
            fromEraId: row.fromEraId,
            toEraId: row.toEraId,
            narratorContinuitySignal: [
              "Preserve one continuity anchor and one unresolved question line in first bridge cluster.",
            ],
            modeThatMustRemain: [
              "Narrator framing remains bounded; character cognition remains era-native.",
              "Narrator authority cannot outrun evidence mode.",
            ],
            allowedToneShift: ["increase reflective pressure", "increase personal stake when lineage nearness rises"],
            prohibitedToneShift: ["modern cognition injection into character interiority", "omniscient flattening of era difference"],
          },
        ],
        distanceWithoutDislocationRules: [
          {
            ruleId: `${row.fromEraId}->${row.toEraId}:anti-dislocation`,
            dislocationRiskSignal: "reader may perceive timeline severance",
            continuityRepairAction: [
              "reassert anchor continuity through transformed recurrence",
              "bind hook continuity to emotional carry-forward",
            ],
            requiredAnchorIds: ["anchor-river-witness", "anchor-phrase-warning"],
          },
        ],
        epicQuestionContinuityPlan: [
          "Carry central epic question through transformed but recognizable expression.",
          "Increase ambiguity in answer space, not ambiguity in continuity ownership.",
        ],
        hookContinuityPreservationPlan: [
          "Preserve emotional attachment signal within first scene pair after transition.",
          "Preserve unresolved continuity pressure at chapter closure.",
        ],
        validationFlags: ["bridge-rules-explicit", "distance-without-dislocation-enforced"],
      }),
    );
  }

  deriveBridgeStatus(bridges: NarratorEraBridgeProfile[]): string {
    const invalid = bridges.some(
      (bridge) => bridge.reassuranceSignals.length === 0 || bridge.distanceWithoutDislocationRules.length === 0,
    );
    return invalid ? "narrator-bridge-risk" : "narrator-bridge-healthy";
  }
}
