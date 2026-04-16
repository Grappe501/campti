import {
  EscalatingElementSchema,
  MeaningEscalationProfileSchema,
  type MeaningEscalationProfile,
} from "@/lib/domain/epic-narrative-continuity";

export class MeaningEscalationService {
  buildCamptiProfile(): MeaningEscalationProfile {
    return MeaningEscalationProfileSchema.parse({
      artifact: "meaning_escalation_profile",
      schemaVersion: "1.0.0",
      profileId: "campti-meaning-escalation-v1",
      epicId: "campti-epic",
      escalatingElements: [
        EscalatingElementSchema.parse({
          elementId: "escalation-warning-chain",
          elementType: "warning",
          boundAnchorIds: ["anchor-phrase-warning", "anchor-gesture-river-check"],
          escalationStages: [
            {
              stageId: "warning-stage-1",
              stageOrder: 1,
              scale: "chapter",
              stageFunction: "Immediate practical warning.",
              meaningShift: "From routine caution to patterned anomaly signal.",
            },
            {
              stageId: "warning-stage-2",
              stageOrder: 2,
              scale: "book",
              stageFunction: "Pattern recognition across chapters.",
              meaningShift: "From local caution to inherited survival code.",
            },
            {
              stageId: "warning-stage-3",
              stageOrder: 3,
              scale: "epic",
              stageFunction: "Identity-level reinterpretation.",
              meaningShift: "From inherited warning to ethical memory contract.",
            },
          ],
          reframingEvents: [
            {
              reframingEventId: "reframe-warning-book3",
              sourceScale: "book",
              triggerWindow: "book3-mid",
              fromMeaning: "Practical warning for immediate danger.",
              toMeaning: "Encoded continuity strategy against historical erasure.",
            },
          ],
          deepeningPatterns: [
            {
              patternId: "pattern-warning-to-identity-lesson",
              patternLabel: "warning -> pattern -> fate -> identity lesson",
              sequence: ["warning", "pattern", "fate", "identity lesson"],
              expectedReaderGain: "Recognition produces philosophical and emotional weight, not repetition fatigue.",
            },
          ],
        }),
        EscalatingElementSchema.parse({
          elementId: "escalation-river-chain",
          elementType: "river",
          boundAnchorIds: ["anchor-river-witness"],
          escalationStages: [
            {
              stageId: "river-stage-1",
              stageOrder: 1,
              scale: "scene",
              stageFunction: "Livelihood route and practical hazard.",
              meaningShift: "River as immediate place relation.",
            },
            {
              stageId: "river-stage-2",
              stageOrder: 2,
              scale: "book",
              stageFunction: "Route and witness.",
              meaningShift: "River as memory carrier across pressure events.",
            },
            {
              stageId: "river-stage-3",
              stageOrder: 3,
              scale: "series",
              stageFunction: "Judgment and historical witness.",
              meaningShift: "River as moral-historical ledger.",
            },
          ],
          reframingEvents: [],
          deepeningPatterns: [
            {
              patternId: "pattern-river-route-judgment",
              patternLabel: "river -> route -> witness -> memory carrier -> judgment",
              sequence: ["river", "route", "witness", "memory carrier", "judgment"],
              expectedReaderGain: "Setting continuity becomes philosophical continuity.",
            },
          ],
        }),
      ],
      globalEscalationLaws: [
        "Recurrence without altered consequence is invalid.",
        "Each scale jump must increase meaning density or reinterpretive pressure.",
      ],
      validationFlags: ["escalation-cross-scale-covered"],
    });
  }

  deriveEscalationStatus(input: { profile: MeaningEscalationProfile; chapterSequence: number }): string {
    if (input.chapterSequence >= 7) return "late-book-reframing-active";
    if (input.chapterSequence >= 4) return "mid-book-deepening-active";
    return "early-book-seeding-active";
  }
}
