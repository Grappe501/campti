import { prisma } from "@/lib/prisma";

/**
 * Integration hooks (deferred implementation):
 * - Character Engine: CharacterState.worldStateId + JSON snapshots align with PlaceState + RiskRegime via lib/character-world-constraints + getPlaceFullEnvironmentBundle.
 * - Scene Engine: scene legality will consult accessProfile, transportProfile, riskLevel on PlaceState and NodeConnection travelRisk.
 * - Branch Engine: resolveMovementOptions / evaluateNodeAccess consume this graph; event weights follow corridor + worldStateId.
 * - World State Engine: WorldStateReference.eraId ties master timeline rows to PlaceState / NodeConnection without replacing per-place behavior.
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getPlaceEnvironmentProfile(placeId: string) {
  return safe(
    () => prisma.placeEnvironmentProfile.findUnique({ where: { placeId } }),
    null,
  );
}

export async function getPlaceStates(placeId: string) {
  return safe(
    () =>
      prisma.placeState.findMany({
        where: { placeId },
        orderBy: { updatedAt: "desc" },
        include: { worldState: true },
      }),
    [],
  );
}

export async function getEnvironmentNodes() {
  return safe(
    () =>
      prisma.environmentNode.findMany({
        orderBy: [{ placeId: "asc" }, { key: "asc" }],
        include: { place: { select: { id: true, name: true } } },
      }),
    [],
  );
}

export async function getEnvironmentNodeByKey(key: string) {
  return safe(
    () =>
      prisma.environmentNode.findUnique({
        where: { key },
        include: { place: true },
      }),
    null,
  );
}

export async function getNodeConnections(nodeId: string) {
  return safe(
    () =>
      prisma.nodeConnection.findMany({
        where: { OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }] },
        include: {
          fromNode: { select: { id: true, key: true, label: true } },
          toNode: { select: { id: true, key: true, label: true } },
        },
      }),
    [],
  );
}

export async function getRiskRegimes() {
  return safe(
    () => prisma.riskRegime.findMany({ orderBy: { key: "asc" } }),
    [],
  );
}

export async function getPlaceMemoryProfiles(placeId: string) {
  return safe(
    () =>
      prisma.placeMemoryProfile.findMany({
        where: { placeId },
        orderBy: { updatedAt: "desc" },
        include: { worldState: true },
      }),
    [],
  );
}

/** Future: gate access by world-state + conditions (branch engine). */
export function evaluateNodeAccess(
  _nodeId: string,
  _worldStateId: string | null,
  _conditions: unknown,
): { stub: true } {
  return { stub: true };
}

/** Future: river stage / flood cycle hooks for Red River simulation. */
export function evaluateRiverConditions(_worldStateId: string, _season: string | null): { stub: true } {
  return { stub: true };
}

/** Future: aggregate PlaceState + RiskRegime + node exposure. */
export function evaluatePlaceRisk(_placeId: string, _worldStateId: string | null): { stub: true } {
  return { stub: true };
}

/** Future: graph expansion for movement / corridor options. */
export function resolveMovementOptions(_fromNodeId: string, _worldStateId: string | null): { stub: true } {
  return { stub: true };
}
