import type { Prisma } from "@prisma/client";
import {
  EventType,
  FragmentType,
  PlaceType,
  RecordType,
  RuleType,
  SourceType,
  VisibilityStatus,
} from "@prisma/client";
import type { OntologyAdminFilters, RegistryValueAdminFilters } from "@/lib/ontology-types";
import {
  getConfidenceProfiles,
  getNarrativePermissionProfiles,
  getOntologyTypes,
  getRegistryValues,
  getSceneReadinessProfiles,
} from "@/lib/ontology";
import { prisma } from "@/lib/prisma";
import { findCandidateMatchesForExtractedEntity } from "@/lib/entity-matching";
import type { CandidateMatch } from "@/lib/entity-matching";
import type { CharacterSimulationBundle } from "@/lib/character-types";
import { warnIfCharacterStateMissingWorldContext } from "@/lib/world-context-validation";
import type {
  EnvironmentAdminFilters,
  EnvironmentNodeAdminFilters,
  NodeConnectionAdminFilters,
  PlaceFullEnvironmentBundle,
} from "@/lib/environment-types";
import type { CharacterIntelligenceBundle } from "@/lib/intelligence-types";
import type { CharacterPressureBundle, WorldGovernanceAdminFilters } from "@/lib/pressure-order-types";
import type { CharacterRelationshipBundle, RelationshipProfileAdminFilters } from "@/lib/relationship-order-types";
import type { CharacterContinuityBundle } from "@/lib/continuity-order-types";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getDashboardCounts() {
  return safe(
    async () => {
      const [
        sources,
        claims,
        people,
        places,
        events,
        chapters,
        scenes,
        openQuestions,
        continuityNotes,
        symbols,
        themes,
        motifs,
        narrativeRules,
        literaryDevices,
        narrativePatterns,
        narrativeBindings,
        fragments,
        fragmentClusters,
        metaScenes,
      ] = await Promise.all([
        prisma.source.count(),
        prisma.claim.count(),
        prisma.person.count(),
        prisma.place.count(),
        prisma.event.count(),
        prisma.chapter.count(),
        prisma.scene.count(),
        prisma.openQuestion.count(),
        prisma.continuityNote.count(),
        prisma.symbol.count(),
        prisma.theme.count(),
        prisma.motif.count(),
        prisma.narrativeRule.count(),
        prisma.literaryDevice.count(),
        prisma.narrativePattern.count(),
        prisma.narrativeBinding.count(),
        prisma.fragment.count(),
        prisma.fragmentCluster.count(),
        prisma.metaScene.count(),
      ]);
      return {
        sources,
        claims,
        people,
        places,
        events,
        chapters,
        scenes,
        openQuestions,
        continuityNotes,
        symbols,
        themes,
        motifs,
        narrativeRules,
        literaryDevices,
        narrativePatterns,
        narrativeBindings,
        fragments,
        fragmentClusters,
        metaScenes,
      };
    },
    {
      sources: 0,
      claims: 0,
      people: 0,
      places: 0,
      events: 0,
      chapters: 0,
      scenes: 0,
      openQuestions: 0,
      continuityNotes: 0,
      symbols: 0,
      themes: 0,
      motifs: 0,
      narrativeRules: 0,
      literaryDevices: 0,
      narrativePatterns: 0,
      narrativeBindings: 0,
      fragments: 0,
      fragmentClusters: 0,
      metaScenes: 0,
    },
  );
}

export type PeopleFilters = {
  visibility?: VisibilityStatus;
  recordType?: RecordType;
};

export async function getPeople(filters?: PeopleFilters) {
  const where: Prisma.PersonWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  return safe(
    () =>
      prisma.person.findMany({
        where,
        orderBy: { name: "asc" },
      }),
    [],
  );
}

export async function getPersonById(id: string) {
  return safe(
    () =>
      prisma.person.findUnique({
        where: { id },
        include: {
          places: true,
          events: true,
          chapters: true,
          sources: true,
          openQuestions: true,
          continuityNotes: true,
        },
      }),
    null,
  );
}

export type SourcesFilters = {
  visibility?: VisibilityStatus;
  recordType?: RecordType;
  sourceType?: SourceType;
  archiveStatus?: string;
  ingestionStatus?: string;
};

export async function getSources(filters?: SourcesFilters) {
  const where: Prisma.SourceWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.sourceType) where.sourceType = filters.sourceType;
  if (filters?.archiveStatus) where.archiveStatus = filters.archiveStatus;
  if (filters?.ingestionStatus) where.ingestionStatus = filters.ingestionStatus;
  return safe(
    () =>
      prisma.source.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export async function getSourceById(id: string) {
  return safe(
    () =>
      prisma.source.findUnique({
        where: { id },
        include: {
          claims: { orderBy: { updatedAt: "desc" } },
          persons: true,
          places: true,
          events: true,
          chapters: true,
          openQuestions: true,
          sourceText: true,
          lastIngestionRun: {
            include: {
              extractionResult: { select: { id: true, status: true } },
            },
          },
          narrativeRules: { orderBy: { updatedAt: "desc" }, take: 80 },
          narrativeThemes: { orderBy: { updatedAt: "desc" }, take: 80 },
          motifs: { orderBy: { updatedAt: "desc" }, take: 80 },
          literaryDevices: { orderBy: { updatedAt: "desc" }, take: 80 },
          narrativePatterns: { orderBy: { updatedAt: "desc" }, take: 80 },
          narrativeDnaSymbols: { orderBy: { updatedAt: "desc" }, take: 80 },
        },
      }),
    null,
  );
}

export async function getNarrativeBindingsRecent(take = 120) {
  return safe(
    () =>
      prisma.narrativeBinding.findMany({
        orderBy: { updatedAt: "desc" },
        take,
      }),
    [],
  );
}

export async function getNarrativeBindingById(id: string) {
  return safe(() => prisma.narrativeBinding.findUnique({ where: { id } }), null);
}

export async function getNarrativeRulesList() {
  return safe(
    () =>
      prisma.narrativeRule.findMany({
        orderBy: { updatedAt: "desc" },
        include: { source: { select: { id: true, title: true } } },
      }),
    [],
  );
}

export async function getNarrativeRuleById(id: string) {
  return safe(
    () =>
      prisma.narrativeRule.findUnique({
        where: { id },
        include: { source: { select: { id: true, title: true } } },
      }),
    null,
  );
}

export async function getConstitutionalRulesList(ruleType?: RuleType) {
  return safe(
    () =>
      prisma.constitutionalRule.findMany({
        where: ruleType ? { ruleType } : undefined,
        orderBy: [{ ruleType: "asc" }, { key: "asc" }],
      }),
    [],
  );
}

export async function getConstitutionalRuleById(id: string) {
  return safe(() => prisma.constitutionalRule.findUnique({ where: { id } }), null);
}

/** Stage 2 ontology spine — delegates to lib/ontology.ts with safe DB behavior. */
export async function getOntologyTypesForAdmin(filters?: OntologyAdminFilters) {
  return getOntologyTypes(filters);
}

export async function getOntologyTypeByIdForAdmin(id: string) {
  return safe(() => prisma.ontologyType.findUnique({ where: { id } }), null);
}

export async function getRegistryValuesForAdmin(filters?: RegistryValueAdminFilters) {
  return getRegistryValues(filters);
}

export async function getRegistryValueByIdForAdmin(id: string) {
  return safe(() => prisma.registryValue.findUnique({ where: { id } }), null);
}

export async function getNarrativePermissionProfilesForAdmin() {
  return getNarrativePermissionProfiles();
}

export async function getNarrativePermissionProfileByIdForAdmin(id: string) {
  return safe(() => prisma.narrativePermissionProfile.findUnique({ where: { id } }), null);
}

export async function getConfidenceProfilesForAdmin() {
  return getConfidenceProfiles();
}

export async function getConfidenceProfileByIdForAdmin(id: string) {
  return safe(() => prisma.confidenceProfile.findUnique({ where: { id } }), null);
}

export async function getSceneReadinessProfilesForAdmin() {
  return getSceneReadinessProfiles();
}

export async function getSceneReadinessProfileByIdForAdmin(id: string) {
  return safe(() => prisma.sceneReadinessProfile.findUnique({ where: { id } }), null);
}

export async function getThemesList() {
  return safe(
    () =>
      prisma.theme.findMany({
        orderBy: { updatedAt: "desc" },
        include: { source: { select: { id: true, title: true } } },
      }),
    [],
  );
}

export async function getThemeById(id: string) {
  return safe(
    () =>
      prisma.theme.findUnique({
        where: { id },
        include: { source: { select: { id: true, title: true } } },
      }),
    null,
  );
}

export async function getMotifsList() {
  return safe(
    () =>
      prisma.motif.findMany({
        orderBy: { updatedAt: "desc" },
        include: { source: { select: { id: true, title: true } } },
      }),
    [],
  );
}

export async function getMotifById(id: string) {
  return safe(
    () =>
      prisma.motif.findUnique({
        where: { id },
        include: { source: { select: { id: true, title: true } } },
      }),
    null,
  );
}

export async function getLiteraryDevicesList() {
  return safe(
    () =>
      prisma.literaryDevice.findMany({
        orderBy: { updatedAt: "desc" },
        include: { source: { select: { id: true, title: true } } },
      }),
    [],
  );
}

export async function getLiteraryDeviceById(id: string) {
  return safe(
    () =>
      prisma.literaryDevice.findUnique({
        where: { id },
        include: { source: { select: { id: true, title: true } } },
      }),
    null,
  );
}

export async function getNarrativePatternsList() {
  return safe(
    () =>
      prisma.narrativePattern.findMany({
        orderBy: { updatedAt: "desc" },
        include: { source: { select: { id: true, title: true } } },
      }),
    [],
  );
}

export async function getNarrativePatternById(id: string) {
  return safe(
    () =>
      prisma.narrativePattern.findUnique({
        where: { id },
        include: { source: { select: { id: true, title: true } } },
      }),
    null,
  );
}

export async function getSymbolsAdminList() {
  return safe(
    () =>
      prisma.symbol.findMany({
        orderBy: { updatedAt: "desc" },
        include: { source: { select: { id: true, title: true } } },
      }),
    [],
  );
}

export async function getSymbolByIdAdmin(id: string) {
  return safe(
    () =>
      prisma.symbol.findUnique({
        where: { id },
        include: { source: { select: { id: true, title: true } } },
      }),
    null,
  );
}

export type DnaSourceSupportRow = {
  sourceId: string;
  title: string;
  bindingNotes: string | null;
  strength: number | null;
};

/** Guide provenance: FK source on row + emerges_from bindings to Source. */
export async function getDnaEntitySourceSupport(
  entityType: string,
  entityId: string,
): Promise<{
  primarySource: { id: string; title: string } | null;
  fromBindings: DnaSourceSupportRow[];
}> {
  return safe(
    async () => {
      const st = entityType.trim();
      let sourceId: string | null = null;
      if (st === "symbol") {
        const r = await prisma.symbol.findUnique({ where: { id: entityId }, select: { sourceId: true } });
        sourceId = r?.sourceId ?? null;
      } else if (st === "theme") {
        const r = await prisma.theme.findUnique({ where: { id: entityId }, select: { sourceId: true } });
        sourceId = r?.sourceId ?? null;
      } else if (st === "motif") {
        const r = await prisma.motif.findUnique({ where: { id: entityId }, select: { sourceId: true } });
        sourceId = r?.sourceId ?? null;
      } else if (st === "narrative_rule") {
        const r = await prisma.narrativeRule.findUnique({ where: { id: entityId }, select: { sourceId: true } });
        sourceId = r?.sourceId ?? null;
      } else if (st === "literary_device") {
        const r = await prisma.literaryDevice.findUnique({ where: { id: entityId }, select: { sourceId: true } });
        sourceId = r?.sourceId ?? null;
      } else if (st === "narrative_pattern") {
        const r = await prisma.narrativePattern.findUnique({
          where: { id: entityId },
          select: { sourceId: true },
        });
        sourceId = r?.sourceId ?? null;
      }

      let primarySource: { id: string; title: string } | null = null;
      if (sourceId) {
        const s = await prisma.source.findUnique({
          where: { id: sourceId },
          select: { id: true, title: true },
        });
        if (s) primarySource = s;
      }

      const bindings = await prisma.narrativeBinding.findMany({
        where: {
          sourceType: st,
          sourceId: entityId,
          targetType: "source",
          relationship: "emerges_from",
        },
        orderBy: { updatedAt: "desc" },
        take: 40,
      });
      const ids = [...new Set(bindings.map((b) => b.targetId))];
      const sources = ids.length
        ? await prisma.source.findMany({
            where: { id: { in: ids } },
            select: { id: true, title: true },
          })
        : [];
      const titleById = new Map(sources.map((s) => [s.id, s.title] as const));
      const fromBindings: DnaSourceSupportRow[] = bindings.map((b) => ({
        sourceId: b.targetId,
        title: titleById.get(b.targetId) ?? b.targetId,
        bindingNotes: b.notes,
        strength: b.strength,
      }));

      return { primarySource, fromBindings };
    },
    { primarySource: null, fromBindings: [] },
  );
}

export async function countSourceSupportBindingsForSource(sourceId: string) {
  return safe(
    () =>
      prisma.narrativeBinding.count({
        where: { targetType: "source", targetId: sourceId },
      }),
    0,
  );
}

export async function getNarrativeBindingsForPerson(personId: string) {
  return safe(
    () =>
      prisma.narrativeBinding.findMany({
        where: { targetType: "person", targetId: personId },
        orderBy: { updatedAt: "desc" },
        take: 60,
      }),
    [],
  );
}

/** Aggregated extracted entity counts for a source (all runs). */
export async function getExtractedEntityCountsBySource(sourceId: string) {
  return safe(
    async () => {
      const rows = await prisma.extractedEntity.groupBy({
        by: ["entityType"],
        where: { sourceId },
        _count: { _all: true },
      });
      let total = 0;
      const byType: Record<string, number> = {};
      for (const r of rows) {
        const c = r._count._all;
        total += c;
        byType[r.entityType] = c;
      }
      return { total, byType };
    },
    { total: 0, byType: {} as Record<string, number> },
  );
}

/** Sources with ingestion summary for the archive control center. */
export async function getSourcesForIngestionList(filters?: SourcesFilters) {
  const where: Prisma.SourceWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.sourceType) where.sourceType = filters.sourceType;
  if (filters?.archiveStatus) where.archiveStatus = filters.archiveStatus;
  if (filters?.ingestionStatus) where.ingestionStatus = filters.ingestionStatus;

  return safe(
    () =>
      prisma.source.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          sourceText: { select: { id: true, textStatus: true } },
          lastIngestionRun: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              extractionPacket: { select: { id: true, readyForAI: true } },
              extractionResult: { select: { id: true, status: true } },
            },
          },
          _count: {
            select: {
              extractedEntities: true,
              ingestionRuns: true,
            },
          },
        },
      }),
    [],
  );
}

