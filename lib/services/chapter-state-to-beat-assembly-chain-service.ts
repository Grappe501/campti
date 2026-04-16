import {
  type BeatAssemblyBeat,
  type BeatAssemblyChain,
  type BeatAssemblyCockpitSummary,
  type BeatType,
  isBeatTransitionAllowed,
} from "@/lib/domain/beat-assembly";
import type { ChapterBeatProfileRecommendation, ChapterState } from "@/lib/domain/chapter-state";
import { Book1BeatAssemblyService } from "@/lib/services/book1-beat-assembly-service";
import { validateBeat } from "@/lib/services/book1-beat-validation-service";

const BASE_ORDER: BeatType[] = [
  "salience_lock_beat",
  "environmental_confirmation_beat",
  "memory_comparison_beat",
  "social_signal_beat",
  "relational_interpretation_beat",
  "emotional_appraisal_beat",
  "micro_decision_beat",
  "pressure_escalation_beat",
  "meaning_trace_beat",
  "consequence_seed_beat",
  "state_update_beat",
];

const TYPE_POOL: BeatType[] = [
  "environmental_confirmation_beat",
  "memory_comparison_beat",
  "social_signal_beat",
  "relational_interpretation_beat",
  "emotional_appraisal_beat",
  "micro_decision_beat",
  "pressure_escalation_beat",
  "meaning_trace_beat",
  "consequence_seed_beat",
];

export type ChapterStateBeatAssemblyFailure = {
  artifact: "chapter_state_beat_assembly_failure";
  chapterId: string;
  chapter: number;
  failureStage: "selection" | "ordering" | "validation";
  reasons: string[];
  actionableNextSteps: string[];
};

export type ChapterStateBeatAssemblyResult =
  | {
      status: "ready";
      chain: BeatAssemblyChain;
      cockpitSummary: BeatAssemblyCockpitSummary;
      preflight: {
        artifact: "chapter_state_beat_preflight";
        chapterId: string;
        orderedBeatTypes: BeatType[];
        dominantPressures: string[];
        suppressedPressures: string[];
      };
    }
  | {
      status: "blocked";
      failure: ChapterStateBeatAssemblyFailure;
    };

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function axis(state: ChapterState, key: keyof ChapterState["stateAxes"]): number {
  return state.stateAxes[key].score / 100;
}

function adjustmentFromState(state: ChapterState): Record<BeatType, number> {
  const environmentalInstability = 1 - axis(state, "environmental_stability");
  const socialStrain = 1 - axis(state, "social_cohesion");
  const decisionPressure = axis(state, "decision_pressure");
  const meaningLoad = axis(state, "meaning_load");
  const movementPressure = axis(state, "movement_pressure");
  const signalNoise = 1 - axis(state, "signal_integrity");

  return {
    salience_lock_beat: 0.18 * environmentalInstability + 0.1 * signalNoise,
    environmental_confirmation_beat: 0.2 * environmentalInstability,
    memory_comparison_beat: 0.16 * signalNoise + 0.08 * axis(state, "memory_continuity"),
    social_signal_beat: 0.16 * socialStrain,
    relational_interpretation_beat: 0.12 * socialStrain + 0.1 * axis(state, "relational_heat"),
    emotional_appraisal_beat: 0.08 * axis(state, "relational_heat") + 0.05 * meaningLoad,
    micro_decision_beat: 0.2 * decisionPressure,
    pressure_escalation_beat: 0.12 * movementPressure + 0.08 * axis(state, "labor_pressure"),
    meaning_trace_beat: meaningLoad >= 0.55 ? 0.16 : 0.02,
    consequence_seed_beat: 0.12 * movementPressure + 0.08 * decisionPressure,
    state_update_beat: 0.14 * decisionPressure + 0.1 * movementPressure,
  };
}

function weightedPick(weights: Record<BeatType, number>, disallow: Set<BeatType>): BeatType {
  let best: BeatType = "emotional_appraisal_beat";
  let bestWeight = -1;
  for (const beatType of TYPE_POOL) {
    if (disallow.has(beatType)) continue;
    const score = weights[beatType];
    if (score > bestWeight) {
      best = beatType;
      bestWeight = score;
    }
  }
  return best;
}

