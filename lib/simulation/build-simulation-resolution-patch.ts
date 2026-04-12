import { buildActionCandidateFromLabel } from "@/lib/decision-trace/decision-trace-deterministic";
import type { ActionCandidate } from "@/lib/domain/decision-trace";
import type { CharacterCognitionFrame } from "@/lib/domain/cognition";
import type {
  SimulationResolutionPatch,
  SimulationVariableOverride,
} from "@/lib/domain/simulation-run";
import { SimulationOverrideKey } from "@/lib/domain/simulation-run";

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const x = Number(v.trim());
    if (Number.isFinite(x)) return x;
  }
  return null;
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

/**
 * Maps dot-notation override keys into a deterministic `SimulationResolutionPatch`.
 * Unknown keys are ignored here but preserved in `unparsed` for audit.
 */
export function buildSimulationResolutionPatch(
  overrides: SimulationVariableOverride[]
): { patch: SimulationResolutionPatch; unparsed: SimulationVariableOverride[] } {
  const patch: SimulationResolutionPatch = {};
  const unparsed: SimulationVariableOverride[] = [];

  for (const o of overrides) {
    const k = o.key.trim();
    const v = o.overrideValue;
    let consumed = false;

    switch (k) {
      case SimulationOverrideKey.worldStateReferenceId:
        if (typeof v === "string" && v.trim()) {
          patch.worldStateReferenceId = v.trim();
          consumed = true;
        }
        break;
      case SimulationOverrideKey.embodimentPain: {
        const n = num(v);
        if (n != null) {
          patch.embodiment = { ...patch.embodiment, painLevel: Math.round(n) };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.embodimentHunger: {
        const n = num(v);
        if (n != null) {
          patch.embodiment = { ...patch.embodiment, hungerLevel: Math.round(n) };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.embodimentFatigue: {
        const n = num(v);
        if (n != null) {
          patch.embodiment = { ...patch.embodiment, fatigueLevel: Math.round(n) };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.embodimentIllness: {
        const n = num(v);
        if (n != null) {
          patch.embodiment = { ...patch.embodiment, illnessLevel: Math.round(n) };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.embodimentSensory: {
        const n = num(v);
        if (n != null) {
          patch.embodiment = { ...patch.embodiment, sensoryDisruptionLevel: Math.round(n) };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.embodimentMobility: {
        const s = str(v);
        if (s != null) {
          patch.embodiment = { ...patch.embodiment, mobilityConstraint: s };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.embodimentInjury: {
        const s = str(v);
        if (s != null) {
          patch.embodiment = { ...patch.embodiment, injuryDescription: s };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.snapshotCurrentFear: {
        const s = str(v);
        if (s != null) {
          patch.stateSnapshot = { ...patch.stateSnapshot, currentFear: s };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.snapshotCurrentAnger: {
        const s = str(v);
        if (s != null) {
          patch.stateSnapshot = { ...patch.stateSnapshot, currentAnger: s };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.snapshotCurrentSocialRisk: {
        const s = str(v);
        if (s != null) {
          patch.stateSnapshot = { ...patch.stateSnapshot, currentSocialRisk: s };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.snapshotCurrentHope: {
        const s = str(v);
        if (s != null) {
          patch.stateSnapshot = { ...patch.stateSnapshot, currentHope: s };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.snapshotForbiddenDesire: {
        const n = num(v);
        if (n != null) {
          patch.stateSnapshot = {
            ...patch.stateSnapshot,
            currentForbiddenDesirePressure: Math.round(n),
          };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.desireVisibilityRisk: {
        const n = num(v);
        if (n != null) {
          patch.worldDesireEnvironment = {
            ...patch.worldDesireEnvironment,
            visibilityRiskForDesire: Math.round(n),
          };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.desirePunishment:
      case SimulationOverrideKey.lawPunishment: {
        const n = num(v);
        if (n != null) {
          patch.worldDesireEnvironment = {
            ...patch.worldDesireEnvironment,
            punishmentSeverityForForbiddenDesire: Math.round(n),
          };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.tabooSeverity: {
        const n = num(v);
        if (n != null) {
          patch.worldDesireEnvironment = {
            ...patch.worldDesireEnvironment,
            eroticTabooSeverity: Math.round(n),
          };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.socialRiskScalar: {
        const n = num(v);
        if (n != null) {
          patch.stateSnapshot = {
            ...patch.stateSnapshot,
            currentSocialRisk: String(Math.round(n)),
          };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.attachmentApproval: {
        const n = num(v);
        if (n != null) {
          patch.attachmentLonging = {
            ...patch.attachmentLonging,
            approvalSensitivity: Math.round(n),
          };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.attachmentAbandonment: {
        const n = num(v);
        if (n != null) {
          patch.attachmentLonging = {
            ...patch.attachmentLonging,
            abandonmentAche: Math.round(n),
          };
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.relationshipTrustBias: {
        const n = num(v);
        if (n != null) {
          patch.relationshipTrustBias = Math.round(n);
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.thoughtLanguageRenderMode: {
        if (typeof v === "string" && v.trim()) {
          patch.translationRenderMode = v.trim();
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.approximateStoryYear: {
        const n = num(v);
        if (n != null) {
          patch.approximateStoryYear = Math.round(n);
          consumed = true;
        }
        break;
      }
      case SimulationOverrideKey.selectedActionCandidate: {
        if (typeof v === "string" && v.trim()) {
          patch.selectedActionCandidate = buildActionCandidateFromLabel(v.trim());
          consumed = true;
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
          const o = v as Partial<ActionCandidate> & { label?: string };
          if (typeof o.label === "string" && o.label.trim()) {
            patch.selectedActionCandidate = buildActionCandidateFromLabel(o.label.trim(), o);
            consumed = true;
          }
        }
        break;
      }
      default:
        break;
    }

    if (!consumed) {
      const pairM = /^relationship\.pair\.([^.\s]+)\.trustBias$/.exec(k);
      if (pairM) {
        const otherId = pairM[1];
        const n = num(v);
        if (n != null && otherId) {
          patch.relationshipPairTrust = {
            ...patch.relationshipPairTrust,
            [otherId]: Math.round(n),
          };
          consumed = true;
        }
      }
    }

    if (!consumed) {
      unparsed.push(o);
    }
  }

  return { patch, unparsed };
}

/** Fill `priorValue` on overrides when missing, using the base cognition frame (deterministic). */
export function annotateOverridesWithPriorFromBase(
  frame: CharacterCognitionFrame,
  overrides: SimulationVariableOverride[]
): SimulationVariableOverride[] {
  return overrides.map((o) => {
    if (o.priorValue !== undefined && o.priorValue !== null) return o;
    const prior = extractPriorValueForOverrideKey(frame, o.key.trim());
    return { ...o, priorValue: prior };
  });
}

export function extractPriorValueForOverrideKey(
  frame: CharacterCognitionFrame,
  key: string
): unknown {
  switch (key) {
    case SimulationOverrideKey.embodimentPain:
      return frame.characterPhysicalState.painLevel;
    case SimulationOverrideKey.embodimentHunger:
      return frame.characterPhysicalState.hungerLevel;
    case SimulationOverrideKey.embodimentFatigue:
      return frame.characterPhysicalState.fatigueLevel;
    case SimulationOverrideKey.embodimentIllness:
      return frame.characterPhysicalState.illnessLevel;
    case SimulationOverrideKey.embodimentSensory:
      return frame.characterPhysicalState.sensoryDisruptionLevel;
    case SimulationOverrideKey.embodimentMobility:
      return frame.characterPhysicalState.mobilityConstraint;
    case SimulationOverrideKey.embodimentInjury:
      return frame.characterPhysicalState.injuryDescription;
    case SimulationOverrideKey.worldStateReferenceId:
      return frame.effectiveWorldState?.id ?? null;
    case SimulationOverrideKey.desireVisibilityRisk:
      return frame.worldDesireEnvironment.visibilityRiskForDesire;
    case SimulationOverrideKey.desirePunishment:
    case SimulationOverrideKey.lawPunishment:
      return frame.worldDesireEnvironment.punishmentSeverityForForbiddenDesire;
    case SimulationOverrideKey.tabooSeverity:
      return frame.worldDesireEnvironment.eroticTabooSeverity;
    case SimulationOverrideKey.snapshotCurrentFear:
      return frame.stateSnapshot?.currentFear ?? null;
    case SimulationOverrideKey.snapshotCurrentAnger:
      return frame.stateSnapshot?.currentAnger ?? null;
    case SimulationOverrideKey.snapshotCurrentSocialRisk:
      return frame.stateSnapshot?.currentSocialRisk ?? null;
    case SimulationOverrideKey.snapshotCurrentHope:
      return frame.stateSnapshot?.currentHope ?? null;
    case SimulationOverrideKey.snapshotForbiddenDesire:
      return frame.stateSnapshot?.currentForbiddenDesirePressure ?? null;
    case SimulationOverrideKey.attachmentApproval:
      return frame.attachmentLongingProfile.approvalSensitivity;
    case SimulationOverrideKey.attachmentAbandonment:
      return frame.attachmentLongingProfile.abandonmentAche;
    case SimulationOverrideKey.thoughtLanguageRenderMode:
      return frame.coreProfile?.translationRenderMode ?? null;
    default:
      return null;
  }
}
