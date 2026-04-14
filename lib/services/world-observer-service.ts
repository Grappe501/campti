import { NarrativeDependencyConsumerKind, RevisionJobStatus } from "@prisma/client";

import { isRevisionJobRepairPayloadV1 } from "@/lib/domain/scene-repair";

import type { ProseQualityReportV1 } from "@/lib/prose-quality/types";
import type { SimulationDiff, SimulationRunResult } from "@/lib/domain/simulation-run";
import {
  WORLD_OBSERVER_CONTRACT_VERSION,
  type CharacterKeyPressures,
  type CharacterObserverSnapshot,
  type CognitionFrameSummary,
  type DecisionTraceSummary,
  type InnerVoiceSessionSummary,
  type ObserverEntitySummary,
  type ObserverEventSummary,
  type ObserverHouseholdClusterSummary,
  type ObserverPressureSummary,
  type PlaceSnapshot,
  type PlaceTickQuery,
  type SceneDependencyRollup,
  type SceneObserverSnapshot,
  type SceneTextSource,
  type SimulationComparisonSummarySnapshot,
  type SimulationDiffConcise,
  type SimulationObserverSnapshot,
  type SimulationOverrideSummary,
  type SimulationPairObserverSnapshot,
  type SinglePlaceSnapshot,
  type WorldSnapshot,
  type WorldTickQuery,
  type ChapterObserverSnapshot,
  CHAPTER_OBSERVER_CONTRACT_VERSION,
  type BookObserverSnapshot,
  BOOK_OBSERVER_CONTRACT_VERSION,
} from "@/lib/domain/world-observability";
import type { DecisionPressureBreakdown } from "@/lib/domain/decision-trace";
import { deriveActionPressureWeights } from "@/lib/decision-trace/decision-trace-deterministic";
import { buildDecisionTracePackage } from "@/lib/services/decision-trace-service";
import { resolveCharacterCognitionFrame } from "@/lib/services/character-cognition-resolver";
import { buildSocialFieldContextFromQuery } from "@/lib/services/social-field-context-service";
import { listProseQualityReportsForScene } from "@/lib/services/prose-quality-service";
import { planSceneRepair } from "@/lib/services/scene-repair-execution-service";
import { buildChapterRefinementPlan } from "@/lib/services/chapter-coherence-refinement-service";
import {
  buildBookCoherenceReport,
  buildBookRefinementPlan,
} from "@/lib/services/book-coherence-refinement-service";
import { comparePressureBreakdownPair } from "@/lib/simulation/simulation-diff";
import { inferApproximateStoryYearFromScene } from "@/lib/inner-voice/framing/age-band";
import { prisma } from "@/lib/prisma";
import { cognitionPrisma } from "@/lib/prisma-cognition-access";

function isoNow(): string {
  return new Date().toISOString();
}

function excerpt(text: string, max = 480): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function socialFieldToPressureSummary(
  sf: import("@/lib/domain/population-social-field").SocialFieldContext
): ObserverPressureSummary {
  return {
    witnessRisk: sf.witnessRisk,
    gossipPressure: sf.gossipPressure,
    authorityPressure: sf.authorityPressure,
    kinProximityPressure: sf.kinProximityPressure,
    householdVisibility: sf.householdVisibility,
    tabooAmplification: sf.tabooAmplification,
  };
}

function frameToCognitionSummary(
  frame: Awaited<ReturnType<typeof resolveCharacterCognitionFrame>>
): CognitionFrameSummary {
  return {
    perceivedReality: excerpt(frame.perceivedReality, 560),
    topFears: frame.fearStack.slice(0, 5).map((x) => x.label),
    activeMotives: frame.activeMotives.slice(0, 8),
    suppressedMotives: frame.suppressedMotives.slice(0, 6),
    identityConflict: excerpt(frame.identityConflict, 320),
    tabooThoughtPattern: excerpt(frame.tabooThoughtPattern, 240),
    selfDeceptionPattern: excerpt(frame.selfDeceptionPattern, 240),
  };
}

