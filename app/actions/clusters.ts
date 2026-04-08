"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clusterCreateSchema,
  clusterUpdateSchema,
  linkFragmentToClusterSchema,
} from "@/lib/scene-intelligence-validation";

function parseFragmentIds(formData: FormData): string[] {
  const raw = formData.get("fragmentIdsJson");
  if (typeof raw !== "string") return [];
  try {
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string" && x.length > 0) : [];
  } catch {
    return [];
  }
}

function parseRoles(formData: FormData): Record<string, string> | undefined {
  const raw = formData.get("rolesJson");
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    const p = JSON.parse(raw) as unknown;
    return typeof p === "object" && p !== null && !Array.isArray(p) ? (p as Record<string, string>) : undefined;
  } catch {
    return undefined;
  }
}

export async function createClusterAction(formData: FormData) {
  const fragmentIds = parseFragmentIds(formData);
  const parsed = clusterCreateSchema.safeParse({
    title: formData.get("title"),
    clusterType: formData.get("clusterType"),
    summary: formData.get("summary") ?? undefined,
    emotionalTone: formData.get("emotionalTone") ?? undefined,
    dominantFunction: formData.get("dominantFunction") ?? undefined,
    confidence: formData.get("confidence"),
    notes: formData.get("notes") ?? undefined,
    chapterId: formData.get("chapterId") ?? undefined,
    sceneId: formData.get("sceneId") ?? undefined,
    metaSceneId: formData.get("metaSceneId") ?? undefined,
    personId: formData.get("personId") ?? undefined,
    placeId: formData.get("placeId") ?? undefined,
    symbolId: formData.get("symbolId") ?? undefined,
    fragmentIds,
    roles: parseRoles(formData),
  });

  if (!parsed.success) {
    redirect("/admin/clusters?error=validation");
  }
  const d = parsed.data;

  try {
    const cluster = await prisma.fragmentCluster.create({
      data: {
        title: d.title,
        clusterType: d.clusterType,
        summary: d.summary?.length ? d.summary : null,
        emotionalTone: d.emotionalTone?.length ? d.emotionalTone : null,
        dominantFunction: d.dominantFunction?.length ? d.dominantFunction : null,
        confidence: d.confidence ?? null,
        notes: d.notes?.length ? d.notes : null,
        chapterId: d.chapterId ?? null,
        sceneId: d.sceneId ?? null,
        metaSceneId: d.metaSceneId ?? null,
        personId: d.personId ?? null,
        placeId: d.placeId ?? null,
        symbolId: d.symbolId ?? null,
        fragmentLinks: {
          create: d.fragmentIds.map((fid) => ({
            fragmentId: fid,
            role: d.roles?.[fid] ?? "supporting",
            notes: null,
          })),
        },
      },
    });
    revalidatePath("/admin/clusters");
    revalidatePath("/admin/brain");
    redirect(`/admin/clusters/${cluster.id}?saved=1`);
  } catch {
    redirect("/admin/clusters?error=db");
  }
}

export async function updateClusterAction(formData: FormData) {
  const parsed = clusterUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") ?? undefined,
    clusterType: formData.get("clusterType") ?? undefined,
    summary: formData.get("summary") ?? undefined,
    emotionalTone: formData.get("emotionalTone") ?? undefined,
    dominantFunction: formData.get("dominantFunction") ?? undefined,
    confidence: formData.get("confidence"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    redirect("/admin/clusters?error=validation");
  }
  const { id, ...rest } = parsed.data;
  const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));

  try {
    await prisma.fragmentCluster.update({
      where: { id },
      data,
    });
  } catch {
    redirect(`/admin/clusters/${id}?error=db`);
  }
  revalidatePath("/admin/clusters");
  revalidatePath(`/admin/clusters/${id}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/clusters/${id}?saved=1`);
}

export async function linkFragmentToClusterAction(formData: FormData) {
  const parsed = linkFragmentToClusterSchema.safeParse({
    clusterId: formData.get("clusterId"),
    fragmentId: formData.get("fragmentId"),
    role: formData.get("role") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    redirect("/admin/clusters?error=validation");
  }
  const d = parsed.data;
  try {
    await prisma.fragmentClusterLink.create({
      data: {
        clusterId: d.clusterId,
        fragmentId: d.fragmentId,
        role: d.role ?? null,
        notes: d.notes?.length ? d.notes : null,
      },
    });
  } catch {
    redirect(`/admin/clusters/${d.clusterId}?error=db`);
  }
  revalidatePath(`/admin/clusters/${d.clusterId}`);
  revalidatePath("/admin/brain");
  redirect(`/admin/clusters/${d.clusterId}?saved=link`);
}

export async function unlinkFragmentFromClusterAction(formData: FormData) {
  const linkId = String(formData.get("linkId") ?? "");
  const clusterId = String(formData.get("clusterId") ?? "");
  if (!linkId || !clusterId) redirect("/admin/clusters?error=validation");
  try {
    await prisma.fragmentClusterLink.delete({ where: { id: linkId } });
  } catch {
    redirect(`/admin/clusters/${clusterId}?error=db`);
  }
  revalidatePath(`/admin/clusters/${clusterId}`);
  redirect(`/admin/clusters/${clusterId}?saved=unlink`);
}
