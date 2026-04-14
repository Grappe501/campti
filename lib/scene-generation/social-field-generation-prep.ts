/**
 * Deterministic translation: SocialFieldContext V2 → short phrases + narrative guidance for scene generation.
 * Export individual builders for tests and custom assembly; bundle composes the same strings.
 */

import type { SocialFieldContext } from "@/lib/domain/population-social-field";
import type { SceneGenerationSocialBundleV1 } from "@/lib/domain/scene-generation-social";
import { SCENE_GENERATION_SOCIAL_VERSION } from "@/lib/domain/scene-generation-social";

function bucket(low: number, mid: number, hi: number, v: number): "low" | "mid" | "high" {
  if (v < low) return "low";
  if (v < mid) return "mid";
  return "high";
}

function intensityScore(sf: SocialFieldContext): number {
  const w =
    sf.witnessRisk * 0.22 +
    sf.gossipPressure * 0.22 +
    sf.authorityPressure * 0.18 +
    sf.kinProximityPressure * 0.18 +
    sf.householdVisibility * 0.12 +
    sf.tabooAmplification * 0.08;
  return Math.min(1, Math.max(0, w));
}

/** Witness / exposure — behavioral: caution, performance, who might see or hear. */
export function buildWitnessPressureSummary(sf: SocialFieldContext): string {
  const w = bucket(0.28, 0.55, 1, sf.witnessRisk);
  if (w === "low") {
    return "Others are unlikely to be within earshot or sight; solitude is easier, isolation may still bite.";
  }
  if (w === "mid") {
    return "Others are likely nearby even if unseen—voice and movement carry; discretion is sane.";
  }
  return "Exposure is high: assume witnesses may exist off-frame; posture and speech should show that awareness.";
}

/** Gossip / rumor velocity — behavioral: reputation, shame, repetition. */
export function buildGossipPressureSummary(sf: SocialFieldContext): string {
  const w = bucket(0.28, 0.55, 1, sf.gossipPressure);
  const spread =
    sf.contractVersion === "2"
      ? sf.socialBreakdown.gossip.gossipSpreadFactor
      : sf.gossipPressure;
  const s = bucket(0.3, 0.55, 1, spread);
  if (w === "low" && s !== "high") {
    return "Word moves slowly; scandal is still possible but less electrically charged.";
  }
  if (w === "mid") {
    return "Word could spread quickly—listeners may trade stories; faces and silence matter.";
  }
  return "Gossip is a live wire—assume repetition; secrecy and coded speech are rational.";
}

/** Law, church, class, patrol — behavioral: deference, timing of defiance. */
export function buildAuthorityAtmosphereSummary(sf: SocialFieldContext): string {
  const w = bucket(0.3, 0.58, 1, sf.authorityPressure);
  if (sf.contractVersion === "2") {
    const a = sf.socialBreakdown.authority;
    const parts: string[] = [];
    if (a.churchAuthorityPressure > 0.45) parts.push("church scrutiny");
    if (a.militaryAuthorityPressure > 0.4) parts.push("military or patrol presence");
    if (a.civilAuthorityPressure > 0.42) parts.push("civil or legal eyes");
    if (a.eliteClassPressure > 0.42) parts.push("class hierarchy");
    if (parts.length && w !== "low") {
      return `Authority presence makes open conflict risky—${parts.join(", ")} tighten what can be said aloud.`;
    }
  }
  if (w === "low") {
    return "Formal power feels distant; custom and kin may matter more than uniforms.";
  }
  if (w === "mid") {
    return "Authority is close enough to punish spectacle—pick battles and timing.";
  }
  return "Power is thick here—permission, humiliation, and spectacle are plausible stakes.";
}

/** Kin and household obligation — behavioral: loyalty, shame, obligation. */
export function buildKinVisibilitySummary(sf: SocialFieldContext): string {
  const w = bucket(0.28, 0.55, 1, sf.kinProximityPressure);
  const clusters =
    sf.contractVersion === "2" ? sf.socialBreakdown.kin.clusters.length : 0;
  if (w === "low" && clusters <= 1) {
    return "Kin networks are not crowding the moment; bonds may still tug quietly.";
  }
  if (clusters >= 3 || w === "high") {
    return "Word could spread quickly through kin—loyalty and betrayal travel along family lines.";
  }
  return "Relatives are close enough to judge, shelter, or trade shame—household truth travels fast.";
}

/** Household crowding — behavioral: thin walls, overlapping bodies, no true privacy. */
export function buildHouseholdDensityHint(sf: SocialFieldContext): string {
  const w = bucket(0.25, 0.5, 1, sf.householdVisibility);
  if (w === "low") {
    return "Domestic crowding is modest; still ask who shares a roof and who listens.";
  }
  if (w === "mid") {
    return "Household density is high—chores, elders, children, and shared air compete with secrets.";
  }
  return "Behind the door is still a crowd—everyone inside can testify.";
}

/** Ambient population scale — sensory background, not a census. */
export function buildAmbientPopulationSummary(sf: SocialFieldContext): string {
  const d = sf.nearbyPopulationDensity;
  if (d < 0.18) {
    return "The slice feels sparsely peopled—encounters can feel contingent; stillness can loom.";
  }
  if (d < 0.42) {
    return "Enough bodies exist that strangers, neighbors, and overlap are plausible texture.";
  }
  return "The slice is densely peopled—sound, queues, and glances can press without naming anyone.";
}

/** Taboo + witness + gossip composite — “invisible” social skin. */
export function buildInvisiblePressureSummary(sf: SocialFieldContext): string {
  const tab = bucket(0.28, 0.52, 1, sf.tabooAmplification);
  const vis =
    sf.contractVersion === "2" ? sf.socialBreakdown.witness.visibilityFalloff01 : 0.4;
  const parts = [
    buildWitnessPressureSummary(sf),
    buildGossipPressureSummary(sf),
    tab === "high"
      ? "Forbidden wants feel dangerous to show—self-policing and hesitation are believable."
      : "Want and restraint need not match; the social skin varies by moment.",
  ];
  if (sf.contractVersion === "2" && vis > 0.55) {
    parts.push("Distance weakens cover—local shame may not stay local.");
  }
  return parts.join(" ");
}

/** Primary paragraph for prompts: ambient population + witness + gossip + authority. */
export function buildSceneSocialGenerationSummary(sf: SocialFieldContext): string {
  return [
    buildAmbientPopulationSummary(sf),
    buildWitnessPressureSummary(sf),
    buildGossipPressureSummary(sf),
    buildAuthorityAtmosphereSummary(sf),
  ].join(" ");
}

/**
 * Full bundle for contract persistence + QA. Uses the same exported strings.
 */
export function buildSceneSocialGenerationBundle(sf: SocialFieldContext): SceneGenerationSocialBundleV1 {
  const pressureIntensityScore = intensityScore(sf);
  return {
    contractVersion: SCENE_GENERATION_SOCIAL_VERSION,
    pressureIntensityScore,
    socialFieldSummaryForGeneration: buildSceneSocialGenerationSummary(sf),
    invisiblePressureSummary: buildInvisiblePressureSummary(sf),
    witnessRiskSummary: buildWitnessPressureSummary(sf),
    gossipRiskSummary: buildGossipPressureSummary(sf),
    authorityAtmosphereSummary: buildAuthorityAtmosphereSummary(sf),
    kinVisibilitySummary: buildKinVisibilitySummary(sf),
    householdDensityHint: buildHouseholdDensityHint(sf),
    nearbyPopulationHint: buildAmbientPopulationSummary(sf),
  };
}
