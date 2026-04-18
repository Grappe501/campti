import { createHash } from "node:crypto";

import type { CharacterMindProfile } from "@/lib/domain/character-mind";
import type { CharacterVoiceProfile } from "@/lib/domain/character-voice";
import type {
  CharacterSimulationPreviewMode,
  CharacterSimulationPreviewRequest,
  CharacterSimulationPreviewResult,
} from "@/lib/domain/character-simulation-workbench";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function stablePreviewId(payload: string): string {
  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

function pickPhrase(seed: number, list: string[]): string {
  if (!list.length) return "";
  return list[Math.abs(seed) % list.length]!;
}

/**
 * Deterministic, non-LLM preview — explains posture without pretending to be scene generation.
 */
export function buildCharacterSimulationPreview(input: {
  request: CharacterSimulationPreviewRequest;
  mergedMind: CharacterMindProfile;
  mergedVoice: CharacterVoiceProfile;
  driftWarnings: string[];
  /** True when any author-owned partial exists on the bundle (merged !== pure seed for at least one authored key). */
  usesAuthorOverlay: boolean;
}): CharacterSimulationPreviewResult {
  const { request, mergedMind, mergedVoice, driftWarnings, usesAuthorOverlay } = input;
  const basisPayload = JSON.stringify({
    mode: request.mode,
    stimulus: request.stimulus,
    mind: mergedMind,
    voice: mergedVoice,
  });
  const deterministicPreviewId = stablePreviewId(basisPayload);
  const seed = parseInt(deterministicPreviewId.slice(0, 8), 16) || 1;

  const hasBlockingDrift = driftWarnings.some((w) => w.toLowerCase().includes("blocking"));

  const mindWeight = clamp01(0.45 + (mergedMind.changeResistance ?? 0.5) * 0.1);
  const voiceWeight = clamp01(0.4 + (mergedVoice.vocabularyRange === "wide" ? 0.15 : 0));

  const influences = [
    {
      fieldGroup: "mind.desire",
      weight: mindWeight,
      rationale: `Core desire and fear threshold (${mergedMind.fearProfile.fearActivationThreshold.toFixed(2)}) steer pressure response.`,
    },
    {
      fieldGroup: "voice.texture",
      weight: voiceWeight,
      rationale: `Cadence (${mergedVoice.cadenceProfile}) and metaphor domain (${mergedVoice.metaphorDomain}) shape surface wording.`,
    },
  ];

  const text = synthesizePreviewText(request.mode, request.stimulus, mergedMind, mergedVoice, seed);

  const structuralHoles =
    !mergedMind.beliefSystem.coreBeliefs.length ||
    !mergedVoice.tabooBoundaries.length ||
    mergedMind.coreDesire.trim().length < 8;

  let confidenceLabel: CharacterSimulationPreviewResult["confidenceLabel"] = "high";
  let completeness = 0.82;
  if (structuralHoles || hasBlockingDrift) {
    confidenceLabel = "low";
    completeness = 0.28;
  } else if (driftWarnings.length) {
    confidenceLabel = "medium";
    completeness = 0.55;
  }

  const truthBasis: CharacterSimulationPreviewResult["truthBasis"] = usesAuthorOverlay ? "merged" : "derived";

  return {
    text,
    completeness,
    confidenceLabel,
    truthBasis,
    influences,
    driftWarnings,
    deterministicPreviewId,
  };
}

function synthesizePreviewText(
  mode: CharacterSimulationPreviewMode,
  stimulus: string,
  mind: CharacterMindProfile,
  voice: CharacterVoiceProfile,
  seed: number
): string {
  const hook = stimulus.trim().slice(0, 160);
  const fear = mind.fearProfile.primaryFearId;
  const desire = mind.coreDesire.slice(0, 120);
  const monologue = voice.internalMonologueStyle.slice(0, 120);
  const stress = voice.stressVoiceShiftPattern;

  switch (mode) {
    case "inner_monologue":
      return [
        `Stimulus: “${hook}”.`,
        `Interior: ${monologue}`,
        `Pressure routes through ${fear}; desire anchor: “${desire}”.`,
        `This preview is deterministic synthesis, not generated scene prose.`,
      ].join(" ");
    case "spoken_response":
      return [
        `Stimulus: “${hook}”.`,
        `Spoken posture (${voice.spokenDialogueStyle.slice(0, 120)}): short, guarded clauses; deflection: ${voice.deflectionPattern.slice(0, 100)}.`,
        `Conflict speech: ${voice.conflictSpeechPattern.slice(0, 120)}.`,
      ].join(" ");
    case "stress_response":
      return [
        `Stimulus: “${hook}”.`,
        `Stress shift: ${stress}.`,
        `Suppression habit: ${mind.emotionalSuppressionStyle}.`,
        `Breaking-point proximity if accusation is public: ${mind.breakingPointConditions[0] ?? "unspecified"}.`,
      ].join(" ");
    case "decision_bias":
      return [
        `Stimulus: “${hook}”.`,
        `Decision style: ${mind.decisionStyle}; change resistance ${mind.changeResistance.toFixed(2)}.`,
        `Moral boundary (sample key): ${Object.keys(mind.moralBoundaryMap)[0] ?? "none"} → ${Object.values(mind.moralBoundaryMap)[0] ?? "—"}.`,
      ].join(" ");
    case "interpersonal_reaction":
      return [
        `Stimulus: “${hook}”.`,
        `Attachment read: ${mind.attachmentStyle}; conflict style: ${mind.conflictStyle}.`,
        `Intimacy speech leak vector: ${voice.intimacySpeechPattern.slice(0, 120)}.`,
        `Phrase picked for cadence stability: “${pickPhrase(seed, ["Wait.", "Not here.", "Say it plain.", "I heard you."])}”`,
      ].join(" ");
    default: {
      const _exhaustive: never = mode;
      return `Preview mode unsupported: ${String(_exhaustive)}`;
    }
  }
}
