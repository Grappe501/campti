import {
  type BeatAssemblyBeat,
  type BeatAssemblyChain,
  type BeatValidationFlags,
  isBeatTransitionAllowed,
} from "@/lib/domain/beat-assembly";

const MODERN_COGNITION_LEAK_PATTERNS = [
  "trauma response",
  "cognitive bias",
  "anxiety disorder",
  "identity crisis",
  "depression",
  "clinical",
  "psychology model",
];

const RUNTIME_BOUNDARY_BLOCKLIST = [
  "cosmic simulation",
  "nested simulation",
  "metaphysical engine",
  "omniscient field",
];

function includesAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern));
}

function beatTextSurface(beat: BeatAssemblyBeat): string {
  return [
    beat.beatPurpose,
    beat.physicalAction,
    beat.environmentalSignal,
    beat.sensorySignal,
    beat.socialSignal,
    beat.interpretedMeaning,
    beat.memoryTriggered,
    beat.decisionOrAdjustment,
    beat.downstreamRisk,
    beat.stateUpdate,
    beat.salienceReason,
  ].join(" ");
}

export function validateBeat(input: {
  beat: BeatAssemblyBeat;
  previousBeat: BeatAssemblyBeat | null;
}): BeatValidationFlags {
  const { beat, previousBeat } = input;
  const text = beatTextSurface(beat);

  const physicallyGrounded =
    beat.physicalAction.trim().length > 0 &&
    beat.sensorySignal.trim().length > 0 &&
    beat.environmentalSignal.trim().length > 0;
  const observerBounded = beat.visibilityScope.globallyKnownButHiddenFromPov.length <= 3;
  const salienceJustified = beat.salienceReason.trim().length >= 12;
  const modernCognitionLeakFree = !includesAny(text, MODERN_COGNITION_LEAK_PATTERNS);
  const hasStateConsequence = beat.stateUpdate.trim().length > 0 && beat.downstreamRisk.trim().length > 0;
  const chapterOneEscalationSafe =
    previousBeat === null ? beat.pressureLoad <= 0.4 : beat.pressureLoad - previousBeat.pressureLoad <= 0.35;
  const runtimeBoundarySafe = !includesAny(text, RUNTIME_BOUNDARY_BLOCKLIST);

  const notes: string[] = [];
  if (!physicallyGrounded) notes.push("invalid: no physical grounding");
  if (!observerBounded) notes.push("invalid: POV includes too much hidden/global knowledge");
  if (!salienceJustified) notes.push("invalid: salience cannot be justified");
  if (!modernCognitionLeakFree) notes.push("invalid: modern abstract cognition dominates");
  if (!hasStateConsequence) notes.push("invalid: no state consequence");
  if (!chapterOneEscalationSafe) notes.push("invalid: tension escalates too abruptly for chapter 1");
  if (!runtimeBoundarySafe) notes.push("invalid: runtime boundary violation (metaphysical/cosmic)");

  return {
    physicallyGrounded,
    observerBounded,
    salienceJustified,
    modernCognitionLeakFree,
    hasStateConsequence,
    chapterOneEscalationSafe,
    runtimeBoundarySafe,
    notes,
  };
}

export function validateBeatChain(chain: BeatAssemblyChain): { passed: boolean; invalidReasons: string[] } {
  const invalidReasons: string[] = [];
  for (let index = 0; index < chain.beats.length; index += 1) {
    const current = chain.beats[index];
    const previous = index > 0 ? chain.beats[index - 1] : null;
    if (previous && !isBeatTransitionAllowed(previous.beatType, current.beatType)) {
      invalidReasons.push(`invalid transition: ${previous.beatType} -> ${current.beatType} at beat ${current.beatId}`);
    }
    const allFlagsPass = Object.entries(current.validationFlags)
      .filter(([key]) => key !== "notes")
      .every(([, value]) => value === true);
    if (!allFlagsPass) {
      invalidReasons.push(
        ...current.validationFlags.notes.map((note) => `${current.beatId}: ${note}`),
      );
    }
  }
  return {
    passed: invalidReasons.length === 0,
    invalidReasons,
  };
}
