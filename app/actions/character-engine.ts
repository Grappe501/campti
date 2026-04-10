"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EnneagramType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assignWorldStateToCharacterStateSchema,
  characterConstraintCreateSchema,
  characterProfileUpsertFullSchema,
  characterStateCreateSchema,
  characterStateUpdateSchema,
  characterTriggerCreateSchema,
  choiceProfileUpsertSchema,
  parseProfileJsonField,
  perceptionProfileUpsertSchema,
  updateCharacterWorldContextSchema,
  voiceProfileUpsertSchema,
} from "@/lib/character-schemas";
import type { z } from "zod";
import { ENNEAGRAM_TYPE_VALUES } from "@/lib/scene-soul-validation";

function formStringRecord(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v;
  }
  return o;
}

type ProfileUpsert = z.infer<typeof characterProfileUpsertFullSchema>;

function buildCharacterProfileDbPayload(p: ProfileUpsert) {
  const etRaw = p.enneagramType?.trim() ?? "";
  const enneagramType: EnneagramType | null =
    etRaw === "" || etRaw === "__none__" || !(ENNEAGRAM_TYPE_VALUES as readonly string[]).includes(etRaw)
      ? null
      : (etRaw as EnneagramType);

  return {
    worldview: p.worldview ?? null,
    coreBeliefs: parseProfileJsonField(p.coreBeliefsJson ?? undefined),
    misbeliefs: parseProfileJsonField(p.misbeliefsJson ?? undefined),
    fears: parseProfileJsonField(p.fearsJson ?? undefined),
    desires: parseProfileJsonField(p.desiresJson ?? undefined),
    internalConflicts: parseProfileJsonField(p.internalConflictsJson ?? undefined),
    theologyFramework: p.theologyFramework ?? null,
    roleArchetype: p.roleArchetype ?? null,
    narrativeFunction: p.narrativeFunction ?? null,
    socialPosition: p.socialPosition ?? null,
    educationLevel: p.educationLevel ?? null,
    religiousContext: p.religiousContext ?? null,
    emotionalBaseline: p.emotionalBaseline ?? null,
    behavioralPatterns: p.behavioralPatterns ?? null,
    speechPatterns: p.speechPatterns ?? null,
    memoryBias: p.memoryBias ?? null,
    sensoryBias: p.sensoryBias ?? null,
    moralFramework: p.moralFramework ?? null,
    contradictions: p.contradictions ?? null,
    notes: p.notes ?? null,
    recordType: p.recordType,
    visibility: p.visibility,
    certainty: p.certainty ?? null,
    enneagramType,
    enneagramWing: p.enneagramWing ?? null,
    enneagramConfidence: p.enneagramConfidence ?? null,
    enneagramSource: p.enneagramSource ?? null,
    stressPattern: p.stressPattern ?? null,
    growthPattern: p.growthPattern ?? null,
    defensiveStyle: p.defensiveStyle ?? null,
    coreLonging: p.coreLonging ?? null,
    coreFear: p.coreFear ?? null,
    attentionBias: p.attentionBias ?? null,
    relationalStyle: p.relationalStyle ?? null,
    conflictStyle: p.conflictStyle ?? null,
    attachmentPattern: p.attachmentPattern ?? null,
    shameTrigger: p.shameTrigger ?? null,
    angerPattern: p.angerPattern ?? null,
    griefPattern: p.griefPattern ?? null,
    controlPattern: p.controlPattern ?? null,
    notesOnTypeUse: p.notesOnTypeUse ?? null,
  };
}

