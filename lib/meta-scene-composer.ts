import type {
  CharacterMemory,
  CharacterProfile,
  Fragment,
  MetaScene,
  SettingProfile,
  Source,
} from "@prisma/client";
import { FragmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMetaSceneContext, type MetaSceneWorldContext } from "@/lib/perspective-engine";

const ROLE_BUCKETS = [
  "informs_scene",
  "drives_conflict",
  "provides_symbolism",
  "represents_memory",
] as const;

export type SceneTensionHints = {
  possibleConflictTypes: string[];
  emotionalIntensifiers: string[];
  missingTensionWarnings: string[];
};

export type LinkedFragmentRow = {
  linkId: string;
  fragmentId: string;
  linkRole: string | null;
  fragment: Pick<
    Fragment,
    "id" | "title" | "fragmentType" | "summary" | "text" | "timeHint" | "emotionalTone"
  > & {
    source: Pick<Source, "id" | "title"> | null;
  };
};

export type SourceSummaryRow = {
  sourceId: string;
  title: string | null;
  fragmentCount: number;
};

export type MetaSceneComposerData = {
  world: MetaSceneWorldContext | null;
  profile: CharacterProfile | null;
  relevantMemories: CharacterMemory[];
  characterStatesForMoment: import("@prisma/client").CharacterState[];
  settingStates: import("@prisma/client").SettingState[];
  linkedByRole: Record<string, LinkedFragmentRow[]>;
  symbolicFragmentLinks: LinkedFragmentRow[];
  sceneSymbols: { id: string; name: string; meaning: string | null }[];
  candidateFragments: (Pick<
    Fragment,
    "id" | "title" | "fragmentType" | "summary" | "text" | "timeHint"
  > & {
    source: Pick<Source, "id" | "title"> | null;
  })[];
  sourceSummary: SourceSummaryRow[];
  tensionHints: SceneTensionHints;
  constraintHints: string[];
  searchResults: (Pick<
    Fragment,
    "id" | "title" | "fragmentType" | "summary" | "text"
  > & {
    source: Pick<Source, "id" | "title"> | null;
  })[];
};

