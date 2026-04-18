import { prisma } from "@/lib/prisma";
import type { IngestMethod, ResearchTargetType } from "@/lib/domain/research-ingestion";
import { computeResearchProvenanceHash, inferDefaultTrustTier } from "@/lib/services/research-provenance-service";
import { ResearchSourceNormalizationService } from "@/lib/services/research-source-normalization-service";

const MAX_FETCH_BYTES = 512_000;
const FETCH_TIMEOUT_MS = 12_000;
/** Manual paste body cap (characters) — aligned with excerpt persistence budget. */
export const RICRE_MAX_MANUAL_SOURCE_CHARS = 400_000;

function isAllowedResearchUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export type CreateResearchTargetInput = {
  targetType: ResearchTargetType;
  targetName: string;
  researchIntent?: string | null;
  linkedSceneIds?: string[];
  linkedChapterIds?: string[];
  linkedBookIds?: string[];
  linkedCharacterIds?: string[];
  linkedSettingIds?: string[];
  linkedEraIds?: string[];
  linkedThreadIds?: string[];
};

export type IngestUrlForTargetInput = {
  researchTargetId: string;
  sourceTitle: string;
  sourceUrl: string;
  publisher?: string | null;
  authorAttribution?: string | null;
  publicationDate?: string | null;
  /** When false, only metadata row is created (author-triggered fetch off). */
  fetchRemote?: boolean;
};

/**
 * Author-triggered research source ingestion. Does not crawl; one URL per call.
 */
export class ResearchSourceIngestionService {
  private readonly normalizer = new ResearchSourceNormalizationService();

  async createResearchTarget(input: CreateResearchTargetInput): Promise<{ id: string }> {
    const row = await prisma.authorResearchTarget.create({
      data: {
        targetType: input.targetType,
        targetName: input.targetName,
        researchIntent: input.researchIntent ?? null,
        linkedSceneIds: input.linkedSceneIds ?? [],
        linkedChapterIds: input.linkedChapterIds ?? [],
        linkedBookIds: input.linkedBookIds ?? [],
        linkedPersonIds: input.linkedCharacterIds ?? [],
        linkedPlaceIds: input.linkedSettingIds ?? [],
        linkedEraIds: input.linkedEraIds ?? [],
        linkedThreadIds: input.linkedThreadIds ?? [],
        validationFlags: [],
      },
    });
    return { id: row.id };
  }

