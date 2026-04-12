import { prisma } from "@/lib/prisma";

/** Use until `npx prisma generate` exposes cognition delegates on PrismaClient. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cognitionPrisma = prisma as any;
