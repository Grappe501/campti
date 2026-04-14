/**
 * Typed persistence access for cognition / simulation domain tables.
 *
 * **Why the old path was unsafe**
 * `prisma as any` erased all delegate types, so every query (filters, includes, creates)
 * was unchecked at compile time — refactors could ship silent runtime failures.
 *
 * **What this module guarantees**
 * Call sites use a **narrow `Pick` of `PrismaClient`** containing only the delegates this
 * codebase actually touches for cognition/simulation flows. Those delegates keep full generated
 * Prisma types (`WhereInput`, `CreateInput`, results, etc.). No `any` is exported.
 *
 * **Adding delegates safely**
 * 1. Confirm the model exists in `prisma/schema.prisma` and `npx prisma generate` has run.
 * 2. Add the camelCase delegate name to `CognitionPersistenceDelegates`.
 * 3. Run `npm run typecheck` — Prisma will typecheck new calls at usage sites.
 *
 * **If something still fails to typecheck**
 * That indicates a schema/client mismatch (not fixed by `any`). Fix generation or the query;
 * do not widen this export back to `any`.
 */

import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Cognition/simulation-related delegates used by services today. Keep this list minimal.
 * Keys mirror `PrismaClient` delegate names (camelCase model accessors).
 */
export type CognitionPersistenceDelegates =
  | "characterCoreProfile"
  | "characterStateSnapshot"
  | "characterInnerVoiceSession"
  | "simulationScenario"
  | "simulationRun";

export type CognitionPersistenceClient = Pick<PrismaClient, CognitionPersistenceDelegates>;

/** Narrow, fully typed facade — same runtime object as `prisma`, restricted at the type level. */
export const cognitionPrisma: CognitionPersistenceClient = prisma;
