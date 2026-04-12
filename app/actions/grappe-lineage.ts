"use server";

import {
  getAncestryChainToRoots,
  getGrappeLineageByEntityType,
  getGrappeLineageInterpretation,
  getGrappeLineagePersonById,
  getGrappeLineageWorldBuilding,
  getGrappeLineageWorking,
  getGrappeBranchMap,
  getGrappeNarrativeSpine,
  getGrappeWorldBuildingSetting,
  getResolvedChildren,
  getResolvedParents,
} from "@/lib/lineage";
import { prisma } from "@/lib/prisma";

export async function getGrappeLineageWorkingAction() {
  return getGrappeLineageWorking();
}

export async function getGrappeLineageInterpretationAction() {
  return getGrappeLineageInterpretation() ?? null;
}

export async function getGrappeLineageWorldBuildingAction() {
  return getGrappeLineageWorldBuilding();
}

export async function getGrappeWorldBuildingSettingAction() {
  return getGrappeWorldBuildingSetting();
}

export async function getGrappeNarrativeSpineAction() {
  return getGrappeNarrativeSpine();
}

export async function getGrappeBranchMapAction() {
  return getGrappeBranchMap() ?? null;
}

export async function getGrappeLineagePersonAction(id: string) {
  return getGrappeLineagePersonById(id) ?? null;
}

export async function getGrappeLineageByEntityTypeAction(entityType: "person" | "lineage_cluster") {
  return getGrappeLineageByEntityType(entityType);
}

export async function getGrappeLineageResolvedParentsAction(id: string) {
  return getResolvedParents(id);
}

export async function getGrappeLineageResolvedChildrenAction(id: string) {
  return getResolvedChildren(id);
}

export async function getGrappeAncestryChainAction(id: string) {
  return getAncestryChainToRoots(id);
}

/** DB `Person` row after wiring (`lineageWorkingId` = GRP id). */
export async function getPersonByLineageWorkingIdAction(grpId: string) {
  return prisma.person.findFirst({
    where: { lineageWorkingId: grpId },
    select: {
      id: true,
      name: true,
      birthYear: true,
      deathYear: true,
      lineageWorkingId: true,
      recordType: true,
    },
  });
}
