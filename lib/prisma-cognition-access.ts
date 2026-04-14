import { prisma } from "@/lib/prisma";

/** Use until `npx prisma generate` exposes cognition delegates on PrismaClient. */
export const cognitionPrisma = prisma as any;
