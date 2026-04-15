/**
 * Phase 2 / Chunk 4 — Memory Activation Engine (bounded, deterministic).
 *
 * No prose generation, no unbounded retrieval, no cross-plane leakage.
 */
import {
  MEMORY_ACTIVATION_CONTRACT_VERSION,
  type ActivatedMemory,
  type MemoryActivationCandidate,
  type MemoryActivationChannel,
  type MemoryActivationContext,
  type MemoryActivationSummary,
} from "@/lib/domain/memory-activation";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";

const MAX_ACTIVATED_MEMORIES = 6;
const MAX_SUMMARY_TOKEN_LEN = 80;

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function disclosureRiskFromScore(value: number): "low" | "moderate" | "high" {
  if (value >= 70) return "high";
  if (value >= 45) return "moderate";
  return "low";
}

function distortionRiskFromScore(value: number): "low" | "moderate" | "high" {
  if (value >= 70) return "high";
  if (value >= 45) return "moderate";
  return "low";
}

function emotionalColorFromIntensity(value: number): "calm" | "tense" | "charged" {
  if (value >= 75) return "charged";
  if (value >= 40) return "tense";
  return "calm";
}

function normalizeSummaryToken(raw: string): string {
  const token = raw.trim().replace(/\s+/g, " ");
  if (!token) return "memory_ref";
  if (token.length <= MAX_SUMMARY_TOKEN_LEN) return token;
  return `${token.slice(0, MAX_SUMMARY_TOKEN_LEN - 1)}…`;
}

function sourceAllowed(input: {
  context: MemoryActivationContext;
  channel: MemoryActivationChannel;
  candidate: MemoryActivationCandidate;
}): boolean {
  const source = input.candidate.sourceType;
  if (input.context === "scene_mode") {
    if (source === "reader_interaction_memory") return false;
    if (input.channel === "canonical_dyad") return true;
    return source !== "canonical_lived_event";
  }
  // interaction_mode
  if (input.channel === "canonical_dyad" && source === "reader_interaction_memory") {
    return false;
  }
  return true;
}

function activationWeight(candidate: MemoryActivationCandidate): number {
  const relevance = clamp0to100(candidate.contextualRelevance);
  const emotional = clamp0to100(candidate.emotionalIntensity);
  const unresolved = clamp0to100(candidate.unresolvedStatus);
  const linkage = clamp0to100(candidate.relationshipLinkage);
  const recency = clamp0to100(candidate.recency);
  const salience = clamp0to100(candidate.shameFearSalience);
  const repetition = clamp0to100(candidate.repetition);
  const suppression = clamp0to100(candidate.suppressionPressure);

  const score =
    relevance * 0.24 +
    emotional * 0.14 +
    unresolved * 0.16 +
    linkage * 0.12 +
    recency * 0.1 +
    salience * 0.1 +
    repetition * 0.08 -
    suppression * 0.12;
  return clamp0to100(score);
}

function activationMode(input: {
  score: number;
  candidate: MemoryActivationCandidate;
  distortionScore: number;
}): ActivatedMemory["activationMode"] {
  const suppression = clamp0to100(input.candidate.suppressionPressure);
  const emotional = clamp0to100(input.candidate.emotionalIntensity);
  const relevance = clamp0to100(input.candidate.contextualRelevance);
  const repetition = clamp0to100(input.candidate.repetition);
  const unresolved = clamp0to100(input.candidate.unresolvedStatus);

  if (suppression >= 75 && relevance >= 55) return "defensive_avoidance";
  if (repetition >= 70 && unresolved >= 55) return "repetitive_fixation";
  if (emotional >= 78 && relevance <= 48) return "bodily_recollection";
  if (input.distortionScore >= 70) return "misattributed_association";
  if (input.score >= 72) return "clear_recall";
  return "partial_recall";
}

function distortionScore(candidate: MemoryActivationCandidate): number {
  const suppression = clamp0to100(candidate.suppressionPressure);
  const salience = clamp0to100(candidate.shameFearSalience);
  const recencyPenalty = 100 - clamp0to100(candidate.recency);
  return clamp0to100(suppression * 0.4 + salience * 0.3 + recencyPenalty * 0.3);
}

