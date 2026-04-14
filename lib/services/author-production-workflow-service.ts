import type { WorkflowCheckpoint, WorkflowRunSummary } from "@/lib/domain/author-voice-humanization";

export function isoNow(): string {
  return new Date().toISOString();
}

export function createWorkflowRunSummary(seed: {
  sceneId?: string;
  chapterId?: string;
  bookId?: string;
  epicId?: string;
}): WorkflowRunSummary {
  return {
    contractVersion: "1",
    ...seed,
    checkpoints: [],
    ok: true,
    notes: [],
  };
}

export function pushCheckpoint(
  summary: WorkflowRunSummary,
  step: WorkflowCheckpoint["step"],
  detail?: string
): WorkflowRunSummary {
  return {
    ...summary,
    checkpoints: [
      ...summary.checkpoints,
      { step, completedAtIso: isoNow(), summary: detail },
    ],
  };
}

export function failWorkflow(summary: WorkflowRunSummary, note: string): WorkflowRunSummary {
  return { ...summary, ok: false, notes: [...summary.notes, note] };
}
