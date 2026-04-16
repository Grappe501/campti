import {
  BEAT_ALLOWED_TRANSITIONS,
  BEAT_DISALLOWED_TRANSITIONS,
  BeatAssemblyChainSchema,
  BeatAssemblyCockpitSummarySchema,
  type BeatAssemblyBeat,
  type BeatAssemblyChain,
  type BeatAssemblyCockpitSummary,
  type BeatType,
} from "@/lib/domain/beat-assembly";
import { validateBeat, validateBeatChain } from "@/lib/services/book1-beat-validation-service";

type BeatSeed = Omit<BeatAssemblyBeat, "validationFlags">;

function makeBeat(beat: BeatSeed, previousBeat: BeatAssemblyBeat | null): BeatAssemblyBeat {
  const draft = { ...beat, validationFlags: {
    physicallyGrounded: true,
    observerBounded: true,
    salienceJustified: true,
    modernCognitionLeakFree: true,
    hasStateConsequence: true,
    chapterOneEscalationSafe: true,
    runtimeBoundarySafe: true,
    notes: [],
  } };
  return {
    ...draft,
    validationFlags: validateBeat({ beat: draft, previousBeat }),
  };
}

function buildArtifactId(chapter: number): string {
  return `book1_chapter${String(chapter).padStart(2, "0")}_beat_assembly_chain`;
}