export type IngestionListRow = Awaited<
  ReturnType<typeof getSourcesForIngestionList>
>[number];

export async function getIngestionWorkspace(sourceId: string) {
  return safe(
    () =>
      prisma.source.findUnique({
        where: { id: sourceId },
        include: {
          sourceText: true,
          lastIngestionRun: {
            include: {
              extractionResult: { select: { id: true, status: true } },
            },
          },
          ingestionRuns: {
            orderBy: { createdAt: "desc" },
            include: {
              extractionPacket: true,
              extractionResult: true,
              extractedEntities: true,
            },
          },
          extractedEntities: {
            orderBy: { updatedAt: "desc" },
          },
        },
      }),
    null,
  );
}

export async function getIngestionRunById(id: string) {
  return safe(
    () =>
      prisma.ingestionRun.findUnique({
        where: { id },
        include: {
          source: true,
          extractionPacket: true,
          extractionResult: true,
          extractedEntities: { orderBy: { entityType: "asc" } },
          chunkExtractionRuns: {
            orderBy: { createdAt: "asc" },
            include: { sourceChunk: true },
          },
        },
      }),
    null,
  );
}

export async function getSourceChunksForAdminList() {
  return safe(
    () =>
      prisma.sourceChunk.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 200,
        include: {
          source: { select: { id: true, title: true } },
        },
      }),
    [],
  );
}

export async function getSourceChunkById(id: string) {
  return safe(
    () =>
      prisma.sourceChunk.findUnique({
        where: { id },
        include: {
          source: { select: { id: true, title: true } },
          chunkExtractionRuns: {
            orderBy: { createdAt: "desc" },
            include: { ingestionRun: { select: { id: true, status: true } } },
          },
        },
      }),
    null,
  );
}

export type ExtractedEntityFilters = {
  reviewStatus?: string;
  entityType?: string;
  sourceId?: string;
  mergeDecision?: string;
  linkedState?: "linked" | "unlinked";
  confidenceMin?: number;
  confidenceMax?: number;
};

export async function getExtractedEntitiesQueue(filters?: ExtractedEntityFilters) {
  const where: Prisma.ExtractedEntityWhereInput = {};
  if (filters?.reviewStatus) where.reviewStatus = filters.reviewStatus;
  if (filters?.entityType) where.entityType = filters.entityType;
  if (filters?.sourceId) where.sourceId = filters.sourceId;
  if (filters?.mergeDecision) where.mergeDecision = filters.mergeDecision;
  if (filters?.confidenceMin !== undefined || filters?.confidenceMax !== undefined) {
    where.confidence = {
      ...(filters.confidenceMin !== undefined ? { gte: filters.confidenceMin } : {}),
      ...(filters.confidenceMax !== undefined ? { lte: filters.confidenceMax } : {}),
    };
  }
  if (filters?.linkedState === "linked") {
    where.OR = [
      { canonicalRecordId: { not: null } },
      { matchedRecordId: { not: null } },
    ];
  }
  if (filters?.linkedState === "unlinked") {
    where.AND = [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      { canonicalRecordId: null },
      { matchedRecordId: null },
    ];
  }

  return safe(
    () =>
      prisma.extractedEntity.findMany({
        where,
        include: {
          source: { select: { id: true, title: true } },
          ingestionRun: { select: { id: true, status: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export async function getExtractedEntityById(id: string) {
  return safe(
    () =>
      prisma.extractedEntity.findUnique({
        where: { id },
        include: {
          source: true,
          ingestionRun: true,
        },
      }),
    null,
  );
}

export async function getExtractedEntityWithCandidates(id: string) {
  type EntityWithContext = Prisma.ExtractedEntityGetPayload<{
    include: {
      source: true;
      ingestionRun: true;
      links: true;
    };
  }>;
  return safe(
    async () => {
      const entity = await prisma.extractedEntity.findUnique({
        where: { id },
        include: {
          source: true,
          ingestionRun: true,
          links: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!entity) return null;
      const candidates = await findCandidateMatchesForExtractedEntity(id);
      return { entity, candidates };
    },
    null as null | { entity: EntityWithContext; candidates: CandidateMatch[] },
  );
}

export async function getCanonicalRecordSummaryByType(type: string, id: string) {
  return safe(async () => {
    switch (type) {
      case "person":
        return await prisma.person.findUnique({
          where: { id },
          select: { id: true, name: true, description: true, birthYear: true, deathYear: true },
        });
      case "place":
        return await prisma.place.findUnique({
          where: { id },
          select: { id: true, name: true, description: true, placeType: true, latitude: true, longitude: true },
        });
      case "event":
        return await prisma.event.findUnique({
          where: { id },
          select: { id: true, title: true, description: true, startYear: true, endYear: true, eventType: true },
        });
      case "symbol":
        return await prisma.symbol.findUnique({
          where: { id },
          select: { id: true, name: true, meaning: true, category: true },
        });
      case "claim":
        return await prisma.claim.findUnique({
          where: { id },
          select: { id: true, description: true, confidence: true, quoteExcerpt: true, notes: true },
        });
      case "chapter":
        return await prisma.chapter.findUnique({
          where: { id },
          select: { id: true, title: true, summary: true, chapterNumber: true, status: true },
        });
      case "openQuestion":
      case "question":
        return await prisma.openQuestion.findUnique({
          where: { id },
          select: { id: true, title: true, description: true, status: true, priority: true },
        });
      case "continuityNote":
      case "continuity":
        return await prisma.continuityNote.findUnique({
          where: { id },
          select: { id: true, title: true, description: true, severity: true, status: true },
        });
      default:
        return null;
    }
  }, null);
}

export async function searchCanonicalRecords(type: string, query: string) {
  const q = query.trim();
  if (!q.length) return [];
  return safe(async () => {
    const take = 20;
    switch (type) {
      case "source":
        return await prisma.source.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, summary: true, sourceType: true, recordType: true, sourceYear: true },
        });
      case "person":
        return await prisma.person.findMany({
          where: { name: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, description: true },
        });
      case "place":
        return await prisma.place.findMany({
          where: { name: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, description: true, placeType: true },
        });
      case "event":
        return await prisma.event.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, description: true, startYear: true, endYear: true },
        });
      case "symbol":
        return await prisma.symbol.findMany({
          where: { name: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, meaning: true },
        });
      case "claim":
        return await prisma.claim.findMany({
          where: { description: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, description: true, confidence: true },
        });
      case "chapter":
        return await prisma.chapter.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, chapterNumber: true, summary: true },
        });
      case "question":
      case "openQuestion":
        return await prisma.openQuestion.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, status: true, priority: true },
        });
      case "continuity":
      case "continuityNote":
        return await prisma.continuityNote.findMany({
          where: { title: { contains: q, mode: "insensitive" } },
          take,
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, severity: true, status: true },
        });
      default:
        return [];
    }
  }, []);
}

