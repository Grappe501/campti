/** Stable ids for the Campti parish/town history atlas (cross-reference spine). */
export const CAMPTI_HISTORY_ATLAS_SOURCE_ID = "source-campti-history-atlas";
export const CAMPTI_SEED_PLACE_ID = "seed-place-campti";

/** Re-export for prompts that join census OCR + narrative history. */
export { CAMPTI_CENSUS_DATASET_ID } from "./census-research";

export const CAMPTI_ATLAS_EVENT_IDS = {
  caddoTrade: "campti-atlas-ev-caddo-red-river-trade",
  frenchPosts: "campti-atlas-ev-french-spanish-red-river-posts",
  nameCampti: "campti-atlas-ev-name-from-chief-campti",
  greatRaft: "campti-atlas-ev-great-raft-and-shreve-clearing",
  antebellum: "campti-atlas-ev-antebellum-plantation-labor",
  burning1864: "campti-atlas-ev-1864-red-river-campaign-burning",
  demographics: "campti-atlas-ev-population-census-arc",
  jimCrowState: "campti-atlas-ev-jim-crow-louisiana-order",
  schools: "campti-atlas-ev-schools-npsb-lakeview-fairview",
  economyForest: "campti-atlas-ev-forest-products-employment",
  mill2025: "campti-atlas-ev-paper-mill-shock-2025",
  tribalHq: "campti-atlas-ev-natchitoches-tribe-hq-campti",
  civilRights: "campti-atlas-ev-civil-rights-desegregation-era",
  freePeopleColor: "campti-atlas-ev-free-people-of-color-antebellum",
} as const;
