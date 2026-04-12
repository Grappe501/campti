import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import type { SceneGenerationPurpose } from "@/lib/domain/scene-generation-output";
import { prisma } from "@/lib/prisma";
import {
  cognitionFrameToPromptPayload,
  resolveCharacterCognitionFrame,
} from "@/lib/services/character-cognition-resolver";
import { loadSceneGenerationContract } from "@/lib/services/scene-generation-contract-loader";

/**
 * Builds `SceneGenerationInput` for the generation boundary (contract + voice + goals + Phase 6 routing).
 * Historical anchor terms: from `AnalyzeProseContext` caller or empty (extend to pull from Place/Registry later).
 */
export async function loadSceneGenerationInput(
  sceneId: string,
  proseQaContext: SceneGenerationInput["proseQaContext"],
  options?: {
    generationMode?: SceneGenerationInput["generationMode"];
    generationPurpose?: SceneGenerationPurpose;
    proseBasis?: SceneGenerationInput["proseBasis"];
    basisProseOverride?: string | null;
    includeCognitionFrame?: boolean;
    includePinnedDecisionTracePayload?: boolean;
  }
): Promise<SceneGenerationInput> {
  const generationMode = options?.generationMode ?? "draft";
  const generationPurpose = options?.generationPurpose ?? "author_draft";

  const baseContract = await loadSceneGenerationContract(sceneId, {
    includePhase6Augmentations: true,
  });

  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    include: {
      chapter: {
        include: {
          book: true,
        },
      },
      persons: { take: 1 },
    },
  });

  const povPersonId = scene.persons[0]?.id;
  const [narrativeVoiceProfile, characterVoiceProfile] = await Promise.all([
    prisma.narrativeVoiceProfile.findFirst({
      where: {
        scopeType: "scene_mode",
        scopeId: scene.chapter.bookId,
      },
    }),
    povPersonId
      ? prisma.characterVoiceProfile.findUnique({
          where: { personId: povPersonId },
        })
      : Promise.resolve(null),
  ]);

  const historicalAnchorTerms = proseQaContext.historicalAnchorTerms ?? [];

  let cognitionFramePayload: Record<string, unknown> | null = null;
  let pinnedDecisionTracePayload: Record<string, unknown> | null = null;

  if (options?.includeCognitionFrame !== false && povPersonId) {
    try {
      const frame = await resolveCharacterCognitionFrame(povPersonId, sceneId);
      cognitionFramePayload = cognitionFrameToPromptPayload(frame);
    } catch {
      cognitionFramePayload = null;
    }
  }

  const contract: SceneGenerationInput["contract"] = {
    ...baseContract,
    thoughtLanguageMediation:
      cognitionFramePayload && cognitionFramePayload.thoughtLanguage != null
        ? (cognitionFramePayload.thoughtLanguage as Record<string, unknown>)
        : null,
  };

  if (options?.includePinnedDecisionTracePayload !== false && povPersonId) {
    const dt = await prisma.characterInnerVoiceSession.findFirst({
      where: {
        sceneId,
        personId: povPersonId,
        mode: "DECISION_TRACE",
        canonicalStatus: "PINNED",
      },
      orderBy: { createdAt: "desc" },
    });
    if (dt?.outputSummaryJson && typeof dt.outputSummaryJson === "object") {
      pinnedDecisionTracePayload = dt.outputSummaryJson as Record<string, unknown>;
    }
  }

  return {
    contract,
    generationMode,
    generationPurpose,
    cognitionFramePayload,
    pinnedDecisionTracePayload,
    proseBasis: options?.proseBasis,
    basisProseOverride: options?.basisProseOverride ?? null,
    narrativeVoiceProfile,
    characterVoiceProfile,
    authorSceneGoals: proseQaContext.authorGoals,
    historicalAnchorTerms,
    proseQaContext: {
      ...proseQaContext,
      historicalAnchorTerms,
      narrativeVoiceProfile: proseQaContext.narrativeVoiceProfile ?? narrativeVoiceProfile,
      characterVoiceProfile: proseQaContext.characterVoiceProfile ?? characterVoiceProfile,
    },
  };
}
