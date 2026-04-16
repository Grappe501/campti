# Literary Device Control System (LDCS) Spec

## Purpose

LDCS is a formal literary-style control architecture for Campti. It converts author intent into machine-usable device controls that stay downstream of narrative truth, chapter-state reality, narrative psychology, and beat fidelity.

## Core Objects

### `LiteraryDeviceDefinition`

Defines each device as a constrained capability, not a free-form ornament:

- `deviceId`, `deviceName`, `deviceFamily`, `description`
- `allowedScopes`, `defaultActivationMode`, `defaultDensityBand`
- `allowedContexts`, `forbiddenContexts`
- `compatiblePsychologyModes`, `compatibleChapterModes`, `compatibleThreadTypes`, `compatibleSceneRoles`, `compatibleBeatTypes`
- `nativeCognitionRisk`
- `symbolismBindingRequirement`, `routeSettingBindingRequirement`, `philosophyBindingRequirement`
- `misuseRiskProfile`, `validationFlags`

### `LiteraryDeviceControlSetting`

Author-facing, semantically meaningful controls:

- `activationMode`: `off|subtle|moderate|strong|required`
- `densityBand`: `rare|occasional|patterned|motif_driven`
- `targetScope`: `line|paragraph|scene|chapter|thread|pov|character|book`
- `explicitnessBand`: `implicit|low|moderate|high`
- `allowedContextsOverride`, `forbiddenContextsOverride`
- `targetCarrierModes` (object/image/place/action/sound/etc)
- bindings for symbols, motifs, threads, settings, objects, characters, chapter, scene
- alliteration-specific policy:
  - allowed and forbidden line zones
  - consonant clustering tolerance
  - contextual allowances
  - numeric UI input mapped to semantic density bands

### `LiteraryDeviceApplicationPlan`

Downstream machine plan consumed by prose constraints:

- `activeDeviceIds`, `allowedDeviceSet`, `suppressedDeviceSet`
- `requiredBindingSet`, `deviceContextMatrix`
- placement recommendations/restrictions
- density and misuse warnings
- validation flags

## Required Device Families

- Sound/Rhythm: alliteration, assonance, consonance, euphony/harshness bias, repetition, rhythmic parallelism, cadence shaping, sentence-pressure modulation
- Image/Meaning: symbolism, motif, metaphor, simile, analogy, environmental symbolism, place memory, object resonance
- Structural: foreshadowing, callback, delayed reveal, parallel echo, mirrored structure, fragmentation, convergence tease, recall phrase/image
- Psychological: unreliable perception marker, memory distortion marker, internal/external contrast, interpretive hesitation, omission as tension, selective noticing
- Campti custom: continuity echo, warning pattern, route echo, setting recurrence echo, philosophy echo, thread resonance, generational repetition, place residue, memory-layered callback

## Upstream Mapping Rules

LDCS derivation includes explicit rules:

- High `place_immersion` + active setting thread -> increase environmental symbolism/place memory/route echo
- High `unresolved_pull` + delayed convergence -> increase foreshadowing/callback seed/omission as tension/convergence tease
- Low signal integrity -> increase interpretive hesitation/selective noticing; reduce overt symbolism explicitness
- High relational heat -> allow gesture motifs/repeated dialogue rhythm/omission; suppress ornamental sound-pattern excess
- Active philosophy threads -> prefer action/contrast/warning carriers over direct statement
- High labor pressure -> suppress excessive metaphor; tighten cadence and sentence pressure
- `continuity_chapter` -> elevate continuity echo/place residue/route echo/generational repetition

## Validation Rules

LDCS hard/soft checks include:

- forced alliteration detection
- decorative symbolism with no binding
- callback without source binding
- symbol without recurrence/payoff logic
- motif overload and paragraph/scene density overload
- tone breakage against chapter mode and meaning ceiling
- philosophy preachiness risk
- sound-pattern excess in high-tension decision contexts

Validation outputs:

- hard failures
- soft warnings
- suppression/reduction actions
- cockpit drift diagnostics

## Prose Integration

`LiteraryDeviceApplicationPlan` is mapped into `ProseGenerationConstraints.literaryDeviceConstraints` with:

- sound-pattern allowance
- symbolism allowance
- metaphor/simile allowance
- explicitness ceiling
- closure pressure style
- callback phrase allowance
- place-memory insertion opportunities
- repetition allowance

This keeps literary controls on the canonical prose-control path.

## Cockpit Integration

Authoritative cockpit receives `literaryDevices` section:

- active device panel with activation/density/scope/contexts/risk/status
- alliteration control with numeric->semantic mapping
- symbol registry editor view
- motif registry view
- route echo and philosophy echo controls
- density/misuse/drift warnings
- chapter profile summary + per-scene distribution