function chapter1Beats(): BeatSeed[] {
  return [
    {
      beatId: "B1-01",
      beatType: "salience_lock_beat",
      beatPurpose: "Open in work rhythm before explanation.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 1, phaseLabel: "pre-dawn_work_start", timeOfDay: "pre-dawn" },
      locationContext: { zone: "riverbank-work-yard", environment: "Red River edge under low mist" },
      physicalAction: "She lifts wet reed bundles to the split-log rack and checks binding tension by hand.",
      environmentalSignal: "The river current sounds heavier than yesterday against mud roots.",
      sensorySignal: "Palm feels a colder slickness on the reed skin than seasonal norm.",
      socialSignal: "No verbal exchange yet; household movement remains coordinated and quiet.",
      interpretedMeaning: "Water temperament may be shifting earlier than expected.",
      emotionVector: { primary: "contained_watchfulness", valence: -0.1, arousal: 0.42, socialRisk: 0.2, containment: 0.82 },
      memoryTriggered: "Grandmother taught that reed feel changes before visible river trouble.",
      decisionOrAdjustment: "She delays stacking the final bundle and re-checks knot spacing.",
      downstreamRisk: "If signal is ignored, stored reeds could spoil and labor plan could collapse.",
      stateUpdate: "Attention budget narrows to water-linked materials.",
      salienceReason: "Body contact with tool material confirms a pattern deviation.",
      visibilityScope: {
        locallyKnown: ["reed texture off-season", "work rhythm intact but cautious"],
        globallyKnownButHiddenFromPov: ["upstream sediment shift has already started"],
      },
      confidence: 0.78,
      pressureLoad: 0.28,
    },
    {
      beatId: "B1-02",
      beatType: "environmental_confirmation_beat",
      beatPurpose: "Confirm slight wrongness through external check.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 2, phaseLabel: "work_continuation", timeOfDay: "pre-dawn" },
      locationContext: { zone: "storage-edge", environment: "Raised basket platform near embers" },
      physicalAction: "She opens a covered grain basket and presses fingers into top layer for damp trace.",
      environmentalSignal: "Clay lid underside carries unexpected condensed moisture.",
      sensorySignal: "Smell of stored maize carries a sour edge not present in prior cycle.",
      socialSignal: "Nearby younger worker pauses, waiting for her nonverbal cue.",
      interpretedMeaning: "Moisture variance is not isolated to riverbank reeds.",
      emotionVector: { primary: "guarded_concern", valence: -0.2, arousal: 0.47, socialRisk: 0.24, containment: 0.78 },
      memoryTriggered: "Last flood-season spoil began with lid condensation before visible spoilage.",
      decisionOrAdjustment: "She marks this basket for immediate rotation to higher shelf.",
      downstreamRisk: "Food loss risk increases if damp spread is left unmanaged.",
      stateUpdate: "Material-risk tracker in working memory escalates from low to moderate.",
      salienceReason: "Two independent material systems now show aligned deviation.",
      visibilityScope: {
        locallyKnown: ["grain moisture anomaly", "needs quiet redistribution"],
        globallyKnownButHiddenFromPov: ["regional weather pressure fronts are unstable"],
      },
      confidence: 0.8,
      pressureLoad: 0.34,
    },
    {
      beatId: "B1-03",
      beatType: "memory_comparison_beat",
      beatPurpose: "Compare present signals against matrilineal memory pattern.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 3, phaseLabel: "lineage_reference", timeOfDay: "pre-dawn" },
      locationContext: { zone: "work-yard threshold", environment: "between firelight and river mist" },
      physicalAction: "She touches the notch-cut tally stick kept in wrapped cloth near the hearth post.",
      environmentalSignal: "Mist thickness sits lower and clings longer than expected for this moon phase.",
      sensorySignal: "Smoke pulls sideways instead of straight up when she loosens the wrap.",
      socialSignal: "Elder sister watches but does not interrupt the lineage check.",
      interpretedMeaning: "Current signs match the opening stage of an old disruption sequence.",
      emotionVector: { primary: "ancestral_alertness", valence: -0.15, arousal: 0.51, socialRisk: 0.28, containment: 0.75 },
      memoryTriggered: "Mother's rule: when smoke leans and reeds chill, move stores before dawn meal.",
      decisionOrAdjustment: "She prepares to re-sequence morning tasks before public discussion.",
      downstreamRisk: "Delay could force visible shortage and weaken household credibility.",
      stateUpdate: "Lineage memory promoted from background to active directive.",
      salienceReason: "Inherited rule matches present signal cluster with high fidelity.",
      visibilityScope: {
        locallyKnown: ["lineage protocol likely applicable now"],
        globallyKnownButHiddenFromPov: ["multiple settlements upriver report similar shifts"],
      },
      confidence: 0.83,
      pressureLoad: 0.39,
    },
    {
      beatId: "B1-04",
      beatType: "social_signal_beat",
      beatPurpose: "Read another person’s behavior for social temperature.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 4, phaseLabel: "kinship_scan", timeOfDay: "first-light edge" },
      locationContext: { zone: "courtyard path", environment: "between storage racks and cooking pit" },
      physicalAction: "She tracks her niece's carrying pace and hand placement while passing water jars.",
      environmentalSignal: "Jar rims show tiny silt crescents from the latest draw.",
      sensorySignal: "Footfall rhythm is faster than normal even before formal call to urgency.",
      socialSignal: "Niece avoids direct eye hold, signaling she has noticed change but waits for sanction.",
      interpretedMeaning: "Household already senses tension and is awaiting continuity authority.",
      emotionVector: { primary: "protective_focus", valence: -0.05, arousal: 0.54, socialRisk: 0.33, containment: 0.71 },
      memoryTriggered: "As a girl she learned to read lowered eyes as request for safe direction.",
      decisionOrAdjustment: "She gives a small wrist signal to redirect jars toward inner platform.",
      downstreamRisk: "Misread social cue could cause public mismatch and loss of confidence.",
      stateUpdate: "Social feedback loop activated: micro-cues now steer task routing.",
      salienceReason: "Labor posture and gaze confirm distributed awareness before speech.",
      visibilityScope: {
        locallyKnown: ["niece seeks sanctioned adjustment"],
        globallyKnownButHiddenFromPov: ["adjacent households are making similar silent reroutes"],
      },
      confidence: 0.79,
      pressureLoad: 0.43,
    },
    {
      beatId: "B1-05",
      beatType: "relational_interpretation_beat",
      beatPurpose: "Interpret absence/presence within kinship structure.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 5, phaseLabel: "absence_read", timeOfDay: "first-light edge" },
      locationContext: { zone: "canoe landing path", environment: "reed-shadow beside mooring stakes" },
      physicalAction: "She counts tied canoes and checks which paddle rack remains untouched.",
      environmentalSignal: "One mooring line is damp but unstressed, showing recent check without departure.",
      sensorySignal: "Fresh mud compression indicates someone stood and waited rather than launched.",
      socialSignal: "Her sister's son is absent from the usual pre-dawn watch position.",
      interpretedMeaning: "The absence is likely controlled waiting, not neglect.",
      emotionVector: { primary: "measured_suspicion", valence: -0.12, arousal: 0.58, socialRisk: 0.41, containment: 0.69 },
      memoryTriggered: "Prior council mornings used staged absences to test readiness signals.",
      decisionOrAdjustment: "She withholds verbal concern and continues routing tasks to avoid alarm.",
      downstreamRisk: "Premature naming of concern could fracture trust before facts settle.",
      stateUpdate: "Absence logged as relational pressure marker, not immediate threat.",
      salienceReason: "Deviation is social-structural and tied to duty positions.",
      visibilityScope: {
        locallyKnown: ["watch position gap", "canoe not launched"],
        globallyKnownButHiddenFromPov: ["a separate kin branch has sent a quiet warning runner"],
      },
      confidence: 0.74,
      pressureLoad: 0.49,
    },
    {
      beatId: "B1-06",
      beatType: "emotional_appraisal_beat",
      beatPurpose: "Convert signal cluster into bounded emotional stance.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 6, phaseLabel: "appraisal_lock", timeOfDay: "first-light edge" },
      locationContext: { zone: "hearth-center", environment: "household core under controlled fire" },
      physicalAction: "She resets fire spacing and steadies breath before issuing any spoken direction.",
      environmentalSignal: "Flame draws unevenly as outside air pressure shifts through doorway reeds.",
      sensorySignal: "Heat and cold alternate across forearms while she works the coals.",
      socialSignal: "Two younger women mirror her pace, waiting for tone-setting cue.",
      interpretedMeaning: "Situation demands composure display to hold group coherence.",
      emotionVector: { primary: "contained_strain", valence: -0.18, arousal: 0.61, socialRisk: 0.45, containment: 0.83 },
      memoryTriggered: "Line mother taught: breath must settle before instruction, or fear spreads.",
      decisionOrAdjustment: "She chooses a low voice and task language over warning language.",
      downstreamRisk: "Visible fear from continuity carrier would amplify disorder.",
      stateUpdate: "Emotional mode set to controlled command through action cadence.",
      salienceReason: "Appraisal emerges from clustered signals plus role duty, not abstract naming.",
      visibilityScope: {
        locallyKnown: ["composure is now tactical requirement"],
        globallyKnownButHiddenFromPov: ["pressure system likely exceeds this household alone"],
      },
      confidence: 0.81,
      pressureLoad: 0.56,
    },
    {
      beatId: "B1-07",
      beatType: "micro_decision_beat",
      beatPurpose: "Execute a small choice with delayed structural impact.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 7, phaseLabel: "quiet_reroute", timeOfDay: "dawn-approach" },
      locationContext: { zone: "inner storage lane", environment: "between dry shelf and river-facing bins" },
      physicalAction: "She swaps two storage markers and assigns girls to carry bundles inland first.",
      environmentalSignal: "Outer shelf boards sweat with moisture while inner shelf remains dry.",
      sensorySignal: "Weight shift in bundles indicates water uptake has already begun.",
      socialSignal: "A cousin raises an eyebrow but follows without verbal challenge.",
      interpretedMeaning: "Minor reorder can preserve stores and avoid public alarm.",
      emotionVector: { primary: "decisive_caution", valence: -0.08, arousal: 0.63, socialRisk: 0.47, containment: 0.77 },
      memoryTriggered: "Her aunt once avoided loss by changing sequence before naming danger.",
      decisionOrAdjustment: "She marks the change as routine labor correction.",
      downstreamRisk: "If wrong, she spends political credit on unnecessary disruption.",
      stateUpdate: "Task graph altered: vulnerable stores now move to protected zone first.",
      salienceReason: "Material pressure and social compliance window align briefly.",
      visibilityScope: {
        locallyKnown: ["storage order changed under authority signal"],
        globallyKnownButHiddenFromPov: ["this reroute will intersect with later displacement choices"],
      },
      confidence: 0.77,
      pressureLoad: 0.61,
    },
    {
      beatId: "B1-08",
      beatType: "pressure_escalation_beat",
      beatPurpose: "Thicken pressure without spectacle.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 8, phaseLabel: "order_under_strain", timeOfDay: "dawn-approach" },
      locationContext: { zone: "river-facing work edge", environment: "mist lifting over red-bank current" },
      physicalAction: "She steps to boundary posts and measures waterline against carved notch marks.",
      environmentalSignal: "Waterline sits one finger above expected notch before sunrise.",
      sensorySignal: "Current drag tugs at test reed faster than normal pace.",
      socialSignal: "Work songs stay low and shorter; no one starts full morning verse.",
      interpretedMeaning: "Pressure is no longer isolated; it is entering communal rhythm.",
      emotionVector: { primary: "compressed_urgency", valence: -0.24, arousal: 0.69, socialRisk: 0.52, containment: 0.72 },
      memoryTriggered: "Older flood-year memory begins at same notch mismatch.",
      decisionOrAdjustment: "She signals one runner to fetch elder aunt before council light.",
      downstreamRisk: "Late kin consultation would reduce coordination bandwidth.",
      stateUpdate: "Pressure register increments to high-moderate and triggers kin escalation protocol.",
      salienceReason: "Objective boundary mark confirms earlier inferred pattern.",
      visibilityScope: {
        locallyKnown: ["waterline mismatch verified"],
        globallyKnownButHiddenFromPov: ["regional pressure trend will persist across seasons"],
      },
      confidence: 0.86,
      pressureLoad: 0.68,
    },
    {
      beatId: "B1-09",
      beatType: "meaning_trace_beat",
      beatPurpose: "Surface continuity meaning without abstract monologue.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 9, phaseLabel: "continuity_trace", timeOfDay: "dawn-approach" },
      locationContext: { zone: "lineage-hearth post", environment: "house-center where names are kept" },
      physicalAction: "She knots a fresh fiber on the lineage cord before handing a bundle to her niece.",
      environmentalSignal: "Moisture darkens the new knot immediately, binding old and new fibers.",
      sensorySignal: "Fiber bite in fingers mirrors old scar from her mother's teaching knot.",
      socialSignal: "Niece receives knot-hand without question, acknowledging line duty.",
      interpretedMeaning: "Continuity is carried through repeated acts under pressure, not declarations.",
      emotionVector: { primary: "solemn_resolve", valence: -0.04, arousal: 0.6, socialRisk: 0.49, containment: 0.86 },
      memoryTriggered: "She recalls first knot lesson: line survives by work done in season.",
      decisionOrAdjustment: "She includes niece in critical storage route for witness training.",
      downstreamRisk: "If continuity labor is not transmitted now, later rupture costs increase.",
      stateUpdate: "Meaning trace enters shared memory: duty transfer enacted through action.",
      salienceReason: "Kinship ritual intersects immediate logistics need.",
      visibilityScope: {
        locallyKnown: ["lineage duty passed through work gesture"],
        globallyKnownButHiddenFromPov: ["future Campti reformation will depend on this continuity logic"],
      },
      confidence: 0.82,
      pressureLoad: 0.7,
    },
    {
      beatId: "B1-10",
      beatType: "consequence_seed_beat",
      beatPurpose: "Leave active end-state thread for next chapter movement.",
      povCharacterId: "natchitoches-matriarch-keeper",
      temporalPosition: { chapter: 1, sequence: 10, phaseLabel: "chapter_exit_seed", timeOfDay: "first light" },
      locationContext: { zone: "upper path lookout", environment: "path toward council crossing" },
      physicalAction: "She dispatches two loads inland and keeps one canoe unlaunched for sudden recall.",
      environmentalSignal: "Upstream bird line breaks formation and drops toward inner trees.",
      sensorySignal: "Air carries distant paddle taps from unseen bend before official call.",
      socialSignal: "Messenger silhouette appears but stops short of entering household space.",
      interpretedMeaning: "External contact pressure is arriving, but response window still exists.",
      emotionVector: { primary: "held_readiness", valence: -0.14, arousal: 0.74, socialRisk: 0.59, containment: 0.79 },
      memoryTriggered: "Past warning arrivals started with halted messenger posture at edge.",
      decisionOrAdjustment: "She orders food to travel-ready portions without announcing reason.",
      downstreamRisk: "A wrong call could expose resources or miss safe movement window.",
      stateUpdate: "Chapter closes with unresolved operational branch now active.",
      salienceReason: "Converging environmental and social edges indicate near-term shift.",
      visibilityScope: {
        locallyKnown: ["contact signal imminent", "mobility prep started quietly"],
        globallyKnownButHiddenFromPov: ["displacement arc has already begun beyond visible horizon"],
      },
      confidence: 0.84,
      pressureLoad: 0.76,
    },
  ];
}

