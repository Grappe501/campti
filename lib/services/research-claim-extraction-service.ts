import { prisma } from "@/lib/prisma";
import type { ExtractedClaimType } from "@/lib/domain/research-ingestion";
import { ResearchClaimNormalizationService } from "@/lib/services/research-claim-normalization-service";

function splitSentences(text: string): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  return t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 48);
}

function classifySentence(s: string): ExtractedClaimType | null {
  const low = s.toLowerCase();
  if (/\b(ferry|ford|road|route|trail|crossing|mile|league)\b/.test(low)) return "route_constraint";
  if (/\b(river|bayou|creek|lake|parish|county|town|ridge)\b/.test(low)) return "geography_constraint";
  if (/\b(18\d{2}|19\d{2}|january|february|march|spring|winter)\b/.test(low)) return "timeline_constraint";
  if (/\b(custom|ritual|mass|church|sabbath|mourning|wedding|folk)\b/.test(low)) return "cultural_practice";
  if (/\b(dialect|creole|french|english|speech|said|called)\b/.test(low)) return "language_signal";
  if (/\b(smell|taste|sound|heard|felt|cold|hot|mud|dust)\b/.test(low)) return "sensory_detail";
  if (/\b(tool|wagon|cloth|iron|wood|meal|food|gun|plow)\b/.test(low)) return "object_usage";
  if (/\b(however|debate|disputed|uncertain|perhaps|oral tradition)\b/.test(low)) return "interpretive_claim";
  if (s.length > 24) return "descriptive_detail";
  return null;
}

/**
 * Deterministic stub extractor — replaces raw research with structured claims without silent canon writes.
 * Future: optional LLM extraction behind the same persistence boundary.
 */
export class ResearchClaimExtractionService {
  private readonly claimNorm = new ResearchClaimNormalizationService();

  async extractClaimsForSource(sourceId: string): Promise<{ evidenceId: string; claimIds: string[] }> {
    const source = await prisma.authorResearchSource.findUnique({
      where: { id: sourceId },
      include: { researchTarget: true },
    });
    if (!source) throw new Error(`Unknown research source: ${sourceId}`);

    const excerpt = source.rawExcerpt ?? "";
    const sentences = splitSentences(excerpt.length ? excerpt : source.sourceTitle);
    const candidates = sentences
      .map((sentence) => ({ sentence, type: classifySentence(sentence) }))
      .filter((x): x is { sentence: string; type: ExtractedClaimType } => Boolean(x.type));

    const deduped = this.claimNorm.dedupeClaims(
      candidates.map((c) => ({
        claimType: c.type,
        claimText: c.sentence,
        confidence: source.sourceTrustTier === "primary" ? 4 : 3,
      })),
    );

    return prisma.$transaction(async (tx) => {
      const evidence = await tx.authorResearchEvidence.create({
        data: {
          researchTargetId: source.researchTargetId,
          sourceId: source.id,
          extractedTextRef: source.rawContentRef,
          summary: excerpt.slice(0, 2000) || `Evidence from ${source.sourceTitle}`,
          confidence: 3,
          relevanceScore: 0.55,
          validationFlags: excerpt ? [] : ["ricre:no_excerpt_stub"],
        },
      });

      const claimIds: string[] = [];
      for (const row of deduped) {
        const claim = await tx.authorResearchClaim.create({
          data: {
            researchTargetId: source.researchTargetId,
            sourceId: source.id,
            evidenceId: evidence.id,
            claimType: row.claimType,
            claimText: row.claimText,
            confidence: row.confidence,
            timeScope: null,
            placeScope: null,
            peopleScope: [],
            materialCultureScope: null,
            languageScope: null,
            sensoryScope: null,
            contradictionPotential: "medium",
            claimStatus: "extracted",
            extractionMethod: "heuristic_stub",
            validationFlags: [],
          },
        });
        claimIds.push(claim.id);
      }

      return { evidenceId: evidence.id, claimIds };
    });
  }
}
