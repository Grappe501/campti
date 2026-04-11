import type { Prisma, RelationshipDisclosureProfile } from "@prisma/client";
import type {
  CharacterBrainBundle,
  CounterpartAlternateCandidate,
  CounterpartContext,
  CounterpartDyadSummary,
  CounterpartResolutionSource,
  DyadDisclosureBlend,
  SceneConstraintSummary,
  ScalarBand,
} from "@/lib/brain-assembly-types";
import {
  getCharacterContinuityBundle,
  getCharacterIntelligenceBundle,
  getCharacterPressureBundle,
  getCharacterRelationshipBundle,
} from "@/lib/data-access";
import type { RelationshipProfileWithEnds } from "@/lib/relationship-order-types";
import { prisma } from "@/lib/prisma";

function scoreToBand(score: number | null | undefined): ScalarBand {
  if (score === null || score === undefined || Number.isNaN(score)) return "mixed";
  const s = Math.max(0, Math.min(100, score));
  if (s < 12) return "none";
  if (s < 24) return "very_low";
  if (s < 36) return "low";
  if (s < 48) return "guarded";
  if (s < 58) return "mixed";
  if (s < 68) return "present";
  if (s < 82) return "high";
  return "acute";
}

const BAND_ORDER: ScalarBand[] = [
  "none",
  "very_low",
  "low",
  "guarded",
  "mixed",
  "present",
  "high",
  "acute",
];

function maxBand(a: ScalarBand, b: ScalarBand): ScalarBand {
  return BAND_ORDER.indexOf(a) >= BAND_ORDER.indexOf(b) ? a : b;
}

function extractDyadDisclosureBlend(disc: RelationshipDisclosureProfile): DyadDisclosureBlend {
  const unsafe = (disc.unsafeTopics ?? {}) as Record<string, unknown>;
  const witnessKeys = [
    "witnessable_confession",
    "naming_romantic_claim_in_crowd",
    "unguarded_tenderness_when_bystanders_can_parse",
  ];
  let witnessHits = 0;
  for (const k of witnessKeys) {
    if (unsafe[k] === true) witnessHits++;
  }
  if (disc.exposureConsequence >= 65) witnessHits++;

  const witnessSensitivity: DyadDisclosureBlend["witnessSensitivity"] =
    witnessHits >= 2 ? "high" : witnessHits === 1 ? "moderate" : "low";

  const namingBlocked =
    unsafe.naming_romantic_claim_in_crowd === true ||
    unsafe.witnessable_confession === true ||
    unsafe.unguarded_tenderness_when_bystanders_can_parse === true;

  const coded = (disc.codedChannels ?? {}) as Record<string, unknown>;
  const impl = String(coded.implication ?? "").toLowerCase();

  let namingVsHinting: DyadDisclosureBlend["namingVsHinting"] = "balanced";
  if (namingBlocked || disc.exposureConsequence >= 68) {
    namingVsHinting = "naming_costly";
  } else if ((impl === "high" || impl === "medium") && !namingBlocked) {
    namingVsHinting = "hint_favored";
  }

  const reciprocityAvg = (disc.truthShareCapacity + disc.emotionalDisclosureCapacity) / 2;
  const reciprocityExpectation: DyadDisclosureBlend["reciprocityExpectation"] =
    reciprocityAvg >= 58 ? "high" : reciprocityAvg >= 45 ? "moderate" : "low";

  return { witnessSensitivity, namingVsHinting, reciprocityExpectation };
}

function dyadDisclosureCostScore(disc: RelationshipDisclosureProfile, blend: DyadDisclosureBlend): number {
  let score = clampScore(
    Math.round(
      disc.exposureConsequence * 0.38 +
        disc.secrecyBurden * 0.32 +
        (100 - disc.emotionalDisclosureCapacity) * 0.18 +
        disc.misrecognitionRisk * 0.12,
    ),
  );
  if (blend.namingVsHinting === "naming_costly") score = clampScore(score + 14);
  if (blend.namingVsHinting === "hint_favored") score = clampScore(score - 8);
  if (blend.witnessSensitivity === "high") score = clampScore(score + 10);
  else if (blend.witnessSensitivity === "moderate") score = clampScore(score + 4);
  return score;
}

