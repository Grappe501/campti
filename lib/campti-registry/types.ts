/**
 * Campti Deterministic Story Engine — master registry catalog (metadata).
 * These are planning / navigation surfaces; new Prisma tables land incrementally per build phase.
 */

export type RegistryImplementationStatus = "live" | "partial" | "planned";

export type RegistrySurface = {
  label: string;
  /** Admin path or external anchor */
  href?: string;
  /** Prisma model name when it exists */
  prismaModel?: string;
  note?: string;
};

export type CamptiMasterRegistry = {
  /** URL slug and stable id */
  id: string;
  ordinal: number;
  title: string;
  /** One-line purpose for the hub */
  tagline: string;
  /** Author-facing description (simulation / governance, not marketing) */
  description: string;
  /** Layer name for grouping in UI */
  layer: string;
  /** 1 = foundation first */
  buildPhase: number;
  /** Order within phase for migrations and Cursor tasks */
  buildOrderInPhase: number;
  /** What this registry governs in the deterministic field */
  governs: string[];
  /** How AI generation must behave relative to this registry */
  aiContract: string;
  /** Existing admin or schema surfaces */
  implementedSurfaces: RegistrySurface[];
  implementationStatus: RegistryImplementationStatus;
  /** Suggested next Prisma / admin work (no DB created until you run migrations) */
  nextBuildNotes: string;
};
