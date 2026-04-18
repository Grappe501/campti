import { AuthorCommandCockpit } from "@/components/admin/author-command-cockpit";
import { prisma } from "@/lib/prisma";
import { evaluateSceneLaunchGuard } from "@/lib/services/scene-launch-guard-service";
import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import { buildCharacterSimulationCockpitPanelForScene } from "@/lib/services/character-simulation-cockpit-inspection-service";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";
import { buildEnforcementRegistry } from "@/lib/services/enforcement-registry-service";
import { summarizeRicreForScene } from "@/lib/services/ricre-canon-knowledge-loader-service";
import { buildCharacterSimulationWorkbenchSceneRollup } from "@/lib/services/character-simulation-workbench-scene-aggregate-service";
import { buildSceneDecisionAssistViewModel } from "@/lib/services/scene-decision-assist-service";
import { RUNTIME_ID_COCKPIT_INSPECTION } from "@/lib/services/runtime-authority-registry-service";

export const dynamic = "force-dynamic";

type NarrativePageProps = {
  searchParams: Promise<{
    scope?: string;
    sceneId?: string;
    chapterId?: string;
    bookId?: string;
    epicId?: string;
  }>;
};

export default async function NarrativeHubPage({ searchParams }: NarrativePageProps) {
  const sp = await searchParams;
  const epics = await prisma.epic.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      books: { orderBy: { movementIndex: "asc" } },
    },
  });
  const books = await prisma.book.findMany({
    orderBy: [{ movementIndex: "asc" }, { updatedAt: "desc" }],
    take: 24,
    include: {
      chapters: { select: { id: true }, orderBy: { sequenceInBook: "asc" } },
    },
  });
  const chapters = await prisma.chapter.findMany({
    orderBy: [{ chapterNumber: "asc" }, { updatedAt: "desc" }],
    take: 36,
    include: {
      scenes: { select: { id: true }, orderBy: { orderInChapter: "asc" } },
    },
  });
  const scenes = await prisma.scene.findMany({
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: {
      persons: { select: { id: true } },
      places: { select: { id: true } },
      events: { select: { id: true } },
      chapter: { select: { id: true, title: true } },
    },
  });

  const context = resolveCockpitScopeContext({
    scope: sp.scope ?? "scene",
    sceneId: sp.sceneId ?? scenes[0]?.id,
    chapterId: sp.chapterId ?? chapters[0]?.id,
    bookId: sp.bookId ?? books[0]?.id,
    epicId: sp.epicId ?? epics[0]?.id,
  });

  const selectedScene = context.sceneId ? scenes.find((scene) => scene.id === context.sceneId) ?? null : null;
  const selectedChapter = context.chapterId ? chapters.find((chapter) => chapter.id === context.chapterId) ?? null : null;
  const selectedBook = context.bookId ? books.find((book) => book.id === context.bookId) ?? null : null;
  const selectedEpic = context.epicId ? epics.find((epic) => epic.id === context.epicId) ?? null : null;

  const metrics = deriveScopeMetrics({
    scope: context.scope,
    selectedScene,
    selectedChapter,
    selectedBook,
    selectedEpic,
  });

  const characterSimulationPanel =
    context.scope === "scene" && context.sceneId
      ? await buildCharacterSimulationCockpitPanelForScene(context.sceneId)
      : null;

  const enforcementRegistry = buildEnforcementRegistry();

  const ricreSummary =
    context.scope === "scene" && context.sceneId ? await summarizeRicreForScene(context.sceneId) : null;

  const workbenchRollup =
    context.scope === "scene" && selectedScene?.persons?.length
      ? await buildCharacterSimulationWorkbenchSceneRollup(selectedScene.persons.map((p) => p.id))
      : undefined;

  const sceneLaunchGuard =
    context.scope === "scene" && context.sceneId ? await evaluateSceneLaunchGuard(context.sceneId) : null;

  const sceneDecisionAssistVm =
    context.scope === "scene" && context.sceneId ? await buildSceneDecisionAssistViewModel(context.sceneId) : null;
  const sceneDecisionAssistCard =
    sceneDecisionAssistVm?.recommendations.primary && context.sceneId
      ? {
          primaryTitle: sceneDecisionAssistVm.recommendations.primary.title,
          primaryRecommendation: sceneDecisionAssistVm.recommendations.primary.recommendationText,
          strength: sceneDecisionAssistVm.recommendations.primary.strength,
          sceneAssistHref: `/admin/scenes/${context.sceneId}?tab=assist`,
        }
      : null;

  const bundle = buildAuthorCommandCockpitBundle({
    runtimeId: RUNTIME_ID_COCKPIT_INSPECTION,
    context,
    labels: {
      sceneLabel: selectedScene?.description,
      chapterLabel: selectedChapter?.title,
      bookLabel: selectedBook?.title,
      epicLabel: selectedEpic?.title,
    },
    metrics,
    characterSimulation: characterSimulationPanel ?? undefined,
    ricreResearchCanon: ricreSummary
      ? {
          sceneId: context.sceneId,
          linkedTargets: ricreSummary.linkedTargets,
          openClaims: ricreSummary.openClaims,
          contradictions: ricreSummary.contradictions,
          acceptedCanonRecords: ricreSummary.acceptedCanonRecords,
          lastDecisionAt: ricreSummary.lastDecisionAt,
          workflowNote:
            "RICRE: ingest with provenance → extract structured claims → compare to canon → author decision → optional prompt grounding. Raw research never silently becomes canon.",
          observationalOnly: true,
          validationFlags: [],
        }
      : undefined,
    operatorExecutionSummary: {
      canonicalRuntimePath: `${enforcementRegistry.canonicalRuntimeId} — canonical scene generation + save path. This page assembles read-only cockpit bundles under ${RUNTIME_ID_COCKPIT_INSPECTION} (observational; no prose mutation).`,
      cockpitRuntimeId: RUNTIME_ID_COCKPIT_INSPECTION,
      cockpitObservationalOnly: true,
      characterSimulationProfileTruth:
        characterSimulationPanel?.profileTruth ?? "deterministic_seed_only",
      quickLinks: [
        ...(context.scope === "scene" && context.sceneId
          ? [
              {
                label: "Run ledger, diff & analytics (scene)",
                href: `/admin/scenes/${context.sceneId}?tab=runs`,
                advisory: "Ledger, structured diff, outcome signals — replay stays guarded.",
              },
              {
                label: "Decision assist (scene)",
                href: `/admin/scenes/${context.sceneId}?tab=assist`,
                advisory: "Traceable next-step guidance — advisory only.",
              },
            ]
          : []),
        { label: "Scenes (rerun / save)", href: "/admin/scenes", advisory: "Uses runSceneGeneration — same canonical stack as production." },
        { label: "Chapters", href: "/admin/chapters" },
        { label: "Continuity", href: "/admin/continuity" },
        {
          label: "People (author simulation JSON)",
          href: "/admin/people",
          advisory: "Persist Cluster-8 mind/voice on CharacterSimulationAuthorBundle (Prisma); seed remains fallback.",
        },
        ...(selectedScene?.persons[0]
          ? [
              {
                label: "Character Simulation Workbench",
                href: `/admin/people/${selectedScene.persons[0].id}/simulation-workbench`,
                advisory: "Per-person authoring surface; pick other cast from People if needed.",
              },
            ]
          : []),
        {
          label: "Research and canon workbench (RICRE)",
          href: "/admin/research",
          advisory: "Governed ingest → claims → comparisons → author decisions; observational in cockpit.",
        },
        { label: "Readiness", href: "/admin/readiness" },
      ],
      characterSimulationWorkbenchRollup: workbenchRollup,
    },
  });

  return (
    <AuthorCommandCockpit
      bundle={bundle}
      sceneLaunchGuard={sceneLaunchGuard}
      sceneLaunchSceneTitle={selectedScene?.description ?? null}
      sceneDecisionAssistCard={sceneDecisionAssistCard}
      scopeOptions={{
        scene: scenes.map((scene) => ({
          id: scene.id,
          label: scene.description.slice(0, 28),
          href: `/admin/narrative?scope=scene&sceneId=${scene.id}`,
        })),
        chapter: chapters.map((chapter) => ({
          id: chapter.id,
          label: chapter.title.slice(0, 28),
          href: `/admin/narrative?scope=chapter&chapterId=${chapter.id}`,
        })),
        book: books.map((book) => ({
          id: book.id,
          label: `M${book.movementIndex} ${book.title}`.slice(0, 28),
          href: `/admin/narrative?scope=book&bookId=${book.id}`,
        })),
        epic: epics.map((epic) => ({
          id: epic.id,
          label: epic.title.slice(0, 28),
          href: `/admin/narrative?scope=epic&epicId=${epic.id}`,
        })),
      }}
    />
  );
}

