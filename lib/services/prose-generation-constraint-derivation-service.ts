import type { BeatAssemblyChain } from "@/lib/domain/beat-assembly";
import type { ChapterState } from "@/lib/domain/chapter-state";
import type { ChapterNarrativePsychology } from "@/lib/domain/narrative-psychology";
import {
  ProseGenerationConstraintsSchema,
  type ProseGenerationConstraints,
} from "@/lib/domain/prose-generation-constraints";
import { NarratorPresenceDerivationService } from "@/lib/services/narrator-presence-derivation-service";
import { NarratorPresenceToProseService } from "@/lib/services/narrator-presence-to-prose-service";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export class ProseGenerationConstraintDerivationService {
  private readonly narratorPresence = new NarratorPresenceDerivationService();

  private readonly narratorToProse = new NarratorPresenceToProseService();

  derive(input: {
    chapterPsychology: ChapterNarrativePsychology;
    chapterState: ChapterState;
    beatChain: BeatAssemblyChain;
    /** When true, narrator→prose merge is deferred to Cluster 3 governance (full narrator pack + ENCS/EEGS). */
    integration?: { deferNarratorToCluster3?: boolean };
  }): ProseGenerationConstraints {
    const topPov = input.chapterState.povWeightingCandidates[0]?.characterId ?? "natchitoches-observer";
    const tension = input.chapterPsychology.axisTargets.unresolved_pull;
    const place = input.chapterPsychology.axisTargets.place_immersion;
    const attachment = input.chapterPsychology.axisTargets.attachment_intensity;
    const signalNoise = 1 - input.chapterState.stateAxes.signal_integrity.score / 100;

    const baseConstraints = ProseGenerationConstraintsSchema.parse({
      artifact: "prose_generation_constraints",
      proseConstraintId: `${input.chapterPsychology.chapterId}-constraints-v1`,
      chapterId: input.chapterPsychology.chapterId,
      parentBeatChainId: input.beatChain.artifact,
      parentChapterStateId: input.chapterState.chapterId,
      parentNarrativePsychologyId: input.chapterPsychology.parentBookId,
      povCharacterId: topPov,
      proseMode: input.chapterPsychology.chapterPsychologyMode,
      narrativeDistance: "close_externalized_embodied",
      cognitionMode: ["native_relational", "place_linked", "labor_linked", "memory_triggered", "signal_interpretive", "continuity_aware"],
      sentencePressureProfile: {
        level: tension >= 0.72 ? "high" : tension >= 0.52 ? "medium" : "low",
        compressionBias: clamp01(0.35 + tension * 0.45),
      },
      sensoryDensityProfile: {
        requiredDensity: place >= 0.75 ? "high" : "medium",
        requiredChannels: ["touch", "sound", "temperature", "material weight"],
      },
      environmentalGroundingFloor: clamp01(0.55 + place * 0.35),
      relationalSignalDensity: clamp01(0.35 + attachment * 0.45),
      memoryInvocationAllowance: clamp01(0.28 + input.chapterState.stateAxes.memory_continuity.score / 200),
      expositionAllowance: clamp01(0.08 + input.chapterPsychology.axisTargets.revelation_pressure * 0.12),
      interpretationAllowance: clamp01(0.24 + signalNoise * 0.25),
      ambiguityAllowance: clamp01(0.35 + input.chapterPsychology.axisTargets.curiosity_tension * 0.34),
      revelationAllowance: clamp01(0.22 + input.chapterPsychology.axisTargets.revelation_pressure * 0.3),
      emotionalLabelAllowance: clamp01(0.06 + attachment * 0.08),
      meaningReflectionAllowance: clamp01(0.12 + input.chapterPsychology.axisTargets.meaning_depth * 0.2),
      lineTensionProfile: {
        target: tension > 0.7 ? "rising" : "steady",
        unresolvedCarryForward: clamp01(0.5 + tension * 0.35),
      },
      paragraphBreathProfile: {
        averageSentences: tension >= 0.7 ? 4 : 5,
        allowedLongParagraphRatio: clamp01(0.2 + input.chapterPsychology.axisTargets.recovery_breathing_room * 0.3),
      },
      cadenceProfile: [
        "Open with action-perception coupling.",
        "Keep interpretive clauses shorter than perception clauses.",
        "Close paragraphs on active adjustment or unresolved implication.",
      ],
      dictionGuardrails: [
        "Favor material, kinship, and labor vocabulary over abstract theorization.",
        "Prefer witnessed behavior to direct emotional labeling.",
      ],
      syntaxGuardrails: [
        "Avoid long explanatory parenthetical chains.",
        "Keep observer-bounded sentence subjects and evidence-linked inferences.",
      ],
      forbiddenPatterns: [
        "modern self-analysis statements",
        "therapist or diagnostic language",
        "omniscient historical exposition",
        "cliffhanger-only closure",
      ],
      requiredPatterns: [
        "material grounding in body/place/work",
        "salience-justified noticing",
        "relational meaning through observed behavior",
        "ending momentum via unresolved meaningful pressure",
      ],
      endingMomentumProfile: {
        vector: input.chapterPsychology.endingVector,
        carryForwardPressureType: input.chapterPsychology.chapterCarryForwardHookType,
      },
      literaryDeviceConstraints: {
        activeDeviceIds: [],
        suppressedDeviceIds: [],
        soundPatternAllowance: "minimal",
        symbolismAllowance: "minimal",
        metaphorSimileAllowance: "guarded",
        explicitnessCeiling: "moderate",
        closurePressureStyle: "state_pressure_seeded",
        callbackPhraseAllowance: false,
        placeMemoryInsertionOpportunities: [],
        repetitionAllowance: "rare_only",
      },
      continuityEmphasis: clamp01(0.4 + input.chapterPsychology.axisTargets.continuity_investment * 0.45),
      placeImmersionTarget: clamp01(0.5 + place * 0.4),
      attachmentTarget: clamp01(0.45 + attachment * 0.4),
      driftFlags: [],
      validationFlags: ["observer_bounded", "native_cognition_first", "beat_fidelity_required"],
    });

    if (input.integration?.deferNarratorToCluster3) {
      return baseConstraints;
    }

    const narratorPack = this.narratorPresence.deriveCamptiPack({
      chapterId: input.chapterPsychology.chapterId,
      chapterSequence: input.chapterState.sequenceNumber ?? 1,
      sceneIds: [],
    });

    return this.narratorToProse.applyToChapterConstraints({
      constraints: baseConstraints,
      modeProfile: narratorPack.chapterPresencePlan.modeProfile,
    });
  }
}
