import type {
  GrappeLineageBranchMap,
  GrappeLineageFile,
  GrappeLineageInterpretation,
  GrappeLineagePerson,
  GrappeLineageWorldBuilding,
  LineageEntityType,
} from "./grappe-lineage-types";
import grappeLineageJson from "./grappe-lineage-working.v1.json";
import grappeWorldBuildingJson from "./grappe-world-building.v1.json";
import { getPersonIdForGrp } from "./grappe-seed-overlap";

const DATA = grappeLineageJson as GrappeLineageFile;
const WORLD_BUILDING = grappeWorldBuildingJson as GrappeLineageWorldBuilding;

export type {
  EvidenceGrade,
  GrappeLineageFile,
  GrappeLineageFormativeContext,
  GrappeLineageInterpretation,
  GrappeLineagePelagiePerotScaffold,
  GrappeLineagePerson,
  GrappeLineagePowerHousehold,
  GrappeLineageTruthPass,
  GrappeLineageWorldBuilding,
  GrappeLineageBranchMap,
  GrappeLineageWorldBuildingDocument,
  GrappeLineageWorldBuildingPocket,
  GrappeWorldBuildingSetting,
  GrappeWorldBuildingSpineEntry,
  LineageEntityType,
} from "./grappe-lineage-types";
export { getPersonIdForGrp, GRAPPE_GRP_TO_SEED_PERSON_ID } from "./grappe-seed-overlap";

export const GRAPPE_LINEAGE_FILE_VERSION = "v1";
export const GRAPPE_WORLD_BUILDING_FILE_VERSION = "v3";

export function getGrappeLineageWorking(): GrappeLineageFile {
  return DATA;
}

export function getGrappeLineageInterpretation(): GrappeLineageInterpretation | undefined {
  return DATA.interpretation;
}

/** Fiction / Campti setting layer (`grappe-world-building.v1.json`). */
export function getGrappeLineageWorldBuilding(): GrappeLineageWorldBuilding {
  return WORLD_BUILDING;
}

export function getGrappeWorldBuildingSetting() {
  return WORLD_BUILDING.setting;
}

/** Ordered spine: Grappés as characters vs Campti — use with `getGrappeLineagePersonById`. */
export function getGrappeNarrativeSpine() {
  return [...WORLD_BUILDING.grappe_narrative_spine].sort((a, b) => a.order - b.order);
}

export function getGrappeBranchMap(): GrappeLineageBranchMap | undefined {
  return WORLD_BUILDING.branch_map;
}

export function getGrappeLineagePersonById(id: string): GrappeLineagePerson | undefined {
  return DATA.people.find((p) => p.id === id);
}

export function getGrappeLineageByEntityType(entityType: LineageEntityType): GrappeLineagePerson[] {
  return DATA.people.filter((p) => p.entity_type === entityType);
}

/** Parents that exist in this file (skips missing ids). */
export function getResolvedParents(id: string): GrappeLineagePerson[] {
  const node = getGrappeLineagePersonById(id);
  if (!node) return [];
  return node.parents
    .map((pid) => getGrappeLineagePersonById(pid))
    .filter((p): p is GrappeLineagePerson => Boolean(p));
}

/** Children present in this file. */
export function getResolvedChildren(id: string): GrappeLineagePerson[] {
  const node = getGrappeLineagePersonById(id);
  if (!node) return [];
  return node.children
    .map((cid) => getGrappeLineagePersonById(cid))
    .filter((p): p is GrappeLineagePerson => Boolean(p));
}

/** Walk upward until no parents (for narrative / simulation roots). */
export function getAncestryChainToRoots(id: string): GrappeLineagePerson[][] {
  const layers: GrappeLineagePerson[][] = [];
  let frontier: string[] = [id];
  const seen = new Set<string>();
  while (frontier.length) {
    const layer: GrappeLineagePerson[] = [];
    const next: string[] = [];
    for (const fid of frontier) {
      if (seen.has(fid)) continue;
      seen.add(fid);
      const p = getGrappeLineagePersonById(fid);
      if (!p) continue;
      layer.push(p);
      next.push(...p.parents);
    }
    if (layer.length) layers.push(layer);
    frontier = next.filter((x) => !seen.has(x));
  }
  return layers;
}
