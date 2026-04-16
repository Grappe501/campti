import { RelationalStakeProfileSchema, type RelationalStakeProfile } from "@/lib/domain/epic-emotional-gravity";

export class RelationalStakesService {
  buildCamptiProfile(): RelationalStakeProfile {
    return RelationalStakeProfileSchema.parse({
      artifact: "relational_stake_profile",
      schemaVersion: "1.0.0",
      profileId: "relational-campti-core",
      epicId: "campti-epic",
      relationshipBonds: [
        {
          relationshipId: "bond-keeper-younger",
          relationshipType: "parent_child",
          participants: ["natchitoches-matriarch-keeper", "younger-kin-observer"],
          whyItMatters: "Transmission of survival literacy and identity continuity.",
          baselineStrength: 0.86,
        },
        {
          relationshipId: "bond-line-river",
          relationshipType: "place_relationship",
          participants: ["line-campti-river-keepers"],
          whyItMatters: "Place memory acts as emotional witness and relational third body.",
          baselineStrength: 0.81,
        },
      ],
      dependencyLines: [
        {
          dependencyId: "dep-1",
          relationshipId: "bond-keeper-younger",
          dependencyType: "memory",
          asymmetry: 0.72,
          exposureRisk: 0.77,
        },
      ],
      threatenedBonds: [
        {
          threatenedBondId: "threat-1",
          relationshipId: "bond-keeper-younger",
          threatSource: "surveillance pressure + withheld warning",
          threatType: "silence",
          riskLevel: 0.8,
        },
      ],
      unspokenNeeds: [
        {
          needId: "need-1",
          relationshipId: "bond-keeper-younger",
          holderCharacterId: "younger-kin-observer",
          needStatement: "Need to be trusted with full warning context.",
          visibility: "visible_to_reader_not_characters",
        },
      ],
      shameLines: [
        {
          shameLineId: "shame-1",
          relationshipId: "bond-keeper-younger",
          shameSource: "Belief that naming fear proves weakness.",
          suppressionCost: 0.74,
        },
      ],
      obligationLines: [
        {
          obligationId: "obligation-1",
          relationshipId: "bond-keeper-younger",
          obligationStatement: "Protect line continuity even at personal relational cost.",
          burdenWeight: 0.84,
        },
      ],
      breakRisks: [
        {
          relationshipId: "bond-keeper-younger",
          breakRisk: 0.78,
          triggerFactors: ["repeated withholding", "unmet recognition need"],
        },
      ],
      repairDifficulty: [
        {
          relationshipId: "bond-keeper-younger",
          repairDifficulty: 0.73,
          reasons: ["trust fracture", "cross-generation shame reinforcement"],
        },
      ],
      validationFlags: ["relational-stakes-explicit"],
    });
  }

  deriveRelationalMap(profile: RelationalStakeProfile): string[] {
    return profile.relationshipBonds.map(
      (bond) => `${bond.relationshipId}:strength=${bond.baselineStrength}:why=${bond.whyItMatters}`,
    );
  }
}
