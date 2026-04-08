"use server";

import { prisma } from "@/lib/prisma";
import { normalizeRawText } from "@/lib/ingestion-packet";
import { sourceTextUpdateSchema } from "@/lib/ingestion-validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveSourceText(formData: FormData) {
  const parsed = sourceTextUpdateSchema.safeParse({
    sourceId: formData.get("sourceId"),
    rawText: formData.get("rawText"),
    textNotes: formData.get("textNotes"),
    textStatus: formData.get("textStatus"),
  });

  if (!parsed.success) {
    const id = String(formData.get("sourceId") ?? "");
    redirect(
      id ? `/admin/sources/${id}?error=validation` : "/admin/sources?error=validation",
    );
  }

  const d = parsed.data;
  const raw = d.rawText ?? null;

  await prisma.sourceText.upsert({
    where: { sourceId: d.sourceId },
    create: {
      sourceId: d.sourceId,
      rawText: raw,
      textNotes: d.textNotes?.length ? d.textNotes : null,
      textStatus: d.textStatus ?? "imported",
    },
    update: {
      rawText: raw,
      textNotes: d.textNotes?.length ? d.textNotes : null,
      textStatus: d.textStatus ?? undefined,
    },
  });

  revalidatePath(`/admin/sources/${d.sourceId}`);
  redirect(`/admin/sources/${d.sourceId}?saved=text`);
}

export async function normalizeSourceTextAction(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "");
  if (!sourceId) redirect("/admin/sources?error=validation");

  const row = await prisma.sourceText.findUnique({ where: { sourceId } });
  const raw = row?.rawText ?? "";
  const normalized = normalizeRawText(raw);

  await prisma.sourceText.upsert({
    where: { sourceId },
    create: {
      sourceId,
      rawText: raw,
      normalizedText: normalized.length ? normalized : null,
      textStatus: "normalized",
    },
    update: {
      normalizedText: normalized.length ? normalized : null,
      textStatus: "normalized",
    },
  });

  revalidatePath(`/admin/sources/${sourceId}`);
  redirect(`/admin/sources/${sourceId}?saved=normalized`);
}
