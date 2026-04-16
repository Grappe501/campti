import {
  CamptiNarratorPresencePackSchema,
  NarratorIdentityProfileSchema,
  NarratorModeTransitionSchema,
  NarratorPresencePlanSchema,
  type CamptiNarratorPresencePack,
  type NarratorModeProfile,
  type NarratorPresenceLevel,
} from "@/lib/domain/narrator-presence";
import { NarratorConvergenceEngineService } from "@/lib/services/narrator-convergence-engine-service";
import { NarratorEraBridgeService } from "@/lib/services/narrator-era-bridge-service";
import { NarratorPresenceToHookContinuityService } from "@/lib/services/narrator-presence-to-hook-continuity-service";
import { NarratorPresenceToProseService } from "@/lib/services/narrator-presence-to-prose-service";

function eraFromChapterSequence(chapterSequence: number): string {
  if (chapterSequence >= 15) return "era-2026";
  if (chapterSequence >= 9) return "era-1960";
  if (chapterSequence >= 5) return "era-1890";
  return "era-1650";
}

function modeFromStage(stage: CamptiNarratorPresencePack["convergenceProfile"]["currentStage"]): NarratorModeProfile {
  const config: Record<
    CamptiNarratorPresencePack["convergenceProfile"]["currentStage"],
    {
      presence: NarratorPresenceLevel;
      authority: NarratorModeProfile["authorityMode"];
      stake: number;
      certainty: NarratorModeProfile["certaintyMode"];
      knowledge: NarratorModeProfile["knowledgeMode"];
    }
  > = {
    distant_observer: {
      presence: "subtle",
      authority: "archival_inherited",
      stake: 0.25,
      certainty: "admitted_unknown",
      knowledge: "researched",
    },
    lineage_aware_guide: {
      presence: "guiding",
      authority: "lineage_aware",
      stake: 0.36,
      certainty: "provisional",
      knowledge: "inherited",
    },
    emotionally_invested_interpreter: {
      presence: "reflective",
      authority: "interpretive",
      stake: 0.52,
      certainty: "provisional",
      knowledge: "reconstructed",
    },
    family_near_witness: {
      presence: "personal",
      authority: "witness_bearing",
      stake: 0.65,
      certainty: "bounded_certainty",
      knowledge: "witnessed",
    },
    inherited_memory_carrier: {
      presence: "intimate",
      authority: "personal_memory_based",
      stake: 0.76,
      certainty: "memory_fragment",
      knowledge: "remembered",
    },
    threshold_of_self: {
      presence: "intimate",
      authority: "personal_memory_based",
      stake: 0.85,
      certainty: "memory_fragment",
      knowledge: "remembered",
    },
    first_person_presence: {
      presence: "first_person",
      authority: "lived_first_person",
      stake: 0.95,
      certainty: "bounded_certainty",
      knowledge: "lived",
    },
  };

  const selected = config[stage];
  return {
    modeProfileId: `narrator-mode:${stage}`,
    currentPresenceLevel: selected.presence,
    authorityMode: selected.authority,
    emotionalStakeLevel: selected.stake,
    certaintyMode: selected.certainty,
    knowledgeMode: selected.knowledge,
    permittedInterventions: [
      "continuity-anchor framing",
      "bounded reflective guidance where era shift risk is high",
      "hook continuity reinforcement in closure vectors",
    ],
    forbiddenInterventions: [
      "overwrite character-native cognition",
      "flatten era-specific language into modern abstraction",
      "abrupt first-person claim without convergence trigger",
    ],
    proseDistanceEffect: selected.presence === "first_person" ? "first-person lived proximity" : "bounded reflective distance",
    hookContinuityRole: [
      "continuity anchor",
      "meaning carrier",
      "curiosity carrier",
      "emotional bridge",
    ],
    validationFlags: ["narrator-mode-derived"],
  };
}

export class NarratorPresenceDerivationService {
  private readonly convergence = new NarratorConvergenceEngineService();

  private readonly bridges = new NarratorEraBridgeService();

  private readonly hookAdapter = new NarratorPresenceToHookContinuityService();

  private readonly proseAdapter = new NarratorPresenceToProseService();

