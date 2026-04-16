import { z } from "zod";

const DevelopmentalPhaseSchema = z.enum([
  "pre-threshold-absorption",
  "threshold-crossing",
  "emerging-authority",
  "full-adult-authority",
  "generative-authority",
]);

const AgeMaturityLayerSchema = z.object({
  chronologicalAge: z.string(),
  developmentalPhase: DevelopmentalPhaseSchema,
  biologicalMaturationProfile: z.string(),
  emotionalMaturityProfile: z.string(),
  socialRoleMaturity: z.string(),
  selfAwarenessLevel: z.string(),
});

const IntimacyEmbodimentLayerSchema = z.object({
  bodyAwarenessStyle: z.string(),
  attractionAwarenessStyle: z.string(),
  boundaryUnderstanding: z.string(),
  consentAgencyUnderstanding: z.string(),
  reproductiveAwareness: z.string(),
  intimacyKnowledgeSource: z.string(),
  honorShamePressure: z.string(),
  agencyConstraintLevel: z.string(),
  embodimentStyle: z.string(),
  intimacyRiskPerception: z.string(),
});

const HistoricalCulturalMediationSchema = z.object({
  ritualStatus: z.string(),
  maritalStatus: z.string(),
  kinshipObligationPressure: z.string(),
  communityCourtshipNorms: z.string(),
  spiritualMeaningOfUnion: z.string(),
  publicVsPrivateIntimacyCode: z.string(),
});

const RenderingImpactSchema = z.object({
  voiceCognitionModifiers: z.array(z.string()),
  perspectiveRoutingModifiers: z.array(z.string()),
  renderDirectiveModifiers: z.array(z.string()),
  characterConsoleModifiers: z.array(z.string()),
  bodilyConversionPatterns: z.array(z.string()),
  silencePatterns: z.array(z.string()),
  intimacyDistancePatterns: z.array(z.string()),
});

const CharacterDevelopmentalProfileSchema = z.object({
  character: z.string(),
  ageMaturityLayer: AgeMaturityLayerSchema,
  intimacyEmbodimentLayer: IntimacyEmbodimentLayerSchema,
  historicalCulturalMediation: HistoricalCulturalMediationSchema,
  renderingImpact: RenderingImpactSchema,
});

const SegmentImpactSchema = z.object({
  segment: z.number(),
  activeIntimacyDynamics: z.array(z.string()),
  developmentalPhaseInfluenceOnScene: z.string(),
  bodilyConversionActivations: z.array(z.string()),
});

