import {
  HumanGravityValidationBundleSchema,
  type HumanGravityRuntimeProfile,
  type HumanGravityTruthResult,
  type HumanGravityValidationBundle,
} from "@/lib/domain/human-gravity-runtime";

const RESET_PHRASES = [
  /\ball was well\b/i,
  /\beverything (was|felt) (fine|normal|okay)\b/i,
  /\bno harm done\b/i,
  /\bforgotten as if it had never\b/i,
];

const SHALLOW_ENDING = [/\bthe end\.\s*$/i, /\band that was that\.\s*$/i];

const RESIDUE_PATTERNS = [
  /\b(silence|stillness)\b/i,
  /\b(distance|strain|weight)\b/i,
  /\b(hesitat|unresolved)\b/i,
  /\b(carried|cost|fracture|withheld)\b/i,
  /\b(awkward|unspoken)\b/i,
  /\b(looked away|stepped back|wouldn'?t meet)\b/i,
  /\b(burden|inherit|duty|ritual|warn)\b/i,
];

function upstreamNoResetPressure(profile: HumanGravityRuntimeProfile): boolean {
  if (!profile.runtimeInfluenceTruth.noResetValidationParticipatesInCanonicalValidity) {
    return false;
  }
  const maxRel = Math.max(0, ...Object.values(profile.relationalThreatMap));
  const consMajor = profile.activeConsequenceMarkers.length >= 2;
  const threatenedBonds = maxRel >= 0.6 && Object.keys(profile.relationalThreatMap).length > 0;
  const burden =
    profile.activeBurdenLines.length + profile.inheritedWarningLines.length >= 1;
  return consMajor || threatenedBonds || burden;
}

function markerEchoInProse(profile: HumanGravityRuntimeProfile, text: string): boolean {
  const tl = text.toLowerCase();
  const blob = [...profile.activeConsequenceMarkers, ...profile.activeBurdenLines].join(" ").toLowerCase();
  const words = blob.split(/\W+/).filter((w) => w.length >= 6);
  return words.some((w) => tl.includes(w.slice(0, Math.min(12, w.length))));
}

function hasExplicitRepairSuppressionTransformation(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\b(suppressed|withheld|couldn'?t (say|bring|speak)|hid|masked|swallowed)\b/.test(t) ||
    /\b(repair|mend|apolog|forgiv|reconcil|make it right)\b/.test(t) ||
    /\b(changed|shifted|learned to|accepted that|no longer (believed|trusted|feared))\b/.test(t) ||
    /\b(transformed|became|paid for|cost (him|her|them))\b/.test(t)
  );
}

function hasBehavioralResidue(text: string): boolean {
  let hits = 0;
  for (const p of RESIDUE_PATTERNS) {
    if (p.test(text)) hits++;
  }
  return hits >= 2 || (text.length > 450 && hits >= 1);
}

/**
 * No-reset rule: when upstream models major consequence / threatened bond / inherited burden pressure,
 * prose must retain behavioral residue or explicitly account (repair, suppression, transformation).
 */
function evaluateNoResetRules(
  profile: HumanGravityRuntimeProfile,
  text: string,
): HumanGravityTruthResult {
  const upstreamNoResetPressureActive = upstreamNoResetPressure(profile);
  const noResetViolations: string[] = [];

  if (!upstreamNoResetPressureActive) {
    return {
      sceneOutputValidUnderNoResetRules: true,
      upstreamNoResetPressureActive: false,
      noResetViolations: [],
    };
  }

  const minLen = 80;
  if (text.trim().length < minLen) {
    noResetViolations.push(
      `no_reset: prose shorter than ${minLen} chars while upstream consequence/bond/burden pressure is active`,
    );
  }

  const residue = hasBehavioralResidue(text) || markerEchoInProse(profile, text);
  const explicit = hasExplicitRepairSuppressionTransformation(text);

  if (!residue && !explicit) {
    noResetViolations.push(
      "no_reset: upstream runtime modeled consequence, threatened bond, and/or inherited burden without behavioral residue, repair, suppression, or transformation accounting in prose",
    );
  }

  for (const r of RESET_PHRASES) {
    if (r.test(text)) {
      noResetViolations.push("no_reset: tidy-reset language while upstream pressure is active");
      break;
    }
  }

  return {
    sceneOutputValidUnderNoResetRules: noResetViolations.length === 0,
    upstreamNoResetPressureActive: true,
    noResetViolations,
  };
}

/**
 * Deterministic validation: shallow/reset advisories + canonical no-reset validity when pressure applies.
 */
export class HumanGravityValidationService {
  validate(input: { profile: HumanGravityRuntimeProfile; generatedText: string }): HumanGravityValidationBundle {
    const text = input.generatedText.trim();
    const weakAttachmentWarnings: string[] = [];
    const weakRelationalStakesWarnings: string[] = [];
    const consequenceResetWarnings: string[] = [];
    const burdenSuppressionWarnings: string[] = [];
    const shallowClosureWarnings: string[] = [];
    const suggestedHardeningActions: string[] = [];

    const humanGravityTruth = evaluateNoResetRules(input.profile, text);

    const maxAtt = Math.max(0, ...Object.values(input.profile.attachmentWeightMap));
    if (maxAtt >= 0.45 && text.length < 220) {
      weakAttachmentWarnings.push("high_attachment_weight_but_very_short_prose_surface");
      suggestedHardeningActions.push("expand embodied cues tied to attachment-weighted characters");
    }

    const maxRel = Math.max(0, ...Object.values(input.profile.relationalThreatMap));
    if (maxRel >= 0.55) {
      const hasRelationalTexture =
        /\b(looked away|wouldn'?t meet|stillness|silence|distance|shoulder|hand|stepped back)\b/i.test(text);
      if (!hasRelationalTexture) {
        weakRelationalStakesWarnings.push("relational_threat_high_but_little_subtext_or_gesture_texture");
        suggestedHardeningActions.push("add proximity, silence, or deferral consistent with threatened bonds");
      }
    }

    if (input.profile.activeConsequenceMarkers.length >= 2) {
      for (const r of RESET_PHRASES) {
        if (r.test(text)) {
          consequenceResetWarnings.push("possible_emotional_reset_language_while_consequence_markers_active");
          suggestedHardeningActions.push("replace tidy resolution with cost, hesitation, or incomplete repair");
          break;
        }
      }
    }

    if (input.profile.activeBurdenLines.length >= 1 && !/\b(ritual|habit|duty|avoid|warn|inherit|silence)\b/i.test(text)) {
      burdenSuppressionWarnings.push("burden_lines_active_but_little_inherited-duty_texture");
      suggestedHardeningActions.push("surface burden through duty-shaped action or withheld speech");
    }

    for (const s of SHALLOW_ENDING) {
      if (s.test(text)) {
        shallowClosureWarnings.push("closure_may_read_too_final_for_carry_forward_profile");
        suggestedHardeningActions.push("prefer pressure_forward residue in final beat");
        break;
      }
    }

    const hardWarnings: string[] = [];
    const softWarnings: string[] = [];
    for (const w of consequenceResetWarnings) hardWarnings.push(w);
    for (const w of weakAttachmentWarnings) softWarnings.push(w);
    for (const w of weakRelationalStakesWarnings) softWarnings.push(w);
    for (const w of burdenSuppressionWarnings) softWarnings.push(w);
    for (const w of shallowClosureWarnings) softWarnings.push(w);

    const penalty = (hardWarnings.length * 0.18 + softWarnings.length * 0.06) / 1.5;
    const humanGravityScore = Math.max(0, Math.min(1, Number((input.profile.humanGravityScore - penalty).toFixed(3))));

    const driftReport = {
      sceneId: input.profile.sceneId,
      weakAttachmentWarnings,
      weakRelationalStakesWarnings,
      consequenceResetWarnings,
      burdenSuppressionWarnings,
      shallowClosureWarnings,
      suggestedHardeningActions: [...new Set(suggestedHardeningActions)],
      humanGravityScore,
      hardWarnings,
      softWarnings,
    };

    const sceneReadsShallowUnderProfile =
      !humanGravityTruth.sceneOutputValidUnderNoResetRules ||
      hardWarnings.length > 0 ||
      softWarnings.length >= 3 ||
      humanGravityScore < 0.35;

    return HumanGravityValidationBundleSchema.parse({
      contractVersion: "1",
      clusterTag: "cluster6_human_gravity_validation",
      sceneId: input.profile.sceneId,
      driftReport,
      sceneReadsShallowUnderProfile,
      humanGravityTruth,
    });
  }
}
