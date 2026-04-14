"use server";

import type { PopulationIngestRow } from "@/lib/services/population-ingest-service";
import { ingestPopulationRows } from "@/lib/services/population-ingest-service";
import {
  buildPopulationPromotionPlan,
  linkPopulationEntityToExistingPerson,
  promotePopulationEntityToPerson,
} from "@/lib/services/population-promotion-service";
import { buildSocialFieldContextFromQuery } from "@/lib/services/social-field-context-service";
import type { SocialFieldQuery } from "@/lib/domain/population-social-field";

export async function actionIngestPopulationRows(
  rows: PopulationIngestRow[],
  options?: { worldStateReferenceId?: string | null }
) {
  return ingestPopulationRows(rows, options);
}

export async function actionBuildSocialFieldContext(query: SocialFieldQuery) {
  return buildSocialFieldContextFromQuery(query);
}

export async function actionPromotePopulationEntity(populationEntityId: string) {
  return promotePopulationEntityToPerson(populationEntityId);
}

export async function actionLinkPopulationEntityToPerson(
  populationEntityId: string,
  personId: string
) {
  return linkPopulationEntityToExistingPerson(populationEntityId, personId);
}

export async function actionBuildPopulationPromotionPlan(populationEntityId: string) {
  return buildPopulationPromotionPlan(populationEntityId);
}
