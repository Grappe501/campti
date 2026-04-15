export const DRAFTING_REVISION_CONTRACT_VERSION = "1" as const;

export const DRAFT_LIFECYCLE_STAGES = [
  "draft",
  "revision",
  "candidate",
  "certified",
] as const;
export type DraftLifecycleStage = (typeof DRAFT_LIFECYCLE_STAGES)[number];

export type RevisionRecord = {
  revisionId: string;
  previousVersionId: string | null;
  nextVersionId: string | null;
  changeJustification: string;
  continuityRepairMarkers: string[];
};

export type ChapterQualityCheck = {
  unresolvedStructuralViolations: string[];
  arcMisalignment: string[];
  continuityBreaks: string[];
};

export type DraftRevisionProgram = {
  contractVersion: typeof DRAFTING_REVISION_CONTRACT_VERSION;
  chapterId: string;
  stage: DraftLifecycleStage;
  currentVersionId: string;
  revisions: RevisionRecord[];
  quality: ChapterQualityCheck;
};
