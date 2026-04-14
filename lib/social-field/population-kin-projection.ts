/**
 * Phase 5F.1 — Derive kin clusters from population rows + optional Person genealogy (no new tables).
 */

import type { GenealogicalPredicate } from "@prisma/client";

import type { PopulationKinCluster, PopulationKinEdge } from "@/lib/domain/population-social-field";
import { prisma } from "@/lib/prisma";
import { primaryFamilyTokenFromDisplayName } from "@/lib/population/population-name-normalize";

const KIN_PREDICATES: GenealogicalPredicate[] = ["FATHER_ID", "MOTHER_ID", "UNION_SPOUSE_ID"];

function personIdFromAssertionValue(valueJson: unknown): string | null {
  if (!valueJson || typeof valueJson !== "object") return null;
  const o = valueJson as Record<string, unknown>;
  if (o.kind !== "person_ref") return null;
  const id = o.personId;
  return typeof id === "string" && id.length ? id : null;
}

export async function loadGenealogicalKinEdgesForPerson(
  personId: string,
  focalPopulationEntityId: string | null
): Promise<PopulationKinEdge[]> {
  const slots = await prisma.genealogicalFactSlot.findMany({
    where: {
      subjectType: "Person",
      subjectId: personId,
      predicate: { in: KIN_PREDICATES },
    },
    include: {
      assertions: {
        where: { status: "ACTIVE" },
        orderBy: { narrativePreferred: "desc" },
        take: 1,
      },
    },
  });

  const edges: PopulationKinEdge[] = [];
  for (const slot of slots) {
    const a = slot.assertions[0];
    if (!a) continue;
    const pid = personIdFromAssertionValue(a.valueJson);
    if (!pid) continue;
    const kind: PopulationKinEdge["kind"] =
      slot.predicate === "FATHER_ID" || slot.predicate === "MOTHER_ID"
        ? "genealogical_parent"
        : "genealogical_spouse";
    edges.push({
      kind,
      fromPersonId: personId,
      fromPopulationEntityId: focalPopulationEntityId,
      toPersonId: pid,
      toPopulationEntityId: null,
      confidence: 0.92,
    });
  }

  if (!edges.length) return edges;

  const linked = await prisma.populationEntity.findMany({
    where: { personId: { in: edges.map((e) => e.toPersonId!).filter(Boolean) } },
    select: { id: true, personId: true },
  });
  const personToPop = new Map(linked.map((r) => [r.personId!, r.id]));

  return edges.map((e) => ({
    ...e,
    toPopulationEntityId: e.toPersonId ? (personToPop.get(e.toPersonId) ?? null) : null,
  }));
}

export function buildGenealogicalKinCluster(
  focalPopulationEntityId: string | null,
  personId: string,
  edges: PopulationKinEdge[]
): PopulationKinCluster | null {
  const ids = new Set<string>();
  if (focalPopulationEntityId) ids.add(focalPopulationEntityId);
  for (const e of edges) {
    if (e.toPopulationEntityId) ids.add(e.toPopulationEntityId);
  }
  if (ids.size < 2) return null;
  return {
    id: `genealogical:${personId}`,
    kind: "genealogical",
    memberEntityIds: [...ids],
    label: "genealogical links",
  };
}

export async function buildHouseholdKinCluster(
  householdId: string | null,
  label: string | null
): Promise<PopulationKinCluster | null> {
  if (!householdId) return null;
  const members = await prisma.populationEntity.findMany({
    where: { householdId },
    select: { id: true },
    take: 80,
    orderBy: { id: "asc" },
  });
  if (!members.length) return null;
  return {
    id: `household:${householdId}`,
    kind: "household",
    memberEntityIds: members.map((m) => m.id),
    label: label ?? null,
  };
}

export async function buildSurnameInferenceCluster(input: {
  worldStateReferenceId: string | null;
  primaryLocationId: string | null;
  focalDisplayName: string;
}): Promise<PopulationKinCluster | null> {
  const token = primaryFamilyTokenFromDisplayName(input.focalDisplayName);
  if (!token || token.length < 3 || !input.primaryLocationId) return null;

  const ws = input.worldStateReferenceId
    ? { worldStateReferenceId: input.worldStateReferenceId }
    : {};

  const rows = await prisma.populationEntity.findMany({
    where: {
      ...ws,
      primaryLocationId: input.primaryLocationId,
      normalizedName: { endsWith: token },
    },
    select: { id: true },
    take: 48,
    orderBy: { id: "asc" },
  });

  if (rows.length < 2) return null;

  return {
    id: `surname:${input.primaryLocationId}:${token}`,
    kind: "surname_inference",
    memberEntityIds: rows.map((r) => r.id),
    label: `surname ~${token}`,
  };
}
