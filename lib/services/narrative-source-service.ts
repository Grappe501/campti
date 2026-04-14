/**
 * Narrative source ingestion — temporal truth firewall (P2-B).
 *
 * All reads that attach authored or historical material to a world slice MUST go through this layer
 * (or helpers it exports) so that **no “future” sources leak into earlier world states** and
 * **earlier slices never see sources whose validity begins after the current state**.
 *
 * **World-state chronology** uses the shared backbone: `WorldStateReference.chronologyIndex` (lower = earlier)
 * via `lib/services/world-state-chronology.ts` and `lib/domain/world-state-chronology.ts`.
 * Raw `WorldStateReference.id` strings MUST NEVER be treated as timeline order.
 *
 * **Calendar years** (`startYear` / `endYear` on `NarrativeSource`) are a separate axis from world-state
 * chronology: both may apply, but neither substitutes for the other.
 *
 * Do not bypass this module to feed narrative text into simulation, cognition, or scene pipelines;
 * extend it here so enforcement stays centralized.
 */

import type { Prisma } from "@prisma/client";

import type { WorldStateChronologyIndexById } from "@/lib/domain/world-state-chronology";
import { worldStateFallsWithinChronologyWindow } from "@/lib/domain/world-state-chronology";
import {
  NarrativeSourceScope as NarrativeSourceScopeEnum,
  NarrativeSourceTruthMode as NarrativeSourceTruthModeEnum,
  type NarrativeAuthorType,
  type NarrativeSource,
  type NarrativeSourceScope,
  type NarrativeSourceTruthMode,
} from "@/lib/domain/narrative-source";
import { prisma } from "@/lib/prisma";
import { getWorldStateChronologyIndex } from "@/lib/services/world-state-chronology";

export type { WorldStateChronologyIndexById };

const AUTHOR_TYPES: readonly NarrativeAuthorType[] = ["steve", "historical", "other"];

const SCOPES: readonly NarrativeSourceScope[] = [
  NarrativeSourceScopeEnum.Global,
  NarrativeSourceScopeEnum.Regional,
  NarrativeSourceScopeEnum.Family,
  NarrativeSourceScopeEnum.Character,
];

const TRUTH_MODES: readonly NarrativeSourceTruthMode[] = [
  NarrativeSourceTruthModeEnum.Authoritative,
  NarrativeSourceTruthModeEnum.Interpretive,
  NarrativeSourceTruthModeEnum.Fictionalized,
];

export type CreateNarrativeSourceInput = {
  title: string;
  authorType: NarrativeAuthorType;
  effectiveStartWorldStateId: string;
  effectiveEndWorldStateId?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  scope: NarrativeSourceScope;
  truthMode: NarrativeSourceTruthMode;
  tags: string[];
  content: string;
  metadataJson?: Prisma.InputJsonValue | null;
};

export type ListNarrativeSourcesFilter = {
  authorType?: NarrativeAuthorType;
  scope?: NarrativeSourceScope;
  truthMode?: NarrativeSourceTruthMode;
  /** Case-insensitive substring match on `title`. */
  titleContains?: string;
  /** Sources whose `tags` array contains this exact string. */
  tag?: string;
};

function assertYearRange(startYear: number | null | undefined, endYear: number | null | undefined) {
  if (startYear != null && endYear != null && startYear > endYear) {
    throw new Error(
      `Invalid narrative source years: startYear (${startYear}) must be <= endYear (${endYear}).`
    );
  }
}

function assertAuthorType(authorType: string): asserts authorType is NarrativeAuthorType {
  if (!AUTHOR_TYPES.includes(authorType as NarrativeAuthorType)) {
    throw new Error(
      `Invalid authorType "${authorType}". Expected one of: ${AUTHOR_TYPES.join(", ")}.`
    );
  }
}

