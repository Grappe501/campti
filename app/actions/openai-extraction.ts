"use server";

import {
  runOpenAIExtractionForSource,
  runOpenAIExtractionFromPacket,
} from "@/lib/openai-extraction";
import { ingestionSourceIdSchema } from "@/lib/ingestion-validation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const packetIdSchema = z.object({
  packetId: z.string().trim().min(1),
});

function revalidateIngestion(sourceId: string) {
  revalidatePath("/admin/ingestion");
  revalidatePath(`/admin/ingestion/${sourceId}`);
  revalidatePath(`/admin/sources/${sourceId}`);
  revalidatePath("/admin/runs");
  revalidatePath("/admin/extracted");
}

export async function runRealExtractionAction(formData: FormData) {
  const parsed = ingestionSourceIdSchema.safeParse({
    sourceId: formData.get("sourceId"),
  });
  if (!parsed.success) {
    redirect("/admin/ingestion?error=validation");
  }

  const sourceId = parsed.data.sourceId;
  const outcome = await runOpenAIExtractionForSource(sourceId);

  if (!outcome.ok) {
    const code = outcome.code ?? "unknown";
    redirect(`/admin/ingestion/${sourceId}?error=${encodeURIComponent(code)}`);
  }

  revalidateIngestion(sourceId);
  redirect(
    `/admin/ingestion/${sourceId}?saved=ai_ok&run=${encodeURIComponent(outcome.runId)}`,
  );
}

/** Same pipeline as a fresh run (new IngestionRun + packet each time). */
export async function rerunExtractionAction(formData: FormData) {
  return runRealExtractionAction(formData);
}

export async function runRealExtractionFromPacketAction(formData: FormData) {
  const parsed = packetIdSchema.safeParse({
    packetId: formData.get("packetId"),
  });
  if (!parsed.success) {
    redirect("/admin/ingestion?error=validation");
  }

  const outcome = await runOpenAIExtractionFromPacket(parsed.data.packetId);

  if (!outcome.ok) {
    const sid = outcome.sourceId ?? "";
    if (sid) {
      redirect(`/admin/ingestion/${sid}?error=${encodeURIComponent(outcome.code)}`);
    }
    redirect(`/admin/ingestion?error=${encodeURIComponent(outcome.code)}`);
  }

  revalidateIngestion(outcome.sourceId);
  redirect(
    `/admin/ingestion/${outcome.sourceId}?saved=ai_ok&run=${encodeURIComponent(outcome.runId)}`,
  );
}
