import type { Cluster3RuntimeActivationTruth } from "@/lib/domain/author-command-cockpit";
import type { ChapterCompositionPlan } from "@/lib/domain/chapter-composition";
import type { CamptiEpicContinuityPack } from "@/lib/domain/epic-narrative-continuity";
import type { CamptiEpicEmotionalGravityPack } from "@/lib/domain/epic-emotional-gravity";
import type { CamptiNarratorPresencePack } from "@/lib/domain/narrator-presence";
import type { NarrativeThread } from "@/lib/domain/narrative-thread";
import type { ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";
import type { SettingCoverageReport } from "@/lib/domain/narrative-thread";
import type { SequenceValidationReport } from "@/lib/domain/narrative-sequence";
import type { CanonicalPreGenerationBundle } from "@/lib/domain/canonical-scene-generation-governance";
import {
  buildCluster3RuntimeActivationTruth,
  CanonicalRuntimeCluster3GovernanceService,
  type Cluster3PackValidations,
} from "@/lib/services/canonical-runtime-cluster3-governance-service";
import { EpicContinuityDerivationService } from "@/lib/services/epic-continuity-derivation-service";
import { EpicContinuityValidationService } from "@/lib/services/epic-continuity-validation-service";
import { EpicEmotionalGravityDerivationService } from "@/lib/services/epic-emotional-gravity-derivation-service";
import { EpicEmotionalGravityValidationService } from "@/lib/services/epic-emotional-gravity-validation-service";
import { NarrativeSequenceDerivationService } from "@/lib/services/narrative-sequence-derivation-service";
import { NarrativeSequenceValidationService } from "@/lib/services/narrative-sequence-validation-service";
import { NarratorPresenceDerivationService } from "@/lib/services/narrator-presence-derivation-service";
import { NarratorPresenceValidationService } from "@/lib/services/narrator-presence-validation-service";

export type GovernanceOrchestrationInput = {
  proseConstraintsAfterLiteraryLayer: ProseGenerationConstraints;
  epicId: string;
  bookId: string;
  chapterId: string;
  chapterSequence: number;
  chapterMode: string;
  chapterPsychologyMode: string;
  activeThreadIds: string[];
  chapterCompositionPlan: ChapterCompositionPlan;
  narrativeThreads: NarrativeThread[];
  settingCoverageReport: Pick<SettingCoverageReport, "records" | "missingLocationIds">;
  sceneIdsInChapter: string[];
  preparationPath: CanonicalPreGenerationBundle["preparationPath"];
  literaryLayerParityNote?: string | null;
};

export type GovernanceOrchestrationResult = {
  sequenceDerivation: ReturnType<NarrativeSequenceDerivationService["derive"]>;
  proseConstraints: ProseGenerationConstraints;
  sequenceValidation: SequenceValidationReport;
  epicContinuityPack: CamptiEpicContinuityPack;
  epicEmotionalGravityPack: CamptiEpicEmotionalGravityPack;
  narratorPresencePack: CamptiNarratorPresencePack;
  validations: Cluster3PackValidations;
  cluster3RuntimeActivationTruth: Cluster3RuntimeActivationTruth;
};

/**
 * Single convergence point: derives ENCS / EEGS / narrator packs, sequence hook pressure, and applies
 * CanonicalRuntimeCluster3GovernanceService — used by regeneration and DB production scene generation.
 */
export class CanonicalNarrativeGovernanceOrchestrationService {
  orchestrate(input: GovernanceOrchestrationInput): GovernanceOrchestrationResult {
    const sequenceDerivation = new NarrativeSequenceDerivationService().derive({
      epicId: input.epicId,
      bookId: input.bookId,
      chapterId: input.chapterId,
      chapterCompositionPlan: input.chapterCompositionPlan,
      threads: input.narrativeThreads,
      settingCoverageReport: input.settingCoverageReport,
    });

    const epicContinuityPack = new EpicContinuityDerivationService().deriveCamptiPack({
      chapterId: input.chapterId,
      chapterSequence: input.chapterSequence,
      chapterMode: input.chapterMode,
      chapterPsychologyMode: input.chapterPsychologyMode,
      activeThreadIds: input.activeThreadIds,
      recallWindows: sequenceDerivation.bookSequencePlan.recallWindows,
    });
    const epicContinuityValidation = new EpicContinuityValidationService().validatePack(epicContinuityPack);

    const sequenceValidation = new NarrativeSequenceValidationService().validate({
      bookPlan: sequenceDerivation.bookSequencePlan,
      chapterPlan: sequenceDerivation.chapterSequencePlan,
      cluster3EpicContinuityHookRisks: epicContinuityValidation.risks,
    });

    const epicEmotionalGravityPack = new EpicEmotionalGravityDerivationService().deriveCamptiPack({
      chapterId: input.chapterId,
      chapterSequence: input.chapterSequence,
      chapterMode: input.chapterMode,
      chapterPsychologyMode: input.chapterPsychologyMode,
      activeThreadIds: input.activeThreadIds,
      recallWindows: sequenceDerivation.bookSequencePlan.recallWindows,
      sceneIds: input.sceneIdsInChapter,
    });
    const epicEmotionalGravityValidation = new EpicEmotionalGravityValidationService().validatePack(epicEmotionalGravityPack);

    const narratorPresencePack = new NarratorPresenceDerivationService().deriveCamptiPack({
      chapterId: input.chapterId,
      chapterSequence: input.chapterSequence,
      sceneIds: input.sceneIdsInChapter,
    });
    const narratorPresenceValidation = new NarratorPresenceValidationService().validatePack(narratorPresencePack);

    const validations: Cluster3PackValidations = {
      epicContinuity: epicContinuityValidation,
      epicEmotionalGravity: epicEmotionalGravityValidation,
      narratorPresence: narratorPresenceValidation,
    };

    const proseConstraints = new CanonicalRuntimeCluster3GovernanceService().applyToProseConstraints({
      constraints: input.proseConstraintsAfterLiteraryLayer,
      epicContinuityPack,
      epicEmotionalGravityPack,
      narratorPresencePack,
      validations,
    });

    const cluster3RuntimeActivationTruth = buildCluster3RuntimeActivationTruth({
      proseConstraints,
      sequenceValidation,
      epicContinuityPack,
      epicEmotionalGravityPack,
      narratorPresencePack,
      epicContinuityValidation: { valid: epicContinuityValidation.valid },
      epicEmotionalGravityValidation: { valid: epicEmotionalGravityValidation.valid },
      narratorPresenceValidation,
    });

    return {
      sequenceDerivation,
      proseConstraints,
      sequenceValidation,
      epicContinuityPack,
      epicEmotionalGravityPack,
      narratorPresencePack,
      validations,
      cluster3RuntimeActivationTruth: {
        ...cluster3RuntimeActivationTruth,
        advisoryRemainderNote:
          input.literaryLayerParityNote?.trim() ??
          cluster3RuntimeActivationTruth.advisoryRemainderNote,
      },
    };
  }

  toPreGenerationBundle(
    orchestrated: GovernanceOrchestrationResult,
    meta: {
      preparationPath: CanonicalPreGenerationBundle["preparationPath"];
      literaryLayerParityNote?: string | null;
    },
  ): CanonicalPreGenerationBundle {
    const validationFlags = [
      ...orchestrated.proseConstraints.validationFlags.filter((f) => f.startsWith("cluster3_")),
      "cluster4_canonical_pre_generation_bundle",
    ];
    return {
      contractVersion: "1",
      governanceMergeApplied: true,
      proseConstraints: orchestrated.proseConstraints,
      sequenceValidation: orchestrated.sequenceValidation,
      epicContinuityPack: orchestrated.epicContinuityPack,
      epicEmotionalGravityPack: orchestrated.epicEmotionalGravityPack,
      narratorPresencePack: orchestrated.narratorPresencePack,
      packValidations: orchestrated.validations,
      cluster3RuntimeActivationTruth: orchestrated.cluster3RuntimeActivationTruth,
      preparationPath: meta.preparationPath,
      literaryLayerParityNote: meta.literaryLayerParityNote ?? null,
      validationFlags,
    };
  }
}