export const Book1DevelopmentalIntimacyEngineSchema = z.object({
  artifact: z.literal("chapter_developmental_intimacy_engine"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  timePeriod: z.string(),
  culturalFrame: z.string(),
  characters: z.array(CharacterDevelopmentalProfileSchema),
  globalRenderingRules: z.object({
    noClinicalLabelsInProse: z.literal(true),
    expressMaturityThrough: z.array(z.string()),
    chronologyProtection: z.string(),
    canonProtection: z.string(),
    ageAppropriateHandling: z.object({
      childCharacters: z.string(),
      thresholdCharacters: z.string(),
      adultCharacters: z.string(),
      elderCharacters: z.string(),
    }),
    noExplicitSexualityFlattening: z.string(),
    intimacyRenderingPrinciple: z.string(),
  }),
  segmentImpactMap: z.array(SegmentImpactSchema),
  provenance: z.object({ sourceArtifacts: z.array(z.string()) }),
});

export type DevelopmentalIntimacyEngine = z.infer<typeof Book1DevelopmentalIntimacyEngineSchema>;
export type CharacterDevelopmentalProfile = z.infer<typeof CharacterDevelopmentalProfileSchema>;
export type DevelopmentalPhase = z.infer<typeof DevelopmentalPhaseSchema>;

type CharacterSeed = {
  character: string;
  role: "focal-adult" | "ascending-adult" | "elder" | "threshold-learner" | "child";
  attentionBias?: string;
  suppressedMotive?: string;
};

type BuildInput = {
  activeCharacters: string[];
  characterSeeds: CharacterSeed[];
  segments: { segment: number; sceneFocus: string; characters: string[] }[];
};

const PHASE_MAP: Record<CharacterSeed["role"], DevelopmentalPhase> = {
  "focal-adult": "full-adult-authority",
  "ascending-adult": "emerging-authority",
  "elder": "generative-authority",
  "threshold-learner": "threshold-crossing",
  "child": "pre-threshold-absorption",
};

const ABSTRACTION_CEILING_MAP: Record<DevelopmentalPhase, number> = {
  "pre-threshold-absorption": 0,
  "threshold-crossing": 0,
  "emerging-authority": 0,
  "full-adult-authority": 0,
  "generative-authority": 1,
};

const HONOR_SHAME_INTENSITY: Record<DevelopmentalPhase, string> = {
  "pre-threshold-absorption": "reflected",
  "threshold-crossing": "acute",
  "emerging-authority": "very high",
  "full-adult-authority": "high",
  "generative-authority": "guardian",
};

const AGENCY_CONSTRAINT: Record<DevelopmentalPhase, string> = {
  "pre-threshold-absorption": "total",
  "threshold-crossing": "very high",
  "emerging-authority": "high constraint",
  "full-adult-authority": "moderate",
  "generative-authority": "low constraint",
};

function buildAgeMaturityLayer(seed: CharacterSeed): z.infer<typeof AgeMaturityLayerSchema> {
  const phase = PHASE_MAP[seed.role];
  const ageRanges: Record<CharacterSeed["role"], string> = {
    "focal-adult": "late-30s-to-mid-40s",
    "ascending-adult": "late-20s-to-early-30s",
    elder: "late-50s-to-60s",
    "threshold-learner": "mid-teens-to-early-20s",
    child: "6-to-10",
  };
  const biologicalProfiles: Record<CharacterSeed["role"], string> = {
    "focal-adult": "post-reproductive-peak; body carries labor history as knowledge; seasonal illness and recovery memory shapes risk tolerance",
    "ascending-adult": "physical prime; body optimized for labor and travel; still learning to read fatigue as signal rather than weakness",
    elder: "post-menopausal; body carries cumulative labor and ceremonial knowledge; physical decline reframed as earned wisdom",
    "threshold-learner": "recently matured; body is newly capable and not yet fully mapped by the self; physical changes noticed through changed social treatment",
    child: "pre-pubertal; body understood entirely through play capacity and task-learning; physical self-awareness limited to hunger, fatigue, and injury",
  };
  const emotionalProfiles: Record<CharacterSeed["role"], string> = {
    "focal-adult": "grief-integrated; processes loss as structural data rather than fresh wound; emotional restraint is practiced discipline",
    "ascending-adult": "partially integrated; processes threat faster than grief; emotional range narrowed by role pressure to perform competence",
    elder: "deeply integrated; grief, loss, and joy processed as pattern recognition across generations; emotional expression disciplined by role",
    "threshold-learner": "emergent; processes emotions through imitation and testing of elder patterns; genuine feeling and performed feeling not yet distinguished",
    child: "imitative-absorptive; emotions processed through behavioral mimicry of adults; genuine feeling and copied feeling indistinguishable",
  };
  const socialRoles: Record<CharacterSeed["role"], string> = {
    "focal-adult": "decision-bearing elder-adjacent; expected to mediate between elder counsel and younger action; carries household-scale authority",
    "ascending-adult": "ascending but unconfirmed; earns authority through demonstrated judgment rather than inherited position; tested by elders through delegation",
    elder: "apex; holds memory-law authority; decisions carry intergenerational weight; counsels rather than commands",
    "threshold-learner": "apprentice; learning social grammar through observation and supervised participation; mistakes carry outsized consequence",
    child: "observer-learner; role is to absorb and reproduce cultural patterns; not yet held accountable for social judgment",
  };
  const selfAwareness: Record<CharacterSeed["role"], string> = {
    "focal-adult": "high but blind to own rigidity; accurately reads others but underestimates how own fear narrows options",
    "ascending-adult": "low-to-moderate; reads external signals with precision but misattributes own emotional states as strategic thinking",
    elder: "high; accurate self-narration but selective about what knowledge to transmit and when",
    "threshold-learner": "low-to-moderate; self-understanding arrives through reflection of others' reactions rather than introspection",
    child: "minimal; self understood through position relative to older relatives; no independent self-narration capacity",
  };
  return {
    chronologicalAge: ageRanges[seed.role],
    developmentalPhase: phase,
    biologicalMaturationProfile: biologicalProfiles[seed.role],
    emotionalMaturityProfile: emotionalProfiles[seed.role],
    socialRoleMaturity: socialRoles[seed.role],
    selfAwarenessLevel: selfAwareness[seed.role],
  };
}

function buildIntimacyEmbodimentLayer(seed: CharacterSeed): z.infer<typeof IntimacyEmbodimentLayerSchema> {
  const bodyStyles: Record<CharacterSeed["role"], string> = {
    "focal-adult": "functional-instrumental; body is labor tool and social signal rather than site of private sensation",
    "ascending-adult": "performance-oriented; body understood through capacity and endurance; notices body when it fails or exceeds expectation",
    elder: "memorial; body carries partnership history as layered physical memory; sensation anchored in seasonal and ceremonial recurrence",
    "threshold-learner": "newly alert; body noticed through changed responses from community; physical self-awareness arriving through social mirror",
    child: "pre-reflexive; body experienced as undifferentiated sensation; no intimate self-awareness has yet developed",
  };
  const attractionStyles: Record<CharacterSeed["role"], string> = {
    "focal-adult": "alliance-filtered; attraction registers as kinship-strategic compatibility before physical pull",
    "ascending-adult": "status-filtered; attraction registers through demonstrated competence and household standing",
    elder: "retrospective-evaluative; attraction remembered as a force that shaped lineage outcomes",
    "threshold-learner": "pre-categorical; attraction registered as unfamiliar heightened attention without established vocabulary",
    child: "not-yet-active; attachment understood through familial warmth and comfort-seeking",
  };
  return {
    bodyAwarenessStyle: bodyStyles[seed.role],
    attractionAwarenessStyle: attractionStyles[seed.role],
    boundaryUnderstanding: seed.role === "child"
      ? "implicit; understands where children may go and where they may not through repeated instruction"
      : seed.role === "threshold-learner"
        ? "learning; absorbs boundary rules from elder instruction and observation of consequences"
        : seed.role === "elder"
          ? "architectural; understands boundaries as the structure that protects lineage continuity"
          : "spatial-relational; boundaries are communal architecture not personal preference",
    consentAgencyUnderstanding: seed.role === "child"
      ? "not-yet-applicable; operates within adult-defined safety structures"
      : seed.role === "threshold-learner"
        ? "nascent; understands that choices carry consequence but has not internalized kinship-mediated consent"
        : seed.role === "ascending-adult"
          ? "emerging; personal choice operates within but does not override kinship structure"
          : "obligation-embedded; consent operates through kinship negotiation and elder approval",
    reproductiveAwareness: seed.role === "child"
      ? "environmental; has observed animal birth and seasonal cycles"
      : seed.role === "threshold-learner"
        ? "partial; understands basic biological reality through elder instruction but has not connected it to personal future"
        : "practical-lineage; reproduction understood as continuity engineering",
    intimacyKnowledgeSource: seed.role === "child"
      ? "overheard elder conversation, animal observation, sleeping-arrangement proximity"
      : seed.role === "threshold-learner"
        ? "elder instruction fragments, peer whisper, ceremonial observation, indirect inference"
        : "elder instruction, observed marriages, seasonal ceremony, co-sleeping proximity, birth-witness experience",
    honorShamePressure: HONOR_SHAME_INTENSITY[PHASE_MAP[seed.role]],
    agencyConstraintLevel: AGENCY_CONSTRAINT[PHASE_MAP[seed.role]],
    embodimentStyle: seed.role === "child"
      ? "undifferentiated; physical experience is sensation without intimate interpretation"
      : seed.role === "threshold-learner"
        ? "sensation-led; new physical experiences not yet filtered through social vocabulary"
        : seed.role === "ascending-adult"
          ? "action-first; sensory experience registered through movement, distance, and physical consequence"
          : seed.role === "elder"
            ? "witness-memorial; sensory experience registered through comparison with prior seasons and ceremonies"
            : "task-anchored; sensory experience flows through handled objects, weather exposure, and witnessed labor",
    intimacyRiskPerception: seed.role === "child"
      ? "not-applicable; has no framework for intimacy risk"
      : seed.role === "threshold-learner"
        ? "immediate-concrete; risk perceived as punishment, shame, or loss of standing"
        : seed.role === "ascending-adult"
          ? "reputational; wrong intimacy choice threatens ascending authority"
          : seed.role === "elder"
            ? "generational; reads intimacy risk across decades"
            : "structural; intimacy risk is lineage risk",
  };
}

function buildHistoricalCulturalMediation(seed: CharacterSeed): z.infer<typeof HistoricalCulturalMediationSchema> {
  const ritualStatus: Record<CharacterSeed["role"], string> = {
    "focal-adult": "full-participant; has completed all age-appropriate ceremonies; carries ritual knowledge as working law",
    "ascending-adult": "recently-confirmed; has completed threshold ceremonies but has not yet led ceremony",
    elder: "ceremonial-authority; leads or guides age-appropriate ceremonies; carries songs and memory-law",
    "threshold-learner": "threshold-crosser; has completed or is preparing for maturation ceremonies",
    child: "pre-ceremonial; has witnessed ceremonies as spectator",
  };
  const maritalStatus: Record<CharacterSeed["role"], string> = {
    "focal-adult": "partnered-or-widowed; marital bond is political-economic alliance with affective dimension",
    "ascending-adult": "pre-marital-or-early-union; partnership under active household negotiation",
    elder: "widowed-or-long-partnered; partnership history is public knowledge woven into household identity",
    "threshold-learner": "pre-marital; subject to household courtship strategy",
    child: "not-applicable",
  };
  return {
    ritualStatus: ritualStatus[seed.role],
    maritalStatus: maritalStatus[seed.role],
    kinshipObligationPressure: seed.role === "child"
      ? "passive-recipient; obligations defined entirely by adults"
      : seed.role === "threshold-learner"
        ? "receiving; obligations defined by elders and not yet internalized as self-directed duty"
        : seed.role === "ascending-adult"
          ? "very high; must prove worthy of the lineage position being offered"
          : seed.role === "elder"
            ? "apex; all younger relatives' obligations flow through elder counsel"
            : "high; must balance competing lineage claims and cross-household alliances",
    communityCourtshipNorms: seed.role === "child"
      ? "observer-only; witnesses courtship dynamics without understanding the system"
      : seed.role === "threshold-learner"
        ? "object-of-negotiation; courtship operates around and about this character as much as through them"
        : seed.role === "ascending-adult"
          ? "constrained-initiative; may signal interest but cannot finalize without elder approval"
          : seed.role === "elder"
            ? "gatekeeper; evaluates courtship proposals against lineage strategy"
            : "elder-mediated; courtship involves household negotiation, gift exchange protocols, and seasonal timing",
    spiritualMeaningOfUnion: seed.role === "child"
      ? "pre-instructional; may understand that marriages happen and carry importance but cannot articulate why"
      : seed.role === "threshold-learner"
        ? "instructed but not yet experienced; understands union as important ceremony without full comprehension"
        : seed.role === "ascending-adult"
          ? "aspirational; understands union as spiritual-political event but has not yet internalized the cosmological weight"
          : seed.role === "elder"
            ? "embodied; has lived the cosmological reality of union"
            : "cosmological; union carries spiritual reciprocity obligations; fertility and partnership linked to land health",
    publicVsPrivateIntimacyCode: seed.role === "child"
      ? "unaware; does not yet distinguish public from private in intimacy contexts"
      : seed.role === "threshold-learner"
        ? "hyper-public; every gesture observed and interpreted; private experience of curiosity must be hidden"
        : seed.role === "ascending-adult"
          ? "public-performance-heavy; intimate interest must be legible to community as appropriate before private exploration"
          : seed.role === "elder"
            ? "fully public; private life has become communal memory"
            : "public-dominant; intimate partnership visible through labor cooperation, seating order, and ceremonial position",
  };
}

function buildRenderingImpact(seed: CharacterSeed): z.infer<typeof RenderingImpactSchema> {
  const phase = PHASE_MAP[seed.role];
  const ceiling = ABSTRACTION_CEILING_MAP[phase];

  if (seed.role === "child") {
    return {
      voiceCognitionModifiers: [
        "records adult partnership behaviors as unexplained patterns: who sits where, who speaks first, who goes silent",
        "body awareness limited to play, hunger, fatigue, and comfort; no intimate self-awareness renders in prose",
        "PROTECTION: this character's interiority NEVER processes intimacy content as personal experience",
      ],
      perspectiveRoutingModifiers: [
        "adult intimacy dynamics rendered as environmental background: spatial patterns, tone changes, unexplained silences",
        "narrative distance from adult partnership content maximized when child is perspective source",
      ],
      renderDirectiveModifiers: [
        `abstractionCeiling: ${ceiling} absolute; child interprets nothing about adult intimacy`,
        "imagePermission: none for any intimacy content from this perspective",
        "HARD RULE: prose never places this character in proximity to explicit intimacy content",
      ],
      characterConsoleModifiers: [
        "Child records object movement and tone shifts without understanding what they encode",
        "partnership dynamics surface only as unexplained changes in household routine",
      ],
      bodilyConversionPatterns: [
        "adult tension converts to child's heightened alertness: stillness, wide eyes, interrupted play",
        "household partnership strain registered as vague unease: appetite change, sleep disruption, clinginess",
      ],
      silencePatterns: [
        "child silence during adult partnership discussion is absorption without comprehension",
        "child silence after witnessing adult tension is protective withdrawal not interpretive processing",
      ],
      intimacyDistancePatterns: [
        "PROTECTION: never rendered closer than environmental-background distance to adult intimacy content",
        "proximity to adult partnership dynamics always incidental to task or play, never focused",
      ],
    };
  }

  if (seed.role === "threshold-learner") {
    return {
      voiceCognitionModifiers: [
        "interior awareness of attraction arrives as unnamed physical alertness: quickened breath, changed peripheral attention, task disruption",
        "does not yet have vocabulary for desire; renders interest through behavioral disruption rather than named feeling",
        "body awareness surfaces through comparison with observed elder behavior",
      ],
      perspectiveRoutingModifiers: [
        "intimacy-adjacent content rendered from sensation-first position; interpretation arrives late or not at all",
        "narrative distance stays at immediate-embodied; never pulls to reflective because the character lacks the framework",
      ],
      renderDirectiveModifiers: [
        `abstractionCeiling: ${ceiling} absolute; cannot theorize about intimacy; all awareness must land as body cue`,
        "sentencePressure: compressed and interrupted during attraction-awareness moments",
        "imagePermission: low for explicit intimacy; high for environmental and body-state cues",
      ],
      characterConsoleModifiers: [
        "registers intimacy-relevant moments as disruption to expected routine: lost count, dropped object, delayed response",
        "curiosity surfaces as heightened observational acuity directed at elder partnerships",
      ],
      bodilyConversionPatterns: [
        "attraction converts to task clumsiness: hands falter, gaze lingers, breathing pattern breaks",
        "shame converts to immediate over-correction: exaggerated focus on work, averted eyes",
        "curiosity converts to covert observation patterns: watches elder partnerships peripherally",
      ],
      silencePatterns: [
        "silence during elder discussion of courtship encodes intense absorption disguised as compliant quiet",
        "silence after being observed looking at a peer carries fear-of-exposure weight",
      ],
      intimacyDistancePatterns: [
        "physical proximity to age-peers managed through task justification; closeness requires visible practical reason",
        "narrative distance maintained at maximum remove; the reader senses what the character cannot yet name",
      ],
    };
  }

  if (seed.role === "elder") {
    return {
      voiceCognitionModifiers: [
        "references to partnership arrive through seasonal and ceremonial comparison; present unions measured against remembered ones",
        "body awareness layered: current sensation compared to stored physical memory of prior years",
        "evaluates younger relatives' intimate choices through outcome-prediction not moral judgment",
      ],
      perspectiveRoutingModifiers: [
        "intimacy-relevant scenes rendered from elder distance: observational with embedded memory layer",
        "private feeling surfaces only through gesture and breath-pattern change; never declarative interior statement",
      ],
      renderDirectiveModifiers: [
        `abstractionCeiling: ${ceiling} maximum; may carry one interpretive thread per paragraph tied to lived-history comparison`,
        "imagePermission: high for memory-layered domestic scenes; low for explicit evaluation of younger relatives",
      ],
      characterConsoleModifiers: [
        "Elder registers partnership dynamics through micro-gesture comparison: how a hand rests now versus decades ago",
        "intimate knowledge surfaces as instruction fragments embedded in practical correction",
      ],
      bodilyConversionPatterns: [
        "memory of lost partner converts to momentary stillness and adjusted breathing before returning to present task",
        "observation of young couple converts to quickened assessment pattern: posture reading, distance measurement",
      ],
      silencePatterns: [
        "silence after witnessing young partnership interaction encodes judgment that will emerge later as counsel",
        "silence about deceased partner marks sacred boundary",
      ],
      intimacyDistancePatterns: [
        "physical distance from younger couples maintained at observation range; close enough to read but not to interfere",
        "narrative distance from elder's own intimate memories kept at restrained-reflective; surfaces through objects and seasons",
      ],
    };
  }

  const isAscending = seed.role === "ascending-adult";
  return {
    voiceCognitionModifiers: isAscending
      ? [
          "interior monologue about potential partner filtered through competence-assessment vocabulary",
          "body awareness spikes during status-relevant encounters; physical sensation named through action vocabulary",
          "attraction surfaced through heightened observational precision about the other person's movements",
        ]
      : [
          "interior monologue may reference partner through object association rather than direct naming",
          "body awareness filtered through labor history; physical sensation named through task vocabulary",
          "attraction or affection expressed as assessment of reliability and lineage fit",
        ],
    perspectiveRoutingModifiers: isAscending
      ? [
          "intimacy-adjacent scenes routed through external observation and social-reading mode",
          "narrative distance increases when conscious of being watched during partnership-relevant interaction",
        ]
      : [
          "intimacy scenes routed through spatial awareness and social reading rather than interiority zoom",
          "private feeling expressed through withholding and gesture change, never declarative emotional labeling",
        ],
    renderDirectiveModifiers: [
      `abstractionCeiling: ${ceiling} for any intimacy content; all closeness must land through object, body, and spatial cue`,
      isAscending
        ? "sentencePressure: compressed during attraction-awareness moments; short clauses mimic elevated alertness"
        : "silenceWithholdingRequirement: true for any scene where partnership tension operates",
      isAscending
        ? "imagePermission: medium for status-display encounters; low for private feeling"
        : "imagePermission: high for domestic labor scenes that encode partnership; low for explicit interiority about desire",
    ],
    characterConsoleModifiers: isAscending
      ? [
          "registers potential-partner presence through heightened alertness to their spatial behavior and speech timing",
          "desire converts to competitive assessment before surfacing as interest; interest converts to strategic positioning",
        ]
      : [
          "registers partner presence through peripheral awareness: position at fire, sound of their movement, absence from expected location",
          "sexual or romantic energy converts to duty-assessment and lineage-continuity pressure before surfacing as feeling",
        ],
    bodilyConversionPatterns: isAscending
      ? [
          "attraction converts to postural adjustment: shoulders squared, chin-angle recalibrated, grip tightened",
          "rejection or uncertainty converts to over-investment in visible labor",
          "intimacy curiosity converts to observational hyper-focus on the other person's micro-behaviors",
        ]
      : [
          "desire converts to increased attentiveness to partner's spatial position and task pace",
          "grief over partnership loss converts to silence and over-precision in household tasks",
          "intimacy pressure converts to hand stillness and breath regulation before speech",
        ],
    silencePatterns: isAscending
      ? [
          "silence in the presence of a potential partner signals active processing disguised as indifference",
          "silence after elder commentary on partnership suitability encodes deferred compliance or private resistance",
        ]
      : [
          "silence after partner speaks carries evaluative weight; duration encodes trust level",
          "silence about absent partner marks active grief or unresolved obligation",
        ],
    intimacyDistancePatterns: isAscending
      ? [
          "proximity to potential partner managed through task adjacency: chooses work stations that enable observation",
          "narrative distance oscillates between embodied and observational when attraction is active",
        ]
      : [
          "physical proximity increases during shared labor, decreases during council tension",
          "narrative distance pulls back from embodied to observational when partnership is under communal scrutiny",
        ],
  };
}

function buildSegmentImpactMap(
  segments: BuildInput["segments"],
  characters: CharacterDevelopmentalProfile[],
): z.infer<typeof SegmentImpactSchema>[] {
  return segments.map((segment) => {
    const focalPhases = characters
      .filter((character) =>
        segment.characters.some(
          (name) => name.toLowerCase() === character.character.toLowerCase(),
        ),
      )
      .map((character) => character.ageMaturityLayer.developmentalPhase);

    const hasPhaseGap =
      focalPhases.includes("full-adult-authority") && focalPhases.includes("emerging-authority");

    return {
      segment: segment.segment,
      activeIntimacyDynamics: [
        `Partnership tension expressed through labor coordination and speaking-order negotiation`,
        hasPhaseGap
          ? "Developmental gap creates misreading: established authority reads caution as weakness; ascending authority reads restraint as distrust"
          : "Characters at similar developmental phase create parallel pressure without asymmetric misreading",
        "Elder evaluates household partnership stability through micro-gesture reading",
      ],
      developmentalPhaseInfluenceOnScene: hasPhaseGap
        ? "Developmental gap between focal characters creates misreading opportunities that deepen interior distinction."
        : "Similar developmental phases create shared pressure patterns with differentiation through individual attention bias.",
      bodilyConversionActivations: [
        "hand-pressure shift before irreversible partnership-relevant decision",
        "postural adjustment when authority is tested in front of witnesses",
        "silence-duration change when partnership topic surfaces indirectly",
      ],
    };
  });
}

export class Book1DevelopmentalIntimacyEngineService {
  build(input: BuildInput): DevelopmentalIntimacyEngine {
    const generatedAt = new Date().toISOString();
    const characterProfiles: CharacterDevelopmentalProfile[] = input.characterSeeds.map(
      (seed) => ({
        character: seed.character,
        ageMaturityLayer: buildAgeMaturityLayer(seed),
        intimacyEmbodimentLayer: buildIntimacyEmbodimentLayer(seed),
        historicalCulturalMediation: buildHistoricalCulturalMediation(seed),
        renderingImpact: buildRenderingImpact(seed),
      }),
    );

    const segmentImpactMap = buildSegmentImpactMap(input.segments, characterProfiles);

    return {
      artifact: "chapter_developmental_intimacy_engine",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      timePeriod: "Before 1680",
      culturalFrame: "Pre-contact Caddoan / Natchitoches riverine settlement",
      characters: characterProfiles,
      globalRenderingRules: {
        noClinicalLabelsInProse: true,
        expressMaturityThrough: [
          "awareness quality",
          "hesitation patterns",
          "body cue vocabulary",
          "curiosity style",
          "shame and restraint behavior",
          "ritual participation level",
          "duty-vs-desire processing style",
          "misreading patterns specific to developmental stage",
        ],
        chronologyProtection:
          "No developmental-intimacy content may introduce dates, events, or knowledge beyond the Before-1680 chronological envelope",
        canonProtection:
          "Developmental-intimacy modeling may not resolve succession, identity, or partnership outcomes that must remain latent for future chapters",
        ageAppropriateHandling: {
          childCharacters:
            "HARD PROTECTION: Child characters never process, witness directly, or participate in intimate content. Partnership dynamics render as unexplained environmental patterns only.",
          thresholdCharacters:
            "Intimacy awareness arrives as unnamed body disruption and social-mirror feedback. Never named, categorized, or theorized.",
          adultCharacters:
            "Intimacy awareness processed through task vocabulary, spatial awareness, and lineage-strategic assessment. Never rendered as modern psychological interiority.",
          elderCharacters:
            "Intimacy processed through memorial comparison and instructional authority. Present desire does not surface; all intimate awareness is retrospective or evaluative.",
        },
        noExplicitSexualityFlattening:
          "Do not render sexuality or desire through modern adult-explicit frameworks. All intimacy content must be mediated through the historical-cultural lens.",
        intimacyRenderingPrinciple:
          "Intimacy is expressed through what characters notice, what they withhold, how their bodies move in proximity to others, what silences carry, and what labor they choose to share.",
      },
      segmentImpactMap,
      provenance: {
        sourceArtifacts: [
          "reports/book1-chapter-01-outline.json",
          "reports/book1-chapter-01-cognition-signatures.json",
          "reports/book1-chapter-01-enneagram-consciousness-engine.json",
          "Natchitoches_Campti_Story_System/04_MATRIARCH_DOSSIERS.md",
        ],
      },
    };
  }
}

export function developmentalAbstractionCeiling(phase: DevelopmentalPhase): number {
  return ABSTRACTION_CEILING_MAP[phase];
}

export function developmentalIntimacyBodilyConversions(
  profile: CharacterDevelopmentalProfile,
): string[] {
  return profile.renderingImpact.bodilyConversionPatterns;
}

export function developmentalSilencePatterns(
  profile: CharacterDevelopmentalProfile,
): string[] {
  return profile.renderingImpact.silencePatterns;
}

export function isChildProtected(profile: CharacterDevelopmentalProfile): boolean {
  return profile.ageMaturityLayer.developmentalPhase === "pre-threshold-absorption";
}

export function developmentalMisreadingVector(
  a: CharacterDevelopmentalProfile,
  b: CharacterDevelopmentalProfile,
): string | null {
  const phases: DevelopmentalPhase[] = [
    "pre-threshold-absorption",
    "threshold-crossing",
    "emerging-authority",
    "full-adult-authority",
    "generative-authority",
  ];
  const gap = Math.abs(phases.indexOf(a.ageMaturityLayer.developmentalPhase) - phases.indexOf(b.ageMaturityLayer.developmentalPhase));
  if (gap < 2) return null;
  return `${a.character} (${a.ageMaturityLayer.developmentalPhase}) and ${b.character} (${b.ageMaturityLayer.developmentalPhase}) have a ${gap}-step developmental gap that produces asymmetric misreading of each other's intimacy signals.`;
}
