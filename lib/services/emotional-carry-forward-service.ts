import { EmotionalCarryForwardProfileSchema, type EmotionalCarryForwardProfile } from "@/lib/domain/epic-emotional-gravity";

export class EmotionalCarryForwardService {
  buildCamptiProfile(): EmotionalCarryForwardProfile {
    return EmotionalCarryForwardProfileSchema.parse({
      artifact: "emotional_carry_forward_profile",
      schemaVersion: "1.0.0",
      profileId: "carry-forward-campti-core",
      epicId: "campti-epic",
      chapterToChapterCarry: [
        {
          stateId: "carry-ch1-ch2",
          chapterId: "book1-chapter-01",
          residueSummary: "Protective labor ends with dread that warning literacy is failing.",
          dreadCarry: { weight: 0.76, source: "misread warning cue", transformedByTimeJump: false },
          hopeCarry: { weight: 0.51, source: "kin resilience", transformedByTimeJump: false },
          acheCarry: { weight: 0.69, source: "withheld truth", transformedByTimeJump: false },
          curiosityCarry: { weight: 0.74, source: "unseen route pressure", transformedByTimeJump: false },
          griefCarry: { weight: 0.42, source: "anticipatory loss", transformedByTimeJump: false },
          recognitionCarry: { weight: 0.58, source: "gesture repetition", transformedByTimeJump: false },
        },
      ],
      bookToBookCarry: [
        {
          stateId: "carry-book1-book2",
          chapterId: "book1-ending",
          residueSummary: "Partial survival at identity cost leaves unresolved burden transfer.",
          dreadCarry: { weight: 0.72, source: "inheritance burden", transformedByTimeJump: true },
          hopeCarry: { weight: 0.47, source: "relationship repair possibility", transformedByTimeJump: true },
          acheCarry: { weight: 0.82, source: "trust fracture", transformedByTimeJump: true },
          curiosityCarry: { weight: 0.67, source: "hidden continuity proof", transformedByTimeJump: true },
          griefCarry: { weight: 0.73, source: "permanent losses ledger", transformedByTimeJump: true },
          recognitionCarry: { weight: 0.65, source: "phrase/gesture anchors", transformedByTimeJump: true },
        },
      ],
      eraTransitionCarry: [
        {
          stateId: "carry-era-1650-1960",
          chapterId: "era-transition-1650-1960",
          residueSummary: "Era changes but dread-hope burden braid persists.",
          dreadCarry: { weight: 0.7, source: "pattern repetition fear", transformedByTimeJump: true },
          hopeCarry: { weight: 0.49, source: "divergence windows", transformedByTimeJump: true },
          acheCarry: { weight: 0.78, source: "inheritance silence", transformedByTimeJump: true },
          curiosityCarry: { weight: 0.71, source: "what was lost in retelling", transformedByTimeJump: true },
          griefCarry: { weight: 0.76, source: "cumulative loss across generations", transformedByTimeJump: true },
          recognitionCarry: { weight: 0.68, source: "anchor continuity", transformedByTimeJump: true },
        },
      ],
      unfinishedNeeds: [
        {
          needId: "unfinished-1",
          needStatement: "Need explicit reconciliation between inherited warning and present agency.",
          ownerLine: "line-campti-river-keepers",
          urgency: 0.81,
        },
      ],
      validationFlags: ["chapter-book-era-carry-defined"],
    });
  }

  deriveCarrySummary(profile: EmotionalCarryForwardProfile): string[] {
    return profile.eraTransitionCarry.map(
      (carry) => `${carry.stateId}:dread=${carry.dreadCarry.weight}:hope=${carry.hopeCarry.weight}:ache=${carry.acheCarry.weight}`,
    );
  }
}
