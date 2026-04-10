/**
 * Ontology & registry spine (Stage 2).
 *
 * Future attachment (no join tables in this stage):
 * - Character / Person rows conceptually align with OntologyType.key = "person".
 * - Place / environment use RegistryValue family ENVIRONMENT for categories.
 * - Relationship edges use RegistryValue family RELATIONSHIP.
 * - Symbol / Motif use RegistryValue family SYMBOLIC (existing SymbolCategory enum remains until a later migration).
 * - Source / claim / story bindings: NarrativePermissionProfile keys align with RegistryValue PERMISSION family + ConstitutionalRule.narrativePermission string.
 * - Scene engine: SceneReadinessProfile + RegistryValue READINESS family.
 * - Branch engine: RegistryValue BRANCH family.
 *
 * ConstitutionalRule.config may store `{ "ontologyKey": "...", "registryKeys": ["..."] }` — keep keys matching OntologyType.key / RegistryValue.key.
 */

import type {
  ConfidenceProfile,
  NarrativePermissionProfile,
  SceneReadinessProfile,
} from "@prisma/client";
import { prisma as db } from "@/lib/prisma";
import type { OntologyAdminFilters, RegistryValueAdminFilters } from "@/lib/ontology-types";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getOntologyTypes(filters?: OntologyAdminFilters) {
  return safe(
    () =>
      db.ontologyType.findMany({
        where: filters?.family ? { family: filters.family } : undefined,
        orderBy: [{ family: "asc" }, { key: "asc" }],
      }),
    [],
  );
}

export async function getOntologyTypeByKey(key: string) {
  return safe(() => db.ontologyType.findUnique({ where: { key } }), null);
}

export async function getRegistryValues(filters?: RegistryValueAdminFilters) {
  return safe(
    () =>
      db.registryValue.findMany({
        where: {
          ...(filters?.family ? { family: filters.family } : {}),
          ...(filters?.registryType ? { registryType: filters.registryType } : {}),
        },
        orderBy: [{ family: "asc" }, { sortOrder: "asc" }, { key: "asc" }],
      }),
    [],
  );
}

export async function getNarrativePermissionProfiles() {
  return safe(
    () =>
      db.narrativePermissionProfile.findMany({
        orderBy: { key: "asc" },
      }),
    [],
  );
}

export async function getConfidenceProfiles() {
  return safe(
    () =>
      db.confidenceProfile.findMany({
        orderBy: { numericValue: "asc" },
      }),
    [],
  );
}

export async function getSceneReadinessProfiles() {
  return safe(
    () =>
      db.sceneReadinessProfile.findMany({
        orderBy: { key: "asc" },
      }),
    [],
  );
}

/** Resolve permission profile by key; returns null if missing or DB down. */
export async function resolveNarrativePermission(key: string): Promise<NarrativePermissionProfile | null> {
  return safe(() => db.narrativePermissionProfile.findUnique({ where: { key } }), null);
}

/** Resolve confidence profile by key or numeric rank. */
export async function resolveConfidenceProfile(valueOrKey: string | number): Promise<ConfidenceProfile | null> {
  if (typeof valueOrKey === "number") {
    return safe(
      () =>
        db.confidenceProfile.findFirst({
          where: { numericValue: valueOrKey, isActive: true },
        }),
      null,
    );
  }
  return safe(() => db.confidenceProfile.findUnique({ where: { key: valueOrKey } }), null);
}

/** Resolve scene readiness by key. */
export async function resolveSceneReadiness(key: string): Promise<SceneReadinessProfile | null> {
  return safe(() => db.sceneReadinessProfile.findUnique({ where: { key } }), null);
}