function dyadMaskingPressureScore(disc: RelationshipDisclosureProfile, blend: DyadDisclosureBlend): number {
  let score = clampScore(
    Math.round(
      disc.secrecyBurden * 0.42 +
        disc.exposureConsequence * 0.28 +
        (100 - disc.emotionalDisclosureCapacity) * 0.3,
    ),
  );
  if (blend.witnessSensitivity === "high") score = clampScore(score + 22);
  else if (blend.witnessSensitivity === "moderate") score = clampScore(score + 11);
  if (blend.namingVsHinting === "naming_costly") score = clampScore(score + 12);
  if (blend.reciprocityExpectation === "high") score = clampScore(score + 6);
  return score;
}

function findCounterpartDisclosureProfile(
  relationshipProfiles: RelationshipProfileWithEnds[],
  personId: string,
  counterpartPersonId: string,
  worldStateId: string,
): RelationshipDisclosureProfile | null {
  const rp = relationshipProfiles.find(
    (p) =>
      (p.personAId === personId && p.personBId === counterpartPersonId) ||
      (p.personBId === personId && p.personAId === counterpartPersonId),
  );
  if (!rp) return null;
  return rp.disclosureProfiles.find((d) => d.worldStateId === worldStateId) ?? null;
}

function avgScore(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function collectStringsFromJson(value: unknown, depth = 0): string[] {
  if (depth > 8) return [];
  if (value === null || value === undefined) return [];
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? [t] : [];
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((v) => collectStringsFromJson(v, depth + 1));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((v) =>
      collectStringsFromJson(v, depth + 1),
    );
  }
  return [];
}