export async function getMergeComparisonData(
  extractedEntityId: string,
  canonicalType: string,
  canonicalId: string,
) {
  return safe(async () => {
    const extracted = await prisma.extractedEntity.findUnique({ where: { id: extractedEntityId } });
    if (!extracted) return null;
    const canonical = await getCanonicalRecordSummaryByType(canonicalType, canonicalId);
    if (!canonical) return null;
    return { extracted, canonical };
  }, null);
}

export type ClaimsFilters = {
  needsReview?: boolean;
  confidence?: number;
  sourceId?: string;
};

export async function getClaims(filters?: ClaimsFilters) {
  const where: Prisma.ClaimWhereInput = {};
  if (filters?.needsReview !== undefined)
    where.needsReview = filters.needsReview;
  if (filters?.confidence !== undefined)
    where.confidence = filters.confidence;
  if (filters?.sourceId) where.sourceId = filters.sourceId;
  return safe(
    () =>
      prisma.claim.findMany({
        where,
        include: { source: { select: { id: true, title: true } } },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export async function getClaimById(id: string) {
  return safe(
    () =>
      prisma.claim.findUnique({
        where: { id },
        include: { source: true },
      }),
    null,
  );
}

export type PlacesFilters = {
  visibility?: VisibilityStatus;
  recordType?: RecordType;
  placeType?: PlaceType;
};

export async function getPlaces(filters?: PlacesFilters) {
  const where: Prisma.PlaceWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.placeType) where.placeType = filters.placeType;
  return safe(
    () =>
      prisma.place.findMany({
        where,
        orderBy: { name: "asc" },
      }),
    [],
  );
}

export async function getPlaceById(id: string) {
  return safe(
    () =>
      prisma.place.findUnique({
        where: { id },
        include: {
          persons: true,
          events: true,
          chapters: true,
          sources: true,
          openQuestions: true,
        },
      }),
    null,
  );
}

export type EventsFilters = {
  visibility?: VisibilityStatus;
  recordType?: RecordType;
  eventType?: EventType;
};

export async function getEvents(filters?: EventsFilters) {
  const where: Prisma.EventWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.eventType) where.eventType = filters.eventType;
  return safe(
    () =>
      prisma.event.findMany({
        where,
        orderBy: { title: "asc" },
      }),
    [],
  );
}

export async function getEventById(id: string) {
  return safe(
    () =>
      prisma.event.findUnique({
        where: { id },
        include: {
          persons: true,
          places: true,
          chapters: true,
          scenes: true,
          sources: true,
          openQuestions: true,
          continuityNotes: true,
        },
      }),
    null,
  );
}

export async function getChapters() {
  return safe(
    () =>
      prisma.chapter.findMany({
        orderBy: [{ chapterNumber: "asc" }, { title: "asc" }],
      }),
    [],
  );
}

export async function getChapterById(id: string) {
  return safe(
    () =>
      prisma.chapter.findUnique({
        where: { id },
        include: {
          scenes: { orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }] },
          persons: true,
          places: true,
          events: true,
          sources: true,
          continuityNotes: true,
        },
      }),
    null,
  );
}

export async function getChapterWithScenes(id: string) {
  return safe(
    () =>
      prisma.chapter.findUnique({
        where: { id },
        include: {
          scenes: {
            orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
            select: {
              id: true,
              description: true,
              summary: true,
              orderInChapter: true,
              sceneNumber: true,
              sceneStatus: true,
              writingMode: true,
              visibility: true,
              recordType: true,
              updatedAt: true,
            },
          },
        },
      }),
    null,
  );
}

export type ScenesFilters = { chapterId?: string };

export async function getScenes(filters?: ScenesFilters) {
  const where: Prisma.SceneWhereInput = {};
  if (filters?.chapterId) where.chapterId = filters.chapterId;
  return safe(
    () =>
      prisma.scene.findMany({
        where,
        include: { chapter: { select: { id: true, title: true } } },
        orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }, { updatedAt: "desc" }],
      }),
    [],
  );
}

export async function getSceneById(id: string) {
  return safe(
    () =>
      prisma.scene.findUnique({
        where: { id },
        include: {
          chapter: true,
          events: true,
          continuityNotes: true,
        },
      }),
    null,
  );
}

export async function getSceneByIdFull(id: string) {
  return safe(
    () =>
      prisma.scene.findUnique({
        where: { id },
        include: {
          chapter: true,
          persons: true,
          places: true,
          events: true,
          symbols: true,
          sources: true,
          openQuestions: true,
          continuityNotes: true,
          sceneNotes: { orderBy: { updatedAt: "desc" } },
        },
      }),
    null,
  );
}

export async function getSceneContextData(id: string) {
  return safe(
    async () => {
      const scene = await prisma.scene.findUnique({
        where: { id },
        select: {
          id: true,
          chapterId: true,
          persons: { select: { id: true, name: true, description: true, birthYear: true, deathYear: true } },
          places: { select: { id: true, name: true, description: true, placeType: true } },
          events: { select: { id: true, title: true, description: true, startYear: true, endYear: true, eventType: true } },
          symbols: { select: { id: true, name: true, meaning: true, category: true } },
          sources: { select: { id: true, title: true, recordType: true, sourceType: true, sourceYear: true } },
          openQuestions: { select: { id: true, title: true, description: true, status: true, priority: true } },
        },
      });
      if (!scene) return null;

      const claims = await prisma.claim.findMany({
        where: { sourceId: { in: scene.sources.map((s) => s.id) } },
        orderBy: { updatedAt: "desc" },
        take: 120,
        include: { source: { select: { id: true, title: true } } },
      });

      const continuityNotes = await prisma.continuityNote.findMany({
        where: { linkedSceneId: id },
        orderBy: { updatedAt: "desc" },
      });

      const sourceCount = scene.sources.length;
      const claimCount = claims.length;
      const confidenceAvg =
        claimCount === 0 ? null : Math.round((claims.reduce((a, c) => a + (c.confidence ?? 0), 0) / claimCount) * 10) / 10;

      return {
        scene,
        claims,
        continuityNotes,
        provenance: { sourceCount, claimCount, confidenceAvg },
      };
    },
    null,
  );
}

export type OpenQuestionsFilters = {
  status?: string;
  priority?: number;
};

export async function getOpenQuestions(filters?: OpenQuestionsFilters) {
  const where: Prisma.OpenQuestionWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.priority !== undefined) where.priority = filters.priority;
  return safe(
    () =>
      prisma.openQuestion.findMany({
        where,
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      }),
    [],
  );
}

export async function getOpenQuestionById(id: string) {
  return safe(
    () =>
      prisma.openQuestion.findUnique({
        where: { id },
        include: {
          linkedPerson: true,
          linkedPlace: true,
          linkedEvent: true,
          linkedSource: true,
        },
      }),
    null,
  );
}

export type ContinuityFilters = {
  severity?: string;
  status?: string;
};

export async function getContinuityNotes(filters?: ContinuityFilters) {
  const where: Prisma.ContinuityNoteWhereInput = {};
  if (filters?.severity) where.severity = filters.severity;
  if (filters?.status) where.status = filters.status;
  return safe(
    () =>
      prisma.continuityNote.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export async function getContinuityNoteById(id: string) {
  return safe(
    () =>
      prisma.continuityNote.findUnique({
        where: { id },
        include: {
          linkedChapter: true,
          linkedScene: true,
          linkedPerson: true,
          linkedEvent: true,
        },
      }),
    null,
  );
}

export async function getPublicPlaces() {
  return safe(
    () =>
      prisma.place.findMany({
        where: { visibility: VisibilityStatus.PUBLIC },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          placeType: true,
        },
      }),
    [],
  );
}

export async function getPublicChapters() {
  return safe(
    () =>
      prisma.chapter.findMany({
        where: { visibility: VisibilityStatus.PUBLIC },
        orderBy: [{ chapterNumber: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          summary: true,
          publicNotes: true,
        },
      }),
    [],
  );
}

export async function getPublicChaptersWithScenes() {
  return safe(
    () =>
      prisma.chapter.findMany({
        where: { visibility: VisibilityStatus.PUBLIC },
        orderBy: [{ chapterNumber: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          summary: true,
          publicNotes: true,
          scenes: {
            where: { visibility: VisibilityStatus.PUBLIC },
            orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
            select: {
              id: true,
              description: true,
              summary: true,
              sceneNumber: true,
              orderInChapter: true,
            },
          },
        },
      }),
    [],
  );
}

export async function searchEntitiesForScene(type: string, query: string) {
  return searchCanonicalRecords(type, query);
}

export type FragmentsFilters = {
  fragmentType?: FragmentType;
  placementStatus?: string;
  reviewStatus?: string;
  sourceId?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  ambiguityMin?: number;
  ambiguityMax?: number;
  parentOnly?: boolean;
};

export async function getFragments(filters?: FragmentsFilters) {
  const where: Prisma.FragmentWhereInput = {};
  if (filters?.fragmentType) where.fragmentType = filters.fragmentType;
  if (filters?.placementStatus) where.placementStatus = filters.placementStatus;
  if (filters?.reviewStatus) where.reviewStatus = filters.reviewStatus;
  if (filters?.sourceId) where.sourceId = filters.sourceId;
  if (filters?.confidenceMin !== undefined || filters?.confidenceMax !== undefined) {
    where.confidence = {
      ...(filters.confidenceMin !== undefined ? { gte: filters.confidenceMin } : {}),
      ...(filters.confidenceMax !== undefined ? { lte: filters.confidenceMax } : {}),
    };
  }
  if (filters?.ambiguityMin !== undefined || filters?.ambiguityMax !== undefined) {
    where.ambiguityLevel = {
      ...(filters.ambiguityMin !== undefined ? { gte: filters.ambiguityMin } : {}),
      ...(filters.ambiguityMax !== undefined ? { lte: filters.ambiguityMax } : {}),
    };
  }
  if (filters?.parentOnly) where.parentFragmentId = null;

  return safe(
    () =>
      prisma.fragment.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          source: { select: { id: true, title: true } },
          _count: {
            select: {
              placementCandidates: true,
              childFragments: true,
              links: true,
              clusterLinks: true,
            },
          },
        },
        take: 500,
      }),
    [],
  );
}