function activationReasons(input: {
  candidate: MemoryActivationCandidate;
  score: number;
  distortionScoreValue: number;
}): string[] {
  const reasons: string[] = [];
  if (clamp0to100(input.candidate.contextualRelevance) >= 60) reasons.push("contextual_relevance_high");
  if (clamp0to100(input.candidate.emotionalIntensity) >= 60) reasons.push("emotional_intensity_high");
  if (clamp0to100(input.candidate.unresolvedStatus) >= 60) reasons.push("unresolved_status_high");
  if (clamp0to100(input.candidate.relationshipLinkage) >= 55) reasons.push("relationship_linkage_present");
  if (clamp0to100(input.candidate.repetition) >= 60) reasons.push("repetition_pattern_present");
  if (clamp0to100(input.candidate.suppressionPressure) >= 65) reasons.push("suppression_pressure_present");
  if (input.distortionScoreValue >= 60) reasons.push("distortion_pressure_present");
  if (input.score >= 70) reasons.push("activation_weight_high");
  return reasons.slice(0, 6);
}

function dominantMode(activated: ActivatedMemory[]): ActivatedMemory["activationMode"] | null {
  if (activated.length === 0) return null;
  const counts = new Map<ActivatedMemory["activationMode"], number>();
  for (const item of activated) {
    counts.set(item.activationMode, (counts.get(item.activationMode) ?? 0) + 1);
  }
  let best: ActivatedMemory["activationMode"] = activated[0]!.activationMode;
  let bestCount = counts.get(best) ?? 0;
  for (const [mode, count] of counts.entries()) {
    if (count > bestCount) {
      best = mode;
      bestCount = count;
    }
  }
  return best;
}

function assertChannelBoundaryForCandidate(input: {
  channel: MemoryActivationChannel;
  candidate: MemoryActivationCandidate;
}): void {
  // Activation outputs influence character-bounded cognition state.
  assertMemoryBoundary({
    source: input.candidate.sourcePlane,
    target: "character_bounded_knowledge",
    payload: {
      memoryRefId: input.candidate.memoryRefId,
      sourceType: input.candidate.sourceType,
      channel: input.channel,
    },
  });
}

export function activateBoundedMemories(input: {
  context: MemoryActivationContext;
  channel: MemoryActivationChannel;
  candidates: MemoryActivationCandidate[];
}): MemoryActivationSummary {
  const blockedSourceRefs: string[] = [];
  const accepted: ActivatedMemory[] = [];

  for (const candidate of input.candidates) {
    if (!sourceAllowed({ context: input.context, channel: input.channel, candidate })) {
      blockedSourceRefs.push(candidate.memoryRefId);
      continue;
    }
    assertChannelBoundaryForCandidate({
      channel: input.channel,
      candidate,
    });
    const score = activationWeight(candidate);
    if (score < 30) continue;
    const distortion = distortionScore(candidate);
    const mode = activationMode({
      score,
      candidate,
      distortionScore: distortion,
    });
    const disclosureRiskScore = clamp0to100(
      candidate.shameFearSalience * 0.5 + (candidate.socialRiskProxy ?? 50) * 0.5
    );
    accepted.push({
      memoryRefId: candidate.memoryRefId,
      sourceType: candidate.sourceType,
      activationReason: activationReasons({
        candidate,
        score,
        distortionScoreValue: distortion,
      }),
      activationWeight: score,
      emotionalColor: emotionalColorFromIntensity(candidate.emotionalIntensity),
      disclosureRisk: disclosureRiskFromScore(disclosureRiskScore),
      distortionLikelihood: distortionRiskFromScore(distortion),
      activationMode: mode,
      summaryToken: normalizeSummaryToken(candidate.summaryToken),
    });
  }

  const activatedMemories = accepted
    .sort((a, b) => b.activationWeight - a.activationWeight)
    .slice(0, MAX_ACTIVATED_MEMORIES);
  const highestActivationWeight = activatedMemories[0]?.activationWeight ?? 0;

  return {
    contractVersion: MEMORY_ACTIVATION_CONTRACT_VERSION,
    context: input.context,
    channel: input.channel,
    activatedMemories,
    activationCount: activatedMemories.length,
    dominantActivationMode: dominantMode(activatedMemories),
    highestActivationWeight,
    memorySalienceCapApplied: accepted.length > MAX_ACTIVATED_MEMORIES,
    blockedSourceRefs,
  };
}

type CandidateWithRisk = MemoryActivationCandidate & {
  socialRiskProxy: number;
};

