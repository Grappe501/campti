import { prisma } from "@/lib/prisma";
import type { AuthorCanonDecisionType } from "@/lib/domain/canon-reconciliation";

export type RecordCanonDecisionInput = {
  claimId: string;
  authorDecision: AuthorCanonDecisionType;
  decisionReason: string;
  resultingCanonAction: string;
  resultingCanonRecordId?: string | null;
  intentionalDivergenceFlag?: boolean;
  overrideNotes?: string | null;
  decidedBy?: string | null;
  validationFlags?: string[];
};

/**
 * Persists immutable author decision rows (audit spine).
 */
export class CanonDecisionRecordingService {
  async recordDecision(input: RecordCanonDecisionInput): Promise<{ decisionId: string }> {
    const row = await prisma.authorCanonDecision.create({
      data: {
        claimId: input.claimId,
        authorDecision: input.authorDecision,
        decisionReason: input.decisionReason,
        resultingCanonAction: input.resultingCanonAction,
        resultingCanonRecordId: input.resultingCanonRecordId ?? null,
        intentionalDivergenceFlag: input.intentionalDivergenceFlag ?? false,
        overrideNotes: input.overrideNotes ?? null,
        decidedBy: input.decidedBy ?? null,
        validationFlags: input.validationFlags ?? [],
      },
    });
    return { decisionId: row.id };
  }
}