export async function getFragmentById(id: string) {
  return safe(
    () =>
      prisma.fragment.findUnique({
        where: { id },
        include: {
          source: { select: { id: true, title: true, recordType: true, sourceType: true } },
          sourceChunk: { select: { id: true, chunkLabel: true, chunkIndex: true } },
          sourceText: { select: { id: true, textStatus: true } },
          parentFragment: { select: { id: true, title: true, fragmentType: true, text: true } },
          childFragments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              title: true,
              fragmentType: true,
              text: true,
              placementStatus: true,
              reviewStatus: true,
              createdAt: true,
            },
          },
          placementCandidates: { orderBy: { updatedAt: "desc" } },
          links: { orderBy: { updatedAt: "desc" } },
          insights: { orderBy: { updatedAt: "desc" } },
          clusterLinks: {
            include: {
              cluster: { select: { id: true, title: true, clusterType: true } },
            },
          },
        },
      }),
    null,
  );
}

export async function getFragmentsForSource(sourceId: string) {
  return safe(
    () =>
      prisma.fragment.findMany({
        where: { sourceId },
        orderBy: [{ parentFragmentId: "asc" }, { createdAt: "asc" }],
        include: {
          _count: {
            select: { placementCandidates: true, childFragments: true, links: true, clusterLinks: true },
          },
        },
      }),
    [],
  );
}

export async function getFragmentChildren(fragmentId: string) {
  return safe(
    () =>
      prisma.fragment.findMany({
        where: { parentFragmentId: fragmentId },
        orderBy: { createdAt: "asc" },
      }),
    [],
  );
}

