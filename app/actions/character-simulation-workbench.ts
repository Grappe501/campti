"use server";

import { revalidatePath } from "next/cache";

import { CharacterSimulationPreviewRequestSchema } from "@/lib/domain/character-simulation-workbench-validation";
import type { CharacterSimulationWorkbenchViewModel } from "@/lib/domain/character-simulation-workbench";
import { buildCharacterSimulationPreview } from "@/lib/services/character-simulation-workbench-preview-service";
import { loadCharacterSimulationWorkbenchViewModel } from "@/lib/services/character-simulation-workbench-load-service";
import {
  acknowledgeCharacterSimulationWorkbenchConflicts,
  saveCharacterSimulationWorkbenchAuthorProfile,
  type SaveCharacterSimulationWorkbenchResult,
} from "@/lib/services/character-simulation-workbench-save-service";

// TODO(auth): Wire admin RBAC when a production identity model exists; today this follows the trusted admin surface pattern.

export async function loadCharacterSimulationWorkbenchAction(
  personId: string
): Promise<{ ok: true; view: CharacterSimulationWorkbenchViewModel } | { ok: false; message: string }> {
  try {
    const view = await loadCharacterSimulationWorkbenchViewModel(personId);
    return { ok: true, view };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function saveCharacterSimulationWorkbenchAction(input: {
  personId: string;
  mindPartial: unknown;
  voicePartial: unknown;
  authorNotes: unknown;
}): Promise<SaveCharacterSimulationWorkbenchResult> {
  const r = await saveCharacterSimulationWorkbenchAuthorProfile(input);
  if (r.ok) {
    revalidatePath(`/admin/people/${input.personId}/simulation-workbench`);
    revalidatePath(`/admin/people/${input.personId}`);
    revalidatePath("/admin/narrative");
  }
  return r;
}

export async function previewCharacterSimulationWorkbenchAction(input: {
  personId: string;
  request: unknown;
}): Promise<
  | { ok: true; view: CharacterSimulationWorkbenchViewModel; preview: CharacterSimulationWorkbenchViewModel["previewMetadata"]["lastPreview"] }
  | { ok: false; message: string }
> {
  const parsed = CharacterSimulationPreviewRequestSchema.safeParse(input.request);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const view = await loadCharacterSimulationWorkbenchViewModel(input.personId);
  const driftWarnings = view.conflicts.filter((c) => !c.acceptedByOperator).map((c) => `${c.severity}:${c.description}`);
  const mindKeys = Object.keys(view.authorEditable.mindPartial).length;
  const voiceKeys = Object.keys(view.authorEditable.voicePartial).length;
  const usesAuthorOverlay = mindKeys + voiceKeys > 0;
  const preview = buildCharacterSimulationPreview({
    request: parsed.data,
    mergedMind: view.merged.mind,
    mergedVoice: view.merged.voice,
    driftWarnings,
    usesAuthorOverlay,
  });
  return {
    ok: true,
    view: {
      ...view,
      previewMetadata: { ...view.previewMetadata, lastPreview: preview },
    },
    preview,
  };
}

export async function acknowledgeCharacterSimulationWorkbenchAction(input: {
  personId: string;
  conflictIds: string[];
  note?: string;
}): Promise<SaveCharacterSimulationWorkbenchResult> {
  const r = await acknowledgeCharacterSimulationWorkbenchConflicts({
    personId: input.personId,
    conflictIds: input.conflictIds,
    note: input.note,
  });
  if (r.ok) {
    revalidatePath(`/admin/people/${input.personId}/simulation-workbench`);
    revalidatePath("/admin/narrative");
  }
  return r;
}