function buildOrderedTypes(state: ChapterState, recommendation: ChapterBeatProfileRecommendation): BeatType[] {
  const recommended = Object.fromEntries(
    recommendation.topWeightedBeatTypes.map((row) => [row.beatType, row.weight]),
  ) as Partial<Record<BeatType, number>>;
  const stateAdjusted = adjustmentFromState(state);
  const scoreCard = Object.fromEntries(
    BASE_ORDER.map((beatType) => [beatType, clamp01((recommended[beatType] ?? 0.06) + stateAdjusted[beatType])]),
  ) as Record<BeatType, number>;

  const body: BeatType[] = [];
  const blocked = new Set<BeatType>();
  const desiredMiddleCount = 8;
  while (body.length < desiredMiddleCount) {
    const chosen = weightedPick(scoreCard, blocked);
    body.push(chosen);
    blocked.add(chosen);
  }

  // Reinforce explicit state-driven selections for high-pressure chapters.
  if (axis(state, "environmental_stability") < 0.45 && !body.includes("environmental_confirmation_beat")) {
    body[0] = "environmental_confirmation_beat";
  }
  if (axis(state, "social_cohesion") < 0.45 && !body.includes("relational_interpretation_beat")) {
    body[1] = "relational_interpretation_beat";
  }
  if (axis(state, "decision_pressure") > 0.62 && !body.includes("micro_decision_beat")) {
    body[body.length - 3] = "micro_decision_beat";
  }
  if (axis(state, "movement_pressure") > 0.58 && !body.includes("consequence_seed_beat")) {
    body[body.length - 2] = "consequence_seed_beat";
  }

  const ordered = ["salience_lock_beat", ...body, "state_update_beat"] as BeatType[];
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (!isBeatTransitionAllowed(previous, current)) {
      const fallback = TYPE_POOL.find(
        (candidate) => isBeatTransitionAllowed(previous, candidate) && (index === ordered.length - 1 || candidate !== "state_update_beat"),
      );
      if (fallback) ordered[index] = fallback;
    }
  }

  if (!ordered.includes("consequence_seed_beat")) {
    ordered[ordered.length - 2] = "consequence_seed_beat";
  }

  return ordered;
}

type BeatBody = {
  beatPurpose: string;
  physicalAction: string;
  environmentalSignal: string;
  sensorySignal: string;
  socialSignal: string;
  interpretedMeaning: string;
  memoryTriggered: string;
  decisionOrAdjustment: string;
  downstreamRisk: string;
  stateUpdate: string;
  salienceReason: string;
  pressureLoadOffset: number;
};