export async function getFragmentCandidates(fragmentId: string) {
  return safe(
    () =>
      prisma.fragmentPlacementCandidate.findMany({
        where: { fragmentId },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export type BrainDashboardData = {
  totalSources: number;
  totalFragments: number;
  unplacedFragments: number;
  multiCandidateFragments: number;
  highAmbiguityFragments: number;
  fragmentsLinkedToScenes: number;
  fragmentsLinkedToChapters: number;
  openQuestionsCount: number;
  continuityNotesCount: number;
  sourcesNotDecomposed: number;
  scenesWeakGrounding: number;
  chaptersWithFewFragments: { chapterId: string; title: string; linkCount: number }[];
  topSymbolsByUsage: { symbolId: string; name: string; sceneCount: number }[];
  topThemesByInsight: { insightType: string; count: number }[];
  recentInsights: { id: string; insightType: string; content: string; fragmentId: string; updatedAt: Date }[];
  recentContinuityPressure: { id: string; title: string; severity: string; status: string; updatedAt: Date }[];
  recentSceneAssistRuns: { id: string; sceneId: string; assistType: string; status: string; updatedAt: Date }[];
  fragmentsNeedingReview: { id: string; title: string | null; fragmentType: FragmentType; reviewStatus: string | null }[];
  peopleWithoutCharacterProfile: number;
  placesWithoutSettingProfile: number;
  fragmentsWithoutWorldLinks: number;
  metaScenesCount: number;
  scenesWithoutMetaScene: number;
  peopleWithWeakMemoryCoverage: number;
  placesWithWeakSensoryModel: number;
  /** POV person has no CharacterProfile (mind not modeled). */
  metaScenesMissingPov: number;
  /** No fragment links with linkedType meta_scene + this id. */
  metaScenesMissingFragments: number;
  /** Both historical and social constraint fields empty. */
  metaScenesMissingConstraints: number;
  /** symbolicElements empty. */
  metaScenesMissingSymbolic: number;
  /** emotionalVoltage empty. */
  metaScenesMissingEmotionalVoltage: number;
  /** Meta scenes with non-empty sensoryField (strong sensory layer). */
  metaScenesWithSensoryLayer: number;
  /** People with at least one CharacterMemory (memory anchors). */
  peopleWithMemoryAnchors: number;
  /** Setting profiles with sounds, smells, and textures all populated. */
  placesWithRichSensoryModel: number;
  /**
   * Meta scenes that look “ready” for later scene generation: linked fragments,
   * POV + place profiles, non-empty sensory + environment, source support level set.
   */
  worldAnchorsReady: number;
  fragmentClustersCount: number;
  fragmentClusterMemberships: number;
  fragmentsHighDecompositionPressure: number;
  fragmentsWithoutHiddenMeaning: number;
  sceneConstructionSuggestionsOpen: number;
  metaScenesLowPovStrength: number;
  metaScenesLowSymbolicField: number;
  metaScenesWeakCentralConflict: number;
  worldAnchorsFeelStatic: number;
  unlinkedStrongFragments: number;
  recentClusters: { id: string; title: string; clusterType: string; updatedAt: Date }[];
  recentSceneSuggestions: {
    id: string;
    title: string;
    suggestionType: string;
    status: string;
    metaSceneId: string | null;
    updatedAt: Date;
  }[];
  metaScenesNeedingAttention: { id: string; title: string; placeName: string }[];
  /** Phase 9C — soul / embodiment */
  peopleWithoutEnneagramType: number;
  peopleInferredEnneagramSource: number;
  relationshipsWithoutDynamics: number;
  metaScenesNoSoulSuggestions: number;
  metaScenesLowHeartHeuristic: number;
  metaScenesDecorativeEnvironment: number;
  metaScenesWeakRelationshipPressure: number;
  metaScenesGenericEmotionalEngine: number;
  recentSoulSuggestions: {
    id: string;
    title: string;
    suggestionType: string;
    status: string;
    metaSceneId: string;
    updatedAt: Date;
  }[];
  recentInferredEnneagramProfiles: { personId: string; updatedAt: Date }[];
  metaScenesNeedingEmbodiment: { id: string; title: string }[];
  /** Phase 9D — narrative intelligence */
  narrativePassCount: number;
  metaScenesMissingDescriptiveCache: number;
  recentNarrativePasses: {
    id: string;
    passType: string;
    status: string;
    metaSceneId: string;
    updatedAt: Date;
  }[];
  /** Brain 2 — narrative DNA layer */
  narrativeRulesCount: number;
  narrativeBindingsCount: number;
  brainMemosCount: number;
  /** % of meta scenes meeting “world anchor ready” heuristic (0–100). */
  worldAnchorCoveragePct: number;
};

export async function getBrainDashboardData(): Promise<BrainDashboardData> {
  return safe(
    async () => {
      const [
        totalSources,
        totalFragments,
        unplacedFragments,
        highAmbiguityFragments,
        fragmentsLinkedToScenes,
        fragmentsLinkedToChapters,
        openQuestionsCount,
        continuityNotesCount,
        narrativeRulesCount,
        narrativeBindingsCount,
        brainMemosCount,
      ] = await Promise.all([
        prisma.source.count(),
        prisma.fragment.count(),
        prisma.fragment.count({
          where: {
            OR: [{ placementStatus: "unplaced" }, { placementStatus: null }],
          },
        }),
        prisma.fragment.count({ where: { ambiguityLevel: { gte: 4 } } }),
        prisma.fragmentLink.count({ where: { linkedType: "scene" } }),
        prisma.fragmentLink.count({ where: { linkedType: "chapter" } }),
        prisma.openQuestion.count(),
        prisma.continuityNote.count(),
        prisma.narrativeRule.count(),
        prisma.narrativeBinding.count(),
        prisma.brainMemo.count(),
      ]);

      const suggestedGroups = await prisma.fragmentPlacementCandidate.groupBy({
        by: ["fragmentId"],
        where: { status: "suggested" },
        _count: { _all: true },
      });
      const multiCandidateFragments = suggestedGroups.filter((g) => g._count._all > 1).length;

      const sourcesWithFrags = await prisma.source.findMany({
        select: { id: true, _count: { select: { fragments: true } } },
      });
      const sourcesNotDecomposed = sourcesWithFrags.filter((s) => s._count.fragments === 0).length;

      const scenesWeakGrounding = await prisma.scene.count({
        where: {
          OR: [{ lastGroundingScore: null }, { lastGroundingScore: { lt: 3 } }],
        },
      });

      const chapterLinks = await prisma.fragmentLink.groupBy({
        by: ["linkedId"],
        where: { linkedType: "chapter" },
        _count: { _all: true },
      });
      const lowChapters: { chapterId: string; title: string; linkCount: number }[] = [];
      for (const row of chapterLinks) {
        if (row._count._all < 2) {
          const ch = await prisma.chapter.findUnique({
            where: { id: row.linkedId },
            select: { id: true, title: true },
          });
          if (ch) lowChapters.push({ chapterId: ch.id, title: ch.title, linkCount: row._count._all });
        }
      }
      lowChapters.sort((a, b) => a.linkCount - b.linkCount);
      const chaptersWithFewFragments = lowChapters.slice(0, 8);

      const symbolRows = await prisma.symbol.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { scenes: true } },
        },
        take: 80,
      });
      symbolRows.sort((a, b) => b._count.scenes - a._count.scenes);
      const topSymbolsByUsage = symbolRows.slice(0, 8).map((s) => ({
        symbolId: s.id,
        name: s.name,
        sceneCount: s._count.scenes,
      }));

      const insightGroups = await prisma.fragmentInsight.groupBy({
        by: ["insightType"],
        _count: { _all: true },
      });
      insightGroups.sort((a, b) => b._count._all - a._count._all);
      const topThemesByInsight = insightGroups.slice(0, 8).map((g) => ({
        insightType: g.insightType,
        count: g._count._all,
      }));

      const recentInsights = await prisma.fragmentInsight.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, insightType: true, content: true, fragmentId: true, updatedAt: true },
      });

      const recentContinuityPressure = await prisma.continuityNote.findMany({
        where: { severity: { in: ["high", "medium"] } },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, title: true, severity: true, status: true, updatedAt: true },
      });

      const recentSceneAssistRuns = await prisma.sceneAssistRun.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, sceneId: true, assistType: true, status: true, updatedAt: true },
      });

      const fragmentsNeedingReview = await prisma.fragment.findMany({
        where: {
          OR: [{ reviewStatus: "pending" }, { reviewStatus: null }],
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: { id: true, title: true, fragmentType: true, reviewStatus: true },
      });

      const worldLinkTypes = [
        "character_profile",
        "setting_profile",
        "meta_scene",
        "character_memory",
        "character_state",
      ] as const;

      const [
        peopleWithoutCharacterProfile,
        placesWithoutSettingProfile,
        fragmentsWithoutWorldLinks,
        metaScenesCount,
        scenesWithoutMetaScene,
        peopleWithWeakMemoryCoverage,
        placesWithWeakSensoryModel,
        metaScenesMissingPov,
        metaScenesMissingFragments,
        metaScenesMissingConstraints,
        metaScenesMissingSymbolic,
        metaScenesMissingEmotionalVoltage,
        metaScenesWithSensoryLayer,
        peopleWithMemoryAnchors,
        placesWithRichSensoryModel,
        worldAnchorsReady,
      ] = await Promise.all([
        prisma.person.count({ where: { characterProfile: null } }),
        prisma.place.count({ where: { settingProfile: null } }),
        prisma.fragment.count({
          where: {
            links: { none: { linkedType: { in: [...worldLinkTypes] } } },
          },
        }),
        prisma.metaScene.count(),
        prisma.scene.count({ where: { metaScenes: { none: {} } } }),
        prisma.person.count({
          where: {
            characterProfile: { isNot: null },
            characterMemories: { none: {} },
          },
        }),
        prisma.settingProfile.count({
          where: {
            AND: [
              { OR: [{ sounds: null }, { sounds: "" }] },
              { OR: [{ smells: null }, { smells: "" }] },
              { OR: [{ textures: null }, { textures: "" }] },
            ],
          },
        }),
        prisma.metaScene.count({
          where: { povPerson: { characterProfile: null } },
        }),
        (async () => {
          const grouped = await prisma.fragmentLink.groupBy({
            by: ["linkedId"],
            where: { linkedType: "meta_scene" },
          });
          const withLink = new Set(grouped.map((g) => g.linkedId));
          if (withLink.size === 0) return prisma.metaScene.count();
          return prisma.metaScene.count({ where: { id: { notIn: [...withLink] } } });
        })(),
        prisma.metaScene.count({
          where: {
            AND: [
              { OR: [{ historicalConstraints: null }, { historicalConstraints: "" }] },
              { OR: [{ socialConstraints: null }, { socialConstraints: "" }] },
            ],
          },
        }),
        prisma.metaScene.count({
          where: { OR: [{ symbolicElements: null }, { symbolicElements: "" }] },
        }),
        prisma.metaScene.count({
          where: { OR: [{ emotionalVoltage: null }, { emotionalVoltage: "" }] },
        }),
        prisma.metaScene.count({
          where: {
            AND: [{ NOT: { sensoryField: null } }, { sensoryField: { not: "" } }],
          },
        }),
        prisma.person.count({
          where: { characterMemories: { some: {} } },
        }),
        prisma.settingProfile.count({
          where: {
            AND: [
              { NOT: { OR: [{ sounds: null }, { sounds: "" }] } },
              { NOT: { OR: [{ smells: null }, { smells: "" }] } },
              { NOT: { OR: [{ textures: null }, { textures: "" }] } },
            ],
          },
        }),
        (async () => {
          const grouped = await prisma.fragmentLink.groupBy({
            by: ["linkedId"],
            where: { linkedType: "meta_scene" },
          });
          const withFragment = new Set(grouped.map((g) => g.linkedId));
          if (withFragment.size === 0) return 0;
          return prisma.metaScene.count({
            where: {
              id: { in: [...withFragment] },
              NOT: { sourceSupportLevel: null },
              AND: [
                { NOT: { OR: [{ sensoryField: null }, { sensoryField: "" }] } },
                { NOT: { OR: [{ environmentDescription: null }, { environmentDescription: "" }] } },
              ],
              place: { settingProfile: { isNot: null } },
              povPerson: { characterProfile: { isNot: null } },
            },
          });
        })(),
      ]);

      const [
        fragmentClustersCount,
        fragmentClusterMemberships,
        fragmentsHighDecompositionPressure,
        fragmentsWithoutHiddenMeaning,
        sceneConstructionSuggestionsOpen,
        metaScenesLowPovStrength,
        metaScenesLowSymbolicField,
        metaScenesWeakCentralConflict,
        worldAnchorsFeelStatic,
        unlinkedStrongFragments,
        recentClusters,
        recentSceneSuggestions,
        metaScenesNeedingAttention,
      ] = await Promise.all([
        prisma.fragmentCluster.count(),
        prisma.fragmentClusterLink.count(),
        prisma.fragment.count({ where: { decompositionPressure: "high" } }),
        prisma.fragment.count({
          where: {
            OR: [{ hiddenMeaning: null }, { hiddenMeaning: "" }],
          },
        }),
        prisma.sceneConstructionSuggestion.count({ where: { status: "suggested" } }),
        prisma.metaScene.count({
          where: {
            povPerson: { characterProfile: { isNot: null } },
            OR: [{ characterStatesSummary: null }, { characterStatesSummary: "" }],
          },
        }),
        prisma.metaScene.count({
          where: { OR: [{ symbolicElements: null }, { symbolicElements: "" }] },
        }),
        prisma.metaScene.count({
          where: { OR: [{ centralConflict: null }, { centralConflict: "" }] },
        }),
        prisma.metaScene.count({
          where: {
            AND: [
              { NOT: { OR: [{ environmentDescription: null }, { environmentDescription: "" }] } },
              {
                OR: [
                  { OR: [{ emotionalVoltage: null }, { emotionalVoltage: "" }] },
                  { OR: [{ centralConflict: null }, { centralConflict: "" }] },
                ],
              },
            ],
          },
        }),
        prisma.fragment.count({
          where: {
            confidence: { gte: 4 },
            links: { none: { linkedType: "meta_scene" } },
          },
        }),
        prisma.fragmentCluster.findMany({
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: { id: true, title: true, clusterType: true, updatedAt: true },
        }),
        prisma.sceneConstructionSuggestion.findMany({
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            title: true,
            suggestionType: true,
            status: true,
            metaSceneId: true,
            updatedAt: true,
          },
        }),
        prisma.metaScene.findMany({
          where: {
            OR: [
              { OR: [{ symbolicElements: null }, { symbolicElements: "" }] },
              { OR: [{ centralConflict: null }, { centralConflict: "" }] },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: { id: true, title: true, place: { select: { name: true } } },
        }),
      ]);

      const [
        peopleWithoutEnneagramType,
        peopleInferredEnneagramSource,
        relationshipsWithoutDynamics,
        metaScenesNoSoulSuggestions,
        metaScenesLowHeartHeuristic,
        metaScenesDecorativeEnvironment,
        metaScenesWeakRelationshipPressure,
        metaScenesGenericEmotionalEngine,
        recentSoulSuggestions,
        recentInferredEnneagramProfiles,
        metaScenesNeedingEmbodiment,
      ] = await Promise.all([
        prisma.characterProfile.count({ where: { enneagramType: null } }),
        prisma.characterProfile.count({ where: { enneagramSource: "inferred" } }),
        prisma.characterRelationship.count({
          where: {
            AND: [
              { OR: [{ emotionalPattern: null }, { emotionalPattern: "" }] },
              { OR: [{ enneagramDynamic: null }, { enneagramDynamic: "" }] },
            ],
          },
        }),
        prisma.metaScene.count({ where: { sceneSoulSuggestions: { none: {} } } }),
        prisma.metaScene.count({
          where: {
            OR: [
              { OR: [{ emotionalVoltage: null }, { emotionalVoltage: "" }] },
              { OR: [{ characterStatesSummary: null }, { characterStatesSummary: "" }] },
            ],
          },
        }),
        prisma.metaScene.count({
          where: {
            AND: [
              { OR: [{ environmentDescription: null }, { environmentDescription: "" }] },
              { OR: [{ sensoryField: null }, { sensoryField: "" }] },
            ],
          },
        }),
        prisma.metaScene.count({
          where: {
            AND: [
              { OR: [{ centralConflict: null }, { centralConflict: "" }] },
              { participants: { isEmpty: true } },
            ],
          },
        }),
        prisma.metaScene.count({
          where: { OR: [{ emotionalVoltage: null }, { emotionalVoltage: "" }] },
        }),
        prisma.sceneSoulSuggestion.findMany({
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            title: true,
            suggestionType: true,
            status: true,
            metaSceneId: true,
            updatedAt: true,
          },
        }),
        prisma.characterProfile.findMany({
          where: { enneagramSource: { in: ["inferred", "hybrid"] } },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: { personId: true, updatedAt: true },
        }),
        prisma.metaScene.findMany({
          where: {
            povPerson: {
              characterProfile: {
                OR: [
                  { enneagramType: null },
                  { OR: [{ sensoryBias: null }, { sensoryBias: "" }] },
                ],
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: { id: true, title: true },
        }),
      ]);

      const [narrativePassCount, metaScenesMissingDescriptiveCache, recentNarrativePasses] = await Promise.all([
        prisma.metaSceneNarrativePass.count(),
        prisma.metaScene.count({
          where: {
            AND: [
              { OR: [{ generatedWorldSummary: null }, { generatedWorldSummary: "" }] },
              { OR: [{ generatedPerspectiveSummary: null }, { generatedPerspectiveSummary: "" }] },
            ],
          },
        }),
        prisma.metaSceneNarrativePass.findMany({
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: { id: true, passType: true, status: true, metaSceneId: true, updatedAt: true },
        }),
      ]);

      const worldAnchorCoveragePct =
        metaScenesCount > 0 ? Math.round((worldAnchorsReady / metaScenesCount) * 100) : 0;

      return {
        totalSources,
        totalFragments,
        unplacedFragments,
        multiCandidateFragments,
        highAmbiguityFragments,
        fragmentsLinkedToScenes,
        fragmentsLinkedToChapters,
        openQuestionsCount,
        continuityNotesCount,
        sourcesNotDecomposed,
        scenesWeakGrounding,
        chaptersWithFewFragments,
        topSymbolsByUsage,
        topThemesByInsight,
        recentInsights,
        recentContinuityPressure,
        recentSceneAssistRuns,
        fragmentsNeedingReview,
        peopleWithoutCharacterProfile,
        placesWithoutSettingProfile,
        fragmentsWithoutWorldLinks,
        metaScenesCount,
        scenesWithoutMetaScene,
        peopleWithWeakMemoryCoverage,
        placesWithWeakSensoryModel,
        metaScenesMissingPov,
        metaScenesMissingFragments,
        metaScenesMissingConstraints,
        metaScenesMissingSymbolic,
        metaScenesMissingEmotionalVoltage,
        metaScenesWithSensoryLayer,
        peopleWithMemoryAnchors,
        placesWithRichSensoryModel,
        worldAnchorsReady,
        fragmentClustersCount,
        fragmentClusterMemberships,
        fragmentsHighDecompositionPressure,
        fragmentsWithoutHiddenMeaning,
        sceneConstructionSuggestionsOpen,
        metaScenesLowPovStrength,
        metaScenesLowSymbolicField,
        metaScenesWeakCentralConflict,
        worldAnchorsFeelStatic,
        unlinkedStrongFragments,
        recentClusters,
        recentSceneSuggestions,
        metaScenesNeedingAttention: metaScenesNeedingAttention.map((m) => ({
          id: m.id,
          title: m.title,
          placeName: m.place.name,
        })),
        peopleWithoutEnneagramType,
        peopleInferredEnneagramSource,
        relationshipsWithoutDynamics,
        metaScenesNoSoulSuggestions,
        metaScenesLowHeartHeuristic,
        metaScenesDecorativeEnvironment,
        metaScenesWeakRelationshipPressure,
        metaScenesGenericEmotionalEngine,
        recentSoulSuggestions,
        recentInferredEnneagramProfiles,
        metaScenesNeedingEmbodiment,
        narrativePassCount,
        metaScenesMissingDescriptiveCache,
        recentNarrativePasses,
        narrativeRulesCount,
        narrativeBindingsCount,
        brainMemosCount,
        worldAnchorCoveragePct,
      };
    },
    {
      totalSources: 0,
      totalFragments: 0,
      unplacedFragments: 0,
      multiCandidateFragments: 0,
      highAmbiguityFragments: 0,
      fragmentsLinkedToScenes: 0,
      fragmentsLinkedToChapters: 0,
      openQuestionsCount: 0,
      continuityNotesCount: 0,
      sourcesNotDecomposed: 0,
      scenesWeakGrounding: 0,
      chaptersWithFewFragments: [],
      topSymbolsByUsage: [],
      topThemesByInsight: [],
      recentInsights: [],
      recentContinuityPressure: [],
      recentSceneAssistRuns: [],
      fragmentsNeedingReview: [],
      peopleWithoutCharacterProfile: 0,
      placesWithoutSettingProfile: 0,
      fragmentsWithoutWorldLinks: 0,
      metaScenesCount: 0,
      scenesWithoutMetaScene: 0,
      peopleWithWeakMemoryCoverage: 0,
      placesWithWeakSensoryModel: 0,
      metaScenesMissingPov: 0,
      metaScenesMissingFragments: 0,
      metaScenesMissingConstraints: 0,
      metaScenesMissingSymbolic: 0,
      metaScenesMissingEmotionalVoltage: 0,
      metaScenesWithSensoryLayer: 0,
      peopleWithMemoryAnchors: 0,
      placesWithRichSensoryModel: 0,
      worldAnchorsReady: 0,
      fragmentClustersCount: 0,
      fragmentClusterMemberships: 0,
      fragmentsHighDecompositionPressure: 0,
      fragmentsWithoutHiddenMeaning: 0,
      sceneConstructionSuggestionsOpen: 0,
      metaScenesLowPovStrength: 0,
      metaScenesLowSymbolicField: 0,
      metaScenesWeakCentralConflict: 0,
      worldAnchorsFeelStatic: 0,
      unlinkedStrongFragments: 0,
      recentClusters: [],
      recentSceneSuggestions: [],
      metaScenesNeedingAttention: [],
      peopleWithoutEnneagramType: 0,
      peopleInferredEnneagramSource: 0,
      relationshipsWithoutDynamics: 0,
      metaScenesNoSoulSuggestions: 0,
      metaScenesLowHeartHeuristic: 0,
      metaScenesDecorativeEnvironment: 0,
      metaScenesWeakRelationshipPressure: 0,
      metaScenesGenericEmotionalEngine: 0,
      recentSoulSuggestions: [],
      recentInferredEnneagramProfiles: [],
      metaScenesNeedingEmbodiment: [],
      narrativePassCount: 0,
      metaScenesMissingDescriptiveCache: 0,
      recentNarrativePasses: [],
      narrativeRulesCount: 0,
      narrativeBindingsCount: 0,
      brainMemosCount: 0,
      worldAnchorCoveragePct: 0,
    },
  );
}

export async function getCharacterMindBundle(personId: string) {
  return safe(
    () =>
      prisma.person.findUnique({
        where: { id: personId },
        include: {
          characterProfile: true,
          characterMemories: { orderBy: { updatedAt: "desc" } },
          characterStates: {
            orderBy: { updatedAt: "desc" },
            include: {
              scene: { select: { id: true, description: true } },
              worldState: true,
            },
          },
          characterConstraints: { orderBy: { updatedAt: "desc" } },
          characterTriggers: { orderBy: { updatedAt: "desc" } },
          characterPerceptionProfile: true,
          characterVoiceProfile: true,
          characterChoiceProfile: true,
          relationshipsAsA: {
            include: { personB: { select: { id: true, name: true } } },
            orderBy: { updatedAt: "desc" },
          },
          relationshipsAsB: {
            include: { personA: { select: { id: true, name: true } } },
            orderBy: { updatedAt: "desc" },
          },
        },
      }),
    null,
  );
}

/** Identity + 1:1 simulation profile rows (no list relations). */
export async function getCharacterFullProfile(personId: string) {
  return safe(
    () =>
      prisma.person.findUnique({
        where: { id: personId },
        include: {
          characterProfile: true,
          characterPerceptionProfile: true,
          characterVoiceProfile: true,
          characterChoiceProfile: true,
        },
      }),
    null,
  );
}

/**
 * Bounded simulation bundle: profile, latest state slice, constraints, triggers, perception, voice, choice.
 * Scene engine will combine CharacterState + CharacterChoiceProfile; branch engine uses constraints + triggers;
 * voice / perception engines consume the respective profiles; ConstitutionalRule validates allowed actions.
 */
export async function getCharacterSimulationBundle(personId: string): Promise<CharacterSimulationBundle | null> {
  return safe(
    async () => {
      const person = await prisma.person.findUnique({
        where: { id: personId },
        include: {
          characterProfile: true,
          characterStates: { orderBy: { updatedAt: "desc" }, include: { worldState: true } },
          characterConstraints: { orderBy: { updatedAt: "desc" } },
          characterTriggers: { orderBy: { updatedAt: "desc" } },
          characterPerceptionProfile: true,
          characterVoiceProfile: true,
          characterChoiceProfile: true,
        },
      });
      if (!person) return null;
      const states = person.characterStates;
      for (const s of states) {
        warnIfCharacterStateMissingWorldContext(s, `simulationBundle:${personId}`);
      }
      return {
        personId: person.id,
        profile: person.characterProfile,
        currentState: states[0] ?? null,
        states,
        constraints: person.characterConstraints,
        triggers: person.characterTriggers,
        perception: person.characterPerceptionProfile,
        voice: person.characterVoiceProfile,
        choice: person.characterChoiceProfile,
      };
    },
    null,
  );
}

export async function getRelationshipsForAdmin() {
  return safe(
    () =>
      prisma.characterRelationship.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
        include: {
          personA: { select: { id: true, name: true } },
          personB: { select: { id: true, name: true } },
        },
      }),
    [],
  );
}

