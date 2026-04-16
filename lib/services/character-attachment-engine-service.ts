import {
  CharacterAttachmentProfileSchema,
  ChapterEmotionalGravityPlanSchema,
  SceneEmotionalGravityPlanSchema,
  type CharacterAttachmentProfile,
  type ChapterEmotionalGravityPlan,
  type SceneEmotionalGravityPlan,
} from "@/lib/domain/epic-emotional-gravity";

export class CharacterAttachmentEngineService {
  buildCamptiProfiles(): CharacterAttachmentProfile[] {
    return [
      CharacterAttachmentProfileSchema.parse({
        artifact: "character_attachment_profile",
        schemaVersion: "1.0.0",
        profileId: "attachment-matriarch-keeper",
        epicId: "campti-epic",
        characterId: "natchitoches-matriarch-keeper",
        povWeightingBias: ["prefer close-observation POV when warning literacy is tested"],
        chapterFunctionBias: ["open with protectiveness then expose cost of duty"],
        sceneRoleBias: ["grounding_scene", "relational_scene", "closure_scene"],
        proseConstraintBias: ["high sensory grounding", "low emotional labeling", "body-cost before abstraction"],
        literaryDeviceBias: ["gesture_echo", "waterline_symbol"],
        hookOrchestrationBias: ["attachment-under-threat", "inheritance-risk carry-forward"],
        vulnerabilityExposures: [
          {
            exposureId: "exposure-mk-1",
            characterId: "natchitoches-matriarch-keeper",
            exposureType: "identity_cost",
            visibilityMode: "direct",
            severity: 0.74,
            sceneWindows: ["book1-chapter-01-scene-01", "book1-chapter-01-scene-04"],
          },
        ],
        desireLines: [
          {
            desireLineId: "desire-mk-1",
            characterId: "natchitoches-matriarch-keeper",
            desireStatement: "Keep kinship continuity intact without abandoning younger kin.",
            clarity: 0.88,
            obstructionLevel: 0.71,
            chapterWindows: ["book1-chapter-01", "book1-chapter-02"],
          },
        ],
        fearLines: [
          {
            fearLineId: "fear-mk-1",
            characterId: "natchitoches-matriarch-keeper",
            fearStatement: "If warning patterns are misread, continuity becomes burial work.",
            salience: 0.81,
            activationTriggers: ["river-level anomaly", "kin silence at decision moment"],
            chapterWindows: ["book1-chapter-01", "book1-chapter-03"],
          },
        ],
        contradictionProfile: {
          contradictionId: "contradiction-mk-1",
          characterId: "natchitoches-matriarch-keeper",
          conflictStatement: "Protective silence preserves safety now but creates inheritance fracture later.",
          pressure: 0.83,
          consequenceRisk: "Later generation cannot distinguish warning from fear reflex.",
        },
        bondVector: {
          vectorId: "bond-mk-1",
          characterId: "natchitoches-matriarch-keeper",
          bondModes: ["protectiveness", "respect_admiration", "grief_attachment"],
          desireClarity: 0.88,
          fearPresence: 0.81,
          vulnerabilityExposure: 0.74,
          contradictionPressure: 0.83,
          relationalDependence: 0.79,
          moralIdentityRisk: 0.72,
          attachmentIntensityOverTime: [
            { windowId: "w1", windowLabel: "book1 opening", intensity: 0.62 },
            { windowId: "w2", windowLabel: "fracture window", intensity: 0.84 },
            { windowId: "w3", windowLabel: "legacy echo", intensity: 0.9 },
          ],
          bookEraVariation: [
            {
              eraId: "era-1650",
              dominantBondMode: "protectiveness",
              rationale: "Reader bonds through embodied duty and protective labor.",
            },
            {
              eraId: "era-1960",
              dominantBondMode: "grief_attachment",
              rationale: "Reader bonds through inherited ache and unfinished warning recovery.",
            },
          ],
        },
        validationFlags: ["desire-fear-vulnerability-present"],
      }),
    ];
  }

  buildChapterScenePlan(input: { chapterId: string; sceneIds: string[] }): {
    chapterPlan: ChapterEmotionalGravityPlan;
    scenePlans: SceneEmotionalGravityPlan[];
  } {
    const chapterPlan = ChapterEmotionalGravityPlanSchema.parse({
      chapterId: input.chapterId,
      dominantEmotionalFunction: "attach",
      attachmentFunction: "Bind protectiveness to vulnerability before escalation.",
      consequenceExposureLevel: 0.71,
      relationalRiskLevel: 0.66,
      vulnerabilityWindow: ["opening labor scene", "closure duty scene"],
      fearLinePresence: ["fear-mk-1"],
      desireLinePresence: ["desire-mk-1"],
      irreversibilityPotential: 0.69,
      fateAgencyPressure: 0.61,
      carryForwardWeight: 0.78,
      validationFlags: ["anti_thin_emotion_pass"],
    });

    const scenePlans = input.sceneIds.map((sceneId, index) =>
      SceneEmotionalGravityPlanSchema.parse({
        sceneId,
        dominantEmotionalFunction: index === input.sceneIds.length - 1 ? "carry_forward_pressure" : "attach",
        attachmentFunction: index === 0 ? "Expose need through action before explanation." : "Tighten relational dependency.",
        consequenceExposureLevel: index === 0 ? 0.6 : 0.74,
        relationalRiskLevel: index === 0 ? 0.58 : 0.72,
        vulnerabilityWindow: ["body-strain cue", "silence-after-warning cue"],
        fearLinePresence: ["fear-mk-1"],
        desireLinePresence: ["desire-mk-1"],
        irreversibilityPotential: index === input.sceneIds.length - 1 ? 0.77 : 0.62,
        fateAgencyPressure: index === input.sceneIds.length - 1 ? 0.69 : 0.55,
        carryForwardWeight: index === input.sceneIds.length - 1 ? 0.86 : 0.52,
        validationFlags: ["fear_desire_vulnerability_visible"],
      }),
    );

    return { chapterPlan, scenePlans };
  }

  deriveAttachmentStatus(profiles: CharacterAttachmentProfile[]): string[] {
    return profiles.map(
      (profile) =>
        `${profile.characterId}:bond=${profile.bondVector.bondModes.join("|")}:intensity=${profile.bondVector.attachmentIntensityOverTime.at(-1)?.intensity ?? 0}`,
    );
  }
}