function beatBody(beatType: BeatType): BeatBody {
  const byType: Record<BeatType, BeatBody> = {
    salience_lock_beat: {
      beatPurpose: "Anchor local salience before interpretation.",
      physicalAction: "POV checks active task footing and material contact before speaking.",
      environmentalSignal: "A small place signal sits outside expected daily rhythm.",
      sensorySignal: "Body registers texture and temperature shift against remembered baseline.",
      socialSignal: "Nearby kin pace shifts without explicit alarm language.",
      interpretedMeaning: "Something changed in the lived pattern but remains locally bounded.",
      memoryTriggered: "A lineage memory pattern provides first comparison frame.",
      decisionOrAdjustment: "Hold pace while reallocating attention budget.",
      downstreamRisk: "Missing this signal can distort later chapter decisions.",
      stateUpdate: "Salience funnel narrows around embodied evidence.",
      salienceReason: "Signal is physically encountered and cannot be ignored.",
      pressureLoadOffset: 0.05,
    },
    environmental_confirmation_beat: {
      beatPurpose: "Check if sensed drift is materially real.",
      physicalAction: "POV touches storage, tools, and boundary markers to verify change.",
      environmentalSignal: "A second environmental indicator confirms pressure drift.",
      sensorySignal: "Sound and moisture pattern mismatch previous cycle expectation.",
      socialSignal: "Work partners wait for practical cue, not explanation.",
      interpretedMeaning: "Deviation crosses one-signal threshold and becomes actionable.",
      memoryTriggered: "Past handling pattern for similar readings is recalled.",
      decisionOrAdjustment: "Prioritize containment action over naming.",
      downstreamRisk: "Unverified drift can produce premature or delayed escalation.",
      stateUpdate: "Environmental confidence score is revised downward.",
      salienceReason: "Independent material checks converge.",
      pressureLoadOffset: 0.09,
    },
    memory_comparison_beat: {
      beatPurpose: "Compare present cues against trusted precedent.",
      physicalAction: "POV references remembered practice while maintaining current task.",
      environmentalSignal: "Current signal cluster partially matches prior disruption shape.",
      sensorySignal: "A familiar mismatch returns through smell and touch.",
      socialSignal: "Elders and younger kin silently track the same cue.",
      interpretedMeaning: "Memory offers likely pathways but not certainty.",
      memoryTriggered: "Inherited rule is activated for immediate filtering.",
      decisionOrAdjustment: "Apply precedent in limited scope first.",
      downstreamRisk: "Bad memory match can misdirect chapter pacing.",
      stateUpdate: "Precedent confidence enters active decision stack.",
      salienceReason: "Signal integrity drop requires memory scaffolding.",
      pressureLoadOffset: 0.12,
    },
    social_signal_beat: {
      beatPurpose: "Read social field for hidden pressure routing.",
      physicalAction: "POV tracks gaze, pace, and handwork in nearby kin.",
      environmentalSignal: "Work environment stays ordered while social tempo tightens.",
      sensorySignal: "Speech thins and movement sync shifts by degree.",
      socialSignal: "A relational cue requests leadership interpretation.",
      interpretedMeaning: "Pressure is circulating before being named.",
      memoryTriggered: "Prior social rhythms under strain are remembered.",
      decisionOrAdjustment: "Issue low-visibility directional cue.",
      downstreamRisk: "Misreading relational signal can fracture cohesion.",
      stateUpdate: "Social cue lane becomes part of tactical scan.",
      salienceReason: "Social behavior diverges from routine baseline.",
      pressureLoadOffset: 0.14,
    },
    relational_interpretation_beat: {
      beatPurpose: "Decode relational meaning behind visible behavior.",
      physicalAction: "POV checks role positions and omissions in task choreography.",
      environmentalSignal: "Spatial arrangement reflects subtle duty stress.",
      sensorySignal: "Tension appears in silence duration and avoided eye contact.",
      socialSignal: "Presence/absence in expected role slots changes interpretation.",
      interpretedMeaning: "Relational pressure is active but still containable.",
      memoryTriggered: "Family precedent links this pattern to upcoming obligation strain.",
      decisionOrAdjustment: "Contain interpretation within practical instruction language.",
      downstreamRisk: "Premature naming could trigger defensive conflict.",
      stateUpdate: "Relational heat marker rises one band.",
      salienceReason: "Behavioral pattern implies unspoken pressure transfer.",
      pressureLoadOffset: 0.17,
    },
    emotional_appraisal_beat: {
      beatPurpose: "Convert evidence into bounded emotional stance.",
      physicalAction: "POV regulates breath and cadence before issuing instruction.",
      environmentalSignal: "Local conditions keep delivering low-amplitude strain cues.",
      sensorySignal: "Body tracks load through muscle tension and heat-cold contrast.",
      socialSignal: "Others mirror containment posture from POV.",
      interpretedMeaning: "Composure becomes an operational requirement.",
      memoryTriggered: "Lineage teaching links regulation to group coherence.",
      decisionOrAdjustment: "Prefer action-language over emotional label.",
      downstreamRisk: "Visible dysregulation spreads uncertainty.",
      stateUpdate: "Affect mode fixed to contained pressure handling.",
      salienceReason: "Appraisal is grounded in embodied and social evidence.",
      pressureLoadOffset: 0.19,
    },
    micro_decision_beat: {
      beatPurpose: "Execute a small choice with cumulative impact.",
      physicalAction: "POV reroutes task sequence and resource position.",
      environmentalSignal: "Conditions make delay riskier than local adjustment.",
      sensorySignal: "Weight, dampness, and pace show narrow action window.",
      socialSignal: "Kin compliance indicates temporary coordination bandwidth.",
      interpretedMeaning: "A reversible choice can protect continuity margin.",
      memoryTriggered: "Past success came from early sequence correction.",
      decisionOrAdjustment: "Commit to narrow intervention and monitor result.",
      downstreamRisk: "Wrong micro-decision spends trust and labor capacity.",
      stateUpdate: "Task graph changes and new monitoring lane opens.",
      salienceReason: "Decision pressure exceeds neutral threshold.",
      pressureLoadOffset: 0.22,
    },
    pressure_escalation_beat: {
      beatPurpose: "Increase pressure without spectacle or melodrama.",
      physicalAction: "POV performs boundary measurement and status check.",
      environmentalSignal: "Objective marker confirms rising instability.",
      sensorySignal: "Current, sound, and material resistance all intensify.",
      socialSignal: "Group rhythm shortens and reserve behaviors emerge.",
      interpretedMeaning: "Local strain is now structural, not incidental.",
      memoryTriggered: "Comparable phase in prior cycle ended in forced adaptation.",
      decisionOrAdjustment: "Trigger escalation protocol while preserving calm tone.",
      downstreamRisk: "Late escalation shrinks option space sharply.",
      stateUpdate: "Pressure register moves to high-moderate.",
      salienceReason: "Multi-channel confirmation warrants escalation.",
      pressureLoadOffset: 0.26,
    },
    meaning_trace_beat: {
      beatPurpose: "Carry continuity meaning through concrete action.",
      physicalAction: "POV performs a lineage-linked practical gesture during work.",
      environmentalSignal: "Material response binds present action to inherited pattern.",
      sensorySignal: "Touch memory links current motion to prior teaching.",
      socialSignal: "Witnessed kin uptake confirms shared continuity signal.",
      interpretedMeaning: "Meaning is transmitted through work, not exposition.",
      memoryTriggered: "A remembered instruction contextualizes present duty.",
      decisionOrAdjustment: "Include next-generation witness in core task.",
      downstreamRisk: "Without continuity transfer, later adaptation loses coherence.",
      stateUpdate: "Meaning depth increases while staying observer-bounded.",
      salienceReason: "Continuity pressure intersects concrete labor necessity.",
      pressureLoadOffset: 0.24,
    },
    consequence_seed_beat: {
      beatPurpose: "Leave unresolved but meaningful forward pressure.",
      physicalAction: "POV keeps one readiness option active while reallocating resources.",
      environmentalSignal: "Edge-of-frame signal hints at incoming change.",
      sensorySignal: "Distant sound and air shift imply near-term consequence branch.",
      socialSignal: "Peripheral actors hesitate at threshold, signaling pending contact.",
      interpretedMeaning: "Outcome remains open, but consequence trajectory is active.",
      memoryTriggered: "Earlier warnings began with similar threshold behavior.",
      decisionOrAdjustment: "Prepare quietly for multiple next-step branches.",
      downstreamRisk: "False closure here breaks chapter carry-forward tension.",
      stateUpdate: "Unresolved pull is intentionally preserved into handoff.",
      salienceReason: "Converging cues warrant active readiness posture.",
      pressureLoadOffset: 0.3,
    },
    state_update_beat: {
      beatPurpose: "Commit state deltas required for next scene logic.",
      physicalAction: "POV closes current action loop and communicates updated priorities.",
      environmentalSignal: "Current environment remains unstable but legible enough for planning.",
      sensorySignal: "Body settles into new routine under raised pressure.",
      socialSignal: "Household takes up revised order with constrained confidence.",
      interpretedMeaning: "Chapter ends with updated world-model and unresolved pressure.",
      memoryTriggered: "Memory now stores this phase shift for later comparison.",
      decisionOrAdjustment: "Lock provisional plan and carry unresolved branch forward.",
      downstreamRisk: "Missing state update causes downstream beat incoherence.",
      stateUpdate: "Chapter state handoff packet finalized for next segment.",
      salienceReason: "Transition requires explicit consequence-aware state commit.",
      pressureLoadOffset: 0.28,
    },
  };
  return byType[beatType];
}