export function buildActivationCandidatesFromSources(input: {
  canonicalLivedEvents?: Array<{
    memoryRefId: string;
    summaryToken: string;
    relevance: number;
    emotionalIntensity: number;
    recency: number;
    unresolved: number;
    relationshipLinkage: number;
    shameFearSalience: number;
    repetition: number;
    suppressionPressure: number;
  }>;
  characterBoundedRememberedEvents?: Array<{
    memoryRefId: string;
    summaryToken: string;
    relevance: number;
    emotionalIntensity: number;
    recency: number;
    unresolved: number;
    relationshipLinkage: number;
    shameFearSalience: number;
    repetition: number;
    suppressionPressure: number;
  }>;
  readerInteractionMemoryItems?: Array<{
    memoryRefId: string;
    summaryToken: string;
    relevance: number;
    emotionalIntensity: number;
    recency: number;
    unresolved: number;
    relationshipLinkage: number;
    shameFearSalience: number;
    repetition: number;
    suppressionPressure: number;
    socialRiskProxy?: number;
  }>;
  activeUnresolvedConsequences?: Array<{
    memoryRefId: string;
    summaryToken: string;
    relevance: number;
    emotionalIntensity: number;
    recency: number;
    unresolved: number;
    relationshipLinkage: number;
    shameFearSalience: number;
    repetition: number;
    suppressionPressure: number;
    channel: MemoryActivationChannel;
    socialRiskProxy?: number;
  }>;
  emotionalContinuityAnchors?: Array<{
    memoryRefId: string;
    summaryToken: string;
    relevance: number;
    emotionalIntensity: number;
    recency: number;
    unresolved: number;
    relationshipLinkage: number;
    shameFearSalience: number;
    repetition: number;
    suppressionPressure: number;
  }>;
}): MemoryActivationCandidate[] {
  const out: CandidateWithRisk[] = [];
  for (const item of input.canonicalLivedEvents ?? []) {
    out.push({
      memoryRefId: item.memoryRefId,
      sourceType: "canonical_lived_event",
      sourcePlane: "canonical_truth",
      summaryToken: item.summaryToken,
      contextualRelevance: item.relevance,
      emotionalIntensity: item.emotionalIntensity,
      unresolvedStatus: item.unresolved,
      relationshipLinkage: item.relationshipLinkage,
      recency: item.recency,
      shameFearSalience: item.shameFearSalience,
      repetition: item.repetition,
      suppressionPressure: item.suppressionPressure,
      socialRiskProxy: 45,
    });
  }
  for (const item of input.characterBoundedRememberedEvents ?? []) {
    out.push({
      memoryRefId: item.memoryRefId,
      sourceType: "character_bounded_remembered_event",
      sourcePlane: "character_bounded_knowledge",
      summaryToken: item.summaryToken,
      contextualRelevance: item.relevance,
      emotionalIntensity: item.emotionalIntensity,
      unresolvedStatus: item.unresolved,
      relationshipLinkage: item.relationshipLinkage,
      recency: item.recency,
      shameFearSalience: item.shameFearSalience,
      repetition: item.repetition,
      suppressionPressure: item.suppressionPressure,
      socialRiskProxy: 45,
    });
  }
  for (const item of input.readerInteractionMemoryItems ?? []) {
    out.push({
      memoryRefId: item.memoryRefId,
      sourceType: "reader_interaction_memory",
      sourcePlane: "reader_interaction_memory",
      summaryToken: item.summaryToken,
      contextualRelevance: item.relevance,
      emotionalIntensity: item.emotionalIntensity,
      unresolvedStatus: item.unresolved,
      relationshipLinkage: item.relationshipLinkage,
      recency: item.recency,
      shameFearSalience: item.shameFearSalience,
      repetition: item.repetition,
      suppressionPressure: item.suppressionPressure,
      socialRiskProxy: clamp0to100(item.socialRiskProxy ?? 55),
    });
  }
  for (const item of input.activeUnresolvedConsequences ?? []) {
    out.push({
      memoryRefId: item.memoryRefId,
      sourceType: "active_unresolved_consequence",
      sourcePlane: item.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory",
      summaryToken: item.summaryToken,
      contextualRelevance: item.relevance,
      emotionalIntensity: item.emotionalIntensity,
      unresolvedStatus: item.unresolved,
      relationshipLinkage: item.relationshipLinkage,
      recency: item.recency,
      shameFearSalience: item.shameFearSalience,
      repetition: item.repetition,
      suppressionPressure: item.suppressionPressure,
      socialRiskProxy: clamp0to100(item.socialRiskProxy ?? 60),
    });
  }
  for (const item of input.emotionalContinuityAnchors ?? []) {
    out.push({
      memoryRefId: item.memoryRefId,
      sourceType: "emotional_continuity_anchor",
      sourcePlane: "character_bounded_knowledge",
      summaryToken: item.summaryToken,
      contextualRelevance: item.relevance,
      emotionalIntensity: item.emotionalIntensity,
      unresolvedStatus: item.unresolved,
      relationshipLinkage: item.relationshipLinkage,
      recency: item.recency,
      shameFearSalience: item.shameFearSalience,
      repetition: item.repetition,
      suppressionPressure: item.suppressionPressure,
      socialRiskProxy: 50,
    });
  }
  return out;
}
