import { ChapterCompositionPlanSchema, type ChapterCompositionPlan } from "@/lib/domain/chapter-composition";
import type { ChapterNarrativePsychology } from "@/lib/domain/narrative-psychology";
import type { NarrativeThread } from "@/lib/domain/narrative-thread";
import { LocationPresenceRecordSchema, type SettingCoverageReport } from "@/lib/domain/narrative-thread";
import type { CanonicalPreGenerationBundle } from "@/lib/domain/canonical-scene-generation-governance";
import { deriveChapterState } from "@/lib/chapter-state/chapter-state-derivation";
import { deriveBeatProfileRecommendation } from "@/lib/chapter-state/chapter-state-to-beat-profile";
import { ChapterStateToBeatAssemblyChainService } from "@/lib/services/chapter-state-to-beat-assembly-chain-service";
import { CanonicalNarrativeGovernanceOrchestrationService } from "@/lib/services/canonical-narrative-governance-orchestration-service";
import { NarrativePsychologyDerivationService } from "@/lib/services/narrative-psychology-derivation-service";
import { ProseGenerationConstraintDerivationService } from "@/lib/services/prose-generation-constraint-derivation-service";
import { prisma } from "@/lib/prisma";

const DEFAULT_AXIS = {
  environmental_stability: { score: 72, direction: "falling" as const, rationale: "governance-default" },
  food_security: { score: 74, direction: "falling" as const, rationale: "governance-default" },
  social_cohesion: { score: 71, direction: "falling" as const, rationale: "governance-default" },
  external_awareness: { score: 36, direction: "rising" as const, rationale: "governance-default" },
  memory_continuity: { score: 84, direction: "flat" as const, rationale: "governance-default" },
  identity_stability: { score: 79, direction: "falling" as const, rationale: "governance-default" },
  labor_pressure: { score: 51, direction: "rising" as const, rationale: "governance-default" },
  signal_integrity: { score: 61, direction: "falling" as const, rationale: "governance-default" },
  decision_pressure: { score: 43, direction: "rising" as const, rationale: "governance-default" },
  movement_pressure: { score: 18, direction: "rising" as const, rationale: "governance-default" },
  relational_heat: { score: 39, direction: "rising" as const, rationale: "governance-default" },
  meaning_load: { score: 34, direction: "rising" as const, rationale: "governance-default" },
};

function resolveChapterPsychologyForGovernance(input: {
  chapterId: string;
  bookId: string;
  sequenceInBook: number;
}): ChapterNarrativePsychology {
  const arch = new NarrativePsychologyDerivationService().buildBook1Architecture();
  const idx = Math.max(0, Math.min(arch.chapters.length - 1, input.sequenceInBook - 1));
  const template = arch.chapters[idx] ?? arch.chapters[0];
  return {
    ...template,
    chapterId: input.chapterId,
    parentBookId: input.bookId,
    sequence: input.sequenceInBook,
    pullProfile: {
      ...template.pullProfile,
      chapterId: input.chapterId,
    },
  };
}

function buildSettingCoverageReport(input: {
  bookId: string;
  primaryLocationId: string;
  primaryLocationName: string;
}): SettingCoverageReport {
  const record = LocationPresenceRecordSchema.parse({
    locationId: input.primaryLocationId,
    locationName: input.primaryLocationName,
    routeRole: "governance_adapter_primary",
    appearanceMode: "direct_scene_setting",
    appearanceCount: 1,
    directSceneCount: 1,
    indirectMentionCount: 0,
    associatedThreads: ["governance-thread-placeholder"],
    associatedCharacters: [],
    currentMeaning: "primary place anchor for governance parity",
    callbackLinks: [],
    nextRecommendedAppearanceWindow: "next-chapter",
  });
  return {
    artifact: "red_river_setting_coverage_report",
    bookId: input.bookId,
    requiredLocationIds: [input.primaryLocationId],
    records: [record],
    missingLocationIds: [],
    underrepresentedLocationIds: [],
    coverageRatio: 1,
    recommendations: [],
  };
}

