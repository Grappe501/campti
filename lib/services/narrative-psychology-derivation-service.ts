import {
  NarrativePsychologyArchitectureSchema,
  NarrativePullProfileSchema,
  type AxisMap,
  type ChapterNarrativePsychology,
  type NarrativePsychologyArchitecture,
} from "@/lib/domain/narrative-psychology";

const AXES: Array<keyof AxisMap> = [
  "attachment_intensity",
  "curiosity_tension",
  "continuity_investment",
  "identity_pressure",
  "place_immersion",
  "relational_heat",
  "interpretive_instability",
  "anticipatory_dread",
  "recovery_breathing_room",
  "revelation_pressure",
  "unresolved_pull",
  "meaning_depth",
];

function axis(input: Partial<AxisMap>): AxisMap {
  return Object.fromEntries(
    AXES.map((key) => [key, Number((input[key] ?? 0.5).toFixed(2))]),
  ) as AxisMap;
}

function chapter(input: {
  sequence: number;
  mode: ChapterNarrativePsychology["chapterPsychologyMode"];
  objective: string;
  feltTexture: string[];
  bondGoal: string[];
  uncertaintyLoad: string[];
  continuityPressure: string[];
  immersionDensity: string;
  revelationAllowance: ChapterNarrativePsychology["revelationAllowance"];
  endingVector: string;
  carryForwardHook: string;
  constraints: string[];
  axisTargets: Partial<AxisMap>;
  pullScore: number;
  pullDrivers: string[];
  tensionMarkers: string[];
}): ChapterNarrativePsychology {
  const chapterId = `book1-chapter-${String(input.sequence).padStart(2, "0")}`;
  return {
    artifact: "chapter_narrative_psychology",
    chapterId,
    parentBookId: "book1",
    sequence: input.sequence,
    chapterPsychologyMode: input.mode,
    chapterEmotionalObjective: input.objective,
    feltTexture: input.feltTexture,
    readerBondGoal: input.bondGoal,
    uncertaintyLoad: input.uncertaintyLoad,
    continuityPressure: input.continuityPressure,
    immersionDensity: input.immersionDensity,
    revelationAllowance: input.revelationAllowance,
    emotionalRecoveryBalance: "Recovery remains brief and functional; intensification carries most chapter endings.",
    endingVector: input.endingVector,
    chapterCarryForwardHookType: input.carryForwardHook,
    chapterPsychologyConstraints: input.constraints,
    axisTargets: axis(input.axisTargets),
    pullProfile: NarrativePullProfileSchema.parse({
      artifact: "narrative_pull_profile",
      chapterId,
      pullScore: input.pullScore,
      drivers: input.pullDrivers,
      unresolvedPressureVectors: input.uncertaintyLoad,
      carryForwardTensionMarkers: input.tensionMarkers,
      antiCheapCliffhangerGuard:
        "End chapters with active continuity pressure and relational consequence, not shock-only cliffhanger mechanics.",
    }),
  };
}

