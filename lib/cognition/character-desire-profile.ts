import type { CharacterProfile } from "@prisma/client";

import type { CharacterCore } from "@/lib/domain/cognition";
import type {
  AttachmentLongingProfile,
  CharacterDesireBundle,
  CharacterDesireProfile,
  PleasurePattern,
  SexualConstraintProfile,
} from "@/lib/domain/desire-cognition";

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function parseScalar(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return clamp100(v);
  return fallback;
}

function mergeProfile(base: CharacterDesireProfile, json: unknown): CharacterDesireProfile {
  if (!json || typeof json !== "object" || Array.isArray(json)) return base;
  const o = json as Record<string, unknown>;
  const keys: (keyof CharacterDesireProfile)[] = [
    "desireForTouch",
    "desireForProtection",
    "desireForRecognition",
    "desireForNeedfulness",
    "desireForEroticFusion",
    "desireForDominance",
    "desireForSubmission",
    "desireForApproval",
    "desireForBelonging",
    "desireForRelief",
    "desireForEscape",
    "desireForDevotion",
    "desireForPossession",
    "desireForFreedom",
  ];
  const next = { ...base };
  for (const k of keys) {
    if (k in o) next[k] = parseScalar(o[k], base[k]);
  }
  return next;
}

export function defaultCharacterDesireProfile(): CharacterDesireProfile {
  return {
    desireForTouch: 35,
    desireForProtection: 40,
    desireForRecognition: 45,
    desireForNeedfulness: 38,
    desireForEroticFusion: 25,
    desireForDominance: 28,
    desireForSubmission: 28,
    desireForApproval: 48,
    desireForBelonging: 46,
    desireForRelief: 42,
    desireForEscape: 32,
    desireForDevotion: 36,
    desireForPossession: 30,
    desireForFreedom: 34,
  };
}

const emptyPleasure: PleasurePattern = {
  soothingSources: [],
  bodyRewardChannels: [],
  forbiddenPleasureTriggers: [],
  shameAfterPleasureLikelihood: 40,
  pleasureSeekingStyle: "unspecified",
};

const emptyAttachment: AttachmentLongingProfile = {
  wantednessHunger: 40,
  fearOfUnwantedness: 38,
  dependencyPull: 32,
  rescueFantasyLevel: 28,
  approvalSensitivity: 45,
  abandonmentAche: 36,
};

const emptySexual: SexualConstraintProfile = {
  legitimacyNarrative: "",
  unspeakableDesires: [],
  pastSexualProclivityNotes: [],
  shameBindTags: [],
  displacementHabits: [],
};

function parsePleasure(json: unknown): PleasurePattern {
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ...emptyPleasure };
  const o = json as Record<string, unknown>;
  return {
    soothingSources: Array.isArray(o.soothingSources)
      ? o.soothingSources.filter((x): x is string => typeof x === "string")
      : [],
    bodyRewardChannels: Array.isArray(o.bodyRewardChannels)
      ? o.bodyRewardChannels.filter((x): x is string => typeof x === "string")
      : [],
    forbiddenPleasureTriggers: Array.isArray(o.forbiddenPleasureTriggers)
      ? o.forbiddenPleasureTriggers.filter((x): x is string => typeof x === "string")
      : [],
    shameAfterPleasureLikelihood: parseScalar(o.shameAfterPleasureLikelihood, emptyPleasure.shameAfterPleasureLikelihood),
    pleasureSeekingStyle:
      typeof o.pleasureSeekingStyle === "string" && o.pleasureSeekingStyle.trim()
        ? o.pleasureSeekingStyle.trim()
        : emptyPleasure.pleasureSeekingStyle,
  };
}

function parseAttachment(json: unknown): AttachmentLongingProfile {
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ...emptyAttachment };
  const o = json as Record<string, unknown>;
  return {
    wantednessHunger: parseScalar(o.wantednessHunger, emptyAttachment.wantednessHunger),
    fearOfUnwantedness: parseScalar(o.fearOfUnwantedness, emptyAttachment.fearOfUnwantedness),
    dependencyPull: parseScalar(o.dependencyPull, emptyAttachment.dependencyPull),
    rescueFantasyLevel: parseScalar(o.rescueFantasyLevel, emptyAttachment.rescueFantasyLevel),
    approvalSensitivity: parseScalar(o.approvalSensitivity, emptyAttachment.approvalSensitivity),
    abandonmentAche: parseScalar(o.abandonmentAche, emptyAttachment.abandonmentAche),
  };
}

function parseSexual(json: unknown): SexualConstraintProfile {
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ...emptySexual };
  const o = json as Record<string, unknown>;
  return {
    legitimacyNarrative:
      typeof o.legitimacyNarrative === "string" ? o.legitimacyNarrative : "",
    unspeakableDesires: Array.isArray(o.unspeakableDesires)
      ? o.unspeakableDesires.filter((x): x is string => typeof x === "string")
      : [],
    pastSexualProclivityNotes: Array.isArray(o.pastSexualProclivityNotes)
      ? o.pastSexualProclivityNotes.filter((x): x is string => typeof x === "string")
      : [],
    shameBindTags: Array.isArray(o.shameBindTags)
      ? o.shameBindTags.filter((x): x is string => typeof x === "string")
      : [],
    displacementHabits: Array.isArray(o.displacementHabits)
      ? o.displacementHabits.filter((x): x is string => typeof x === "string")
      : [],
  };
}

/**
 * Assemble desire-related profiles from cognition core JSON columns + literary hints.
 */
export function buildCharacterDesireProfileFromCore(
  core: CharacterCore | null,
  literaryProfile: CharacterProfile | null
): CharacterDesireBundle {
  let desire = defaultCharacterDesireProfile();
  if (core?.desireProfileJson != null) {
    desire = mergeProfile(desire, core.desireProfileJson);
  }

  const pleasure = parsePleasure(core?.pleasurePatternJson);
  const attachment = parseAttachment(core?.attachmentLongingJson);
  const sexual = parseSexual(core?.sexualConstraintProfileJson);

  if (literaryProfile?.coreLonging?.trim()) {
    attachment.abandonmentAche = clamp100(attachment.abandonmentAche + 6);
  }
  if (literaryProfile?.attachmentPattern?.trim()) {
    attachment.dependencyPull = clamp100(attachment.dependencyPull + 4);
  }

  return { desire, pleasure, attachment, sexual };
}
