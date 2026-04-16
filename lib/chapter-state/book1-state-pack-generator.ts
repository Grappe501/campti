import { deriveBeatProfileRecommendation } from "@/lib/chapter-state/chapter-state-to-beat-profile";
import { deriveChapterState, type ChapterStateDerivationInput } from "@/lib/chapter-state/chapter-state-derivation";
import { validateChapterStateSequence } from "@/lib/chapter-state/chapter-state-validation";
import {
  ChapterStateSamplePackSchema,
  type ChapterState,
  type ChapterStateAxisKey,
  type ChapterStateSamplePack,
} from "@/lib/domain/chapter-state";

type AxisScores = Record<ChapterStateAxisKey, number>;

type ChapterSeed = {
  chapter: number;
  progressionPhase: ChapterStateDerivationInput["progressionPhase"];
  timePosition: string;
  seasonPhase: string;
  axisScores: AxisScores;
  axisRationales: Record<ChapterStateAxisKey, string>;
  dominantPressureSummary: string;
  suppressedPressureSummary: string;
  pov: Array<{ characterId: string; weight: number; rationale: string }>;
  activeThreads: Array<{ threadId: string; label: string; strength: number }>;
  threatenedThreads: Array<{ threadId: string; label: string; strength: number }>;
};

function trend(current: number, previous: number | null): "falling" | "flat" | "rising" {
  if (previous === null) return "flat";
  if (current > previous) return "rising";
  if (current < previous) return "falling";
  return "flat";
}

