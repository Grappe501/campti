import {
  ConsequenceProfileSchema,
  type ConsequenceProfile,
  type IrreversibilityClass,
  type IrreversibilityMarker,
} from "@/lib/domain/epic-emotional-gravity";

export class IrreversibilityConsequenceService {
  buildCamptiProfile(): ConsequenceProfile {
    return ConsequenceProfileSchema.parse({
      artifact: "consequence_profile",
      schemaVersion: "1.0.0",
      profileId: "consequence-campti-core",
      epicId: "campti-epic",
      irreversibilityMarkers: [
        {
          markerId: "irr-1",
          chapterId: "book1-chapter-01",
          sceneId: "book1-chapter-01-scene-04",
          markerType: "trust_damage",
          irreversibilityClass: "emotionally_irreversible",
          shadowStrength: 0.82,
          consequenceShadow: "Silence protects immediate survival while permanently thinning trust bandwidth.",
        },
        {
          markerId: "irr-2",
          chapterId: "book1-chapter-03",
          sceneId: "book1-chapter-03-scene-03",
          markerType: "inheritance_burden",
          irreversibilityClass: "structurally_irreversible",
          shadowStrength: 0.9,
          consequenceShadow: "Untranslated warning burden transfers to younger line.",
        },
      ],
      identityFractureEvents: [
        {
          eventId: "fracture-1",
          characterId: "younger-kin-observer",
          oldIdentityClaim: "I can trust inherited silence as safety.",
          newIdentityConstraint: "Silence now means unresolved danger and missing knowledge.",
          permanence: "emotionally_irreversible",
        },
      ],
      relationshipAlterationEvents: [
        {
          eventId: "rel-alt-1",
          relationshipId: "bond-keeper-younger",
          oldBondState: "instruction-through-proximity",
          newBondState: "instruction-through-withholding",
          repairDifficulty: 0.78,
          permanence: "partially_reversible",
        },
      ],
      lossLedger: [
        {
          entryId: "loss-1",
          lossType: "possibility",
          lossStatement: "Chance to transmit warning in full language closes during first rupture window.",
          accumulationWeight: 0.77,
          carriedBy: ["natchitoches-matriarch-keeper", "younger-kin-observer"],
        },
      ],
      noReturnThresholds: [
        {
          thresholdId: "nrt-1",
          thresholdLabel: "warning-becomes-burden",
          triggerCondition: "Second generation repeats warning without comprehension context.",
          triggeredByMarkerIds: ["irr-2"],
          chapterWindow: "book2-midpoint",
        },
      ],
      permanentChangeRecords: [
        {
          recordId: "perm-1",
          targetKind: "family_line",
          targetId: "line-campti-river-keepers",
          permanentChangeStatement: "Memory transmission switches from explicit teaching to encoded gesture.",
          irreversibleSince: "book1-chapter-03",
        },
      ],
      validationFlags: ["irreversibility-spectrum-covered"],
    });
  }

  classifyMarker(marker: IrreversibilityMarker): IrreversibilityClass {
    if (marker.shadowStrength >= 0.85) return "historically_irreversible";
    if (marker.shadowStrength >= 0.7) return "structurally_irreversible";
    if (marker.shadowStrength >= 0.55) return "emotionally_irreversible";
    if (marker.shadowStrength >= 0.35) return "partially_reversible";
    return "reversible";
  }
}
