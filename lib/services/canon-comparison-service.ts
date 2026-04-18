import { prisma } from "@/lib/prisma";
import type { CanonComparisonRecord, CanonComparisonResult, ComparedAgainstType } from "@/lib/domain/canon-reconciliation";
import { RICRE_CANON_RECONCILIATION_CONTRACT_VERSION } from "@/lib/domain/canon-reconciliation";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const tb = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  let n = 0;
  for (const w of ta) {
    if (tb.has(w)) n += 1;
  }
  return ta.size ? n / Math.max(ta.size, 1) : 0;
}

/**
 * Compares a research claim against existing canon rows and light profile text (no silent writes).
 */
export class CanonComparisonService {
  async compareClaimToCanon(claimId: string): Promise<CanonComparisonRecord[]> {
    const claim = await prisma.authorResearchClaim.findUnique({
      where: { id: claimId },
      include: { researchTarget: true },
    });
    if (!claim) throw new Error(`Unknown claim ${claimId}`);

    const out: CanonComparisonRecord[] = [];
    const push = (o: Omit<CanonComparisonRecord, "contractVersion" | "comparisonId"> & { comparisonId?: string }) => {
      out.push({
        contractVersion: RICRE_CANON_RECONCILIATION_CONTRACT_VERSION,
        comparisonId: o.comparisonId ?? `cmp_${claimId}_${out.length}`,
        claimId: o.claimId,
        comparedAgainstType: o.comparedAgainstType,
        comparedAgainstId: o.comparedAgainstId,
        comparisonResult: o.comparisonResult,
        contradictionType: o.contradictionType,
        impactScope: o.impactScope,
        validationFlags: o.validationFlags,
      });
    };

    const canonRows = await prisma.authorCanonKnowledgeRecord.findMany({
      where: {
        canonicalStatus: { in: ["active", "alternate", "uncertain"] },
      },
      take: 80,
      orderBy: { updatedAt: "desc" },
    });

    for (const c of canonRows) {
      const overlap = tokenOverlap(claim.claimText, c.content);
      if (overlap < 0.12) continue;
      let result: CanonComparisonResult = "uncertain";
      let contradiction: string | null = null;
      if (overlap > 0.45 && claim.claimText.slice(0, 40) !== c.content.slice(0, 40)) {
        result = "contradicts_canon";
        contradiction = "lexical_tension_same_topic";
      } else if (overlap > 0.35) {
        result = "alternate_interpretation";
      } else if (overlap > 0.2) {
        result = "extends_canon";
      }
      push({
        claimId: claim.id,
        comparedAgainstType: "canon_knowledge",
        comparedAgainstId: c.id,
        comparisonResult: result,
        contradictionType: contradiction,
        impactScope: `${c.targetType}:${c.targetId}`,
        validationFlags: overlap > 0.35 ? ["ricre:high_overlap"] : [],
      });
    }

    const personIds = asStringArray(claim.researchTarget.linkedPersonIds);
    for (const pid of personIds.slice(0, 6)) {
      const person = await prisma.person.findUnique({ where: { id: pid }, select: { id: true, description: true, name: true } });
      if (!person?.description) continue;
      const overlap = tokenOverlap(claim.claimText, person.description);
      if (overlap < 0.15) continue;
      push({
        claimId: claim.id,
        comparedAgainstType: "person_profile",
        comparedAgainstId: person.id,
        comparisonResult: overlap > 0.35 ? "contradicts_canon" : "extends_canon",
        contradictionType: overlap > 0.35 ? "profile_text_tension" : null,
        impactScope: `person:${person.id}`,
        validationFlags: [],
      });
    }

    const placeIds = asStringArray(claim.researchTarget.linkedPlaceIds);
    for (const plid of placeIds.slice(0, 6)) {
      const place = await prisma.place.findUnique({ where: { id: plid }, select: { id: true, description: true, name: true } });
      if (!place?.description) continue;
      const overlap = tokenOverlap(claim.claimText, place.description);
      if (overlap < 0.15) continue;
      push({
        claimId: claim.id,
        comparedAgainstType: "place_profile",
        comparedAgainstId: place.id,
        comparisonResult: overlap > 0.35 ? "contradicts_canon" : "extends_canon",
        contradictionType: overlap > 0.35 ? "place_text_tension" : null,
        impactScope: `place:${place.id}`,
        validationFlags: [],
      });
    }

    if (out.length === 0) {
      push({
        claimId: claim.id,
        comparedAgainstType: "canon_knowledge",
        comparedAgainstId: "none",
        comparisonResult: "uncertain",
        contradictionType: null,
        impactScope: "global",
        validationFlags: ["ricre:no_overlap_found"],
      });
    }

    return out;
  }

  async persistComparisons(claimId: string, rows: CanonComparisonRecord[]): Promise<void> {
    await prisma.$transaction(
      rows.map((r) =>
        prisma.authorCanonComparison.create({
          data: {
            claimId,
            comparedAgainstType: r.comparedAgainstType as ComparedAgainstType,
            comparedAgainstId: r.comparedAgainstId,
            comparisonResult: r.comparisonResult,
            contradictionType: r.contradictionType,
            impactScope: r.impactScope,
            validationFlags: r.validationFlags,
          },
        }),
      ),
    );
    await prisma.authorResearchClaim.update({
      where: { id: claimId },
      data: { claimStatus: "compared" },
    });
  }
}
