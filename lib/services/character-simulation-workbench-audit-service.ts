import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CharacterSimulationAuditWriteInput = {
  personId: string;
  action: string;
  summary: string;
  actorNote?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
};

export async function appendCharacterSimulationAuditLog(input: CharacterSimulationAuditWriteInput): Promise<
  | { ok: true; id: string }
  | { ok: false; code: "migration_required" | "unknown"; message: string }
> {
  try {
    const row = await prisma.characterSimulationAuditLog.create({
      data: {
        personId: input.personId,
        action: input.action,
        summary: input.summary,
        actorNote: input.actorNote ?? null,
        beforeJson: input.beforeJson === undefined ? undefined : (input.beforeJson as Prisma.InputJsonValue),
        afterJson: input.afterJson === undefined ? undefined : (input.afterJson as Prisma.InputJsonValue),
      },
    });
    return { ok: true, id: row.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.code === "P2003")) {
      return {
        ok: false,
        code: "migration_required",
        message: "CharacterSimulationAuditLog table is not available on this database (migration not applied).",
      };
    }
    return { ok: false, code: "unknown", message: e instanceof Error ? e.message : String(e) };
  }
}

export async function listCharacterSimulationAuditLogs(input: {
  personId: string;
  take?: number;
}): Promise<
  | { ok: true; rows: Array<{ id: string; createdAt: Date; action: string; summary: string; actorNote: string | null }> }
  | { ok: false; code: "migration_required"; rows: [] }
> {
  const take = input.take ?? 40;
  try {
    const rows = await prisma.characterSimulationAuditLog.findMany({
      where: { personId: input.personId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, createdAt: true, action: true, summary: true, actorNote: true },
    });
    return { ok: true, rows };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
      return { ok: false, code: "migration_required", rows: [] };
    }
    throw e;
  }
}