  async ingestUrlForTarget(input: IngestUrlForTargetInput): Promise<{ sourceId: string; ingestMethod: IngestMethod }> {
    const target = await prisma.authorResearchTarget.findUnique({ where: { id: input.researchTargetId } });
    if (!target) throw new Error(`Unknown research target: ${input.researchTargetId}`);

    let rawExcerpt = "";
    let ingestMethod: IngestMethod = "author_manual_paste";
    let rawContentRef: string | null = null;

    if (input.fetchRemote !== false && isAllowedResearchUrl(input.sourceUrl)) {
      ingestMethod = "author_url_fetch";
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(input.sourceUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "Campti-RICRE/1.0 (author-triggered research ingestion)" },
        });
        clearTimeout(timer);
        if (!res.ok) {
          ingestMethod = "author_url_fetch_failed";
          rawExcerpt = `HTTP ${res.status} ${res.statusText}`;
        } else {
          const buf = await res.arrayBuffer();
          const slice = buf.byteLength > MAX_FETCH_BYTES ? buf.slice(0, MAX_FETCH_BYTES) : buf;
          const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);
          rawExcerpt = text.replace(/\s+/g, " ").trim().slice(0, 32_000);
          rawContentRef = `url_fetch:${input.sourceUrl}`;
        }
      } catch {
        ingestMethod = "author_url_fetch_failed";
        rawExcerpt = "fetch_failed_or_timeout";
      }
    } else {
      ingestMethod = "author_manual_paste";
      rawExcerpt = "";
    }

    const provenanceHash = computeResearchProvenanceHash({
      sourceUrl: input.sourceUrl,
      sourceTitle: input.sourceTitle,
      rawTextSample: rawExcerpt || input.sourceUrl,
      ingestMethod,
    });

    const trust = inferDefaultTrustTier({ ingestMethod, sourceUrl: input.sourceUrl });
    const norm = this.normalizer.toDomainRecord({
      sourceId: "pending",
      researchTargetId: input.researchTargetId,
      sourceType: "url",
      sourceTitle: input.sourceTitle,
      sourceUrl: input.sourceUrl,
      publisher: input.publisher ?? null,
      author: input.authorAttribution ?? null,
      publicationDate: input.publicationDate ?? null,
      accessDateIso: new Date().toISOString(),
      provenanceHash,
      ingestMethod,
      sourceTrustTier: trust,
      rawContentRef,
      legacySourceId: null,
      validationFlags: [],
    });

    const row = await prisma.authorResearchSource.create({
      data: {
        researchTargetId: input.researchTargetId,
        sourceType: norm.sourceType,
        sourceTitle: norm.sourceTitle,
        sourceUrl: norm.sourceUrl,
        publisher: norm.publisher,
        authorAttribution: norm.author,
        publicationDate: norm.publicationDate,
        provenanceHash: norm.provenanceHash,
        ingestMethod: norm.ingestMethod,
        sourceTrustTier: norm.sourceTrustTier,
        rawContentRef: norm.rawContentRef,
        rawExcerpt: rawExcerpt || null,
        validationFlags: norm.validationFlags,
      },
    });

    return { sourceId: row.id, ingestMethod };
  }

  /**
   * Author-supplied research text. No network I/O. Provenance hash covers title + text sample.
   */
  async ingestManualTextForTarget(input: {
    researchTargetId: string;
    sourceTitle: string;
    manualText: string;
    sourceTrustTier?: import("@/lib/domain/research-ingestion").SourceTrustTier;
    publisher?: string | null;
    authorAttribution?: string | null;
    publicationDate?: string | null;
  }): Promise<{ sourceId: string; ingestMethod: IngestMethod }> {
    const target = await prisma.authorResearchTarget.findUnique({ where: { id: input.researchTargetId } });
    if (!target) throw new Error(`Unknown research target: ${input.researchTargetId}`);

    const text = input.manualText.trim();
    const rawExcerpt = text.replace(/\s+/g, " ").trim().slice(0, 32_000);
    const ingestMethod: IngestMethod = "author_manual_paste";
    const provenanceHash = computeResearchProvenanceHash({
      sourceUrl: null,
      sourceTitle: input.sourceTitle,
      rawTextSample: text.slice(0, 24_000),
      ingestMethod,
    });

    const trust =
      input.sourceTrustTier ??
      inferDefaultTrustTier({ ingestMethod, sourceUrl: null });

    const norm = this.normalizer.toDomainRecord({
      sourceId: "pending",
      researchTargetId: input.researchTargetId,
      sourceType: "manual_paste",
      sourceTitle: input.sourceTitle,
      sourceUrl: null,
      publisher: input.publisher ?? null,
      author: input.authorAttribution ?? null,
      publicationDate: input.publicationDate ?? null,
      accessDateIso: new Date().toISOString(),
      provenanceHash,
      ingestMethod,
      sourceTrustTier: trust,
      rawContentRef: "manual_paste:inline",
      legacySourceId: null,
      validationFlags: [],
    });

    const row = await prisma.authorResearchSource.create({
      data: {
        researchTargetId: input.researchTargetId,
        sourceType: norm.sourceType,
        sourceTitle: norm.sourceTitle,
        sourceUrl: norm.sourceUrl,
        publisher: norm.publisher,
        authorAttribution: norm.author,
        publicationDate: norm.publicationDate,
        provenanceHash: norm.provenanceHash,
        ingestMethod: norm.ingestMethod,
        sourceTrustTier: norm.sourceTrustTier,
        rawContentRef: norm.rawContentRef,
        rawExcerpt: rawExcerpt || null,
        validationFlags: norm.validationFlags,
      },
    });

    return { sourceId: row.id, ingestMethod };
  }
}