function assertScope(scope: string): asserts scope is NarrativeSourceScope {
  if (!SCOPES.includes(scope as NarrativeSourceScope)) {
    throw new Error(`Invalid scope "${scope}". Expected one of: ${SCOPES.join(", ")}.`);
  }
}

function assertTruthMode(truthMode: string): asserts truthMode is NarrativeSourceTruthMode {
  if (!TRUTH_MODES.includes(truthMode as NarrativeSourceTruthMode)) {
    throw new Error(`Invalid truthMode "${truthMode}". Expected one of: ${TRUTH_MODES.join(", ")}.`);
  }
}

function validateCreateInput(input: CreateNarrativeSourceInput) {
  assertAuthorType(input.authorType);
  assertScope(input.scope);
  assertTruthMode(input.truthMode);
  assertYearRange(input.startYear ?? null, input.endYear ?? null);
}

async function assertEffectiveWorldStateWindow(
  effectiveStartWorldStateId: string,
  effectiveEndWorldStateId: string | null | undefined
): Promise<void> {
  const start = await getWorldStateChronologyIndex(effectiveStartWorldStateId);
  if (start === null) {
    throw new Error(`Unknown effectiveStartWorldStateId: ${effectiveStartWorldStateId}`);
  }
  if (effectiveEndWorldStateId == null || effectiveEndWorldStateId === "") {
    return;
  }
  const end = await getWorldStateChronologyIndex(effectiveEndWorldStateId);
  if (end === null) {
    throw new Error(`Unknown effectiveEndWorldStateId: ${effectiveEndWorldStateId}`);
  }
  if (start > end) {
    throw new Error(
      `Narrative source world-state window is invalid: effective start (${effectiveStartWorldStateId}, chronologyIndex ${start}) is after effective end (${effectiveEndWorldStateId}, chronologyIndex ${end}).`
    );
  }
}

function toDomain(row: {
  id: string;
  title: string;
  authorType: string;
  createdAt: Date;
  effectiveStartWorldStateId: string;
  effectiveEndWorldStateId: string | null;
  startYear: number | null;
  endYear: number | null;
  scope: string;
  truthMode: string;
  tags: string[];
  content: string;
  metadataJson: Prisma.JsonValue | null;
}): NarrativeSource {
  return {
    id: row.id,
    title: row.title,
    authorType: row.authorType,
    createdAt: row.createdAt,
    effectiveStartWorldStateId: row.effectiveStartWorldStateId,
    effectiveEndWorldStateId: row.effectiveEndWorldStateId,
    startYear: row.startYear,
    endYear: row.endYear,
    scope: row.scope,
    truthMode: row.truthMode,
    tags: row.tags,
    content: row.content,
    metadataJson: row.metadataJson,
  };
}

/**
 * Pure visibility check — mirrors {@link getSourcesForWorldState} / DB filters for tests and call sites
 * that already hold rows in memory.
 *
 * World-state rules use {@link worldStateFallsWithinChronologyWindow} (canonical `chronologyIndex` only).
 * When `year` is set, `startYear` / `endYear` apply as a **separate** filter from world-state chronology.
 */
export function narrativeSourceIsVisibleAtWorldState(
  source: Pick<
    NarrativeSource,
    | "effectiveStartWorldStateId"
    | "effectiveEndWorldStateId"
    | "startYear"
    | "endYear"
  >,
  worldStateId: string,
  chronologyIndexById: WorldStateChronologyIndexById,
  year?: number
): boolean {
  if (
    !worldStateFallsWithinChronologyWindow(
      worldStateId,
      source.effectiveStartWorldStateId,
      source.effectiveEndWorldStateId,
      chronologyIndexById
    )
  ) {
    return false;
  }

  if (year !== undefined) {
    if (source.startYear != null && year < source.startYear) {
      return false;
    }
    if (source.endYear != null && year > source.endYear) {
      return false;
    }
  }
  return true;
}

