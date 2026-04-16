import {
  FractureEventSchema,
  IdentityPersistenceProfileSchema,
  PersistenceTraitSchema,
  type IdentityPersistenceProfile,
} from "@/lib/domain/epic-narrative-continuity";

export class IdentityPersistenceService {
  buildCamptiProfile(): IdentityPersistenceProfile {
    const traits = [
      PersistenceTraitSchema.parse({
        traitId: "trait-warning-inheritance",
        traitLabel: "Warning inheritance through gesture and phrase",
        continuityKind: "warning_inheritance",
        retainedStrength: 0.86,
        distortionRisk: 0.28,
        evidenceAnchors: ["anchor-phrase-warning", "anchor-gesture-river-check"],
      }),
      PersistenceTraitSchema.parse({
        traitId: "trait-route-familiarity",
        traitLabel: "Route familiarity as survival intelligence",
        continuityKind: "route_familiarity",
        retainedStrength: 0.79,
        distortionRisk: 0.4,
        evidenceAnchors: ["anchor-river-witness", "anchor-gesture-river-check"],
      }),
      PersistenceTraitSchema.parse({
        traitId: "trait-lineage-memory",
        traitLabel: "Fragmented but recoverable lineage memory",
        continuityKind: "family_memory",
        retainedStrength: 0.63,
        distortionRisk: 0.61,
        evidenceAnchors: ["anchor-family-name-pattern"],
      }),
      PersistenceTraitSchema.parse({
        traitId: "trait-relational-duty",
        traitLabel: "Relational duty under pressure",
        continuityKind: "relational_pattern",
        retainedStrength: 0.82,
        distortionRisk: 0.33,
        evidenceAnchors: ["anchor-gesture-river-check", "anchor-phrase-warning"],
      }),
    ];

    return IdentityPersistenceProfileSchema.parse({
      artifact: "identity_persistence_profile",
      schemaVersion: "1.0.0",
      profileId: "campti-identity-profile-v1",
      epicId: "campti-epic",
      identityCore: "Continuity duty through adaptive practice and inherited warning literacy.",
      persistenceTraits: traits,
      fractureEvents: [
        FractureEventSchema.parse({
          fractureEventId: "fracture-colonial-reclassification",
          eraId: "era-colonial-transform",
          trigger: "External classification systems overwrite local identity structures.",
          fracturedTraitIds: ["trait-lineage-memory"],
          downstreamMisreadRisk: "Later generations read inherited fragments as superstition rather than continuity data.",
          potentialRecoveryPath: "Rebind phrase and naming fragments to place/route archives.",
        }),
      ],
      retentionLines: [
        {
          lineId: "retention-warning-1",
          traitId: "trait-warning-inheritance",
          eraWindows: ["era-1650", "era-colonial-transform", "era-1960"],
          rationale: "Warnings survive as flexible forms even when institutions change.",
        },
      ],
      forgottenLines: [
        {
          lineId: "forgotten-lineage-1",
          traitId: "trait-lineage-memory",
          eraWindows: ["era-colonial-transform"],
          rationale: "Naming continuity partially collapses during forced record translation.",
        },
      ],
      recoveredLines: [
        {
          lineId: "recovered-lineage-1",
          traitId: "trait-lineage-memory",
          eraWindows: ["era-1960"],
          rationale: "Lineage fragment becomes recoverable when phrase+record patterns converge.",
        },
      ],
      validationFlags: ["identity-core-recognizable", "fracture-recovery-modeled"],
    });
  }

  derivePersistenceStatus(input: { profile: IdentityPersistenceProfile }): string {
    const retained = input.profile.persistenceTraits.reduce((acc, row) => acc + row.retainedStrength, 0);
    const avg = retained / Math.max(1, input.profile.persistenceTraits.length);
    if (avg >= 0.8) return "stable_adaptive_continuity";
    if (avg >= 0.6) return "strained_but_persistent";
    return "at_risk_fragmentation";
  }
}
