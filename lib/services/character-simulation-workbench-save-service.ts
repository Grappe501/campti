import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { CharacterMindProfile } from "@/lib/domain/character-mind";
import { CharacterMindProfileSchema } from "@/lib/domain/character-mind";
import type { CharacterVoiceProfile } from "@/lib/domain/character-voice";
import { CharacterVoiceProfileSchema } from "@/lib/domain/character-voice";
import type { CharacterSimulationWorkbenchViewModel } from "@/lib/domain/character-simulation-workbench";
import {
  CharacterSimulationWorkbenchMetaSchema,
  mergeValidationResults,
  parseWorkbenchMeta,
  validateAuthorMindPartialSemantic,
  validateAuthorMindPartialShape,
  validateAuthorVoicePartialSemantic,
  validateAuthorVoicePartialShape,
} from "@/lib/domain/character-simulation-workbench-validation";
import { prisma } from "@/lib/prisma";
import { appendCharacterSimulationAuditLog } from "@/lib/services/character-simulation-workbench-audit-service";
import { loadCharacterSimulationWorkbenchViewModel } from "@/lib/services/character-simulation-workbench-load-service";

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export type SaveCharacterSimulationWorkbenchResult =
  | { ok: true; view: CharacterSimulationWorkbenchViewModel }
  | { ok: false; code: "validation" | "migration_required" | "not_found"; message: string; view?: CharacterSimulationWorkbenchViewModel };

/**
 * Normalizes validated author partials onto `CharacterSimulationAuthorBundle` (canonical persistence path).
 */