export async function getRelationshipById(id: string) {
  return safe(
    () =>
      prisma.characterRelationship.findUnique({
        where: { id },
        include: {
          personA: { select: { id: true, name: true } },
          personB: { select: { id: true, name: true } },
        },
      }),
    null,
  );
}

export async function getSceneSoulSuggestionsForMetaScene(metaSceneId: string) {
  return safe(
    () =>
      prisma.sceneSoulSuggestion.findMany({
        where: { metaSceneId },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export async function getNarrativePassesForMetaScene(metaSceneId: string) {
  return safe(
    () =>
      prisma.metaSceneNarrativePass.findMany({
        where: { metaSceneId },
        orderBy: { updatedAt: "desc" },
        take: 32,
      }),
    [],
  );
}

export async function getSettingEnvironmentBundle(placeId: string) {
  return safe(
    () =>
      prisma.place.findUnique({
        where: { id: placeId },
        include: {
          settingProfile: true,
          settingStates: { orderBy: { updatedAt: "desc" } },
        },
      }),
    null,
  );
}

export async function getWorldStateReferences() {
  return safe(
    () =>
      prisma.worldStateReference.findMany({
        orderBy: { eraId: "asc" },
      }),
    [],
  );
}

export async function getWorldStateById(id: string) {
  return safe(() => prisma.worldStateReference.findUnique({ where: { id } }), null);
}

/** Simulation + environment layers for a place (Place + profile + states + nodes + memory + connections touching those nodes). */
export async function getPlaceFullEnvironmentBundle(placeId: string): Promise<PlaceFullEnvironmentBundle | null> {
  return safe(
    async () => {
      const place = await prisma.place.findUnique({
        where: { id: placeId },
        include: {
          settingProfile: true,
          settingStates: { orderBy: { updatedAt: "desc" } },
          environmentProfile: true,
          placeStates: { orderBy: { updatedAt: "desc" }, include: { worldState: true } },
          environmentNodes: { orderBy: { key: "asc" } },
          placeMemoryProfiles: { orderBy: { updatedAt: "desc" }, include: { worldState: true } },
        },
      });
      if (!place) return null;

      const nodeIds = place.environmentNodes.map((n) => n.id);
      const connections =
        nodeIds.length === 0
          ? []
          : await prisma.nodeConnection.findMany({
              where: {
                OR: [{ fromNodeId: { in: nodeIds } }, { toNodeId: { in: nodeIds } }],
              },
              include: {
                fromNode: { select: { id: true, key: true, label: true } },
                toNode: { select: { id: true, key: true, label: true } },
                worldState: true,
              },
            });

      return {
        place,
        environmentProfile: place.environmentProfile,
        placeStates: place.placeStates,
        nodes: place.environmentNodes,
        memoryProfiles: place.placeMemoryProfiles,
        connections,
      };
    },
    null,
  );
}

export async function getPlacesForEnvironmentAdmin(filters?: EnvironmentAdminFilters) {
  const where: Prisma.PlaceWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.search?.trim()) {
    where.name = { contains: filters.search.trim(), mode: "insensitive" };
  }
  return safe(
    () =>
      prisma.place.findMany({
        where,
        orderBy: { name: "asc" },
        take: 500,
        include: {
          environmentProfile: { select: { id: true } },
          _count: { select: { environmentNodes: true, placeStates: true } },
        },
      }),
    [],
  );
}

export async function getEnvironmentNodesForAdmin(filters?: EnvironmentNodeAdminFilters) {
  const where: Prisma.EnvironmentNodeWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.nodeType?.trim()) where.nodeType = filters.nodeType.trim();
  if (filters?.regionLabel?.trim()) where.regionLabel = { contains: filters.regionLabel.trim(), mode: "insensitive" };
  if (filters?.coreOnly) where.isCoreNode = true;
  if (filters?.search?.trim()) {
    where.OR = [
      { key: { contains: filters.search.trim(), mode: "insensitive" } },
      { label: { contains: filters.search.trim(), mode: "insensitive" } },
    ];
  }
  return safe(
    () =>
      prisma.environmentNode.findMany({
        where,
        orderBy: [{ placeId: "asc" }, { key: "asc" }],
        take: 500,
        include: { place: { select: { id: true, name: true } } },
      }),
    [],
  );
}

export async function getNodeConnectionsForAdmin(filters?: NodeConnectionAdminFilters) {
  const where: Prisma.NodeConnectionWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.connectionType) where.connectionType = filters.connectionType;
  if (filters?.worldStateId) where.worldStateId = filters.worldStateId;
  if (filters?.search?.trim()) {
    where.notes = { contains: filters.search.trim(), mode: "insensitive" };
  }
  return safe(
    () =>
      prisma.nodeConnection.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 500,
        include: {
          fromNode: { select: { id: true, key: true, label: true, placeId: true } },
          toNode: { select: { id: true, key: true, label: true, placeId: true } },
          worldState: true,
        },
      }),
    [],
  );
}

