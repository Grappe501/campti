import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getBrainDashboardData } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function BrainDashboardPage() {
  const d = await getBrainDashboardData();

  const statCards = [
    { label: "Sources", value: d.totalSources, href: "/admin/sources" },
    { label: "Fragments", value: d.totalFragments, href: "/admin/fragments" },
    { label: "Unplaced fragments", value: d.unplacedFragments, href: "/admin/fragments?placementStatus=unplaced" },
    {
      label: "Multi-candidate fragments",
      value: d.multiCandidateFragments,
      href: "/admin/fragments",
    },
    {
      label: "High ambiguity (≥4)",
      value: d.highAmbiguityFragments,
      href: "/admin/fragments",
    },
    {
      label: "Fragment → scene links",
      value: d.fragmentsLinkedToScenes,
      href: "/admin/fragments",
    },
    {
      label: "Fragment → chapter links",
      value: d.fragmentsLinkedToChapters,
      href: "/admin/fragments",
    },
    { label: "Open questions", value: d.openQuestionsCount, href: "/admin/questions" },
    { label: "Continuity notes", value: d.continuityNotesCount, href: "/admin/continuity" },
    {
      label: "Sources not decomposed",
      value: d.sourcesNotDecomposed,
      href: "/admin/sources",
    },
    {
      label: "Scenes weak grounding",
      value: d.scenesWeakGrounding,
      href: "/admin/scenes",
    },
    {
      label: "People without character profile",
      value: d.peopleWithoutCharacterProfile,
      href: "/admin/people",
    },
    {
      label: "Places without setting profile",
      value: d.placesWithoutSettingProfile,
      href: "/admin/places",
    },
    {
      label: "Fragments without world-model links",
      value: d.fragmentsWithoutWorldLinks,
      href: "/admin/fragments",
    },
    { label: "Meta scenes", value: d.metaScenesCount, href: "/admin/meta-scenes" },
    {
      label: "Meta scenes: POV without profile",
      value: d.metaScenesMissingPov,
      href: "/admin/meta-scenes",
    },
    {
      label: "Meta scenes: no linked fragments",
      value: d.metaScenesMissingFragments,
      href: "/admin/meta-scenes",
    },
    {
      label: "Meta scenes: constraints empty",
      value: d.metaScenesMissingConstraints,
      href: "/admin/meta-scenes",
    },
    {
      label: "Meta scenes: symbolic layer empty",
      value: d.metaScenesMissingSymbolic,
      href: "/admin/meta-scenes",
    },
    {
      label: "Meta scenes: emotional voltage empty",
      value: d.metaScenesMissingEmotionalVoltage,
      href: "/admin/meta-scenes",
    },
    {
      label: "Scenes without meta scene",
      value: d.scenesWithoutMetaScene,
      href: "/admin/scenes",
    },
    {
      label: "Profiles with no memories",
      value: d.peopleWithWeakMemoryCoverage,
      href: "/admin/people",
    },
    {
      label: "People with memory anchors",
      value: d.peopleWithMemoryAnchors,
      href: "/admin/people",
    },
    {
      label: "Settings missing sounds/smells/textures",
      value: d.placesWithWeakSensoryModel,
      href: "/admin/places",
    },
    {
      label: "Places: rich sensory model",
      value: d.placesWithRichSensoryModel,
      href: "/admin/places",
    },
    {
      label: "Meta scenes: sensory layer present",
      value: d.metaScenesWithSensoryLayer,
      href: "/admin/meta-scenes",
    },
    {
      label: "World anchors ready (meta scene)",
      value: d.worldAnchorsReady,
      href: "/admin/meta-scenes",
    },
    { label: "Fragment clusters", value: d.fragmentClustersCount, href: "/admin/clusters" },
    { label: "Cluster memberships (links)", value: d.fragmentClusterMemberships, href: "/admin/clusters" },
    {
      label: "High decomposition pressure",
      value: d.fragmentsHighDecompositionPressure,
      href: "/admin/fragments",
    },
    {
      label: "Fragments without hidden-meaning pass",
      value: d.fragmentsWithoutHiddenMeaning,
      href: "/admin/fragments",
    },
    {
      label: "Scene construction suggestions (open)",
      value: d.sceneConstructionSuggestionsOpen,
      href: "/admin/meta-scenes",
    },
    {
      label: "Meta scenes: weak POV state summary",
      value: d.metaScenesLowPovStrength,
      href: "/admin/meta-scenes",
    },
    {
      label: "Meta scenes: symbolic field empty",
      value: d.metaScenesLowSymbolicField,
      href: "/admin/meta-scenes",
    },
    {
      label: "Meta scenes: no central conflict",
      value: d.metaScenesWeakCentralConflict,
      href: "/admin/meta-scenes",
    },
    {
      label: "World anchors feel static (heuristic)",
      value: d.worldAnchorsFeelStatic,
      href: "/admin/meta-scenes",
    },
    {
      label: "Strong fragments not linked to meta scenes",
      value: d.unlinkedStrongFragments,
      href: "/admin/fragments",
    },
    { label: "Profiles: no Enneagram type", value: d.peopleWithoutEnneagramType, href: "/admin/people" },
    { label: "Profiles: inferred / hybrid source", value: d.peopleInferredEnneagramSource, href: "/admin/people" },
    { label: "Relationships: missing dynamics", value: d.relationshipsWithoutDynamics, href: "/admin/relationships" },
    { label: "Meta scenes: no soul suggestions", value: d.metaScenesNoSoulSuggestions, href: "/admin/meta-scenes" },
    { label: "Meta scenes: low heart (heuristic)", value: d.metaScenesLowHeartHeuristic, href: "/admin/meta-scenes" },
    { label: "Meta scenes: decorative environment", value: d.metaScenesDecorativeEnvironment, href: "/admin/meta-scenes" },
    { label: "Meta scenes: weak relationship pressure", value: d.metaScenesWeakRelationshipPressure, href: "/admin/meta-scenes" },
    { label: "Meta scenes: generic emotional engine", value: d.metaScenesGenericEmotionalEngine, href: "/admin/meta-scenes" },
    { label: "Narrative passes (stored)", value: d.narrativePassCount, href: "/admin/meta-scenes" },
    { label: "Meta scenes: descriptive cache empty", value: d.metaScenesMissingDescriptiveCache, href: "/admin/meta-scenes" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <PageHeader
        title="Brain"
        description="A calm overview of what the archive holds, what is still loose, and what needs review — without turning into noise."
      />

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Counts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-300/80"
            >
              <p className="text-xs font-medium text-stone-500">{c.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-900">{c.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900">Chapters with few fragment links</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {d.chaptersWithFewFragments.length === 0 ? (
              <li className="text-stone-500">No data yet.</li>
            ) : (
              d.chaptersWithFewFragments.map((c) => (
                <li key={c.chapterId} className="flex justify-between gap-2">
                  <Link href={`/admin/chapters/${c.chapterId}`} className="text-amber-900 hover:underline">
                    {c.title}
                  </Link>
                  <span className="shrink-0 text-xs text-stone-500">{c.linkCount} links</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900">Top symbols by scene usage</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {d.topSymbolsByUsage.length === 0 ? (
              <li className="text-stone-500">No symbols yet.</li>
            ) : (
              d.topSymbolsByUsage.map((s) => (
                <li key={s.symbolId} className="flex justify-between gap-2">
                  <span>{s.name}</span>
                  <span className="text-xs text-stone-500">{s.sceneCount} scenes</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-stone-900">Insight types (frequency)</h3>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {d.topThemesByInsight.length === 0 ? (
            <li className="text-stone-500">No insights yet.</li>
          ) : (
            d.topThemesByInsight.map((t) => (
              <li
                key={t.insightType}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-800"
              >
                {t.insightType}: {t.count}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-violet-100 bg-violet-50/20 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-stone-900">Recent narrative intelligence</h3>
        <p className="mt-1 text-xs text-stone-600">
          Stored structured passes — open the meta scene composer to generate more or review status.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {d.recentNarrativePasses.length === 0 ? (
            <li className="text-stone-500">No passes yet.</li>
          ) : (
            d.recentNarrativePasses.map((p) => (
              <li key={p.id} className="flex flex-col gap-0.5 border-b border-violet-100/80 pb-2 last:border-0">
                <span className="font-medium text-stone-800">
                  {p.passType} · {p.status}
                </span>
                <Link href={`/admin/meta-scenes/${p.metaSceneId}/compose`} className="text-xs text-amber-900 hover:underline">
                  Open compose →
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900">Recent soul suggestions</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {d.recentSoulSuggestions.length === 0 ? (
              <li className="text-stone-500">None yet.</li>
            ) : (
              d.recentSoulSuggestions.map((s) => (
                <li key={s.id} className="flex flex-col gap-0.5">
                  <span className="font-medium text-stone-800">{s.title}</span>
                  <span className="text-xs text-stone-500">
                    {s.suggestionType} · {s.status}
                    {s.metaSceneId ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link href={`/admin/meta-scenes/${s.metaSceneId}/compose`} className="text-amber-900 hover:underline">
                          compose
                        </Link>
                      </>
                    ) : null}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900">Recently updated inferred / hybrid profiles</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {d.recentInferredEnneagramProfiles.length === 0 ? (
              <li className="text-stone-500">None flagged.</li>
            ) : (
              d.recentInferredEnneagramProfiles.map((p) => (
                <li key={p.personId}>
                  <Link href={`/admin/characters/${p.personId}/mind`} className="text-amber-900 hover:underline">
                    Open mind
                  </Link>
                  <span className="ml-2 text-xs text-stone-500">{p.updatedAt.toISOString().slice(0, 10)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-stone-900">Meta scenes needing embodiment (heuristic)</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {d.metaScenesNeedingEmbodiment.length === 0 ? (
            <li className="text-stone-500">None flagged.</li>
          ) : (
            d.metaScenesNeedingEmbodiment.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/meta-scenes/${m.id}/compose`} className="text-amber-900 hover:underline">
                  {m.title}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900">Recent fragment clusters</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {d.recentClusters.length === 0 ? (
              <li className="text-stone-500">None yet.</li>
            ) : (
              d.recentClusters.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/clusters/${c.id}`} className="text-amber-900 hover:underline">
                    {c.title}
                  </Link>
                  <span className="ml-2 text-xs text-stone-500">
                    {c.clusterType} · {c.updatedAt.toISOString().slice(0, 10)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900">Recent scene construction suggestions</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {d.recentSceneSuggestions.length === 0 ? (
              <li className="text-stone-500">None yet.</li>
            ) : (
              d.recentSceneSuggestions.map((s) => (
                <li key={s.id} className="flex flex-col gap-0.5">
                  <span className="font-medium text-stone-800">{s.title}</span>
                  <span className="text-xs text-stone-500">
                    {s.suggestionType} · {s.status}
                    {s.metaSceneId ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link href={`/admin/meta-scenes/${s.metaSceneId}/compose`} className="text-amber-900 hover:underline">
                          compose
                        </Link>
                      </>
                    ) : null}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-stone-900">Meta scenes needing attention (heuristic)</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {d.metaScenesNeedingAttention.length === 0 ? (
            <li className="text-stone-500">None flagged.</li>
          ) : (
            d.metaScenesNeedingAttention.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/meta-scenes/${m.id}/compose`} className="text-amber-900 hover:underline">
                  {m.title}
                </Link>
                <span className="ml-2 text-xs text-stone-500">{m.placeName}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900">Recent fragment insights</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {d.recentInsights.length === 0 ? (
              <li className="text-stone-500">None yet.</li>
            ) : (
              d.recentInsights.map((i) => (
                <li key={i.id} className="border-b border-stone-100 pb-3 last:border-0">
                  <p className="text-xs uppercase text-stone-500">{i.insightType}</p>
                  <p className="mt-1 line-clamp-3 text-stone-800">{i.content}</p>
                  <Link
                    href={`/admin/fragments/${i.fragmentId}`}
                    className="mt-1 inline-block text-xs text-amber-900 hover:underline"
                  >
                    View fragment
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-stone-900">Continuity pressure (severity)</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {d.recentContinuityPressure.length === 0 ? (
              <li className="text-stone-500">None flagged.</li>
            ) : (
              d.recentContinuityPressure.map((n) => (
                <li key={n.id}>
                  <Link href={`/admin/continuity/${n.id}`} className="text-amber-900 hover:underline">
                    {n.title}
                  </Link>
                  <span className="ml-2 text-xs text-stone-500">
                    {n.severity} · {n.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-stone-900">Recent scene AI assist runs</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {d.recentSceneAssistRuns.length === 0 ? (
            <li className="text-stone-500">None yet.</li>
          ) : (
            d.recentSceneAssistRuns.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2">
                <Link href={`/admin/scenes/${r.sceneId}/workspace`} className="text-amber-900 hover:underline">
                  {r.assistType}
                </Link>
                <span className="text-xs text-stone-500">
                  {r.status} · {r.sceneId.slice(0, 8)}…
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-stone-900">Fragments needing review</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {d.fragmentsNeedingReview.length === 0 ? (
            <li className="text-stone-500">Queue empty.</li>
          ) : (
            d.fragmentsNeedingReview.map((f) => (
              <li key={f.id}>
                <Link href={`/admin/fragments/${f.id}`} className="text-amber-900 hover:underline">
                  {f.title?.trim() || f.fragmentType}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