function chapterSeeds(): ChapterSeed[] {
  return [
    {
      chapter: 1,
      progressionPhase: "phase_a",
      timePosition: "early-rain cycle opening",
      seasonPhase: "late-planting",
      axisScores: {
        environmental_stability: 74,
        food_security: 78,
        social_cohesion: 76,
        external_awareness: 31,
        memory_continuity: 86,
        identity_stability: 83,
        labor_pressure: 48,
        signal_integrity: 72,
        decision_pressure: 34,
        movement_pressure: 14,
        relational_heat: 28,
        meaning_load: 26,
      },
      axisRationales: {
        environmental_stability: "River timing still matches household practice, but colder reeds hint at slight drift.",
        food_security: "Stores are presently adequate and redistribution channels still function.",
        social_cohesion: "Kin labor cadence remains aligned under matriarch signals.",
        external_awareness: "Only edge rumors reach this household, with low salience.",
        memory_continuity: "Lineage guidance is trusted as operational truth.",
        identity_stability: "Place, ritual, and role continuity remain intact.",
        labor_pressure: "Workload is heavy but familiar for season stage.",
        signal_integrity: "Most signs remain readable without deep contradiction.",
        decision_pressure: "Most choices are reversible routine adjustments.",
        movement_pressure: "Relocation is not yet cognitively active.",
        relational_heat: "Minor friction remains contained under role clarity.",
        meaning_load: "Meaning remains implicit and woven into routine labor.",
      },
      dominantPressureSummary: "Light labor and environmental vigilance inside continuity.",
      suppressedPressureSummary: "Movement and existential meaning pressure remain suppressed.",
      pov: [
        { characterId: "natchitoches-matriarch-keeper", weight: 0.55, rationale: "Carries continuity interpretation burden." },
        { characterId: "younger-kin-observer", weight: 0.3, rationale: "Registers subtle social and sensory drift." },
        { characterId: "council-runner", weight: 0.15, rationale: "Low but rising external channel access." },
      ],
      activeThreads: [
        { threadId: "lineage-work-rhythm", label: "Lineage work rhythm", strength: 88 },
        { threadId: "river-reading-practice", label: "River reading practice", strength: 81 },
      ],
      threatenedThreads: [{ threadId: "storage-assurance", label: "Storage assurance", strength: 34 }],
    },
    {
      chapter: 2,
      progressionPhase: "phase_b",
      timePosition: "same cycle, weather turn",
      seasonPhase: "late-planting",
      axisScores: {
        environmental_stability: 61,
        food_security: 72,
        social_cohesion: 73,
        external_awareness: 38,
        memory_continuity: 84,
        identity_stability: 80,
        labor_pressure: 54,
        signal_integrity: 58,
        decision_pressure: 41,
        movement_pressure: 19,
        relational_heat: 33,
        meaning_load: 31,
      },
      axisRationales: {
        environmental_stability: "Water and weather cues drift out of seasonal expectations.",
        food_security: "Stores hold, but damp-risk handling consumes buffer.",
        social_cohesion: "Household unity stays strong while uncertainty grows.",
        external_awareness: "Trade-route irregularity and distant rumor become discussable.",
        memory_continuity: "Precedent still guides but needs more checking.",
        identity_stability: "Identity remains stable though vigilance increases.",
        labor_pressure: "Additional protection work increases daily load.",
        signal_integrity: "Signals become noisy and require more comparison.",
        decision_pressure: "Small choices now carry visible opportunity cost.",
        movement_pressure: "Movement remains low but no longer unthinkable.",
        relational_heat: "Caregiving and duty distribution cause minor friction.",
        meaning_load: "Meaning appears as undertone during practical adjustments.",
      },
      dominantPressureSummary: "Signal disturbance and labor increase under still-strong cohesion.",
      suppressedPressureSummary: "Movement remains mostly suppressed.",
      pov: [
        { characterId: "natchitoches-matriarch-keeper", weight: 0.47, rationale: "Continues to arbitrate uncertain signs." },
        { characterId: "storage-keeper-aunt", weight: 0.33, rationale: "Owns food and spoilage decision layer." },
        { characterId: "younger-kin-observer", weight: 0.2, rationale: "Captures emergent ambiguity in social field." },
      ],
      activeThreads: [
        { threadId: "lineage-work-rhythm", label: "Lineage work rhythm", strength: 84 },
        { threadId: "quiet-redistribution-protocol", label: "Quiet redistribution protocol", strength: 69 },
      ],
      threatenedThreads: [{ threadId: "seasonal-readability", label: "Seasonal readability", strength: 41 }],
    },
    {
      chapter: 3,
      progressionPhase: "phase_b",
      timePosition: "after repeated anomalies",
      seasonPhase: "late-planting",
      axisScores: {
        environmental_stability: 55,
        food_security: 68,
        social_cohesion: 67,
        external_awareness: 46,
        memory_continuity: 81,
        identity_stability: 76,
        labor_pressure: 57,
        signal_integrity: 47,
        decision_pressure: 48,
        movement_pressure: 24,
        relational_heat: 41,
        meaning_load: 39,
      },
      axisRationales: {
        environmental_stability: "Repeated deviations suggest non-isolated system drift.",
        food_security: "Ration caution begins despite intact stores.",
        social_cohesion: "Interpretive disagreement appears but remains manageable.",
        external_awareness: "Outside disruptions are now part of household reasoning.",
        memory_continuity: "Memory remains strong but less self-sufficient.",
        identity_stability: "Identity still coherent though unsettled by ambiguity.",
        labor_pressure: "Compensatory work and watch duties stack.",
        signal_integrity: "Signs are increasingly contradictory across locations.",
        decision_pressure: "Deferrals now increase downstream risk.",
        movement_pressure: "Movement remains tentative but cognitively available.",
        relational_heat: "Interpretive differences create interpersonal drag.",
        meaning_load: "Continuity significance starts surfacing under pressure.",
      },
      dominantPressureSummary: "Interpretive instability thickens social and decision load.",
      suppressedPressureSummary: "Full movement logic remains held back.",
      pov: [
        { characterId: "younger-kin-observer", weight: 0.4, rationale: "Best positioned to read cross-household micro-signals." },
        { characterId: "natchitoches-matriarch-keeper", weight: 0.37, rationale: "Maintains continuity authority amid dispute." },
        { characterId: "council-runner", weight: 0.23, rationale: "Carries irregular external pattern reports." },
      ],
      activeThreads: [
        { threadId: "lineage-work-rhythm", label: "Lineage work rhythm", strength: 78 },
        { threadId: "memory-check-protocol", label: "Memory check protocol", strength: 73 },
      ],
      threatenedThreads: [{ threadId: "shared-interpretation", label: "Shared interpretation", strength: 49 }],
    },
    {
      chapter: 4,
      progressionPhase: "phase_c",
      timePosition: "obligation crunch window",
      seasonPhase: "early-storage transition",
      axisScores: {
        environmental_stability: 49,
        food_security: 61,
        social_cohesion: 58,
        external_awareness: 53,
        memory_continuity: 77,
        identity_stability: 69,
        labor_pressure: 66,
        signal_integrity: 43,
        decision_pressure: 57,
        movement_pressure: 31,
        relational_heat: 52,
        meaning_load: 46,
      },
      axisRationales: {
        environmental_stability: "Accumulated anomalies disrupt routine confidence.",
        food_security: "Dependency pressure rises as preservation windows narrow.",
        social_cohesion: "Kin alignment strains under conflicting obligations.",
        external_awareness: "Distant disruptions now influence local scheduling.",
        memory_continuity: "Memory helps but requires adaptation of precedent.",
        identity_stability: "Identity remains present but no longer effortless.",
        labor_pressure: "Timing-sensitive tasks exceed comfortable capacity.",
        signal_integrity: "Contradictory cues reduce confidence in interpretation.",
        decision_pressure: "Delayed decisions now carry visible social cost.",
        movement_pressure: "Movement remains exploratory rather than committed.",
        relational_heat: "Obligation asymmetry drives interpersonal tension.",
        meaning_load: "Meaning begins to attach to duty transfer and role strain.",
      },
      dominantPressureSummary: "Obligation strain and labor bottlenecks reshape chapter cognition.",
      suppressedPressureSummary: "Crossing pressure remains secondary.",
      pov: [
        { characterId: "storage-keeper-aunt", weight: 0.38, rationale: "Decision burden is tied to ration and storage triage." },
        { characterId: "natchitoches-matriarch-keeper", weight: 0.36, rationale: "Must absorb relational strain without rupture." },
        { characterId: "young-caregiver", weight: 0.26, rationale: "Embodies caregiving overload and hidden costs." },
      ],
      activeThreads: [
        { threadId: "obligation-ledger", label: "Obligation ledger", strength: 68 },
        { threadId: "lineage-transfer", label: "Lineage transfer gestures", strength: 63 },
      ],
      threatenedThreads: [{ threadId: "household-harmony", label: "Household harmony", strength: 57 }],
    },
    {
      chapter: 5,
      progressionPhase: "phase_c",
      timePosition: "decision bottleneck",
      seasonPhase: "early-storage transition",
      axisScores: {
        environmental_stability: 44,
        food_security: 55,
        social_cohesion: 54,
        external_awareness: 57,
        memory_continuity: 73,
        identity_stability: 63,
        labor_pressure: 71,
        signal_integrity: 39,
        decision_pressure: 66,
        movement_pressure: 39,
        relational_heat: 57,
        meaning_load: 53,
      },
      axisRationales: {
        environmental_stability: "River behavior no longer maps cleanly to prior cycles.",
        food_security: "Ration risk and dependency concerns are now active.",
        social_cohesion: "Alignment persists but with frequent stress fractures.",
        external_awareness: "Trade disruption and rumor pressure directly alter planning.",
        memory_continuity: "Precedent remains useful but less decisive.",
        identity_stability: "Identity continuity starts requiring deliberate reinforcement.",
        labor_pressure: "Exhaustion risk rises as work windows compress.",
        signal_integrity: "Signal contradiction makes interpretation expensive.",
        decision_pressure: "Choices are harder to reverse and delay is costly.",
        movement_pressure: "Movement alternatives are now openly evaluated.",
        relational_heat: "Fragile alliances require active maintenance.",
        meaning_load: "Continuity meaning grows as consequences become less reversible.",
      },
      dominantPressureSummary: "Decision cost rises and pushes micro-decision-driven chapter flow.",
      suppressedPressureSummary: "Absolute movement remains deferred but no longer marginal.",
      pov: [
        { characterId: "natchitoches-matriarch-keeper", weight: 0.42, rationale: "Carries final decision authority under strain." },
        { characterId: "council-runner", weight: 0.31, rationale: "Brings external uncertainty that shifts reversibility." },
        { characterId: "young-caregiver", weight: 0.27, rationale: "Tracks human cost of delayed decisions." },
      ],
      activeThreads: [
        { threadId: "obligation-ledger", label: "Obligation ledger", strength: 64 },
        { threadId: "decision-scarcity", label: "Decision scarcity awareness", strength: 71 },
      ],
      threatenedThreads: [{ threadId: "storage-assurance", label: "Storage assurance", strength: 62 }],
    },
    {
      chapter: 6,
      progressionPhase: "phase_d",
      timePosition: "fracture recognition onset",
      seasonPhase: "late-storage transition",
      axisScores: {
        environmental_stability: 39,
        food_security: 49,
        social_cohesion: 47,
        external_awareness: 63,
        memory_continuity: 68,
        identity_stability: 54,
        labor_pressure: 74,
        signal_integrity: 35,
        decision_pressure: 71,
        movement_pressure: 52,
        relational_heat: 64,
        meaning_load: 61,
      },
      axisRationales: {
        environmental_stability: "Local conditions show sustained instability.",
        food_security: "Adequacy projections become uncertain under cumulative pressure.",
        social_cohesion: "Cohesion drops as obligation strain becomes visible fracture.",
        external_awareness: "Outsider and route disruption awareness is unavoidable.",
        memory_continuity: "Memory continuity still present but confidence in precedent weakens.",
        identity_stability: "Identity stability weakens as place-role fit strains.",
        labor_pressure: "Overextension becomes chronic rather than seasonal.",
        signal_integrity: "World readability is now near-contradictory.",
        decision_pressure: "Decision urgency reaches high sustained level.",
        movement_pressure: "Movement becomes thinkable and materially discussed.",
        relational_heat: "Emotional and caregiving strain is openly felt.",
        meaning_load: "Meaning intensifies around continuity under threat.",
      },
      dominantPressureSummary: "Fracture is recognized: identity weakens while movement becomes practical.",
      suppressedPressureSummary: "None of the major pressures are fully suppressed now.",
      pov: [
        { characterId: "natchitoches-matriarch-keeper", weight: 0.39, rationale: "Must hold continuity while acknowledging fracture." },
        { characterId: "young-caregiver", weight: 0.33, rationale: "Embodies relational and labor heat." },
        { characterId: "council-runner", weight: 0.28, rationale: "Carries movement-option intelligence." },
      ],
      activeThreads: [
        { threadId: "identity-carryover", label: "Identity carryover practices", strength: 59 },
        { threadId: "decision-scarcity", label: "Decision scarcity awareness", strength: 76 },
      ],
      threatenedThreads: [{ threadId: "household-harmony", label: "Household harmony", strength: 69 }],
    },
    {
      chapter: 7,
      progressionPhase: "phase_e",
      timePosition: "movement imagineability threshold",
      seasonPhase: "late-storage transition",
      axisScores: {
        environmental_stability: 34,
        food_security: 42,
        social_cohesion: 43,
        external_awareness: 69,
        memory_continuity: 64,
        identity_stability: 47,
        labor_pressure: 77,
        signal_integrity: 31,
        decision_pressure: 76,
        movement_pressure: 66,
        relational_heat: 69,
        meaning_load: 68,
      },
      axisRationales: {
        environmental_stability: "Conditions now undermine prior local guarantees.",
        food_security: "Ration and dependency pressure become acute.",
        social_cohesion: "Cohesion is now fragile and requires intentional repair.",
        external_awareness: "External disruptions define local option space.",
        memory_continuity: "Memory becomes selective guidance rather than full map.",
        identity_stability: "Identity continuity is at visible risk.",
        labor_pressure: "Workload and urgency exceed sustainable rhythm.",
        signal_integrity: "Signals are contradictory enough to force strategic bets.",
        decision_pressure: "Choices are difficult and weakly reversible.",
        movement_pressure: "Movement is now imagined as real contingency.",
        relational_heat: "Alliances and caregiving duties are under stress.",
        meaning_load: "Continuity must be carried intentionally, not assumed.",
      },
      dominantPressureSummary: "Adaptation pressure consolidates and movement becomes imaginable.",
      suppressedPressureSummary: "Routine continuity pressures are now secondary.",
      pov: [
        { characterId: "council-runner", weight: 0.36, rationale: "Channels actionable movement intelligence." },
        { characterId: "natchitoches-matriarch-keeper", weight: 0.35, rationale: "Must translate threat into continuity practices." },
        { characterId: "young-caregiver", weight: 0.29, rationale: "Shows human consequences of adaptation choices." },
      ],
      activeThreads: [
        { threadId: "identity-carryover", label: "Identity carryover practices", strength: 63 },
        { threadId: "movement-readiness", label: "Movement readiness", strength: 74 },
      ],
      threatenedThreads: [{ threadId: "fixed-place-assumption", label: "Fixed place assumption", strength: 79 }],
    },
    {
      chapter: 8,
      progressionPhase: "phase_e",
      timePosition: "adaptation consolidation",
      seasonPhase: "pre-crossing threshold",
      axisScores: {
        environmental_stability: 29,
        food_security: 38,
        social_cohesion: 45,
        external_awareness: 74,
        memory_continuity: 61,
        identity_stability: 43,
        labor_pressure: 79,
        signal_integrity: 28,
        decision_pressure: 81,
        movement_pressure: 72,
        relational_heat: 71,
        meaning_load: 73,
      },
      axisRationales: {
        environmental_stability: "Environmental reliability has materially broken.",
        food_security: "Sustained adequacy requires strategic reconfiguration.",
        social_cohesion: "Cohesion is selectively rebuilt around adaptation tasks.",
        external_awareness: "Regional pressure map now governs chapter logic.",
        memory_continuity: "Memory serves as carry-forward filter during transition.",
        identity_stability: "Identity continuity remains threatened but actively stewarded.",
        labor_pressure: "Preparation workload remains near peak.",
        signal_integrity: "Contradictory signs force probabilistic interpretation.",
        decision_pressure: "High urgency with low reversibility defines chapter movement.",
        movement_pressure: "Adaptation consolidates into near-crossing readiness.",
        relational_heat: "Relational strain remains high under concentrated pressure.",
        meaning_load: "Meaning rises to continuity-level significance under transition.",
      },
      dominantPressureSummary: "Adaptation pressure consolidates into crossing preparation logic.",
      suppressedPressureSummary: "Suppression shifts to former stability assumptions.",
      pov: [
        { characterId: "natchitoches-matriarch-keeper", weight: 0.37, rationale: "Coordinates continuity under near-crossing pressure." },
        { characterId: "council-runner", weight: 0.34, rationale: "Provides critical movement intelligence updates." },
        { characterId: "young-caregiver", weight: 0.29, rationale: "Tracks relational and identity carrying costs." },
      ],
      activeThreads: [
        { threadId: "movement-readiness", label: "Movement readiness", strength: 81 },
        { threadId: "identity-carryover", label: "Identity carryover practices", strength: 67 },
      ],
      threatenedThreads: [{ threadId: "place-role-continuity", label: "Place-role continuity", strength: 82 }],
    },
  ];
}