export class NarrativePsychologyDerivationService {
  buildBook1Architecture(): NarrativePsychologyArchitecture {
    const chapters: ChapterNarrativePsychology[] = [
      chapter({
        sequence: 1,
        mode: "rooted_continuity",
        objective: "Bond reader to place, labor cadence, and kinship duty before overt fracture.",
        feltTexture: ["grounded", "humid", "ritualized", "quietly alert"],
        bondGoal: ["Belonging through work competence", "Trust in continuity carriers"],
        uncertaintyLoad: ["Slight unreadability in environmental timing"],
        continuityPressure: ["Storage reliability under subtle drift"],
        immersionDensity: "high_place_first",
        revelationAllowance: "minimal",
        endingVector: "Belonging remains, but pressure is now undeniable.",
        carryForwardHook: "unresolved_operational_branch",
        constraints: [
          "No omniscient explanation of external causes.",
          "Meaning must surface through work gesture and relation, not exposition.",
        ],
        axisTargets: {
          attachment_intensity: 0.68,
          place_immersion: 0.86,
          continuity_investment: 0.79,
          curiosity_tension: 0.43,
          unresolved_pull: 0.51,
          meaning_depth: 0.49,
        },
        pullScore: 0.58,
        pullDrivers: ["place attachment", "continuity labor", "subtle anomaly"],
        tensionMarkers: ["quiet rerouting", "latent messenger posture"],
      }),
      chapter({
        sequence: 2,
        mode: "signal_disturbance",
        objective: "Let unreadability enter while preserving local realism and tone.",
        feltTexture: ["familiar-but-off", "watchful", "thickening"],
        bondGoal: ["Reader notices strain with characters rather than ahead of them"],
        uncertaintyLoad: ["Signal integrity drops", "Interpretation cost rises"],
        continuityPressure: ["Weather and storage pattern mismatch"],
        immersionDensity: "high",
        revelationAllowance: "guarded",
        endingVector: "Routine still functions, but confidence in readings is reduced.",
        carryForwardHook: "deferred_interpretation",
        constraints: ["Avoid thriller tempo spikes.", "Preserve embodied noticing before conclusions."],
        axisTargets: {
          curiosity_tension: 0.56,
          interpretive_instability: 0.52,
          unresolved_pull: 0.57,
          place_immersion: 0.82,
        },
        pullScore: 0.63,
        pullDrivers: ["signal ambiguity", "memory comparison", "shared vigilance"],
        tensionMarkers: ["silent cue exchanges", "material verification loops"],
      }),
      chapter({
        sequence: 3,
        mode: "relational_thickening",
        objective: "Deepen attachment through observed relational behavior under strain.",
        feltTexture: ["intimate", "strained", "attentive"],
        bondGoal: ["Reader attachment shifts from place-only to people-in-place"],
        uncertaintyLoad: ["Misread risk in kinship cues"],
        continuityPressure: ["Shared interpretation starts to diverge"],
        immersionDensity: "high_relational",
        revelationAllowance: "guarded",
        endingVector: "Attachment deepens even as coordination frays.",
        carryForwardHook: "relational_ambiguity",
        constraints: ["No overt diagnostic language for relationships."],
        axisTargets: {
          attachment_intensity: 0.74,
          relational_heat: 0.58,
          curiosity_tension: 0.62,
          continuity_investment: 0.76,
        },
        pullScore: 0.67,
        pullDrivers: ["relational signal reading", "partial understanding", "witnessed care"],
        tensionMarkers: ["absent role slots", "silence as social data"],
      }),
      chapter({
        sequence: 4,
        mode: "obligation_strain",
        objective: "Complicate belonging with obligation bottlenecks and asymmetric burden.",
        feltTexture: ["compressed", "duty-heavy", "fatigued"],
        bondGoal: ["Reader invests in who carries which cost"],
        uncertaintyLoad: ["Decision reversibility begins to shrink"],
        continuityPressure: ["Task triage threatens social ease"],
        immersionDensity: "medium_high",
        revelationAllowance: "guarded",
        endingVector: "Belonging persists, but the cost curve steepens.",
        carryForwardHook: "cost_visibility",
        constraints: ["Maintain cultural grounding in labor and ritual practice."],
        axisTargets: {
          attachment_intensity: 0.72,
          unresolved_pull: 0.64,
          recovery_breathing_room: 0.34,
          relational_heat: 0.58,
        },
        pullScore: 0.7,
        pullDrivers: ["obligation asymmetry", "resource sequencing", "social restraint"],
        tensionMarkers: ["triage choices", "quiet deferrals with cost"],
      }),
      chapter({
        sequence: 5,
        mode: "interpretive_instability",
        objective: "Make uncertainty bite through deferred interpretation and contradiction management.",
        feltTexture: ["restless", "ambiguous", "fatigue-edged"],
        bondGoal: ["Reader keeps turning pages to resolve meaningful uncertainty, not gimmick reveals"],
        uncertaintyLoad: ["Contradictory cues", "partial explanations"],
        continuityPressure: ["Memory confidence no longer fully sufficient"],
        immersionDensity: "medium_high",
        revelationAllowance: "moderate",
        endingVector: "Interpretation remains open while stakes sharpen.",
        carryForwardHook: "contradictory_signal_cluster",
        constraints: ["No cheap twist reveal; uncertainty must remain evidence-linked."],
        axisTargets: {
          interpretive_instability: 0.71,
          curiosity_tension: 0.74,
          unresolved_pull: 0.7,
          meaning_depth: 0.61,
        },
        pullScore: 0.74,
        pullDrivers: ["evidence conflict", "decision cost", "partial continuity clues"],
        tensionMarkers: ["mismatch escalates", "decision windows narrow"],
      }),
      chapter({
        sequence: 6,
        mode: "continuity_threat",
        objective: "Let continuity itself feel vulnerable without abandoning realism.",
        feltTexture: ["heavy", "frayed", "protective"],
        bondGoal: ["Reader fears loss of continuity practices, not only plot outcomes"],
        uncertaintyLoad: ["Identity and role fit weaken under pressure"],
        continuityPressure: ["Household coherence becomes threatened"],
        immersionDensity: "medium",
        revelationAllowance: "moderate",
        endingVector: "Continuity can still be carried, but not passively.",
        carryForwardHook: "threatened_order",
        constraints: ["Keep emotional labels sparse and action-derived."],
        axisTargets: {
          continuity_investment: 0.84,
          identity_pressure: 0.69,
          anticipatory_dread: 0.62,
          unresolved_pull: 0.76,
        },
        pullScore: 0.78,
        pullDrivers: ["threatened order", "identity strain", "duty transfer urgency"],
        tensionMarkers: ["fracture cues", "role renegotiation"],
      }),
      chapter({
        sequence: 7,
        mode: "movement_thinkable",
        objective: "Make movement emotionally thinkable before it becomes fully chosen.",
        feltTexture: ["sober", "thresholded", "aching"],
        bondGoal: ["Reader feels cost of contemplated movement against place attachment"],
        uncertaintyLoad: ["Future branch opens while no safe option exists"],
        continuityPressure: ["Carry-forward identity practices must be selected"],
        immersionDensity: "medium",
        revelationAllowance: "moderate",
        endingVector: "Movement is now imaginable, and that changes everything.",
        carryForwardHook: "identity_carryover_choice",
        constraints: ["Movement pressure must remain socially and materially grounded."],
        axisTargets: {
          place_immersion: 0.73,
          identity_pressure: 0.74,
          unresolved_pull: 0.81,
          anticipatory_dread: 0.67,
        },
        pullScore: 0.82,
        pullDrivers: ["place bond vs adaptation need", "relational cost anticipation"],
        tensionMarkers: ["prepared but uncommitted options", "deferred irreversible move"],
      }),
      chapter({
        sequence: 8,
        mode: "adaptation_pressure",
        objective: "Force adaptation as necessary but costly, preserving carry-forward tension.",
        feltTexture: ["urgent", "costly", "resolute"],
        bondGoal: ["Reader remains attached through transition pain and continuity work"],
        uncertaintyLoad: ["Adaptation decisions remain partially unresolved"],
        continuityPressure: ["Identity continuity must be actively rebuilt"],
        immersionDensity: "medium",
        revelationAllowance: "elevated",
        endingVector: "Adaptation begins, but unresolved pressure carries into next movement.",
        carryForwardHook: "earned_unresolved_transition",
        constraints: ["Do not discharge unresolved pull with false closure."],
        axisTargets: {
          unresolved_pull: 0.86,
          revelation_pressure: 0.72,
          attachment_intensity: 0.78,
          meaning_depth: 0.74,
        },
        pullScore: 0.85,
        pullDrivers: ["costly adaptation", "attachment preservation", "future continuity uncertainty"],
        tensionMarkers: ["active transition branch", "recoverable but unresolved fracture"],
      }),
    ];

    return NarrativePsychologyArchitectureSchema.parse({
      artifact: "narrative_psychology_architecture",
      schemaVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      epic: {
        artifact: "epic_narrative_psychology",
        epicId: "campti-epic",
        emotionalNorthStar: "Sustained belonging under historical pressure, where continuity is carried through costly adaptation.",
        epicEmotionalSpine: "Belonging -> pressure -> displacement -> reformation without severing memory.",
        epicContinuityThemes: ["lineage memory as operational logic", "ritual labor as identity carrier", "place-loss and place-reformation"],
        epicIdentityStakes: ["Can identity survive forced movement?", "What continuity practices remain portable?"],
        primaryReaderBondModes: ["place attachment", "kinship observation", "continuity labor witness"],
        longArcTensionModes: ["pressure accumulation", "threatened order", "adaptation cost"],
        continuityThreatModes: ["resource instability", "social fracturing", "identity-role mismatch"],
        mysteryLoadProfile: ["low-latent in Book 1", "expanding relational unreadability", "deferred causality clarification"],
        revelationCadence: ["evidence-first", "partial meaning traces", "earned delayed revelations"],
        placeAttachmentStrategy: "Anchor emotional investment in lived place-work detail before major displacement vectors.",
        identityAttachmentStrategy: "Bind reader attachment to role performance and relational duty, not abstract self-analysis.",
        memoryInvestmentStrategy: "Use memory comparison as recurring continuity thread across pressure transitions.",
        immersionProfile: ["material", "environmental", "relational", "historically grounded"],
        pressureSignature: ["slow-rise", "compounding", "consequence-seeding"],
        recoveryRebuildingLogic: ["brief recoveries", "functional regrouping", "identity carry-forward reconstruction"],
        readerExperienceGoals: [
          "Deep attachment without omniscient exposition",
          "Meaningful unresolved pull rooted in continuity stakes",
          "Literary page-turn energy through pressure and anticipation",
        ],
        psychologicalRiskFlags: [],
        axisTargets: axis({
          attachment_intensity: 0.78,
          curiosity_tension: 0.66,
          continuity_investment: 0.88,
          identity_pressure: 0.71,
          place_immersion: 0.83,
          relational_heat: 0.62,
          interpretive_instability: 0.57,
          anticipatory_dread: 0.61,
          recovery_breathing_room: 0.35,
          revelation_pressure: 0.58,
          unresolved_pull: 0.79,
          meaning_depth: 0.74,
        }),
      },
      book: {
        artifact: "book_narrative_psychology",
        bookId: "book1",
        parentEpicId: "campti-epic",
        emotionalArcProfile:
          "Belonging through place and labor deepens into continuity strain, then transitions toward costly adaptation readiness.",
        phaseEmotionBands: [
          { phase: "opening", dominantModes: ["belonging", "quiet vigilance"] },
          { phase: "mid-rise", dominantModes: ["strain", "interpretive uncertainty"] },
          { phase: "late-rise", dominantModes: ["continuity threat", "movement pressure"] },
        ],
        attachmentGoals: ["Bond through daily labor intelligence", "Bond through relational duty under stress"],
        placeImmersionGoals: ["River-grounded sensory anchoring", "Material texture before abstraction"],
        characterBondGoals: ["Kinship observation", "Witnessed caregiving load", "Duty-bearing leadership costs"],
        unresolvedPressureDesign: [
          "Carry operational branches across chapter endings",
          "Preserve uncertainty where evidence remains partial",
        ],
        payoffDelayDesign: [
          "Delay major explanatory reveal until continuity stakes are internalized",
          "Resolve local tasks while preserving larger pressure trajectory",
        ],
        revelationWindows: ["late chapter clusters", "state-update-linked disclosures", "relational consequence moments"],
        uncertaintyStrategy: ["evidence-first ambiguity", "deferred interpretation", "observer-bounded mismatch"],
        continuityStakes: ["lineage transfer", "place-role cohesion", "identity carry-forward under movement threat"],
        endingCarryForwardProfile: [
          "Unresolved meaningful pressure",
          "Consequence-seeded endings",
          "Anticipatory state-shift vectors",
        ],
        axisTargets: axis({
          attachment_intensity: 0.73,
          curiosity_tension: 0.68,
          continuity_investment: 0.82,
          identity_pressure: 0.64,
          place_immersion: 0.81,
          relational_heat: 0.6,
          interpretive_instability: 0.63,
          anticipatory_dread: 0.58,
          recovery_breathing_room: 0.38,
          revelation_pressure: 0.61,
          unresolved_pull: 0.76,
          meaning_depth: 0.69,
        }),
      },
      chapters,
      axisScaleBehavior: {
        attachment_intensity: {
          epicBehavior: "Long-horizon bond to continuity carriers and inherited practices.",
          bookBehavior: "Bond deepens from place familiarity into relational duty investment.",
          chapterBehavior: "Local scenes prioritize bodily and relational detail to sustain reader bond.",
        },
        curiosity_tension: {
          epicBehavior: "Maintains mystery load across books without forcing genre gimmicks.",
          bookBehavior: "Escalates from subtle unreadability into interpretive pressure.",
          chapterBehavior: "Uses deferred interpretation and contradiction management.",
        },
        continuity_investment: {
          epicBehavior: "Core franchise-level emotional contract.",
          bookBehavior: "Book-specific continuity threads are selected and stressed.",
          chapterBehavior: "Scene endings preserve continuity stakes through state updates.",
        },
        identity_pressure: {
          epicBehavior: "Tracks identity survival under displacement eras.",
          bookBehavior: "Begins identity-role strain before movement conversion.",
          chapterBehavior: "Pressure appears as role conflict and duty asymmetry.",
        },
        place_immersion: {
          epicBehavior: "Place memory remains central even after movement.",
          bookBehavior: "Early chapters maximize grounded place attachment.",
          chapterBehavior: "Requires concrete environmental anchoring density.",
        },
        relational_heat: {
          epicBehavior: "Carries social consequence arcs over long horizon.",
          bookBehavior: "Increases through kinship strain progression.",
          chapterBehavior: "Expressed via behavior and omission, not label-heavy interiority.",
        },
        interpretive_instability: {
          epicBehavior: "Ensures partial unknowability survives resolution cycles.",
          bookBehavior: "Rises in middle chapters as signal integrity drops.",
          chapterBehavior: "Constrains interpretation allowance and ambiguity ceilings.",
        },
        anticipatory_dread: {
          epicBehavior: "Sustained through continuity threat anticipation.",
          bookBehavior: "Builds as movement becomes thinkable.",
          chapterBehavior: "Delivered through consequence seeds and withheld certainty.",
        },
        recovery_breathing_room: {
          epicBehavior: "Allows emotional renewal without discharging core arc pressure.",
          bookBehavior: "Short breathing windows prevent monotone escalation.",
          chapterBehavior: "Controls paragraph breath and pacing decompression moments.",
        },
        revelation_pressure: {
          epicBehavior: "Revelation cadence avoids over-explaining too early.",
          bookBehavior: "Transitions from guarded traces to selective windows.",
          chapterBehavior: "Governs revelation allowance per chapter mode.",
        },
        unresolved_pull: {
          epicBehavior: "Primary page-turn engine across saga continuity.",
          bookBehavior: "Ending carry-forward profile keeps larger pressure active.",
          chapterBehavior: "Ending vectors retain meaningful unresolved state shifts.",
        },
        meaning_depth: {
          epicBehavior: "Supports literary weight grounded in history and relation.",
          bookBehavior: "Meaning deepens as continuity threat rises.",
          chapterBehavior: "Limited direct reflection; mostly embodied resonance.",
        },
      },
    });
  }
}