export async function getRiskRegimesForAdmin(filters?: EnvironmentAdminFilters) {
  const where: Prisma.RiskRegimeWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.search?.trim()) {
    where.OR = [
      { key: { contains: filters.search.trim(), mode: "insensitive" } },
      { label: { contains: filters.search.trim(), mode: "insensitive" } },
    ];
  }
  return safe(
    () =>
      prisma.riskRegime.findMany({
        where,
        orderBy: { key: "asc" },
        take: 500,
      }),
    [],
  );
}

export async function getPlaceMemoryProfilesForAdmin(placeId: string) {
  return safe(
    () =>
      prisma.placeMemoryProfile.findMany({
        where: { placeId },
        orderBy: { updatedAt: "desc" },
        include: { worldState: true },
      }),
    [],
  );
}

export async function getEnvironmentNodeByIdForAdmin(id: string) {
  return safe(
    () =>
      prisma.environmentNode.findUnique({
        where: { id },
        include: {
          place: { select: { id: true, name: true } },
        },
      }),
    null,
  );
}

export async function getNodeConnectionByIdForAdmin(id: string) {
  return safe(
    () =>
      prisma.nodeConnection.findUnique({
        where: { id },
        include: {
          fromNode: { select: { id: true, key: true, label: true, placeId: true } },
          toNode: { select: { id: true, key: true, label: true, placeId: true } },
          worldState: true,
        },
      }),
    null,
  );
}

export async function getRiskRegimeByIdForAdmin(id: string) {
  return safe(() => prisma.riskRegime.findUnique({ where: { id } }), null);
}

export async function getMetaScenesForAdmin() {
  return safe(
    () =>
      prisma.metaScene.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          place: { select: { id: true, name: true } },
          povPerson: { select: { id: true, name: true } },
          scene: { select: { id: true, description: true } },
        },
      }),
    [],
  );
}

export async function getMetaSceneByIdForAdmin(id: string) {
  return safe(
    () =>
      prisma.metaScene.findUnique({
        where: { id },
        include: {
          place: true,
          povPerson: true,
          scene: { select: { id: true, description: true, chapterId: true, chapter: { select: { title: true } } } },
        },
      }),
    null,
  );
}

export async function getScenesForMetaScenePicker() {
  return safe(
    () =>
      prisma.scene.findMany({
        orderBy: [{ chapterId: "asc" }, { orderInChapter: "asc" }],
        take: 400,
        select: {
          id: true,
          description: true,
          chapter: { select: { title: true } },
        },
      }),
    [],
  );
}

export async function getPlacesPeopleForMetaSceneForms() {
  return safe(
    async () => {
      const [places, people] = await Promise.all([
        prisma.place.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        prisma.person.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      ]);
      return { places, people };
    },
    { places: [] as { id: string; name: string }[], people: [] as { id: string; name: string }[] },
  );
}

export async function getSourceDecompositionWorkspace(sourceId: string) {
  return safe(
    async () => {
      const source = await prisma.source.findUnique({
        where: { id: sourceId },
        include: {
          sourceText: true,
          sourceChunks: { orderBy: { chunkIndex: "asc" } },
          fragments: {
            orderBy: { createdAt: "desc" },
            include: {
              _count: {
                select: { childFragments: true, placementCandidates: true },
              },
            },
          },
        },
      });
      return source;
    },
    null,
  );
}

export type EntityHintsForDecomposition = {
  chapterTitles: { id: string; title: string }[];
  sceneLabels: { id: string; label: string; chapterTitle?: string }[];
  symbolNames: { id: string; name: string }[];
  placeNames: { id: string; name: string }[];
  personNames: { id: string; name: string }[];
  openQuestionTitles: { id: string; title: string }[];
};

export async function getClustersForAdmin() {
  return safe(
    () =>
      prisma.fragmentCluster.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
        include: {
          _count: { select: { fragmentLinks: true } },
        },
      }),
    [],
  );
}

export async function getClusterById(id: string) {
  return safe(
    () =>
      prisma.fragmentCluster.findUnique({
        where: { id },
        include: {
          fragmentLinks: {
            orderBy: { createdAt: "asc" },
            include: {
              fragment: {
                select: {
                  id: true,
                  title: true,
                  fragmentType: true,
                  text: true,
                  summary: true,
                },
              },
            },
          },
          chapter: { select: { id: true, title: true } },
          scene: { select: { id: true, description: true } },
          metaScene: { select: { id: true, title: true } },
          person: { select: { id: true, name: true } },
          place: { select: { id: true, name: true } },
          symbol: { select: { id: true, name: true } },
        },
      }),
    null,
  );
}

export async function getSceneConstructionSuggestionsForMetaScene(metaSceneId: string) {
  return safe(
    () =>
      prisma.sceneConstructionSuggestion.findMany({
        where: { metaSceneId },
        orderBy: { updatedAt: "desc" },
      }),
    [],
  );
}

export async function getEntityHintsForDecomposition(): Promise<EntityHintsForDecomposition> {
  return safe(
    async () => {
      const [chapters, scenes, symbols, places, people, questions] = await Promise.all([
        prisma.chapter.findMany({
          select: { id: true, title: true },
          take: 80,
          orderBy: { chapterNumber: "asc" },
        }),
        prisma.scene.findMany({
          take: 120,
          orderBy: { updatedAt: "desc" },
          include: { chapter: { select: { title: true } } },
        }),
        prisma.symbol.findMany({ select: { id: true, name: true }, take: 60 }),
        prisma.place.findMany({ select: { id: true, name: true }, take: 60 }),
        prisma.person.findMany({ select: { id: true, name: true }, take: 60 }),
        prisma.openQuestion.findMany({ select: { id: true, title: true }, take: 40 }),
      ]);
      return {
        chapterTitles: chapters.map((c) => ({ id: c.id, title: c.title })),
        sceneLabels: scenes.map((s) => ({
          id: s.id,
          label: s.description,
          chapterTitle: s.chapter.title,
        })),
        symbolNames: symbols.map((s) => ({ id: s.id, name: s.name })),
        placeNames: places.map((p) => ({ id: p.id, name: p.name })),
        personNames: people.map((p) => ({ id: p.id, name: p.name })),
        openQuestionTitles: questions.map((q) => ({ id: q.id, title: q.title })),
      };
    },
    {
      chapterTitles: [],
      sceneLabels: [],
      symbolNames: [],
      placeNames: [],
      personNames: [],
      openQuestionTitles: [],
    },
  );
}

/** Stage 5 — world pressure bundle row + linked world state (admin inspection). */
export async function getWorldPressureBundleForAdmin(worldStateId: string) {
  return safe(
    () =>
      prisma.worldPressureBundle.findUnique({
        where: { worldStateId },
        include: { worldState: true },
      }),
    null,
  );
}

export async function getWorldPressureBundleByIdForAdmin(id: string) {
  return safe(
    () =>
      prisma.worldPressureBundle.findUnique({
        where: { id },
        include: { worldState: true },
      }),
    null,
  );
}

