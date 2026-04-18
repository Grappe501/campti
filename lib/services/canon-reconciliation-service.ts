import { prisma } from "@/lib/prisma";
import type { AuthorCanonDecisionType } from "@/lib/domain/canon-reconciliation";
import { CanonDecisionRecordingService } from "@/lib/services/canon-decision-recording-service";

export type ApplyAuthorDecisionInput = {
  claimId: string;
  authorDecision: AuthorCanonDecisionType;
  decisionReason: string;
  decidedBy?: string | null;
  overrideNotes?: string | null;
  /** When accepting, which entity this knowledge should attach to for downstream query. */
  canonTargetType: string;
  canonTargetId: string;
  knowledgeType: string;
  historicalRealityStatus: string;
  storyRealityStatus: string;
};

/**
 * Author reconciliation — no automatic overwrite of narrative tables; only RICRE canon store + claim status.
 */
export class CanonReconciliationService {
  private readonly decisions = new CanonDecisionRecordingService();

  async applyAuthorDecision(input: ApplyAuthorDecisionInput): Promise<{ canonRecordId: string | null; decisionId: string }> {
    const claim = await prisma.authorResearchClaim.findUnique({ where: { id: input.claimId } });
    if (!claim) throw new Error(`Unknown claim ${input.claimId}`);

    let canonRecordId: string | null = null;
    let resultingAction = input.authorDecision;
    const flags: string[] = [];

    if (input.authorDecision === "reject") {
      const prevFlags = Array.isArray(claim.validationFlags) ? (claim.validationFlags as string[]) : [];
      await prisma.authorResearchClaim.update({
        where: { id: input.claimId },
        data: { claimStatus: "rejected", validationFlags: [...prevFlags, "ricre:rejected"] },
      });
    } else if (input.authorDecision === "mark_as_uncertain") {
      const rec = await this.decisions.recordDecision({
        claimId: input.claimId,
        authorDecision: input.authorDecision,
        decisionReason: input.decisionReason,
        resultingCanonAction: "create_uncertain_canon_row",
        resultingCanonRecordId: null,
        intentionalDivergenceFlag: false,
        overrideNotes: input.overrideNotes ?? null,
        decidedBy: input.decidedBy ?? null,
        validationFlags: flags,
      });
      const row = await prisma.authorCanonKnowledgeRecord.create({
        data: {
          canonicalStatus: "uncertain",
          targetType: input.canonTargetType,
          targetId: input.canonTargetId,
          knowledgeType: input.knowledgeType,
          content: claim.claimText,
          structuredValue: claim.structuredValue ?? undefined,
          sourceLinks: [{ sourceId: claim.sourceId, claimId: claim.id }],
          decisionHistory: [rec.decisionId],
          historicalRealityStatus: input.historicalRealityStatus,
          storyRealityStatus: "uncertain_story_canon",
          originatingClaimId: claim.id,
          impactSummary: "Marked uncertain — does not tighten story canon until promoted.",
          validationFlags: flags,
        },
      });
      canonRecordId = row.id;
      await prisma.authorCanonDecision.update({
        where: { id: rec.decisionId },
        data: { resultingCanonRecordId: row.id },
      });
      await prisma.authorResearchClaim.update({ where: { id: input.claimId }, data: { claimStatus: "decided" } });
      return { canonRecordId, decisionId: rec.decisionId };
    } else if (
      input.authorDecision === "accept_as_canon" ||
      input.authorDecision === "merge_with_existing" ||
      input.authorDecision === "store_as_alternate" ||
      input.authorDecision === "mark_as_historical_but_not_story_canon" ||
      input.authorDecision === "mark_as_intentional_story_divergence"
    ) {
      const status =
        input.authorDecision === "store_as_alternate"
          ? "alternate"
          : input.authorDecision === "mark_as_historical_but_not_story_canon"
            ? "historical_non_story"
            : input.authorDecision === "mark_as_intentional_story_divergence"
              ? "divergent_story"
              : "active";
      const rec = await this.decisions.recordDecision({
        claimId: input.claimId,
        authorDecision: input.authorDecision,
        decisionReason: input.decisionReason,
        resultingCanonAction: "create_canon_knowledge_row",
        resultingCanonRecordId: null,
        intentionalDivergenceFlag: input.authorDecision === "mark_as_intentional_story_divergence",
        overrideNotes: input.overrideNotes ?? null,
        decidedBy: input.decidedBy ?? null,
        validationFlags: flags,
      });
      const row = await prisma.authorCanonKnowledgeRecord.create({
        data: {
          canonicalStatus: status,
          targetType: input.canonTargetType,
          targetId: input.canonTargetId,
          knowledgeType: input.knowledgeType,
          content: claim.claimText,
          structuredValue: claim.structuredValue ?? undefined,
          sourceLinks: [{ sourceId: claim.sourceId, claimId: claim.id }],
          decisionHistory: [rec.decisionId],
          historicalRealityStatus: input.historicalRealityStatus,
          storyRealityStatus: input.storyRealityStatus,
          originatingClaimId: claim.id,
          impactSummary: `Decision=${input.authorDecision}`,
          validationFlags: flags,
        },
      });
      canonRecordId = row.id;
      await prisma.authorCanonDecision.update({
        where: { id: rec.decisionId },
        data: { resultingCanonRecordId: row.id },
      });
      await prisma.authorResearchClaim.update({ where: { id: input.claimId }, data: { claimStatus: "decided" } });
      return { canonRecordId, decisionId: rec.decisionId };
    } else {
      resultingAction = `${input.authorDecision}_noop`;
      flags.push("ricre:unsupported_decision_path_in_v1");
    }

    const rec = await this.decisions.recordDecision({
      claimId: input.claimId,
      authorDecision: input.authorDecision,
      decisionReason: input.decisionReason,
      resultingCanonAction: resultingAction,
      resultingCanonRecordId: canonRecordId,
      intentionalDivergenceFlag: false,
      overrideNotes: input.overrideNotes ?? null,
      decidedBy: input.decidedBy ?? null,
      validationFlags: flags,
    });

    return { canonRecordId, decisionId: rec.decisionId };
  }
}