/** Create or replace CharacterProfile for a Person (Zod-validated). */
export async function upsertCharacterProfileAction(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterProfileUpsertFullSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const data = buildCharacterProfileDbPayload(parsed.data);

  try {
    await prisma.characterProfile.upsert({
      where: { personId },
      create: { personId, ...data },
      update: data,
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  revalidatePath(`/admin/people/${personId}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/characters/${personId}/mind?saved=1`);
}

export async function createCharacterProfile(formData: FormData) {
  return upsertCharacterProfileAction(formData);
}

export async function updateCharacterProfile(formData: FormData) {
  return upsertCharacterProfileAction(formData);
}

export async function addCharacterStateAction(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterStateCreateSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterState.create({
      data: {
        personId: d.personId,
        label: d.label ?? null,
        sceneId: d.sceneId ?? null,
        emotionalBaseline: d.emotionalBaseline ?? null,
        pressureLevel: d.pressureLevel ?? null,
        trustLevel: d.trustLevel ?? undefined,
        fearLevel: d.fearLevel ?? undefined,
        stabilityLevel: d.stabilityLevel ?? undefined,
        cognitiveLoad: d.cognitiveLoad ?? undefined,
        emotionalState: d.emotionalState ?? null,
        motivation: d.motivation ?? null,
        fearState: d.fearState ?? null,
        knowledgeState: d.knowledgeState ?? null,
        physicalState: d.physicalState ?? null,
        socialConstraint: d.socialConstraint ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
        worldStateId: d.worldStateId ?? null,
        environmentSnapshot: parseProfileJsonField(d.environmentSnapshotJson ?? undefined),
        powerContext: parseProfileJsonField(d.powerContextJson ?? undefined),
        economicContext: parseProfileJsonField(d.economicContextJson ?? undefined),
        socialContext: parseProfileJsonField(d.socialContextJson ?? undefined),
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=state`);
}

export async function updateCharacterState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterStateUpdateSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterState.update({
      where: { id: d.id },
      data: {
        label: d.label ?? null,
        sceneId: d.sceneId ?? null,
        emotionalBaseline: d.emotionalBaseline ?? null,
        pressureLevel: d.pressureLevel ?? null,
        trustLevel: d.trustLevel ?? undefined,
        fearLevel: d.fearLevel ?? undefined,
        stabilityLevel: d.stabilityLevel ?? undefined,
        cognitiveLoad: d.cognitiveLoad ?? undefined,
        emotionalState: d.emotionalState ?? null,
        motivation: d.motivation ?? null,
        fearState: d.fearState ?? null,
        knowledgeState: d.knowledgeState ?? null,
        physicalState: d.physicalState ?? null,
        socialConstraint: d.socialConstraint ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
        worldStateId: d.worldStateId ?? null,
        environmentSnapshot: parseProfileJsonField(d.environmentSnapshotJson ?? undefined),
        powerContext: parseProfileJsonField(d.powerContextJson ?? undefined),
        economicContext: parseProfileJsonField(d.economicContextJson ?? undefined),
        socialContext: parseProfileJsonField(d.socialContextJson ?? undefined),
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=state`);
}

export async function assignWorldStateToCharacterState(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = assignWorldStateToCharacterStateSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    const state = await prisma.characterState.findFirst({
      where: { personId: d.personId, label: d.stateLabel },
      orderBy: { updatedAt: "desc" },
    });
    if (!state) redirect(`/admin/characters/${personId}/mind?error=validation`);

    await prisma.characterState.update({
      where: { id: state.id },
      data: { worldStateId: d.worldStateId },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=world`);
}

export async function updateCharacterWorldContext(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = updateCharacterWorldContextSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    const state = await prisma.characterState.findFirst({
      where: { personId: d.personId, label: d.stateLabel },
      orderBy: { updatedAt: "desc" },
    });
    if (!state) redirect(`/admin/characters/${personId}/mind?error=validation`);

    const data: Record<string, ReturnType<typeof parseProfileJsonField>> = {};
    if ("environmentSnapshotJson" in raw) {
      data.environmentSnapshot = parseProfileJsonField(d.environmentSnapshotJson ?? undefined);
    }
    if ("powerContextJson" in raw) {
      data.powerContext = parseProfileJsonField(d.powerContextJson ?? undefined);
    }
    if ("economicContextJson" in raw) {
      data.economicContext = parseProfileJsonField(d.economicContextJson ?? undefined);
    }
    if ("socialContextJson" in raw) {
      data.socialContext = parseProfileJsonField(d.socialContextJson ?? undefined);
    }

    if (Object.keys(data).length === 0) {
      redirect(`/admin/characters/${personId}/mind?saved=worldctx`);
    }

    await prisma.characterState.update({
      where: { id: state.id },
      data,
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=worldctx`);
}

export async function deleteCharacterStateAction(formData: FormData) {
  const raw = formStringRecord(formData);
  const id = raw.id;
  const personId = raw.personId;
  if (!id || !personId) redirect("/admin/people?error=validation");

  try {
    await prisma.characterState.delete({ where: { id } });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=del`);
}

export async function createCharacterConstraint(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterConstraintCreateSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterConstraint.create({
      data: {
        personId: d.personId,
        type: d.type,
        description: d.description,
        isHardConstraint: d.isHardConstraint,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=constraint`);
}

export async function createCharacterTrigger(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = characterTriggerCreateSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterTrigger.create({
      data: {
        personId: d.personId,
        triggerType: d.triggerType,
        description: d.description,
        intensity: d.intensity,
        responsePattern: d.responsePattern ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=trigger`);
}

export async function createCharacterPerceptionProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = perceptionProfileUpsertSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterPerceptionProfile.upsert({
      where: { personId: d.personId },
      create: {
        personId: d.personId,
        sensoryBias: d.sensoryBias ?? null,
        attentionFocus: d.attentionFocus ?? null,
        blindSpots: parseProfileJsonField(d.blindSpotsJson ?? undefined),
        interpretationStyle: d.interpretationStyle ?? null,
        memoryReliability: d.memoryReliability ?? null,
        narrativePermissionKey: d.narrativePermissionKey ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
      update: {
        sensoryBias: d.sensoryBias ?? null,
        attentionFocus: d.attentionFocus ?? null,
        blindSpots: parseProfileJsonField(d.blindSpotsJson ?? undefined),
        interpretationStyle: d.interpretationStyle ?? null,
        memoryReliability: d.memoryReliability ?? null,
        narrativePermissionKey: d.narrativePermissionKey ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=perception`);
}

export async function createCharacterVoiceProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = voiceProfileUpsertSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterVoiceProfile.upsert({
      where: { personId: d.personId },
      create: {
        personId: d.personId,
        dictionLevel: d.dictionLevel ?? null,
        rhythmStyle: d.rhythmStyle ?? null,
        metaphorStyle: d.metaphorStyle ?? null,
        dialectNotes: d.dialectNotes ?? null,
        silencePatterns: d.silencePatterns ?? null,
        emotionalExpressionStyle: d.emotionalExpressionStyle ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
      update: {
        dictionLevel: d.dictionLevel ?? null,
        rhythmStyle: d.rhythmStyle ?? null,
        metaphorStyle: d.metaphorStyle ?? null,
        dialectNotes: d.dialectNotes ?? null,
        silencePatterns: d.silencePatterns ?? null,
        emotionalExpressionStyle: d.emotionalExpressionStyle ?? null,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=voice`);
}

export async function createCharacterChoiceProfile(formData: FormData) {
  const raw = formStringRecord(formData);
  const parsed = choiceProfileUpsertSchema.safeParse(raw);
  const personId = raw.personId;
  if (!personId || !parsed.success) redirect("/admin/people?error=validation");

  const d = parsed.data;
  try {
    await prisma.characterChoiceProfile.upsert({
      where: { personId: d.personId },
      create: {
        personId: d.personId,
        riskTolerance: d.riskTolerance ?? undefined,
        decisionSpeed: d.decisionSpeed ?? null,
        conflictStyle: d.conflictStyle ?? null,
        loyaltyPriority: parseProfileJsonField(d.loyaltyPriorityJson ?? undefined),
        selfPreservationBias: d.selfPreservationBias ?? undefined,
        moralRigidity: d.moralRigidity ?? undefined,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
      update: {
        riskTolerance: d.riskTolerance ?? undefined,
        decisionSpeed: d.decisionSpeed ?? null,
        conflictStyle: d.conflictStyle ?? null,
        loyaltyPriority: parseProfileJsonField(d.loyaltyPriorityJson ?? undefined),
        selfPreservationBias: d.selfPreservationBias ?? undefined,
        moralRigidity: d.moralRigidity ?? undefined,
        notes: d.notes ?? null,
        recordType: d.recordType,
        visibility: d.visibility,
        certainty: d.certainty ?? null,
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=choice`);
}