export async function getWorldPressureBundlesForAdmin() {
  return safe(
    () =>
      prisma.worldPressureBundle.findMany({
        take: 100,
        orderBy: { updatedAt: "desc" },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    [],
  );
}

/** Stage 5 — full character × world pressure slice for admin and future scene engines. */
export async function getCharacterPressureBundle(
  personId: string,
  worldStateId: string,
): Promise<CharacterPressureBundle | null> {
  return safe(
    async () => {
      const [person, worldState] = await Promise.all([
        prisma.person.findUnique({
          where: { id: personId },
          include: { characterProfile: true },
        }),
        prisma.worldStateReference.findUnique({ where: { id: worldStateId } }),
      ]);
      if (!person || !worldState) return null;

      const [governanceImpact, socioEconomic, demographic, familyPressure, characterState] = await Promise.all([
        prisma.characterGovernanceImpact.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterSocioEconomicProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterDemographicProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterFamilyPressureProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterState.findFirst({
          where: { personId, worldStateId },
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      return {
        person,
        worldState,
        governanceImpact,
        socioEconomic,
        demographic,
        familyPressure,
        characterState,
      };
    },
    null,
  );
}

export async function getWorldGovernanceProfilesForAdmin(filters?: WorldGovernanceAdminFilters) {
  const where: Prisma.WorldGovernanceProfileWhereInput = {};
  if (filters?.visibility) where.visibility = filters.visibility;
  if (filters?.recordType) where.recordType = filters.recordType;
  if (filters?.search?.trim()) {
    where.label = { contains: filters.search.trim(), mode: "insensitive" };
  }
  return safe(
    () =>
      prisma.worldGovernanceProfile.findMany({
        where,
        take: 200,
        orderBy: { updatedAt: "desc" },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    [],
  );
}

export async function getWorldGovernanceProfileByIdForAdmin(id: string) {
  return safe(
    () =>
      prisma.worldGovernanceProfile.findUnique({
        where: { id },
        include: { worldState: true },
      }),
    null,
  );
}

export async function getCharacterPressureProfilesForAdmin(personId: string) {
  return safe(
    async () => {
      const [governanceImpacts, socioEconomicProfiles, demographicProfiles, familyPressureProfiles] =
        await Promise.all([
          prisma.characterGovernanceImpact.findMany({
            where: { personId },
            orderBy: { updatedAt: "desc" },
            include: { worldState: { select: { id: true, eraId: true, label: true } } },
          }),
          prisma.characterSocioEconomicProfile.findMany({
            where: { personId },
            orderBy: { updatedAt: "desc" },
            include: { worldState: { select: { id: true, eraId: true, label: true } } },
          }),
          prisma.characterDemographicProfile.findMany({
            where: { personId },
            orderBy: { updatedAt: "desc" },
            include: { worldState: { select: { id: true, eraId: true, label: true } } },
          }),
          prisma.characterFamilyPressureProfile.findMany({
            where: { personId },
            orderBy: { updatedAt: "desc" },
            include: { worldState: { select: { id: true, eraId: true, label: true } } },
          }),
        ]);
      return {
        governanceImpacts,
        socioEconomicProfiles,
        demographicProfiles,
        familyPressureProfiles,
      };
    },
    {
      governanceImpacts: [],
      socioEconomicProfiles: [],
      demographicProfiles: [],
      familyPressureProfiles: [],
    },
  );
}

/** Stage 5.5 — batch world knowledge + expression rows for many era slices (avoids N+1 on character intelligence page). */
export async function getWorldIntelligenceHorizonsForWorldIds(worldStateIds: string[]) {
  return safe(
    async () => {
      if (worldStateIds.length === 0) {
        return { knowledgeByWorld: new Map(), expressionByWorld: new Map() };
      }
      const [knowledge, expression] = await Promise.all([
        prisma.worldKnowledgeProfile.findMany({ where: { worldStateId: { in: worldStateIds } } }),
        prisma.worldExpressionProfile.findMany({ where: { worldStateId: { in: worldStateIds } } }),
      ]);
      return {
        knowledgeByWorld: new Map(knowledge.map((k) => [k.worldStateId, k])),
        expressionByWorld: new Map(expression.map((e) => [e.worldStateId, e])),
      };
    },
    {
      knowledgeByWorld: new Map(),
      expressionByWorld: new Map(),
    },
  );
}

/** Stage 5.5 — world knowledge + expression profiles for a single era slice. */
export async function getWorldIntelligenceHorizonForAdmin(worldStateId: string) {
  return safe(
    async () => {
      const [knowledge, expression] = await Promise.all([
        prisma.worldKnowledgeProfile.findUnique({
          where: { worldStateId },
          include: { worldState: { select: { id: true, eraId: true, label: true } } },
        }),
        prisma.worldExpressionProfile.findUnique({
          where: { worldStateId },
          include: { worldState: { select: { id: true, eraId: true, label: true } } },
        }),
      ]);
      return { knowledge, expression };
    },
    { knowledge: null, expression: null },
  );
}

/** Stage 5.5 — character cognition / development / biological rows by world state (admin). */
export async function getCharacterIntelligenceProfilesForAdmin(personId: string) {
  return safe(
    async () => {
      const [intelligence, development, biological] = await Promise.all([
        prisma.characterIntelligenceProfile.findMany({
          where: { personId },
          orderBy: { updatedAt: "desc" },
          include: { worldState: { select: { id: true, eraId: true, label: true } } },
        }),
        prisma.characterDevelopmentProfile.findMany({
          where: { personId },
          orderBy: { updatedAt: "desc" },
          include: { worldState: { select: { id: true, eraId: true, label: true } } },
        }),
        prisma.characterBiologicalState.findMany({
          where: { personId },
          orderBy: { updatedAt: "desc" },
          include: { worldState: { select: { id: true, eraId: true, label: true } } },
        }),
      ]);
      return { intelligence, development, biological };
    },
    {
      intelligence: [],
      development: [],
      biological: [],
    },
  );
}

/** Stage 5.5 — full character × world intelligence slice for envelopes and simulation. */
export async function getCharacterIntelligenceBundle(
  personId: string,
  worldStateId: string,
): Promise<CharacterIntelligenceBundle | null> {
  return safe(
    async () => {
      const [person, worldState] = await Promise.all([
        prisma.person.findUnique({ where: { id: personId } }),
        prisma.worldStateReference.findUnique({ where: { id: worldStateId } }),
      ]);
      if (!person || !worldState) return null;

      const [intelligence, development, biological, worldKnowledge, worldExpression] = await Promise.all([
        prisma.characterIntelligenceProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterDevelopmentProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterBiologicalState.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.worldKnowledgeProfile.findUnique({ where: { worldStateId } }),
        prisma.worldExpressionProfile.findUnique({ where: { worldStateId } }),
      ]);

      return {
        intelligence,
        development,
        biological,
        worldKnowledge,
        worldExpression,
      };
    },
    null,
  );
}

/** Stage 6 — world relationship norms row for admin. */
export async function getWorldRelationshipNormProfileForAdmin(worldStateId: string) {
  return safe(
    () =>
      prisma.worldRelationshipNormProfile.findUnique({
        where: { worldStateId },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    null,
  );
}

/** Stage 6 — character × world relationship slice (masking, desire, network, norms, dyads). */
export async function getCharacterRelationshipBundle(
  personId: string,
  worldStateId: string,
): Promise<CharacterRelationshipBundle | null> {
  return safe(
    async () => {
      const [worldState, masking, desire, networkSummary, worldNorms, relationshipProfilesInvolvingPerson] =
        await Promise.all([
          prisma.worldStateReference.findUnique({ where: { id: worldStateId } }),
          prisma.characterMaskingProfile.findUnique({ where: { personId_worldStateId: { personId, worldStateId } } }),
          prisma.characterDesireProfile.findUnique({ where: { personId_worldStateId: { personId, worldStateId } } }),
          prisma.relationshipNetworkSummary.findUnique({ where: { personId_worldStateId: { personId, worldStateId } } }),
          prisma.worldRelationshipNormProfile.findUnique({ where: { worldStateId } }),
          prisma.relationshipProfile.findMany({
            where: {
              worldStateId,
              OR: [{ personAId: personId }, { personBId: personId }],
            },
            orderBy: { updatedAt: "desc" },
            include: {
              personA: { select: { id: true, name: true } },
              personB: { select: { id: true, name: true } },
              disclosureProfiles: { where: { worldStateId } },
            },
          }),
        ]);
      if (!worldState) return null;
      return {
        worldState,
        masking,
        desire,
        networkSummary,
        worldNorms,
        relationshipProfilesInvolvingPerson,
      };
    },
    null,
  );
}

/** Stage 6 — list relationship profiles for admin index. */
export async function getRelationshipProfilesForAdmin(filters?: RelationshipProfileAdminFilters) {
  return safe(
    async () => {
      const where: Prisma.RelationshipProfileWhereInput = {};
      if (filters?.visibility) where.visibility = filters.visibility;
      if (filters?.recordType) where.recordType = filters.recordType;
      if (filters?.worldStateId) where.worldStateId = filters.worldStateId;
      if (filters?.relationshipType) where.relationshipType = filters.relationshipType;
      if (filters?.search?.trim()) {
        where.notes = { contains: filters.search.trim(), mode: "insensitive" };
      }
      return prisma.relationshipProfile.findMany({
        where,
        take: 200,
        orderBy: { updatedAt: "desc" },
        include: {
          personA: { select: { id: true, name: true } },
          personB: { select: { id: true, name: true } },
          worldState: { select: { id: true, eraId: true, label: true } },
        },
      });
    },
    [],
  );
}

export async function getRelationshipProfileByIdForAdmin(id: string) {
  return safe(
    () =>
      prisma.relationshipProfile.findUnique({
        where: { id },
        include: {
          personA: { select: { id: true, name: true } },
          personB: { select: { id: true, name: true } },
          worldState: true,
          dynamicStates: { orderBy: { updatedAt: "desc" } },
          disclosureProfiles: true,
        },
      }),
    null,
  );
}

export async function getMaskingProfilesForAdmin(personId: string) {
  return safe(
    () =>
      prisma.characterMaskingProfile.findMany({
        where: { personId },
        orderBy: { updatedAt: "desc" },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    [],
  );
}

export async function getDesireProfilesForAdmin(personId: string) {
  return safe(
    () =>
      prisma.characterDesireProfile.findMany({
        where: { personId },
        orderBy: { updatedAt: "desc" },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    [],
  );
}

/** Stage 6.5 — world education norms for world-state admin page. */
export async function getWorldEducationNormProfileForAdmin(worldStateId: string) {
  return safe(
    () =>
      prisma.worldEducationNormProfile.findUnique({
        where: { worldStateId },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    null,
  );
}

/** Stage 6.5 — list all world education norm rows (global index). */
export async function getWorldEducationNormProfilesForAdmin() {
  return safe(
    () =>
      prisma.worldEducationNormProfile.findMany({
        take: 200,
        orderBy: { updatedAt: "desc" },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    [],
  );
}

export async function getWorldEducationNormProfileByIdForAdmin(id: string) {
  return safe(
    () =>
      prisma.worldEducationNormProfile.findUnique({
        where: { id },
        include: { worldState: true },
      }),
    null,
  );
}

/** Stage 6.5 — world health interpretation norms for world-state admin page. */
export async function getWorldHealthNormProfileForAdmin(worldStateId: string) {
  return safe(
    () =>
      prisma.worldHealthNormProfile.findUnique({
        where: { worldStateId },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    null,
  );
}

/** Stage 6.5 — trauma, consequence, rumor, education, envelope + intelligence / pressure / relationship refs. */
export async function getCharacterContinuityBundle(
  personId: string,
  worldStateId: string,
): Promise<CharacterContinuityBundle | null> {
  return safe(
    async () => {
      const [p, ws] = await Promise.all([
        prisma.person.findUnique({ where: { id: personId } }),
        prisma.worldStateReference.findUnique({ where: { id: worldStateId } }),
      ]);
      if (!p || !ws) return null;

      const [
        trauma,
        consequenceMemory,
        rumorReputation,
        education,
        learningEnvelope,
        worldEducationNorm,
        worldHealthNorm,
        physicalHealth,
        mentalHealth,
        emotionalHealth,
        healthEnvelope,
        intelligenceRef,
        pressureRef,
        relationshipRef,
      ] = await Promise.all([
        prisma.characterTraumaProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterConsequenceMemoryProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterRumorReputationProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterEducationProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterLearningEnvelope.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.worldEducationNormProfile.findUnique({ where: { worldStateId } }),
        prisma.worldHealthNormProfile.findUnique({ where: { worldStateId } }),
        prisma.characterPhysicalHealthProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterMentalHealthProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterEmotionalHealthProfile.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        prisma.characterHealthEnvelope.findUnique({
          where: { personId_worldStateId: { personId, worldStateId } },
        }),
        getCharacterIntelligenceBundle(personId, worldStateId),
        getCharacterPressureBundle(personId, worldStateId),
        getCharacterRelationshipBundle(personId, worldStateId),
      ]);

      return {
        trauma,
        consequenceMemory,
        rumorReputation,
        education,
        learningEnvelope,
        worldEducationNorm,
        worldHealthNorm,
        physicalHealth,
        mentalHealth,
        emotionalHealth,
        healthEnvelope,
        intelligenceRef,
        pressureRef,
        relationshipRef,
      };
    },
    null,
  );
}

export async function getCharacterEducationProfilesForAdmin(personId: string) {
  return safe(
    () =>
      prisma.characterEducationProfile.findMany({
        where: { personId },
        orderBy: { updatedAt: "desc" },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    [],
  );
}

export async function getRumorProfilesForAdmin(personId: string) {
  return safe(
    () =>
      prisma.characterRumorReputationProfile.findMany({
        where: { personId },
        orderBy: { updatedAt: "desc" },
        include: { worldState: { select: { id: true, eraId: true, label: true } } },
      }),
    [],
  );
}