/** World-state slice filter using `chronologyIndex`; `year` applies an independent calendar-year gate when set. */
function buildNarrativeSourceWorldStateWhere(
  worldChronologyIndex: number,
  year?: number
): Prisma.NarrativeSourceWhereInput {
  const yearClause: Prisma.NarrativeSourceWhereInput[] =
    year === undefined
      ? []
      : [
          {
            OR: [{ startYear: null }, { startYear: { lte: year } }],
          },
          {
            OR: [{ endYear: null }, { endYear: { gte: year } }],
          },
        ];

  return {
    AND: [
      { effectiveStartWorldState: { chronologyIndex: { lte: worldChronologyIndex } } },
      {
        OR: [
          { effectiveEndWorldStateId: null },
          { effectiveEndWorldState: { chronologyIndex: { gte: worldChronologyIndex } } },
        ],
      },
      ...yearClause,
    ],
  };
}

function buildListWhere(filter: ListNarrativeSourcesFilter): Prisma.NarrativeSourceWhereInput {
  const clauses: Prisma.NarrativeSourceWhereInput[] = [];
  if (filter.authorType != null) {
    clauses.push({ authorType: filter.authorType });
  }
  if (filter.scope != null) {
    clauses.push({ scope: filter.scope });
  }
  if (filter.truthMode != null) {
    clauses.push({ truthMode: filter.truthMode });
  }
  if (filter.titleContains != null && filter.titleContains.trim() !== "") {
    clauses.push({
      title: { contains: filter.titleContains.trim(), mode: "insensitive" },
    });
  }
  if (filter.tag != null && filter.tag !== "") {
    clauses.push({ tags: { has: filter.tag } });
  }
  if (clauses.length === 0) {
    return {};
  }
  return { AND: clauses };
}

export async function createNarrativeSource(
  input: CreateNarrativeSourceInput
): Promise<NarrativeSource> {
  validateCreateInput(input);
  await assertEffectiveWorldStateWindow(
    input.effectiveStartWorldStateId,
    input.effectiveEndWorldStateId
  );
  const row = await prisma.narrativeSource.create({
    data: {
      title: input.title,
      authorType: input.authorType,
      effectiveStartWorldStateId: input.effectiveStartWorldStateId,
      effectiveEndWorldStateId: input.effectiveEndWorldStateId ?? null,
      startYear: input.startYear ?? null,
      endYear: input.endYear ?? null,
      scope: input.scope,
      truthMode: input.truthMode,
      tags: input.tags,
      content: input.content,
      metadataJson:
        input.metadataJson === undefined || input.metadataJson === null
          ? undefined
          : input.metadataJson,
    },
  });
  return toDomain(row);
}

export async function getNarrativeSourceById(id: string): Promise<NarrativeSource | null> {
  const row = await prisma.narrativeSource.findUnique({ where: { id } });
  return row ? toDomain(row) : null;
}

export async function listNarrativeSources(
  filter: ListNarrativeSourcesFilter = {}
): Promise<NarrativeSource[]> {
  const rows = await prisma.narrativeSource.findMany({
    where: buildListWhere(filter),
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDomain);
}

/**
 * Sources visible at `worldStateId` without backward contamination from later-validity sources.
 * Optional `year` tightens using `startYear` / `endYear` when set on rows (independent from world-state order).
 *
 * **P2-E:** sole chronology gate for scene generation’s `narrativeSourcesForScene` / `sourceIdsUsed` (approved
 * shape); do not add parallel filtering in the loader—only replace implementation here if chronology rules change.
 *
 * Returns no rows if `worldStateId` is unknown.
 */
export async function getSourcesForWorldState(
  worldStateId: string,
  year?: number
): Promise<NarrativeSource[]> {
  const ws = await prisma.worldStateReference.findUnique({
    where: { id: worldStateId },
    select: { chronologyIndex: true },
  });
  if (ws == null) {
    return [];
  }

  const rows = await prisma.narrativeSource.findMany({
    where: buildNarrativeSourceWorldStateWhere(ws.chronologyIndex, year),
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDomain);
}