function summarizeSimulationDiff(d: SimulationDiff): SimulationDiffConcise {
  return {
    cognition: {
      fearHeadlinePrior: d.cognition.fearStackHeadlineShift.prior,
      fearHeadlineNext: d.cognition.fearStackHeadlineShift.next,
      obligationHeadlinePrior: d.cognition.obligationHeadlineShift.prior,
      obligationHeadlineNext: d.cognition.obligationHeadlineShift.next,
      identityConflictChanged: d.cognition.identityConflictChanged,
      motiveAddsOrRemovals: d.cognition.activeMotiveAddedOrRemoved,
    },
    pressures: {
      motiveOrderChanged: d.pressures.motiveActiveOrderChanged,
      motiveDeltaCount: d.pressures.motiveActiveDeltas.length,
      fearDeltaCount: d.pressures.fearDriverDeltas.length,
      triggerDeltaCount: d.pressures.triggerPressureDeltas.length,
    },
    embodiment: {
      changedKeys: d.embodiment.changedKeys,
    },
    desireWorld: d.desireWorld,
    decisionTrace: d.decisionTrace,
    innerVoice: d.innerVoice,
  };
}

function rollupDependencies(
  edges: { producerKind: string; strength: string }[]
): SceneDependencyRollup {
  const byProducerKind: Record<string, number> = {};
  let hardCount = 0;
  let softCount = 0;
  for (const e of edges) {
    byProducerKind[e.producerKind] = (byProducerKind[e.producerKind] ?? 0) + 1;
    if (e.strength === "HARD") hardCount++;
    else softCount++;
  }
  return {
    byProducerKind,
    hardCount,
    softCount,
    total: edges.length,
  };
}