type SceneMetricSource = {
  draftText: string | null;
  persons: Array<{ id: string }>;
  places: Array<{ id: string }>;
  events: Array<{ id: string }>;
};

type ChapterMetricSource = {
  scenes: Array<{ id: string }>;
  status?: string | null;
};

type BookMetricSource = {
  chapters: Array<{ id: string }>;
  narrativeAssemblyStatus?: string | null;
};

type EpicMetricSource = {
  books: Array<{ id: string }>;
};

function deriveScopeMetrics(input: {
  scope: "scene" | "chapter" | "book" | "epic";
  selectedScene: SceneMetricSource | null;
  selectedChapter: ChapterMetricSource | null;
  selectedBook: BookMetricSource | null;
  selectedEpic: EpicMetricSource | null;
}): Record<string, number> {
  if (input.scope === "scene") {
    const scene = input.selectedScene;
    const density = Math.min(1, ((scene?.persons.length ?? 0) + (scene?.places.length ?? 0) + (scene?.events.length ?? 0)) / 10);
    return {
      emotionalIntensity: density,
      unresolvedPressure: scene?.draftText ? 0.4 : 0.8,
      memoryActivationLoad: density,
      relationshipTension: scene && scene.persons.length > 1 ? 0.7 : 0.3,
      continuityRisk: scene?.draftText ? 0.3 : 0.7,
      interactionSensitivity: density,
      voiceReadiness: scene?.draftText ? 0.7 : 0.3,
      sceneFunction: scene?.draftText ? 0.7 : 0.4,
    };
  }
  if (input.scope === "chapter") {
    const chapter = input.selectedChapter;
    const sceneCount = chapter?.scenes.length ?? 0;
    const normalized = Math.min(1, sceneCount / 8);
    return {
      chapterProgressionState: normalized,
      transitionBrittleness: sceneCount < 2 ? 0.8 : 0.3,
      arcDensity: normalized,
      pacingPressure: sceneCount > 6 ? 0.7 : 0.4,
      contradictionRisk: chapter?.status === "approved" ? 0.2 : 0.5,
      unresolvedCarryover: chapter?.status === "approved" ? 0.2 : 0.6,
      chapterReadiness: chapter?.status === "approved" ? 0.85 : 0.45,
      coherenceScore: sceneCount > 0 ? 0.65 : 0.25,
    };
  }
  if (input.scope === "book") {
    const book = input.selectedBook;
    const chapterCount = book?.chapters.length ?? 0;
    const normalized = Math.min(1, chapterCount / 12);
    return {
      activeArcHealth: normalized,
      movementBalance: chapterCount > 3 ? 0.4 : 0.7,
      pressureDistribution: chapterCount > 0 ? 0.4 : 0.8,
      branchRisk: chapterCount > 8 ? 0.7 : 0.3,
      bookCoherence: chapterCount > 0 ? 0.6 : 0.2,
      revisionState: book?.narrativeAssemblyStatus === "approved" ? 0.2 : 0.6,
      releaseReadiness: book?.narrativeAssemblyStatus === "approved" ? 0.85 : 0.4,
      unresolvedBlockers: chapterCount > 0 ? 0.4 : 0.8,
    };
  }
  const epic = input.selectedEpic;
  const bookCount = epic?.books.length ?? 0;
  const normalized = Math.min(1, bookCount / 6);
  return {
    worldStateDistribution: normalized,
    multiBookContinuity: bookCount > 1 ? 0.35 : 0.7,
    lineageConsistency: bookCount > 1 ? 0.3 : 0.6,
    globalArcMap: normalized,
    thematicRecurrence: normalized,
    epicCoherence: bookCount > 0 ? 0.6 : 0.2,
    productionProgress: normalized,
  };
}