function uniqueStrings(items: string[]): string[] {
  return [...new Set(items.map((s) => s.trim()).filter(Boolean))];
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Pull optional overrides from Scene.structuredDataJson without requiring a fixed schema (Stage 7.5 + Stage 8 shared surface). */
export function parseSceneConstraintSummaryJson(json: Prisma.JsonValue | null | undefined): Partial<SceneConstraintSummary> {
  if (json === null || json === undefined || typeof json !== "object" || Array.isArray(json)) {
    return {};
  }
  const o = json as Record<string, unknown>;
  const patch: Partial<SceneConstraintSummary> = {};

  const num = (k: string) => (typeof o[k] === "number" && !Number.isNaN(o[k] as number) ? (o[k] as number) : undefined);
  const str = (k: string) => (typeof o[k] === "string" ? o[k].trim() : undefined);
  const bool = (k: string) => (typeof o[k] === "boolean" ? o[k] : undefined);
  const strArr = (k: string) =>
    Array.isArray(o[k]) ? (o[k] as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0) : undefined;

  const rbs = num("revealBudgetScore");
  const ses = num("socialExposureScore");
  const vps = num("violenceProximityScore");
  if (rbs !== undefined) patch.revealBudgetScore = clampScore(rbs);
  if (ses !== undefined) patch.socialExposureScore = clampScore(ses);
  if (vps !== undefined) patch.violenceProximityScore = clampScore(vps);
  const obj = str("objective");
  if (obj) patch.objective = obj;
  const fs = bool("forcedStillness");
  if (fs !== undefined) patch.forcedStillness = fs;
  const pt = strArr("pressureTags");
  if (pt?.length) patch.pressureTags = pt;
  const ba = strArr("blockedActions");
  if (ba?.length) patch.blockedActions = ba;
  const im = strArr("immediateSignals");
  if (im?.length) patch.immediateSignals = im;

  return patch;
}

/** Stage 7.5 scene cue layer; exported for Stage 8 legality assembly (same derivation as the brain bundle). */
export function buildSceneConstraintSummary(args: {
  scene: Pick<
    NonNullable<Awaited<ReturnType<typeof prisma.scene.findUnique>>>,
    | "emotionalTone"
    | "narrativeIntent"
    | "description"
    | "summary"
    | "visibility"
    | "writingMode"
    | "structuredDataJson"
  >;
  characterStateForPerson: { trustLevel: number; fearLevel: number; cognitiveLoad: number; socialConstraint?: string | null } | null;
}): SceneConstraintSummary {
  const { scene, characterStateForPerson } = args;
  const textBlob = `${scene.emotionalTone ?? ""} ${scene.narrativeIntent ?? ""} ${scene.description ?? ""}`.toLowerCase();
  const violenceHints = /violence|fight|attack|blood|weapon|wound|kill|battle/i.test(textBlob);
  const stillnessHints = /forced to stay|cannot leave|pinned|frozen in place|not allowed to move/i.test(textBlob);

  const violenceProximityScore = violenceHints ? 72 : 28;
  const socialExposureScore =
    scene.visibility === "PUBLIC" ? 78 : scene.visibility === "REVIEW" ? 48 : 22;

  let revealBudgetScore = 52;
  if (characterStateForPerson) {
    const { trustLevel, fearLevel, cognitiveLoad } = characterStateForPerson;
    revealBudgetScore = clampScore(100 - trustLevel + fearLevel * 0.35 + (cognitiveLoad - 50) * 0.2);
  }

  const pressureTags = uniqueStrings([
    ...(scene.emotionalTone?.trim() ? [scene.emotionalTone.trim()] : []),
    ...(scene.writingMode ? [`writingMode:${scene.writingMode}`] : []),
  ]);

  const immediateSignals = uniqueStrings([
    ...(scene.emotionalTone?.trim() ? [`emotional tone: ${scene.emotionalTone.trim()}`] : []),
    ...(scene.narrativeIntent?.trim() ? [`narrative intent: ${scene.narrativeIntent.trim()}`] : []),
    ...(characterStateForPerson?.socialConstraint?.trim()
      ? [`social constraint: ${characterStateForPerson.socialConstraint.trim()}`]
      : []),
  ]);

  const objective =
    scene.narrativeIntent?.trim() ||
    (scene.summary?.trim() ? scene.summary.trim().slice(0, 500) : null);

  const patch = parseSceneConstraintSummaryJson(scene.structuredDataJson);

  return {
    revealBudgetScore: patch.revealBudgetScore ?? revealBudgetScore,
    pressureTags: patch.pressureTags ?? pressureTags,
    blockedActions: patch.blockedActions ?? [],
    forcedStillness: patch.forcedStillness ?? stillnessHints,
    immediateSignals: uniqueStrings([...immediateSignals, ...(patch.immediateSignals ?? [])]),
    objective: patch.objective ?? objective,
    socialExposureScore: patch.socialExposureScore ?? socialExposureScore,
    violenceProximityScore: patch.violenceProximityScore ?? violenceProximityScore,
  };
}

function mergeLearnedRules(
  education: {
    apprenticeshipDomains?: Prisma.JsonValue | null;
    languageExposure?: Prisma.JsonValue | null;
  } | null,
  learning: { summary?: Prisma.JsonValue | null } | null,
  consequence: { learnedRules?: Prisma.JsonValue | null } | null,
): string[] {
  return uniqueStrings([
    ...collectStringsFromJson(consequence?.learnedRules),
    ...collectStringsFromJson(learning?.summary),
    ...collectStringsFromJson(education?.apprenticeshipDomains),
    ...collectStringsFromJson(education?.languageExposure),
  ]);
}

function jsonObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function jsonString(obj: Record<string, unknown> | null, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function scoreDyadSalience(rp: RelationshipProfileWithEnds): number {
  let score = rp.fearLevel * 1.15;
  score += rp.trustLevel * 0.95;
  score += rp.shameLeverage * 1.05;
  if (rp.fearLevel >= 58 || rp.shameLeverage >= 58) score += 10;
  if (rp.trustLevel >= 58 && rp.fearLevel <= 48) score += 8;
  return score;
}

function sceneTextAndStateInteractionBonus(args: {
  scene: {
    description?: string;
    emotionalTone?: string | null;
    narrativeIntent?: string | null;
    visibility?: string;
  } | null;
  focalState: { fearLevel?: number; cognitiveLoad?: number; socialConstraint?: string | null } | null;
}): number {
  let bonus = 0;
  const { scene, focalState } = args;
  const text = `${scene?.description ?? ""} ${scene?.emotionalTone ?? ""} ${scene?.narrativeIntent ?? ""}`.toLowerCase();
  if (
    /argument|confront|face to face|alone with|must answer|forced to explain|direct|staring|interrogat|pressure|accus/.test(
      text,
    )
  ) {
    bonus += 6;
  }
  if (scene?.visibility === "PUBLIC") bonus += 4;
  if (focalState) {
    if (focalState.fearLevel != null && focalState.fearLevel >= 58) bonus += 4;
    if (focalState.cognitiveLoad != null && focalState.cognitiveLoad >= 68) bonus += 3;
    if (focalState.socialConstraint?.trim()) bonus += 2;
  }
  return bonus;
}

function counterpartIdFromFocalCharacterState(
  focalState: {
    structuredDataJson?: Prisma.JsonValue | null;
    socialContext?: Prisma.JsonValue | null;
    environmentSnapshot?: Prisma.JsonValue | null;
  } | null,
): string | null {
  if (!focalState) return null;
  const buckets = [focalState.structuredDataJson, focalState.socialContext, focalState.environmentSnapshot];
  for (const b of buckets) {
    const id = jsonString(jsonObject(b), "counterpartPersonId", "interactionTargetPersonId", "focusPersonId");
    if (id) return id;
  }
  return null;
}

function resolveCounterpartPersonId(args: {
  explicitCounterpartPersonId?: string | null;
  personId: string;
  worldStateId: string;
  scene: {
    structuredDataJson?: Prisma.JsonValue | null;
    description?: string;
    emotionalTone?: string | null;
    narrativeIntent?: string | null;
    visibility?: string;
    characterStates?: Array<{
      personId: string;
      worldStateId: string | null;
      trustLevel: number;
      fearLevel: number;
      cognitiveLoad: number;
      socialConstraint?: string | null;
      structuredDataJson?: Prisma.JsonValue | null;
      socialContext?: Prisma.JsonValue | null;
      environmentSnapshot?: Prisma.JsonValue | null;
    }>;
  } | null;
  relationshipProfiles: RelationshipProfileWithEnds[];
}): { counterpartPersonId: string | null; source: CounterpartResolutionSource | null } {
  const { explicitCounterpartPersonId, personId, worldStateId, scene, relationshipProfiles } = args;

  if (explicitCounterpartPersonId && explicitCounterpartPersonId !== personId) {
    return { counterpartPersonId: explicitCounterpartPersonId, source: "explicit_arg" };
  }

  const sceneJson = jsonObject(scene?.structuredDataJson);
  const fromSceneJson = jsonString(
    sceneJson,
    "counterpartPersonId",
    "focalCounterpartPersonId",
    "primaryInteractionPersonId",
  );
  if (fromSceneJson && fromSceneJson !== personId) {
    return { counterpartPersonId: fromSceneJson, source: "scene_json" };
  }

  const focalState =
    scene?.characterStates?.find((cs) => cs.personId === personId && cs.worldStateId === worldStateId) ??
    scene?.characterStates?.find((cs) => cs.personId === personId && cs.worldStateId == null) ??
    scene?.characterStates?.find((cs) => cs.personId === personId) ??
    null;

  const fromStateJson = counterpartIdFromFocalCharacterState(focalState);
  if (fromStateJson && fromStateJson !== personId) {
    return { counterpartPersonId: fromStateJson, source: "character_state_json" };
  }

  const interactionBonus = sceneTextAndStateInteractionBonus({ scene, focalState });

  const peopleInScene = new Set(
    (scene?.characterStates ?? [])
      .map((cs) => cs.personId)
      .filter((id): id is string => Boolean(id && id !== personId)),
  );

  const rankDyads = (profiles: RelationshipProfileWithEnds[]) =>
    [...profiles].sort((a, b) => {
      const sa = scoreDyadSalience(a) + interactionBonus;
      const sb = scoreDyadSalience(b) + interactionBonus;
      if (sb !== sa) return sb - sa;
      if (b.fearLevel !== a.fearLevel) return b.fearLevel - a.fearLevel;
      return b.shameLeverage - a.shameLeverage;
    });

  if (peopleInScene.size > 0) {
    const inSceneDyads = relationshipProfiles.filter((rp) => {
      const otherId = rp.personAId === personId ? rp.personBId : rp.personAId;
      return peopleInScene.has(otherId);
    });
    const best = rankDyads(inSceneDyads)[0];
    if (best) {
      const otherId = best.personAId === personId ? best.personBId : best.personAId;
      return { counterpartPersonId: otherId, source: "scene_heuristic" };
    }
  }

  const allDyads = relationshipProfiles.filter((rp) => {
    const otherId = rp.personAId === personId ? rp.personBId : rp.personAId;
    return otherId !== personId;
  });
  const fallback = rankDyads(allDyads)[0];
  if (fallback) {
    const otherId = fallback.personAId === personId ? fallback.personBId : fallback.personAId;
    return { counterpartPersonId: otherId, source: "scene_heuristic" };
  }

  return { counterpartPersonId: null, source: null };
}

/** Other people in the scene with a dyad row (excludes current focal counterpart), for admin pin links. */
function listInSceneCounterpartAlternates(args: {
  personId: string;
  selectedCounterpartPersonId: string | null;
  scene: {
    description: string;
    emotionalTone?: string | null;
    narrativeIntent?: string | null;
    visibility: string;
    characterStates: Array<{ personId: string }>;
  };
  relationshipProfiles: RelationshipProfileWithEnds[];
  focalState: {
    fearLevel: number;
    cognitiveLoad: number;
    socialConstraint?: string | null;
  } | null;
}): CounterpartAlternateCandidate[] {
  const { personId, selectedCounterpartPersonId, scene, relationshipProfiles, focalState } = args;

  const peopleInScene = new Set(
    scene.characterStates.map((cs) => cs.personId).filter((id): id is string => Boolean(id && id !== personId)),
  );

  if (peopleInScene.size === 0) return [];

  const bonus = sceneTextAndStateInteractionBonus({ scene, focalState });

  const bestByOther = new Map<string, { score: number; displayName: string }>();

  for (const rp of relationshipProfiles) {
    const otherId = rp.personAId === personId ? rp.personBId : rp.personAId;
    if (otherId === personId || !peopleInScene.has(otherId)) continue;
    if (selectedCounterpartPersonId && otherId === selectedCounterpartPersonId) continue;

    const other = rp.personAId === personId ? rp.personB : rp.personA;
    const score = scoreDyadSalience(rp) + bonus;
    const prev = bestByOther.get(otherId);
    if (!prev || score > prev.score) {
      bestByOther.set(otherId, {
        score,
        displayName: (other.name ?? "").trim() || otherId,
      });
    }
  }

  return [...bestByOther.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5)
    .map(([counterpartPersonId, v]) => ({
      counterpartPersonId,
      displayName: v.displayName,
      salienceScore: Math.round(v.score * 100) / 100,
    }));
}

function buildCounterpartContext(args: {
  personId: string;
  counterpartPersonId: string;
  relationshipProfiles: RelationshipProfileWithEnds[];
  counterpartPersonRow: { id: string; name: string } | null;
  resolutionSource?: CounterpartResolutionSource;
}): CounterpartContext {
  const { personId, counterpartPersonId, relationshipProfiles, counterpartPersonRow, resolutionSource } = args;
  const rp = relationshipProfiles.find(
    (p) =>
      (p.personAId === personId && p.personBId === counterpartPersonId) ||
      (p.personBId === personId && p.personAId === counterpartPersonId),
  );
  const otherFromRp = rp ? (rp.personAId === personId ? rp.personB : rp.personA) : null;
  const displayName = (otherFromRp?.name ?? counterpartPersonRow?.name ?? "").trim() || "Unknown counterpart";

  const dyad: CounterpartDyadSummary | null = rp
    ? {
        trustLevel: rp.trustLevel,
        fearLevel: rp.fearLevel,
        shameLeverage: rp.shameLeverage,
        readsAsUnsafe: rp.fearLevel >= 58 || rp.shameLeverage >= 58,
        readsAsSafe: rp.trustLevel >= 58 && rp.fearLevel <= 48,
      }
    : null;

  return {
    counterpartPersonId,
    displayName,
    dyad,
    ...(resolutionSource ? { resolutionSource } : {}),
  };
}

/** Maps Campti profile rows + scene-linked places into the Stage 7 brain bundle shape. */
export async function getCharacterBrainBundle(
  personId: string,
  worldStateId: string,
  sceneId?: string | null,
  counterpartPersonId?: string | null,
): Promise<CharacterBrainBundle> {
  const [intelligenceRef, pressureRef, relationshipRef, continuityRef, sceneRef] = await Promise.all([
    getCharacterIntelligenceBundle(personId, worldStateId),
    getCharacterPressureBundle(personId, worldStateId),
    getCharacterRelationshipBundle(personId, worldStateId),
    getCharacterContinuityBundle(personId, worldStateId),
    sceneId
      ? prisma.scene.findUnique({
          where: { id: sceneId },
          include: {
            places: {
              include: { environmentProfile: true },
            },
            characterStates: {
              orderBy: { updatedAt: "desc" },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const relationshipProfiles = relationshipRef?.relationshipProfilesInvolvingPerson ?? [];

  const resolvedCounterpart = resolveCounterpartPersonId({
    explicitCounterpartPersonId: counterpartPersonId ?? null,
    personId,
    worldStateId,
    scene: sceneRef,
    relationshipProfiles,
  });

  const resolvedCounterpartPersonId = resolvedCounterpart.counterpartPersonId;

  let counterpartPersonRow: { id: string; name: string } | null = null;
  if (resolvedCounterpartPersonId && resolvedCounterpartPersonId !== personId) {
    counterpartPersonRow = await prisma.person.findUnique({
      where: { id: resolvedCounterpartPersonId },
      select: { id: true, name: true },
    });
  }

  const counterpartContext: CounterpartContext | null =
    resolvedCounterpartPersonId && resolvedCounterpartPersonId !== personId
      ? buildCounterpartContext({
          personId,
          counterpartPersonId: resolvedCounterpartPersonId,
          relationshipProfiles,
          counterpartPersonRow,
          resolutionSource: resolvedCounterpart.source ?? undefined,
        })
      : null;

  const worldHealth = continuityRef?.worldHealthNorm ?? null;
  const healthEnvelope = continuityRef?.healthEnvelope ?? null;
  const places = sceneRef?.places ?? [];

  const cognitiveStyle = uniqueStrings([
    ...collectStringsFromJson(intelligenceRef?.worldKnowledge?.dominantExplanatorySystems),
    ...collectStringsFromJson(intelligenceRef?.worldExpression?.acceptableExplanationModes),
    ...collectStringsFromJson(intelligenceRef?.worldExpression?.metaphorSourceDomains),
    ...(intelligenceRef?.worldKnowledge?.literacyRegime?.trim()
      ? [intelligenceRef.worldKnowledge.literacyRegime.trim()]
      : []),
    ...(intelligenceRef?.worldExpression?.silencePatternsNorm?.trim()
      ? [intelligenceRef.worldExpression.silencePatternsNorm.trim()]
      : []),
  ]);

  const intel = intelligenceRef?.intelligence;
  const dev = intelligenceRef?.development;
  const bio = intelligenceRef?.biological;

  const noticeBandwidth = scoreToBand(
    avgScore([intel?.workingMemory, intel?.environmentalInference, dev?.regulationLevel]) ?? undefined,
  );
  const abstractionTolerance = scoreToBand(intel?.abstractionCapacity);
  const reactionSpeed = scoreToBand(
    avgScore([intel?.impulseControl ? 100 - intel.impulseControl : null, bio?.fatigueLoad, bio?.chronicStress]),
  );

  const gov = pressureRef?.governanceImpact;
  const fam = pressureRef?.familyPressure;
  const se = pressureRef?.socioEconomic;
  const cs = pressureRef?.characterState;
  const era = pressureRef?.eraProfile ?? null;

  const dangerSources = uniqueStrings([
    ...(gov?.punishmentRisk != null && gov.punishmentRisk >= 62
      ? [`governance punishment risk (${gov.punishmentRisk})`]
      : []),
    ...(gov?.suppressionLevel != null && gov.suppressionLevel >= 62
      ? [`expression suppression (${gov.suppressionLevel})`]
      : []),
    ...(se?.survivalPressure != null && se.survivalPressure >= 62
      ? [`material survival pressure (${se.survivalPressure})`]
      : []),
    ...collectStringsFromJson(fam?.conflictZones),
    ...(cs?.fearState?.trim() ? [`character fear: ${cs.fearState.trim()}`] : []),
    ...(cs?.socialConstraint?.trim() ? [`social constraint: ${cs.socialConstraint.trim()}`] : []),
    ...(era && era.knobSystemicExtraction >= 58
      ? [`era systemic extraction / coercion climate (${era.knobSystemicExtraction})`]
      : []),
  ]);

  const defianceCost = scoreToBand(gov?.punishmentRisk ?? fam?.loyaltyExpectation);
  const speechRestriction = scoreToBand(
    gov?.allowedExpressionRange != null ? 100 - gov.allowedExpressionRange : gov?.suppressionLevel,
  );
  const survivalMode = scoreToBand(
    avgScore([se?.survivalPressure, se?.dependencyLevel, bio?.chronicStress, bio?.traumaLoad]),
  );

  const safePeople: string[] = [];
  const unsafePeople: string[] = [];
  for (const rp of relationshipRef?.relationshipProfilesInvolvingPerson ?? []) {
    const other = rp.personAId === personId ? rp.personB : rp.personA;
    const name = other.name?.trim();
    if (!name) continue;
    if (rp.trustLevel >= 58 && rp.fearLevel <= 48) {
      safePeople.push(name);
    } else if (rp.fearLevel >= 58 || rp.shameLeverage >= 58) {
      unsafePeople.push(name);
    }
  }
  const masking = relationshipRef?.masking;
  let maskingNeed = scoreToBand(
    masking ? masking.maskingIntensity + masking.secrecyNeed - 50 : undefined,
  );
  let disclosureCost = scoreToBand(masking?.disclosureRisk);

  let dyadDisclosure: DyadDisclosureBlend | null = null;
  if (resolvedCounterpartPersonId && resolvedCounterpartPersonId !== personId) {
    const discProf = findCounterpartDisclosureProfile(
      relationshipProfiles,
      personId,
      resolvedCounterpartPersonId,
      worldStateId,
    );
    if (discProf) {
      dyadDisclosure = extractDyadDisclosureBlend(discProf);
      disclosureCost = maxBand(
        disclosureCost,
        scoreToBand(dyadDisclosureCostScore(discProf, dyadDisclosure)),
      );
      maskingNeed = maxBand(
        maskingNeed,
        scoreToBand(dyadMaskingPressureScore(discProf, dyadDisclosure)),
      );
    }
  }

  const trauma = continuityRef?.trauma;
  const consequence = continuityRef?.consequenceMemory;
  const rumor = continuityRef?.rumorReputation;
  const education = continuityRef?.education;
  const learning = continuityRef?.learningEnvelope;

  const traumaTriggers = uniqueStrings([
    ...collectStringsFromJson(trauma?.triggerPatterns),
    ...collectStringsFromJson(trauma?.bodyMemory),
  ]);
  const learnedRules = mergeLearnedRules(education ?? null, learning ?? null, consequence ?? null);
  const consequenceMemory = uniqueStrings([
    ...collectStringsFromJson(consequence?.avoidancePatterns),
    ...collectStringsFromJson(consequence?.reinforcementPatterns),
    ...collectStringsFromJson(rumor?.reputationThemes),
    ...collectStringsFromJson(rumor?.vulnerableNarratives),
  ]);

  const physical = continuityRef?.physicalHealth;
  const mental = continuityRef?.mentalHealth;
  const emotional = continuityRef?.emotionalHealth;

  const focalCharacterStates = (sceneRef?.characterStates ?? []).filter((cs) => cs.personId === personId);
  const characterStateForScene =
    focalCharacterStates.find((cs) => cs.worldStateId === worldStateId) ??
    focalCharacterStates.find((cs) => cs.worldStateId == null) ??
    focalCharacterStates[0] ??
    null;

  const sceneConstraintSummary: SceneConstraintSummary | null = sceneRef
    ? buildSceneConstraintSummary({
        scene: sceneRef,
        characterStateForPerson: characterStateForScene,
      })
    : null;

  const physicalLoad = scoreToBand(
    avgScore([
      physical?.injuryLoad,
      physical?.chronicPainLoad,
      physical?.illnessBurden,
      physical?.mobilityLimitationLoad,
    ]) ?? undefined,
  );
  const mentalLoad = scoreToBand(
    avgScore([
      mental?.intrusiveThoughtLoad,
      mental?.despairLoad,
      mental?.dissociationTendency,
      mental?.vigilanceLevel,
    ]) ?? undefined,
  );
  const emotionalLoad = scoreToBand(
    avgScore([
      emotional?.suppressionLoad,
      emotional?.griefSaturation,
      emotional?.shameSaturation,
      emotional?.emotionalFloodingLoad,
      emotional?.emotionalNumbnessLoad,
    ]) ?? undefined,
  );

  const likelySelfManagement = uniqueStrings([
    ...collectStringsFromJson(worldHealth?.healingSystems),
    ...collectStringsFromJson(worldHealth?.stigmaPatterns),
    ...collectStringsFromJson(healthEnvelope?.summary),
    ...collectStringsFromJson(healthEnvelope?.simulationLayer),
  ]);

  const sensoryBiases: string[] = [];
  const movementLimits: string[] = [];
  const immediateRisks: string[] = [];

  for (const place of places) {
    const ep = place.environmentProfile;
    if (ep?.terrainType?.trim()) {
      immediateRisks.push(`terrain: ${ep.terrainType.trim()}`);
    }
    if (ep?.hydrologyType?.trim()) {
      immediateRisks.push(`hydrology: ${ep.hydrologyType.trim()}`);
    }
    if (ep?.floodRiskLevel != null && ep.floodRiskLevel >= 40) {
      immediateRisks.push(`flood risk (${ep.floodRiskLevel})`);
    }
    if (ep?.droughtRiskLevel != null && ep.droughtRiskLevel >= 40) {
      immediateRisks.push(`drought risk (${ep.droughtRiskLevel})`);
    }
    sensoryBiases.push(...collectStringsFromJson(ep?.sensoryProfile));
    if (ep?.mobilityProfile?.trim()) {
      movementLimits.push(ep.mobilityProfile.trim());
    }
  }

  const counterpartAlternates: CounterpartAlternateCandidate[] = sceneRef
    ? listInSceneCounterpartAlternates({
        personId,
        selectedCounterpartPersonId: counterpartContext?.counterpartPersonId ?? null,
        scene: sceneRef,
        relationshipProfiles,
        focalState: characterStateForScene
          ? {
              fearLevel: characterStateForScene.fearLevel,
              cognitiveLoad: characterStateForScene.cognitiveLoad,
              socialConstraint: characterStateForScene.socialConstraint ?? null,
            }
          : null,
      })
    : [];

  const worldEraContext = era
    ? {
        coreEconomicDrivers: era.coreEconomicDrivers.filter((s) => s.trim()).slice(0, 6),
        powerSummary: era.powerSummary?.trim() ? era.powerSummary.trim() : null,
        meaningOfWork: era.meaningOfWork?.trim() ? era.meaningOfWork.trim() : null,
        evidenceRationale: era.evidenceRationale?.trim() ? era.evidenceRationale.trim() : null,
        knobs: {
          economicPressure: era.knobEconomicPressure,
          relationalInterdependence: era.knobRelationalInterdependence,
          autonomyBaseline: era.knobAutonomyBaseline,
          systemicExtraction: era.knobSystemicExtraction,
          collectiveCohesion: era.knobCollectiveCohesion,
        },
        effectivePressureWeights: pressureRef?.effectivePressureWeights ?? null,
      }
    : null;

  return {
    personId,
    worldStateId,
    sceneId: sceneId ?? null,
    counterpartContext,
    counterpartAlternates,
    sceneConstraintSummary,
    worldEraContext,
    intelligence: {
      cognitiveStyle,
      noticeBandwidth,
      abstractionTolerance,
      reactionSpeed,
    },
    pressure: {
      dangerSources,
      defianceCost,
      speechRestriction,
      survivalMode,
    },
    relationships: {
      safePeople: uniqueStrings(safePeople),
      unsafePeople: uniqueStrings(unsafePeople),
      maskingNeed,
      disclosureCost,
      dyadDisclosure,
    },
    continuity: {
      traumaTriggers,
      learnedRules,
      consequenceMemory,
    },
    health: {
      physicalLoad,
      mentalLoad,
      emotionalLoad,
      likelySelfManagement,
    },
    environment: {
      sensoryBiases: uniqueStrings(sensoryBiases),
      immediateRisks: uniqueStrings(immediateRisks),
      movementLimits: uniqueStrings(movementLimits),
    },
    sourceSummary: {
      intelligenceLoaded: Boolean(intelligenceRef),
      pressureLoaded: Boolean(pressureRef),
      relationshipsLoaded: Boolean(relationshipRef),
      continuityLoaded: Boolean(continuityRef),
      healthLoaded: Boolean(
        continuityRef?.healthEnvelope ||
          continuityRef?.physicalHealth ||
          continuityRef?.mentalHealth ||
          continuityRef?.emotionalHealth,
      ),
      environmentLoaded: places.length > 0,
      eraProfileLoaded: Boolean(era),
    },
  };
}