export class Book1BeatAssemblyService {
  finalizeAssembly(input: {
    chapter: number;
    beats: BeatAssemblyBeat[];
    summaryLine: string;
    sourceArtifacts: string[];
  }): {
    chain: BeatAssemblyChain;
    cockpitSummary: BeatAssemblyCockpitSummary;
  } {
    const chainDraft: BeatAssemblyChain = {
      artifact: buildArtifactId(input.chapter),
      schemaVersion: "1.0.0",
      chapter: input.chapter,
      generatedAt: new Date().toISOString(),
      worldviewFrame: {
        storyLocale: "Natchitoches-centered Red River settlements",
        eraWindow: "1650-ish pre-colonial pressure horizon",
        cognitionTranslationMode: "native_cognition_first_translated_to_english",
        runtimeBoundary: "metaphysical_and_cosmic_drivers_fenced_off",
      },
      transitionRules: {
        allowed: BEAT_ALLOWED_TRANSITIONS,
        disallowed: BEAT_DISALLOWED_TRANSITIONS,
      },
      beats: input.beats,
      chainValidation: {
        passed: true,
        invalidReasons: [],
      },
      provenance: {
        sourceArtifacts: input.sourceArtifacts,
      },
    };

    const chainValidation = validateBeatChain(chainDraft);
    const chain = BeatAssemblyChainSchema.parse({
      ...chainDraft,
      chainValidation,
    });

    const observerBoundaryIncidents = chain.beats.filter((beat) => !beat.validationFlags.observerBounded).length;
    const memoryLinkedBeats = chain.beats.filter((beat) => beat.memoryTriggered.trim().length > 0).length;
    const socialFeedbackBeats = chain.beats.filter((beat) =>
      ["social_signal_beat", "relational_interpretation_beat"].includes(beat.beatType),
    ).length;
    const salienceCoverage =
      chain.beats.filter((beat) => beat.validationFlags.salienceJustified).length / chain.beats.length;
    const meaningTraceBeats = chain.beats.filter((beat) => beat.beatType === "meaning_trace_beat").length;
    const highestPressureLoad = Math.max(...chain.beats.map((beat) => beat.pressureLoad));

    const cockpitSummary = BeatAssemblyCockpitSummarySchema.parse({
      chapter: input.chapter,
      beatCount: chain.beats.length,
      validationPassed: chain.chainValidation.passed,
      highestPressureLoad,
      observerBoundaryIncidents,
      salienceCoverage: Number(salienceCoverage.toFixed(3)),
      memoryLinkedBeats,
      socialFeedbackBeats,
      meaningTraceBeats,
      summaryLine: input.summaryLine,
    });

    return {
      chain,
      cockpitSummary,
    };
  }

