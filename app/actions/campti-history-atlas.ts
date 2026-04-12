"use server";

import {
  getCamptiCrossReferenceEvents,
  getCamptiHistoryAtlasSource,
  getCamptiResearchCrossRefSummary,
} from "@/lib/campti-history-atlas-queries";

/** Full atlas source + text/chunk counts for admin or assembly UI. */
export async function getCamptiHistoryAtlasBundleAction() {
  return getCamptiHistoryAtlasSource();
}

/** Events tied to atlas source + Campti-timeline ids (graph for cross-reference). */
export async function getCamptiCrossReferenceEventsAction() {
  return getCamptiCrossReferenceEvents();
}

/** One summary row: atlas source + census dataset counts + atlas event count. */
export async function getCamptiResearchCrossRefSummaryAction() {
  return getCamptiResearchCrossRefSummary();
}
