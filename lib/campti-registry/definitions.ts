import type { CamptiMasterRegistry } from "./types";

/**
 * Fifteen master registries — brain of the governed simulation.
 * `implementedSurfaces` point at what exists today; `nextBuildNotes` is the forward hook.
 */
export const CAMPTI_MASTER_REGISTRIES: CamptiMasterRegistry[] = [
  {
    id: "constitutional",
    ordinal: 1,
    title: "Constitutional Registry",
    tagline: "Laws of truth, ambiguity, reveal, ethics, violence, theology, and narrative permission.",
    description:
      "Top-level norms: what may be stated, implied, withheld, or shown. Separates governed simulation from unconstrained generation. Feeds every downstream rule and readiness gate.",
    layer: "Constitutional",
    buildPhase: 1,
    buildOrderInPhase: 1,
    governs: ["RecordType discipline", "reveal cadence", "violence/theology bounds", "voice ethics"],
    aiContract:
      "AI must not override constitutional labels; prose must remain inside permission and ambiguity envelopes.",
    implementedSurfaces: [
      {
        label: "Constitutional core & DNA rules",
        href: "/admin/narrative-rules",
        prismaModel: "ConstitutionalRule / NarrativeRule",
      },
      { label: "Continuity notes (severity)", href: "/admin/continuity", prismaModel: "ContinuityNote" },
      { label: "Open questions (uncertainty)", href: "/admin/questions", prismaModel: "OpenQuestion" },
      { label: "Claims (atomic truth)", href: "/admin/claims", prismaModel: "Claim" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "ConstitutionalRule + lib/constitution.ts landed. Next: narrative permission enum (Stage 2), enforcement in draft readiness / scene workspace, optional links from rules to scenes or characters.",
  },
  {
    id: "story-ontology",
    ordinal: 2,
    title: "Story Ontology Registry",
    tagline: "Every object type that may exist in the simulation graph.",
    description:
      "Canonical list of entity kinds (person, place, event, fragment, meta-scene, pressure source, branch condition, etc.) and allowed edges. Prevents orphan concepts in admin and generation.",
    layer: "Ontology",
    buildPhase: 1,
    buildOrderInPhase: 2,
    governs: ["Valid link types", "fragment link roles", "binding polymorphism"],
    aiContract: "AI may only propose edges that exist in ontology + Prisma schema.",
    implementedSurfaces: [
      { label: "Ontology types (master object kinds)", href: "/admin/ontology", prismaModel: "OntologyType" },
      { label: "Brain dashboard (coverage)", href: "/admin/brain" },
      { label: "Narrative bindings", href: "/admin/bindings", prismaModel: "NarrativeBinding" },
      { label: "Fragment links (polymorphic)", prismaModel: "FragmentLink", note: "linkedType / linkedId" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "OntologyType + RegistryValue landed. Next: optional FKs from domain models to registry rows; generate FragmentLink allowlists from ontology keys; keep Prisma as source of truth for instances.",
  },
  {
    id: "deterministic-value",
    ordinal: 3,
    title: "Deterministic Value Registry",
    tagline: "Enumerations and scales for bounded choice (not raw prose).",
    description:
      "Fixed enums and ranges used in simulation: pressure levels, readiness scores, symbolic activation states, branch elasticity. Keeps ‘bounded choice inside anchored fields’ machine-checkable.",
    layer: "Values",
    buildPhase: 1,
    buildOrderInPhase: 3,
    governs: ["Scene readiness", "branch elasticity", "symbol activation thresholds"],
    aiContract: "AI outputs structured fields must validate against these enums / ranges.",
    implementedSurfaces: [
      { label: "Registry values (families: READINESS, BRANCH, …)", href: "/admin/registries/values", prismaModel: "RegistryValue" },
      { label: "Confidence profiles", href: "/admin/confidence", prismaModel: "ConfidenceProfile" },
      { label: "Scene readiness profiles", href: "/admin/readiness", prismaModel: "SceneReadinessProfile" },
      { label: "RecordType, VisibilityStatus, FragmentType (Prisma enums)", note: "schema.prisma" },
      { label: "Scene / meta-scene heuristic fields", prismaModel: "MetaScene", note: "emotionalVoltage, sourceSupportLevel strings" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "RegistryValue + profiles provide editable scales; next: reference these keys from MetaScene / Scene intelligence instead of ad hoc strings where possible.",
  },
  {
    id: "character-variable",
    ordinal: 4,
    title: "Character Variable Registry",
    tagline: "Beyond profiles: thresholds, triggers, defenses, speech and perception rules.",
    description:
      "Names the variable set for CharacterProfile + CharacterState + memory: what can move in simulation vs what is fixed spine. Supports collapse and stress paths without modern psychologizing in prose.",
    layer: "Character architecture",
    buildPhase: 2,
    buildOrderInPhase: 1,
    governs: ["POV legality", "reaction bounds", "relational triggers"],
    aiContract: "Character simulation must use declared variables; optional Enneagram remains drafting aid only.",
    implementedSurfaces: [
      { label: "Character profiles", href: "/admin/people", prismaModel: "CharacterProfile" },
      { label: "Character states", prismaModel: "CharacterState" },
      { label: "Character memories", prismaModel: "CharacterMemory" },
      { label: "Mind editor", href: "/admin/people", note: "/admin/characters/[id]/mind" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "CharacterVariableDefinition table keyed by variableKey + optional JSON schema for state machine hooks.",
  },
  {
    id: "place-environment-variable",
    ordinal: 5,
    title: "Place / Environment Variable Registry",
    tagline: "Land as governing intelligence: sensory, movement, danger, ritual, social law.",
    description:
      "Defines which environment dimensions are modeled (sound, smell, danger gradient, ritual zone) and how SettingProfile / SettingState combine for legality checks.",
    layer: "Environment",
    buildPhase: 2,
    buildOrderInPhase: 2,
    governs: ["Sensory completeness", "movement constraints", "threshold zones"],
    aiContract: "Scene environment must cite populated variables or mark inferential gaps explicitly.",
    implementedSurfaces: [
      { label: "Places", href: "/admin/places", prismaModel: "Place" },
      { label: "Setting profiles", prismaModel: "SettingProfile" },
      { label: "Setting states", prismaModel: "SettingState" },
      { label: "Environment editor", href: "/admin/places", note: "/environment" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "PlaceVariableLaw rows (dangerLaw, movementLaw, ritualLaw) or structured JSON on SettingProfile with admin form.",
  },
  {
    id: "pressure-field",
    ordinal: 6,
    title: "Pressure Field Registry",
    tagline: "Environmental, social, and existential pressure — who feels what, what the child cannot parse.",
    description:
      "Typed pressure sources for meta-scenes and scenes: maps to meta-scene notes and future PressureSource entities. Aligns with your simulation meta-scene pressure blocks.",
    layer: "Pressure",
    buildPhase: 2,
    buildOrderInPhase: 3,
    governs: ["Meta-scene tension", "adult vs child information asymmetry"],
    aiContract: "Simulation must declare pressure vectors before drafting ‘illegal’ character actions.",
    implementedSurfaces: [
      { label: "Meta scenes", href: "/admin/meta-scenes", prismaModel: "MetaScene" },
      { label: "Scene construction suggestions", prismaModel: "SceneConstructionSuggestion" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "PressureSource model: type (social | environmental | existential | historical), linked metaSceneId, JSON payload; migrate free-text notes gradually.",
  },
  {
    id: "symbol-law",
    ordinal: 7,
    title: "Symbol Law Registry",
    tagline: "Recurrence, activation, and forbidden misuse for motifs and symbols.",
    description:
      "Smoke, fire, river, roux, chapel, graveyard line, etc. Each symbol has meaning layers, certainty, and usage law so AI cannot invert or cheapen established motifs.",
    layer: "Symbol / motif",
    buildPhase: 3,
    buildOrderInPhase: 1,
    governs: ["Symbolic consistency", "DNA layer coherence"],
    aiContract: "Symbolic generation must check activation rules and NarrativeRule symbolism category.",
    implementedSurfaces: [
      { label: "Symbols", href: "/admin/symbols", prismaModel: "Symbol" },
      { label: "Motifs", href: "/admin/motifs", prismaModel: "Motif" },
      { label: "Themes", href: "/admin/themes", prismaModel: "Theme" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "SymbolLaw table: symbolId, activationCondition, forbiddenUse, recurrencePattern; link to Fragment / Scene via existing bindings.",
  },
  {
    id: "timeline-anchor",
    ordinal: 8,
    title: "Timeline / Anchor Registry",
    tagline: "Fixed anchors, soft anchors, pivots, branch windows, irreversible events.",
    description:
      "Temporal governance: what time can do in the sim (season, raid window, documentary year vs narrative approximation). Supports convergence points and Chapter/Scene dating discipline.",
    layer: "Temporal",
    buildPhase: 3,
    buildOrderInPhase: 2,
    governs: ["Chronology", "meta-scene dateEstimate", "event years"],
    aiContract: "No invented calendar precision where RecordType is historical without Claim support.",
    implementedSurfaces: [
      { label: "Events", href: "/admin/events", prismaModel: "Event" },
      { label: "Chapters", href: "/admin/chapters", prismaModel: "Chapter" },
      { label: "Meta scene time fields", prismaModel: "MetaScene", note: "timePeriod, dateEstimate" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "TimelineAnchor model: anchorType (fixed | soft | pivot), yearRange, linkedEventIds, branchWindow; optional visualization admin.",
  },
  {
    id: "branch-condition",
    ordinal: 9,
    title: "Branch Condition Registry",
    tagline: "What may branch, what must converge, elasticity vs fixed endpoints.",
    description:
      "Encodes constrained free will: bounded choice sets, branch permissions, collapse rules. Ties narrative patterns to reader-facing branch policy (if any).",
    layer: "Branching / determinism",
    buildPhase: 3,
    buildOrderInPhase: 3,
    governs: ["Alternate paths", "canonical locks", "simulation elasticity"],
    aiContract: "Branch suggestions must respect fixed endpoints declared in continuity + rules.",
    implementedSurfaces: [
      { label: "Narrative patterns", href: "/admin/patterns", prismaModel: "NarrativePattern" },
      { label: "Narrative rules (structure)", href: "/admin/narrative-rules" },
      { label: "Continuity", href: "/admin/continuity" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "BranchCondition model: parentSceneId, conditionExpr (structured), allowedOutcomes[], defaultConvergence; integrate with MetaScene continuityDependencies.",
  },
  {
    id: "scene-constraint",
    ordinal: 10,
    title: "Scene Constraint Registry",
    tagline: "Each scene as a legal possibility field: allowed actions, obligations, illegal moves.",
    description:
      "Scene-legality layer on top of meta-scene simulation: structuredDataJson hooks, grounding, continuity. Feeds composition readiness.",
    layer: "Scene simulation",
    buildPhase: 4,
    buildOrderInPhase: 1,
    governs: ["Draft validity", "assist-run eligibility", "structured scene JSON"],
    aiContract: "Scene assists must validate against constraints + sources before merge to draft.",
    implementedSurfaces: [
      { label: "Scenes", href: "/admin/scenes", prismaModel: "Scene" },
      { label: "Scene workspace", note: "/admin/scenes/[id]/workspace" },
      { label: "Scene assist runs", prismaModel: "SceneAssistRun" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "SceneConstraintSet model or Scene.structuredDataJson schema version + admin JSON editor with validation.",
  },
  {
    id: "voice-governance",
    ordinal: 11,
    title: "Voice Governance Registry",
    tagline: "Diction bounds, rhythm, register, dialect law, anti-flattening for AI.",
    description:
      "Narrator and POV voice law: ties NarrativeVoiceProfile, VoicePass, anti-slur / flattening rules, and meta-scene composer voice settings.",
    layer: "Voice / language",
    buildPhase: 4,
    buildOrderInPhase: 2,
    governs: ["Public copy tone", "composer outputs", "audio scripts"],
    aiContract: "Voice passes must cite profile id; forbidden registers blocked at lint.",
    implementedSurfaces: [
      { label: "Narrative voice profiles", prismaModel: "NarrativeVoiceProfile" },
      { label: "Voice passes", prismaModel: "VoicePass" },
      { label: "Literary devices", href: "/admin/literary-devices", prismaModel: "LiteraryDevice" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "VoiceGovernanceRule rows: profileId, registerMin/Max, dialectTags, bannedPatterns; hook enhance-meta validation.",
  },
  {
    id: "reveal-architecture",
    ordinal: 12,
    title: "Reveal Architecture Registry",
    tagline: "Mystery density, revelation budget, narrator visibility, archival feel.",
    description:
      "Plans what the reader may know when: ties chapters, scenes, meta-scene experience tuning, and premium depth. Prevents accidental spoiler velocity.",
    layer: "Reader / meta experience",
    buildPhase: 4,
    buildOrderInPhase: 3,
    governs: ["Prologue vs chapter reveals", "guided experience pacing"],
    aiContract: "Cinematic and guided outputs must respect revelation budget per chapter arc.",
    implementedSurfaces: [
      { label: "Chapters", href: "/admin/chapters", prismaModel: "Chapter" },
      { label: "Meta scene experience tuning", note: "/admin/meta-scenes/[id]/experience-tuning" },
      { label: "Reader state / imprints", prismaModel: "ReaderState", note: "public reader" },
      { label: "Attachment", href: "/admin/attachment" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "RevealBeat model: chapterId, beatOrder, maxInfoLevel, narratorVisibility; link Scene orderInChapter.",
  },
  {
    id: "memory-trigger",
    ordinal: 13,
    title: "Memory Trigger Registry",
    tagline: "Personal, inherited, land, object, oral, archival — what fires memory and how reliable it is.",
    description:
      "Govern CharacterMemory reliability field and future triggers (fragment-linked, sensory). Keeps oral vs factual labeling honest.",
    layer: "Memory",
    buildPhase: 5,
    buildOrderInPhase: 1,
    governs: ["Memory admissibility in simulation", "flashback legality"],
    aiContract: "Memory-assisted generation must show reliability + source link when required.",
    implementedSurfaces: [
      { label: "Character memories", prismaModel: "CharacterMemory" },
      { label: "Fragments (memory type)", href: "/admin/fragments", prismaModel: "Fragment" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "MemoryTriggerDefinition: triggerType, reliabilityDefault, requiredFragmentTypes; optional graph to Symbol.",
  },
  {
    id: "source-to-story-binding",
    ordinal: 14,
    title: "Source-to-Story Binding Registry",
    tagline: "Source → extract → review → canonical → bound narrative object → scene support.",
    description:
      "The transformation pipeline you already approximate with ingestion, fragments, claims, and bindings. Single registry view for audit.",
    layer: "Provenance / pipeline",
    buildPhase: 5,
    buildOrderInPhase: 2,
    governs: ["Extraction quality", "merge decisions", "canonical linkage"],
    aiContract: "No scene Claim without trace path when recordType demands it.",
    implementedSurfaces: [
      { label: "Sources", href: "/admin/sources", prismaModel: "Source" },
      { label: "Ingestion", href: "/admin/ingestion" },
      { label: "Extracted entities", href: "/admin/extracted", prismaModel: "ExtractedEntity" },
      { label: "Fragments", href: "/admin/fragments" },
      { label: "Bindings", href: "/admin/bindings" },
    ],
    implementationStatus: "live",
    nextBuildNotes:
      "BindingAudit view: query EntityLink + Fragment sourceId; optional PipelineRun aggregate table.",
  },
  {
    id: "composition-readiness",
    ordinal: 15,
    title: "Composition Readiness Registry",
    tagline: "No prose unless the scene field is legally populated to draft.",
    description:
      "Gates drafting: checklist derived from Brain metrics + scene/meta-scene completeness. This is the ‘machine that makes prose inevitable’ gate.",
    layer: "Composition",
    buildPhase: 5,
    buildOrderInPhase: 3,
    governs: ["When composer / workspace may publish", "blocking gaps"],
    aiContract: "Blocked readiness returns structured missing-variable list, not generic text.",
    implementedSurfaces: [
      { label: "Brain dashboard", href: "/admin/brain" },
      { label: "Meta scene composer", note: "/admin/meta-scenes/[id]/compose" },
      { label: "Scene intelligence / suggestions", prismaModel: "SceneConstructionSuggestion" },
    ],
    implementationStatus: "partial",
    nextBuildNotes:
      "CompositionReadinessCheck model: sceneId or metaSceneId, checklistJson, pass boolean, computedFrom Brain heuristics.",
  },
];
