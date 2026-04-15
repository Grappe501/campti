import {
  DRAFTING_REVISION_CONTRACT_VERSION,
  type DraftLifecycleStage,
  type DraftRevisionProgram,
  type RevisionRecord,
} from "@/lib/domain/drafting-revision";

function canTransition(from: DraftLifecycleStage, to: DraftLifecycleStage): boolean {
  const transitions: Record<DraftLifecycleStage, DraftLifecycleStage[]> = {
    draft: ["revision"],
    revision: ["revision", "candidate"],
    candidate: ["revision", "certified"],
    certified: [],
  };
  return transitions[from].includes(to);
}

function hasBlockingQualityViolations(program: DraftRevisionProgram): boolean {
  return (
    program.quality.unresolvedStructuralViolations.length > 0 ||
    program.quality.arcMisalignment.length > 0 ||
    program.quality.continuityBreaks.length > 0
  );
}

export function createDraftRevisionProgram(input: {
  chapterId: string;
  currentVersionId: string;
  quality?: DraftRevisionProgram["quality"];
}): DraftRevisionProgram {
  return {
    contractVersion: DRAFTING_REVISION_CONTRACT_VERSION,
    chapterId: input.chapterId,
    stage: "draft",
    currentVersionId: input.currentVersionId,
    revisions: [],
    quality: input.quality ?? {
      unresolvedStructuralViolations: [],
      arcMisalignment: [],
      continuityBreaks: [],
    },
  };
}

export function advanceDraftLifecycle(input: {
  program: DraftRevisionProgram;
  nextStage: DraftLifecycleStage;
  revision?: Omit<RevisionRecord, "nextVersionId">;
}): DraftRevisionProgram {
  if (!canTransition(input.program.stage, input.nextStage)) {
    throw new Error(`[drafting-revision] invalid transition ${input.program.stage} -> ${input.nextStage}`);
  }
  if ((input.nextStage === "candidate" || input.nextStage === "certified") && hasBlockingQualityViolations(input.program)) {
    throw new Error("[drafting-revision] quality violations must be cleared before candidate/certified stages.");
  }

  const revisions = [...input.program.revisions];
  if (input.revision) {
    revisions.push({
      ...input.revision,
      nextVersionId: null,
    });
  }

  return {
    ...input.program,
    stage: input.nextStage,
    revisions,
  };
}
