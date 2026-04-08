"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ingestGuideNarrativeDnaForSource } from "@/lib/narrative-dna-ingest-runner";
import { prisma } from "@/lib/prisma";

const sourceIdSchema = z.object({
  sourceId: z.string().trim().min(1),
});

function revalidateNarrativeAdmin(sourceId: string) {
  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${sourceId}`);
  revalidatePath("/admin/narrative-rules");
  revalidatePath("/admin/themes");
  revalidatePath("/admin/symbols");
  revalidatePath("/admin/motifs");
  revalidatePath("/admin/literary-devices");
  revalidatePath("/admin/patterns");
  revalidatePath("/admin/bindings");
  revalidatePath("/admin/ingestion");
  revalidatePath(`/admin/ingestion/${sourceId}`);
}

/**
 * Replace prior DNA rows for this source (or run Section XIII internal path), extract, persist + emerges_from bindings.
 */
export async function extractNarrativeDNAAction(formData: FormData) {
  const parsed = sourceIdSchema.safeParse({ sourceId: formData.get("sourceId") });
  if (!parsed.success) {
    redirect("/admin/sources?error=validation");
  }
  const { sourceId } = parsed.data;

  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) redirect(`/admin/sources/${sourceId}?error=notfound`);

  const result = await ingestGuideNarrativeDnaForSource(sourceId);
  if (!result.ok) {
    redirect(`/admin/sources/${sourceId}?error=${encodeURIComponent(result.error)}`);
  }

  revalidateNarrativeAdmin(sourceId);
  redirect(`/admin/sources/${sourceId}?saved=dna_extracted`);
}

/** Explicit alias for guide ingestion workflows (same behavior as Extract narrative DNA). */
export async function ingestGuideNarrativeDnaAction(formData: FormData) {
  return extractNarrativeDNAAction(formData);
}