function buildBeat(input: {
  chapterState: ChapterState;
  beatType: BeatType;
  sequence: number;
  previousBeat: BeatAssemblyBeat | null;
}): BeatAssemblyBeat {
  const body = beatBody(input.beatType);
  const chapter = input.chapterState.sequenceNumber;
  const pressureSeed = Math.min(
    0.92,
    0.12 + chapter * 0.01 + body.pressureLoadOffset + (input.sequence - 1) * 0.045 + axis(input.chapterState, "decision_pressure") * 0.1,
  );
  const beatDraft: BeatAssemblyBeat = {
    beatId: `B${chapter}-${String(input.sequence).padStart(2, "0")}`,
    beatType: input.beatType,
    beatPurpose: body.beatPurpose,
    povCharacterId: input.chapterState.povWeightingCandidates[0]?.characterId ?? "natchitoches-observer",
    temporalPosition: {
      chapter,
      sequence: input.sequence,
      phaseLabel: input.chapterState.progressionPhase,
      timeOfDay: "work-cycle",
    },
    locationContext: {
      zone: input.chapterState.locationProfile,
      environment: input.chapterState.era,
    },
    physicalAction: body.physicalAction,
    environmentalSignal: body.environmentalSignal,
    sensorySignal: body.sensorySignal,
    socialSignal: body.socialSignal,
    interpretedMeaning: body.interpretedMeaning,
    emotionVector: {
      primary: "contained_pressure",
      valence: -0.15,
      arousal: Math.min(0.9, 0.35 + axis(input.chapterState, "relational_heat") * 0.45),
      socialRisk: Math.min(0.92, 0.2 + axis(input.chapterState, "decision_pressure") * 0.5),
      containment: Math.max(0.45, 0.88 - axis(input.chapterState, "movement_pressure") * 0.32),
    },
    memoryTriggered: body.memoryTriggered,
    decisionOrAdjustment: body.decisionOrAdjustment,
    downstreamRisk: body.downstreamRisk,
    stateUpdate: body.stateUpdate,
    salienceReason: body.salienceReason,
    visibilityScope: {
      locallyKnown: [
        `chapter_mode:${input.chapterState.chapterMode}`,
        `dominant_pressures:${input.chapterState.dominantPressures.slice(0, 2).join("+")}`,
      ],
      globallyKnownButHiddenFromPov: ["regional pressure causes remain outside direct POV access"],
    },
    confidence: clamp01(0.68 + axis(input.chapterState, "memory_continuity") * 0.2),
    pressureLoad: clamp01(pressureSeed),
    validationFlags: {
      physicallyGrounded: true,
      observerBounded: true,
      salienceJustified: true,
      modernCognitionLeakFree: true,
      hasStateConsequence: true,
      chapterOneEscalationSafe: true,
      runtimeBoundarySafe: true,
      notes: [],
    },
  };
  return {
    ...beatDraft,
    validationFlags: validateBeat({ beat: beatDraft, previousBeat: input.previousBeat }),
  };
}

