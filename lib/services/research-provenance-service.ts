import { createHash } from "node:crypto";

import type { IngestMethod, SourceTrustTier } from "@/lib/domain/research-ingestion";

export type ProvenanceInput = {
  sourceUrl: string | null;
  sourceTitle: string;
  rawTextSample: string;
  ingestMethod: IngestMethod;
};

/**
 * Stable provenance hash for dedupe and audit (not a cryptographic security boundary).
 */
export function computeResearchProvenanceHash(input: ProvenanceInput): string {
  const payload = [
    input.ingestMethod,
    input.sourceUrl ?? "",
    input.sourceTitle,
    input.rawTextSample.slice(0, 24_000),
  ].join("\u001f");
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

export function inferDefaultTrustTier(input: { ingestMethod: IngestMethod; sourceUrl: string | null }): SourceTrustTier {
  if (input.ingestMethod === "author_url_fetch_failed" || input.ingestMethod === "author_topic_stub") {
    return "unknown";
  }
  if (input.sourceUrl?.includes(".edu")) return "secondary";
  if (input.sourceUrl?.includes("archive.org")) return "secondary";
  return "popular_or_unverified";
}