  buildChapter1BeatAssembly(): {
    chain: BeatAssemblyChain;
    cockpitSummary: BeatAssemblyCockpitSummary;
  } {
    const seeded = chapter1Beats();
    const beats: BeatAssemblyBeat[] = [];
    for (const beat of seeded) {
      const previous = beats.length > 0 ? beats[beats.length - 1] : null;
      beats.push(makeBeat(beat, previous));
    }

    return this.finalizeAssembly({
      chapter: 1,
      beats,
      sourceArtifacts: [
        "reports/book1-chapter-01-segment-simulation-state.json",
        "reports/book1-chapter-01-cognition-signatures.json",
        "reports/book1-chapter-01-voice-cognition-map.json",
        "reports/book1-chapter-01-developmental-intimacy-engine.json",
        "reports/book1-chapter-01-chapter_law.json",
        "reports/book1-chapter-01-chapter_relationship_pressure_map.json",
        "reports/book1-chapter-01-chapter_character_hidden_histories.json",
        "reports/book1-chapter-01-chapter_epic_simulation.json",
      ],
      summaryLine:
        "Chapter 1 beat assembly holds order-under-pressure arc with salience-led work opening and continuity-seeded consequence exit.",
    });
  }
}

export function listBeatTypesUsed(chain: BeatAssemblyChain): BeatType[] {
  return Array.from(new Set(chain.beats.map((beat) => beat.beatType)));
}
