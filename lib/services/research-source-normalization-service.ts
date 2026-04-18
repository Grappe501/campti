import type { ResearchSourceRecord } from "@/lib/domain/research-ingestion";
import { RICRE_RESEARCH_INGESTION_CONTRACT_VERSION } from "@/lib/domain/research-ingestion";

export type NormalizeSourceInput = {
  sourceId: string;
  researchTargetId: string;
  sourceType: ResearchSourceRecord["sourceType"];
  sourceTitle: string;
  sourceUrl: string | null;
  publisher: string | null;
  author: string | null;
  publicationDate: string | null;
  accessDateIso: string;
  provenanceHash: string;
  ingestMethod: ResearchSourceRecord["ingestMethod"];
  sourceTrustTier: ResearchSourceRecord["sourceTrustTier"];
  rawContentRef: string | null;
  legacySourceId: string | null;
  validationFlags: string[];
};

export class ResearchSourceNormalizationService {
  toDomainRecord(input: NormalizeSourceInput): ResearchSourceRecord {
    const flags = [...input.validationFlags];
    if (!input.sourceTitle.trim()) flags.push("ricre:missing_title");
    if (!input.provenanceHash) flags.push("ricre:missing_provenance_hash");
    return {
      contractVersion: RICRE_RESEARCH_INGESTION_CONTRACT_VERSION,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      sourceTitle: input.sourceTitle.trim(),
      sourceUrl: input.sourceUrl?.trim() || null,
      publisher: input.publisher?.trim() || null,
      author: input.author?.trim() || null,
      publicationDate: input.publicationDate?.trim() || null,
      accessDate: input.accessDateIso,
      provenanceHash: input.provenanceHash,
      ingestMethod: input.ingestMethod,
      sourceTrustTier: input.sourceTrustTier,
      rawContentRef: input.rawContentRef,
      validationFlags: flags,
      researchTargetId: input.researchTargetId,
      legacySourceId: input.legacySourceId,
    };
  }
}
