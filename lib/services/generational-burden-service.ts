import { GenerationalBurdenProfileSchema, type GenerationalBurdenProfile } from "@/lib/domain/epic-emotional-gravity";

export class GenerationalBurdenService {
  buildCamptiProfile(): GenerationalBurdenProfile {
    return GenerationalBurdenProfileSchema.parse({
      artifact: "generational_burden_profile",
      schemaVersion: "1.0.0",
      profileId: "generational-campti-core",
      epicId: "campti-epic",
      inheritedBurdens: [
        {
          burdenId: "burden-warning-silence",
          burdenLabel: "Carry warning without naming source danger openly.",
          knowinglyCarried: true,
          burdenWeight: 0.88,
          mistakenForIdentity: true,
        },
        {
          burdenId: "burden-route-shame",
          burdenLabel: "Believe displacement equals personal failure.",
          knowinglyCarried: false,
          burdenWeight: 0.73,
          mistakenForIdentity: true,
        },
      ],
      inheritedGifts: [
        {
          giftId: "gift-gesture-literacy",
          giftLabel: "Read danger through embodied route gesture.",
          mistakenForBurden: true,
          recoverability: 0.69,
        },
      ],
      transmittedWarnings: [
        {
          warningId: "warning-riverline",
          originalWarning: "When waterline speaks strangely, do not trust routine.",
          currentGenerationVariant: "When routine feels easy, double-check the route.",
          alteredBy: ["historical surveillance pressure", "migration-era retellings"],
        },
      ],
      burdenMutations: [
        {
          mutationId: "mutation-1",
          burdenId: "burden-warning-silence",
          fromForm: "protective silence",
          toForm: "institutional mistrust reflex",
          mutationDriver: "official record conflict with family memory",
        },
      ],
      burdenSilences: [
        {
          silenceId: "silence-1",
          suppressedBurdenId: "burden-route-shame",
          silenceMechanism: "Do not discuss forced movement cost with children.",
          downstreamEffect: "Next generation misreads inherited caution as personal inadequacy.",
        },
      ],
      reclaimedInheritance: [
        {
          reclaimId: "reclaim-1",
          burdenOrGiftId: "gift-gesture-literacy",
          reclamationAction: "Translate encoded gesture into shared language.",
          emotionalCost: "Requires naming old shame and relational injury.",
          transformedOutcome: "Gift restored as collective navigation wisdom.",
        },
      ],
      validationFlags: ["burden-gift-silence-reclamation-covered"],
    });
  }

  deriveBurdenStatus(profile: GenerationalBurdenProfile): string[] {
    return [
      `burdens=${profile.inheritedBurdens.length}`,
      `silences=${profile.burdenSilences.length}`,
      `reclaims=${profile.reclaimedInheritance.length}`,
    ];
  }
}
