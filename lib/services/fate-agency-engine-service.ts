import { FateAgencyProfileSchema, type FateAgencyProfile } from "@/lib/domain/epic-emotional-gravity";

export class FateAgencyEngineService {
  buildCamptiProfile(): FateAgencyProfile {
    return FateAgencyProfileSchema.parse({
      artifact: "fate_agency_profile",
      schemaVersion: "1.0.0",
      profileId: "fate-agency-campti-core",
      epicId: "campti-epic",
      epicQuestionTensionLine: "Can inherited survival logic be transformed without severing belonging?",
      repeatingPatterns: [
        {
          patternId: "pattern-warning-silence",
          patternLabel: "Warning repeated as silence",
          patternType: "inherited_silence",
          generationWindows: ["gen-1", "gen-2", "gen-3"],
          pressureStrength: 0.86,
        },
        {
          patternId: "pattern-route-attachment",
          patternLabel: "Route attachment as identity proof",
          patternType: "land_route_attachment",
          generationWindows: ["gen-1", "gen-2", "gen-4"],
          pressureStrength: 0.79,
        },
      ],
      inheritedPressureLines: [
        {
          lineId: "pressure-1",
          sourceGeneration: "gen-1",
          targetGeneration: "gen-2",
          pressureType: "fear of speaking full warning under surveillance pressure",
          transmissionMode: "silence",
        },
      ],
      attemptedBreakEvents: [
        {
          eventId: "attempt-break-1",
          patternId: "pattern-warning-silence",
          characterId: "younger-kin-observer",
          refusalAction: "Names what elders encoded in gesture only.",
          immediateCost: "Trust fracture and temporary social isolation.",
          outcome: "partial_success",
        },
      ],
      divergenceEvents: [
        {
          eventId: "diverge-1",
          fromPatternId: "pattern-warning-silence",
          divergenceType: "pattern_mutation",
          evidence: "Warning becomes shared route map rather than private family burden.",
          durability: 0.64,
        },
      ],
      falseEscapeEvents: [
        {
          eventId: "false-escape-1",
          assumedEscapeClaim: "Migration alone breaks inheritance pressure.",
          hiddenPatternReturn: "Silence pattern reappears under new institutional form.",
          revealWindow: "book3-middle",
        },
      ],
      transformationWindows: [
        {
          windowId: "transform-window-1",
          generationWindow: "gen-3-to-gen-4",
          enablingConditions: ["witness alignment", "cross-era memory proof", "relationship repair attempt"],
          blockedBy: ["official narrative pressure", "shame-line activation"],
          transformationPotential: 0.7,
        },
      ],
      validationFlags: ["fate-and-agency-both-active"],
    });
  }

  derivePressureMap(profile: FateAgencyProfile): string[] {
    return [
      `patterns=${profile.repeatingPatterns.length}`,
      `break_attempts=${profile.attemptedBreakEvents.length}`,
      `divergences=${profile.divergenceEvents.length}`,
      `transform_windows=${profile.transformationWindows.length}`,
    ];
  }
}
