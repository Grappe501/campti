import type { BrainDashboardData } from "@/lib/data-access";

export type BrainPriorityGap = { label: string; count: number; href: string };

/**
 * Non-zero gap counts, sorted by pressure (descending). Drives the Brain 2 work queue.
 */
export function buildBrainPriorityGaps(d: BrainDashboardData): BrainPriorityGap[] {
  const items: BrainPriorityGap[] = [
    { label: "Unplaced fragments", count: d.unplacedFragments, href: "/admin/fragments?placementStatus=unplaced" },
    { label: "Fragments without world-model links", count: d.fragmentsWithoutWorldLinks, href: "/admin/fragments" },
    { label: "Sources not decomposed", count: d.sourcesNotDecomposed, href: "/admin/sources" },
    { label: "Meta scenes: no linked fragments", count: d.metaScenesMissingFragments, href: "/admin/meta-scenes" },
    { label: "People without character profile", count: d.peopleWithoutCharacterProfile, href: "/admin/people" },
    { label: "Places without setting profile", count: d.placesWithoutSettingProfile, href: "/admin/places" },
    { label: "Scenes without meta scene", count: d.scenesWithoutMetaScene, href: "/admin/scenes" },
    { label: "Meta scenes: POV without profile", count: d.metaScenesMissingPov, href: "/admin/meta-scenes" },
    { label: "Meta scenes: constraints empty", count: d.metaScenesMissingConstraints, href: "/admin/meta-scenes" },
    { label: "Meta scenes: symbolic layer empty", count: d.metaScenesMissingSymbolic, href: "/admin/meta-scenes" },
    { label: "Meta scenes: emotional voltage empty", count: d.metaScenesMissingEmotionalVoltage, href: "/admin/meta-scenes" },
    { label: "Fragments without hidden-meaning pass", count: d.fragmentsWithoutHiddenMeaning, href: "/admin/fragments" },
    { label: "Strong fragments not linked to meta scenes", count: d.unlinkedStrongFragments, href: "/admin/fragments" },
    { label: "Profiles: no Enneagram type", count: d.peopleWithoutEnneagramType, href: "/admin/people" },
    { label: "Relationships: missing dynamics", count: d.relationshipsWithoutDynamics, href: "/admin/relationships" },
    { label: "Scenes weak grounding", count: d.scenesWeakGrounding, href: "/admin/scenes" },
    { label: "Meta scenes: descriptive cache empty", count: d.metaScenesMissingDescriptiveCache, href: "/admin/meta-scenes" },
    { label: "Scene construction suggestions (open)", count: d.sceneConstructionSuggestionsOpen, href: "/admin/meta-scenes" },
  ];

  return items.filter((x) => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 12);
}
