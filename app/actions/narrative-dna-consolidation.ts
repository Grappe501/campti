"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  autoRebindNarrativeDnaToWorld,
  consolidateNarrativeDnaForSources,
  mergeNarrativeDnaDuplicatesActionImpl,
} from "@/lib/narrative-dna-consolidation";
import { NARRATIVE_DNA_GUIDE_SOURCE_IDS } from "@/lib/narrative-dna-guide-constants";
function revAll() {
  revalidatePath("/admin/sources");
  revalidatePath("/admin/narrative-rules");
  revalidatePath("/admin/themes");
  revalidatePath("/admin/symbols");
  revalidatePath("/admin/motifs");
  revalidatePath("/admin/literary-devices");
  revalidatePath("/admin/patterns");
  revalidatePath("/admin/bindings");
}

function revAllDnaDetailPaths() {
  revAll();
  revalidatePath("/read/chapters");
  revalidatePath("/read/places");
  revalidatePath("/read/symbols");
}

const mergeSchema = z.object({
  canonicalId: z.string().trim().min(1),
  duplicateId: z.string().trim().min(1),
  type: z.enum([
    "symbol",
    "theme",
    "motif",
    "narrative_rule",
    "literary_device",
    "narrative_pattern",
  ]),
});

export async function consolidateGuideNarrativeDnaAction(formData: FormData) {
  const raw = String(formData.get("sourceIdsJson") ?? "").trim();
  let sourceIds: string[] = [...NARRATIVE_DNA_GUIDE_SOURCE_IDS];
  if (raw) {
    try {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
        sourceIds = arr as string[];
      }
    } catch {
      redirect("/admin/sources?error=invalid_source_ids_json");
    }
  }

  await consolidateNarrativeDnaForSources(sourceIds);
  revAllDnaDetailPaths();
  const id = String(formData.get("returnSourceId") ?? "").trim();
  if (id) {
    revalidatePath(`/admin/sources/${id}`);
    redirect(`/admin/sources/${id}?saved=consolidated`);
  }
  redirect("/admin/sources?saved=consolidated");
}

export async function rebindNarrativeDnaAction(formData: FormData) {
  await autoRebindNarrativeDnaToWorld();
  revAllDnaDetailPaths();
  const id = String(formData.get("returnSourceId") ?? "").trim();
  if (id) {
    revalidatePath(`/admin/sources/${id}`);
    redirect(`/admin/sources/${id}?saved=rebound`);
  }
  redirect("/admin/sources?saved=rebound");
}

export async function mergeNarrativeDnaDuplicatesAction(formData: FormData) {
  const parsed = mergeSchema.safeParse({
    canonicalId: formData.get("canonicalId"),
    duplicateId: formData.get("duplicateId"),
    type: formData.get("type"),
  });
  if (!parsed.success) redirect("/admin/bindings?error=validation");

  const r = await mergeNarrativeDnaDuplicatesActionImpl(
    parsed.data.canonicalId,
    parsed.data.duplicateId,
    parsed.data.type,
  );
  if (!r.ok) {
    redirect(`/admin/bindings?error=${encodeURIComponent(r.error)}`);
  }
  revAllDnaDetailPaths();
  redirect("/admin/bindings?saved=merged");
}