export async function buildWorldSnapshot(query: WorldTickQuery): Promise<WorldSnapshot> {
  const maxPlaces = query.maxPlaces ?? 24;
  const ws = await prisma.worldStateReference.findUnique({
    where: { id: query.worldStateReferenceId },
  });
  if (!ws) {
    throw new Error(`WorldStateReference not found: ${query.worldStateReferenceId}`);
  }

  const storyYear = query.storyYear ?? null;
  const parishPlaceId = query.parishPlaceId ?? null;

  const [
    entitiesInWorldSlice,
    householdCount,
    linkedModeled,
    linkedToPersonCount,
    placeGroups,
    notableEntities,
    topHouseholds,
    eventRows,
  ] = await Promise.all([
    prisma.populationEntity.count({
      where: { worldStateReferenceId: query.worldStateReferenceId },
    }),
    prisma.populationHousehold.count({
      where: { worldStateReferenceId: query.worldStateReferenceId },
    }),
    prisma.populationEntity.count({
      where: { worldStateReferenceId: query.worldStateReferenceId, isModeledCharacter: true },
    }),
    prisma.populationEntity.count({
      where: { worldStateReferenceId: query.worldStateReferenceId, personId: { not: null } },
    }),
    prisma.populationEntity.groupBy({
      by: ["primaryLocationId"],
      where: {
        worldStateReferenceId: query.worldStateReferenceId,
        primaryLocationId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { primaryLocationId: "desc" } },
      take: maxPlaces,
    }),
    prisma.populationEntity.findMany({
      where: { worldStateReferenceId: query.worldStateReferenceId },
      select: {
        id: true,
        displayName: true,
        recordStatus: true,
        personId: true,
        isModeledCharacter: true,
      },
      take: 15,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.populationHousehold.findMany({
      where: { worldStateReferenceId: query.worldStateReferenceId },
      select: {
        id: true,
        label: true,
        censusHouseholdKey: true,
        _count: { select: { members: true } },
      },
      orderBy: { members: { _count: "desc" } },
      take: 8,
    }),
    prisma.event.findMany({
      select: {
        id: true,
        title: true,
        startYear: true,
        endYear: true,
        eventType: true,
      },
      take: 12,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const placeIds = placeGroups.map((g) => g.primaryLocationId).filter(Boolean) as string[];

  const [placesMeta, hhByPlace, linkedByPlace] = await Promise.all([
    placeIds.length
      ? prisma.place.findMany({
          where: { id: { in: placeIds } },
          select: { id: true, name: true, placeType: true },
        })
      : Promise.resolve([]),
    placeIds.length
      ? prisma.populationHousehold.groupBy({
          by: ["primaryPlaceId"],
          where: {
            worldStateReferenceId: query.worldStateReferenceId,
            primaryPlaceId: { in: placeIds },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    placeIds.length
      ? prisma.populationEntity.groupBy({
          by: ["primaryLocationId"],
          where: {
            worldStateReferenceId: query.worldStateReferenceId,
            primaryLocationId: { in: placeIds },
            personId: { not: null },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const placeById = new Map(placesMeta.map((p) => [p.id, p]));
  const hhMap = new Map(
    hhByPlace.map((x) => [x.primaryPlaceId!, x._count._all] as const)
  );
  const linkedMap = new Map(
    linkedByPlace.map((x) => [x.primaryLocationId!, x._count._all] as const)
  );

  const placeSummaries: PlaceSnapshot[] = placeGroups.map((g) => {
    const pid = g.primaryLocationId!;
    const p = placeById.get(pid);
    return {
      placeId: pid,
      placeLabel: p?.name ?? null,
      placeType: p?.placeType ?? null,
      populationCount: g._count._all,
      householdCount: hhMap.get(pid) ?? 0,
      linkedCharacterCount: linkedMap.get(pid) ?? 0,
      socialFieldSummary: null,
    };
  });

  let sceneAnchor: { id: string; places: { id: string }[] } | null = null;
  if (query.sceneId) {
    sceneAnchor = await prisma.scene.findUnique({
      where: { id: query.sceneId },
      select: { id: true, places: { select: { id: true }, take: 2 } },
    });
  }

  const focalPlaceId = query.focalPlaceId ?? sceneAnchor?.places[0]?.id ?? placeSummaries[0]?.placeId ?? null;
  const focalPersonId = query.focalPersonId ?? null;

  let socialFieldSummary: ObserverPressureSummary | null = null;
  let authorityComponents: WorldSnapshot["authorityComponents"] = null;
  let gossipKinWitness: WorldSnapshot["gossipKinWitness"] = null;

  if (focalPlaceId) {
    const sf = await buildSocialFieldContextFromQuery({
      sceneId: query.sceneId ?? "world-observer",
      worldStateId: query.worldStateReferenceId,
      storyYear,
      focalPersonIds: focalPersonId ? [focalPersonId] : [],
      placeId: focalPlaceId,
      householdId: null,
      parishPlaceId,
    });
    socialFieldSummary = socialFieldToPressureSummary(sf);
    if (sf.contractVersion === "2") {
      authorityComponents = {
        church: sf.socialBreakdown.authority.churchAuthorityPressure,
        military: sf.socialBreakdown.authority.militaryAuthorityPressure,
        civil: sf.socialBreakdown.authority.civilAuthorityPressure,
        elite: sf.socialBreakdown.authority.eliteClassPressure,
      };
      gossipKinWitness = {
        gossipSpreadFactor: sf.socialBreakdown.gossip.gossipSpreadFactor,
        gossipReachEstimate: sf.socialBreakdown.gossip.gossipReachEstimate,
        kinClusterCount: sf.socialBreakdown.kin.clusters.length,
        proximityWitnessPressure: sf.socialBreakdown.witness.proximityWitnessPressure,
      };
    }
  }

  const witnessGossipHotspots = placeSummaries.slice(0, 5).map((p) => ({
    placeId: p.placeId,
    placeLabel: p.placeLabel,
    populationCount: p.populationCount,
  }));

  const notableHouseholdClusters: ObserverHouseholdClusterSummary[] = topHouseholds.map((h) => ({
    householdId: h.id,
    label: h.label,
    censusHouseholdKey: h.censusHouseholdKey,
    memberCount: h._count.members,
  }));

  const notablePopulationSample: ObserverEntitySummary[] = notableEntities.map((e) => ({
    id: e.id,
    displayName: e.displayName,
    recordStatus: e.recordStatus,
    personId: e.personId,
    isModeledCharacter: e.isModeledCharacter,
  }));

  const observerEvents: ObserverEventSummary[] = eventRows.map((e) => ({
    id: e.id,
    title: e.title,
    startYear: e.startYear,
    endYear: e.endYear,
    eventType: e.eventType,
  }));

  return {
    contractVersion: WORLD_OBSERVER_CONTRACT_VERSION,
    worldStateReferenceId: ws.id,
    storyYear,
    parishPlaceId,
    worldLabel: ws.label,
    eraId: ws.eraId,
    placeSummaries,
    populationTotals: {
      entitiesInWorldSlice,
      households: householdCount,
      linkedModeledPopulationEntities: linkedModeled,
      populationEntitiesLinkedToPerson: linkedToPersonCount,
    },
    socialFieldSummary,
    authorityComponents,
    gossipKinWitness,
    witnessGossipHotspots,
    notableHouseholdClusters,
    notablePopulationSample,
    observerEvents,
    builtAtIso: isoNow(),
  };
}

/** Bounded place-centric view with one social-field resolution. */
export async function buildPlaceSnapshot(query: PlaceTickQuery): Promise<SinglePlaceSnapshot> {
  const p = await prisma.place.findUnique({
    where: { id: query.placeId },
    select: { id: true, name: true, placeType: true },
  });
  if (!p) throw new Error(`Place not found: ${query.placeId}`);

  const wsWhere = { worldStateReferenceId: query.worldStateReferenceId };
  const [populationCount, householdCount, linkedCharacterCount] = await Promise.all([
    prisma.populationEntity.count({
      where: { ...wsWhere, primaryLocationId: query.placeId },
    }),
    prisma.populationHousehold.count({
      where: { ...wsWhere, primaryPlaceId: query.placeId },
    }),
    prisma.populationEntity.count({
      where: { ...wsWhere, primaryLocationId: query.placeId, personId: { not: null } },
    }),
  ]);

  const sf = await buildSocialFieldContextFromQuery({
    sceneId: query.sceneId ?? "place-observer",
    worldStateId: query.worldStateReferenceId,
    storyYear: query.storyYear ?? null,
    focalPersonIds: query.focalPersonId ? [query.focalPersonId] : [],
    placeId: query.placeId,
    householdId: null,
    parishPlaceId: query.parishPlaceId ?? null,
  });

  return {
    contractVersion: WORLD_OBSERVER_CONTRACT_VERSION,
    query,
    placeLabel: p.name,
    placeType: p.placeType,
    populationCount,
    householdCount,
    linkedCharacterCount,
    socialField: sf,
    socialFieldSummary: socialFieldToPressureSummary(sf),
    builtAtIso: isoNow(),
  };
}

export type BuildCharacterObserverParams = {
  characterId: string;
  sceneId?: string | null;
  selectedActionLabel?: string | null;
  /** When true, includes full `SocialFieldContext` on the snapshot. Default false. */
  includeSocialFieldDetails?: boolean;
};

export async function buildCharacterObserverSnapshot(
  params: BuildCharacterObserverParams
): Promise<CharacterObserverSnapshot> {
  const person = await prisma.person.findUnique({
    where: { id: params.characterId },
    select: { id: true, name: true },
  });
  if (!person) throw new Error(`Person not found: ${params.characterId}`);

  const sceneId = params.sceneId ?? null;
  const includeDetails = params.includeSocialFieldDetails === true;

  let cognition: CognitionFrameSummary | null = null;
  let socialFieldDetails: CharacterObserverSnapshot["socialFieldDetails"] = null;
  let socialFieldSummary: ObserverPressureSummary | null = null;
  let body: CharacterObserverSnapshot["body"] = null;
  let desire: CharacterObserverSnapshot["desire"] = null;
  let keyPressures: CharacterKeyPressures | null = null;
  let locationYear: CharacterObserverSnapshot["locationYear"] = null;

  if (sceneId) {
    const [frame, scenePlace] = await Promise.all([
      resolveCharacterCognitionFrame(params.characterId, sceneId),
      prisma.scene.findUnique({
        where: { id: sceneId },
        select: { places: { select: { id: true }, take: 1 } },
      }),
    ]);
    cognition = frameToCognitionSummary(frame);
    if (frame.socialFieldContext) {
      socialFieldSummary = socialFieldToPressureSummary(frame.socialFieldContext);
      if (includeDetails) socialFieldDetails = frame.socialFieldContext;
    }
    const w = deriveActionPressureWeights(frame);
    keyPressures = {
      topActiveMotiveLabels: w.activeMotive.slice(0, 5).map((x) => x.label),
      topFearLabels: w.fears.slice(0, 5).map((x) => x.label),
      topTriggerLabels: frame.stateSnapshot?.currentSocialRisk
        ? [`Social risk (snapshot): ${excerpt(frame.stateSnapshot.currentSocialRisk, 120)}`]
        : [],
    };
    body = {
      painLevel: frame.characterPhysicalState.painLevel,
      fatigueLevel: frame.characterPhysicalState.fatigueLevel,
      hungerLevel: frame.characterPhysicalState.hungerLevel,
    };
    desire = {
      visibilityRiskForDesire: frame.worldDesireEnvironment.visibilityRiskForDesire,
      punishmentSeverityForForbiddenDesire: frame.worldDesireEnvironment.punishmentSeverityForForbiddenDesire,
      currentForbiddenDesirePressure: frame.stateSnapshot?.currentForbiddenDesirePressure ?? null,
    };
    const storyYear = inferApproximateStoryYearFromScene(
      frame.scene.structuredDataJson,
      frame.scene.historicalAnchor
    );
    locationYear = {
      approximateStoryYear: storyYear,
      worldStateId: frame.effectiveWorldState?.id ?? null,
      worldStateLabel: frame.effectiveWorldState?.label ?? null,
      primaryScenePlaceId: scenePlace?.places[0]?.id ?? null,
    };
  }

  const innerRow = await prisma.characterInnerVoiceSession.findFirst({
    where: {
      personId: params.characterId,
      ...(sceneId ? { sceneId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  let innerVoice: InnerVoiceSessionSummary | null = null;
  if (innerRow) {
    innerVoice = {
      sessionId: innerRow.id,
      mode: innerRow.mode,
      createdAt: innerRow.createdAt.toISOString(),
      excerpt: excerpt(innerRow.response, 520),
      canonicalStatus: innerRow.canonicalStatus,
    };
  }

  let decisionTrace: DecisionTraceSummary | null = null;
  if (sceneId && params.selectedActionLabel?.trim()) {
    const pkg = await buildDecisionTracePackage({
      characterId: params.characterId,
      sceneId,
      selectedAction: params.selectedActionLabel.trim(),
    });
    decisionTrace = {
      statedMotive: null,
      underlyingMotive: null,
      triggerPressureLabels: pkg.pressureBreakdown.triggerPressures.map((p) => p.label),
      dominantPressureLabels: [
        ...pkg.pressureBreakdown.motiveActive.slice(0, 4).map((p) => p.label),
        ...pkg.pressureBreakdown.fearDrivers.slice(0, 3).map((p) => p.label),
      ],
      worldConstraintLabels: pkg.pressureBreakdown.worldStateConstraints.map((c) => c.label),
      deterministicPressureOnly: true,
    };
  }

  return {
    contractVersion: WORLD_OBSERVER_CONTRACT_VERSION,
    characterId: person.id,
    characterName: person.name,
    sceneId,
    cognition,
    innerVoice,
    decisionTrace,
    socialFieldSummary,
    socialFieldDetails,
    body,
    desire,
    keyPressures,
    locationYear,
    builtAtIso: isoNow(),
  };
}

function pickSceneText(scene: {
  authoringText: string | null;
  generationText: string | null;
  publishedReaderText: string | null;
  draftText: string | null;
}): { text: string; source: SceneTextSource } {
  if (scene.authoringText?.trim()) return { text: scene.authoringText, source: "authoring" };
  if (scene.generationText?.trim()) return { text: scene.generationText, source: "generation" };
  if (scene.publishedReaderText?.trim()) return { text: scene.publishedReaderText, source: "published" };
  if (scene.draftText?.trim()) return { text: scene.draftText, source: "draft" };
  return { text: "", source: "draft" };
}

function hiddenPressureFromScene(structuredDataJson: unknown, privateNotes: string | null): string | null {
  if (privateNotes?.trim()) return excerpt(privateNotes, 640);
  if (structuredDataJson && typeof structuredDataJson === "object") {
    const o = structuredDataJson as Record<string, unknown>;
    const h = o.hiddenPressures ?? o.hiddenPressure ?? o.subtext;
    if (typeof h === "string" && h.trim()) return excerpt(h, 640);
  }
  return null;
}

export async function buildSceneObserverSnapshot(sceneId: string): Promise<SceneObserverSnapshot> {
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: {
      persons: { select: { id: true, name: true } },
      places: { select: { id: true }, take: 2 },
      chapter: {
        select: {
          id: true,
          sequenceInBook: true,
          book: {
            select: {
              id: true,
              title: true,
              epicId: true,
              epic: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });
  if (!scene) throw new Error(`Scene not found: ${sceneId}`);

  const [edges, reports, repairPlan, pendingRevisionJobs, lastCompletedRepairJob] = await Promise.all([
    prisma.narrativeDependencyEdge.findMany({
      where: {
        consumerKind: NarrativeDependencyConsumerKind.SCENE,
        consumerId: sceneId,
      },
      select: { id: true, producerKind: true, producerId: true, strength: true },
      take: 120,
      orderBy: { createdAt: "desc" },
    }),
    listProseQualityReportsForScene(sceneId, 1),
    planSceneRepair(sceneId),
    prisma.revisionJob.count({
      where: { sceneId, status: RevisionJobStatus.PENDING },
    }),
    prisma.revisionJob.findFirst({
      where: { sceneId, status: RevisionJobStatus.COMPLETED },
      orderBy: { completedAt: "desc" },
      select: { payload: true, completedAt: true },
    }),
  ]);

  const { text, source } = pickSceneText(scene);
  const textPresence = {
    hasAuthoringText: Boolean(scene.authoringText?.trim()),
    hasGenerationText: Boolean(scene.generationText?.trim()),
    hasPublishedReaderText: Boolean(scene.publishedReaderText?.trim()),
    hasDraftText: Boolean(scene.draftText?.trim()),
  };

  let proseQuality: SceneObserverSnapshot["proseQuality"] = null;
  if (reports[0]) {
    const r = reports[0].reportJson as ProseQualityReportV1 | null;
    const critical = r?.issues?.filter((i) => i.severity === "critical").length ?? 0;
    const warning = r?.issues?.filter((i) => i.severity === "warning").length ?? 0;
    proseQuality = {
      reportId: reports[0].id,
      createdAt: reports[0].createdAt.toISOString(),
      wordCount: r?.proseStats.wordCount ?? 0,
      criticalIssueCount: critical,
      warningIssueCount: warning,
    };
  }

  const placement =
    scene.chapter?.book != null
      ? {
          chapterId: scene.chapter.id,
          bookId: scene.chapter.book.id,
          bookTitle: scene.chapter.book.title,
          epicId: scene.chapter.book.epic?.id ?? null,
          epicTitle: scene.chapter.book.epic?.title ?? null,
          sequenceInBook: scene.chapter.sequenceInBook,
          orderInChapter: scene.orderInChapter,
        }
      : null;

  let socialFieldSummary: ObserverPressureSummary | null = null;
  let socialFieldDetails: SceneObserverSnapshot["socialFieldDetails"] = null;
  const povId = scene.persons[0]?.id;
  const placeId = scene.places[0]?.id;
  const wsId = scene.worldStateOverrideId;
  if (povId && placeId && wsId) {
    const storyYear = inferApproximateStoryYearFromScene(scene.structuredDataJson, scene.historicalAnchor);
    const sf = await buildSocialFieldContextFromQuery({
      sceneId: scene.id,
      worldStateId: wsId,
      storyYear,
      focalPersonIds: [povId],
      placeId,
      householdId: null,
      parishPlaceId: null,
    });
    socialFieldSummary = socialFieldToPressureSummary(sf);
    socialFieldDetails = sf;
  }

  return {
    contractVersion: WORLD_OBSERVER_CONTRACT_VERSION,
    sceneId: scene.id,
    placement,
    metadata: {
      description: excerpt(scene.description, 400),
      summary: scene.summary,
      narrativeIntent: scene.narrativeIntent,
      emotionalTone: scene.emotionalTone,
      historicalAnchor: scene.historicalAnchor,
      narrativeAssemblyStatus: scene.narrativeAssemblyStatus,
      continuityState: scene.continuityState,
      assemblyInvalidatedAt: scene.assemblyInvalidatedAt?.toISOString() ?? null,
      worldStateOverrideId: scene.worldStateOverrideId,
    },
    participants: scene.persons.map((p) => ({ personId: p.id, name: p.name })),
    hiddenPressureSummary: hiddenPressureFromScene(scene.structuredDataJson, scene.privateNotes),
    socialFieldSummary,
    socialFieldDetails,
    dependencyEdges: edges.map((e) => ({
      id: e.id,
      producerKind: e.producerKind,
      producerId: e.producerId,
      strength: e.strength,
    })),
    dependencyRollup: rollupDependencies(edges),
    proseQuality,
    latestText: {
      source,
      charCount: text.length,
      excerpt: excerpt(text, 900),
    },
    textPresence,
    repairSummary: {
      stalenessReasons: repairPlan.reasons,
      suggestedRepairMode: repairPlan.repairMode,
      pendingRevisionJobs,
      lastRepairMode:
        lastCompletedRepairJob?.payload && isRevisionJobRepairPayloadV1(lastCompletedRepairJob.payload)
          ? lastCompletedRepairJob.payload.repairMode
          : null,
      lastRepairCompletedAtIso: lastCompletedRepairJob?.completedAt?.toISOString() ?? null,
    },
    builtAtIso: isoNow(),
  };
}

function parseSimulationOutput(outputJson: unknown): Partial<SimulationRunResult> | null {
  if (!outputJson || typeof outputJson !== "object") return null;
  const o = outputJson as Record<string, unknown>;
  if (typeof o.scenarioId !== "string" || typeof o.sceneId !== "string") return null;
  return o as Partial<SimulationRunResult>;
}

function overrideSummaryFromResult(
  preview: Partial<SimulationRunResult> | null
): SimulationOverrideSummary | null {
  const list = preview?.effectiveOverrides;
  if (!Array.isArray(list)) return null;
  const keys = list.map((x: { key?: string }) => x.key).filter((k): k is string => typeof k === "string");
  return { keys, count: keys.length };
}

function comparisonSummaryFromResult(
  preview: Partial<SimulationRunResult> | null
): SimulationComparisonSummarySnapshot | null {
  const s = preview?.summary;
  if (!s || typeof s !== "object") return null;
  const o = s as SimulationComparisonSummarySnapshot;
  if (typeof o.headline !== "string") return null;
  return {
    headline: o.headline,
    bulletWhyShifted: Array.isArray(o.bulletWhyShifted) ? o.bulletWhyShifted : [],
    dominantOverrideEffects: Array.isArray(o.dominantOverrideEffects) ? o.dominantOverrideEffects : [],
  };
}

export async function buildSimulationObserverSnapshot(runId: string): Promise<SimulationObserverSnapshot> {
  const run = await cognitionPrisma.simulationRun.findUnique({
    where: { id: runId },
    include: { scenario: { select: { sceneId: true } } },
  });
  if (!run) throw new Error(`SimulationRun not found: ${runId}`);

  const output = run.outputJson as Record<string, unknown> | null;
  const preview = parseSimulationOutput(output);

  const input = run.inputJson as Record<string, unknown> | null;
  const diffFromBase = run.diffFromBaseJson as SimulationDiff | null;

  let pressureCompare: SimulationObserverSnapshot["pressureCompare"] = null;
  if (output && typeof output.pressureBreakdownBase === "object" && typeof output.pressureBreakdown === "object") {
    pressureCompare = {
      base: output.pressureBreakdownBase as DecisionPressureBreakdown,
      alternate: output.pressureBreakdown as DecisionPressureBreakdown,
    };
  }

  const diffSummary = diffFromBase ? summarizeSimulationDiff(diffFromBase) : null;

  return {
    contractVersion: WORLD_OBSERVER_CONTRACT_VERSION,
    runId: run.id,
    scenarioId: run.scenarioId,
    sceneId: run.scenario?.sceneId ?? null,
    personId: run.personId,
    canonicalStatus: run.canonicalStatus,
    createdAt: run.createdAt.toISOString(),
    inputHash: run.inputHash,
    inputSummary: {
      characterId: typeof input?.characterId === "string" ? input.characterId : null,
      selectedAction: input?.selectedAction ?? null,
      includeInnerVoice: Boolean(input?.includeInnerVoice),
    },
    overrideSummary: overrideSummaryFromResult(preview),
    comparisonSummary: comparisonSummaryFromResult(preview),
    diffSummary,
    diffFromBase,
    pressureCompare,
    resultPreview: preview,
    prosePreview: run.prosePreview,
    builtAtIso: isoNow(),
  };
}

export async function buildBookObserverSnapshot(bookId: string): Promise<BookObserverSnapshot> {
  const report = await buildBookCoherenceReport(bookId);
  const plan = buildBookRefinementPlan(report);
  const majorIssueCount = report.coherenceIssues.filter(
    (i) => i.severity === "warning" || i.severity === "blocking"
  ).length;
  return {
    contractVersion: BOOK_OBSERVER_CONTRACT_VERSION,
    bookId: report.bookId,
    epicId: report.epicId,
    bookTitle: report.bookTitle,
    movementIndex: report.movementIndex,
    chapterCount: report.chapterCount,
    overallCoherenceScore: report.overallCoherenceScore,
    arcPhaseDistribution: report.arcPhaseDistribution,
    majorIssueCount,
    refinementMode: plan.mode,
    builtAtIso: isoNow(),
  };
}

export async function buildChapterObserverSnapshot(chapterId: string): Promise<ChapterObserverSnapshot> {
  const { plan, report } = await buildChapterRefinementPlan(chapterId);
  const chapter = await prisma.chapter.findUniqueOrThrow({
    where: { id: chapterId },
    select: {
      id: true,
      bookId: true,
      title: true,
      sequenceInBook: true,
      narrativeAssemblyStatus: true,
      continuityState: true,
    },
  });
  const majorIssueCount = report.coherenceIssues.filter(
    (i) => i.severity === "warning" || i.severity === "blocking"
  ).length;
  const reassemblyLikelyEnough =
    plan.mode === "REASSEMBLE_ONLY" || plan.mode === "REORDER_SCENE_SUGGESTION";

  return {
    contractVersion: CHAPTER_OBSERVER_CONTRACT_VERSION,
    chapterId: chapter.id,
    bookId: chapter.bookId,
    title: chapter.title,
    sequenceInBook: chapter.sequenceInBook,
    narrativeAssemblyStatus: String(chapter.narrativeAssemblyStatus),
    continuityState: String(chapter.continuityState),
    sceneCount: report.sceneCount,
    coherenceScore: report.overallCoherenceScore,
    majorIssueCount,
    refinementMode: plan.mode,
    reassemblyLikelyEnough,
    builtAtIso: isoNow(),
  };
}

export async function buildSimulationObserverSnapshotPair(
  leftRunId: string,
  rightRunId: string
): Promise<SimulationPairObserverSnapshot> {
  const [left, right] = await Promise.all([
    cognitionPrisma.simulationRun.findUnique({ where: { id: leftRunId } }),
    cognitionPrisma.simulationRun.findUnique({ where: { id: rightRunId } }),
  ]);
  if (!left || !right) throw new Error("One or both SimulationRun rows not found.");

  const leftOut = left.outputJson as Record<string, unknown> | null;
  const rightOut = right.outputJson as Record<string, unknown> | null;
  const lpb = leftOut?.pressureBreakdown as DecisionPressureBreakdown | undefined;
  const rpb = rightOut?.pressureBreakdown as DecisionPressureBreakdown | undefined;

  if (!lpb || !rpb) {
    return {
      contractVersion: WORLD_OBSERVER_CONTRACT_VERSION,
      leftRunId,
      rightRunId,
      compareSummary:
        "Persisted runs missing pressureBreakdown in outputJson; re-run simulation with persist to store comparable payloads.",
      pressureDiffSummary: "",
      fullDiffAvailable: false,
      builtAtIso: isoNow(),
    };
  }

  const pressure = comparePressureBreakdownPair(lpb, rpb);

  return {
    contractVersion: WORLD_OBSERVER_CONTRACT_VERSION,
    leftRunId,
    rightRunId,
    compareSummary: "Deterministic pressure breakdown comparison (motives, fears, triggers).",
    pressureDiffSummary: JSON.stringify(pressure),
    fullDiffAvailable: false,
    builtAtIso: isoNow(),
  };
}