export class ChapterStateToBeatAssemblyChainService {
  private readonly assemblyService = new Book1BeatAssemblyService();

  run(input: {
    chapterState: ChapterState;
    beatProfileRecommendation: ChapterBeatProfileRecommendation;
  }): ChapterStateBeatAssemblyResult {
    const orderedBeatTypes = buildOrderedTypes(input.chapterState, input.beatProfileRecommendation);
    if (orderedBeatTypes.length < 8) {
      return {
        status: "blocked",
        failure: {
          artifact: "chapter_state_beat_assembly_failure",
          chapterId: input.chapterState.chapterId,
          chapter: input.chapterState.sequenceNumber,
          failureStage: "selection",
          reasons: ["State-driven beat ordering did not produce minimum chain length."],
          actionableNextSteps: [
            "Verify chapter-state axis inputs for environmental, social, and decision pressure coverage.",
            "Regenerate beat-profile recommendation before rerunning assembly.",
          ],
        },
      };
    }

    const beats: BeatAssemblyBeat[] = [];
    for (const beatType of orderedBeatTypes) {
      const previousBeat = beats.length > 0 ? beats[beats.length - 1] : null;
      if (previousBeat && !isBeatTransitionAllowed(previousBeat.beatType, beatType)) {
        return {
          status: "blocked",
          failure: {
            artifact: "chapter_state_beat_assembly_failure",
            chapterId: input.chapterState.chapterId,
            chapter: input.chapterState.sequenceNumber,
            failureStage: "ordering",
            reasons: [`Disallowed transition encountered: ${previousBeat.beatType} -> ${beatType}`],
            actionableNextSteps: [
              "Inspect chapter-state transition biases and de-emphasized beat recommendations.",
              "Adjust ordering strategy to satisfy allowed transition matrix.",
            ],
          },
        };
      }
      beats.push(
        buildBeat({
          chapterState: input.chapterState,
          beatType,
          sequence: beats.length + 1,
          previousBeat,
        }),
      );
    }

    const finalized = this.assemblyService.finalizeAssembly({
      chapter: input.chapterState.sequenceNumber,
      beats,
      summaryLine: `State-driven beat assembly for ${input.chapterState.chapterId} in ${input.chapterState.chapterMode}.`,
      sourceArtifacts: [
        "chapter_state_model",
        "chapter_state_beat_profile_recommendation",
        "chapter_state_to_beat_assembly_chain_service",
      ],
    });

    if (!finalized.chain.chainValidation.passed) {
      return {
        status: "blocked",
        failure: {
          artifact: "chapter_state_beat_assembly_failure",
          chapterId: input.chapterState.chapterId,
          chapter: input.chapterState.sequenceNumber,
          failureStage: "validation",
          reasons: finalized.chain.chainValidation.invalidReasons,
          actionableNextSteps: [
            "Review invalid transition and validation flag notes in chainValidation.",
            "Reduce abrupt pressure jumps and reinforce embodied salience grounding.",
          ],
        },
      };
    }

    return {
      status: "ready",
      chain: finalized.chain,
      cockpitSummary: finalized.cockpitSummary,
      preflight: {
        artifact: "chapter_state_beat_preflight",
        chapterId: input.chapterState.chapterId,
        orderedBeatTypes,
        dominantPressures: input.chapterState.dominantPressures,
        suppressedPressures: input.chapterState.suppressedPressures,
      },
    };
  }
}