/**
 * Builds a minimal valid composition plan from persisted scenes (orderInChapter).
 * When only one scene exists, a synthetic second plan row is added so sequence machinery
 * matches the regeneration path’s multi-scene plans (truthfully flagged).
 */
export function buildChapterCompositionPlanFromDbScenes(input: {
  chapterId: string;
  bookId: string;
  parentNarrativePsychologyId: string;
  sceneRows: Array<{ id: string; orderInChapter: number | null }>;
  primaryRouteLocationId: string;
}): ChapterCompositionPlan {
  const ordered = [...input.sceneRows].sort(
    (a, b) => (a.orderInChapter ?? 0) - (b.orderInChapter ?? 0),
  );
  let sequence = ordered.map((row, index) => ({
    scenePlanId: row.id,
    chapterId: input.chapterId,
    sceneOrder: index + 1,
    sceneRole:
      index === 0
        ? ("grounding_scene" as const)
        : index === ordered.length - 1
          ? ("closure_scene" as const)
          : ("warning_scene" as const),
    povCandidateWeights: [{ povId: "natchitoches-matriarch-keeper", weight: 0.72 }],
    dominantThreadIds: ["continuity-thread-placeholder"],
    secondaryThreadIds: [],
    latentThreadIds: [],
    settingBindings: [input.primaryRouteLocationId],
    routeBindings: [input.primaryRouteLocationId],
    philosophyBindings: [],
    callbackSeeds: [],
    delayedConvergenceKeys: [],
    requiredBeatBiases: { salience_lock_beat: 0.5 },
    requiredStateBiases: { unresolved_pull: 0.45 },
    apparentConnectionLevel: "indirectly_linked" as const,
    actualConnectionLevel: "hidden_linked" as const,
    transitionStrategy: "soft_echo",
    carryForwardPressureType: "threaded_pressure",
    sceneClosureType: index === ordered.length - 1 ? "pressure_forward" : "open_knot",
    validationFlags: [] as string[],
  }));

  if (sequence.length === 1) {
    sequence = [
      sequence[0],
      {
        ...sequence[0],
        scenePlanId: `${sequence[0].scenePlanId}:governance-min-pair`,
        sceneOrder: 2,
        sceneRole: "closure_scene",
        validationFlags: ["cluster4_synthetic_adjacent_scene_for_governance_min_pair"],
      },
    ];
  }

  return ChapterCompositionPlanSchema.parse({
    artifact: "chapter_composition_plan",
    schemaVersion: "1.0.0",
    compositionPlanId: `${input.chapterId}:db-governance-plan`,
    chapterId: input.chapterId,
    parentBookId: input.bookId,
    parentNarrativePsychologyId: input.parentNarrativePsychologyId,
    parentChapterStateId: input.chapterId,
    activeThreadIds: ["continuity-thread-placeholder"],
    latentThreadIds: [],
    callbackThreadIds: [],
    routeRequirementStatus: {
      requiredLocationIds: [input.primaryRouteLocationId],
      missingLocationIds: [],
      recurrenceSatisfied: true,
      enforcementNotes: [],
    },
    philosophyRequirementStatus: {
      activePhilosophyThreadIds: [],
      explicitnessCeiling: 0.28,
      satisfied: false,
      warnings: ["cluster4_db_adapter_philosophy_thread_optional"],
    },
    compositionMode: "delayed_convergence",
    sceneCountTarget: Math.min(6, Math.max(2, sequence.length)),
    sceneSequence: sequence,
    sceneContrastProfile: {
      tonalContrast: 0.55,
      pressureContrast: 0.55,
      threadMixContrast: 0.5,
      settingContrast: 0.45,
      notes: [],
    },
    delayedConvergenceBindings: [],
    callbackMarkers: [],
    reinterpretationAnchors: [],
    densityScore: 0.65,
    densityWarnings: [],
    routeCoverageNotes: [],
    continuityCarryForwardPlan: ["cluster4_db_adapter_carry_forward"],
    unresolvedPressurePlan: ["cluster4_db_adapter_unresolved_pressure"],
    chapterClosureProfile: "convergence_teased",
    validationFlags: ["cluster4_db_backed_composition_plan"],
  });
}