export async function saveCharacterSimulationWorkbenchAuthorProfile(input: {
  personId: string;
  mindPartial: unknown;
  voicePartial: unknown;
  authorNotes: unknown;
}): Promise<SaveCharacterSimulationWorkbenchResult> {
  const person = await prisma.person.findUnique({ where: { id: input.personId }, select: { id: true, name: true } });
  if (!person) return { ok: false, code: "not_found", message: "Person not found." };

  const notesParsed = z.array(z.string().max(2000)).max(200).safeParse(input.authorNotes ?? []);
  const authorNotes = notesParsed.success ? notesParsed.data : [];

  const mindIn = (input.mindPartial ?? {}) as Record<string, unknown>;
  const voiceIn = (input.voicePartial ?? {}) as Record<string, unknown>;
  const mindWithId = { ...mindIn, characterId: person.id } as Partial<CharacterMindProfile>;
  const voiceWithId = { ...voiceIn, characterId: person.id } as Partial<CharacterVoiceProfile>;

  const shapeMind = validateAuthorMindPartialShape(mindWithId);
  const shapeVoice = validateAuthorVoicePartialShape(voiceWithId);
  const semMind = validateAuthorMindPartialSemantic(mindWithId);
  const semVoice = validateAuthorVoicePartialSemantic(voiceWithId);
  const validation = mergeValidationResults(shapeMind, shapeVoice, semMind, semVoice);
  if (!validation.ok) {
    const view = await loadCharacterSimulationWorkbenchViewModel(person.id);
    return {
      ok: false,
      code: "validation",
      message: validation.issues.map((i) => `${i.path}: ${i.message}`).join("; "),
      view,
    };
  }

  const existing = await prisma.characterSimulationAuthorBundle.findUnique({ where: { personId: person.id } });
  const mergedMeta = { ...parseWorkbenchMeta(existing?.workbenchMetaJson ?? {}), authorNotes };
  const metaParsed = CharacterSimulationWorkbenchMetaSchema.safeParse(mergedMeta);
  const workbenchMetaJson = metaParsed.success ? metaParsed.data : { authorNotes };

  const incomingMind = stripUndefined(mindWithId as Record<string, unknown>);
  const incomingVoice = stripUndefined(voiceWithId as Record<string, unknown>);

  const existingMindParsed = CharacterMindProfileSchema.partial().safeParse(existing?.simulationMindProfileJson ?? {});
  const existingVoiceParsed = CharacterVoiceProfileSchema.partial().safeParse(existing?.simulationVoiceProfileJson ?? {});
  const existingMind = existingMindParsed.success ? existingMindParsed.data : {};
  const existingVoice = existingVoiceParsed.success ? existingVoiceParsed.data : {};

  const mindClean = stripUndefined({ ...existingMind, ...incomingMind } as Record<string, unknown>);
  const voiceClean = stripUndefined({ ...existingVoice, ...incomingVoice } as Record<string, unknown>);

  const mergedMindForValidation = { ...mindClean, characterId: person.id } as Partial<CharacterMindProfile>;
  const mergedVoiceForValidation = { ...voiceClean, characterId: person.id } as Partial<CharacterVoiceProfile>;
  const postMergeValidation = mergeValidationResults(
    validateAuthorMindPartialShape(mergedMindForValidation),
    validateAuthorVoicePartialShape(mergedVoiceForValidation),
    validateAuthorMindPartialSemantic(mergedMindForValidation),
    validateAuthorVoicePartialSemantic(mergedVoiceForValidation),
  );
  if (!postMergeValidation.ok) {
    const view = await loadCharacterSimulationWorkbenchViewModel(person.id);
    return {
      ok: false,
      code: "validation",
      message: postMergeValidation.issues.map((i) => `${i.path}: ${i.message}`).join("; "),
      view,
    };
  }

  const beforeSnapshot = {
    mind: existing?.simulationMindProfileJson ?? null,
    voice: existing?.simulationVoiceProfileJson ?? null,
    meta: existing?.workbenchMetaJson ?? null,
  };

  try {
    await prisma.characterSimulationAuthorBundle.upsert({
      where: { personId: person.id },
      create: {
        personId: person.id,
        simulationMindProfileJson: mindClean as Prisma.InputJsonValue,
        simulationVoiceProfileJson: voiceClean as Prisma.InputJsonValue,
        workbenchMetaJson: workbenchMetaJson as Prisma.InputJsonValue,
      },
      update: {
        simulationMindProfileJson: mindClean as Prisma.InputJsonValue,
        simulationVoiceProfileJson: voiceClean as Prisma.InputJsonValue,
        workbenchMetaJson: workbenchMetaJson as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.message.includes("workbenchMetaJson"))) {
      return { ok: false, code: "migration_required", message: "Database migration required for CharacterSimulationAuthorBundle columns." };
    }
    throw e;
  }

  await appendCharacterSimulationAuditLog({
    personId: person.id,
    action: "save_author_bundle",
    summary: `Updated author simulation partials for ${person.name}`,
    beforeJson: beforeSnapshot,
    afterJson: { mind: mindClean, voice: voiceClean, meta: workbenchMetaJson },
  });

  const view = await loadCharacterSimulationWorkbenchViewModel(person.id);
  return { ok: true, view };
}

/**
 * Records operator acknowledgement for advisory conflicts (stored in `workbenchMetaJson.acceptedConflictIds`).
 * Does not clear blocking contradictions.
 */
export async function acknowledgeCharacterSimulationWorkbenchConflicts(input: {
  personId: string;
  conflictIds: string[];
  note?: string;
}): Promise<SaveCharacterSimulationWorkbenchResult> {
  const person = await prisma.person.findUnique({ where: { id: input.personId }, select: { id: true, name: true } });
  if (!person) return { ok: false, code: "not_found", message: "Person not found." };

  const existing = await prisma.characterSimulationAuthorBundle.findUnique({ where: { personId: person.id } });
  const base = parseWorkbenchMeta(existing?.workbenchMetaJson ?? {});
  const merged = {
    ...base,
    acceptedConflictIds: Array.from(new Set([...(base.acceptedConflictIds ?? []), ...input.conflictIds])),
  };
  const metaParsed = CharacterSimulationWorkbenchMetaSchema.safeParse(merged);
  if (!metaParsed.success) {
    return { ok: false, code: "validation", message: "Invalid workbench metadata." };
  }

  try {
    await prisma.characterSimulationAuthorBundle.upsert({
      where: { personId: person.id },
      create: {
        personId: person.id,
        workbenchMetaJson: metaParsed.data as Prisma.InputJsonValue,
      },
      update: {
        workbenchMetaJson: metaParsed.data as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
      return { ok: false, code: "migration_required", message: "Database migration required." };
    }
    throw e;
  }

  await appendCharacterSimulationAuditLog({
    personId: person.id,
    action: "resolve_conflict",
    summary: `Acknowledged ${input.conflictIds.length} workbench conflict id(s) for ${person.name}`,
    actorNote: input.note ?? null,
    afterJson: { acceptedConflictIds: metaParsed.data.acceptedConflictIds },
  });

  const view = await loadCharacterSimulationWorkbenchViewModel(person.id);
  return { ok: true, view };
}
