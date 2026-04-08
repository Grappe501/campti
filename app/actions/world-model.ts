"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fragmentLinkCreateSchema, fragmentLinkDeleteSchema } from "@/lib/fragment-validation";
import type { EnneagramType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ENNEAGRAM_TYPE_VALUES } from "@/lib/scene-soul-validation";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
}

function strNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function intNull(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s.length) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function participantsFromTextarea(v: FormDataEntryValue | null): string[] {
  const raw = typeof v === "string" ? v : "";
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

const PROFILE_FIELDS = [
  "worldview",
  "coreBeliefs",
  "fears",
  "desires",
  "internalConflicts",
  "socialPosition",
  "educationLevel",
  "religiousContext",
  "emotionalBaseline",
  "behavioralPatterns",
  "speechPatterns",
  "memoryBias",
  "sensoryBias",
  "moralFramework",
  "contradictions",
  "notes",
  "enneagramWing",
  "enneagramSource",
  "stressPattern",
  "growthPattern",
  "defensiveStyle",
  "coreLonging",
  "coreFear",
  "attentionBias",
  "relationalStyle",
  "conflictStyle",
  "attachmentPattern",
  "shameTrigger",
  "angerPattern",
  "griefPattern",
  "controlPattern",
  "notesOnTypeUse",
] as const;

const SETTING_FIELDS = [
  "physicalDescription",
  "environmentType",
  "climateDescription",
  "typicalWeather",
  "sounds",
  "smells",
  "textures",
  "lightingConditions",
  "dominantActivities",
  "socialRules",
  "classDynamics",
  "racialDynamics",
  "religiousPresence",
  "economicContext",
  "materialsPresent",
  "notes",
] as const;

export async function upsertCharacterProfileAction(formData: FormData) {
  const personId = str(formData.get("personId"));
  if (!personId) redirect("/admin/people?error=validation");

  const data: Record<string, string | number | null | undefined> = {};
  for (const k of PROFILE_FIELDS) {
    data[k] = strNull(formData.get(k));
  }

  const etEntry = formData.get("enneagramType");
  const etRaw = typeof etEntry === "string" ? etEntry.trim() : "";
  const enneagramType: EnneagramType | null =
    etRaw === "" || etRaw === "__none__" || !(ENNEAGRAM_TYPE_VALUES as readonly string[]).includes(etRaw)
      ? null
      : (etRaw as EnneagramType);

  const ecRaw = strNull(formData.get("enneagramConfidence"));
  let enneagramConfidence: number | null = null;
  if (ecRaw != null && ecRaw !== "") {
    const n = Number.parseInt(ecRaw, 10);
    if (Number.isFinite(n)) enneagramConfidence = Math.min(5, Math.max(1, n));
  }

  try {
    await prisma.characterProfile.upsert({
      where: { personId },
      create: {
        personId,
        ...data,
        enneagramType,
        enneagramConfidence,
      },
      update: {
        ...data,
        enneagramType,
        enneagramConfidence,
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  revalidatePath(`/admin/people/${personId}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/characters/${personId}/mind?saved=1`);
}

export async function addCharacterMemoryAction(formData: FormData) {
  const personId = str(formData.get("personId"));
  if (!personId) redirect("/admin/people?error=validation");

  const description = strNull(formData.get("description"));
  if (!description) redirect(`/admin/characters/${personId}/mind?error=validation`);

  try {
    await prisma.characterMemory.create({
      data: {
        personId,
        description,
        fragmentId: str(formData.get("fragmentId")) ?? null,
        emotionalWeight: intNull(formData.get("emotionalWeight")),
        timePeriod: strNull(formData.get("timePeriod")),
        reliability: strNull(formData.get("reliability")),
        notes: strNull(formData.get("notes")),
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  revalidatePath("/admin/brain");
  redirect(`/admin/characters/${personId}/mind?saved=memory`);
}

export async function deleteCharacterMemoryAction(formData: FormData) {
  const id = str(formData.get("id"));
  const personId = str(formData.get("personId"));
  if (!id || !personId) redirect("/admin/people?error=validation");

  try {
    await prisma.characterMemory.delete({ where: { id } });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=del`);
}

export async function addCharacterStateAction(formData: FormData) {
  const personId = str(formData.get("personId"));
  if (!personId) redirect("/admin/people?error=validation");

  try {
    await prisma.characterState.create({
      data: {
        personId,
        sceneId: str(formData.get("sceneId")) ?? null,
        emotionalState: strNull(formData.get("emotionalState")),
        motivation: strNull(formData.get("motivation")),
        fearState: strNull(formData.get("fearState")),
        knowledgeState: strNull(formData.get("knowledgeState")),
        physicalState: strNull(formData.get("physicalState")),
        socialConstraint: strNull(formData.get("socialConstraint")),
        notes: strNull(formData.get("notes")),
      },
    });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=state`);
}

export async function deleteCharacterStateAction(formData: FormData) {
  const id = str(formData.get("id"));
  const personId = str(formData.get("personId"));
  if (!id || !personId) redirect("/admin/people?error=validation");

  try {
    await prisma.characterState.delete({ where: { id } });
  } catch {
    redirect(`/admin/characters/${personId}/mind?error=db`);
  }

  revalidatePath(`/admin/characters/${personId}/mind`);
  redirect(`/admin/characters/${personId}/mind?saved=del`);
}

export async function upsertSettingProfileAction(formData: FormData) {
  const placeId = str(formData.get("placeId"));
  if (!placeId) redirect("/admin/places?error=validation");

  const data: Record<string, string | null> = {};
  for (const k of SETTING_FIELDS) {
    data[k] = strNull(formData.get(k));
  }

  try {
    await prisma.settingProfile.upsert({
      where: { placeId },
      create: { placeId, ...data },
      update: data,
    });
  } catch {
    redirect(`/admin/places/${placeId}/environment?error=db`);
  }

  revalidatePath(`/admin/places/${placeId}/environment`);
  revalidatePath(`/admin/places/${placeId}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/places/${placeId}/environment?saved=1`);
}

export async function addSettingStateAction(formData: FormData) {
  const placeId = str(formData.get("placeId"));
  if (!placeId) redirect("/admin/places?error=validation");

  try {
    await prisma.settingState.create({
      data: {
        placeId,
        timePeriod: strNull(formData.get("timePeriod")),
        season: strNull(formData.get("season")),
        weather: strNull(formData.get("weather")),
        populationType: strNull(formData.get("populationType")),
        activityLevel: strNull(formData.get("activityLevel")),
        notableConditions: strNull(formData.get("notableConditions")),
        notes: strNull(formData.get("notes")),
      },
    });
  } catch {
    redirect(`/admin/places/${placeId}/environment?error=db`);
  }

  revalidatePath(`/admin/places/${placeId}/environment`);
  revalidatePath("/admin/brain");
  redirect(`/admin/places/${placeId}/environment?saved=state`);
}

export async function deleteSettingStateAction(formData: FormData) {
  const id = str(formData.get("id"));
  const placeId = str(formData.get("placeId"));
  if (!id || !placeId) redirect("/admin/places?error=validation");

  try {
    await prisma.settingState.delete({ where: { id } });
  } catch {
    redirect(`/admin/places/${placeId}/environment?error=db`);
  }

  revalidatePath(`/admin/places/${placeId}/environment`);
  redirect(`/admin/places/${placeId}/environment?saved=del`);
}

export async function createMetaSceneAction(formData: FormData) {
  const title = strNull(formData.get("title"));
  const placeId = str(formData.get("placeId"));
  const povPersonId = str(formData.get("povPersonId"));
  if (!title || !placeId || !povPersonId) {
    redirect("/admin/meta-scenes?error=validation");
  }

  const sceneId = str(formData.get("sceneId"));

  try {
    const row = await prisma.metaScene.create({
      data: {
        title,
        placeId,
        povPersonId,
        sceneId: sceneId ?? null,
        timePeriod: strNull(formData.get("timePeriod")),
        dateEstimate: strNull(formData.get("dateEstimate")),
        participants: participantsFromTextarea(formData.get("participants")),
        environmentDescription: strNull(formData.get("environmentDescription")),
        sensoryField: strNull(formData.get("sensoryField")),
        historicalConstraints: strNull(formData.get("historicalConstraints")),
        socialConstraints: strNull(formData.get("socialConstraints")),
        characterStatesSummary: strNull(formData.get("characterStatesSummary")),
        emotionalVoltage: strNull(formData.get("emotionalVoltage")),
        centralConflict: strNull(formData.get("centralConflict")),
        symbolicElements: strNull(formData.get("symbolicElements")),
        narrativePurpose: strNull(formData.get("narrativePurpose")),
        continuityDependencies: strNull(formData.get("continuityDependencies")),
        sourceSupportLevel: strNull(formData.get("sourceSupportLevel")),
        notes: strNull(formData.get("notes")),
      },
    });
    revalidatePath("/admin/meta-scenes");
    revalidatePath(`/admin/meta-scenes/${row.id}/view`);
    revalidatePath(`/admin/meta-scenes/${row.id}/compose`);
    revalidatePath("/admin/brain");
    redirect(`/admin/meta-scenes/${row.id}?saved=1`);
  } catch {
    redirect("/admin/meta-scenes?error=db");
  }
}

export async function updateMetaSceneAction(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) redirect("/admin/meta-scenes?error=validation");

  const title = strNull(formData.get("title"));
  const placeId = str(formData.get("placeId"));
  const povPersonId = str(formData.get("povPersonId"));
  if (!title || !placeId || !povPersonId) {
    redirect(`/admin/meta-scenes/${id}?error=validation`);
  }

  const sceneId = str(formData.get("sceneId"));

  try {
    await prisma.metaScene.update({
      where: { id },
      data: {
        title,
        placeId,
        povPersonId,
        sceneId: sceneId ?? null,
        timePeriod: strNull(formData.get("timePeriod")),
        dateEstimate: strNull(formData.get("dateEstimate")),
        participants: participantsFromTextarea(formData.get("participants")),
        environmentDescription: strNull(formData.get("environmentDescription")),
        sensoryField: strNull(formData.get("sensoryField")),
        historicalConstraints: strNull(formData.get("historicalConstraints")),
        socialConstraints: strNull(formData.get("socialConstraints")),
        characterStatesSummary: strNull(formData.get("characterStatesSummary")),
        emotionalVoltage: strNull(formData.get("emotionalVoltage")),
        centralConflict: strNull(formData.get("centralConflict")),
        symbolicElements: strNull(formData.get("symbolicElements")),
        narrativePurpose: strNull(formData.get("narrativePurpose")),
        continuityDependencies: strNull(formData.get("continuityDependencies")),
        sourceSupportLevel: strNull(formData.get("sourceSupportLevel")),
        notes: strNull(formData.get("notes")),
      },
    });
  } catch {
    redirect(`/admin/meta-scenes/${id}?error=db`);
  }

  revalidatePath(`/admin/meta-scenes/${id}`);
  revalidatePath(`/admin/meta-scenes/${id}/view`);
  revalidatePath(`/admin/meta-scenes/${id}/compose`);
  revalidatePath("/admin/meta-scenes");
  revalidatePath("/admin/brain");
  redirect(`/admin/meta-scenes/${id}?saved=1`);
}

const composeRevalidate = (metaSceneId: string) => {
  revalidatePath(`/admin/meta-scenes/${metaSceneId}/compose`);
  revalidatePath(`/admin/meta-scenes/${metaSceneId}`);
  revalidatePath(`/admin/meta-scenes/${metaSceneId}/view`);
  revalidatePath("/admin/meta-scenes");
  revalidatePath("/admin/brain");
};

const sourceSupportLevelSchema = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.enum(["strong", "moderate", "weak", "speculative"]).nullable(),
);

function participantsFromString(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function optionalText(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

const updateMetaSceneCoreSchema = z.object({
  metaSceneId: z.string().min(1),
  title: z.string().min(1),
  placeId: z.string().min(1),
  povPersonId: z.string().min(1),
  participants: z.string().optional(),
  timePeriod: z.string().nullable().optional(),
  dateEstimate: z.string().nullable().optional(),
  sceneId: z.string().nullable().optional(),
});

export async function updateMetaSceneCoreAction(formData: FormData) {
  const parsed = updateMetaSceneCoreSchema.safeParse({
    metaSceneId: formData.get("metaSceneId"),
    title: formData.get("title"),
    placeId: formData.get("placeId"),
    povPersonId: formData.get("povPersonId"),
    participants: formData.get("participants") ?? undefined,
    timePeriod: formData.get("timePeriod"),
    dateEstimate: formData.get("dateEstimate"),
    sceneId: formData.get("sceneId"),
  });
  if (!parsed.success) {
    const id = String(formData.get("metaSceneId") ?? "");
    redirect(id ? `/admin/meta-scenes/${id}/compose?error=validation` : "/admin/meta-scenes?error=validation");
  }
  const d = parsed.data;
  const sceneIdRaw = typeof d.sceneId === "string" ? d.sceneId.trim() : "";
  try {
    await prisma.metaScene.update({
      where: { id: d.metaSceneId },
      data: {
        title: d.title,
        placeId: d.placeId,
        povPersonId: d.povPersonId,
        participants: participantsFromString(d.participants),
        timePeriod: optionalText(d.timePeriod),
        dateEstimate: optionalText(d.dateEstimate),
        sceneId: sceneIdRaw.length ? sceneIdRaw : null,
      },
    });
  } catch {
    redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?error=db`);
  }
  composeRevalidate(d.metaSceneId);
  redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?saved=core`);
}

const updateMetaSceneContextSchema = z.object({
  metaSceneId: z.string().min(1),
  historicalConstraints: z.string().nullable().optional(),
  socialConstraints: z.string().nullable().optional(),
  emotionalVoltage: z.string().nullable().optional(),
  centralConflict: z.string().nullable().optional(),
  characterStatesSummary: z.string().nullable().optional(),
  symbolicElements: z.string().nullable().optional(),
  environmentDescription: z.string().nullable().optional(),
  sensoryField: z.string().nullable().optional(),
  narrativePurpose: z.string().nullable().optional(),
  continuityDependencies: z.string().nullable().optional(),
  sourceSupportLevel: sourceSupportLevelSchema,
  notes: z.string().nullable().optional(),
});

export async function updateMetaSceneContextAction(formData: FormData) {
  const parsed = updateMetaSceneContextSchema.safeParse({
    metaSceneId: formData.get("metaSceneId"),
    historicalConstraints: formData.get("historicalConstraints"),
    socialConstraints: formData.get("socialConstraints"),
    emotionalVoltage: formData.get("emotionalVoltage"),
    centralConflict: formData.get("centralConflict"),
    characterStatesSummary: formData.get("characterStatesSummary"),
    symbolicElements: formData.get("symbolicElements"),
    environmentDescription: formData.get("environmentDescription"),
    sensoryField: formData.get("sensoryField"),
    narrativePurpose: formData.get("narrativePurpose"),
    continuityDependencies: formData.get("continuityDependencies"),
    sourceSupportLevel: formData.get("sourceSupportLevel"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    const id = String(formData.get("metaSceneId") ?? "");
    redirect(id ? `/admin/meta-scenes/${id}/compose?error=validation` : "/admin/meta-scenes?error=validation");
  }
  const d = parsed.data;
  try {
    await prisma.metaScene.update({
      where: { id: d.metaSceneId },
      data: {
        historicalConstraints: optionalText(d.historicalConstraints),
        socialConstraints: optionalText(d.socialConstraints),
        emotionalVoltage: optionalText(d.emotionalVoltage),
        centralConflict: optionalText(d.centralConflict),
        characterStatesSummary: optionalText(d.characterStatesSummary),
        symbolicElements: optionalText(d.symbolicElements),
        environmentDescription: optionalText(d.environmentDescription),
        sensoryField: optionalText(d.sensoryField),
        narrativePurpose: optionalText(d.narrativePurpose),
        continuityDependencies: optionalText(d.continuityDependencies),
        sourceSupportLevel: d.sourceSupportLevel,
        notes: optionalText(d.notes),
      },
    });
  } catch {
    redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?error=db`);
  }
  composeRevalidate(d.metaSceneId);
  redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?saved=context`);
}

const setCharacterStateForSceneSchema = z.object({
  metaSceneId: z.string().min(1),
  characterStateId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().min(1).optional(),
  ),
  emotionalState: z.string().nullable().optional(),
  motivation: z.string().nullable().optional(),
  fearState: z.string().nullable().optional(),
  knowledgeState: z.string().nullable().optional(),
  physicalState: z.string().nullable().optional(),
  socialConstraint: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function setCharacterStateForSceneAction(formData: FormData) {
  const parsed = setCharacterStateForSceneSchema.safeParse({
    metaSceneId: formData.get("metaSceneId"),
    characterStateId: formData.get("characterStateId") ?? undefined,
    emotionalState: formData.get("emotionalState"),
    motivation: formData.get("motivation"),
    fearState: formData.get("fearState"),
    knowledgeState: formData.get("knowledgeState"),
    physicalState: formData.get("physicalState"),
    socialConstraint: formData.get("socialConstraint"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    const id = String(formData.get("metaSceneId") ?? "");
    redirect(id ? `/admin/meta-scenes/${id}/compose?error=validation` : "/admin/meta-scenes?error=validation");
  }
  const d = parsed.data;
  const meta = await prisma.metaScene.findUnique({
    where: { id: d.metaSceneId },
    select: { povPersonId: true, sceneId: true },
  });
  if (!meta) redirect(`/admin/meta-scenes?error=not_found`);

  const sceneId = meta.sceneId ?? null;
  const data = {
    emotionalState: optionalText(d.emotionalState),
    motivation: optionalText(d.motivation),
    fearState: optionalText(d.fearState),
    knowledgeState: optionalText(d.knowledgeState),
    physicalState: optionalText(d.physicalState),
    socialConstraint: optionalText(d.socialConstraint),
    notes: optionalText(d.notes),
  };

  try {
    if (d.characterStateId?.trim()) {
      const existing = await prisma.characterState.findUnique({
        where: { id: d.characterStateId.trim() },
      });
      if (!existing || existing.personId !== meta.povPersonId) {
        redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?error=validation`);
      }
      await prisma.characterState.update({
        where: { id: existing.id },
        data: {
          ...data,
          sceneId: sceneId ?? existing.sceneId,
        },
      });
    } else {
      await prisma.characterState.create({
        data: {
          personId: meta.povPersonId,
          sceneId,
          ...data,
        },
      });
    }
  } catch {
    redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?error=db`);
  }

  revalidatePath(`/admin/characters/${meta.povPersonId}/mind`);
  composeRevalidate(d.metaSceneId);
  redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?saved=charstate`);
}

const setSettingStateForSceneSchema = z.object({
  metaSceneId: z.string().min(1),
  settingStateId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().min(1).optional(),
  ),
  timePeriod: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  weather: z.string().nullable().optional(),
  populationType: z.string().nullable().optional(),
  activityLevel: z.string().nullable().optional(),
  notableConditions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function setSettingStateForSceneAction(formData: FormData) {
  const parsed = setSettingStateForSceneSchema.safeParse({
    metaSceneId: formData.get("metaSceneId"),
    settingStateId: formData.get("settingStateId") ?? undefined,
    timePeriod: formData.get("timePeriod"),
    season: formData.get("season"),
    weather: formData.get("weather"),
    populationType: formData.get("populationType"),
    activityLevel: formData.get("activityLevel"),
    notableConditions: formData.get("notableConditions"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    const id = String(formData.get("metaSceneId") ?? "");
    redirect(id ? `/admin/meta-scenes/${id}/compose?error=validation` : "/admin/meta-scenes?error=validation");
  }
  const d = parsed.data;
  const meta = await prisma.metaScene.findUnique({
    where: { id: d.metaSceneId },
    select: { placeId: true },
  });
  if (!meta) redirect(`/admin/meta-scenes?error=not_found`);

  const row = {
    timePeriod: optionalText(d.timePeriod),
    season: optionalText(d.season),
    weather: optionalText(d.weather),
    populationType: optionalText(d.populationType),
    activityLevel: optionalText(d.activityLevel),
    notableConditions: optionalText(d.notableConditions),
    notes: optionalText(d.notes),
  };

  try {
    if (d.settingStateId?.trim()) {
      const existing = await prisma.settingState.findUnique({
        where: { id: d.settingStateId.trim() },
      });
      if (!existing || existing.placeId !== meta.placeId) {
        redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?error=validation`);
      }
      await prisma.settingState.update({
        where: { id: existing.id },
        data: row,
      });
    } else {
      await prisma.settingState.create({
        data: {
          placeId: meta.placeId,
          ...row,
        },
      });
    }
  } catch {
    redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?error=db`);
  }

  revalidatePath(`/admin/places/${meta.placeId}/environment`);
  composeRevalidate(d.metaSceneId);
  redirect(`/admin/meta-scenes/${d.metaSceneId}/compose?saved=settingstate`);
}

export async function linkFragmentToMetaSceneAction(formData: FormData) {
  const metaSceneId = String(formData.get("metaSceneId") ?? "");
  const parsed = fragmentLinkCreateSchema.safeParse({
    fragmentId: formData.get("fragmentId"),
    linkedType: formData.get("linkedType"),
    linkedId: formData.get("linkedId"),
    linkRole: formData.get("linkRole") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success || !metaSceneId) {
    redirect(metaSceneId ? `/admin/meta-scenes/${metaSceneId}/compose?error=validation` : "/admin/meta-scenes?error=validation");
  }
  if (parsed.data.linkedType !== "meta_scene" || parsed.data.linkedId !== metaSceneId) {
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=validation`);
  }
  const d = parsed.data;
  try {
    const dup = await prisma.fragmentLink.findFirst({
      where: {
        fragmentId: d.fragmentId,
        linkedType: "meta_scene",
        linkedId: metaSceneId,
      },
    });
    if (!dup) {
      await prisma.fragmentLink.create({
        data: {
          fragmentId: d.fragmentId,
          linkedType: "meta_scene",
          linkedId: metaSceneId,
          linkRole: d.linkRole ?? null,
          notes: d.notes?.length ? d.notes : null,
        },
      });
    }
    await prisma.fragment.update({
      where: { id: d.fragmentId },
      data: { placementStatus: "linked" },
    });
  } catch {
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);
  }
  composeRevalidate(metaSceneId);
  revalidatePath(`/admin/fragments/${d.fragmentId}`);
  redirect(`/admin/meta-scenes/${metaSceneId}/compose?saved=link`);
}

export async function unlinkFragmentFromMetaSceneAction(formData: FormData) {
  const metaSceneId = String(formData.get("metaSceneId") ?? "");
  const parsed = fragmentLinkDeleteSchema.safeParse({
    linkId: formData.get("linkId"),
    fragmentId: formData.get("fragmentId"),
  });
  if (!parsed.success || !metaSceneId) {
    redirect(metaSceneId ? `/admin/meta-scenes/${metaSceneId}/compose?error=validation` : "/admin/meta-scenes?error=validation");
  }
  try {
    const link = await prisma.fragmentLink.findUnique({
      where: { id: parsed.data.linkId },
    });
    if (!link || link.linkedType !== "meta_scene" || link.linkedId !== metaSceneId) {
      redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=validation`);
    }
    await prisma.fragmentLink.delete({ where: { id: parsed.data.linkId } });
  } catch {
    redirect(`/admin/meta-scenes/${metaSceneId}/compose?error=db`);
  }
  composeRevalidate(metaSceneId);
  revalidatePath(`/admin/fragments/${parsed.data.fragmentId}`);
  redirect(`/admin/meta-scenes/${metaSceneId}/compose?saved=unlink`);
}