function memorySort(a: CharacterMemory, b: CharacterMemory): number {
  const wa = a.emotionalWeight ?? 0;
  const wb = b.emotionalWeight ?? 0;
  if (wb !== wa) return wb - wa;
  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

export function deriveSceneTensionHints(meta: Pick<
  MetaScene,
  | "centralConflict"
  | "emotionalVoltage"
  | "characterStatesSummary"
  | "historicalConstraints"
  | "socialConstraints"
  | "symbolicElements"
>): SceneTensionHints {
  const possibleConflictTypes: string[] = [];
  const emotionalIntensifiers: string[] = [];
  const missingTensionWarnings: string[] = [];

  if (meta.centralConflict && meta.centralConflict.trim()) {
    possibleConflictTypes.push("interpersonal", "internal");
  } else {
    missingTensionWarnings.push("No central conflict named — tension may read as diffuse.");
  }

  if (meta.historicalConstraints?.trim()) possibleConflictTypes.push("environmental", "social");
  if (meta.socialConstraints?.trim()) possibleConflictTypes.push("social", "interpersonal");
  if (meta.symbolicElements?.trim()) possibleConflictTypes.push("existential", "internal");

  if (meta.emotionalVoltage?.trim()) {
    emotionalIntensifiers.push("Voltage label present — calibrate beats to match.");
  } else {
    missingTensionWarnings.push("Emotional voltage unset — readers lack intensity calibration.");
  }

  if (meta.characterStatesSummary?.trim()) {
    emotionalIntensifiers.push("Character state summary present — good for ensemble friction.");
  }

  const uniq = (xs: string[]) => [...new Set(xs)];
  return {
    possibleConflictTypes: uniq(possibleConflictTypes),
    emotionalIntensifiers,
    missingTensionWarnings,
  };
}

export async function deriveConstraintHints(
  placeId: string,
  timePeriod: string | null | undefined,
): Promise<string[]> {
  const profile = await prisma.settingProfile.findUnique({ where: { placeId } });
  const hints: string[] = [];

  if (profile?.socialRules?.trim()) hints.push(`Social rules: ${profile.socialRules.trim().slice(0, 200)}`);
  if (profile?.classDynamics?.trim()) hints.push("Class limitations may restrict movement and speech.");
  if (profile?.racialDynamics?.trim()) hints.push("Racial dynamics may gate access or visibility.");
  if (profile?.religiousPresence?.trim()) hints.push("Religious presence may constrain timing or behavior.");
  if (profile?.economicContext?.trim()) hints.push("Economic context may limit options and props.");

  const tp = timePeriod?.trim();
  if (tp) hints.push(`Time window “${tp}” — align technology, travel, and dress with period sources.`);

  return hints;
}

export async function getMetaSceneComposerData(
  metaSceneId: string,
  search?: { q?: string; fragmentType?: string },
): Promise<MetaSceneComposerData | null> {
  const world = await buildMetaSceneContext(metaSceneId);
  if (!world) return null;

  const meta = world.metaScene;
  const povId = meta.povPersonId;
  const placeId = meta.placeId;

  const [profile, memories, characterProfileRow, settingProfileRow, sceneWithSymbols, fragmentLinks] =
    await Promise.all([
      prisma.characterProfile.findUnique({ where: { personId: povId } }),
      prisma.characterMemory.findMany({
        where: {
          personId: povId,
          ...(meta.timePeriod
            ? {
                OR: [{ timePeriod: null }, { timePeriod: "" }, { timePeriod: meta.timePeriod }],
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 24,
      }),
      prisma.characterProfile.findUnique({ where: { personId: povId }, select: { id: true } }),
      prisma.settingProfile.findUnique({ where: { placeId }, select: { id: true } }),
      meta.sceneId
        ? prisma.scene.findUnique({
            where: { id: meta.sceneId },
            select: {
              symbols: { select: { id: true, name: true, meaning: true } },
            },
          })
        : Promise.resolve(null),
      prisma.fragmentLink.findMany({
        where: { linkedType: "meta_scene", linkedId: metaSceneId },
        include: {
          fragment: {
            select: {
              id: true,
              title: true,
              fragmentType: true,
              summary: true,
              text: true,
              timeHint: true,
              emotionalTone: true,
              source: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  const relevantMemories = [...memories].sort(memorySort).slice(0, 5);

  const characterStatesForMoment = await prisma.characterState.findMany({
    where: {
      personId: povId,
      ...(meta.sceneId ? { OR: [{ sceneId: meta.sceneId }, { sceneId: null }] } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const linkedIds = new Set(fragmentLinks.map((l) => l.fragmentId));

  const orClauses: { linkedType: string; linkedId: string }[] = [
    { linkedType: "person", linkedId: povId },
    { linkedType: "place", linkedId: placeId },
  ];
  if (characterProfileRow) {
    orClauses.push({ linkedType: "character_profile", linkedId: characterProfileRow.id });
  }
  if (settingProfileRow) {
    orClauses.push({ linkedType: "setting_profile", linkedId: settingProfileRow.id });
  }

  const memoryRows = await prisma.characterMemory.findMany({
    where: { personId: povId },
    select: { id: true },
    take: 48,
  });
  for (const mr of memoryRows) {
    orClauses.push({ linkedType: "character_memory", linkedId: mr.id });
  }

  const candidateLinkRows = await prisma.fragmentLink.findMany({
    where: {
      ...(linkedIds.size ? { fragmentId: { notIn: [...linkedIds] } } : {}),
      OR: orClauses,
    },
    select: { fragmentId: true },
    take: 120,
  });
  const seenCand = new Set<string>();
  const candIds: string[] = [];
  for (const r of candidateLinkRows) {
    if (seenCand.has(r.fragmentId)) continue;
    seenCand.add(r.fragmentId);
    candIds.push(r.fragmentId);
    if (candIds.length >= 40) break;
  }

  let candidateFragments: MetaSceneComposerData["candidateFragments"] = [];
  if (candIds.length > 0) {
    const rows = await prisma.fragment.findMany({
      where: { id: { in: candIds } },
      select: {
        id: true,
        title: true,
        fragmentType: true,
        summary: true,
        text: true,
        timeHint: true,
        source: { select: { id: true, title: true } },
      },
    });
    const order = new Map(candIds.map((id, i) => [id, i]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    candidateFragments = rows;
  }

  const linkedByRole: Record<string, LinkedFragmentRow[]> = {};
  for (const r of ROLE_BUCKETS) linkedByRole[r] = [];
  linkedByRole.other = [];

  const symbolicFragmentLinks: LinkedFragmentRow[] = [];

  for (const link of fragmentLinks) {
    const row: LinkedFragmentRow = {
      linkId: link.id,
      fragmentId: link.fragmentId,
      linkRole: link.linkRole,
      fragment: link.fragment,
    };
    const role = link.linkRole ?? "";
    if (ROLE_BUCKETS.includes(role as (typeof ROLE_BUCKETS)[number])) {
      linkedByRole[role]!.push(row);
    } else {
      linkedByRole.other!.push(row);
    }
    if (role === "provides_symbolism" || link.fragment.fragmentType === FragmentType.SYMBOLIC_NOTE) {
      symbolicFragmentLinks.push(row);
    }
  }

  const sourceMap = new Map<string, { title: string | null; count: number }>();
  for (const link of fragmentLinks) {
    const sid = link.fragment.source?.id;
    if (!sid) continue;
    const cur = sourceMap.get(sid) ?? { title: link.fragment.source!.title, count: 0 };
    cur.count += 1;
    sourceMap.set(sid, cur);
  }
  const sourceSummary: SourceSummaryRow[] = [...sourceMap.entries()].map(([sourceId, v]) => ({
    sourceId,
    title: v.title,
    fragmentCount: v.count,
  }));
  sourceSummary.sort((a, b) => b.fragmentCount - a.fragmentCount);

  const tensionHints = deriveSceneTensionHints(meta);
  const constraintHints = await deriveConstraintHints(placeId, meta.timePeriod);

  let searchResults: MetaSceneComposerData["searchResults"] = [];
  const q = search?.q?.trim();
  if (q && q.length >= 1) {
    const ft = search?.fragmentType?.length
      ? (Object.values(FragmentType).includes(search.fragmentType as FragmentType)
          ? (search.fragmentType as FragmentType)
          : undefined)
      : undefined;
    searchResults = await prisma.fragment.findMany({
      where: {
        AND: [
          ft ? { fragmentType: ft } : {},
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
              { text: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        fragmentType: true,
        summary: true,
        text: true,
        source: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    });
  }

  return {
    world,
    profile,
    relevantMemories,
    characterStatesForMoment,
    settingStates: world.settingStates,
    linkedByRole,
    symbolicFragmentLinks,
    sceneSymbols: sceneWithSymbols?.symbols ?? [],
    candidateFragments,
    sourceSummary,
    tensionHints,
    constraintHints,
    searchResults,
  };
}

export type WorldStatePreview = {
  povSummary: string;
  environmentSummary: string;
  emotionalContext: string;
  constraintsSummary: string;
  symbolicSummary: string;
};

/**
 * Read-only prose-like blocks for the composer (structured, not generated fiction).
 */
export async function buildWorldStatePreview(metaSceneId: string): Promise<WorldStatePreview | null> {
  const data = await getMetaSceneComposerData(metaSceneId);
  if (!data?.world) return null;

  const m = data.world.metaScene;
  const placeName = m.place?.name ?? "this place";
  const povName = m.povPerson?.name ?? "the POV character";

  const povSummary = [
    `Point of view: ${povName}.`,
    data.profile?.worldview?.trim()
      ? `Worldview: ${data.profile.worldview.trim()}`
      : "Worldview not recorded on the character profile.",
    data.relevantMemories.length
      ? `Salient memories (${data.relevantMemories.length} surfaced): ${data.relevantMemories
          .map((mem) => mem.description.slice(0, 120))
          .join(" · ")}`
      : "Few or no memories matched this time window — consider adding memories or widening the period.",
  ].join("\n\n");

  const sp = data.world.settingProfile;
  const environmentSummary = [
    `Place: ${placeName}.`,
    sp?.physicalDescription?.trim()
      ? `Physical: ${sp.physicalDescription.trim().slice(0, 800)}`
      : "Physical description not set on the setting profile.",
    [
      sp?.sounds?.trim() ? `Sounds: ${sp.sounds}` : null,
      sp?.smells?.trim() ? `Smells: ${sp.smells}` : null,
      sp?.textures?.trim() ? `Textures: ${sp.textures}` : null,
      sp?.lightingConditions?.trim() ? `Light: ${sp.lightingConditions}` : null,
      sp?.climateDescription?.trim() ? `Climate: ${sp.climateDescription}` : null,
    ]
      .filter(Boolean)
      .join("\n") || "Sensory column mostly empty — enrich the setting profile or link sensory fragments.",
  ].join("\n\n");

  const emotionalContext = [
    data.profile?.emotionalBaseline?.trim()
      ? `Baseline: ${data.profile.emotionalBaseline.trim()}`
      : "Emotional baseline not set.",
    m.emotionalVoltage?.trim() ? `Voltage: ${m.emotionalVoltage.trim()}` : "Emotional voltage not labeled for this meta scene.",
    m.characterStatesSummary?.trim()
      ? `Ensemble / state notes: ${m.characterStatesSummary.trim()}`
      : null,
    data.characterStatesForMoment.length
      ? `Scene-scoped states recorded: ${data.characterStatesForMoment.length} row(s).`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const constraintsSummary = [
    m.historicalConstraints?.trim()
      ? `Historical: ${m.historicalConstraints.trim()}`
      : "Historical constraints not written.",
    m.socialConstraints?.trim() ? `Social: ${m.socialConstraints.trim()}` : "Social constraints not written.",
    m.sourceSupportLevel?.trim() ? `Source support (declared): ${m.sourceSupportLevel.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const symbolicSummary = [
    m.symbolicElements?.trim()
      ? `Author symbolic notes: ${m.symbolicElements.trim()}`
      : "Symbolic elements field is open.",
    data.sceneSymbols.length
      ? `Symbols on linked draft scene: ${data.sceneSymbols.map((s) => s.name).join(", ")}.`
      : m.sceneId
        ? "Linked scene has no symbols attached yet."
        : "No draft scene linked — symbol associations come from the scene workspace when connected.",
    data.symbolicFragmentLinks.length
      ? `Fragments in symbolic roles: ${data.symbolicFragmentLinks.length}.`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    povSummary,
    environmentSummary,
    emotionalContext,
    constraintsSummary,
    symbolicSummary,
  };
}