  deriveCamptiPack(input: {
    chapterId: string;
    chapterSequence: number;
    eraId?: string;
    sceneIds: string[];
  }): CamptiNarratorPresencePack {
    const eraId = input.eraId ?? eraFromChapterSequence(input.chapterSequence);
    const sceneIds = input.sceneIds.length > 0 ? input.sceneIds : [`${input.chapterId}:narrator-default-scene`];
    const convergenceProfile = this.convergence.derive({
      chapterId: input.chapterId,
      chapterSequence: input.chapterSequence,
      eraId,
    });
    const modeProfile = modeFromStage(convergenceProfile.currentStage);
    const chapterPlan = NarratorPresencePlanSchema.parse({
      artifact: "narrator_presence_plan",
      schemaVersion: "1.0.0",
      planId: `${input.chapterId}:chapter-narrator-plan`,
      chapterId: input.chapterId,
      eraId,
      modeProfile,
      distanceProfile: {
        distanceProfileId: `${input.chapterId}:distance`,
        eraId,
        identityNearnessBand: convergenceProfile.currentIdentityNearnessBand,
        temporalDistanceScore: Number((1 - convergenceProfile.convergenceProgressScore).toFixed(3)),
        allowedNarratorRange:
          modeProfile.currentPresenceLevel === "first_person"
            ? ["personal", "intimate", "first_person"]
            : ["subtle", "guiding", "reflective", modeProfile.currentPresenceLevel],
        disallowedNarratorRange: modeProfile.currentPresenceLevel === "first_person" ? ["invisible"] : ["first_person"],
        eraIntegrityGuardrails: [
          "Narrator framing cannot displace era-native cognition.",
          "Reflective commentary must remain evidence-linked.",
        ],
      },
      chapterVisibilityWindow: {
        windowId: `${input.chapterId}:chapter-window`,
        scope: "chapter",
        targetId: input.chapterId,
        plannedPresenceLevel: modeProfile.currentPresenceLevel,
        rationale: "Match narrator visibility to era distance and convergence stage.",
        continuityAnchorIntent: ["anchor-river-witness", "anchor-phrase-warning"],
      },
      sceneVisibilityWindows: sceneIds.map((sceneId, index) => ({
        windowId: `${sceneId}:narrator-window`,
        scope: "scene",
        targetId: sceneId,
        plannedPresenceLevel: index === sceneIds.length - 1 ? modeProfile.currentPresenceLevel : "guiding",
        rationale: index === sceneIds.length - 1 ? "Closure carries unresolved continuity pressure." : "Narrator remains bounded in scene body.",
        continuityAnchorIntent: index === sceneIds.length - 1 ? ["anchor continuity at closure"] : ["orientation-only"],
      })),
      interventionRules: [
        {
          ruleId: "rule-era-bounded-interiority",
          condition: "character interior cognition is active",
          interventionMode: "restrained",
          requiredBounds: ["narrator remains framing voice", "no modern abstraction leakage"],
          forbiddenBounds: ["character-thought overwrite", "omniscient certainty injection"],
        },
        {
          ruleId: "rule-transition-anchor-support",
          condition: "major era transition window detected",
          interventionMode: "bridge",
          requiredBounds: ["explicit continuity anchor cue", "hook continuity reassurance"],
          forbiddenBounds: ["cultural flattening", "ahistorical commentary"],
        },
      ],
      continuityAnchorUse: ["anchor-river-witness", "anchor-phrase-warning", "anchor-family-name-pattern"],
      validationFlags: ["chapter-scene-planning-derived"],
    });
    const scenePresencePlans = chapterPlan.sceneVisibilityWindows.map((window) =>
      NarratorPresencePlanSchema.parse({
        ...chapterPlan,
        planId: `${window.targetId}:scene-narrator-plan`,
        chapterId: input.chapterId,
        chapterVisibilityWindow: window,
        sceneVisibilityWindows: [window],
      }),
    );
    const bridgeProfiles = this.bridges.buildCamptiBridges({ modeProfile });
    const hookContinuityAdapter = this.hookAdapter.deriveAdapter({
      chapterId: input.chapterId,
      modeProfile,
      convergence: convergenceProfile,
    });
    const proseConstraintAdapter = this.proseAdapter.deriveAdapter({
      chapterId: input.chapterId,
      modeProfile,
    });

    return CamptiNarratorPresencePackSchema.parse({
      artifact: "campti_narrator_presence_pack",
      schemaVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      narratorIdentityProfile: NarratorIdentityProfileSchema.parse({
        artifact: "narrator_identity_profile",
        schemaVersion: "1.0.0",
        narratorId: "steve-grappe-narrator-2026",
        narratorName: "Steve Grappe",
        narratorTemporalPosition: "Author-guide anchored around 2026 with increasing lineage immediacy.",
        narratorCulturalPosition: "Arkansas-raised southern male carrying reflective family-line witness posture.",
        narratorVoiceRoot: [
          "southern-attentive witness voice",
          "reflective author-guide cadence",
          "continuity-bearing lineage consciousness",
        ],
        narratorRelationshipToEpic: "Continuity-bearing narrator force guiding one epic identity through era shifts.",
        narratorRelationshipToLineage: "Starts reflective and external, becomes increasingly personally implicated near grandfather/father/self lines.",
        narratorKnowledgeModes: ["researched", "inherited", "reconstructed", "remembered", "witnessed", "lived"],
        narratorAuthorityModes: [
          "archival_inherited",
          "interpretive",
          "witness_bearing",
          "lineage_aware",
          "personal_memory_based",
          "lived_first_person",
        ],
        narratorStakeTrajectory: [
          "low stake in distant historical arcs",
          "rising stake at lineage recognition windows",
          "high stake at father/self threshold",
          "explicit lived stake in first-person arrival",
        ],
        narratorConvergenceTriggers: [
          "approaching grandfather line",
          "approaching father line",
          "approaching self-line",
          "direct memory threshold",
          "direct witness threshold",
        ],
        narratorModeTimeline: [
          "subtle -> guiding -> reflective -> personal -> intimate -> first_person",
          "authority shift from archival/inherited toward lived-first-person",
        ],
        validationFlags: ["identity-profile-formalized"],
      }),
      chapterPresencePlan: chapterPlan,
      scenePresencePlans,
      convergenceProfile,
      eraBridgeProfiles: bridgeProfiles,
      modeTransitions: [
        NarratorModeTransitionSchema.parse({
          artifact: "narrator_mode_transition",
          transitionId: "transition-grandfather-to-father-line",
          fromChapterId: "book1-ch08",
          toChapterId: "book1-ch12",
          fromPresenceLevel: "reflective",
          toPresenceLevel: "personal",
          requiredTriggerIds: ["trigger-grandfather-line", "trigger-father-line"],
          transitionRationale: "Lineage nearness rises and narrator gains witness-bearing authority.",
          smoothnessScore: 0.81,
        }),
        NarratorModeTransitionSchema.parse({
          artifact: "narrator_mode_transition",
          transitionId: "transition-threshold-to-first-person",
          fromChapterId: "book1-ch15",
          toChapterId: "book1-ch18",
          fromPresenceLevel: "intimate",
          toPresenceLevel: "first_person",
          requiredTriggerIds: ["trigger-self-threshold"],
          transitionRationale: "Direct identity-line witness threshold permits explicit first-person stance.",
          smoothnessScore: 0.78,
        }),
      ],
      hookContinuityAdapter,
      proseConstraintAdapter,
      downstreamIntegration: {
        artifact: "narrator_downstream_integration_map",
        chapterId: input.chapterId,
        encs: [
          "narrator anchor continuity contributes to transition anti-dislocation rules",
          "narrator hook continuity adapter augments book and temporal hook declarations",
        ],
        eegs: [
          "narrator stake trajectory aligns with emotional carry-forward pressure",
          "narrator nearness raises attachment continuity at family-near stages",
        ],
        hcel: [
          "narrator preserves attachment curiosity and unresolved pressure across boundary windows",
          "narrator bridge signals become hook continuity reassurance lines",
        ],
        narrativePsychology: [
          "narrator mode constrains reflective allowance by chapter psychology mode",
          "narrator interventions remain bounded by observer integrity",
        ],
        chapterComposition: ["chapter closure requires narrator continuity anchor cue in risky transitions"],
        sequenceArchitecture: ["sequence convergence windows include narrator stage progression checkpoints"],
        sceneGeneration: ["scene packets inherit narrator-bounded prose constraints and boundary rules"],
        proseConstraints: ["narrator mode maps directly into narrative distance and reflection allowances"],
        literaryDeviceAllowances: ["narrator presence allows continuity-bearing motifs, suppresses ornamental omniscience"],
        povBoundaryRules: ["narrator framing and character cognition lanes remain distinct and validated"],
      },
      cockpitSummary: {
        artifact: "narrator_cockpit_summary",
        chapterId: input.chapterId,
        currentNarratorPresenceLevel: modeProfile.currentPresenceLevel,
        narratorAuthorityMode: modeProfile.authorityMode,
        narratorKnowledgeMode: modeProfile.knowledgeMode,
        convergenceStage: convergenceProfile.currentStage,
        upcomingConvergenceTriggers: convergenceProfile.upcomingTriggers.map((row) => row.triggerType),
        narratorHookContinuityContribution: hookContinuityAdapter.narratorHookContinuityContribution,
        narratorCharacterBoundaryWarnings: [],
        temporalBridgeStatus: this.bridges.deriveBridgeStatus(bridgeProfiles),
        firstPersonReadinessStatus: convergenceProfile.firstPersonReadiness.ready
          ? "ready-for-first-person-when-triggered"
          : "not-yet-ready",
        voiceShiftRisks:
          modeProfile.currentPresenceLevel === "first_person"
            ? []
            : ["avoid abrupt first-person jump without trigger chain"],
      },
      diagnostics: {
        narratorContinuityStrength: Number(
          ((convergenceProfile.convergenceProgressScore + hookContinuityAdapter.narratorHookContinuityContribution) / 2).toFixed(3),
        ),
        risks: modeProfile.currentPresenceLevel === "invisible" ? ["narrator-presence-underpowered-for-transition-risk"] : [],
        protections: [
          "mode transitions are explicit and trigger-bound",
          "era bridges enforce distance-without-dislocation",
          "narrator-character boundary rules are formalized",
        ],
        deferredItems: [],
      },
    });
  }
}
