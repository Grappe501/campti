import type { ResolvedCognitionLayer } from "@/lib/domain/cognition";
import type { CharacterPhysicalState, EmbodiedCognitionEffects } from "@/lib/domain/embodiment";
import type { RankedCognitionItem } from "@/lib/domain/inner-voice";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Map body scalar bands into normalized cognition pressures (deterministic).
 */
export function deriveEmbodiedEffectsFromState(state: CharacterPhysicalState): EmbodiedCognitionEffects {
  const p = state.painLevel / 100;
  const h = state.hungerLevel / 100;
  const f = state.fatigueLevel / 100;
  const i = state.illnessLevel / 100;
  const s = state.sensoryDisruptionLevel / 100;

  const urgencyAmplification = clamp01(0.35 * h + 0.45 * p + 0.15 * i);
  const emotionalVolatilityShift = clamp(
    0.55 * f + 0.35 * i + 0.25 * p - 0.15 * (1 - f),
    -0.45,
    0.55
  );
  const focusNarrowing = clamp01(0.5 * p + 0.45 * s + 0.2 * h);
  const impulseIncrease = clamp01(0.45 * h + 0.35 * p + 0.3 * f + 0.2 * i);

  const parts: string[] = [];
  if (p > 0.25) parts.push(`Pain crowds the edges of attention (${state.painLevel}/100).`);
  if (h > 0.35) parts.push(`Hunger pulls thought toward food, warmth, relief (${state.hungerLevel}/100).`);
  if (f > 0.35) parts.push(`Fatigue dulls sustained reasoning (${state.fatigueLevel}/100).`);
  if (i > 0.25) parts.push(`Illness warms or cools judgment unevenly (${state.illnessLevel}/100).`);
  if (s > 0.25) parts.push(`Senses are unreliable or noisy (${state.sensoryDisruptionLevel}/100).`);
  if (state.injuryDescription.trim())
    parts.push(`Injury/condition note: ${state.injuryDescription.trim()}.`);
  if (state.mobilityConstraint.trim())
    parts.push(`Movement constraint: ${state.mobilityConstraint.trim()}.`);

  const perceptionDistortion =
    parts.length > 0
      ? parts.join(" ")
      : "Body load is light; perception is relatively steady for the moment.";

  return {
    perceptionDistortion,
    urgencyAmplification,
    emotionalVolatilityShift,
    focusNarrowing,
    impulseIncrease,
  };
}

function renumberStack(items: RankedCognitionItem[]): RankedCognitionItem[] {
  return items.map((it, idx) => ({ ...it, rank: idx + 1 }));
}

function dedupeLabels(items: RankedCognitionItem[]): RankedCognitionItem[] {
  const seen = new Set<string>();
  const out: RankedCognitionItem[] = [];
  for (const it of items) {
    const k = it.label.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ ...it, label: k });
  }
  return out;
}

/**
 * Apply embodiment after Enneagram shaping: adjusts stacks and perceived reality without replacing structure.
 */
export function applyEmbodimentToResolvedCognition(
  layer: ResolvedCognitionLayer,
  effects: EmbodiedCognitionEffects,
  state: CharacterPhysicalState
): ResolvedCognitionLayer {
  const bodyLead = effects.urgencyAmplification > 0.45 || state.hungerLevel >= 60;
  const irritable = effects.emotionalVolatilityShift > 0.2 || state.painLevel >= 55;

  let perceivedReality = layer.perceivedReality;
  perceivedReality = `${perceivedReality} Embodied read: ${effects.perceptionDistortion}`;

  const activeMotives = [...layer.activeMotives];
  if (bodyLead) {
    activeMotives.unshift(
      `Immediate bodily priority (urgency ${(effects.urgencyAmplification * 100).toFixed(0)}/100).`
    );
  }
  if (state.hungerLevel >= 50) {
    activeMotives.unshift(`Survival pull: hunger and sustenance rank high (${state.hungerLevel}/100).`);
  }

  const fearExtras: RankedCognitionItem[] = [];
  if (state.painLevel >= 40) {
    fearExtras.push({
      rank: 0,
      label: `Physical pain shortens foresight and patience (${state.painLevel}/100).`,
    });
  }
  if (state.fatigueLevel >= 55) {
    fearExtras.push({
      rank: 0,
      label: `Exhaustion invites mistakes, slowness, or misreads (${state.fatigueLevel}/100).`,
    });
  }
  if (state.illnessLevel >= 40) {
    fearExtras.push({
      rank: 0,
      label: `Sickness skews heat, fear, and hope unevenly (${state.illnessLevel}/100).`,
    });
  }
  if (effects.focusNarrowing > 0.45) {
    fearExtras.push({
      rank: 0,
      label: "Tunnel focus may miss wider social threats until too late.",
    });
  }

  const fearStack = renumberStack(
    dedupeLabels([...fearExtras, ...layer.fearStack.map((x) => ({ ...x, rank: 0 }))])
  );

  const obligationExtras: RankedCognitionItem[] = [];
  if (state.painLevel >= 45 || state.illnessLevel >= 45) {
    obligationExtras.push({
      rank: 0,
      label: "Endure the body’s demand without showing weakness where it costs status.",
    });
  }

  const obligationStack = renumberStack(
    dedupeLabels([...obligationExtras, ...layer.obligationStack.map((x) => ({ ...x, rank: 0 }))])
  );

  const decisionBiases = [...layer.decisionBiases];
  if (effects.impulseIncrease > 0.35) {
    decisionBiases.unshift(
      `Impulse tilt ${(effects.impulseIncrease * 100).toFixed(0)}: favor quick relief over long calculation.`
    );
  }
  if (irritable) {
    decisionBiases.unshift("Irritability: small slights read larger than intended.");
  }
  if (effects.emotionalVolatilityShift < -0.15) {
    decisionBiases.push("Flat affect: feelings arrive late or muffled.");
  }

  let identityConflict = layer.identityConflict;
  if (bodyLead && state.hungerLevel >= 55) {
    identityConflict = `${identityConflict} | Body need contests pride and public face.`.trim();
  }

  return {
    perceivedReality,
    activeMotives,
    suppressedMotives: layer.suppressedMotives,
    fearStack,
    obligationStack,
    identityConflict,
    decisionBiases,
  };
}

/** Same as `applyEmbodimentToResolvedCognition` (domain naming). */
export const applyEmbodimentToCognitionFrame = applyEmbodimentToResolvedCognition;
