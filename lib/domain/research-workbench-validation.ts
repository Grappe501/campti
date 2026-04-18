import { z } from "zod";

import { AUTHOR_DECISIONS, AuthorCanonDecisionInputSchema } from "@/lib/domain/canon-reconciliation";
import { ResearchTargetWireSchema, SOURCE_TRUST_TIERS } from "@/lib/domain/research-ingestion";
import { RICRE_MAX_MANUAL_SOURCE_CHARS } from "@/lib/services/research-source-ingestion-service";

export const ResearchTargetCreateInputSchema = ResearchTargetWireSchema.extend({
  researchIntent: z.string().max(20_000).nullable().optional(),
}).superRefine((val, ctx) => {
  const linkCount =
    val.linkedSceneIds.length +
    val.linkedChapterIds.length +
    val.linkedBookIds.length +
    val.linkedCharacterIds.length +
    val.linkedSettingIds.length +
    val.linkedEraIds.length +
    val.linkedThreadIds.length;
  if (linkCount === 0 && val.targetType !== "other") {
    ctx.addIssue({
      code: "custom",
      message:
        "Link at least one scene, chapter, book, person, place, era, or thread — or set target type to `other` for a general canon topic.",
      path: ["linkedSceneIds"],
    });
  }
  if (linkCount === 0 && val.targetType === "other" && !val.researchIntent?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "General-topic (`other`) targets require research intent text describing scope.",
      path: ["researchIntent"],
    });
  }
});

export const ResearchIngestionManualInputSchema = z.object({
  researchTargetId: z.string().min(1),
  sourceTitle: z.string().min(1).max(500),
  manualText: z
    .string()
    .trim()
    .min(1, "Manual source text cannot be empty.")
    .max(RICRE_MAX_MANUAL_SOURCE_CHARS, `Manual text exceeds ${RICRE_MAX_MANUAL_SOURCE_CHARS} characters.`),
  sourceTrustTier: z.enum(SOURCE_TRUST_TIERS).optional(),
  publisher: z.string().max(500).nullable().optional(),
  authorAttribution: z.string().max(500).nullable().optional(),
});

export const ResearchIngestionUrlInputSchema = z.object({
  researchTargetId: z.string().min(1),
  sourceTitle: z.string().min(1).max(500),
  sourceUrl: z.string().url("Malformed URL."),
  fetchRemote: z.boolean(),
  publisher: z.string().max(500).nullable().optional(),
  authorAttribution: z.string().max(500).nullable().optional(),
  publicationDate: z.string().max(120).nullable().optional(),
});

export const ResearchClaimQueueFilterSchema = z.object({
  researchTargetId: z.string().min(1).optional(),
  statuses: z.array(z.string()).max(20).optional(),
});

export const ResearchComparisonRerunInputSchema = z.object({
  claimId: z.string().min(1),
});

/** Workbench-shaped author decision (maps to `ApplyAuthorDecisionInput`). */
export const ResearchWorkbenchDecisionInputSchema = z
  .object({
    claimId: z.string().min(1),
    workbenchDecision: z.enum(["accept", "reject", "uncertain", "divergence"]),
    decisionReason: z.string().min(4).max(20_000),
    overrideNotes: z.string().max(20_000).nullable().optional(),
    decidedBy: z.string().max(200).nullable().optional(),
    canonTargetType: z.string().min(1).max(120),
    canonTargetId: z.string().min(1).max(200),
    knowledgeType: z.string().min(1).max(200).default("ricre_research_claim"),
    historicalRealityStatus: z.string().min(1).max(120),
    storyRealityStatus: z.string().min(1).max(120),
  })
  .superRefine((val, ctx) => {
    if (val.workbenchDecision === "divergence" && !(val.overrideNotes?.trim().length)) {
      ctx.addIssue({
        code: "custom",
        message: "Divergence requires an explicit rationale in override notes.",
        path: ["overrideNotes"],
      });
    }
  });

export { AuthorCanonDecisionInputSchema, AUTHOR_DECISIONS };

export function mapWorkbenchDecisionToAuthorType(
  w: z.infer<typeof ResearchWorkbenchDecisionInputSchema>["workbenchDecision"]
): (typeof AUTHOR_DECISIONS)[number] {
  switch (w) {
    case "accept":
      return "accept_as_canon";
    case "reject":
      return "reject";
    case "uncertain":
      return "mark_as_uncertain";
    case "divergence":
      return "mark_as_intentional_story_divergence";
    default:
      return "reject";
  }
}
