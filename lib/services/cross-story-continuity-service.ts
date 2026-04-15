import {
  CROSS_STORY_CONTINUITY_CONTRACT_VERSION,
  type CrossStoryContinuity,
} from "@/lib/domain/cross-story-continuity";

export function createCrossStoryContinuity(input: {
  readerId: string;
  enabled?: boolean;
  carryoverPreferences?: CrossStoryContinuity["carryoverPreferences"];
  nonCanonicalSignals?: Record<string, string>;
  canonicalCarryoverEvents?: string[];
}): CrossStoryContinuity {
  const readerId = input.readerId.trim();
  if (!readerId) {
    throw new Error("[cross-story-continuity] readerId is required.");
  }

  const enabled = input.enabled ?? false;
  const canonicalCarryoverEvents = (input.canonicalCarryoverEvents ?? []).map((eventId) => eventId.trim()).filter(Boolean);
  if (canonicalCarryoverEvents.length > 0) {
    throw new Error("[cross-story-continuity] canonical carryover is forbidden.");
  }

  if (!enabled) {
    return {
      contractVersion: CROSS_STORY_CONTINUITY_CONTRACT_VERSION,
      readerId,
      enabled: false,
      carryoverPreferences: null,
      nonCanonicalSignals: {},
      canonicalCarryoverEvents: [],
    };
  }

  return {
    contractVersion: CROSS_STORY_CONTINUITY_CONTRACT_VERSION,
    readerId,
    enabled: true,
    carryoverPreferences: input.carryoverPreferences ?? {
      pacing: "balanced",
      tone: "balanced",
    },
    nonCanonicalSignals: input.nonCanonicalSignals ?? {},
    canonicalCarryoverEvents: [],
  };
}

export function projectCrossStoryContinuity(input: {
  continuity: CrossStoryContinuity;
  storyId: string;
}): {
  storyId: string;
  continuityApplied: boolean;
  carryoverPreferences: CrossStoryContinuity["carryoverPreferences"];
  signalKeys: string[];
} {
  const storyId = input.storyId.trim();
  if (!storyId) {
    throw new Error("[cross-story-continuity] storyId is required.");
  }
  return {
    storyId,
    continuityApplied: input.continuity.enabled,
    carryoverPreferences: input.continuity.enabled ? input.continuity.carryoverPreferences : null,
    signalKeys: input.continuity.enabled ? Object.keys(input.continuity.nonCanonicalSignals) : [],
  };
}
