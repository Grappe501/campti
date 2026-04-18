import { prisma } from "@/lib/prisma";
import {
  RESEARCH_WORKBENCH_CONTRACT_VERSION,
  type ResearchDownstreamImpactSummary,
} from "@/lib/domain/research-workbench";
import { loadAcceptedRicreCanonKnowledgeForScene } from "@/lib/services/ricre-canon-knowledge-loader-service";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

/**
 * Truthful downstream snapshot for a research target (no fake injection claims).
 */
export async function buildResearchDownstreamImpactSummary(researchTargetId: string): Promise<ResearchDownstreamImpactSummary> {
  const target = await prisma.authorResearchTarget.findUnique({ where: { id: researchTargetId } });
  if (!target) {
    return {
      contractVersion: RESEARCH_WORKBENCH_CONTRACT_VERSION,
      acceptedActiveCanonTotal: 0,
      sceneLinked: false,
      primarySceneId: null,
      ricrePromptBundleRecordCount: null,
      ricrePromptEligible: false,
      canonicalHashWouldIncludeRicre: false,
      honestyNotes: ["Unknown research target — no downstream evaluation."],
    };
  }

  const sceneIds = asStringArray(target.linkedSceneIds);
  const personIds = asStringArray(target.linkedPersonIds);
  const placeIds = asStringArray(target.linkedPlaceIds);
  const chapterIds = asStringArray(target.linkedChapterIds);

  const primarySceneId = sceneIds[0] ?? null;

  let ricreBundle = null as Awaited<ReturnType<typeof loadAcceptedRicreCanonKnowledgeForScene>> | null;
  if (primarySceneId) {
    ricreBundle = await loadAcceptedRicreCanonKnowledgeForScene(primarySceneId);
  }

  const orClause = [
    ...sceneIds.map((id) => ({ targetType: "scene", targetId: id })),
    ...chapterIds.map((id) => ({ targetType: "chapter", targetId: id })),
    ...personIds.map((id) => ({ targetType: "person", targetId: id })),
    ...placeIds.map((id) => ({ targetType: "place", targetId: id })),
  ];

  const acceptedActiveCanonTotal =
    orClause.length === 0
      ? 0
      : await prisma.authorCanonKnowledgeRecord.count({
          where: {
            canonicalStatus: "active",
            OR: orClause,
          },
        });

  const honestyNotes: string[] = [
    "RICRE_ACCEPTED_CANON prompt block is only assembled when `loadAcceptedRicreCanonKnowledgeForScene` finds active rows for the scene’s linked entities.",
    "Canonical scene hash includes `ricreAcceptedCanonKnowledge` only when that bundle is present on the generation input.",
  ];
  if (!primarySceneId) {
    honestyNotes.push("No scene link on this target — scene-scoped RICRE prompt injection is not evaluated.");
  }
  if (!ricreBundle?.recordCount) {
    honestyNotes.push("No accepted canon bundle currently resolves for the primary linked scene (may still be zero after decisions).");
  }

  return {
    contractVersion: RESEARCH_WORKBENCH_CONTRACT_VERSION,
    acceptedActiveCanonTotal,
    sceneLinked: Boolean(primarySceneId),
    primarySceneId,
    ricrePromptBundleRecordCount: ricreBundle?.recordCount ?? null,
    ricrePromptEligible: Boolean(ricreBundle && ricreBundle.recordCount > 0),
    canonicalHashWouldIncludeRicre: Boolean(ricreBundle && ricreBundle.recordCount > 0),
    honestyNotes,
  };
}