function deriveState(seed: ChapterSeed, previous: ChapterState | null): ChapterState {
  const axisInputs = Object.fromEntries(
    (Object.keys(seed.axisScores) as ChapterStateAxisKey[]).map((axis) => [
      axis,
      {
        score: seed.axisScores[axis],
        direction: trend(seed.axisScores[axis], previous?.stateAxes[axis].score ?? null),
        rationale: seed.axisRationales[axis],
      },
    ]),
  ) as ChapterStateDerivationInput["axisInputs"];

  return deriveChapterState({
    chapterId: `book1-chapter-${String(seed.chapter).padStart(2, "0")}`,
    bookId: "book1",
    sequenceNumber: seed.chapter,
    era: "Natchitoches-centered Red River world, pressure arc toward Campti emergence",
    timePosition: seed.timePosition,
    locationProfile: "Red River settlement network with household-to-council dependency",
    seasonPhase: seed.seasonPhase,
    progressionPhase: seed.progressionPhase,
    povWeightingCandidates: seed.pov,
    axisInputs,
    activeContinuityThreads: seed.activeThreads,
    threatenedContinuityThreads: seed.threatenedThreads,
    sourceBasis: [
      "docs/build/beat-assembly-spec.md",
      "docs/build/book1-core-story-brief.md",
      "docs/build/book1-chapter1-world-sheet.md",
      seed.dominantPressureSummary,
      seed.suppressedPressureSummary,
    ],
  });
}

export function buildBook1ChapterStateSamplePack(): ChapterStateSamplePack {
  const seeds = chapterSeeds();
  const states: ChapterState[] = [];
  for (const seed of seeds) {
    const previous = states.length > 0 ? states[states.length - 1] : null;
    states.push(deriveState(seed, previous));
  }

  const sequenceValidation = validateChapterStateSequence(states);
  if (!sequenceValidation.passesAll) {
    throw new Error(`Book 1 chapter state sequence validation failed: ${sequenceValidation.errors.join("; ")}`);
  }

  const beatProfiles = states.map((state) => deriveBeatProfileRecommendation(state));
  return ChapterStateSamplePackSchema.parse({
    artifact: "book1_chapter_state_sample_pack",
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    bookId: "book1",
    states,
    beatProfiles,
  });
}