/**
 * Prepares the same Cluster 3 governance merge used on the book1 regeneration path for a DB-backed scene run.
 */
export async function prepareCanonicalPreGenerationBundleForScene(sceneId: string): Promise<CanonicalPreGenerationBundle> {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    include: {
      chapter: { include: { book: true } },
      places: { take: 1 },
    },
  });
  const chapter = scene.chapter;
  const book = chapter.book;
  const sequenceInBook = Math.max(1, chapter.sequenceInBook);
  const chapterState = deriveChapterState({
    chapterId: chapter.id,
    bookId: book.id,
    sequenceNumber: sequenceInBook,
    era: chapter.historicalAnchor ?? "unspecified-era",
    timePosition: "governance_adapter",
    locationProfile: scene.locationNote ?? "unspecified-location",
    seasonPhase: "unspecified",
    progressionPhase: "phase_a",
    povWeightingCandidates: [
      { characterId: "natchitoches-matriarch-keeper", weight: 0.62, rationale: "governance_default_pov_weight" },
    ],
    axisInputs: DEFAULT_AXIS,
    activeContinuityThreads: [{ threadId: "lineage", label: "lineage", strength: 70 }],
    threatenedContinuityThreads: [],
    sourceBasis: ["cluster4_scene_generation_governance_adapter"],
  });

  const chapterPsychology = resolveChapterPsychologyForGovernance({
    chapterId: chapter.id,
    bookId: book.id,
    sequenceInBook,
  });

  const beatProfileRecommendation = deriveBeatProfileRecommendation(chapterState);
  const beatResult = new ChapterStateToBeatAssemblyChainService().run({
    chapterState,
    beatProfileRecommendation,
  });
  if (beatResult.status !== "ready") {
    throw new Error("cluster4_governance_prep: beat assembly not ready for production governance path");
  }

  const baseProse = new ProseGenerationConstraintDerivationService().derive({
    chapterPsychology,
    chapterState,
    beatChain: beatResult.chain,
    integration: { deferNarratorToCluster3: true },
  });

  const sceneRows = await prisma.scene.findMany({
    where: { chapterId: chapter.id },
    select: { id: true, orderInChapter: true },
  });
  const primaryPlaceId = scene.places[0]?.id ?? `governance-placeholder-place:${chapter.id}`;
  const primaryPlaceName = scene.places[0]?.name ?? "primary-place";

  const chapterCompositionPlan = buildChapterCompositionPlanFromDbScenes({
    chapterId: chapter.id,
    bookId: book.id,
    parentNarrativePsychologyId: book.id,
    sceneRows,
    primaryRouteLocationId: primaryPlaceId,
  });

  const settingReport = buildSettingCoverageReport({
    bookId: book.id,
    primaryLocationId: primaryPlaceId,
    primaryLocationName: primaryPlaceName,
  });

  const narrativeThreads: NarrativeThread[] = [];

  const governanceOrchestration = new CanonicalNarrativeGovernanceOrchestrationService();
  const orchestration = governanceOrchestration.orchestrate({
    proseConstraintsAfterLiteraryLayer: baseProse,
    epicId: book.epicId,
    bookId: book.id,
    chapterId: chapter.id,
    chapterSequence: sequenceInBook,
    chapterMode: chapterState.chapterMode,
    chapterPsychologyMode: chapterPsychology.chapterPsychologyMode,
    activeThreadIds: chapterCompositionPlan.activeThreadIds,
    chapterCompositionPlan,
    narrativeThreads,
    settingCoverageReport: settingReport,
    sceneIdsInChapter: sceneRows.map((r) => r.id),
    preparationPath: "db_production_scene_governance_adapter",
    literaryLayerParityNote:
      "DB production path applies Cluster 3 governance on prose constraints derived from chapter state + beat assembly; full book1 regeneration also layers literary-device-to-prose before this merge.",
  });

  return governanceOrchestration.toPreGenerationBundle(orchestration, {
    preparationPath: "db_production_scene_governance_adapter",
    literaryLayerParityNote:
      "DB production path applies Cluster 3 governance on prose constraints derived from chapter state + beat assembly; full book1 regeneration also layers literary-device-to-prose before this merge.",
  });
}
